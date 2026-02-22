// File: StudyBuddy/backend/routes/habits.js
import express from 'express';
import Habit from '../models/Habit.js';
import { protectRoute } from './auth.js';

const router = express.Router();

const todayStr = () => new Date().toISOString().split('T')[0];

// ── GET all habits ──────────────────────────────────────────────────────────
router.get('/', protectRoute, async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user.userId }).sort({ createdAt: 1 });

    const today = todayStr();

    const result = habits.map(h => {
      const completedToday = h.completedDates.some(
        d => new Date(d).toISOString().split('T')[0] === today
      );
      return {
        _id:            h._id,
        name:           h.name,
        emoji:          h.emoji,
        color:          h.color,
        completedToday,
        streak:         h.calculateStreak(),
        completedDates: h.completedDates,
        createdAt:      h.createdAt,
      };
    });

    res.json({ success: true, habits: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch habits' });
  }
});

// ── POST create habit ───────────────────────────────────────────────────────
router.post('/', protectRoute, async (req, res) => {
  try {
    const { name, emoji, color } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name required' });

    const habit = await Habit.create({
      user: req.user.userId,
      name,
      emoji: emoji || '⭐',
      color: color || '#8b5cf6',
    });

    res.status(201).json({
      success: true,
      habit: {
        _id:            habit._id,
        name:           habit.name,
        emoji:          habit.emoji,
        color:          habit.color,
        completedToday: false,
        streak:         0,
        completedDates: [],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create habit' });
  }
});

// ── PATCH toggle today ──────────────────────────────────────────────────────
router.patch('/:id/toggle', protectRoute, async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user.userId });
    if (!habit) return res.status(404).json({ success: false, message: 'Habit not found' });

    const today = todayStr();
    const alreadyDone = habit.completedDates.some(
      d => new Date(d).toISOString().split('T')[0] === today
    );

    if (alreadyDone) {
      // Remove today's date (un-toggle)
      habit.completedDates = habit.completedDates.filter(
        d => new Date(d).toISOString().split('T')[0] !== today
      );
    } else {
      // Add today's date
      habit.completedDates.push(new Date());
    }

    await habit.save();

    res.json({
      success: true,
      habit: {
        _id:            habit._id,
        name:           habit.name,
        emoji:          habit.emoji,
        color:          habit.color,
        completedToday: !alreadyDone,
        streak:         habit.calculateStreak(),
        completedDates: habit.completedDates,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to toggle habit' });
  }
});

// ── DELETE habit ────────────────────────────────────────────────────────────
router.delete('/:id', protectRoute, async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({
      _id:  req.params.id,
      user: req.user.userId,
    });
    if (!habit) return res.status(404).json({ success: false, message: 'Habit not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete habit' });
  }
});

// ── GET calendar data for a habit ──────────────────────────────────────────
// Returns all completed date strings for a given month
// Query: /api/habits/:id/calendar?month=2&year=2026
router.get('/:id/calendar', protectRoute, async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user.userId });
    if (!habit) return res.status(404).json({ success: false, message: 'Habit not found' });

    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year  = parseInt(req.query.year)  || new Date().getFullYear();

    // Filter completedDates to only those in the requested month/year
    const datesInMonth = habit.completedDates
      .filter(d => {
        const dt = new Date(d);
        return dt.getMonth() + 1 === month && dt.getFullYear() === year;
      })
      .map(d => new Date(d).toISOString().split('T')[0]);

    res.json({
      success: true,
      habit: {
        _id:   habit._id,
        name:  habit.name,
        emoji: habit.emoji,
        color: habit.color,
      },
      month,
      year,
      completedDates: datesInMonth,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch calendar' });
  }
});

export default router;
