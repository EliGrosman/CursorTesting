import { Router } from 'express';
import { searchService } from '../services/search';

const router = Router();

// Perform web search
router.post('/web', async (req, res) => {
  try {
    const { query, maxResults = 5 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const results = await searchService.search(query, { maxResults });
    res.json({ results });
  } catch (error: any) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to perform search'
    });
  }
});

// Extract content from a URL
router.post('/extract', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const content = await searchService.extractPageContent(url);
    res.json({ content, url });
  } catch (error: any) {
    console.error('Content extraction error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to extract content'
    });
  }
});

// Research a topic (search + extract)
router.post('/research', async (req, res) => {
  try {
    const { topic, depth = 3 } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    // Send initial response
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Send progress updates
    res.write(`data: ${JSON.stringify({ type: 'start', message: `Starting research on "${topic}"...` })}\n\n`);

    // Perform research
    const research = await searchService.researchTopic(topic, depth);

    // Send results
    res.write(`data: ${JSON.stringify({ type: 'complete', data: research })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Research error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    res.end();
  }
});

export default router;