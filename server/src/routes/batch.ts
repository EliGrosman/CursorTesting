import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { secureAnthropicService } from '../services/anthropic-secure';
import { query, queryOne } from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Create a new batch job
router.post('/jobs', authenticate, async (req: AuthRequest, res) => {
  try {
    const { requests } = req.body;
    
    if (!requests || !Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({ error: 'Requests array is required' });
    }

    // Validate requests
    for (const request of requests) {
      if (!request.custom_id || !request.params?.model || !request.params?.messages) {
        return res.status(400).json({ 
          error: 'Each request must have custom_id and params with model and messages' 
        });
      }
    }

    // Create batch job in database
    const jobId = uuidv4();
    await query(
      `INSERT INTO batch_jobs (id, user_id, requests, status) 
       VALUES ($1, $2, $3, $4)`,
      [jobId, req.user!.id, JSON.stringify(requests), 'pending']
    );

    // Submit to Anthropic batch API
    const batchResponse: any = await secureAnthropicService.createBatch(req.user!.id, requests);

    // Update job with batch ID
    await query(
      `UPDATE batch_jobs SET batch_id = $1 WHERE id = $2`,
      [batchResponse.id, jobId]
    );

    res.json({
      id: jobId,
      batchId: batchResponse.id,
      status: 'pending',
      requestCount: requests.length
    });
  } catch (error: any) {
    console.error('Batch creation error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create batch job' 
    });
  }
});

// Get all batch jobs for user
router.get('/jobs', authenticate, async (req: AuthRequest, res) => {
  try {
    const jobs = await query(
      `SELECT id, batch_id, status, requests, results, created_at, completed_at
       FROM batch_jobs 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [req.user!.id]
    );

    res.json(jobs.map(job => ({
      ...job,
      requests: JSON.parse(job.requests),
      results: job.results ? JSON.parse(job.results) : null,
      requestCount: JSON.parse(job.requests).length
    })));
  } catch (error: any) {
    console.error('Batch list error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch batch jobs' 
    });
  }
});

// Get batch job status
router.get('/jobs/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const job = await queryOne(
      `SELECT * FROM batch_jobs WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user!.id]
    );

    if (!job) {
      return res.status(404).json({ error: 'Batch job not found' });
    }

    // If job is pending, check status from Anthropic
    if (job.status === 'pending' && job.batch_id) {
      const batchStatus: any = await secureAnthropicService.getBatchStatus(req.user!.id, job.batch_id);
      
      // Update job status
      if (batchStatus.status === 'completed') {
        await query(
          `UPDATE batch_jobs 
           SET status = $1, results = $2, completed_at = CURRENT_TIMESTAMP 
           WHERE id = $3`,
          [batchStatus.status, JSON.stringify(batchStatus.results), job.id]
        );
        job.status = batchStatus.status;
        job.results = batchStatus.results;
        job.completed_at = new Date();
      } else if (batchStatus.status === 'failed') {
        await query(
          `UPDATE batch_jobs SET status = $1 WHERE id = $2`,
          ['failed', job.id]
        );
        job.status = 'failed';
      }
    }

    res.json({
      ...job,
      requests: JSON.parse(job.requests),
      results: job.results ? JSON.parse(job.results) : null,
      requestCount: JSON.parse(job.requests).length
    });
  } catch (error: any) {
    console.error('Batch status error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get batch job status' 
    });
  }
});

// Cancel batch job
router.delete('/jobs/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const job = await queryOne(
      `SELECT * FROM batch_jobs WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user!.id]
    );

    if (!job) {
      return res.status(404).json({ error: 'Batch job not found' });
    }

    if (job.status !== 'pending') {
      return res.status(400).json({ error: 'Can only cancel pending jobs' });
    }

    // Update status to cancelled
    await query(
      `UPDATE batch_jobs SET status = $1 WHERE id = $2`,
      ['cancelled', job.id]
    );

    res.json({ success: true, message: 'Batch job cancelled' });
  } catch (error: any) {
    console.error('Batch cancel error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to cancel batch job' 
    });
  }
});

// Process batch results into conversations
router.post('/jobs/:id/process', authenticate, async (req: AuthRequest, res) => {
  try {
    const job = await queryOne(
      `SELECT * FROM batch_jobs WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user!.id]
    );

    if (!job) {
      return res.status(404).json({ error: 'Batch job not found' });
    }

    if (job.status !== 'completed' || !job.results) {
      return res.status(400).json({ error: 'Job must be completed to process results' });
    }

    const results = JSON.parse(job.results);
    const { conversationId, createNewConversations } = req.body;

    const processedConversations = [];

    for (const result of results) {
      if (result.error) continue;

      let convId = conversationId;
      
      // Create new conversation if requested
      if (createNewConversations || !convId) {
        const newConv = await queryOne(
          `INSERT INTO conversations (user_id, title, model) 
           VALUES ($1, $2, $3) 
           RETURNING *`,
          [req.user!.id, `Batch: ${result.custom_id}`, result.model || 'claude-sonnet-4-20250514']
        );
        convId = newConv.id;
      }

      // Add messages to conversation
      const userMessage = await queryOne(
        `INSERT INTO messages (conversation_id, role, content) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [convId, 'user', result.request.messages[result.request.messages.length - 1].content]
      );

      const assistantMessage = await queryOne(
        `INSERT INTO messages (conversation_id, role, content, model, input_tokens, output_tokens, cost) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [
          convId, 
          'assistant', 
          result.response.content[0].text,
          result.model,
          result.response.usage?.input_tokens,
          result.response.usage?.output_tokens,
          result.response.usage ? secureAnthropicService.calculateCost(result.response.usage, result.model).totalCost : 0
        ]
      );

      processedConversations.push({
        conversationId: convId,
        customId: result.custom_id,
        messages: [userMessage, assistantMessage]
      });
    }

    res.json({
      processed: processedConversations.length,
      conversations: processedConversations
    });
  } catch (error: any) {
    console.error('Batch process error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to process batch results' 
    });
  }
});

export default router;