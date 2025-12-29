const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

let openai = null;
let gemini = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

if (process.env.GEMINI_API_KEY) {
  gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    .getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
}

// Enhances article using LLM based on reference articles for improved SEO and quality
async function enhanceWithLLM(originalArticle, referenceArticles) {
  const prompt = buildEnhancementPrompt(originalArticle, referenceArticles);

  if (gemini) return await enhanceWithGemini(prompt);
  if (openai) return await enhanceWithOpenAI(prompt);
  throw new Error('No LLM API key configured. Set GEMINI_API_KEY or OPENAI_API_KEY in .env');
}

function buildEnhancementPrompt(originalArticle, referenceArticles) {
  const citations = referenceArticles.map((ref, i) => 
    `[${i + 1}] "${ref.title}" - ${ref.url}`
  ).join('\n');

  const refContents = referenceArticles.map((ref, i) => 
    `--- Reference Article ${i + 1}: "${ref.title}" ---\n${ref.content.substring(0, 2500)}`
  ).join('\n\n');

  return `You are an expert content editor. Your task is to enhance and improve an article while maintaining its core message.

ORIGINAL ARTICLE:
Title: ${originalArticle.title}
Content:
${originalArticle.content}

REFERENCE ARTICLES (top-ranking articles on similar topics):
${refContents}

INSTRUCTIONS:
1. Analyze the structure, formatting, and style of the reference articles
2. Rewrite the original article to match the quality and depth of the top-ranking content
3. Improve SEO by adding relevant subheadings, bullet points, and clear sections
4. Keep the original message and key points intact
5. Make the content more engaging and comprehensive
6. Add a "References" section at the end citing the reference articles

OUTPUT FORMAT:
- Write in markdown format
- Use proper headings (##, ###)
- Include bullet points where appropriate
- Add the citations section at the end

CITATIONS TO INCLUDE:
${citations}

Write the enhanced article now:`;
}

async function enhanceWithGemini(prompt) {
  try {
    const result = await gemini.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini API error:', error.message);
    if (openai) {
      console.log('Falling back to OpenAI...');
      return await enhanceWithOpenAI(prompt);
    }
    throw error;
  }
}

async function enhanceWithOpenAI(prompt) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert content editor specializing in creating high-quality, SEO-optimized blog articles.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 4000,
      temperature: 0.7
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    throw error;
  }
}

module.exports = { enhanceWithLLM };
