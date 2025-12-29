import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { ArrowLeft, ExternalLink, Trash2, Sparkles, Loader2 } from 'lucide-react'

function ArticleDetail({ apiUrl, onArticleDeleted }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('enhanced')
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [enhancing, setEnhancing] = useState(false)
  const [enhanceError, setEnhanceError] = useState(null)

  useEffect(() => { fetchArticle() }, [id])

  const fetchArticle = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${apiUrl}/articles/${id}`)
      const data = await response.json()
      if (data.success) {
        setArticle(data.data)
        setActiveTab(data.data.isEnhanced ? 'enhanced' : 'original')
      } else {
        setError('Article not found')
      }
    } catch {
      setError('Failed to load article')
    } finally {
      setLoading(false)
    }
  }

  const handleEnhance = async () => {
    try {
      setEnhancing(true)
      setEnhanceError(null)
      const response = await fetch(`${apiUrl}/articles/${id}/enhance`, { method: 'POST' })
      const data = await response.json()
      if (data.success) {
        setArticle(data.data)
        setActiveTab('enhanced')
      } else {
        setEnhanceError(data.error || 'Enhancement failed')
      }
    } catch {
      setEnhanceError('Failed to enhance article. Please try again.')
    } finally {
      setEnhancing(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      const response = await fetch(`${apiUrl}/articles/${id}`, { method: 'DELETE' })
      const data = await response.json()
      if (data.success) {
        if (onArticleDeleted) onArticleDeleted()
        navigate('/')
      } else {
        setError('Failed to delete article')
      }
    } catch {
      setError('Failed to delete article')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="max-w-3xl">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="space-y-4">
          <div className="h-10 w-3/4 bg-muted animate-pulse rounded" />
          <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
          <div className="mt-8 h-64 bg-muted animate-pulse rounded" />
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="max-w-3xl">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-red-500">{error || 'Article not found'}</p>
        </div>
      </div>
    )
  }

  const displayContent = activeTab === 'enhanced' && article.enhancedContent ? article.enhancedContent : article.content

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground group">
          <ArrowLeft className="h-4 w-4 shrink-0" /> Back to Articles
        </button>
        
        <div className="flex items-center gap-4">
          {!article.isEnhanced && (
            <button
              onClick={handleEnhance}
              disabled={enhancing}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md hover:bg-emerald-500/20 disabled:opacity-50"
            >
              {enhancing ? <><Loader2 className="h-4 w-4 animate-spin" /> Enhancing...</> : <><Sparkles className="h-4 w-4" /> Enhance with AI</>}
            </button>
          )}
          <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-red-500">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      {enhanceError && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-500">{enhanceError}</p>
        </div>
      )}

      {enhancing && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching references, scraping content, and enhancing with AI... This may take 30-60 seconds.
          </p>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Delete Article?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              This will permanently delete "{article.title}". This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground" disabled={deleting}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          {article.isEnhanced ? <span className="tag tag-success">AI Enhanced</span> : <span className="tag">Original</span>}
        </div>
        <h1 className="title-xl mb-4">{article.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>{article.author || 'Unknown Author'}</span>
          <span>{formatDate(article.publishedDate)}</span>
          {article.originalUrl && (
            <a href={article.originalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground">
              Source <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </header>

      {article.isEnhanced && (
        <div className="flex gap-1 mb-8 p-1 bg-muted rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('original')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'original' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Original
          </button>
          <button
            onClick={() => setActiveTab('enhanced')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'enhanced' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Enhanced
          </button>
        </div>
      )}

      <article className="prose-abduzeedo">
        {activeTab === 'enhanced' && article.isEnhanced && (
          <div className="mb-8 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            <p className="text-sm text-emerald-600 dark:text-emerald-400 m-0">
              Enhanced on {formatDate(article.enhancedAt)} using AI analysis of top-ranking content.
            </p>
          </div>
        )}
        
        <ReactMarkdown>{displayContent}</ReactMarkdown>
        
        {activeTab === 'enhanced' && article.referenceUrls?.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border">
            <h3 className="text-lg font-semibold mb-4">References</h3>
            <ul className="space-y-2 list-none p-0 m-0">
              {article.referenceUrls.map((ref, index) => (
                <li key={index} className="p-0 m-0">
                  <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground flex items-start gap-2 no-underline">
                    <span className="text-muted-foreground/50">[{index + 1}]</span>
                    <span>{ref.title || ref.url}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </div>
  )
}

export default ArticleDetail
