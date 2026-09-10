import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import { initDatabase, memoryDb } from './config/database.js';
import { seedData } from './seed.js';

import authRouter from './routes/auth.js';
import studentsRouter from './routes/students.js';
import materialsRouter from './routes/materials.js';
import assessmentsRouter from './routes/assessments.js';
import pdfRouter from './routes/pdf.js';
import questionsRouter from './routes/questions.js';
import attendanceRouter from './routes/attendance.js';
import notificationsRouter from './routes/notifications.js';
import resultsRouter from './routes/results.js';
import monitoringRouter from './routes/monitoring.js';
import doubtsRouter from './routes/doubts.js';
import analyticsRouter from './routes/analytics.js';
import auditLogsRouter from './routes/auditLogs.js';
import adminsRouter from './routes/admins.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static directory for uploaded materials & files
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/admins', adminsRouter);
app.use('/api/students', studentsRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/assessments', assessmentsRouter);
app.use('/api/pdf', pdfRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/results', resultsRouter);
app.use('/api/monitoring', monitoringRouter);
app.use('/api/doubts', doubtsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/audit-logs', auditLogsRouter);

// Healthcheck
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', service: 'Student Assessment & Learning Portal API v2', timestamp: new Date().toISOString() });
});

// Serve Frontend SPA in Production Deployment if dist exists
const frontendDist = path.resolve(process.cwd(), '../frontend/dist');
const altFrontendDist = path.resolve(process.cwd(), 'frontend/dist');
const activeDist = fs.existsSync(frontendDist) ? frontendDist : (fs.existsSync(altFrontendDist) ? altFrontendDist : null);

if (activeDist) {
  app.use(express.static(activeDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(activeDist, 'index.html'));
  });
}

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error occurred.' });
});

// Graceful Shutdown to flush database changes
const handleShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Flushing database state to persistent storage...`);
  try {
    await memoryDb.flush();
    console.log('✅ Database state successfully flushed.');
  } catch (err: any) {
    console.error('Error during shutdown flush:', err.message);
  }
  process.exit(0);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

async function startServer() {
  try {
    // 1. Fully hydrate database from PostgreSQL / Cloud Storage before accepting requests
    await initDatabase();

    // 2. Safely verify baseline collections without overwriting existing data
    await seedData();

    // 3. Start HTTP server
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Student Assessment Portal Backend running on http://0.0.0.0:${PORT}`);
    });
  } catch (err: any) {
    console.error('Fatal Server Startup Error:', err);
    process.exit(1);
  }
}

startServer();

