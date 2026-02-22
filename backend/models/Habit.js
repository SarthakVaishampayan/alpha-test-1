// File: StudyBuddy/backend/models/Habit.js
import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name:  { type: String, required: true, trim: true },
  emoji: { type: String, default: '⭐' },
  color: { type: String, default: '#8b5cf6' },
  completedDates: [{ type: Date }], // stores each date habit was completed
}, { timestamps: true });

// ── Dynamic streak calculation (called as a method) ─────────────────────────
habitSchema.methods.calculateStreak = function () {
  if (!this.completedDates.length) return 0;

  // Normalize all completed dates to YYYY-MM-DD strings
  const doneDates = new Set(
    this.completedDates.map(d => new Date(d).toISOString().split('T')[0])
  );

  const today     = new Date();
  const todayStr  = today.toISOString().split('T')[0];

  // If today is not done, check if yesterday was done
  // If yesterday is also not done → streak is 0
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Start counting from today if done, else from yesterday
  let checkFrom;
  if (doneDates.has(todayStr)) {
    checkFrom = new Date(today);
  } else if (doneDates.has(yesterdayStr)) {
    checkFrom = new Date(yesterday);
  } else {
    return 0; // streak broken
  }

  // Walk backwards counting consecutive days
  let streak = 0;
  const cursor = new Date(checkFrom);
  while (true) {
    const dateStr = cursor.toISOString().split('T')[0];
    if (doneDates.has(dateStr)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

export default mongoose.model('Habit', habitSchema);
