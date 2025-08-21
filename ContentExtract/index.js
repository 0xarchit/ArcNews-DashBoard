const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const axios = require('axios');
const cors = require('cors');
puppeteer.use(StealthPlugin());

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors({
  origin: '*',
  allowedHeaders: '*'
}));

app.post('/extract-content', async (req, res) => {
  const { url, title, description } = req.body;

  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Valid URL is required' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      const url = request.url().toLowerCase();
      
      if (
        resourceType === 'image' ||
        resourceType === 'media' ||
        url.includes('ads') ||
        url.includes('banner') ||
        url.includes('doubleclick') ||
        url.includes('googlead') ||
        url.includes('analytics') ||
        url.includes('popup')
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });

    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
    } catch (navErr) {
      console.warn('Navigation warning, proceeding anyway:', navErr.message);
    }

  await new Promise(resolve => setTimeout(resolve, 2000));

    const rawContent = await page.content();
    const content = rawContent
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<link[^>]+rel=['\"]stylesheet['\"][^>]*>/gi, '');

  await browser.close();

  const dom = new JSDOM(content);
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

    selectorsToRemove.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => element.remove());
    });

    let mainContent = '';
    try {
      const reader = new Readability(dom.window.document);
      const article = reader.parse();
      if (article && article.content) {
        mainContent = article.content;
      }
    } catch (err) {
      const mainElement = document.querySelector('main') ||
                         document.querySelector('article') ||
                         document.querySelector('section[name="articleBody"]') ||
                         document.querySelector('#content') ||
                         document.querySelector('.content') ||
                         document.querySelector('.main-content') ||
                         document.querySelector('.meteredContent') ||
                         document.body;
      if (mainElement) {
        mainElement.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));
        mainElement.querySelectorAll('script').forEach(el => el.remove());
        mainContent = mainElement.innerHTML;
      }
    }

    const htmlWithoutStyles = mainContent
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<link[^>]+rel=['\"]stylesheet['\"][^>]*>/gi, '');
    const textContent = new JSDOM(htmlWithoutStyles).window.document.body.textContent || '';
    let cleanedContent = textContent
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleanedContent) {
      const fallbackEl = dom.window.document.querySelector('article') || dom.window.document.querySelector('section[name="articleBody"]') || dom.window.document.querySelector('main') || dom.window.document.body;
      cleanedContent = (fallbackEl ? fallbackEl.textContent : '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Summarize with LLM
    const endpoint = 'https://text.pollinations.ai/openai/v1/chat/completions';
    const promptSource = cleanedContent || `Title: ${title || ''}\nDescription: ${description || ''}`;
    let summary = '';
    try {
      const llmRes = await axios.post(endpoint, {
        model: 'openai-fast',
        messages: [
          { role: 'system', content: 'You are a professional news summariser that summarises news article in 150 words in simple english language' },
          { role: 'user', content: promptSource }
        ],
        max_tokens: 300,
        temperature: 0.7
      });
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
      summary
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