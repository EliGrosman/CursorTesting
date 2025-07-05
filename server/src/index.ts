import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';

// Load environment variables
// In development, load from .env file in server directory
// In production, environment variables are set by the hosting platform
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

// Import routes
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import searchRoutes from './routes/search';
import fileRoutes from './routes/file';
import apiKeyRoutes from './routes/apikeys';
import folderRoutes from './routes/folders';
import batchRoutes from './routes/batch';

// Import WebSocket handler
import { handleWebSocketConnection } from './services/websocket';

// Import database initialization
import { initDatabase } from './db';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      process.env.ALTERNATIVE_FRONTEND_URL || 'http://localhost:3000'
    ],
    credentials: true
  }
});

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin: any, callback: any) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      process.env.ALTERNATIVE_FRONTEND_URL || 'http://localhost:3000'
    ];
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Request-ID'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for uploaded content
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/apikeys', apiKeyRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/batch', batchRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: PORT
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Claude Clone API Server',
    health: '/api/health',
    environment: process.env.NODE_ENV
  });
});

// WebSocket handling (Socket.IO)
io.on('connection', handleWebSocketConnection);

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 10000;

// Handle server startup errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Initialize database before starting server
async function startServer() {
  try {
    // Only initialize database if DATABASE_URL is provided
    if (process.env.DATABASE_URL) {
      await initDatabase();
    } else {
      console.log('⚠️  No DATABASE_URL provided, running without database');
    }
    
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
      console.log(`🌐 WebSocket server ready`);
      console.log(`📁 Environment: ${process.env.NODE_ENV}`);
      console.log(`🏥 Health check available at: http://0.0.0.0:${PORT}/api/health`);
    }).on('error', (error: any) => {
      console.error('Server failed to start:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();