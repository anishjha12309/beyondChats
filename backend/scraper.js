const axios = require('axios');
const cheerio = require('cheerio');
const { Article, sequelize } = require('./server');

const BASE_URL = 'https://beyondchats.com/blogs';

// Scrapes the 5 oldest articles from BeyondChats blog (pages 14-15)
async function scrapeOldestArticles() {
  console.log('Starting to scrape oldest articles from BeyondChats...');
  const articles = [];

  try {
    console.log('Fetching page 15...');
    const page15Articles = await scrapePage(`${BASE_URL}/page/15/`);
    articles.push(...page15Articles);

    console.log('Fetching page 14...');
    const page14Articles = await scrapePage(`${BASE_URL}/page/14/`);
    articles.push(...page14Articles);

    const oldestFive = articles.slice(0, 5);
    console.log(`Found ${oldestFive.length} oldest articles to scrape content from...`);

    const fullArticles = [];
    for (const article of oldestFive) {
      console.log(`Scraping content from: ${article.title}`);
      const fullContent = await scrapeArticleContent(article.originalUrl);
      fullArticles.push({
        ...article,
        content: fullContent.content || article.excerpt,
        author: fullContent.author || article.author
      });
      await delay(500);
    }

    return fullArticles;
  } catch (error) {
    console.error('Error scraping articles:', error.message);
    throw error;
  }
}

async function scrapePage(url) {
  const response = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });

  const $ = cheerio.load(response.data);
  const articles = [];

  $('article').each((_, element) => {
    const $article = $(element);
    const titleElement = $article.find('h2 a, .entry-title a, .ct-entry-title a').first();
    const title = titleElement.text().trim();
    const originalUrl = titleElement.attr('href');
    const excerpt = $article.find('.entry-content, .excerpt, p').first().text().trim();
    const author = $article.find('.author, .ct-meta-element-author a, [rel="author"]').first().text().trim();
    const dateText = $article.find('.date, time, .ct-meta-element-date').first().text().trim();
    const publishedDate = parseDate(dateText);

    if (title && originalUrl) {
      articles.push({
        title,
        originalUrl,
        excerpt: excerpt.substring(0, 500),
        author: author || 'Unknown',
        publishedDate
      });
    }
  });

  return articles;
}

async function scrapeArticleContent(url) {
  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    const $ = cheerio.load(response.data);
    const contentSelectors = ['.entry-content', '.post-content', 'article .content', '.ct-post-content', 'main article'];

    let content = '';
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length) {
        content = element.find('p, h1, h2, h3, h4, li').map((_, el) => {
          const tag = el.tagName.toLowerCase();
          const text = $(el).text().trim();
          if (tag.startsWith('h')) return `\n## ${text}\n`;
          return text;
        }).get().join('\n\n');
        break;
      }
    }

    const author = $('[rel="author"], .author-name, .ct-meta-element-author a').first().text().trim();
    return { content: content || 'Content could not be extracted', author: author || null };
  } catch (error) {
    console.error(`Error scraping article content from ${url}:`, error.message);
    return { content: '', author: null };
  }
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const formats = [/(\w+ \d{1,2}, \d{4})/, /(\d{1,2} \w+ \d{4})/, /(\d{4}-\d{2}-\d{2})/];
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      const parsed = new Date(match[1]);
      if (!isNaN(parsed.getTime())) return parsed;
    }
  }
  return null;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function saveArticlesToDatabase(articles) {
  console.log('Saving articles to database...');
  await sequelize.sync();
  
  const savedArticles = [];
  for (const articleData of articles) {
    const existing = await Article.findOne({ where: { originalUrl: articleData.originalUrl } });
    if (existing) {
      console.log(`Article already exists: ${articleData.title}`);
      savedArticles.push(existing);
    } else {
      const article = await Article.create(articleData);
      console.log(`Saved: ${articleData.title}`);
      savedArticles.push(article);
    }
  }
  
  return savedArticles;
}

async function runScraper() {
  try {
    console.log('='.repeat(50));
    console.log('BeyondChats Article Scraper');
    console.log('='.repeat(50));
    
    const articles = await scrapeOldestArticles();
    const saved = await saveArticlesToDatabase(articles);
    
    console.log('='.repeat(50));
    console.log(`Successfully scraped and saved ${saved.length} articles!`);
    console.log('='.repeat(50));
    
    saved.forEach((article, i) => {
      console.log(`${i + 1}. ${article.title}`);
      console.log(`   URL: ${article.originalUrl}`);
      console.log(`   Author: ${article.author}`);
      console.log('');
    });

    return saved;
  } catch (error) {
    console.error('Scraper failed:', error);
    throw error;
  }
}

module.exports = { scrapeOldestArticles, scrapePage, scrapeArticleContent, saveArticlesToDatabase, runScraper };

if (require.main === module) {
  runScraper()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
