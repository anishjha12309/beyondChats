import { Link } from 'react-router-dom'
import { Download, AlertCircle } from 'lucide-react'

function ArticleList({ articles, loading, error }) {
  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  }

  const getExcerpt = (content) => {
    if (!content) return ''
    return content
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*/g, '')
      .replace(/\n/g, ' ')
      .substring(0, 140) + '...'
  }

  if (loading) {
    return (
      <div className="space-y-12">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="title-xl">Articles</h1>
            <p className="mt-3 text-lg text-muted-foreground">Explore our collection of articles</p>
          </div>
        </div>
        <div className="grid gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="py-6 border-b border-border">
              <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
              <div className="mt-3 h-4 w-1/2 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-12">
        <div className="flex items-start justify-between">
          <h1 className="title-xl">Articles</h1>
          <Link to="/import" className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-sm font-medium rounded-lg hover:opacity-90">
            <Download className="h-4 w-4" />
            Import
          </Link>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-500">{error}</p>
            <p className="mt-1 text-sm text-muted-foreground">Make sure the backend server is running on port 3000.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="title-xl">Articles</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            {articles.length} articles — original and AI-enhanced versions
          </p>
        </div>
        <Link to="/import" className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-sm font-medium rounded-lg hover:opacity-90 shrink-0">
          <Download className="h-4 w-4" />
          Import
        </Link>
      </div>
      
      <div className="divide-y divide-border">
        {articles.map(article => (
          <Link key={article.id} to={`/article/${article.id}`} className="group block py-6 first:pt-0">
            <article className="space-y-3">
              <h2 className="title-lg group-hover:text-muted-foreground">{article.title}</h2>
              <p className="text-muted-foreground leading-relaxed max-w-3xl">{getExcerpt(article.content)}</p>
              <div className="flex items-center gap-4 pt-1">
                <span className="text-sm text-muted-foreground">{article.author || 'Unknown'}</span>
                <span className="text-sm text-muted-foreground">{formatDate(article.publishedDate)}</span>
                {article.isEnhanced && <span className="tag tag-success">Enhanced</span>}
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default ArticleList
