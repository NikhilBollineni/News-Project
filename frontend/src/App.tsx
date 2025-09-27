import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { ArticleList } from './components/ArticleList';
import { Filters } from './components/Filters';
import { Stats } from './components/Stats';
import { WebSocketProvider } from './hooks/useWebSocket';
import { useArticles } from './hooks/useArticles';
import { Search, Filter, TrendingUp, Activity } from 'lucide-react';

interface Article {
  id: string;
  ai_title: string;
  title_original: string;
  publisher: string;
  published_at: string;
  industry: string;
  category: string;
  short_summary: string;
  long_summary: string;
  sentiment_label: string;
  sentiment_score: number;
  entities: Array<{ type: string; name: string }>;
  tags: string[];
  url: string;
  created_at: string;
}

interface Filters {
  industry: string;
  category?: string;
  sentiment?: string;
  tags?: string;
  search?: string;
  sort: string;
}

function App() {
  const [filters, setFilters] = useState<Filters>({
    industry: 'automotive',
    sort: 'latest'
  });
  
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  
  const {
    articles,
    loading,
    error,
    totalPages,
    totalArticles,
    refetch
  } = useArticles(filters, page);

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <WebSocketProvider>
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <TrendingUp className="h-8 w-8 text-primary-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Automotive News Hub</h1>
                  <p className="text-sm text-gray-500">Real-time industry insights</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="btn btn-secondary flex items-center space-x-2"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </button>
                
                <button
                  onClick={refetch}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <Activity className="h-4 w-4" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <Filters
                filters={filters}
                onFilterChange={handleFilterChange}
                onClose={() => setShowFilters(false)}
              />
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Stats />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <ArticleList
                articles={articles}
                loading={loading}
                error={error}
                page={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>
      </div>
    </WebSocketProvider>
  );
}

export default App;
