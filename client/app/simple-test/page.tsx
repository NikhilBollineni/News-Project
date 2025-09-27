'use client'

import { useState, useEffect } from 'react'

export default function SimpleTest() {
  const [result, setResult] = useState<string>('Testing...')

  useEffect(() => {
    const testFetch = async () => {
      try {
        console.log('Testing fetch...')
        const response = await fetch('http://localhost:5001/api/articles?industry=automotive&page=1&per_page=1')
        console.log('Response status:', response.status)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('Response data:', data)
        
        setResult(`Success! Found ${data.articles?.length || 0} articles. First title: ${data.articles?.[0]?.title || 'None'}`)
      } catch (error: any) {
        console.error('Fetch error:', error)
        setResult(`Error: ${error.message} | Type: ${error.name} | Network: ${error.code || 'N/A'}`)
      }
    }

    testFetch()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Simple Fetch Test</h1>
      <p className="mt-4">{result}</p>
    </div>
  )
}
