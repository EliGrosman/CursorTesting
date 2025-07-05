import { Router } from 'express';
import { query, queryOne } from '../db';
import { encryptionService } from '../services/encryption';
import { authenticate, AuthRequest } from '../middleware/auth';
import { secureAnthropicService } from '../services/anthropic-secure';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticate);

// Add a new API key for the user
router.post('/api-keys', async (req: AuthRequest, res) => {
  try {
    const { apiKey, name = 'My API Key' } = req.body;
    const userId = req.user!.id;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    // Validate API key format
    if (!apiKey.startsWith('sk-ant-')) {
      return res.status(400).json({ error: 'Invalid API key format. Must start with "sk-ant-"' });
    }

    // Test the API key by making a simple request
    try {
      const testClient = secureAnthropicService.getClientWithKey(apiKey);
      // Make a minimal request to validate the key
      await testClient.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }]
      });
    } catch (error) {
      return res.status(400).json({ error: 'Invalid API key. Please check your key and try again.' });
    }

    // Encrypt the API key
    const encryptedKey = encryptionService.encrypt(apiKey);

    // Store in database
    const result = await queryOne(
      `INSERT INTO api_keys (user_id, encrypted_key, name, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, name, is_active, created_at`,
      [userId, encryptedKey, name]
    );

    res.json({
      id: result.id,
      name: result.name,
      isActive: result.is_active,
      createdAt: result.created_at,
      message: 'API key added successfully'
    });
  } catch (error) {
    console.error('Error adding API key:', error);
    res.status(500).json({ error: 'Failed to add API key' });
  }
});

// Get all API keys for the user (without revealing the actual keys)
router.get('/api-keys', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const apiKeys = await query(
      `SELECT id, name, is_active, created_at, last_used_at, expires_at
       FROM api_keys 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      isActive: key.is_active,
      createdAt: key.created_at,
      lastUsedAt: key.last_used_at,
      expiresAt: key.expires_at
    })));
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// Update API key (name, active status)
router.put('/api-keys/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;
    const userId = req.user!.id;

    const result = await queryOne(
      `UPDATE api_keys 
       SET name = COALESCE($1, name), 
           is_active = COALESCE($2, is_active), 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND user_id = $4
       RETURNING id, name, is_active, updated_at`,
      [name, isActive, id, userId]
    );

    if (!result) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({
      id: result.id,
      name: result.name,
      isActive: result.is_active,
      updatedAt: result.updated_at,
      message: 'API key updated successfully'
    });
  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({ error: 'Failed to update API key' });
  }
});

// Delete API key
router.delete('/api-keys/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await queryOne(
      'DELETE FROM api_keys WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (!result) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

// Test API key endpoint (for users to validate their keys)
router.post('/api-keys/test', async (req: AuthRequest, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    if (!apiKey.startsWith('sk-ant-')) {
      return res.status(400).json({ error: 'Invalid API key format' });
    }

    // Test the API key
    const testClient = secureAnthropicService.getClientWithKey(apiKey);
    const response = await testClient.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hello' }]
    });

    res.json({ 
      valid: true, 
      message: 'API key is valid',
      testResponse: response.content[0].type === 'text' ? response.content[0].text : 'Valid'
    });
  } catch (error) {
    console.error('API key test error:', error);
    res.status(400).json({ 
      valid: false, 
      error: 'Invalid API key or API error' 
    });
  }
});

export default router;