import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  newArticles: any[];
  breakingNews: any[];
  systemNotifications: any[];
  subscribeToIndustry: (industry: string) => void;
  unsubscribeFromIndustry: (industry: string) => void;
  clearNotifications: () => void;
}

export const useWebSocket = (): UseWebSocketReturn => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newArticles, setNewArticles] = useState<any[]>([]);
  const [breakingNews, setBreakingNews] = useState<any[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<any[]>([]);

  useEffect(() => {

    // Initialize socket connection
    const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5016', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setIsConnected(true);
      
      // Subscribe to default industries
      socket.emit('subscribe-industry', 'automotive');
    });

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      setIsConnected(false);
    });


    // News events
    socket.on('new-article', (message: WebSocketMessage) => {
      console.log('📰 New article received:', message.data.title);
      setNewArticles(prev => [message.data, ...prev.slice(0, 9)]); // Keep last 10
    });

    socket.on('breaking-news', (message: WebSocketMessage) => {
      console.log('🚨 Breaking news received:', message.data.title);
      setBreakingNews(prev => [message.data, ...prev.slice(0, 4)]); // Keep last 5
    });

    socket.on('article-updated', (message: WebSocketMessage) => {
      console.log('📝 Article updated:', message.data.title);
      // You could update the article in your state here
    });

    socket.on('system-notification', (message: WebSocketMessage) => {
      console.log('🔔 System notification:', message.data.message);
      setSystemNotifications(prev => [message.data, ...prev.slice(0, 9)]); // Keep last 10
    });

    // Health check
    socket.on('pong', () => {
      // Connection is healthy
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const subscribeToIndustry = (industry: string) => {
    if (socketRef.current) {
      socketRef.current.emit('subscribe-industry', industry);
    }
  };

  const unsubscribeFromIndustry = (industry: string) => {
    if (socketRef.current) {
      socketRef.current.emit('unsubscribe-industry', industry);
    }
  };

  const clearNotifications = () => {
    setNewArticles([]);
    setBreakingNews([]);
    setSystemNotifications([]);
  };

  return {
    socket: socketRef.current,
    isConnected,
    newArticles,
    breakingNews,
    systemNotifications,
    subscribeToIndustry,
    unsubscribeFromIndustry,
    clearNotifications,
  };
};
