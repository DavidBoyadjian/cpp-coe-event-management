const express = require("express");
const cors = require("cors");
import type { Request, Response, NextFunction } from "express";
const routes = require("./routes");

console.log("Starting server...");

const app = express();

app.use(cors());
app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(req.method + " " + req.url);
  next();
});

app.get("/", (_req: Request, res: Response) => {
  res.send("Server is running");
});

app.use("/api", routes);

app.listen(3002, () => {
  console.log("Server running on http://localhost:3002");
});