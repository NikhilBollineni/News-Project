import React from 'react';
import { X, Search } from 'lucide-react';
import { useCategories } from '../hooks/useArticles';

interface Filters {
  industry: string;
  category?: string;
  sentiment?: string;
  tags?: string;
  search?: string;
  sort: string;
}

interface FiltersProps {
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
  onClose: () => void;
}

export const Filters: React.FC<FiltersProps> = ({
  filters,
  onFilterChange,
  onClose
}) => {
  const { categories, loading: categoriesLoading } = useCategories();

  const handleInputChange = (field: keyof Filters, value: string) => {
    onFilterChange({ [field]: value || undefined });
  };

  const clearFilters = () => {
    onFilterChange({
      industry: 'automotive',
      category: undefined,
      sentiment: undefined,
      tags: undefined,
      search: undefined,
      sort: 'latest'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleInputChange('search', e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Industry
          </label>
          <select
            value={filters.industry}
            onChange={(e) => handleInputChange('industry', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="automotive">Automotive</option>
            <option value="technology">Technology</option>
            <option value="finance">Finance</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={filters.category || ''}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categoriesLoading ? (
              <option disabled>Loading...</option>
            ) : (
              categories.map((category) => (
                <option key={category.key} value={category.key}>
                  {category.display}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Sentiment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sentiment
          </label>
          <select
            value={filters.sentiment || ''}
            onChange={(e) => handleInputChange('sentiment', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Sentiments</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <input
            type="text"
            value={filters.tags || ''}
            onChange={(e) => handleInputChange('tags', e.target.value)}
            placeholder="Comma-separated tags"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Sort */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={filters.sort}
            onChange={(e) => handleInputChange('sort', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
            <option value="sentiment">Highest Sentiment</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <button
          onClick={clearFilters}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Clear All Filters
        </button>
        
        <div className="text-sm text-gray-500">
          {Object.values(filters).filter(Boolean).length} filters active
        </div>
      </div>
    </div>
  );
};
