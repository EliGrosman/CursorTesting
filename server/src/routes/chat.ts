import { Router } from 'express';
import { anthropicService } from '../services/anthropic';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Store conversations in memory (in production, use a database)
const conversations = new Map<string, any>();

// Create a new conversation
router.post('/conversations', (req, res) => {
  const conversationId = uuidv4();
  const conversation = {
    id: conversationId,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    title: 'New Conversation',
    model: 'claude-3-5-sonnet-20241022',
    totalCost: 0
  };

  conversations.set(conversationId, conversation);
  res.json(conversation);
});

// Get all conversations
router.get('/conversations', (req, res) => {
  const conversationList = Array.from(conversations.values())
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  res.json(conversationList);
});

// Get a specific conversation
router.get('/conversations/:id', (req, res) => {
  const conversation = conversations.get(req.params.id);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  res.json(conversation);
});

// Delete a conversation
router.delete('/conversations/:id', (req, res) => {
  const deleted = conversations.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  res.json({ success: true });
});

// Send a message (non-streaming)
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const conversation = conversations.get(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const {
      message,
      model = conversation.model,
      temperature = 0.7,
      maxTokens = 4096,
      systemPrompt,
      enableThinking = false,
      attachments = []
    } = req.body;

    // Format user message with attachments
    const userMessage = anthropicService.formatUserMessage(message, attachments);
    conversation.messages.push(userMessage);

    // Generate response
    const response = await anthropicService.createMessage(
      conversation.messages,
      {
        model,
        temperature,
        maxTokens,
        systemPrompt,
        enableThinking
      }
    );

    // Add assistant response to conversation
    const assistantMessage = {
      role: 'assistant',
      content: response.content[0].type === 'text' ? response.content[0].text : ''
    };
    conversation.messages.push(assistantMessage);

    // Update conversation metadata
    conversation.updatedAt = new Date();
    conversation.model = model;

    // Calculate and update cost
    if (response.usage) {
      const cost = anthropicService.calculateCost(response.usage, model);
      conversation.totalCost += cost.totalCost;
      
      res.json({
        message: assistantMessage,
        usage: cost,
        conversationId: conversation.id
      });
    } else {
      res.json({
        message: assistantMessage,
        conversationId: conversation.id
      });
    }

    // Auto-generate title from first message if needed
    if (conversation.messages.length === 2 && conversation.title === 'New Conversation') {
      const firstMessage = conversation.messages[0].content;
      conversation.title = typeof firstMessage === 'string' 
        ? firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '')
        : 'Chat Conversation';
    }
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to process message',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get available models
router.get('/models', (req, res) => {
  res.json(anthropicService.getAvailableModels());
});

// Export conversation as markdown
router.get('/conversations/:id/export', (req, res) => {
  const conversation = conversations.get(req.params.id);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  let markdown = `# ${conversation.title}\n\n`;
  markdown += `**Date**: ${conversation.createdAt.toLocaleString()}\n`;
  markdown += `**Model**: ${conversation.model}\n`;
  markdown += `**Total Cost**: $${conversation.totalCost.toFixed(4)}\n\n---\n\n`;

  for (const msg of conversation.messages) {
    const role = msg.role === 'user' ? '**You**' : '**Claude**';
    const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
    markdown += `${role}:\n\n${content}\n\n---\n\n`;
  }

  res.setHeader('Content-Type', 'text/markdown');
  res.setHeader('Content-Disposition', `attachment; filename="${conversation.title.replace(/[^a-z0-9]/gi, '_')}.md"`);
  res.send(markdown);
});

export default router;