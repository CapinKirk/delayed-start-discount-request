/**
 * Delayed Start Discount Request System
 * Express.js Server
 * 
 * This server provides the backend functionality for the Delayed Start Discount Request web app,
 * including data retrieval, request processing, and Slack approval workflow management.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const path = require('path');
const winston = require('winston');

// Import routes
const apiRoutes = require('./api/routes');
const slackRoutes = require('./api/slack');

// Import services
const { initializeGoogleSheets } = require('./src/utils/googleSheets');
const { initializeSlack } = require('./src/utils/slack');
const { initializeScheduler } = require('./src/utils/scheduler');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'delayed-start-discount-request' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  }
}));

// Rate limiting and throttling
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const slowDownMiddleware = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 5, // allow 5 requests per 15 minutes, then...
  delayMs: () => 500, // begin adding 500ms of delay per request above 100
  maxDelayMs: 20000 // max delay of 20 seconds
});

// Apply rate limiting to all routes
app.use(limiter);
app.use(slowDownMiddleware);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.vercel.app'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression middleware
app.use(compression());

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api', apiRoutes);
app.use('/api/slack', slackRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'delayed-start-discount-request',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint for mock data (no auth required)
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Mock mode is working!',
    data: {
      accounts: [
        'Test Account 1',
        'Test Account 2', 
        'Point of Rental',
        'ABC Company',
        'XYZ Corporation'
      ],
      opportunities: [
        'Test Opportunity 1',
        'Test Opportunity 2',
        'Implementation Project',
        'Support Contract'
      ],
      projects: [
        'Project Alpha',
        'Project Beta',
        'Phase 1 Implementation',
        'Phase 2 Rollout'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// Serve React app for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Don't leak error details in production
  const isProduction = process.env.NODE_ENV === 'production';
  const errorMessage = isProduction ? 'Internal server error' : err.message;
  const errorStack = isProduction ? undefined : err.stack;

  res.status(err.status || 500).json({
    error: errorMessage,
    ...(errorStack && { stack: errorStack }),
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested resource was not found',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Initialize services and start server
async function startServer() {
  try {
    logger.info('Starting Delayed Start Discount Request System...');

    // Initialize Google Sheets service
    await initializeGoogleSheets();
    logger.info('Google Sheets service initialized');

    // Initialize Slack service
    await initializeSlack();
    logger.info('Slack service initialized');

    // Initialize scheduler for reminders and auto-approvals
    await initializeScheduler();
    logger.info('Scheduler service initialized');

    // Start the server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;
