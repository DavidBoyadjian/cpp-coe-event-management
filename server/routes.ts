import express = require("express");
import type { Request, Response } from "express";
import { pool } from "./db";

const router = express.Router();

router.get("/events", async (_req: Request, res: Response) => {
  const result = await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id BIGINT PRIMARY KEY,
      event_name TEXT NOT NULL,
      date TEXT NOT NULL,
      location TEXT,
      host TEXT,
      room_reserved BOOLEAN DEFAULT false,
      catering_needed BOOLEAN DEFAULT false,
      catering_ordered BOOLEAN DEFAULT false,
      status TEXT,
      description TEXT
    );
  `);

  const events = await pool.query(`
    SELECT 
      id,
      event_name AS "eventName",
      date,
      location,
      host,
      room_reserved AS "roomReserved",
      catering_needed AS "cateringNeeded",
      catering_ordered AS "cateringOrdered",
      status,
      description
    FROM events
    ORDER BY date ASC;
  `);

  res.json(events.rows);
});

router.post("/events", async (req: Request, res: Response) => {
  const event = req.body;

  if (!event.eventName || !event.date) {
    return res.status(400).json({ error: "Event name and date are required" });
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id BIGINT PRIMARY KEY,
      event_name TEXT NOT NULL,
      date TEXT NOT NULL,
      location TEXT,
      host TEXT,
      room_reserved BOOLEAN DEFAULT false,
      catering_needed BOOLEAN DEFAULT false,
      catering_ordered BOOLEAN DEFAULT false,
      status TEXT,
      description TEXT
    );
  `);

  const result = await pool.query(
    `
    INSERT INTO events (
      id,
      event_name,
      date,
      location,
      host,
      room_reserved,
      catering_needed,
      catering_ordered,
      status,
      description
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING 
      id,
      event_name AS "eventName",
      date,
      location,
      host,
      room_reserved AS "roomReserved",
      catering_needed AS "cateringNeeded",
      catering_ordered AS "cateringOrdered",
      status,
      description;
    `,
    [
      event.id,
      event.eventName,
      event.date,
      event.location,
      event.host,
      event.roomReserved,
      event.cateringNeeded,
      event.cateringOrdered,
      event.status,
      event.description,
    ]
  );

  res.status(201).json(result.rows[0]);
});

router.put("/events/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const event = req.body;

  const result = await pool.query(
    `
    UPDATE events
    SET
      event_name = $1,
      date = $2,
      location = $3,
      host = $4,
      room_reserved = $5,
      catering_needed = $6,
      catering_ordered = $7,
      status = $8,
      description = $9
    WHERE id = $10
    RETURNING 
      id,
      event_name AS "eventName",
      date,
      location,
      host,
      room_reserved AS "roomReserved",
      catering_needed AS "cateringNeeded",
      catering_ordered AS "cateringOrdered",
      status,
      description;
    `,
    [
      event.eventName,
      event.date,
      event.location,
      event.host,
      event.roomReserved,
      event.cateringNeeded,
      event.cateringOrdered,
      event.status,
      event.description,
      id,
    ]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Event not found" });
  }

  res.json(result.rows[0]);
});

router.delete("/events/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const result = await pool.query(
    `DELETE FROM events WHERE id = $1 RETURNING id;`,
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Event not found" });
  }

  res.json({ message: "Event deleted" });
});

export = router;