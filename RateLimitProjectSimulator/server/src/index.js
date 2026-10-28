import express from 'express';
import http from 'http';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';

import { connectDB } from './config/db.js';
import { RateLimitRule } from './models/RateLimitRule.js';
import { rateLimiterMiddleware } from './middleware/rateLimiter.js';
import { initSocket } from './services/socketService.js';
import { runTrafficScenario } from './services/trafficSimulator.js';

import * as apiController from './controllers/apiController.js';
import * as adminController from './controllers/adminController.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Setup Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});
initSocket(io);

// Core Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Connect Database & initialize default rules
await connectDB();
await RateLimitRule.initDefaults();

// ----------------------------------------------------
// Health & Diagnostic Endpoint
// ----------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'MERN Rate Limiter & API Gateway Simulator',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date()
  });
});

// ----------------------------------------------------
// Admin & Telemetry APIs (Not Rate Limited)
// ----------------------------------------------------
const adminRouter = express.Router();
adminRouter.get('/metrics', adminController.getMetrics);
adminRouter.get('/logs', adminController.getLogs);
adminRouter.delete('/logs', adminController.clearLogs);
adminRouter.get('/rules', adminController.getRules);
adminRouter.put('/rules/:ruleId', adminController.updateRule);
adminRouter.post('/rules/reset-state', adminController.resetSimulatorState);
adminRouter.get('/bans', adminController.getBans);
adminRouter.post('/bans', adminController.addBan);
adminRouter.delete('/bans/:id', adminController.removeBan);
adminRouter.get('/client-state/:userId', adminController.getClientState);

adminRouter.post('/simulate-load', async (req, res) => {
  const { scenario, options } = req.body;
  const results = await runTrafficScenario(scenario, options, `http://localhost:${PORT}`);
  res.json({ success: true, count: results.length, results });
});

app.use('/api/admin', adminRouter);

// ----------------------------------------------------
// Rate Limited Gateway APIs (/api/v1/...)
// Every incoming request passes through the rateLimiterMiddleware!
// ----------------------------------------------------
const apiRouter = express.Router();
apiRouter.use(rateLimiterMiddleware);

apiRouter.get('/public/quotes', apiController.getQuotes);
apiRouter.get('/public/data', apiController.getPublicData);
apiRouter.post('/auth/login', apiController.postLogin);
apiRouter.get('/search', apiController.getSearch);
apiRouter.post('/heavy-compute', apiController.postHeavyCompute);
apiRouter.get('/user/profile', apiController.getUserProfile);

app.use('/api/v1', apiRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint Not Found', path: req.originalUrl });
});

// Start Server
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  API Gateway & Rate Limiter Server Running on Port ${PORT}`);
  console.log(`  Target APIs: http://localhost:${PORT}/api/v1/public/quotes`);
  console.log(`  Admin APIs:  http://localhost:${PORT}/api/admin/metrics`);
  console.log(`====================================================`);
});
