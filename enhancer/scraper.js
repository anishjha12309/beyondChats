const axios = require('axios');
const cheerio = require('cheerio');

// Scrapes and extracts main article content from a URL
async function scrapeArticleContent(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    $('script, style, nav, header, footer, aside, .sidebar, .comments, .advertisement, .ad').remove();

    const contentSelectors = [
      'article', '[role="main"]', '.post-content', '.article-content',
      '.entry-content', '.blog-content', '.main-content', 'main', '.content'
    ];

    let content = '';

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length) {
        content = element.find('p, h1, h2, h3, h4, h5, h6, li')
          .map((_, el) => {
            const tag = el.tagName.toLowerCase();
            const text = $(el).text().trim();
            if (!text || text.length < 10) return '';
            if (tag === 'h1') return `# ${text}`;
            if (tag === 'h2') return `## ${text}`;
            if (tag === 'h3') return `### ${text}`;
            if (tag === 'h4') return `#### ${text}`;
            if (tag === 'li') return `• ${text}`;
            return text;
          })
          .get()
          .filter(t => t)
          .join('\n\n');
        
        if (content.length > 200) break;
      }
    }

    if (!content || content.length < 200) {
      content = $('p')
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(t => t && t.length > 20)
        .join('\n\n');
    }

    return cleanContent(content);
  } catch (error) {
    throw new Error(`Failed to scrape ${url}: ${error.message}`);
  }
}

function cleanContent(content) {
  return content
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/Share on (Facebook|Twitter|LinkedIn|Email)/gi, '')
    .replace(/Read more\.\.\./gi, '')
    .replace(/Subscribe to our newsletter/gi, '')
    .replace(/Cookie policy/gi, '')
    .trim();
}

module.exports = { scrapeArticleContent };
