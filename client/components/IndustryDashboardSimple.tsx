'use client'

import React, { useState, useEffect } from 'react'
import { Car, Building2, Battery, HomeIcon, Zap } from 'lucide-react'

const industries = [
  { id: 'automotive', name: 'Automotive', icon: Car, description: 'Cars, Trucks & Transportation' },
  { id: 'hvac', name: 'HVAC', icon: HomeIcon, description: 'Heating, Ventilation & Air Conditioning' },
  { id: 'bess', name: 'BESS', icon: Battery, description: 'Battery Energy Storage Systems' },
  { id: 'real-estate', name: 'Real Estate', icon: Building2, description: 'Property & Construction' },
  { id: 'energy', name: 'Energy', icon: Zap, description: 'Power & Utilities' }
]

export default function IndustryDashboardSimple() {
  const [selectedIndustry, setSelectedIndustry] = useState('automotive')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [articles, setArticles] = useState<any[]>([])

  const currentIndustry = industries.find(ind => ind.id === selectedIndustry)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])

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
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Industry News Dashboard</h1>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-600">Online</span>
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

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {currentIndustry?.name} Industry News
          </h2>
          <p className="text-gray-600 mb-4">
            {currentIndustry?.description}
          </p>
          
          {selectedIndustry === 'automotive' ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Latest Automotive News</h3>
                <p className="text-blue-800 text-sm">
                  Stay updated with the latest developments in automotive technology, 
                  electric vehicles, and industry trends.
                </p>
              </div>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Automotive News Coming Soon</h3>
                <p className="text-gray-600">
                  Real-time automotive news and insights will be available here.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {currentIndustry?.icon && <currentIndustry.icon className="h-8 w-8 text-gray-600" />}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {currentIndustry?.name} News Coming Soon
              </h3>
              <p className="text-gray-600 mb-4">
                We're working hard to bring you the latest {currentIndustry?.description.toLowerCase()} news and insights.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-800">
                  <strong>What to expect:</strong> Real-time news aggregation, AI-powered analysis, 
                  industry-specific categories, and professional insights for {currentIndustry?.name.toLowerCase()} professionals.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
