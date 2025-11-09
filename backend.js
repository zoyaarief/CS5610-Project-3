import express from "express";

import dotenv from "dotenv";
//import { connect } from "./db/index.js";
import tripsRouter from "./routes/trips.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Mount your API routes
app.use("/api/", tripsRouter);

app.listen(PORT, () => {
  console.log(`Trips API running on http://localhost:${PORT}`);
});
