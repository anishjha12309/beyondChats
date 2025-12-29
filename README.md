# BeyondChats Article Enhancement System

<div align="center">

![BeyondChats Logo](https://img.shields.io/badge/BeyondChats-Assignment-black?style=for-the-badge&logo=react&logoColor=61DAFB)
![Status](https://img.shields.io/badge/Status-Complete-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**A professional full-stack solution for scraping, analyzing, and enhancing content using State-of-the-Art AI.**

[Live Demo 🚀](https://your-deployment-url.vercel.app) • [API Documentation 📖](#api-endpoints) • [Report Bug 🐛](https://github.com/anishjha12309/beyondChats/issues)

</div>

---

## 🎨 Overview

This project is a sophisticated **full-stack application** designed to automate the process of enhancing blog content. It seamlessly integrates web scraping, intelligent search, and Large Language Models (LLMs) to transform legacy articles into improved, thoroughly cited, and engaging pieces of content.

The system is built with a focus on **robustness, aesthetics, and user experience**, featuring a dark-mode-first design inspired by top-tier creative platforms.

---

## 🏗️ System Architecture

The following diagram illustrates the high-level data flow and component interaction within the system.

```mermaid
graph TD
    subgraph Client ["🖥️ Frontend (React + Vite)"]
        UI[User Interface]
        State[State Management]
    end

    subgraph Server ["⚙️ Backend (Express.js)"]
        API[REST API Layer]
        Scraper[Cheerio Scraper]
        DB[(Database: Neon PostgreSQL)]
        Orchestrator[Enhancement Logic]
    end

    subgraph External ["☁️ External Services"]
        BC[BeyondChats Blog]
        Search[DuckDuckGo / SerpAPI]
        Gemini[Google Gemini 2.5 Flash Lite]
    end

    %% Flow
    UI -->|Import Request| API
    API -->|Scrape| Scraper
    Scraper -->|Fetch Content| BC
    Scraper -->|Store| DB
    
    UI -->|Enhance Request| API
    API -->|Trigger| Orchestrator
    Orchestrator -->|Search References| Search
    Orchestrator -->|Generate Content| Gemini
    Gemini -->|Enhanced Text| DB
    
    DB -->|Serve Data| API
    API -->|JSON Response| UI

    %% Styling
    style Client fill:#1a1a1a,stroke:#61DAFB,stroke-width:2px,color:#fff
    style Server fill:#1a1a1a,stroke:#4CAF50,stroke-width:2px,color:#fff
    style External fill:#1a1a1a,stroke:#FF5722,stroke-width:2px,color:#fff
```

### 🧠 Data Flow Pipeline

1.  **Ingestion (Import)**: Users browse BeyondChats blog pages (14, 15, etc.) directly in the app. The system scrapes the chosen article's content while filtering out noise.
2.  **Persistence**: Data is normalized and stored.
    *   **Development**: Uses `SQLite` for zero-config local setup.
    *   **Production**: Uses `Neon (PostgreSQL)` for robust, scalable storage.
3.  **Enhancement**:
    *   **Contextual Search**: Queries Google/DuckDuckGo for high-authority reference material.
    *   **Intelligence Injection**: **Google Gemini 2.5 Flash Lite** processes the original content alongside scraped references.
    *   **Synthesis**: Generates a new, engaging version with correct citations and Markdown formatting.
4.  **Presentation**: The React frontend renders a dual-view interface, allowing seamless comparison between "Original" and "Enhanced" versions.

---

## ✨ Key Features

### Phase 1: Robust Backend Foundation ✅
*   **Dual Database Support**: Seamlessly finds `DATABASE_URL` to switch between SQLite (local) and **Neon PostgreSQL** (production).
*   **Precision Scraping**: Custom-built `Cheerio` scraper optimized for BeyondChats DOM.
*   **Resilient API**: RESTful endpoints with error handling and rate limiting protection.

### Phase 2: AI-Powered Engine ✅
*   **Smart Search**: Fallback-enabled search (SerpAPI → DuckDuckGo) to ensure reference discovery.
*   **Context-Aware Prompts**: Engineered prompts for preserving author voice.
*   **One-Click Enhancement**: "Enhance with AI" button directly in the UI.

### Phase 3: Premium Frontend Experience ✅
*   **Modern UI**: Glassmorphism, dark/light themes, and responsive design.
*   **Import Workflow**: Browse and import directly from external blog pages.
*   **Comparison View**: Tabbed interface to switch between original and AI-enhanced versions.

---

## 🛠️ Technology Stack

| Component | Tech | Description |
| :--- | :--- | :--- |
| **Frontend** | ![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white) | React 18, Vite, Lucide Icons, React Router |
| **Backend** | ![Node](https://img.shields.io/badge/Node.js-43853D?style=flat-square&logo=node.js&logoColor=white) ![Express](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white) | Express.js, Axios, Cheerio, Dotenv |
| **Database** | ![Neon](https://img.shields.io/badge/Neon-00E599?style=flat-square&logo=postgresql&logoColor=white) | Neon (Serverless PostgreSQL), Sequelize ORM |
| **AI & ML** | ![Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=flat-square&logo=google&logoColor=white) | Google Generative AI SDK (Gemini 2.5 Flash Lite) |

---

## 🚀 Local Setup Instructions

### Prerequisites
*   Node.js (v18+)
*   npm

### 1. Clone the Repository
```bash
git clone https://github.com/anishjha12309/beyondChats.git
cd beyondchats
```

### 2. Configure Backend
```bash
cd backend
npm install
```
Create `.env` in `backend/`:
```env
# AI Configuration (Required)
GEMINI_API_KEY=your_gemini_key

# Database (Optional - defaults to local SQLite if omitted)
# For production use Neon:
DATABASE_URL=postgres://user:pass@ep-xyz.neon.tech/neondb

# Search (Optional)
SERP_API_KEY=your_serp_key
```

### 3. Start Backend
```bash
npm run dev
```
*Runs on `http://localhost:3000` with hot-reloading (nodemon).*

### 4. Start Frontend
New terminal:
```bash
cd frontend
npm install
npm run dev
```
*Runs on `http://localhost:5173`.*

---

## 🧪 Usage Workflow

1.  **Import**: Go to the "Import" page, select a blog page, and click **Import** on an article.
2.  **Enhance**: Open the article and click **"Enhance with AI"** (top right).
3.  **View**: Wait ~30s for the process to complete, then view the "Enhanced" tab with citations.

---

## 📦 Deployment

### Backend (Render)
1.  Push to GitHub.
2.  Create Web Service on [Render](https://render.com).
3.  Set Build Command: `npm install`
4.  Set Start Command: `npm start`
5.  Add Env Vars: `GEMINI_API_KEY`, `DATABASE_URL` (Neon Connection String), `Node 18+`.

### Frontend (Vercel)
1.  Import `frontend` folder to [Vercel](https://vercel.com).
2.  Set Env Var: `VITE_API_URL` = `https://your-render-app.onrender.com/api`.
3.  Deploy.
