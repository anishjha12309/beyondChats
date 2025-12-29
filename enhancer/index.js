const axios = require('axios');
const { searchGoogle } = require('./googleSearch');
const { scrapeArticleContent } = require('./scraper');
const { enhanceWithLLM } = require('./llmEnhancer');
require('dotenv').config();

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

// Main pipeline: fetches articles from API and enhances each with AI
async function enhanceAllArticles() {
  console.log('='.repeat(60));
  console.log('BeyondChats Article Enhancer');
  console.log('='.repeat(60));

  try {
    console.log('\n📥 Fetching articles from API...');
    const articlesResponse = await axios.get(`${API_BASE_URL}/articles`);
    const articles = articlesResponse.data.data;
    console.log(`Found ${articles.length} articles to process\n`);

    for (const article of articles) {
      if (article.isEnhanced) {
        console.log(`⏭️  Skipping already enhanced: ${article.title}`);
        continue;
      }

      console.log(`\n${'─'.repeat(60)}`);
      console.log(`📝 Processing: ${article.title}`);
      console.log(`${'─'.repeat(60)}`);

      try {
        await enhanceArticle(article);
      } catch (error) {
        console.error(`❌ Failed to enhance article: ${error.message}`);
      }

      await delay(2000);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Enhancement pipeline completed!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('Pipeline error:', error.message);
    throw error;
  }
}

async function enhanceArticle(article) {
  console.log('\n🔍 Searching Google for related articles...');
  const searchResults = await searchGoogle(article.title);
  
  if (searchResults.length === 0) {
    console.log('⚠️  No search results found, skipping enhancement');
    return;
  }

  console.log(`Found ${searchResults.length} relevant results`);
  searchResults.forEach((result, i) => {
    console.log(`   ${i + 1}. ${result.title}`);
    console.log(`      ${result.url}`);
  });

  console.log('\n📄 Scraping reference articles...');
  const referenceArticles = [];
  
  for (const result of searchResults.slice(0, 2)) {
    try {
      console.log(`   Scraping: ${result.url}`);
      const content = await scrapeArticleContent(result.url);
      if (content && content.length > 200) {
        referenceArticles.push({
          title: result.title,
          url: result.url,
          content: content.substring(0, 5000)
        });
      }
    } catch (error) {
      console.log(`   ⚠️  Failed to scrape: ${error.message}`);
    }
    await delay(500);
  }

  if (referenceArticles.length === 0) {
    console.log('⚠️  No reference content scraped, skipping enhancement');
    return;
  }

  console.log(`\n✅ Scraped ${referenceArticles.length} reference articles`);

  console.log('\n🤖 Enhancing article with AI...');
  const enhancedContent = await enhanceWithLLM(article, referenceArticles);

  if (!enhancedContent) {
    console.log('⚠️  LLM enhancement failed');
    return;
  }

  console.log('\n📤 Publishing enhanced article...');
  const referenceUrls = referenceArticles.map(ref => ({ title: ref.title, url: ref.url }));

  await axios.put(`${API_BASE_URL}/articles/${article.id}`, {
    isEnhanced: true,
    enhancedContent,
    enhancedAt: new Date().toISOString(),
    referenceUrls
  });

  console.log('✅ Article enhanced and published successfully!');
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { enhanceAllArticles, enhanceArticle };

if (require.main === module) {
  enhanceAllArticles()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
