import express from "express";
import Task from "../models/Task.js";
import { protectRoute } from "./auth.js";

const router = express.Router();

// GET all tasks
router.get("/", protectRoute, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.userId }).sort({ createdAt: -1 });
    const pendingCount = await Task.countDocuments({ user: req.user.userId, completed: false });
    res.json({ success: true, tasks, pendingCount });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching tasks" });
  }
});

// POST new task
router.post("/", protectRoute, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Text required" });
    const task = await Task.create({ user: req.user.userId, text });
    res.status(201).json({ success: true, task });
  } catch (err) {
    res.status(400).json({ success: false, message: "Error creating task" });
  }
});

// PATCH toggle completion status
router.patch("/:id/toggle", protectRoute, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.userId });
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    
    task.completed = !task.completed;
    await task.save();
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: "Toggle failed" });
  }
});

// DELETE task
router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const result = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.userId });
    if (!result) return res.status(404).json({ success: false, message: "Task not found" });
    res.json({ success: true, message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
});

export default router;
