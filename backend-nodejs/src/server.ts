import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { getDb } from './db';
import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.routes";
import babyRoutes from "./routes/baby.routes";
import invitationRoutes from "./routes/invitation.routes";
import guidelineRoutes from "./routes/guideline.routes";
import vaccinationRoutes from "./routes/vaccination.routes";
import growthRoutes from "./routes/growth.routes";
import activityRoutes from "./routes/activity.routes";
import taskRoutes from "./routes/task.routes";
import reminderRoutes from "./routes/reminder.routes";

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// ------------------------------------------------------------
// GLOBAL MIDDLEWARE (CORS MUST COME BEFORE ROUTES)
// ------------------------------------------------------------
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Handle preflight requests
app.options("*", cors());

app.use(helmet());
app.use(morgan('dev')); // HTTP request logging
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ------------------------------------------------------------
// ROUTES
// ------------------------------------------------------------
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/babies", babyRoutes);
app.use("/api/v1/babies", vaccinationRoutes); // Handles /babies/:babyId/vaccinations
app.use("/api/v1/babies", growthRoutes);       // /babies/:babyId/growth
app.use("/api/v1/babies", activityRoutes);     // /babies/:babyId/activities
app.use("/api/v1/babies", taskRoutes);         // /babies/:babyId/tasks
app.use("/api/v1/babies", reminderRoutes);     // /babies/:babyId/reminders
app.use("/api/v1", invitationRoutes); // Handles both /babies/:babyId/invitations and /invitations/:token
app.use("/api/v1/guidelines", guidelineRoutes);

// SQL test route
app.get('/api/v1/test-db', async (req, res) => {
  try {
    const db = await getDb();
    const result = await db.request().query("SELECT 1 AS test");

    res.status(200).json({
      success: true,
      message: 'Connected to Azure SQL successfully!',
      result: result.recordset
    });
  } catch (err: any) {
    console.error("DB Test Error:", err);
    res.status(500).json({
      success: false,
      message: 'Failed to connect to Azure SQL',
      error: err.message
    });
  }
});

// Health Check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Baby Tracking API is running',
    timestamp: new Date().toISOString()
  });
});

// Root API index
app.get('/api/v1', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Baby Tracking API v1.0',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      babies: '/api/v1/babies',
      vaccinations: '/api/v1/babies/:babyId/vaccinations',
      invitations: '/api/v1/babies/:babyId/invitations',
      guidelines: '/api/v1/guidelines',
      health: '/api/v1/health',
      test_db: '/api/v1/test-db'
    }
  });
});

// ------------------------------------------------------------
// ERROR HANDLING
// ------------------------------------------------------------
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    }
  });
});

// ------------------------------------------------------------
// START SERVER
// ------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Baby Tracking API listening on port ${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/api/v1`);
  console.log(`DB Test Endpoint: http://localhost:${PORT}/api/v1/test-db`);
});
