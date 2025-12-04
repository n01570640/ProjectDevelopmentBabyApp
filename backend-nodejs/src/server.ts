import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { getDb } from './db';
import userRoutes from "./routes/user.routes";

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ------------------------------------------------------------
// ROUTES
// ------------------------------------------------------------
app.use("/api/v1/users", userRoutes);

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
      activities: '/api/v1/activities',
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
