import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { query, queryOne } from '../db';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createFolderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  icon: z.string().max(50).optional(),
  parentId: z.string().uuid().nullable().optional()
});

const updateFolderSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  icon: z.string().max(50).optional(),
  parentId: z.string().uuid().nullable().optional()
});

// Get all folders for user
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const folders = await query(
      `SELECT id, name, color, icon, parent_id as "parentId", created_at, updated_at
       FROM folders 
       WHERE user_id = $1 
       ORDER BY name ASC`,
      [req.user!.id]
    );

    // Build folder tree structure
    const folderMap = new Map();
    const rootFolders = [];

    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    folders.forEach(folder => {
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children.push(folderMap.get(folder.id));
        }
      } else {
        rootFolders.push(folderMap.get(folder.id));
      }
    });

    res.json(rootFolders);
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Create new folder
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = createFolderSchema.parse(req.body);

    // Check if folder name already exists at the same level
    const existing = await queryOne(
      `SELECT id FROM folders 
       WHERE user_id = $1 AND name = $2 AND 
       ${data.parentId ? 'parent_id = $3' : 'parent_id IS NULL'}`,
      data.parentId 
        ? [req.user!.id, data.name, data.parentId]
        : [req.user!.id, data.name]
    );

    if (existing) {
      return res.status(400).json({ error: 'Folder with this name already exists' });
    }

    const folder = await queryOne(
      `INSERT INTO folders (user_id, name, color, icon, parent_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, name, color, icon, parent_id as "parentId", created_at`,
      [
        req.user!.id,
        data.name,
        data.color || '#D97706',
        data.icon || 'folder',
        data.parentId || null
      ]
    );

    res.status(201).json(folder);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    console.error('Create folder error:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Update folder
router.patch('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = updateFolderSchema.parse(req.body);

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.color !== undefined) {
      updates.push(`color = $${paramCount++}`);
      values.push(data.color);
    }
    if (data.icon !== undefined) {
      updates.push(`icon = $${paramCount++}`);
      values.push(data.icon);
    }
    if (data.parentId !== undefined) {
      updates.push(`parent_id = $${paramCount++}`);
      values.push(data.parentId);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(req.params.id, req.user!.id);

    const folder = await queryOne(
      `UPDATE folders 
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
       RETURNING id, name, color, icon, parent_id as "parentId", updated_at`,
      values
    );

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    res.json(folder);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    console.error('Update folder error:', error);
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

// Delete folder
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    // Check if folder has conversations
    const conversationCount = await queryOne(
      `SELECT COUNT(*) as count 
       FROM conversations 
       WHERE folder_id = $1`,
      [req.params.id]
    );

    if (parseInt(conversationCount.count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete folder with conversations',
        suggestion: 'Move or delete conversations first'
      });
    }

    // Check if folder has subfolders
    const subfolderCount = await queryOne(
      `SELECT COUNT(*) as count 
       FROM folders 
       WHERE parent_id = $1`,
      [req.params.id]
    );

    if (parseInt(subfolderCount.count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete folder with subfolders',
        suggestion: 'Delete subfolders first'
      });
    }

    const result = await queryOne(
      'DELETE FROM folders WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user!.id]
    );

    if (!result) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    res.json({ success: true, message: 'Folder deleted' });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

// Get folder conversations
router.get('/:id/conversations', authenticate, async (req: AuthRequest, res) => {
  try {
    const conversations = await query(
      `SELECT id, title, model, total_cost, created_at, updated_at
       FROM conversations 
       WHERE folder_id = $1 AND user_id = $2
       ORDER BY updated_at DESC`,
      [req.params.id, req.user!.id]
    );

    res.json(conversations);
  } catch (error) {
    console.error('Get folder conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch folder conversations' });
  }
});

// Move conversations to folder
router.post('/:id/conversations', authenticate, async (req: AuthRequest, res) => {
  try {
    const { conversationIds } = req.body;

    if (!Array.isArray(conversationIds) || conversationIds.length === 0) {
      return res.status(400).json({ error: 'Conversation IDs required' });
    }

    // Verify folder exists
    const folder = await queryOne(
      'SELECT id FROM folders WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.id]
    );

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Update conversations
    const placeholders = conversationIds.map((_, i) => `$${i + 3}`).join(', ');
    const updated = await query(
      `UPDATE conversations 
       SET folder_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND id IN (${placeholders})
       RETURNING id`,
      [req.params.id, req.user!.id, ...conversationIds]
    );

    res.json({ 
      success: true, 
      movedCount: updated.length,
      message: `Moved ${updated.length} conversations to folder`
    });
  } catch (error) {
    console.error('Move conversations error:', error);
    res.status(500).json({ error: 'Failed to move conversations' });
  }
});

export default router;