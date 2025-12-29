# Backend API

Express.js backend with SQLite database and AI enhancement capabilities.

## Quick Start

```bash
npm install
npm start
```

Server runs on `http://localhost:3000`

## Environment Variables

Create a `.env` file:
```
GEMINI_API_KEY=your_gemini_api_key
SERP_API_KEY=your_serp_api_key (optional)
OPENAI_API_KEY=your_openai_key (optional)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/articles` | List all articles |
| GET | `/api/articles/:id` | Get article by ID |
| POST | `/api/articles` | Create new article |
| PUT | `/api/articles/:id` | Update article |
| DELETE | `/api/articles/:id` | Delete article |
| POST | `/api/articles/:id/enhance` | AI enhance article |
| GET | `/api/beyondchats/articles?page=14` | List BeyondChats blog articles |
| POST | `/api/beyondchats/scrape` | Import article from BeyondChats |

## Deployment

See [DEPLOYMENT.md](../DEPLOYMENT.md) for Render deployment instructions.
