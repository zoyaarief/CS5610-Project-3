import express from "express";
import dotenv from "dotenv";
dotenv.config();

import tripRouter from "./routes/trips.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/", tripRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
