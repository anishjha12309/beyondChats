# Backend - BeyondChats Article API

Express.js REST API with SQLite database for managing BeyondChats articles.

## Setup

```bash
npm install
```

## Run Server

```bash
npm start
```

Server runs at `http://localhost:3000`

## Run Scraper

```bash
npm run scrape
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/articles` | List all articles |
| GET | `/api/articles/:id` | Get single article |
| POST | `/api/articles` | Create article |
| PUT | `/api/articles/:id` | Update article |
| DELETE | `/api/articles/:id` | Delete article |
| GET | `/api/health` | Health check |
