import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Loader2, ExternalLink, RefreshCw } from 'lucide-react'
import ReactPaginate from 'react-paginate'

function ScrapeArticle({ apiUrl, onArticleCreated }) {
  const navigate = useNavigate()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(null)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0) // react-paginate uses 0-indexed
  const [totalPages, setTotalPages] = useState(0)
  const [loadingPages, setLoadingPages] = useState(true)

  // Fetch available pages on mount
  useEffect(() => {
    const fetchPages = async () => {
      try {
        setLoadingPages(true)
        const response = await fetch(`${apiUrl}/beyondchats/pages`)
        const data = await response.json()
        if (data.success) {
          setTotalPages(data.total || data.pages.length)
        }
      } catch {
        setTotalPages(15)
      } finally {
        setLoadingPages(false)
      }
    }
    fetchPages()
  }, [apiUrl])

  useEffect(() => { 
    fetchAvailableArticles() 
  }, [page])

  const fetchAvailableArticles = async () => {
    try {
      setLoading(true)
      setError(null)
      // Convert 0-indexed to 1-indexed for API
      const response = await fetch(`${apiUrl}/beyondchats/articles?page=${page + 1}`)
      const data = await response.json()
      if (data.success) {
        setArticles([...data.data].reverse())
      } else {
        setError('Failed to fetch articles from BeyondChats')
      }
    } catch {
      setError('Unable to connect to API')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (articleUrl) => {
    try {
      setImporting(articleUrl)
      setError(null)
      const response = await fetch(`${apiUrl}/beyondchats/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: articleUrl })
      })
      const data = await response.json()
      if (data.success) {
        if (onArticleCreated) onArticleCreated()
        navigate(`/article/${data.data.id}`)
      } else {
        if (data.existingId) {
          navigate(`/article/${data.existingId}`)
        } else {
          setError(data.error || 'Failed to import article')
        }
      }
    } catch {
      setError('Failed to import article')
    } finally {
      setImporting(null)
    }
  }

  const handlePageChange = ({ selected }) => {
    setPage(selected)
  }

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="h-4 w-4 shrink-0" /> Back to Articles
      </button>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="title-xl">Import Article</h1>
          <p className="mt-2 text-muted-foreground">Select an article from BeyondChats blogs to import</p>
        </div>
        <button onClick={fetchAvailableArticles} disabled={loading} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="p-4 border border-border rounded-lg">
              <div className="h-5 w-3/4 bg-muted animate-pulse rounded mb-3" />
              <div className="h-4 w-full bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No articles found on this page.</p>
          <p className="text-sm mt-2">Try a different page number.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article, index) => (
            <div key={index} className="p-4 border border-border rounded-lg hover:border-muted-foreground/30">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{article.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{article.author}</span>
                    {article.date && <span>{article.date}</span>}
                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground">
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => handleImport(article.url)}
                  disabled={importing === article.url}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-foreground text-background rounded-md hover:opacity-90 disabled:opacity-50 shrink-0"
                >
                  {importing === article.url ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing...</> : <><Download className="h-4 w-4" /> Import</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination at bottom */}
      {!loadingPages && totalPages > 0 && (
        <div className="mt-8 pt-6 border-t border-border">
          <ReactPaginate
            pageCount={totalPages}
            pageRangeDisplayed={3}
            marginPagesDisplayed={1}
            onPageChange={handlePageChange}
            forcePage={page}
            containerClassName="flex items-center justify-center gap-1"
            pageClassName=""
            pageLinkClassName="px-3 py-1.5 text-sm rounded-md bg-muted text-muted-foreground hover:text-foreground transition-colors"
            activeClassName=""
            activeLinkClassName="!bg-foreground !text-background"
            previousClassName=""
            previousLinkClassName="px-3 py-1.5 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            nextClassName=""
            nextLinkClassName="px-3 py-1.5 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            breakClassName=""
            breakLinkClassName="px-2 text-muted-foreground"
            disabledClassName="opacity-30 cursor-not-allowed"
            disabledLinkClassName="pointer-events-none"
            previousLabel="← Prev"
            nextLabel="Next →"
            breakLabel="..."
            renderOnZeroPageCount={null}
          />
          <p className="text-center mt-3 text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
        </div>
      )}

      <p className="mt-8 text-xs text-muted-foreground">
        After importing, click "Enhance with AI" on the article page to enhance it using AI.
      </p>
    </div>
  )
}

export default ScrapeArticle
