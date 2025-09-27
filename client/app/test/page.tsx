'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

interface Article {
  aiTitle?: string
  originalTitle?: string
  aiSummary?: string
  aiCategory?: string
  publisher?: {
    name: string
  }
}

export default function TestPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await api.get('/automotive/articles')
        setArticles(response.data.articles)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setLoading(false)
      }
    }

    fetchArticles()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Test Page - Automotive Articles
        </h1>
        
        <div className="mb-4">
          <p className="text-gray-600">
            Found {articles.length} articles from the API
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {article.aiTitle || article.originalTitle}
              </h2>
              <p className="text-gray-600 mb-4">
                {article.aiSummary || 'No summary available'}
              </p>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {article.aiCategory || 'uncategorized'}
                </span>
                <span className="text-sm text-gray-500">
                  {article.publisher?.name || 'Unknown'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
