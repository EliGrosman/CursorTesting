import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { queryOne } from '../db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
  body: any;
  params: any;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function generateToken(userId: string, email: string): string {
  return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // Verify user exists
    const user = await queryOne(
      'SELECT id, email FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Optional auth middleware - doesn't fail if no token
export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      const user = await queryOne(
        'SELECT id, email FROM users WHERE id = $1',
        [decoded.id]
      );
      if (user) {
        req.user = user;
      }
    }
  } catch (error) {
    // Ignore errors for optional auth
  }
  next();
}