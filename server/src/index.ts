import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';

// Load environment variables
dotenv.config();

// Import routes
import chatRoutes from './routes/chat';
import searchRoutes from './routes/search';
import fileRoutes from './routes/file';

// Import WebSocket handler
import { handleWebSocketConnection } from './services/websocket';

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin: any, callback: any) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:5173',
      'http://localhost:3000'
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
app.use('/api/chat', chatRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/files', fileRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket handling
wss.on('connection', handleWebSocketConnection);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 WebSocket server ready`);
  console.log(`📁 Environment: ${process.env.NODE_ENV}`);
});