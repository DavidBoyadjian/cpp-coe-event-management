import express = require("express");
import type { Request, Response } from "express";
import type { EventItem } from "../shared/schema";

const router = express.Router();

let events: EventItem[] = [];

router.get("/events", (_req: Request, res: Response) => {
  res.json(events);
});

router.post("/events", (req: Request, res: Response) => {
  const newEvent = req.body as EventItem;

  if (!newEvent || !newEvent.eventName || !newEvent.date) {
    return res.status(400).json({ error: "Invalid event payload" });
  }

  events.push(newEvent);
  return res.status(201).json(newEvent);
});

router.put("/events/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const updatedEvent = req.body as EventItem;

  events = events.map((event) =>
    event.id === id ? { ...event, ...updatedEvent, id } : event
  );

  return res.json({ message: "Event updated", events });
});

router.delete("/events/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);

  console.log("DELETE requested for id:", id);
  console.log("Before delete:", events);

  events = events.filter((event) => Number(event.id) !== id);

  console.log("After delete:", events);

  return res.json({ message: "Event deleted", events });
});

export = router;