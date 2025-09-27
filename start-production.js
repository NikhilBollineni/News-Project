#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Production Automotive News Aggregation Application...\n');

// Set environment variables
process.env.NODE_ENV = 'development';
process.env.PORT = '1000';
process.env.CLIENT_URL = 'http://localhost:1001';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:1000/api';

// Start the production server
console.log('📡 Starting backend server...');
const serverProcess = spawn('node', ['server/production-server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: { ...process.env }
});

serverProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Server exited with code ${code}`);
    process.exit(code);
  }
});

// Wait a moment for server to start
setTimeout(() => {
  console.log('\n🌐 Starting frontend client...');
  
  const clientProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'client'),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  });

  clientProcess.on('error', (error) => {
    console.error('❌ Failed to start client:', error.message);
    serverProcess.kill();
    process.exit(1);
  });

  clientProcess.on('exit', (code) => {
    console.log(`\n🟡 Client exited with code ${code}`);
    serverProcess.kill();
    process.exit(code);
  });

}, 3000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🟡 Shutting down gracefully...');
  serverProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🟡 Shutting down gracefully...');
  serverProcess.kill();
  process.exit(0);
});
