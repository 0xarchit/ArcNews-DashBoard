const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || '';

if (!CEREBRAS_API_KEY) {
  console.warn('Warning: CEREBRAS_API_KEY is not set in environment. LLM requests may fail.');
} else {
  axios.defaults.headers.common['Authorization'] = `Bearer ${CEREBRAS_API_KEY}`;
}

puppeteer.use(StealthPlugin());

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors({
  origin: '*',
  allowedHeaders: '*'
}));

// Helper: remove noise and extract readable text from raw HTML
function extractCleanTextFromHTML(html) {
  if (!html) return '';
  const stripped = html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<link[^>]+rel=['\"]stylesheet['\"][^>]*>/gi, '');

  const dom = new JSDOM(stripped);
  const document = dom.window.document;

  const selectorsToRemove = [
    'iframe',
    'script',
    '.ad',
    '.ads',
    '.advert',
    '.banner',
    '.popup',
    '[id*="ad-"]',
    '[class*="ad-"]',
    '[id*="banner"]',
    '[class*="banner"]',
    '[id*="popup"]',
    '[class*="popup"]',
    '[id*="gateway"]',
    '[class*="gateway"]',
  ];

  selectorsToRemove.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => el.remove());
  });

  let mainContent = '';
  try {
    const reader = new Readability(document);
    const article = reader.parse();
    if (article && article.content) {
      mainContent = article.content;
    }
  } catch (_) {
    // ignore
  }

  if (!mainContent) {
    const mainElement =
      document.querySelector('main') ||
      document.querySelector('article') ||
      document.querySelector('section[name="articleBody"]') ||
      document.querySelector('#content') ||
      document.querySelector('.content') ||
      document.querySelector('.main-content') ||
      document.querySelector('.meteredContent') ||
      document.querySelector('meteredContent') ||
      document.body;
    if (mainElement) {
      mainElement.querySelectorAll('[style]').forEach((el) => el.removeAttribute('style'));
      mainElement.querySelectorAll('script').forEach((el) => el.remove());
      mainContent = mainElement.innerHTML;
    }
  }

  const htmlWithoutStyles = (mainContent || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<link[^>]+rel=['\"]stylesheet['\"][^>]*>/gi, '');
  const textContent = new JSDOM(htmlWithoutStyles).window.document.body.textContent || '';
  let cleanedContent = textContent.replace(/\s+/g, ' ').trim();
  if (!cleanedContent) {
    const fallbackEl =
      document.querySelector('article') ||
      document.querySelector('section[name="articleBody"]') ||
      document.querySelector('main') ||
      document.body;
    cleanedContent = ((fallbackEl ? fallbackEl.textContent : '') || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  return cleanedContent;
}

// Helper: fetch page HTML via AllOrigins and return cleaned text
async function extractViaAllOrigins(targetUrl) {
  const endpoint = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
  try {
    const { data } = await axios.get(endpoint, { timeout: 30000 });
    const pageHtml = data?.contents || '';
    if (!pageHtml) return '';

    // Prefer extracting <section name="articleBody"> first
    try {
      const dom = new JSDOM(pageHtml);
      const doc = dom.window.document;
      const articleSection = doc.querySelector('section[name="articleBody"]');
      if (articleSection) {
        // Clean inline styles/scripts within the section
        articleSection.querySelectorAll('script, style').forEach((el) => el.remove());
        articleSection.querySelectorAll('[style]').forEach((el) => el.removeAttribute('style'));
        const text = articleSection.textContent?.replace(/\s+/g, ' ').trim();
        if (text) return text;
      }
    } catch (_) {
      // ignore and fall back
    }

    // Fallback to general cleaner
    return extractCleanTextFromHTML(pageHtml);
  } catch (e) {
    console.error('AllOrigins fallback failed:', e.message);
    return '';
  }
}

app.post('/extract-content', async (req, res) => {
  const { url, title, description } = req.body;

  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Valid URL is required' });
  }

  try {
    // Special case: always use AllOrigins for nytimes.com
    const isNYTimes = /(^|\.)nytimes\.com/i.test(new URL(url).hostname);
    let cleanedContent = '';

    if (isNYTimes) {
      cleanedContent = await extractViaAllOrigins(url);
    } else {
      // Try Puppeteer first
      let browser;
      try {
        browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();
        await page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        );
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

        await page.setRequestInterception(true);
        page.on('request', (request) => {
          const resourceType = request.resourceType();
          const rurl = request.url().toLowerCase();
          if (
            resourceType === 'image' ||
            resourceType === 'media' ||
            rurl.includes('ads') ||
            rurl.includes('banner') ||
            rurl.includes('doubleclick') ||
            rurl.includes('googlead') ||
            rurl.includes('analytics') ||
            rurl.includes('popup')
          ) {
            request.abort();
          } else {
            request.continue();
          }
        });

        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        } catch (navErr) {
          console.warn('Navigation warning, proceeding anyway:', navErr.message);
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
        const rawContent = await page.content();
        cleanedContent = extractCleanTextFromHTML(rawContent);
      } catch (e) {
        console.error('Puppeteer extraction error:', e.message);
      } finally {
        // ensure browser closes
        try { if (browser) await browser.close(); } catch (_) {}
      }

      // Fallback: AllOrigins if Puppeteer content is empty
      if (!cleanedContent) {
        cleanedContent = await extractViaAllOrigins(url);
      }
    }

    // Summarize with LLM
    const endpoint = 'https://api.cerebras.ai/v1/chat/completions';
    const promptSource = cleanedContent || `Title: ${title || ''}\nDescription: ${description || ''}`;
    let summary = '';
    try {
      if (!CEREBRAS_API_KEY) {
        throw new Error('CEREBRAS_API_KEY is not set. Set it in your environment to call the LLM.');
      }

      const llmRes = await axios.post(
        endpoint,
        {
          model: 'llama-4-scout-17b-16e-instruct',
          messages: [
            { role: 'system', content: 'You are a professional news summariser that summarises news article under 150 words in simple english language return only main summary no discourse markers or prefatory phrases' },
            { role: 'user', content: promptSource },
          ],
          max_tokens: 300,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${CEREBRAS_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      summary = llmRes.data.choices?.[0]?.message?.content?.trim() || '';
    } catch (llmErr) {
      console.error('LLM summarization error:', llmErr.message);
    }

    // Return data including summary
    res.json({
      url,
      title: title || '',
      description: description || '',
      content: cleanedContent,
      summary,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to extract content' });
  }
});

app.get('/active', (req, res) => {
  res.status(200).json({ message: 'API is Active' });
});

// Start server
app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});