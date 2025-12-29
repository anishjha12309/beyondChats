import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider'
import ArticleList from './components/ArticleList'
import ArticleDetail from './components/ArticleDetail'
import ScrapeArticle from './components/ScrapeArticle'
import Header from './components/Header'
import './index.css'

function App() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

  useEffect(() => { fetchArticles() }, [])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/articles`)
      const data = await response.json()
      if (data.success) {
        setArticles(data.data)
      } else {
        setError('Failed to fetch articles')
      }
    } catch {
      setError('Unable to connect to API. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="beyondchats-theme">
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Routes>
              <Route path="/" element={<ArticleList articles={articles} loading={loading} error={error} />} />
              <Route path="/article/:id" element={<ArticleDetail apiUrl={API_URL} onArticleDeleted={fetchArticles} />} />
              <Route path="/import" element={<ScrapeArticle apiUrl={API_URL} onArticleCreated={fetchArticles} />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
