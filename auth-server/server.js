import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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

// ---- File "DB"
const DB_DIR = path.join(process.cwd(), 'auth-server', 'db');
const USERS_FILE = path.join(DB_DIR, 'users.json');
fs.mkdirSync(DB_DIR, { recursive: true });
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');

const readUsers = () => {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); }
  catch { return []; }
};
const writeUsers = (u) => fs.writeFileSync(USERS_FILE, JSON.stringify(u, null, 2));

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
const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name, avatarUrl: u.avatarUrl || '' });

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

app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body || {};
  if (!validateEmail(email)) return res.status(400).json({ error: 'Invalid email' });
  if (!minLen(password, 6)) return res.status(400).json({ error: 'Password must be at least 6 chars' });
  if (!minLen(name, 2)) return res.status(400).json({ error: 'Name required' });

  const users = readUsers();
  if (users.some(u => u.email.toLowerCase() === String(email).toLowerCase())) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const id = crypto.randomUUID();
  const u = { id, email, passwordHash: hashPassword(password), name, avatarUrl: '' };
  users.push(u); writeUsers(users);
  setAuthCookie(res, id);
  res.status(201).json({ user: publicUser(u) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const users = readUsers();
  const u = users.find(x => x.email.toLowerCase() === String(email).toLowerCase());
  if (!u || !verifyPassword(password, u.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  setAuthCookie(res, u.id);
  res.json({ user: publicUser(u) });
});

app.post('/api/auth/logout', (_req, res) => { res.clearCookie('token'); res.json({ ok: true }); });

app.get('/api/users/me', requireAuth, (req, res) => {
  const u = readUsers().find(x => x.id === req.userId);
  if (!u) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ user: publicUser(u) });
});

app.patch('/api/users/me', requireAuth, (req, res) => {
  const { name, avatarUrl, password } = req.body || {};
  const users = readUsers();
  const i = users.findIndex(x => x.id === req.userId);
  if (i === -1) return res.status(401).json({ error: 'Unauthorized' });

  if (name !== undefined) {
    if (!minLen(name, 2)) return res.status(400).json({ error: 'Name must be at least 2 chars' });
    users[i].name = String(name).trim();
  }
  if (avatarUrl !== undefined) users[i].avatarUrl = String(avatarUrl || '');
  if (password) {
    if (!minLen(password, 6)) return res.status(400).json({ error: 'Password must be at least 6 chars' });
    users[i].passwordHash = hashPassword(password);
  }
  writeUsers(users);
  res.json({ user: publicUser(users[i]) });
});

app.delete('/api/users/me', requireAuth, (req, res) => {
  const left = readUsers().filter(u => u.id !== req.userId);
  writeUsers(left);
  res.clearCookie('token');
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(` Auth API: http://localhost:${PORT}`);
  console.log(`   CORS origin: ${CLIENT_ORIGIN}`);
});
