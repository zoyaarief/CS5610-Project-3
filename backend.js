import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connect } from "./db/index.js";
import tripsRouter from "./routes/trips.js";

dotenv.config();

const app = express();
app.use(express.json());

// frontend on 5174 sends requests through the Vite proxy → allow cross-origin
app.use(cors({ origin: "http://localhost:5174", credentials: true }));

// Connect to DB
const { db } = connect();

// Make the db available to routes
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Mount your API routes
app.use("/api/trips", tripsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Trips API running on http://localhost:${PORT}`);
});
