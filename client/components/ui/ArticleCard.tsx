'use client';

import React, { useState } from 'react';
import { 
  ExternalLink, 
  Bookmark, 
  Share2, 
  Eye, 
  Clock, 
  Tag, 
  Building2,
  TrendingUp,
  AlertTriangle,
  Heart,
  MessageCircle
} from 'lucide-react';
import { LoadingSkeleton } from './LoadingSpinner';
import { showSuccessToast, showErrorToast } from './EnhancedToast';

interface ArticleCardProps {
  article: {
    _id: string;
    title: string;
    summary: string;
    category: string;
    industry: string;
    sentiment: string;
    tags: string[];
    source: {
      name: string;
      url: string;
    };
    publishedAt: string;
    url: string;
    importance: number;
    engagement: {
      views: number;
      bookmarks: number;
    };
  };
  isLoading?: boolean;
  onBookmark?: (articleId: string) => void;
  onShare?: (article: any) => void;
  className?: string;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  isLoading = false,
  onBookmark,
  onShare,
  className = ''
}) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleBookmark = async () => {
    try {
      setIsBookmarked(!isBookmarked);
      if (onBookmark) {
        await onBookmark(article._id);
      }
      showSuccessToast(
        isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks'
      );
    } catch (error) {
      showErrorToast('Failed to update bookmark');
      setIsBookmarked(!isBookmarked); // Revert on error
    }
  };

  const handleShare = async () => {
    try {
      setIsSharing(true);
      
      if (navigator.share) {
        await navigator.share({
          title: article.title,
          text: article.summary,
          url: article.url
        });
      } else {
        await navigator.clipboard.writeText(article.url);
        showSuccessToast('Link copied to clipboard');
      }
      
      if (onShare) {
        await onShare(article);
      }
    } catch (error) {
      showErrorToast('Failed to share article');
    } finally {
      setIsSharing(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'negative':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'neutral':
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getImportanceIcon = (importance: number) => {
    if (importance >= 4) {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    } else if (importance >= 3) {
      return <TrendingUp className="w-4 h-4 text-orange-500" />;
    }
    return null;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <LoadingSkeleton lines={4} height="h-4" />
        <div className="mt-4 flex space-x-2">
          <LoadingSkeleton lines={1} height="h-6" className="w-20" />
          <LoadingSkeleton lines={1} height="h-6" className="w-16" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 group ${className}`}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 px-2 py-1 rounded-full">
              {article.industry}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${getSentimentColor(article.sentiment)}`}>
              {article.sentiment}
            </span>
            {getImportanceIcon(article.importance)}
          </div>
          
          <div className="flex items-center space-x-1 text-gray-500 text-sm">
            <Clock className="w-4 h-4" />
            <span>{formatTimeAgo(article.publishedAt)}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {article.title}
        </h3>

        {/* Summary */}
        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-4">
          {article.summary}
        </p>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {article.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded"
              >
                <Tag className="w-3 h-3 inline mr-1" />
                {tag}
              </span>
            ))}
            {article.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{article.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Source */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <Building2 className="w-4 h-4 mr-1" />
          <span>{article.source.name}</span>
        </div>

        {/* Engagement Stats */}
        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-1">
            <Eye className="w-4 h-4" />
            <span>{article.engagement.views.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Heart className="w-4 h-4" />
            <span>{article.engagement.bookmarks}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle className="w-4 h-4" />
            <span>{Math.floor(Math.random() * 50)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleBookmark}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isBookmarked
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            <span>{isBookmarked ? 'Saved' : 'Save'}</span>
          </button>

          <button
            onClick={handleShare}
            disabled={isSharing}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            <span>{isSharing ? 'Sharing...' : 'Share'}</span>
          </button>
        </div>

        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <span>Read More</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};
