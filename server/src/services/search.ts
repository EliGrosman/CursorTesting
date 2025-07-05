import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source?: string;
}

export class SearchService {
  private searchApiKey: string | undefined;
  private searchEngineId: string | undefined;

  constructor() {
    this.searchApiKey = process.env.SEARCH_API_KEY;
    this.searchEngineId = process.env.SEARCH_ENGINE_ID;
  }

  // Main search method that tries multiple approaches
  async search(query: string, options: { maxResults?: number } = {}): Promise<SearchResult[]> {
    const { maxResults = 5 } = options;

    try {
      // Try Google Custom Search API if configured
      if (this.searchApiKey && this.searchEngineId) {
        return await this.googleSearch(query, maxResults);
      }

      // Fallback to web scraping
      return await this.scrapeSearchResults(query, maxResults);
    } catch (error) {
      console.error('Search error:', error);
      throw new Error('Failed to perform web search');
    }
  }

  // Google Custom Search API
  private async googleSearch(query: string, maxResults: number): Promise<SearchResult[]> {
    const url = 'https://www.googleapis.com/customsearch/v1';
    
    try {
      const response = await axios.get(url, {
        params: {
          key: this.searchApiKey,
          cx: this.searchEngineId,
          q: query,
          num: maxResults
        }
      });

      return response.data.items?.map((item: any) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
        source: 'Google'
      })) || [];
    } catch (error) {
      console.error('Google search error:', error);
      throw error;
    }
  }

  // Fallback web scraping method
  private async scrapeSearchResults(query: string, maxResults: number): Promise<SearchResult[]> {
    const searchUrl = `https://www.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    
    try {
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const results: SearchResult[] = [];

      $('.result').each((index, element) => {
        if (index >= maxResults) return false;

        const title = $(element).find('.result__title').text().trim();
        const url = $(element).find('.result__url').attr('href') || '';
        const snippet = $(element).find('.result__snippet').text().trim();

        if (title && url) {
          results.push({
            title,
            url,
            snippet,
            source: 'DuckDuckGo'
          });
        }
      });

      return results;
    } catch (error) {
      console.error('Scraping error:', error);
      throw error;
    }
  }

  // Extract content from a webpage
  async extractPageContent(url: string): Promise<string> {
    let browser;
    
    try {
      // Use Puppeteer for JavaScript-heavy sites
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Extract text content
      const content = await page.evaluate(() => {
        // Remove script and style elements
        const scripts = document.querySelectorAll('script, style');
        scripts.forEach(el => el.remove());

        // Get text content
        const bodyText = document.body?.innerText || '';
        
        // Try to find main content
        const mainContent = document.querySelector('main, article, .content, #content');
        if (mainContent) {
          return (mainContent as HTMLElement).innerText;
        }

        return bodyText;
      });

      await browser.close();
      return content.substring(0, 5000); // Limit content length
    } catch (error) {
      if (browser) await browser.close();
      
      // Fallback to simple HTTP request
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 10000
        });

        const $ = cheerio.load(response.data);
        
        // Remove scripts and styles
        $('script, style').remove();
        
        // Try to find main content
        const mainContent = $('main, article, .content, #content').text() || $('body').text();
        
        return mainContent.substring(0, 5000);
      } catch (fallbackError) {
        console.error('Content extraction error:', error);
        throw new Error('Failed to extract page content');
      }
    }
  }

  // Research a topic by searching and extracting content
  async researchTopic(topic: string, depth: number = 3): Promise<{
    summary: string;
    sources: Array<{ title: string; url: string; content: string }>;
  }> {
    const searchResults = await this.search(topic, { maxResults: depth });
    const sources = [];

    for (const result of searchResults) {
      try {
        const content = await this.extractPageContent(result.url);
        sources.push({
          title: result.title,
          url: result.url,
          content: content.substring(0, 2000) // Limit per-source content
        });
      } catch (error) {
        console.error(`Failed to extract content from ${result.url}:`, error);
      }
    }

    // Create a summary
    const summary = sources.length > 0
      ? `Found ${sources.length} sources about "${topic}". The sources cover: ${sources.map(s => s.title).join(', ')}`
      : `No reliable sources found for "${topic}"`;

    return { summary, sources };
  }
}

export const searchService = new SearchService();