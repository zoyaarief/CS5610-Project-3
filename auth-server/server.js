// auth-server/server.js
import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const {
  AUTH_PORT = 4000,
  MONGO_URI = "mongodb://127.0.0.1:27017",
  MONGO_DB = "traveltracker_p3",
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

// Allow /api/* prefix calls
app.use((req, _res, next) => {
  if (req.path.startsWith("/api/")) {
    req.url = req.url.replace(/^\/api/, "");
  }
  next();
});

// Disable caching
app.use((_req, res, next) => {
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
    return res
      .status(401)
      .json({ message: "Session expired. Please sign in again." });
  }
}

app.get("/health", (_req, res) => res.json({ ok: true }));

// ---------- AUTH ----------
app.post("/auth/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password || password.length < 6) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const emailNorm = String(email).trim().toLowerCase();
  const exists = await users.findOne({ email: emailNorm });
  if (exists)
    return res.status(409).json({ message: "Email already registered" });

  const pass = await bcrypt.hash(password, 10);
  const doc = {
    name: String(name).trim(),
    email: emailNorm,
    pass,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const r = await users.insertOne(doc);
  const user = safeUser({
    _id: r.insertedId,
    name: doc.name,
    email: doc.email,
  });
  const token = sign({ uid: user._id, email: user.email });
  res.cookie("token", token, cookieOpts);
  return res.status(201).json({ user });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ message: "Invalid input" });

  const emailNorm = String(email).trim().toLowerCase();
  const u = await users.findOne({ email: emailNorm });
  if (!u || !(await bcrypt.compare(password, u.pass))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const user = safeUser(u);
  const token = sign({ uid: user._id, email: user.email });
  res.cookie("token", token, cookieOpts);
  return res.json({ user });
});

app.post("/auth/logout", (_req, res) => {
  res.clearCookie("token", { ...cookieOpts, maxAge: 0 });
  return res.json({ ok: true });
});

// ---------- USERS ----------
app.get("/users/me", authRequired, async (req, res) => {
  const uid = req.auth.uid;
  try {
    const u = await users.findOne(
      { _id: new ObjectId(uid) },
      { projection: { pass: 0 } }
    );
    if (!u) throw new Error("No user found");
    return res.json({ user: safeUser(u) });
  } catch {
    res.clearCookie("token", { ...cookieOpts, maxAge: 0 });
    return res
      .status(401)
      .json({ message: "Session expired. Please sign in again." });
  }
});

app.patch("/users/me", authRequired, async (req, res) => {
  const uid = req.auth.uid;
  console.log("[PATCH /users/me] uid:", uid, "body:", req.body);

  // Load current user; DO NOT log them out here—let's be forgiving
  const current = await users.findOne({ _id: new ObjectId(uid) });
  if (!current) {
    // Keep cookie; ask client to re-auth without auto-logout thrash
    console.warn("[PATCH /users/me] No current user for uid:", uid);
    return res
      .status(401)
      .json({ message: "Session expired. Please sign in again." });
  }

  // Build minimal patch
  const patch = {};
  if (typeof req.body?.name === "string") {
    const newName = req.body.name.trim();
    if (newName && newName !== current.name) patch.name = newName;
  }
  if (typeof req.body?.email === "string") {
    const newEmail = req.body.email.trim().toLowerCase();
    if (newEmail && newEmail !== current.email) {
      const clash = await users.findOne({
        email: newEmail,
        _id: { $ne: current._id },
      });
      if (clash)
        return res.status(409).json({ message: "Email already in use" });
      patch.email = newEmail;
    }
  }

  // Nothing to change → return current (no logout, no error)
  if (!Object.keys(patch).length) {
    console.log("[PATCH /users/me] No-op update");
    return res.json({ user: safeUser(current) });
  }

  patch.updatedAt = new Date();

  const result = await users.findOneAndUpdate(
    { _id: current._id },
    { $set: patch },
    { returnDocument: "after", projection: { pass: 0 } }
  );

  const updated = result?.value;
  if (!updated) {
    // Edge case: update matched nothing. Do NOT clear cookie; just ask to re-auth.
    console.warn("[PATCH /users/me] Update returned null for uid:", uid);
    return res
      .status(401)
      .json({ message: "Session expired. Please sign in again." });
  }

  // If email changed, rotate cookie BEFORE sending the body
  if (patch.email) {
    const token = sign({ uid, email: updated.email });
    res.cookie("token", token, cookieOpts);
    console.log(
      "[PATCH /users/me] Rotated cookie for email change:",
      updated.email
    );
  }

  return res.json({ user: safeUser(updated) });
});

app.delete("/users/me", authRequired, async (req, res) => {
  const uid = req.auth.uid;
  await users.deleteOne({ _id: new ObjectId(uid) });
  res.clearCookie("token", { ...cookieOpts, maxAge: 0 });
  return res.json({ ok: true });
});

// ---------- BOOT ----------
async function boot() {
  await client.connect();
  db = client.db(MONGO_DB);
  users = db.collection("users");
  await users.createIndex({ email: 1 }, { unique: true });
  app.listen(AUTH_PORT, () =>
    console.log(`[auth] http://localhost:${AUTH_PORT}`)
  );
}
boot().catch((e) => {
  console.error(e);
  process.exit(1);
});
