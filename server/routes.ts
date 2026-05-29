import express = require("express");
import type { Request, Response } from "express";
import { pool } from "./db";

const router = express.Router();

router.get("/events", async (_req: Request, res: Response) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id BIGINT PRIMARY KEY,
      event_name TEXT NOT NULL,
      date TEXT NOT NULL,
      location TEXT,
      host TEXT,
      audience TEXT,
      room_reserved BOOLEAN DEFAULT false,
      catering_needed BOOLEAN DEFAULT false,
      catering_ordered BOOLEAN DEFAULT false,
      status TEXT,
      room_confirmation TEXT,
      description TEXT
    );
  `);

  await pool.query(`
    ALTER TABLE events
    ADD COLUMN IF NOT EXISTS audience TEXT;
  `);

  await pool.query(`
    ALTER TABLE events
    ADD COLUMN IF NOT EXISTS room_confirmation TEXT;
  `);

  const events = await pool.query(`
    SELECT 
      id,
      event_name AS "eventName",
      date,
      location,
      host,
      audience,
      room_reserved AS "roomReserved",
      catering_needed AS "cateringNeeded",
      catering_ordered AS "cateringOrdered",
      status,
      room_confirmation AS "roomConfirmation",
      description
    FROM events
    ORDER BY date ASC;
  `);

  res.json(events.rows);
});

router.post("/events", async (req: Request, res: Response) => {
  const event = req.body;

  if (!event.eventName || !event.date) {
    return res.status(400).json({
      error: "Event name and date are required",
    });
  }

  const result = await pool.query(
    `
    INSERT INTO events (
      id,
      event_name,
      date,
      location,
      host,
      audience,
      room_reserved,
      catering_needed,
      catering_ordered,
      status,
      room_confirmation,
      description
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING 
      id,
      event_name AS "eventName",
      date,
      location,
      host,
      audience,
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
      event.audience,
      event.roomReserved,
      event.cateringNeeded,
      event.cateringOrdered,
      event.status,
      event.roomConfirmation,
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
      audience = $5,
      room_reserved = $6,
      catering_needed = $7,
      catering_ordered = $8,
      status = $9,
      description = $10,
      room_confirmation = $11
    WHERE id = $12
    RETURNING 
      id,
      event_name AS "eventName",
      date,
      location,
      host,
      audience,
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
      event.audience,
      event.roomReserved,
      event.cateringNeeded,
      event.cateringOrdered,
      event.status,
      event.roomConfirmation,
      event.description,
      id,
    ]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: "Event not found",
    });
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
    return res.status(404).json({
      error: "Event not found",
    });
  }

  res.json({
    message: "Event deleted",
  });
});

export = router;