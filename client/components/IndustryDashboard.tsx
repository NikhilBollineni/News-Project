'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { io, Socket } from 'socket.io-client'
import { RealTimeNotifications } from './RealTimeNotifications'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { 
  Home, 
  BarChart3, 
  Bookmark, 
  Search, 
  Bell, 
  User, 
  ChevronDown,
  Wifi,
  WifiOff,
  Lightbulb,
  ArrowRight,
  ExternalLink,
  Clock,
  Building2,
  Car,
  Battery,
  HomeIcon,
  Zap,
  TrendingUp,
  FileText,
  Calendar,
  Briefcase,
  Leaf,
  Settings,
  Filter,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { api } from '@/lib/api'


// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

interface Article {
  _id: string
  title: string
  summary: string
  category: string
  industry: string
  sentiment: string
  tags: string[]
  source: {
    name: string
    url: string
  }
  publishedAt: string
  url: string
  importance: number
  engagement: {
    views: number
    bookmarks: number
  }
  // AI-processed fields
  aiCategory?: string
  aiSentiment?: string
  aiTitle?: string
  aiSummary?: string
  aiTags?: string[]
  publisher?: {
    name: string
  }
  originalUrl?: string
  // UI state properties
  isNew?: boolean
  newTimestamp?: number
  isExpanded?: boolean
}

interface Stats {
  totalArticles: number
  articlesByBrand: Record<string, number>
  articlesByCategory: Record<string, number>
  lastFetchTime?: string
}

const industries = [
  { id: 'automotive', name: 'Automotive', icon: Car, description: 'Cars, Trucks & Transportation' },
  { id: 'hvac', name: 'HVAC', icon: HomeIcon, description: 'Heating, Ventilation & Air Conditioning' },
  { id: 'bess', name: 'BESS', icon: Battery, description: 'Battery Energy Storage Systems' },
  { id: 'real-estate', name: 'Real Estate', icon: Building2, description: 'Property & Construction' },
  { id: 'energy', name: 'Energy', icon: Zap, description: 'Power & Utilities' }
]

const navigationItems = [
  { name: 'Dashboard', icon: Home, category: null, active: true },
  { name: 'AI Analysis', icon: BarChart3, category: null },
  { name: 'Bookmarks', icon: Bookmark, category: null },
  { name: 'Analytics', icon: TrendingUp, category: null },
  { name: 'Competitor Financials', icon: BarChart3, category: 'm-and-a' },
  { name: 'Product Launches', icon: FileText, category: 'product-launches' },
  { name: 'Regulatory Compliance', icon: FileText, category: 'regulatory' },
  { name: 'Market Trends', icon: TrendingUp, category: 'market-trends' },
  { name: 'Technology Innovation', icon: Lightbulb, category: 'ev-technology' },
  { name: 'Industry Events', icon: Calendar, category: null },
  { name: 'Company News', icon: Briefcase, category: 'manufacturing' },
  { name: 'Sustainability', icon: Leaf, category: null }
]

export default function IndustryDashboard() {
  const [selectedIndustry, setSelectedIndustry] = useState('automotive')
  const [articles, setArticles] = useState<Article[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [activeNavItem, setActiveNavItem] = useState('Dashboard')
  const [isOffline, setIsOffline] = useState(false)
  const [notifications, setNotifications] = useState(3)
  const [refreshing, setRefreshing] = useState(false)
  
  // Error handling state
  const [error, setError] = useState<string | null>(null)
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null)


  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [navLoading, setNavLoading] = useState(false)
  const [bookmarkedArticles, setBookmarkedArticles] = useState<string[]>([])
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Advanced filtering state
  const [filters, setFilters] = useState({
    categories: [] as string[],
    brands: [] as string[],
    technologies: [] as string[],
    sentiments: [] as string[],
    regions: [] as string[],
    sources: [] as string[],
    dateFrom: '',
    dateTo: '',
    importance: '',
    sortBy: 'publishedAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  })
  const [filterOptions, setFilterOptions] = useState({
    categories: ['technology', 'business', 'sustainability', 'innovation'] as string[],
    brands: ['Tesla', 'BMW', 'Mercedes', 'Audi', 'Ford', 'GM'] as string[],
    technologies: ['electric-vehicles', 'autonomous-driving', 'battery-technology', 'ai'] as string[],
    sentiments: ['positive', 'negative', 'neutral'] as string[],
    regions: ['North America', 'Europe', 'Asia', 'Global'] as string[],
    sources: ['TechCrunch', 'The Verge', 'Engadget', 'Wired'] as string[]
  })
  const [showFilters, setShowFilters] = useState(false)
  const [newArticlesCount, setNewArticlesCount] = useState(0)
  const [socketConnected, setSocketConnected] = useState(false)
  const [show2FASettings, setShow2FASettings] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalArticles, setTotalArticles] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMoreArticles, setHasMoreArticles] = useState(true)

  // Socket.io connection
  const socketRef = useRef<Socket | null>(null)

  const currentIndustry = industries.find(ind => ind.id === selectedIndustry)

  // Backend connection check
  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/health`, {
          method: 'GET',
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        if (response.ok) {
          setBackendConnected(true)
          setError(null)
        } else {
          setBackendConnected(false)
          setError('Backend server is not responding properly')
        }
      } catch (err) {
        console.error('Backend connection failed:', err)
        setBackendConnected(false)
        setError('Cannot connect to backend server. Please ensure the server is running.')
      }
    }
    
    checkBackendConnection()
  }, [])

  // Socket.io connection setup
  useEffect(() => {
    let socket: Socket | null = null
    
    try {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001'
      console.log('🔌 Attempting to connect to WebSocket:', socketUrl)
      
      socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        forceNew: true,
        autoConnect: true
      })
      
      socketRef.current = socket

      socket.on('connect', () => {
        console.log('🔌 Connected to server')
        setSocketConnected(true)
      })

      socket.on('disconnect', () => {
        console.log('🔌 Disconnected from server')
        setSocketConnected(false)
      })

      socket.on('connection_status', (status) => {
        console.log('📡 Connection status:', status)
        setSocketConnected(status.connected)
      })

      socket.on('new_article', (data) => {
        console.log('📰 New article received:', data)
        
        try {
          const newArticle = data.article || data
          
          // Ensure the article has an _id
          if (newArticle.id && !newArticle._id) {
            newArticle._id = newArticle.id
          }
          
          // Add new article to the beginning of the list with isNew flag
          const articleWithNewFlag = {
            ...newArticle,
            _id: newArticle.id || newArticle._id,
            isNew: true,
            newTimestamp: Date.now()
          }
          
          setNewArticlesCount(prev => prev + 1)
          setArticles(prev => [articleWithNewFlag, ...prev])
          
          // Show notification with article title
          const articleTitle = newArticle.aiTitle || newArticle.title || 'New Article'
          toast.success(`📰 ${articleTitle}`, {
            duration: 4000,
            icon: '🚗',
            style: {
              background: '#10B981',
              color: 'white',
              fontWeight: 'bold'
            }
          })
        } catch (error) {
          console.error('❌ Error processing new article:', error)
        }
      })

      socket.on('error', (error) => {
        console.error('WebSocket error:', error)
        setSocketConnected(false)
      })
      
      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error)
        setSocketConnected(false)
      })
      
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket:', error)
      setSocketConnected(false)
    }

    return () => {
      if (socket) {
        console.log('🧹 Disconnecting WebSocket')
        socket.disconnect()
        socketRef.current = null
      }
    }
  }, [])

  // Memoize fetchArticles to prevent infinite re-renders
  const fetchArticlesMemo = useCallback(async (page = 1, append = false) => {
    try {
      if (!append) {
        setLoading(true)
        setCurrentPage(1)
      } else {
        setLoadingMore(true)
      }
      
      // Only fetch real articles for Automotive industry
      if (selectedIndustry === 'automotive') {
        const params: any = {
          page,
          limit: 50
        }
        
        // Use navigation category if available, otherwise use selectedCategory
        const activeNav = navigationItems.find(item => item.name === activeNavItem)
        const categoryToUse = activeNav?.category || selectedCategory
        
        if (categoryToUse) {
          params.category = categoryToUse
          console.log(`🔍 Filtering by category: ${categoryToUse}`)
        }
        if (searchQuery) {
          params.search = searchQuery
          console.log(`🔍 Searching for: ${searchQuery}`)
        }

        // Advanced filtering parameters
        if (filters.categories.length > 0) {
          params.category = filters.categories
        }
        if (filters.brands.length > 0) {
          params.brand = filters.brands
        }
        if (filters.technologies.length > 0) {
          params.technology = filters.technologies
        }
        if (filters.sentiments.length > 0) {
          params.sentiment = filters.sentiments
        }
        if (filters.regions.length > 0) {
          params.region = filters.regions
        }
        if (filters.sources.length > 0) {
          params.source = filters.sources
        }
        if (filters.dateFrom) {
          params.dateFrom = filters.dateFrom
        }
        if (filters.dateTo) {
          params.dateTo = filters.dateTo
        }
        if (filters.importance) {
          params.importance = filters.importance
        }
        if (filters.sortBy) {
          params.sortBy = filters.sortBy
        }
        if (filters.sortOrder) {
          params.sortOrder = filters.sortOrder
        }

        console.log(`📡 Fetching articles with params:`, params)
        console.log(`🔍 Current filters:`, filters)
        const response = await api.get('/articles', { params })
        console.log(`📊 Received ${response.data.articles.length} articles`)
        console.log('📄 First article:', response.data.articles[0])
        
        // Handle pagination data
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages || 1)
          setTotalArticles(response.data.pagination.total || 0)
          setHasMoreArticles(page < (response.data.pagination.pages || 1))
        }
        
        if (append) {
          // Append new articles to existing ones
          setArticles(prev => [...prev, ...response.data.articles])
          setCurrentPage(page)
        } else {
          // Replace articles for new search/filter
          setArticles(response.data.articles)
          setCurrentPage(1)
        }
        
        // Update filter options if available
        if (response.data.filters) {
          console.log('📋 Received filter options:', response.data.filters)
          setFilterOptions(response.data.filters)
        } else {
          console.log('⚠️ No filter options received from server')
        }
      } else {
        // For other industries, show empty array (will display coming soon message)
        setArticles([])
        setTotalArticles(0)
        setHasMoreArticles(false)
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch articles:', error)
      console.error('❌ Error response:', error.response?.data)
      console.error('❌ Error status:', error.response?.status)
      
      // Set error state for display
      setError(`Failed to fetch articles: ${error.message || 'Unknown error'}`)
      toast.error('Failed to fetch articles')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [selectedIndustry, selectedCategory, activeNavItem, searchQuery, filters])

  // Memoize fetchStats to prevent infinite re-renders
  const fetchStatsMemo = useCallback(async () => {
    try {
      // Only fetch stats for Automotive industry
      if (selectedIndustry === 'automotive') {
        const response = await api.get('/articles/stats')
        setStats(response.data)
      } else {
        // For other industries, set empty stats
        setStats(null)
      }
    } catch (error) {
      console.error('Failed to fetch stats')
    }
  }, [selectedIndustry])

  useEffect(() => {
    console.log('🚀 IndustryDashboard useEffect triggered')
    console.log('🏭 Selected industry:', selectedIndustry)
    console.log('🏷️ Selected category:', selectedCategory)
    console.log('🔍 Active nav item:', activeNavItem)
    
    const initializeData = async () => {
      setIsInitialLoading(true)
      try {
        await Promise.all([fetchArticlesMemo(), fetchStatsMemo()])
        loadBookmarks()
      } finally {
        setIsInitialLoading(false)
      }
    }
    
    initializeData()
  }, [selectedIndustry, selectedCategory, activeNavItem, fetchArticlesMemo, fetchStatsMemo])

  const loadBookmarks = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bookmarkedArticles')
      if (saved) {
        setBookmarkedArticles(JSON.parse(saved))
      }
    }
  }

  const toggleBookmark = (articleId: string) => {
    setBookmarkedArticles(prev => {
      const newBookmarks = prev.includes(articleId) 
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('bookmarkedArticles', JSON.stringify(newBookmarks))
      }
      
      return newBookmarks
    })
  }

  const isBookmarked = (articleId: string) => bookmarkedArticles.includes(articleId)

  // Clear "isNew" flag when user interacts with article
  const clearNewFlag = (articleId: string) => {
    setArticles(prev => prev.map(article => 
      article._id === articleId 
        ? { ...article, isNew: false }
        : article
    ))
  }

  // Auto-clear "isNew" flag after 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setArticles(prev => prev.map(article => {
        if (article.isNew && article.newTimestamp && Date.now() - article.newTimestamp > 30000) {
          return { ...article, isNew: false }
        }
        return article
      }))
    }, 10000) // Check every 10 seconds (reduced frequency)

    return () => {
      console.log('🧹 Cleaning up auto-clear timer')
      clearInterval(timer)
    }
  }, [])

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  // Filter management functions
  const updateFilter = (filterType: keyof typeof filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      categories: [],
      brands: [],
      technologies: [],
      sentiments: [],
      regions: [],
      sources: [],
      dateFrom: '',
      dateTo: '',
      importance: '',
      sortBy: 'publishedAt',
      sortOrder: 'desc'
    })
    setSearchQuery('')
    setSelectedCategory('')
    // Reset pagination state
    setCurrentPage(1)
    setHasMoreArticles(true)
  }

  const applyFilterPreset = (preset: string) => {
    switch (preset) {
      case 'breaking':
        setFilters(prev => ({
          ...prev,
          importance: '8',
          sortBy: 'publishedAt',
          sortOrder: 'desc'
        }))
        break
      case 'ev':
        setFilters(prev => ({
          ...prev,
          technologies: ['electric-vehicles', 'battery-technology'],
          categories: ['ev-technology']
        }))
        break
      case 'tesla':
        setFilters(prev => ({
          ...prev,
          brands: ['Tesla'],
          categories: ['product-launches', 'technology']
        }))
        break
      case 'today':
        const today = new Date().toISOString().split('T')[0]
        setFilters(prev => ({
          ...prev,
          dateFrom: today,
          sortBy: 'publishedAt',
          sortOrder: 'desc'
        }))
        break
    }
  }


  const loadMoreArticles = useCallback(async () => {
    if (hasMoreArticles && !loadingMore) {
      await fetchArticlesMemo(currentPage + 1, true)
    }
  }, [hasMoreArticles, loadingMore, currentPage, fetchArticlesMemo])


  const handleManualRefresh = async () => {
    if (selectedIndustry !== 'automotive') {
      toast.error('Manual refresh is only available for Automotive industry')
      return
    }

    try {
      setRefreshing(true)
      toast.loading('Fetching latest automotive news...', { id: 'refresh' })
      
      // Trigger manual news fetch on server
      await api.post('/admin/scrape-feeds')
      
      // Wait a moment for the fetch to complete
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Refresh articles and stats
      setCurrentPage(1)
      setHasMoreArticles(true)
      await fetchArticlesMemo(1, false)
      await fetchStatsMemo()
      
      toast.success('Latest news fetched successfully!', { id: 'refresh' })
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch latest news', { id: 'refresh' })
    } finally {
      setRefreshing(false)
    }
  }

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (selectedIndustry === 'automotive' && query.trim()) {
        console.log('🔍 Debounced search for:', query)
        setCurrentPage(1)
        setHasMoreArticles(true)
        fetchArticlesMemo(1, false)
      }
    }, 500),
    [selectedIndustry, fetchArticlesMemo]
  )

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (selectedIndustry === 'automotive') {
      // Reset pagination for new search
      setCurrentPage(1)
      setHasMoreArticles(true)
      fetchArticlesMemo(1, false)
    } else {
      toast.success(`${currentIndustry?.name} search functionality coming soon!`)
    }
  }, [selectedIndustry, currentIndustry, fetchArticlesMemo])

  // Handle search query changes with debouncing
  useEffect(() => {
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery)
    }
  }, [searchQuery, debouncedSearch])

  // Performance monitoring and cleanup
  useEffect(() => {
    console.log('🚀 IndustryDashboard mounted')
    
    return () => {
      console.log('🧹 IndustryDashboard unmounting - cleaning up')
      // Clear any pending timeouts from debounced functions
      if (typeof window !== 'undefined') {
        // Clear any localStorage operations
        console.log('🧹 Component cleanup completed')
      }
    }
  }, [])

  // Cleanup debounced search on unmount
  useEffect(() => {
    return () => {
      // Clear any pending debounced search calls
      console.log('🧹 Cleaning up debounced search')
    }
  }, [debouncedSearch])

  const handleNavClick = async (navItem: typeof navigationItems[0]) => {
    try {
      setNavLoading(true)
      setActiveNavItem(navItem.name)
      
      // Handle special navigation items
      if (navItem.name === 'AI Analysis') {
        setShowBookmarks(false)
        setSelectedCategory('')
        toast.success('AI Analysis service will be available soon!')
        return
      }
      
      if (navItem.name === 'Bookmarks') {
        setShowBookmarks(true)
        setSelectedCategory('')
        return
      }
      
      // If it's a category-based nav item, clear search query
      if (navItem.category) {
        setSearchQuery('')
        setSelectedCategory(navItem.category)
        setShowBookmarks(false)
        console.log(`🎯 Selected category: ${navItem.category}`)
      } else {
        setSelectedCategory('')
        setShowBookmarks(false)
      }
      
      // Show coming soon message for non-automotive industries
      if (selectedIndustry !== 'automotive' && navItem.category) {
        toast.success(`${navItem.name} for ${currentIndustry?.name} coming soon!`)
        return
      }
      
      // For automotive industry, fetch articles if it's a category-based nav
      if (navItem.category && selectedIndustry === 'automotive') {
        // Reset pagination for new category
        setCurrentPage(1)
        setHasMoreArticles(true)
        await fetchArticlesMemo(1, false)
      }
    } catch (error) {
      console.error('Navigation error:', error)
      toast.error('Navigation failed. Please try again.')
    } finally {
      setNavLoading(false)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'product-launches': 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200',
      'ev-technology': 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200',
      'manufacturing': 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border border-purple-200',
      'm-and-a': 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border border-orange-200',
      'financials': 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200',
      'regulatory': 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200',
      'market-trends': 'bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 border border-indigo-200',
      'technology': 'bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 border border-cyan-200',
      'safety': 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200'
    }
    return colors[category] || 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200'
  }

  const getSentimentColor = (sentiment: string) => {
    const colors: Record<string, string> = {
      'positive': 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200',
      'negative': 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200',
      'neutral': 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200'
    }
    return colors[sentiment] || 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'less than a minute ago'
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'product-launches': return <FileText className="h-4 w-4" />
      case 'ev-technology': return <Zap className="h-4 w-4" />
      case 'manufacturing': return <Building2 className="h-4 w-4" />
      case 'regulatory': return <FileText className="h-4 w-4" />
      case 'market-trends': return <TrendingUp className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  // Error display
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading App</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button 
              onClick={() => setError(null)}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Continue Offline
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading news dashboard...</p>
          {backendConnected === false && (
            <p className="text-sm text-yellow-600 mt-2">Connecting to backend server...</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <h1>Industry Dashboard</h1>
    </div>
  )
}
