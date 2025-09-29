const { io } = require('socket.io-client');

console.log('🔌 Test WebSocket client starting...');
console.log('Connecting to: http://localhost:1000');
console.log('Press Ctrl+C to exit');

const socket = io('http://localhost:1000', {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log(`✅ Test client connected: ${socket.id}`);
  console.log('🎧 Listening for new_article events...');
});

socket.on('disconnect', () => {
  console.log('❌ Test client disconnected');
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message);
});

socket.on('new_article', (data) => {
  console.log('📰 NEW ARTICLE RECEIVED:');
  console.log('   Title:', data.article?.title);
  console.log('   ID:', data.article?._id);
  console.log('   Timestamp:', data.timestamp);
  console.log('   Message:', data.message);
  console.log('---');
});

socket.on('article_processed', (data) => {
  console.log('🤖 ARTICLE PROCESSED:');
  console.log('   Article ID:', data.articleId);
  console.log('   AI Category:', data.aiCategory);
  console.log('   AI Sentiment:', data.aiSentiment);
  console.log('---');
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test client...');
  socket.disconnect();
  process.exit(0);
});
