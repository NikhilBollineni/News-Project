import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = 'http://localhost:5001/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path') || ''
    const queryString = new URL(request.url).search.replace('?path=' + encodeURIComponent(path), '').replace(/^&/, '?')
    
    const backendUrl = `${BACKEND_URL}${path}${queryString}`
    console.log('Proxying request to:', backendUrl)
    
    const response = await fetch(backendUrl)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from backend', details: error.message },
      { status: 500 }
    )
  }
}
