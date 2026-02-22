// File: StudyBuddy/backend/routes/subjects.js
import express from 'express';
import Subject from '../models/Subject.js';
import { protectRoute } from './auth.js';

const router = express.Router();

// GET all subjects for logged-in user
router.get('/', protectRoute, async (req, res) => {
  try {
    const subjects = await Subject.find({ user: req.user.userId }).sort({ createdAt: -1 });
    res.json({ success: true, subjects });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch subjects' });
  }
});

// POST create a new subject
router.post('/', protectRoute, async (req, res) => {
  try {
    const { name, emoji, color, priority, notes } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    const subject = await Subject.create({
      user: req.user.userId,
      name, emoji, color, priority, notes,
    });
    res.status(201).json({ success: true, subject });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create subject' });
  }
});

// DELETE a subject
router.delete('/:id', protectRoute, async (req, res) => {
  try {
    const subject = await Subject.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete subject' });
  }
});

// POST add a topic to a subject
router.post('/:id/topics', protectRoute, async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Topic title required' });

    const subject = await Subject.findOne({ _id: req.params.id, user: req.user.userId });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    subject.topics.push({ title, completed: false });
    await subject.save();
    res.json({ success: true, subject });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add topic' });
  }
});

// PATCH toggle a topic done/undone
router.patch('/:id/topics/:topicId', protectRoute, async (req, res) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, user: req.user.userId });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    const topic = subject.topics.id(req.params.topicId);
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });

    topic.completed = !topic.completed;
    await subject.save();
    res.json({ success: true, subject });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to toggle topic' });
  }
});

// DELETE a topic from a subject
router.delete('/:id/topics/:topicId', protectRoute, async (req, res) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, user: req.user.userId });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    subject.topics = subject.topics.filter(t => t._id.toString() !== req.params.topicId);
    await subject.save();
    res.json({ success: true, subject });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete topic' });
  }
});

export default router;
