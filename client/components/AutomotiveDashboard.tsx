'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { 
  Car, 
  Search, 
  Filter,
  TrendingUp,
  Clock,
  Bookmark,
  ExternalLink,
  ChevronDown,
  Menu,
  X,
  Zap,
  Battery,
  Settings,
  Factory,
  DollarSign,
  Shield,
  Globe
} from 'lucide-react'

interface AutomotiveArticle {
  _id: string
  aiTitle: string
  aiSummary: string
  aiCategory: string
  automotive: {
    brand: string
    vehicleType: string
    technology: string[]
    market: string
    region: string
    priceRange: string
  }
  publisher: {
    name: string
    logo: string
    credibility: number
  }
  publishedAt: string
  aiSentiment: string
  aiImportance: number
  aiTags: string[]
  originalUrl: string
}

interface AutomotiveStats {
  totalArticles: number
  articlesByBrand: Record<string, number>
  articlesByCategory: Record<string, number>
  recentActivity: AutomotiveArticle[]
}

const automotiveBrands = [
  'Tesla', 'Ford', 'GM', 'Toyota', 'Honda', 'BMW', 'Mercedes-Benz', 'Audi', 
  'Volkswagen', 'Nissan', 'Hyundai', 'Kia', 'Subaru', 'Mazda', 'Lexus',
  'Porsche', 'Ferrari', 'Lamborghini', 'Bentley', 'Rolls-Royce', 'Rivian',
  'Lucid', 'Polestar', 'Fisker', 'BYD', 'NIO'
]

const automotiveTechnologies = [
  'EV', 'Hybrid', 'Autonomous', 'ICE', 'Hydrogen', 'Plug-in-Hybrid'
]

const automotiveMarkets = [
  'Luxury', 'Mass-Market', 'Commercial', 'Performance', 'Economy'
]

const automotiveRegions = [
  'North America', 'Europe', 'Asia', 'China', 'India', 'Global'
]

export default function AutomotiveDashboard() {
  const [articles, setArticles] = useState<AutomotiveArticle[]>([])
  const [stats, setStats] = useState<AutomotiveStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedBrand, setSelectedBrand] = useState<string>('')
  const [selectedTechnology, setSelectedTechnology] = useState<string>('')
  const [selectedMarket, setSelectedMarket] = useState<string>('')
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    fetchArticles()
    fetchStats()
  }, [selectedBrand, selectedTechnology, selectedMarket, selectedRegion])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (selectedBrand) params.brand = selectedBrand.toLowerCase()
      if (selectedTechnology) params.technology = selectedTechnology.toLowerCase()
      if (selectedMarket) params.market = selectedMarket.toLowerCase()
      if (selectedRegion) params.region = selectedRegion.toLowerCase()
      if (searchQuery) params.search = searchQuery

      const response = await api.get('/automotive/articles', { params })
      setArticles(response.data.articles)
    } catch (error) {
      toast.error('Failed to fetch automotive articles')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/automotive/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch automotive stats')
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchArticles()
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ev-technology': return <Battery className="h-4 w-4" />
      case 'product-launches': return <Car className="h-4 w-4" />
      case 'manufacturing': return <Factory className="h-4 w-4" />
      case 'financials': return <DollarSign className="h-4 w-4" />
      case 'regulatory': return <Shield className="h-4 w-4" />
      case 'm-and-a': return <TrendingUp className="h-4 w-4" />
      default: return <Car className="h-4 w-4" />
    }
  }

  const getTechnologyIcon = (technology: string) => {
    switch (technology.toLowerCase()) {
      case 'ev': return <Zap className="h-4 w-4" />
      case 'autonomous': return <Settings className="h-4 w-4" />
      case 'hybrid': return <Battery className="h-4 w-4" />
      default: return <Car className="h-4 w-4" />
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100'
      case 'negative': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <div className="flex items-center space-x-2">
                <Car className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Automotive News Hub</h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                <span>Welcome to</span>
                <span className="font-medium text-gray-900">Automotive Industry News</span>
              </div>
              <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                <TrendingUp className="h-6 w-6 text-gray-600" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-80 flex-shrink-0">
            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Articles</h2>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search automotive news..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button type="submit" className="w-full btn-primary">
                  Search
                </button>
              </form>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
              
              {/* Brand Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Brands</option>
                  {automotiveBrands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              {/* Technology Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Technology</label>
                <select
                  value={selectedTechnology}
                  onChange={(e) => setSelectedTechnology(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Technologies</option>
                  {automotiveTechnologies.map(tech => (
                    <option key={tech} value={tech}>{tech}</option>
                  ))}
                </select>
              </div>

              {/* Market Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Market</label>
                <select
                  value={selectedMarket}
                  onChange={(e) => setSelectedMarket(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Markets</option>
                  {automotiveMarkets.map(market => (
                    <option key={market} value={market}>{market}</option>
                  ))}
                </select>
              </div>

              {/* Region Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Regions</option>
                  {automotiveRegions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setSelectedBrand('')
                  setSelectedTechnology('')
                  setSelectedMarket('')
                  setSelectedRegion('')
                  setSearchQuery('')
                }}
                className="w-full btn-secondary"
              >
                Clear Filters
              </button>
            </div>

            {/* Stats */}
            {stats && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Articles</span>
                    <span className="font-medium">{stats.totalArticles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Top Brand</span>
                    <span className="font-medium">
                      {Object.entries(stats.articlesByBrand)[0]?.[0] || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Top Category</span>
                    <span className="font-medium">
                      {Object.entries(stats.articlesByCategory)[0]?.[0] || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Articles Grid */}
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <article key={article._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                    {/* Header - Clean and Simple */}
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        {article.aiCategory.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getSentimentColor(article.aiSentiment)}`}>
                        {article.aiSentiment}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
                      {article.aiTitle}
                    </h3>

                    {/* Full AI Summary */}
                    <p className="text-gray-700 text-sm leading-relaxed mb-4">
                      {article.aiSummary}
                    </p>

                    {/* Key Info - Only Essential */}
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-4">
                        <span className="font-medium text-gray-900">{article.automotive.brand}</span>
                        <span className="text-gray-500">•</span>
                        <span>{article.automotive.vehicleType}</span>
                        <span className="text-gray-500">•</span>
                        <span>{article.automotive.technology[0]}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>{formatDate(article.publishedAt)}</span>
                      </div>
                    </div>

                    {/* Actions - Clean */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        {article.publisher.name}
                      </div>
                      <a
                        href={article.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <span>Read Full Article</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {!loading && articles.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Car className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No automotive articles found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
