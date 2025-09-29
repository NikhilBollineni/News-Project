class WebSocketService {
  constructor(io) {
    this.io = io;
    this.connectedClients = new Set();
    
    this.setupEventHandlers();
    console.log('🔌 WebSocket service initialized');
  }
  
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);
      this.connectedClients.add(socket.id);
      
      // Send current connection count
      this.io.emit('clients_count', this.connectedClients.size);
      
      // Handle client disconnect
      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
        this.io.emit('clients_count', this.connectedClients.size);
      });
      
      // Handle client joining specific rooms
      socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`🔌 Client ${socket.id} joined room: ${room}`);
      });
      
      // Handle client leaving rooms
      socket.on('leave_room', (room) => {
        socket.leave(room);
        console.log(`🔌 Client ${socket.id} left room: ${room}`);
      });
      
      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong');
      });
      
      // Handle client requesting article updates
      socket.on('request_articles', async (data) => {
        try {
          // This would typically fetch latest articles and send them
          socket.emit('articles_update', {
            message: 'Articles update requested',
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          socket.emit('error', {
            message: 'Failed to fetch articles',
            error: error.message
          });
        }
      });
    });
  }
  
  // Broadcast new article to all connected clients
  broadcastNewArticle(article) {
    try {
      const articleData = {
        _id: article._id,  // Frontend expects _id
        id: article._id,   // Backward compatibility
        title: article.title,
        summary: article.summary,
        url: article.url,
        source: article.source,
        industry: article.industry,
        category: article.category,
        sentiment: article.sentiment,
        tags: article.tags,
        publishedAt: article.publishedAt,
        scrapedAt: article.scrapedAt,
        processedByAI: article.processedByAI,
        aiTitle: article.aiTitle,
        aiSummary: article.aiSummary,
        aiCategory: article.aiCategory,
        aiSentiment: article.aiSentiment,
        aiTags: article.aiTags,
        importance: article.importance
      };
      
      this.io.emit('new_article', {
        article: articleData,
        timestamp: new Date().toISOString(),
        message: 'New automotive article added'
      });
      
      console.log(`📡 Broadcasted new article: ${article.title}`);
    } catch (error) {
      console.error('❌ Error broadcasting new article:', error.message);
    }
  }
  
  // Broadcast article update to all connected clients
  broadcastArticleUpdate(article) {
    try {
      const articleData = {
        id: article._id,
        title: article.title,
        summary: article.summary,
        url: article.url,
        source: article.source,
        industry: article.industry,
        category: article.category,
        sentiment: article.sentiment,
        tags: article.tags,
        publishedAt: article.publishedAt,
        scrapedAt: article.scrapedAt,
        processedByAI: article.processedByAI,
        aiTitle: article.aiTitle,
        aiSummary: article.aiSummary,
        aiCategory: article.aiCategory,
        aiSentiment: article.aiSentiment,
        aiTags: article.aiTags,
        importance: article.importance
      };
      
      this.io.emit('article_updated', {
        article: articleData,
        timestamp: new Date().toISOString(),
        message: 'Article updated'
      });
      
      console.log(`📡 Broadcasted article update: ${article.title}`);
    } catch (error) {
      console.error('❌ Error broadcasting article update:', error.message);
    }
  }
  
  // Broadcast system status to all connected clients
  broadcastSystemStatus(status) {
    try {
      this.io.emit('system_status', {
        status,
        timestamp: new Date().toISOString()
      });
      
      console.log(`📡 Broadcasted system status: ${status}`);
    } catch (error) {
      console.error('❌ Error broadcasting system status:', error.message);
    }
  }
  
  // Broadcast refresh progress to all connected clients
  broadcastRefreshProgress(progress) {
    try {
      this.io.emit('refresh_progress', {
        progress,
        timestamp: new Date().toISOString()
      });
      
      console.log(`📡 Broadcasted refresh progress: ${progress.message}`);
    } catch (error) {
      console.error('❌ Error broadcasting refresh progress:', error.message);
    }
  }
  
  // Broadcast error to all connected clients
  broadcastError(error) {
    try {
      this.io.emit('system_error', {
        error: {
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        timestamp: new Date().toISOString()
      });
      
      console.log(`📡 Broadcasted error: ${error.message}`);
    } catch (broadcastError) {
      console.error('❌ Error broadcasting error:', broadcastError.message);
    }
  }
  
  // Get connected clients count
  getConnectedClientsCount() {
    return this.connectedClients.size;
  }
  
  // Get all connected clients
  getConnectedClients() {
    return Array.from(this.connectedClients);
  }
  
  // Send message to specific client
  sendToClient(clientId, event, data) {
    try {
      this.io.to(clientId).emit(event, data);
      console.log(`📡 Sent ${event} to client ${clientId}`);
    } catch (error) {
      console.error(`❌ Error sending to client ${clientId}:`, error.message);
    }
  }
  
  // Send message to specific room
  sendToRoom(room, event, data) {
    try {
      this.io.to(room).emit(event, data);
      console.log(`📡 Sent ${event} to room ${room}`);
    } catch (error) {
      console.error(`❌ Error sending to room ${room}:`, error.message);
    }
  }
  
  // Broadcast to all clients
  broadcast(event, data) {
    try {
      this.io.emit(event, data);
      console.log(`📡 Broadcasted ${event} to all clients`);
    } catch (error) {
      console.error(`❌ Error broadcasting ${event}:`, error.message);
    }
  }
}

module.exports = WebSocketService;