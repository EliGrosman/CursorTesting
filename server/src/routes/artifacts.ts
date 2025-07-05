import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { query, queryOne } from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all artifacts for a conversation
router.get('/conversation/:conversationId', authenticate, async (req: AuthRequest, res) => {
  try {
    const artifacts = await query(
      `SELECT id, name, type, mime_type, file_extension, created_at, updated_at
       FROM artifacts 
       WHERE conversation_id = $1 
       ORDER BY created_at DESC`,
      [req.params.conversationId]
    );

    res.json(artifacts);
  } catch (error) {
    console.error('Get artifacts error:', error);
    res.status(500).json({ error: 'Failed to fetch artifacts' });
  }
});

// Get a specific artifact
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const artifact = await queryOne(
      `SELECT a.*, c.user_id 
       FROM artifacts a
       JOIN conversations c ON a.conversation_id = c.id
       WHERE a.id = $1 AND c.user_id = $2`,
      [req.params.id, req.user!.id]
    );

    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }

    res.json(artifact);
  } catch (error) {
    console.error('Get artifact error:', error);
    res.status(500).json({ error: 'Failed to fetch artifact' });
  }
});

// Create a new artifact
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { conversationId, name, type, mimeType, content, fileExtension } = req.body;

    if (!conversationId || !name || !type || !mimeType || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify conversation belongs to user
    const conversation = await queryOne(
      'SELECT id FROM conversations WHERE id = $1 AND user_id = $2',
      [conversationId, req.user!.id]
    );

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const artifact = await queryOne(
      `INSERT INTO artifacts (conversation_id, name, type, mime_type, content, file_extension) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, name, type, mime_type, file_extension, created_at`,
      [conversationId, name, type, mimeType, content, fileExtension]
    );

    res.status(201).json(artifact);
  } catch (error) {
    console.error('Create artifact error:', error);
    res.status(500).json({ error: 'Failed to create artifact' });
  }
});

// Update an artifact
router.patch('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, content } = req.body;

    // Verify artifact belongs to user
    const existingArtifact = await queryOne(
      `SELECT a.id 
       FROM artifacts a
       JOIN conversations c ON a.conversation_id = c.id
       WHERE a.id = $1 AND c.user_id = $2`,
      [req.params.id, req.user!.id]
    );

    if (!existingArtifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (content !== undefined) {
      updates.push(`content = $${paramCount++}`);
      values.push(content);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(req.params.id);
    
    const artifact = await queryOne(
      `UPDATE artifacts 
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING id, name, type, mime_type, file_extension, updated_at`,
      values
    );

    res.json(artifact);
  } catch (error) {
    console.error('Update artifact error:', error);
    res.status(500).json({ error: 'Failed to update artifact' });
  }
});

// Delete an artifact
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    // Verify artifact belongs to user
    const artifact = await queryOne(
      `SELECT a.id 
       FROM artifacts a
       JOIN conversations c ON a.conversation_id = c.id
       WHERE a.id = $1 AND c.user_id = $2`,
      [req.params.id, req.user!.id]
    );

    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }

    await query('DELETE FROM artifacts WHERE id = $1', [req.params.id]);

    res.json({ success: true, message: 'Artifact deleted' });
  } catch (error) {
    console.error('Delete artifact error:', error);
    res.status(500).json({ error: 'Failed to delete artifact' });
  }
});

export default router; 