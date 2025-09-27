'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { Bell, X, ExternalLink, AlertTriangle, Newspaper } from 'lucide-react';
import toast from 'react-hot-toast';

interface RealTimeNotificationsProps {
  className?: string;
}

export const RealTimeNotifications: React.FC<RealTimeNotificationsProps> = ({ className = '' }) => {
  const { 
    isConnected, 
    newArticles, 
    breakingNews, 
    systemNotifications,
    clearNotifications 
  } = useWebSocket();
  
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  // Show toast notifications for breaking news
  useEffect(() => {
    if (breakingNews.length > 0) {
      const latestBreaking = breakingNews[0];
      toast.success(
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <div>
            <div className="font-semibold">Breaking News!</div>
            <div className="text-sm">{latestBreaking.title}</div>
          </div>
        </div>,
        {
          duration: 8000,
          position: 'top-right',
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #ef4444',
          },
        }
      );
    }
  }, [breakingNews]);

  // Show toast for new articles
  useEffect(() => {
    if (newArticles.length > 0 && newArticles.length <= 3) {
      const latestArticle = newArticles[0];
      toast(
        <div className="flex items-center space-x-2">
          <Newspaper className="w-4 h-4 text-blue-500" />
          <div>
            <div className="text-sm font-medium">New Article</div>
            <div className="text-xs text-gray-300">{latestArticle.title}</div>
          </div>
        </div>,
        {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#1f2937',
            color: '#fff',
          },
        }
      );
    }
  }, [newArticles]);

  // Update notification badge
  useEffect(() => {
    const totalNotifications = newArticles.length + breakingNews.length + systemNotifications.length;
    setHasNewNotifications(totalNotifications > 0);
  }, [newArticles, breakingNews, systemNotifications]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'breaking-news':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'new-article':
        return <Newspaper className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'breaking-news':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'new-article':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
      >
        <Bell className="w-6 h-6" />
        {hasNewNotifications && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {newArticles.length + breakingNews.length + systemNotifications.length}
          </span>
        )}
        {/* Connection Status Indicator */}
        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} title={isConnected ? 'Connected' : 'Disconnected'} />
      </button>

      {/* Notifications Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Live Updates
              </h3>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-500">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
                <button
                  onClick={clearNotifications}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {/* Breaking News */}
            {breakingNews.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-red-600 mb-2 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Breaking News
                </h4>
                {breakingNews.map((news, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-l-4 ${getNotificationColor('breaking-news')} mb-2`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                          {news.title}
                        </h5>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                          {news.summary}
                        </p>
                        <div className="flex items-center mt-2 space-x-2">
                          <span className="text-xs text-gray-500">
                            {formatTime(news.publishedAt)}
                          </span>
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            {news.industry}
                          </span>
                        </div>
                      </div>
                      <a
                        href={news.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 ml-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* New Articles */}
            {newArticles.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-blue-600 mb-2 flex items-center">
                  <Newspaper className="w-4 h-4 mr-1" />
                  Latest Articles
                </h4>
                {newArticles.slice(0, 5).map((article, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-l-4 ${getNotificationColor('new-article')} mb-2`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                          {article.title}
                        </h5>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                          {article.summary}
                        </p>
                        <div className="flex items-center mt-2 space-x-2">
                          <span className="text-xs text-gray-500">
                            {formatTime(article.publishedAt)}
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {article.industry}
                          </span>
                        </div>
                      </div>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 ml-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* System Notifications */}
            {systemNotifications.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                  <Bell className="w-4 h-4 mr-1" />
                  System Updates
                </h4>
                {systemNotifications.map((notification, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-l-4 ${getNotificationColor('system')} mb-2`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {notification.message}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {newArticles.length === 0 && breakingNews.length === 0 && systemNotifications.length === 0 && (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">No notifications yet</p>
                <p className="text-gray-400 text-xs mt-1">
                  New articles and updates will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
