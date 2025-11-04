import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { getDb } from './db/mongo.js';

console.log({
  USING_MONGO_URI: process.env.MONGO_URI,
  USING_MONGO_DB: process.env.MONGO_DB,
  USERS_COLL: process.env.MONGO_USERS_COLLECTION || 'users'
});

const PORT = process.env.AUTH_PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5174';
const AUTH_SECRET = process.env.AUTH_SECRET || 'dev-secret';
const TOKEN_TTL_DAYS = Number(process.env.TOKEN_TTL_DAYS || 7);

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));

// ---- Mongo "DB"
let usersColl = null;
let ready = (async () => {
  const db = await getDb();
  usersColl = db.collection(process.env.MONGO_USERS_COLLECTION || 'users');

  // Helpful index (unique emails)
  try {
    await usersColl.createIndex({ email: 1 }, { unique: true });
  } catch (e) {
    console.warn('Index creation warning:', e?.message);
  }
})();
function ensureReady(req, res, next) {
  if (usersColl) return next();
  ready.then(() => next()).catch(err => {
    console.error('Failed to connect to Mongo:', err);
    res.status(500).json({ error: 'Database connection failed' });
  });
}

// ---- Password hashing (PBKDF2)
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  const cand = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(cand, 'hex'));
}

// ---- Tiny JWT-like token (HMAC)
const b64u = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
function signToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = { ...payload, exp: Math.floor(Date.now()/1000) + TOKEN_TTL_DAYS*24*3600 };
  const data = `${b64u(header)}.${b64u(body)}`;
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64').replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
  return `${data}.${sig}`;
}
function verifyToken(token) {
  if (!token || token.split('.').length !== 3) return null;
  const [h,p,s] = token.split('.');
  const expected = crypto.createHmac('sha256', AUTH_SECRET).update(`${h}.${p}`).digest('base64').replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
  if (!crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(p.replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8'));
  if (payload.exp && payload.exp < Math.floor(Date.now()/1000)) return null;
  return payload;
}

// ---- Helpers
const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).toLowerCase());
const minLen = (s,n) => typeof s === 'string' && s.trim().length >= n;
const publicUser = (doc) => ({
  id: (doc._id ? String(doc._id) : doc.id), // support legacy shape
  email: doc.email,
  name: doc.name,
  avatarUrl: doc.avatarUrl || ''
});

function setAuthCookie(res, userId) {
  const token = signToken({ sub: userId });
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: TOKEN_TTL_DAYS*24*60*60*1000
  });
  return token;
}

function requireAuth(req, res, next) {
  const token = req.cookies?.token || (req.headers.authorization?.split(' ')[1]);
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });
  req.userId = payload.sub;
  next();
}

// ---- Routes
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Create account
app.post('/api/auth/register', ensureReady, async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!validateEmail(email)) return res.status(400).json({ error: 'Invalid email' });
    if (!minLen(password, 6)) return res.status(400).json({ error: 'Password must be at least 6 chars' });
    if (!minLen(name, 2)) return res.status(400).json({ error: 'Name required' });

    const doc = {
      email: String(email).toLowerCase(),
      passwordHash: hashPassword(password),
      name: String(name).trim(),
      avatarUrl: ''
    };

    const result = await usersColl.insertOne(doc); // throws if email duplicate due to index
    const _id = result.insertedId;
    setAuthCookie(res, String(_id));
    res.status(201).json({ user: publicUser({ _id, ...doc }) });
  } catch (err) {
    // Handle duplicate email nicely
    if (err?.code === 11000) return res.status(409).json({ error: 'Email already registered' });
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Login
app.post('/api/auth/login', ensureReady, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await usersColl.findOne({ email: String(email).toLowerCase() });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    setAuthCookie(res, String(user._id));
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Logout
app.post('/api/auth/logout', (_req, res) => { res.clearCookie('token'); res.json({ ok: true }); });

// Current user
app.get('/api/users/me', ensureReady, requireAuth, async (req, res) => {
  try {
    const user = await usersColl.findOne(
      { _id: new ObjectId(req.userId) },
      { projection: { passwordHash: 0 } }
    );
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Update current user
app.patch('/api/users/me', ensureReady, requireAuth, async (req, res) => {
  try {
    const { name, avatarUrl, password } = req.body || {};
    const update = { $set: {} };

    if (name !== undefined) {
      if (!minLen(name, 2)) return res.status(400).json({ error: 'Name must be at least 2 chars' });
      update.$set.name = String(name).trim();
    }
    if (avatarUrl !== undefined) update.$set.avatarUrl = String(avatarUrl || '');
    if (password) {
      if (!minLen(password, 6)) return res.status(400).json({ error: 'Password must be at least 6 chars' });
      update.$set.passwordHash = hashPassword(password);
    }

    if (Object.keys(update.$set).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { value } = await usersColl.findOneAndUpdate(
      { _id: new ObjectId(req.userId) },
      update,
      { returnDocument: 'after', projection: { passwordHash: 0 } }
    );
    if (!value) return res.status(401).json({ error: 'Unauthorized' });
    res.json({ user: publicUser(value) });
  } catch (err) {
    console.error('Patch me error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Delete account
app.delete('/api/users/me', ensureReady, requireAuth, async (req, res) => {
  try {
    await usersColl.deleteOne({ _id: new ObjectId(req.userId) });
    res.clearCookie('token');
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete me error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

app.listen(PORT, () => {
  console.log(` Auth API: http://localhost:${PORT}`);
  console.log(`   CORS origin: ${CLIENT_ORIGIN}`);
});
