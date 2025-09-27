import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  newArticles: any[];
  clearNewArticles: () => void;
}

export const useWebSocket = (): UseWebSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newArticles, setNewArticles] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io(process.env.REACT_APP_WS_URL || 'ws://localhost:8000', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setIsConnected(true);
      toast.success('Connected to real-time updates');
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      setIsConnected(false);
      toast.error('Disconnected from real-time updates');
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      toast.error('Connection error');
    });

    // Message events
    newSocket.on('new_article', (data) => {
      console.log('📰 New article received:', data);
      setNewArticles(prev => [data, ...prev]);
      toast.success(`New article: ${data.ai_title}`);
    });

    newSocket.on('bulk_articles', (data) => {
      console.log('📰 Bulk articles received:', data);
      toast.success(`${data.count} new articles available`);
    });

    newSocket.on('connection', (data) => {
      console.log('🔌 Connection message:', data);
    });

    newSocket.on('pong', (data) => {
      console.log('🏓 Pong received:', data);
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const clearNewArticles = () => {
    setNewArticles([]);
  };

  return {
    socket,
    isConnected,
    newArticles,
    clearNewArticles
  };
};

// WebSocket Provider Context
import React, { createContext, useContext, ReactNode } from 'react';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  newArticles: any[];
  clearNewArticles: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const webSocket = useWebSocket();

  return (
    <WebSocketContext.Provider value={webSocket}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};
