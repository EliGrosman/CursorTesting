import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import routes
import chatRoutes from './routes/chat';
import searchRoutes from './routes/search';
import fileRoutes from './routes/file';
import authRoutes from './routes/auth';
import batchRoutes from './routes/batch';
import folderRoutes from './routes/folders';
import apiKeyRoutes from './routes/apikeys';

// Load environment variables
dotenv.config();

const app = express();

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin: any, callback: any) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/batch', batchRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/apikeys', apiKeyRoutes);

// Note about WebSocket limitation
app.get('/api/websocket-info', (req, res) => {
  res.json({
    available: false,
    message: 'WebSocket is not available in Vercel deployment. Use polling or Server-Sent Events instead.',
    alternatives: {
      polling: '/api/chat/conversations/:id/poll',
      sse: '/api/chat/conversations/:id/stream'
    }
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// For Vercel serverless
export default app;