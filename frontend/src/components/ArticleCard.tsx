import React, { useState } from 'react';
import { ExternalLink, Calendar, User, Tag, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

interface ArticleCardProps {
  article: Article;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const [expanded, setExpanded] = useState(false);

  const getSentimentIcon = () => {
    switch (article.sentiment_label) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSentimentColor = () => {
    switch (article.sentiment_label) {
      case 'positive':
        return 'badge-positive';
      case 'negative':
        return 'badge-negative';
      default:
        return 'badge-neutral';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      product_launch: 'bg-blue-100 text-blue-800',
      regulation: 'bg-purple-100 text-purple-800',
      corporate_financial: 'bg-green-100 text-green-800',
      technology: 'bg-orange-100 text-orange-800',
      recall: 'bg-red-100 text-red-800',
      market_sales: 'bg-yellow-100 text-yellow-800',
      opinion: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const formatCategory = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {article.ai_title}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>{article.publisher}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          {getSentimentIcon()}
          <span className={`badge ${getSentimentColor()}`}>
            {article.sentiment_label}
          </span>
        </div>
      </div>

      {/* Category and Tags */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={`badge ${getCategoryColor(article.category)}`}>
          {formatCategory(article.category)}
        </span>
        {article.tags.slice(0, 3).map((tag, index) => (
          <span key={index} className="badge bg-gray-100 text-gray-700">
            <Tag className="h-3 w-3 mr-1" />
            {tag}
          </span>
        ))}
        {article.tags.length > 3 && (
          <span className="text-sm text-gray-500">
            +{article.tags.length - 3} more
          </span>
        )}
      </div>

      {/* Summary */}
      <div className="mb-4">
        <p className="text-gray-700 line-clamp-3">
          {article.short_summary}
        </p>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Full Summary</h4>
          <p className="text-gray-700 text-sm leading-relaxed">
            {article.long_summary}
          </p>
          
          {/* Entities */}
          {article.entities.length > 0 && (
            <div className="mt-4">
              <h5 className="font-medium text-gray-900 mb-2">Key Entities</h5>
              <div className="flex flex-wrap gap-2">
                {article.entities.map((entity, index) => (
                  <span key={index} className="badge bg-blue-100 text-blue-800">
                    {entity.name} ({entity.type})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {expanded ? 'Show Less' : 'Read More'}
          </button>
          
          <div className="text-sm text-gray-500">
            Sentiment: {(article.sentiment_score * 100).toFixed(0)}%
          </div>
        </div>
        
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary flex items-center space-x-2"
        >
          <ExternalLink className="h-4 w-4" />
          <span>Read Original</span>
        </a>
      </div>
    </div>
  );
};
