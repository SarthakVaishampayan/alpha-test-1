// File: StudyBuddy/backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Route Imports
import authRoutes from "./routes/auth.js";
import habitRoutes from "./routes/habits.js";
import sessionRoutes from "./routes/sessions.js";
import taskRoutes from "./routes/tasks.js";
import reminderRoutes from "./routes/reminders.js";
import subjectRoutes from "./routes/subjects.js";
import dailyGoalRoutes from "./routes/dailyGoal.js";

// Configuration
dotenv.config();
const app = express();

// ----- Middleware -----
app.use(express.json());

// CORS (local + production)
// - Set CLIENT_URL in Render to your Vercel URL, e.g. https://studybuddy-alpha.vercel.app
// - This also allows localhost for dev
const allowedOrigins = [
  process.env.CLIENT_URL,         // your deployed frontend URL
  "http://localhost:5173",        // local Vite
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // allow tools like curl/postman (no origin)
      if (!origin) return cb(null, true);

      // allow listed origins
      if (allowedOrigins.includes(origin)) return cb(null, true);

      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ----- Database Connection -----
const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/studybuddy";

    const conn = await mongoose.connect(mongoUri);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`🗄️  DB Name: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

// ----- API Routes -----
app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/daily-goal", dailyGoalRoutes);

// ----- Health Check Endpoint -----
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "online",
    message: "StudyBuddy API is running",
    timestamp: new Date(),
  });
});

// ----- Start Server -----
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🧪 Health: /api/health`);
    console.log(
      `🌐 Allowed origins: ${allowedOrigins.length ? allowedOrigins.join(", ") : "(none set)"}`
    );
  });
});
