const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

const SERP_API_KEY = process.env.SERP_API_KEY;
const SERP_API_URL = 'https://serpapi.com/search.json';

// Returns top 2 non-BeyondChats blog/article URLs for a given query
async function searchGoogle(query) {
  console.log(`   Searching for: "${query}"`);
  
  if (SERP_API_KEY) return await searchWithSerpAPI(query);
  return await searchGoogleDirect(query);
}

async function searchWithSerpAPI(query) {
  try {
    const response = await axios.get(SERP_API_URL, {
      params: { q: `${query} blog article`, api_key: SERP_API_KEY, num: 10 }
    });
    const results = response.data.organic_results || [];
    return filterResults(results.map(r => ({ title: r.title, url: r.link, snippet: r.snippet })));
  } catch (error) {
    console.log(`   SerpAPI error: ${error.message}`);
    return [];
  }
}

async function searchGoogleDirect(query) {
  try {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query + ' blog article')}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    const $ = cheerio.load(response.data);
    const results = [];

    $('div.g').each((_, element) => {
      const titleEl = $(element).find('h3').first();
      const linkEl = $(element).find('a').first();
      const snippetEl = $(element).find('.VwiC3b, .st').first();

      const title = titleEl.text().trim();
      const url = linkEl.attr('href');
      const snippet = snippetEl.text().trim();

      if (title && url && url.startsWith('http')) {
        results.push({ title, url, snippet });
      }
    });

    return filterResults(results);
  } catch (error) {
    console.log(`   Direct search error: ${error.message}`);
    return await searchDuckDuckGo(query);
  }
}

async function searchDuckDuckGo(query) {
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' blog article')}`;
    const response = await axios.get(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    const $ = cheerio.load(response.data);
    const results = [];

    $('.result').each((_, element) => {
      const titleEl = $(element).find('.result__title a');
      const url = titleEl.attr('href');
      const title = titleEl.text().trim();
      const snippet = $(element).find('.result__snippet').text().trim();
      if (title && url) results.push({ title, url, snippet });
    });

    return filterResults(results);
  } catch (error) {
    console.log(`   DuckDuckGo search error: ${error.message}`);
    return [];
  }
}

function filterResults(results) {
  const excludeDomains = [
    'beyondchats.com', 'youtube.com', 'twitter.com', 'facebook.com',
    'instagram.com', 'linkedin.com', 'google.com', 'wikipedia.org'
  ];

  const articleIndicators = [
    '/blog', '/article', '/post', '/news', 'blog.', 'medium.com',
    'substack.com', 'forbes.com', 'techcrunch.com', 'hubspot.com'
  ];

  return results
    .filter(r => {
      const url = r.url.toLowerCase();
      const isExcluded = excludeDomains.some(domain => url.includes(domain));
      if (isExcluded) return false;
      const isLikelyArticle = articleIndicators.some(ind => url.includes(ind)) || !url.endsWith('.pdf');
      return isLikelyArticle;
    })
    .slice(0, 2);
}

module.exports = { searchGoogle, searchWithSerpAPI, searchGoogleDirect };
