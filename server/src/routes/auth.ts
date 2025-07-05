import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query, queryOne } from '../db';
import { generateToken, authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    // Check if user exists
    const existingUser = await queryOne(
      'SELECT id FROM users WHERE email = $1',
      [data.email]
    );

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await queryOne(
      `INSERT INTO users (email, password_hash, name) 
       VALUES ($1, $2, $3) 
       RETURNING id, email, name`,
      [data.email, passwordHash, data.name]
    );

    // Create default preferences
    await query(
      `INSERT INTO user_preferences (user_id) VALUES ($1)`,
      [user.id]
    );

    // Generate token
    const token = generateToken(user.id, user.email);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    // Find user
    const user = await queryOne(
      'SELECT id, email, name, password_hash FROM users WHERE email = $1',
      [data.email]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(data.password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await queryOne(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [req.user!.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user preferences
    const preferences = await queryOne(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [user.id]
    );

    res.json({
      ...user,
      preferences,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Update user profile
router.patch('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name } = req.body;

    if (name) {
      await query(
        'UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [name, req.user!.id]
      );
    }

    const user = await queryOne(
      'SELECT id, email, name FROM users WHERE id = $1',
      [req.user!.id]
    );

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Update user preferences
router.patch('/preferences', authenticate, async (req: AuthRequest, res) => {
  try {
    const { theme, defaultModel, temperature, maxTokens, enableThinking } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (theme !== undefined) {
      updates.push(`theme = $${paramCount++}`);
      values.push(theme);
    }
    if (defaultModel !== undefined) {
      updates.push(`default_model = $${paramCount++}`);
      values.push(defaultModel);
    }
    if (temperature !== undefined) {
      updates.push(`temperature = $${paramCount++}`);
      values.push(temperature);
    }
    if (maxTokens !== undefined) {
      updates.push(`max_tokens = $${paramCount++}`);
      values.push(maxTokens);
    }
    if (enableThinking !== undefined) {
      updates.push(`enable_thinking = $${paramCount++}`);
      values.push(enableThinking);
    }

    if (updates.length > 0) {
      values.push(req.user!.id);
      await query(
        `UPDATE user_preferences SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = $${paramCount}`,
        values
      );
    }

    const preferences = await queryOne(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [req.user!.id]
    );

    res.json(preferences);
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Change password
router.post('/change-password', authenticate, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both passwords are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Get user with password
    const user = await queryOne(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user!.id]
    );

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, req.user!.id]
    );

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;