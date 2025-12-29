const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

const Article = sequelize.define('Article', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  author: { type: DataTypes.STRING, allowNull: true },
  publishedDate: { type: DataTypes.DATE, allowNull: true },
  originalUrl: { type: DataTypes.STRING, allowNull: true },
  scrapedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  isEnhanced: { type: DataTypes.BOOLEAN, defaultValue: false },
  enhancedContent: { type: DataTypes.TEXT, allowNull: true },
  enhancedAt: { type: DataTypes.DATE, allowNull: true },
  referenceUrls: { type: DataTypes.JSON, allowNull: true }
});

let gemini = null;
let openai = null;

async function initLLM() {
  if (process.env.GEMINI_API_KEY) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      .getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
  }
  if (process.env.OPENAI_API_KEY) {
    const OpenAI = require('openai');
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
}

// Searches for related blog articles via SerpAPI or DuckDuckGo fallback
async function searchForReferences(query) {
  console.log(`   Searching for: "${query}"`);
  
  if (process.env.SERP_API_KEY) {
    try {
      const response = await axios.get('https://serpapi.com/search.json', {
        params: { q: `${query} blog article`, api_key: process.env.SERP_API_KEY, num: 10 }
      });
      const results = response.data.organic_results || [];
      return filterSearchResults(results.map(r => ({ title: r.title, url: r.link })));
    } catch (e) {
      console.log('   SerpAPI failed, trying DuckDuckGo...');
    }
  }
  
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' blog article')}`;
    const response = await axios.get(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const $ = cheerio.load(response.data);
    const results = [];
    $('.result').each((_, el) => {
      const titleEl = $(el).find('.result__title a');
      results.push({ title: titleEl.text().trim(), url: titleEl.attr('href') });
    });
    return filterSearchResults(results);
  } catch (e) {
    console.log('   Search failed:', e.message);
    return [];
  }
}

function filterSearchResults(results) {
  const exclude = [
    'beyondchats.com', 'youtube.com', 'twitter.com', 'facebook.com', 'linkedin.com',
    'medium.com', 'reddit.com', 'quora.com', 'pinterest.com', 'instagram.com'
  ];
  return results
    .filter(r => r.url && !exclude.some(d => r.url.includes(d)))
    .slice(0, 4);
}

async function scrapeContent(url) {
  const response = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    timeout: 10000
  });
  const $ = cheerio.load(response.data);
  $('script, style, nav, header, footer, aside, .sidebar').remove();
  
  let content = '';
  const selectors = ['article', '[role="main"]', '.post-content', '.entry-content', 'main', '.content'];
  for (const sel of selectors) {
    const el = $(sel);
    if (el.length) {
      content = el.find('p, h2, h3, li').map((_, e) => $(e).text().trim()).get().filter(t => t.length > 10).join('\n\n');
      if (content.length > 200) break;
    }
  }
  if (content.length < 200) {
    content = $('p').map((_, el) => $(el).text().trim()).get().filter(t => t.length > 20).join('\n\n');
  }
  return content.substring(0, 3000);
}

// Enhances article content using LLM with reference articles for context
async function enhanceWithLLM(article, references) {
  const prompt = `You are an expert content editor. Enhance this article based on top-ranking reference articles.

ORIGINAL ARTICLE:
Title: ${article.title}
Content:
${article.content}

REFERENCE ARTICLES:
${references.map((r, i) => `[${i+1}] "${r.title}"\n${r.content}`).join('\n\n')}

INSTRUCTIONS:
1. Rewrite to match quality of top-ranking content
2. Add proper headings (##, ###), bullet points, clear sections
3. Keep original message intact
4. Make more engaging and comprehensive
5. Add References section at the end

CITATIONS:
${references.map((r, i) => `[${i+1}] "${r.title}" - ${r.url}`).join('\n')}

Write the enhanced article in markdown:`;

  if (gemini) {
    const result = await gemini.generateContent(prompt);
    return result.response.text();
  } else if (openai) {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000
    });
    return completion.choices[0].message.content;
  }
  throw new Error('No LLM API key configured');
}

// CRUD: List all articles
app.get('/api/articles', async (req, res) => {
  try {
    const articles = await Article.findAll({ order: [['publishedDate', 'DESC']] });
    res.json({ success: true, data: articles, count: articles.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CRUD: Get single article
app.get('/api/articles/:id', async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ success: false, error: 'Article not found' });
    res.json({ success: true, data: article });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CRUD: Create article
app.post('/api/articles', async (req, res) => {
  try {
    const { title, content, author, publishedDate, originalUrl } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, error: 'Title and content required' });
    const article = await Article.create({
      title, content, author,
      publishedDate: publishedDate ? new Date(publishedDate) : null,
      originalUrl
    });
    res.status(201).json({ success: true, data: article });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CRUD: Update article
app.put('/api/articles/:id', async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ success: false, error: 'Article not found' });
    const { title, content, author, publishedDate, originalUrl, isEnhanced, enhancedContent, enhancedAt, referenceUrls } = req.body;
    await article.update({
      title: title ?? article.title,
      content: content ?? article.content,
      author: author ?? article.author,
      publishedDate: publishedDate ? new Date(publishedDate) : article.publishedDate,
      originalUrl: originalUrl ?? article.originalUrl,
      isEnhanced: isEnhanced ?? article.isEnhanced,
      enhancedContent: enhancedContent ?? article.enhancedContent,
      enhancedAt: enhancedAt ? new Date(enhancedAt) : article.enhancedAt,
      referenceUrls: referenceUrls ?? article.referenceUrls
    });
    res.json({ success: true, data: article });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CRUD: Delete article
app.delete('/api/articles/:id', async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ success: false, error: 'Article not found' });
    await article.destroy();
    res.json({ success: true, message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI Enhancement: Search, scrape references, enhance with LLM, and update article
app.post('/api/articles/:id/enhance', async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ success: false, error: 'Article not found' });
    
    if (!gemini && !openai) {
      return res.status(400).json({ 
        success: false, 
        error: 'No LLM API key configured. Add GEMINI_API_KEY to backend/.env' 
      });
    }

    console.log(`Enhancing article ${article.id}: "${article.title}"`);

    console.log('  Searching for references...');
    const searchResults = await searchForReferences(article.title);
    if (searchResults.length === 0) {
      return res.status(500).json({ success: false, error: 'Could not find reference articles' });
    }

    console.log('  Scraping reference articles...');
    const references = [];
    for (const result of searchResults) {
      try {
        const content = await scrapeContent(result.url);
        if (content.length > 200) references.push({ ...result, content });
      } catch (e) {
        console.log(`  Failed to scrape ${result.url}`);
      }
    }
    if (references.length === 0) {
      return res.status(500).json({ success: false, error: 'Could not scrape reference articles' });
    }

    console.log('  Calling LLM...');
    const enhancedContent = await enhanceWithLLM(article, references);

    await article.update({
      isEnhanced: true,
      enhancedContent,
      enhancedAt: new Date(),
      referenceUrls: references.map(r => ({ url: r.url, title: r.title }))
    });

    console.log(`  Article ${article.id} enhanced!`);
    res.json({ success: true, data: article, message: 'Article enhanced successfully' });
  } catch (error) {
    console.error('Enhancement error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// BeyondChats: List available articles from a blog page
app.get('/api/beyondchats/articles', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 14;
    const url = `https://beyondchats.com/blogs/page/${page}/`;
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const $ = cheerio.load(response.data);
    const articles = [];
    $('article, .elementor-post').each((_, el) => {
      const $el = $(el);
      const title = $el.find('h2 a, h3 a, .elementor-post__title a').first().text().trim();
      const link = $el.find('h2 a, h3 a, .elementor-post__title a').first().attr('href');
      const excerpt = $el.find('.excerpt, p').first().text().trim().substring(0, 200);
      if (title && link) articles.push({ title, url: link, excerpt: excerpt || '', author: 'BeyondChats Team' });
    });
    res.json({ success: true, data: articles, page, count: articles.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// BeyondChats: Import article by URL
app.post('/api/beyondchats/scrape', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.includes('beyondchats.com')) {
      return res.status(400).json({ success: false, error: 'Valid BeyondChats URL required' });
    }
    const existing = await Article.findOne({ where: { originalUrl: url } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Already imported', existingId: existing.id });
    }
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const $ = cheerio.load(response.data);
    const title = $('h1').first().text().trim();
    const contentElements = [];
    $('.entry-content, .elementor-widget-theme-post-content, .post-content').find('p, h2, h3, h4, ul, ol').each((_, el) => {
      const text = $(el).text().trim();
      const tag = el.tagName.toLowerCase();
      if (text.length > 10) {
        if (tag.startsWith('h')) contentElements.push(`${'#'.repeat(parseInt(tag[1]) || 2)} ${text}`);
        else contentElements.push(text);
      }
    });
    const content = contentElements.join('\n\n');
    if (!title || content.length < 100) {
      return res.status(400).json({ success: false, error: 'Could not extract article content' });
    }
    const article = await Article.create({
      title, content, author: 'BeyondChats Team', originalUrl: url, scrapedAt: new Date()
    });
    res.status(201).json({ success: true, data: article });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', llm: gemini ? 'gemini' : openai ? 'openai' : 'none' });
});

async function startServer() {
  try {
    await initLLM();
    await sequelize.sync();
    console.log('Database synchronized');
    console.log('LLM:', gemini ? 'Gemini ready' : openai ? 'OpenAI ready' : 'No LLM configured');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

module.exports = { app, Article, sequelize, startServer };
if (require.main === module) startServer();
