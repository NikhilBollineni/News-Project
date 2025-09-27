'use client'

import { useState, useEffect } from 'react'

export default function ProxyTest() {
  const [result, setResult] = useState<string>('Testing proxy...')

  useEffect(() => {
    const testProxy = async () => {
      try {
        console.log('Testing proxy...')
        const response = await fetch('/api/proxy?path=/articles&industry=automotive&page=1&per_page=5')
        console.log('Proxy response status:', response.status)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('Proxy response data:', data)
        
        if (data.error) {
          setResult(`Proxy Error: ${data.error} - ${data.details}`)
        } else {
          setResult(`Proxy Success! Found ${data.articles?.length || 0} articles. First title: ${data.articles?.[0]?.title || 'None'}`)
        }
      } catch (error: any) {
        console.error('Proxy test error:', error)
        setResult(`Proxy Test Error: ${error.message}`)
      }
    }

    testProxy()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Proxy Test</h1>
      <p className="mt-4">{result}</p>
    </div>
  )
}
