require('dotenv').config({ path: '../../.env' });

console.log('🔍 DEBUG: Starting messaging service debug test...');
console.log('🔍 DEBUG: Environment variables loaded');
console.log('🔍 DEBUG: SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
console.log('🔍 DEBUG: SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set');

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 DEBUG: Dependencies loaded successfully');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3005;

console.log('🔍 DEBUG: Express app and server created');

// Initialize Supabase client
console.log('🔍 DEBUG: Creating Supabase client...');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
console.log('🔍 DEBUG: Supabase client created successfully');

// Initialize Socket.io
console.log('🔍 DEBUG: Creating Socket.io server...');
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});
console.log('🔍 DEBUG: Socket.io server created successfully');

// Basic Socket.io connection handler
io.on('connection', (socket) => {
  console.log('🔍 DEBUG: Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔍 DEBUG: Client disconnected:', socket.id);
  });
});

console.log('🔍 DEBUG: Socket.io event handlers registered');

// Start server
console.log('🔍 DEBUG: Starting server on port', PORT);
server.listen(PORT, () => {
  console.log('✅ DEBUG: Messaging service running on port', PORT);
});

// Error handling
server.on('error', (error) => {
  console.error('❌ DEBUG: Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error('❌ DEBUG: Port', PORT, 'is already in use');
  }
});

process.on('uncaughtException', (error) => {
  console.error('❌ DEBUG: Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ DEBUG: Unhandled Rejection:', reason);
});
