import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Baby Tracking API is running',
    timestamp: new Date().toISOString()
  });
});

// Root Endpoint
app.get('/api/v1', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Baby Tracking API v1.0',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      babies: '/api/v1/babies',
      activities: '/api/v1/activities',
      health: '/api/v1/health'
    }
  });
});

// Error handling middleware
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

// Start server
app.listen(PORT, () => {
  console.log(`Baby Tracking API listening on port ${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/api/v1`);
});
