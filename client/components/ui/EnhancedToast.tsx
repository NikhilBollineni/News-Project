'use client';

import React from 'react';
import toast from 'react-hot-toast';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Loader2,
  ExternalLink,
  Copy,
  Share2
} from 'lucide-react';

interface ToastOptions {
  duration?: number;
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
  style?: React.CSSProperties;
  className?: string;
}

const toastStyles = {
  success: {
    background: '#10b981',
    color: '#fff',
    border: '1px solid #059669',
  },
  error: {
    background: '#ef4444',
    color: '#fff',
    border: '1px solid #dc2626',
  },
  warning: {
    background: '#f59e0b',
    color: '#fff',
    border: '1px solid #d97706',
  },
  info: {
    background: '#3b82f6',
    color: '#fff',
    border: '1px solid #2563eb',
  },
  loading: {
    background: '#6b7280',
    color: '#fff',
    border: '1px solid #4b5563',
  }
};

export const showSuccessToast = (message: string, options?: ToastOptions) => {
  return toast.success(
    <div className="flex items-center space-x-2">
      <CheckCircle className="w-5 h-5" />
      <span>{message}</span>
    </div>,
    {
      duration: 4000,
      position: 'top-right',
      style: toastStyles.success,
      ...options
    }
  );
};

export const showErrorToast = (message: string, options?: ToastOptions) => {
  return toast.error(
    <div className="flex items-center space-x-2">
      <XCircle className="w-5 h-5" />
      <span>{message}</span>
    </div>,
    {
      duration: 6000,
      position: 'top-right',
      style: toastStyles.error,
      ...options
    }
  );
};

export const showWarningToast = (message: string, options?: ToastOptions) => {
  return toast(
    <div className="flex items-center space-x-2">
      <AlertTriangle className="w-5 h-5" />
      <span>{message}</span>
    </div>,
    {
      duration: 5000,
      position: 'top-right',
      style: toastStyles.warning,
      ...options
    }
  );
};

export const showInfoToast = (message: string, options?: ToastOptions) => {
  return toast(
    <div className="flex items-center space-x-2">
      <Info className="w-5 h-5" />
      <span>{message}</span>
    </div>,
    {
      duration: 4000,
      position: 'top-right',
      style: toastStyles.info,
      ...options
    }
  );
};

export const showLoadingToast = (message: string, options?: ToastOptions) => {
  return toast.loading(
    <div className="flex items-center space-x-2">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span>{message}</span>
    </div>,
    {
      duration: Infinity,
      position: 'top-right',
      style: toastStyles.loading,
      ...options
    }
  );
};

export const showArticleToast = (article: any, type: 'new' | 'breaking' = 'new') => {
  const isBreaking = type === 'breaking';
  
  return toast(
    <div className="flex items-start space-x-3 max-w-sm">
      <div className={`w-5 h-5 mt-0.5 ${isBreaking ? 'text-red-500' : 'text-blue-500'}`}>
        {isBreaking ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isBreaking ? 'text-red-100' : 'text-blue-100'}`}>
          {isBreaking ? 'Breaking News!' : 'New Article'}
        </p>
        <p className="text-xs text-gray-200 truncate mt-1">
          {article.title}
        </p>
        <div className="flex items-center mt-2 space-x-2">
          <span className="text-xs bg-white/20 px-2 py-1 rounded">
            {article.industry}
          </span>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gray-200"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>,
    {
      duration: isBreaking ? 8000 : 5000,
      position: 'top-right',
      style: isBreaking ? toastStyles.error : toastStyles.info,
    }
  );
};

export const showConnectionToast = (connected: boolean) => {
  if (connected) {
    return showSuccessToast('Connected to live updates', { duration: 3000 });
  } else {
    return showWarningToast('Disconnected from live updates', { duration: 5000 });
  }
};

export const showCacheToast = (hit: boolean, responseTime?: number) => {
  if (hit) {
    return showInfoToast(
      `Cache hit - ${responseTime}ms`, 
      { duration: 2000 }
    );
  } else {
    return showInfoToast(
      `Cache miss - ${responseTime}ms`, 
      { duration: 2000 }
    );
  }
};

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

export const dismissAllToasts = () => {
  toast.dismiss();
};
