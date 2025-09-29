'use client'

import React, { useState, useEffect } from 'react'
import { Car, Search, Filter, Bell, User, Wifi, WifiOff, RefreshCw, Menu, X, ChevronLeft, ChevronRight, BarChart3, Table, TrendingUp, Radio } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { api } from '@/lib/api'
import { io, Socket } from 'socket.io-client'

interface Article {
  _id: string
  title: string
  summary: string
  url: string
  publishedAt: string
  source: {
    name: string
    url: string
  }
  category?: string
  sentiment?: string
  aiSummary?: string
  aiCategory?: string
  aiSentiment?: string
}

interface Stats {
  totalArticles: number
  articlesByCategory: Record<string, number>
  articlesByIndustry: Record<string, number>
  recentArticles: Article[]
  lastFetchTime: string
}

const industries = [
  { id: 'automotive', name: 'Automotive', icon: Car, description: 'Cars, Trucks & Transportation' }
]

export default function IndustryDashboard() {
  const [selectedIndustry, setSelectedIndustry] = useState('automotive')
  const [articles, setArticles] = useState<Article[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isOffline, setIsOffline] = useState(false)
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [activeSidebarTab, setActiveSidebarTab] = useState<'categories' | 'analytics'>('categories')
  const [analyticsView, setAnalyticsView] = useState<'table' | 'chart'>('table')
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [newArticlesCount, setNewArticlesCount] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [newArticles, setNewArticles] = useState<Record<string, number>>({})

  const currentIndustry = industries.find(ind => ind.id === selectedIndustry)

  // Backend connection check
  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1000/api'
        const response = await fetch(`${apiUrl}/health`, {
          method: 'GET',
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        if (response.ok) {
          setBackendConnected(true)
          setError(null)
          setIsOffline(false)
        } else {
          setBackendConnected(false)
          setError('Backend server is not responding properly')
          setIsOffline(true)
        }
      } catch (err) {
        console.error('Backend connection failed:', err)
        setBackendConnected(false)
        setError('Cannot connect to backend server')
        setIsOffline(true)
      }
    }
    
    checkBackendConnection()
  }, [])

  // Fetch articles
  const fetchArticles = async () => {
    try {
      setRefreshing(true)
      const response = await api.get('/articles', {
        params: {
          industry: selectedIndustry,
          search: searchQuery,
          category: selectedCategory,
          limit: 32
        }
      })
      
      // Ensure we have valid data structure
      const responseData = response.data || {}
      const articlesData = responseData.articles || []
      
      // Validate articles data
      const validArticles = Array.isArray(articlesData) ? articlesData : []
      
      setArticles(validArticles)
      setLoading(false)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch articles:', err)
      setError('Failed to load articles')
      setLoading(false)
      setArticles([]) // Ensure articles is always an array
      } finally {
      setRefreshing(false)
    }
  }

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await api.get('/articles/stats', {
        params: { industry: selectedIndustry }
      })
      
      // Ensure we have valid stats data
      const statsData = response.data || {}
      const validStats = {
        totalArticles: statsData.totalArticles || 0,
        articlesByCategory: statsData.articlesByCategory || {},
        articlesByIndustry: statsData.articlesByIndustry || {},
        recentArticles: statsData.recentArticles || [],
        lastFetchTime: statsData.lastFetchTime || ''
      }
      
      setStats(validStats)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
      setStats({
        totalArticles: 0,
        articlesByCategory: {},
        articlesByIndustry: {},
        recentArticles: [],
        lastFetchTime: ''
      })
    }
  }

  // Fetch available categories
  const fetchCategories = async () => {
    try {
      const response = await api.get('/articles/categories', {
        params: { industry: selectedIndustry }
      })
      
      const categoriesData = response.data || {}
      const categories = Array.isArray(categoriesData.categories) ? categoriesData.categories : []
      setAvailableCategories(categories)
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      // Fallback categories
      setAvailableCategories(['technology', 'business', 'financial', 'regulatory', 'automotive', 'electric-vehicles', 'manufacturing'])
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (backendConnected) {
      fetchArticles()
      fetchStats()
      fetchCategories()
    }
  }, [backendConnected, selectedIndustry, searchQuery, selectedCategory])

  // WebSocket connection for real-time updates
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:1000'
    console.log('🔌 Attempting to connect to WebSocket:', socketUrl)
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    newSocket.on('connect', () => {
      console.log('✅ Connected to WebSocket server', newSocket.id)
      console.log('🔗 WebSocket URL:', socketUrl)
      setIsConnected(true)
      setBackendConnected(true)
      toast.success('🔗 Connected to live updates', { duration: 2000 })
    })

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket server')
      setIsConnected(false)
      toast.error('🔌 Disconnected from live updates', { duration: 2000 })
    })

    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error)
      setIsConnected(false)
    })

    newSocket.on('new_article', (data) => {
      console.log('📰 New article event received!')
      console.log('📊 Article data:', data)
      const newArticle = data.article
      
      // Add new article to the beginning of the list
      setArticles(prev => {
        if (!prev) {
          console.log('✅ Adding first article to empty grid')
          return [newArticle]
        }
        // Check if article already exists to avoid duplicates
        const exists = prev.some(article => article._id === newArticle._id)
        if (exists) {
          console.log('⚠️ Article already exists in grid, skipping')
          return prev
        }
        console.log(`✅ Adding new article to grid (total: ${prev.length + 1})`)
        return [newArticle, ...prev]
      })
      
      // Mark article as new with timestamp
      setNewArticles(prev => {
        const updated = {
          ...prev,
          [newArticle._id]: Date.now()
        }
        console.log('🏷️ Marked article as NEW:', newArticle._id)
        return updated
      })
      
      // Update stats
      setStats(prev => {
        if (!prev) return prev
        return {
          ...prev,
          totalArticles: prev.totalArticles + 1,
          articlesByCategory: {
            ...prev.articlesByCategory,
            [newArticle.category || 'other']: (prev.articlesByCategory[newArticle.category || 'other'] || 0) + 1
          }
        }
      })
      
      // Update new articles count and last update time
      setNewArticlesCount(prev => prev + 1)
      setLastUpdate(new Date())
      
      // Show notification
      toast.success(`📰 New Article: ${newArticle.title?.substring(0, 60)}${newArticle.title?.length > 60 ? '...' : ''}`, {
        duration: 4000,
        icon: '🚗'
      })
    })

    newSocket.on('article_processed', (data) => {
      console.log('🤖 Article processed with AI:', data)
      // Update existing article with AI processing results
      setArticles(prev => {
        if (!prev) return []
        return prev.map(article => 
          article._id === data.articleId 
            ? { ...article, aiSummary: data.aiSummary, aiCategory: data.aiCategory, aiSentiment: data.aiSentiment }
            : article
        )
      })
    })

    setSocket(newSocket)

    // Cleanup on unmount
    return () => {
      newSocket.disconnect()
    }
  }, [])

  // Auto-refresh fallback every 30 seconds if WebSocket is not connected
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isConnected && backendConnected) {
        console.log('🔄 Auto-refresh fallback triggered')
        fetchArticles()
        fetchStats()
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [isConnected, backendConnected])

  // Auto-remove new article status after 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setNewArticles(prev => {
        const now = Date.now()
        return Object.fromEntries(
          Object.entries(prev).filter(([_, timestamp]) => 
            now - timestamp < 20000 // Keep only articles newer than 20 seconds
          )
        )
      })
    }, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [])

  // Handle refresh
  const handleRefresh = () => {
    fetchArticles()
    fetchStats()
    fetchCategories()
  }

  // Handle category selection
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category === selectedCategory ? '' : category)
  }

  // Check if article is new (within 20 seconds)
  const isNewArticle = (articleId: string) => {
    const addedTime = newArticles[articleId]
    if (!addedTime) return false
    return Date.now() - addedTime < 20000 // 20 seconds = 20000ms
  }

  // Get category analytics data
  const getCategoryAnalytics = () => {
    if (!stats || !stats.articlesByCategory) return []
    
    return Object.entries(stats.articlesByCategory).map(([category, count]) => ({
      category: category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count: count as number,
      percentage: stats ? Math.round((count as number / stats.totalArticles) * 100) : 0
    })).sort((a, b) => b.count - a.count)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get sentiment color
  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'text-green-600 bg-green-100'
      case 'negative': return 'text-red-600 bg-red-100'
      case 'neutral': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading news dashboard...</p>
        </div>
      </div>
    )
  }

  // Backend connection error
  if (backendConnected === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiOff className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Backend Connection Failed</h1>
          <p className="text-gray-600 mb-4">Cannot connect to backend server</p>
          <div className="space-y-2">
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mr-2"
            >
              Retry Connection
            </button>
            <button 
              onClick={() => setBackendConnected(true)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Continue Offline
            </button>
          </div>
        </div>
      </div>
    )
  }

    return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && (
            <h2 className="text-lg font-semibold text-gray-900">
              {activeSidebarTab === 'categories' ? 'Categories' : 'Analytics'}
            </h2>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Sidebar Tabs */}
        {sidebarOpen && (
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveSidebarTab('categories')}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                activeSidebarTab === 'categories'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveSidebarTab('analytics')}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                activeSidebarTab === 'analytics'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Analytics
            </button>
          </div>
        )}

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeSidebarTab === 'categories' ? (
            sidebarOpen ? (
              <div className="space-y-2">
                <button
                  onClick={() => handleCategorySelect('')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === ''
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All Categories
                </button>
                {availableCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                      selectedCategory === category
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {category.replace(/-/g, ' ')}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => handleCategorySelect('')}
                  className={`w-full p-2 rounded-lg transition-colors ${
                    selectedCategory === ''
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title="All Categories"
                >
                  <Filter className="w-5 h-5 mx-auto" />
                </button>
                {availableCategories.slice(0, 6).map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className={`w-full p-2 rounded-lg transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    title={category.replace(/-/g, ' ')}
                  >
                    <Car className="w-5 h-5 mx-auto" />
                  </button>
                ))}
              </div>
            )
          ) : (
            /* Analytics Tab Content */
            sidebarOpen ? (
              <div className="space-y-4">
                {/* View Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setAnalyticsView('table')}
                    className={`flex-1 flex items-center justify-center px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                      analyticsView === 'table'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Table className="w-3 h-3 mr-1" />
                    Table
                  </button>
                  <button
                    onClick={() => setAnalyticsView('chart')}
                    className={`flex-1 flex items-center justify-center px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                      analyticsView === 'chart'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <BarChart3 className="w-3 h-3 mr-1" />
                    Chart
                  </button>
                </div>

                {/* Analytics Content */}
                {analyticsView === 'table' ? (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Category Statistics
                    </div>
                    {getCategoryAnalytics().map((item, index) => (
                      <div key={item.category} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-900">{item.category}</span>
                          <span className="text-sm font-bold text-blue-600">{item.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{item.percentage}% of total</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Category Distribution
                    </div>
                    {getCategoryAnalytics().map((item, index) => (
                      <div key={item.category} className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-600 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-900 truncate">{item.category}</div>
                          <div className="text-xs text-gray-500">{item.count} articles</div>
                        </div>
                        <div className="text-xs font-bold text-blue-600">{item.percentage}%</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  className="w-full p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Analytics"
                >
                  <TrendingUp className="w-5 h-5 mx-auto" />
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Industry News Dashboard</h1>
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <>
                  <Radio className="w-4 h-4 text-green-500 animate-pulse" />
                  <span className="text-sm text-green-600">Live</span>
                </>
              ) : backendConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-blue-600">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">Offline</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            
            <button
              onClick={() => setNewArticlesCount(0)}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Bell className="w-4 h-4" />
              <span>New</span>
              {newArticlesCount > 0 && (
                <span className="px-1.5 py-0.5 text-xs font-medium text-white bg-red-500 rounded-full">
                  {newArticlesCount}
                </span>
              )}
            </button>
            
            <div className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg">
              <User className="w-4 h-4" />
              <span>Profile</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Industry Selection */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Select Industry:</h2>
          <div className="flex space-x-3">
            {industries.map((industry) => (
              <button
                key={industry.id}
                onClick={() => setSelectedIndustry(industry.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  selectedIndustry === industry.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <industry.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{industry.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500">Total Articles</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.totalArticles || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500">Categories</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.articlesByCategory ? Object.keys(stats.articlesByCategory).length : 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500">Last Update</h3>
              <p className="text-sm font-medium text-gray-900">
                {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
              </p>
              {isConnected && (
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <Radio className="w-3 h-3 mr-1" />
                  Live updates
                </p>
              )}
            </div>
          </div>
        )}

        {/* Articles Grid */}
        <div className="mb-6">
          {!articles || articles.length === 0 ? (
            <div className="text-center py-12">
              <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {articles.map((article) => {
                // Ensure article has required properties
                if (!article || !article._id) return null;

  return (
                  <div key={article._id} className={`bg-white rounded-lg border-2 p-4 hover:shadow-lg transition-all duration-200 flex flex-col h-full relative ${
                    isNewArticle(article._id) 
                      ? 'border-red-500 shadow-lg shadow-red-400 animate-pulse' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`} style={isNewArticle(article._id) ? {
                    boxShadow: '0 0 20px rgba(239, 68, 68, 0.6), 0 0 40px rgba(239, 68, 68, 0.4)',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                  } : {}}>
                    {/* NEW Badge */}
                    {isNewArticle(article._id) && (
                      <div className="absolute top-2 right-2 z-10">
                        <span className="px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full animate-bounce shadow-lg">
                          NEW
                        </span>
                      </div>
                    )}

                    {/* Article Header */}
                    <div className="mb-3">
                      <div className="flex items-start justify-between mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSentimentColor(article.aiSentiment || article.sentiment)}`}>
                          {article.aiSentiment || article.sentiment || 'neutral'}
                        </span>
                        {article.aiCategory && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {article.aiCategory}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-3 mb-2 leading-tight">
                        <a 
                          href={article.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 transition-colors"
                        >
                          {article.title}
                        </a>
                      </h3>
                    </div>
                    
                    {/* Article Content */}
                    <div className="flex-1 mb-4">
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {article.aiSummary || article.summary}
                      </p>
                    </div>
                    
                    {/* Article Footer */}
                    <div className="border-t border-gray-100 pt-3 mt-auto">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span className="font-medium truncate">{article.source.name}</span>
                        <span>{formatDate(article.publishedAt)}</span>
                      </div>
                      
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        Read More
                      </a>
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          )}
        </div>

        {/* Load More Button */}
        {articles && articles.length > 0 && (
          <div className="mt-8 text-center">
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {refreshing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Load More Articles
                </>
              )}
            </button>
      </div>
        )}
        </main>
      </div>
    </div>
  )
}