import React from 'react';
import { ArticleCard } from './ArticleCard';
import { Pagination } from './Pagination';
import { LoadingSpinner } from './LoadingSpinner';
import { AlertCircle, RefreshCw } from 'lucide-react';

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

interface ArticleListProps {
  articles: Article[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const ArticleList: React.FC<ArticleListProps> = ({
  articles,
  loading,
  error,
  page,
  totalPages,
  onPageChange
}) => {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="card text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Articles</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary flex items-center space-x-2 mx-auto"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="card text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Articles Found</h3>
        <p className="text-gray-600">Try adjusting your filters or check back later for new content.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Articles Grid */}
      <div className="grid gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};
