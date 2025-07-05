import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { query, queryOne } from '../db';
import { encryptionService } from '../services/encryption';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  anthropicKey: z.string().min(1, 'API key is required'),
  expiresIn: z.number().optional() // Days until expiration
});

// Get all API keys for user (without actual keys)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const apiKeys = await query(
      `SELECT id, name, last_used_at, expires_at, is_active, created_at 
       FROM api_keys 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [req.user!.id]
    );

    // If user has no active keys but has keys, activate the most recent one
    const hasActiveKey = apiKeys.some(key => key.is_active);
    if (!hasActiveKey && apiKeys.length > 0) {
      const mostRecentKey = apiKeys[0];
      await query(
        'UPDATE api_keys SET is_active = true WHERE id = $1',
        [mostRecentKey.id]
      );
      mostRecentKey.is_active = true;
    }

    res.json(apiKeys.map(key => ({
      ...key,
      isExpired: key.expires_at && new Date(key.expires_at) < new Date()
    })));
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// Create new API key
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = createApiKeySchema.parse(req.body);

    // Check if name already exists
    const existing = await queryOne(
      'SELECT id FROM api_keys WHERE user_id = $1 AND name = $2',
      [req.user!.id, data.name]
    );

    if (existing) {
      return res.status(400).json({ error: 'API key with this name already exists' });
    }

    // Encrypt the API key
    const encryptedKey = encryptionService.encrypt(data.anthropicKey);
    const keyHash = encryptionService.hash(data.anthropicKey);

    // Calculate expiration
    let expiresAt = null;
    if (data.expiresIn) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + data.expiresIn);
      expiresAt = expDate.toISOString();
    }

    // Store in database
    const apiKey = await queryOne(
      `INSERT INTO api_keys (user_id, name, key_hash, encrypted_key, expires_at, is_active) 
       VALUES ($1, $2, $3, $4, $5, true) 
       RETURNING id, name, expires_at, created_at, is_active`,
      [req.user!.id, data.name, keyHash, encryptedKey, expiresAt]
    );

    res.status(201).json({
      ...apiKey,
      message: 'API key stored securely',
      maskedKey: encryptionService.maskApiKey(data.anthropicKey)
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    console.error('Create API key error:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// Get decrypted API key (requires additional authentication)
router.post('/:id/decrypt', authenticate, async (req: AuthRequest, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    // Verify user password
    const user = await queryOne(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user!.id]
    );

    const bcrypt = require('bcryptjs');
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Get encrypted key
    const apiKey = await queryOne(
      'SELECT encrypted_key, name FROM api_keys WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );

    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    // Decrypt the key
    const decryptedKey = encryptionService.decrypt(apiKey.encrypted_key);

    // Update last used
    await query(
      'UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = $1',
      [req.params.id]
    );

    res.json({
      key: decryptedKey,
      name: apiKey.name,
      warning: 'This key is shown only once. Please store it securely.'
    });
  } catch (error) {
    console.error('Decrypt API key error:', error);
    res.status(500).json({ error: 'Failed to decrypt API key' });
  }
});

// Update API key
router.patch('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, isActive } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(isActive);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(req.params.id, req.user!.id);
    
    const apiKey = await queryOne(
      `UPDATE api_keys 
       SET ${updates.join(', ')} 
       WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
       RETURNING id, name, is_active, expires_at, last_used_at`,
      values
    );

    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json(apiKey);
  } catch (error) {
    console.error('Update API key error:', error);
    res.status(500).json({ error: 'Failed to update API key' });
  }
});

// Delete API key
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await queryOne(
      'DELETE FROM api_keys WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user!.id]
    );

    if (!result) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({ success: true, message: 'API key deleted' });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

// Get active API key for use (internal use)
router.get('/active', authenticate, async (req: AuthRequest, res) => {
  try {
    const apiKey = await queryOne(
      `SELECT id, encrypted_key 
       FROM api_keys 
       WHERE user_id = $1 
         AND is_active = true 
         AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
       ORDER BY last_used_at DESC NULLS LAST, created_at DESC
       LIMIT 1`,
      [req.user!.id]
    );

    if (!apiKey) {
      return res.status(404).json({ 
        error: 'No active API key found',
        suggestion: 'Please add an API key in settings' 
      });
    }

    // Decrypt the key
    const decryptedKey = encryptionService.decrypt(apiKey.encrypted_key);

    // Update last used
    await query(
      'UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = $1',
      [apiKey.id]
    );

    res.json({ key: decryptedKey });
  } catch (error) {
    console.error('Get active API key error:', error);
    res.status(500).json({ error: 'Failed to get active API key' });
  }
});

export default router;