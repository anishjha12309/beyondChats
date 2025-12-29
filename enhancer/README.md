# Enhancer - BeyondChats Article Enhancement Pipeline

Node.js script that enhances articles using AI by analyzing top-ranking content.

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` and add your API keys:
- `GEMINI_API_KEY` - Google Gemini (recommended, has free tier)
- `OPENAI_API_KEY` - OpenAI GPT (optional)
- `SERP_API_KEY` - SerpAPI for Google search (optional)

## Run

```bash
# Make sure backend is running first!
npm start
```

## Pipeline Flow

1. Fetch articles from backend API
2. Search Google for each article's title
3. Scrape top 2 related articles from search results
4. Use LLM to enhance original article based on top-ranking content
5. Publish enhanced article back via API with citations
