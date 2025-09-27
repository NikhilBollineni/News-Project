'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
  RefreshCw, 
  Play, 
  Pause, 
  Settings, 
  TrendingUp, 
  FileText, 
  Globe, 
  Brain,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface Article {
  _id: string;
  title: string;
  summary: string;
  industry: string;
  category: string;
  confidence: number;
  publishedAt: string;
  link: string;
  sourceId: string;
  requiresReview: boolean;
}

interface Source {
  _id: string;
  sourceId: string;
  name: string;
  type: string;
  url: string;
  isActive: boolean;
  isHealthy: boolean;
  lastFetched: string;
  successCount: number;
  errorCount: number;
}

interface Stats {
  articles: {
    total: number;
    processed: number;
    pending: number;
    failed: number;
    duplicates: number;
    reviewRequired: number;
  };
  industries: Array<{ _id: string; count: number }>;
  categories: Array<{ _id: string; count: number }>;
  sources: {
    total: number;
    active: number;
    healthy: number;
  };
}

interface HealthStatus {
  status: string;
  timestamp: string;
  ingestion: {
    lastRun: string | null;
    lastSource: string | null;
    lastItemsSaved: number;
  };
  sources: {
    total: number;
    active: number;
    healthy: number;
  };
}

const NewsIngestionDashboard: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningIngestion, setRunningIngestion] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [articlesRes, sourcesRes, statsRes, healthRes] = await Promise.all([
        fetch('/api/news-ingestion/articles?limit=20&sortBy=publishedAt&sortOrder=desc'),
        fetch('/api/news-ingestion/sources'),
        fetch('/api/news-ingestion/stats'),
        fetch('/api/news-ingestion/health')
      ]);

      if (articlesRes.ok) {
        const articlesData = await articlesRes.json();
        setArticles(articlesData.data);
      }

      if (sourcesRes.ok) {
        const sourcesData = await sourcesRes.json();
        setSources(sourcesData.data);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runIngestion = async () => {
    setRunningIngestion(true);
    try {
      const response = await fetch('/api/news-ingestion/ingest/run', {
        method: 'POST'
      });
      
      if (response.ok) {
        await fetchDashboardData(); // Refresh data
        alert('Ingestion completed successfully!');
      } else {
        const error = await response.json();
        alert(`Ingestion failed: ${error.error}`);
      }
    } catch (error) {
      alert(`Error running ingestion: ${error}`);
    } finally {
      setRunningIngestion(false);
    }
  };

  const runGPTProcessing = async () => {
    try {
      const response = await fetch('/api/news-ingestion/gpt/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 50 })
      });
      
      if (response.ok) {
        await fetchDashboardData(); // Refresh data
        alert('GPT processing completed successfully!');
      } else {
        const error = await response.json();
        alert(`GPT processing failed: ${error.error}`);
      }
    } catch (error) {
      alert(`Error running GPT processing: ${error}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getIndustryColor = (industry: string) => {
    const colors: { [key: string]: string } = {
      'Automotive': 'bg-blue-100 text-blue-800',
      'Tech': 'bg-purple-100 text-purple-800',
      'Finance': 'bg-green-100 text-green-800',
      'Healthcare': 'bg-red-100 text-red-800',
      'Energy': 'bg-yellow-100 text-yellow-800',
      'Unknown': 'bg-gray-100 text-gray-800'
    };
    return colors[industry] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">News Ingestion Dashboard</h1>
          <p className="text-gray-600">Monitor and manage the news ingestion pipeline</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={runIngestion} disabled={runningIngestion} variant="outline">
            {runningIngestion ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            Run Ingestion
          </Button>
          <Button onClick={runGPTProcessing} variant="outline">
            <Brain className="h-4 w-4 mr-2" />
            Process GPT
          </Button>
          <Button onClick={fetchDashboardData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Health Status */}
      {health && (
        <Alert className={health.status === 'healthy' ? 'border-green-200 bg-green-50' : 
                          health.status === 'degraded' ? 'border-yellow-200 bg-yellow-50' : 
                          'border-red-200 bg-red-50'}>
          <div className="flex items-center">
            {getStatusIcon(health.status)}
            <AlertDescription className="ml-2">
              System Status: <strong>{health.status.toUpperCase()}</strong>
              {health.ingestion.lastRun && (
                <span className="ml-4">
                  Last ingestion: {new Date(health.ingestion.lastRun).toLocaleString()}
                </span>
              )}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.articles.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.articles.processed} processed ({((stats.articles.processed / stats.articles.total) * 100).toFixed(1)}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Processing</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.articles.pending}</div>
              <p className="text-xs text-muted-foreground">
                {stats.articles.reviewRequired} need review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sources</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sources.active}</div>
              <p className="text-xs text-muted-foreground">
                {stats.sources.healthy} healthy
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Duplicates</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.articles.duplicates}</div>
              <p className="text-xs text-muted-foreground">
                {stats.articles.failed} failed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="articles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="articles">Recent Articles</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-4">
          {/* Filters */}
          <div className="flex space-x-4">
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Industries</option>
              {stats?.industries.map((industry) => (
                <option key={industry._id} value={industry._id}>
                  {industry._id} ({industry.count})
                </option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Categories</option>
              {stats?.categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category._id} ({category.count})
                </option>
              ))}
            </select>
          </div>

          {/* Articles List */}
          <div className="space-y-4">
            {articles.map((article) => (
              <Card key={article._id} className={article.requiresReview ? 'border-yellow-200 bg-yellow-50' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{article.title}</h3>
                      <p className="text-gray-600 mb-3">{article.summary}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{article.sourceId}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex space-x-2">
                        <Badge className={getIndustryColor(article.industry)}>
                          {article.industry}
                        </Badge>
                        <Badge variant="outline">{article.category}</Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Confidence:</span>
                        <div className="w-16 h-2 bg-gray-200 rounded-full">
                          <div 
                            className={`h-2 rounded-full ${getConfidenceColor(article.confidence)}`}
                            style={{ width: `${article.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {(article.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      
                      {article.requiresReview && (
                        <Badge variant="destructive" className="text-xs">
                          Review Required
                        </Badge>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(article.link, '_blank')}
                      >
                        View Article
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sources.map((source) => (
              <Card key={source._id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{source.name}</span>
                    <div className="flex items-center space-x-2">
                      {source.isActive ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                      {source.isHealthy ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Type:</span> {source.type}
                    </div>
                    <div>
                      <span className="font-medium">URL:</span>
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                        {source.url.length > 50 ? source.url.substring(0, 50) + '...' : source.url}
                      </a>
                    </div>
                    <div>
                      <span className="font-medium">Successes:</span> {source.successCount}
                    </div>
                    <div>
                      <span className="font-medium">Errors:</span> {source.errorCount}
                    </div>
                    {source.lastFetched && (
                      <div>
                        <span className="font-medium">Last Fetched:</span>
                        <br />
                        {new Date(source.lastFetched).toLocaleString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Industry Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Industry Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.industries.map((industry) => (
                      <div key={industry._id} className="flex items-center justify-between">
                        <span className="font-medium">{industry._id}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 bg-blue-500 rounded-full"
                              style={{ width: `${(industry.count / stats.articles.total) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{industry.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Category Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Category Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.categories.map((category) => (
                      <div key={category._id} className="flex items-center justify-between">
                        <span className="font-medium">{category._id}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 bg-green-500 rounded-full"
                              style={{ width: `${(category.count / stats.articles.total) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{category.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NewsIngestionDashboard;
