import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const {
  AUTH_PORT = process.env.PORT || 4000,
  MONGO_URI = "mongodb://localhost:27017",
  MONGO_DB = "tripTracker",
  AUTH_SECRET = "change-me-to-a-long-random-string",
  NODE_ENV = "development",
} = process.env;

const app = express();
app.use(express.json());
app.use(cookieParser());

// Log requests
app.use((req, _res, next) => {
  console.log(new Date().toISOString(), req.method, req.path);
  next();
});

// Allow client to call /api/* by stripping the /api prefix
app.use((req, _res, next) => {
  if (req.path.startsWith("/api/")) {
    req.url = req.url.replace(/^\/api/, "");
  }
  next();
});

// No-store
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

const client = new MongoClient(MONGO_URI);
let db, users;

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax",
  secure: NODE_ENV === "production",
  path: "/",
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

function safeUser(doc) {
  if (!doc) return null;
  return { _id: String(doc._id), name: doc.name, email: doc.email };
}

function sign(payload) {
  return jwt.sign(payload, AUTH_SECRET, { expiresIn: "7d" });
}

function authRequired(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: "Not authenticated" });
  try {
    req.auth = jwt.verify(token, AUTH_SECRET);
    return next();
  } catch {
    res.clearCookie("token", { ...cookieOpts, maxAge: 0 });
    return res.status(401).json({ message: "Session expired. Please sign in again." });
  }
}

app.get("/health", (_req, res) => res.json({ ok: true }));

// -------- AUTH --------
app.post("/auth/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password || password.length < 6) {
    return res.status(400).json({ message: "Invalid input" });
  }
  const emailNorm = String(email).trim().toLowerCase();
  const exists = await users.findOne({ email: emailNorm });
  if (exists) return res.status(409).json({ message: "Email already registered" });

  const pass = await bcrypt.hash(password, 10);
  const doc = {
    name: String(name).trim(),
    email: emailNorm,
    pass,
    visitedStates: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const r = await users.insertOne(doc);
  const user = { _id: r.insertedId, name: doc.name, email: doc.email };
  const token = sign({ uid: String(user._id), email: user.email });
  res.cookie("token", token, cookieOpts);
  return res.status(201).json({ user });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "Invalid input" });

  const emailNorm = String(email).trim().toLowerCase();
  const u = await users.findOne({ email: emailNorm });
  if (!u || !(await bcrypt.compare(password, u.pass))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const user = { _id: u._id, name: u.name, email: u.email };
  const token = sign({ uid: String(u._id), email: u.email });
  res.cookie("token", token, cookieOpts);
  return res.json({ user });
});

app.post("/auth/logout", (_req, res) => {
  res.clearCookie("token", { ...cookieOpts, maxAge: 0 });
  return res.json({ ok: true });
});

// -------- USERS --------
app.get("/users/me", authRequired, async (req, res) => {
  const uid = req.auth.uid;
  try {
    if (!/^[a-f0-9]{24}$/i.test(uid)) {
      res.clearCookie("token", { ...cookieOpts, maxAge: 0 });
      return res.status(401).json({ message: "Session expired. Please sign in again." });
    }
    const u = await users.findOne({ _id: new ObjectId(uid) }, { projection: { pass: 0 } });
    if (!u) {
      res.clearCookie("token", { ...cookieOpts, maxAge: 0 });
      return res.status(401).json({ message: "Session expired. Please sign in again." });
    }
    return res.json({ user: { _id: u._id, name: u.name, email: u.email } });
  } catch {
    res.clearCookie("token", { ...cookieOpts, maxAge: 0 });
    return res.status(401).json({ message: "Session expired. Please sign in again." });
  }
});

app.patch("/users/me", authRequired, async (req, res) => {
  const uid = req.auth.uid;

  if (!/^[a-f0-9]{24}$/i.test(uid)) {
    res.clearCookie("token", { ...cookieOpts, maxAge: 0 });
    return res.status(401).json({ message: "Session expired. Please sign in again." });
  }

  const current = await users.findOne({ _id: new ObjectId(uid) });
  if (!current) {
    res.clearCookie("token", { ...cookieOpts, maxAge: 0 });
    return res.status(401).json({ message: "Session expired. Please sign in again." });
  }

  const patch = {};
  if (typeof req.body?.name === "string") {
    const newName = req.body.name.trim();
    if (newName && newName !== current.name) patch.name = newName;
  }
  if (typeof req.body?.email === "string") {
    const newEmail = req.body.email.trim().toLowerCase();
    if (newEmail && newEmail !== current.email) {
      const clash = await users.findOne({ email: newEmail, _id: { $ne: current._id } });
      if (clash) return res.status(409).json({ message: "Email already in use" });
      patch.email = newEmail;
    }
  }

  if (!Object.keys(patch).length) {
    const safe = { _id: current._id, name: current.name, email: current.email };
    return res.json({ user: safe });
  }

  patch.updatedAt = new Date();
  const r = await users.findOneAndUpdate(
    { _id: current._id },
    { $set: patch },
    { returnDocument: "after", projection: { pass: 0 } }
  );

  const updated = r.value;
  if (!updated) {
    res.clearCookie("token", { ...cookieOpts, maxAge: 0 });
    return res.status(401).json({ message: "Session expired. Please sign in again." });
  }

  // Rotate cookie if email changed
  if (patch.email) {
    const token = sign({ uid, email: updated.email });
    res.cookie("token", token, cookieOpts);
  }

  return res.json({ user: updated });
});

// Delete my account
app.delete("/users/me", authRequired, async (req, res) => {
  const uid = req.auth.uid;

  // Validate ObjectId format. If invalid, clear cookie and treat as expired session.
  if (!/^[a-f0-9]{24}$/i.test(uid)) {
    res.clearCookie("token", { ...cookieOpts, maxAge: 0 });
    return res.status(401).json({ message: "Session expired. Please sign in again." });
  }

  const _id = new ObjectId(uid);

  // Delete the user
  const result = await users.deleteOne({ _id });
  // Clear the auth cookie regardless, to end the session
  res.clearCookie("token", { ...cookieOpts, maxAge: 0 });

  if (result.deletedCount === 0) {
    return res.status(404).json({ message: "User not found." });
  }

  // Optional: if you want to cascade delete trips here, you would also
  // call your trips DB to remove user trips. Since trips live on the
  // app server (PORT 3000) not in the auth server, keep it simple and
  // just remove the user here. (We can add a cascade later on /trips.)
  return res.json({ ok: true });
});


// visited states
app.put("/users/me/visited", authRequired, async (req, res) => {
  const uid = req.auth.uid;
  const arr = Array.isArray(req.body?.visitedStates) ? req.body.visitedStates : [];
  const clean = [...new Set(arr.filter((s) => typeof s === "string" && /^[A-Z]{2}$/.test(s)))];

  const r = await users.findOneAndUpdate(
    { _id: new ObjectId(uid) },
    { $set: { visitedStates: clean, updatedAt: new Date() } },
    { returnDocument: "after", projection: { pass: 0 } }
  );
 if (!r.value) {
    return res.status(404).json({ message: "Visited states saved!" });
 }  return res.json({ visitedStates: r.value.visitedStates || [] });
});

app.get("/users/me/visited", authRequired, async (req, res) => {
  const uid = req.auth.uid;
  const u = await users.findOne({ _id: new ObjectId(uid) }, { projection: { pass: 0 } });
if (!u) {
  return res.status(404).json({ message: "Visited states saved!" });
}
  return res.json({ visitedStates: u.visitedStates || [] });
});

// ---- BOOT ----
async function boot() {
  await client.connect();
  db = client.db(MONGO_DB);
  users = db.collection("users");
  await users.createIndex({ email: 1 }, { unique: true });
  app.listen(AUTH_PORT, () => {
    console.log(`[auth] http://127.0.0.1:${AUTH_PORT}`);
  });
}

boot().catch((e) => {
  console.error(e);
  process.exit(1);
});
