import { Link } from 'react-router-dom'
import { ThemeToggle } from './theme-toggle'
import { useTheme } from './theme-provider'

function Header() {
  const { theme } = useTheme()
  
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 hover:opacity-70">
            <svg className="h-7 w-7 shrink-0" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="45" r="35" fill="currentColor"/>
              <path d="M25 70 L30 85 L45 65" fill="currentColor"/>
              <path d="M35 45 Q50 55 65 45" stroke={theme === 'dark' ? '#0a0a0a' : 'white'} strokeWidth="5" strokeLinecap="round" fill="none"/>
            </svg>
            <span className="text-base font-semibold tracking-tight leading-none">BeyondChats</span>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground link-underline">Articles</Link>
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header
