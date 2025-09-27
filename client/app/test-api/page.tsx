'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

export default function TestAPI() {
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testAPI = async () => {
      try {
        console.log('Testing API connection...')
        console.log('API URL:', process.env.NEXT_PUBLIC_API_URL)
        
        const response = await api.get('/articles?industry=automotive&page=1&per_page=5')
        console.log('API Response:', response.data)
        
        setArticles(response.data.articles)
        setError(null)
      } catch (err: any) {
        console.error('API Error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    testAPI()
  }, [])

  if (loading) {
    return <div className="p-8">Loading API test...</div>
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">API Error</h1>
        <p className="mt-4">Error: {error}</p>
        <p className="mt-2">API URL: {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">API Test Results</h1>
      <p className="mt-2">API URL: {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</p>
      <p className="mt-2">Articles found: {articles.length}</p>
      
      <div className="mt-6 space-y-4">
        {articles.map((article, index) => (
          <div key={article._id} className="border p-4 rounded">
            <h3 className="font-semibold">{article.title}</h3>
            <p className="text-sm text-gray-600">Category: {article.category}</p>
            <p className="text-sm text-gray-600">Source: {article.source?.name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
