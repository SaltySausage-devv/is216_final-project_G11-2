const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const multer = require('multer');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
require('dotenv').config({ path: '../../.env' });

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});
const PORT = process.env.PORT || 3005;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Initialize DOMPurify for XSS protection
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Input sanitization function
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

// RabbitMQ removed - using direct Socket.io + Supabase messaging

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Rate limiting - More generous for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased from 100 to 1000 requests per window
  message: {
    error: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// JWT verification middleware
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user profile from database
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    req.user = {
      userId: user.id,
      email: user.email,
      userType: userProfile?.user_type || 'student'
    };
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Socket.io authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return next(new Error('Authentication error'));
    }

    // Get user profile from database
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    socket.userId = user.id;
    socket.userType = userProfile?.user_type || 'student';
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    return next(new Error('Authentication error'));
  }
});

// Store active connections
const activeConnections = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected to Socket.io`)
  activeConnections.set(socket.userId, socket);

  // Join conversation room
  socket.on('join_conversation', (data) => {
    const { conversationId } = data;
    console.log(`User ${socket.userId} joining conversation room: conversation_${conversationId}`);
    socket.join(`conversation_${conversationId}`);
  });

  // Leave conversation room
  socket.on('leave_conversation', (data) => {
    const { conversationId } = data;
    console.log(`User ${socket.userId} leaving conversation room: conversation_${conversationId}`);
    socket.leave(`conversation_${conversationId}`);
  });

  // Handle new message
  socket.on('send_message', async (data) => {
    try {
      const { conversationId, content, messageType = 'text' } = data;

      // First, verify the conversation exists and user is a participant
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('participant1_id, participant2_id')
        .eq('id', conversationId)
        .single();

      if (convError || !conversation) {
        throw new Error('Conversation not found');
      }

      // Verify user is a participant in this conversation
      if (conversation.participant1_id !== socket.userId && conversation.participant2_id !== socket.userId) {
        throw new Error('Unauthorized: Not a participant in this conversation');
      }

      // Sanitize message content
      const sanitizedContent = sanitizeInput(content);

      // Save message to database
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: socket.userId,
          content: sanitizedContent,
          message_type: messageType,
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          sender:sender_id (
            first_name,
            last_name,
            user_type
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      // Broadcast message to conversation room
      console.log(`Broadcasting message to room: conversation_${conversationId}`);
      console.log('Message data:', message);
      io.to(`conversation_${conversationId}`).emit('new_message', message);

      // Update conversation last message
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_content: sanitizedContent
        })
        .eq('id', conversationId);

    } catch (error) {
      console.error('Message send error:', error);
      socket.emit('message_error', { 
        error: 'Failed to send message',
        details: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      });
    }
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    const { conversationId } = data;
    socket.to(`conversation_${conversationId}`).emit('user_typing', {
      userId: socket.userId,
      isTyping: true
    });
  });

  socket.on('typing_stop', (data) => {
    const { conversationId } = data;
    socket.to(`conversation_${conversationId}`).emit('user_typing', {
      userId: socket.userId,
      isTyping: false
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    activeConnections.delete(socket.userId);
  });
});

// Validation schemas
const createConversationSchema = Joi.object({
  participantId: Joi.string().uuid().required(),
  bookingId: Joi.string().uuid().allow(null).optional()
});


const sendMessageSchema = Joi.object({
  conversationId: Joi.string().uuid().required(),
  content: Joi.string().max(1000).required(),
  messageType: Joi.string().valid('text', 'image', 'file', 'document').default('text')
});

// Routes

// Get available participants for messaging based on user type
app.get('/messaging/participants', verifyToken, async (req, res) => {
  try {
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, first_name, last_name, user_type, email');

    if (allUsersError) {
      console.error('Supabase error:', allUsersError);
      throw allUsersError;
    }
    
    // Apply messaging rules based on current user type
    let participants = [];
    
    if (req.user.userType === 'student') {
      // Students can only message tutors
      participants = allUsers?.filter(user => 
        user.user_type === 'tutor' && user.id !== req.user.userId
      ) || [];
    } else if (req.user.userType === 'tutor') {
      // Tutors can only message students
      participants = allUsers?.filter(user => 
        user.user_type === 'student' && user.id !== req.user.userId
      ) || [];
    }

    res.json({ participants });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
});

// Create or get existing conversation
app.post('/messaging/conversations', verifyToken, async (req, res) => {
  try {
    const { error, value } = createConversationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { participantId, bookingId } = value;

    // First, check if conversation already exists (in either direction)
    const { data: existingConversations, error: searchError } = await supabase
      .from('conversations')
      .select(`
        id, 
        participant1_id, 
        participant2_id, 
        created_at, 
        last_message_at, 
        last_message_content,
        participant1:participant1_id (
          first_name,
          last_name,
          user_type
        ),
        participant2:participant2_id (
          first_name,
          last_name,
          user_type
        )
      `)
      .or(`and(participant1_id.eq.${req.user.userId},participant2_id.eq.${participantId}),and(participant1_id.eq.${participantId},participant2_id.eq.${req.user.userId})`)
      .limit(1);

    if (searchError) {
      throw searchError;
    }

    if (existingConversations && existingConversations.length > 0) {
      // Return existing conversation
      return res.json({ 
        conversation: existingConversations[0],
        message: 'Using existing conversation'
      });
    }

    // Create new conversation if none exists
    const { data: conversation, error: insertError } = await supabase
      .from('conversations')
      .insert({
        participant1_id: req.user.userId,
        participant2_id: participantId,
        booking_id: bookingId,
        created_at: new Date().toISOString()
      })
      .select(`
        id, 
        participant1_id, 
        participant2_id, 
        created_at, 
        last_message_at, 
        last_message_content,
        participant1:participant1_id (
          first_name,
          last_name,
          user_type
        ),
        participant2:participant2_id (
          first_name,
          last_name,
          user_type
        )
      `)
      .single();

    if (insertError) {
      throw insertError;
    }

    res.status(201).json({
      message: 'Conversation created successfully',
      conversation
    });
  } catch (error) {
    console.error('Conversation creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/messaging/conversations', verifyToken, async (req, res) => {
  try {
    // Validate and sanitize pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))

    const offset = (page - 1) * limit;

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participant1:participant1_id (
          first_name,
          last_name,
          user_type
        ),
        participant2:participant2_id (
          first_name,
          last_name,
          user_type
        )
      `)
      .or(`participant1_id.eq.${req.user.userId},participant2_id.eq.${req.user.userId}`)
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Add unread count for each conversation
    const conversationsWithUnreadCount = await Promise.all(
      conversations.map(async (conversation) => {
        // Count unread messages for this conversation
        const { count: unreadCount, error: countError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversation.id)
          .neq('sender_id', req.user.userId)
          .is('read_at', null)
          .is('deleted_at', null);

        if (countError) {
          console.error('Error counting unread messages:', countError);
        }

        return {
          ...conversation,
          unreadCount: unreadCount || 0
        };
      })
    );

    res.json({ conversations: conversationsWithUnreadCount });
  } catch (error) {
    console.error('Conversations fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/messaging/conversations/:id/messages', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    // Validate and sanitize pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50))

    // Verify user is participant in conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('participant1_id, participant2_id')
      .eq('id', id)
      .single();

    if (!conversation || 
        (conversation.participant1_id !== req.user.userId && 
         conversation.participant2_id !== req.user.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const offset = (page - 1) * limit;

      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id (
            first_name,
            last_name,
            user_type
          )
        `)
        .eq('conversation_id', id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Messages fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/messaging/conversations/:id/messages', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = sendMessageSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Verify user is participant in conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('participant1_id, participant2_id')
      .eq('id', id)
      .single();

    if (!conversation || 
        (conversation.participant1_id !== req.user.userId && 
         conversation.participant2_id !== req.user.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Sanitize message content
    const sanitizedContent = sanitizeInput(value.content);

    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: id,
        sender_id: req.user.userId,
        content: sanitizedContent,
        message_type: value.messageType,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        sender:sender_id (
          first_name,
          last_name,
          user_type
        )
      `)
      .single();

    if (insertError) {
      throw insertError;
    }

    // Update conversation last message
    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_content: sanitizedContent
      })
      .eq('id', id);

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Message send error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/messaging/conversations/:id/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { messageType } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify user is participant in conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('participant1_id, participant2_id')
      .eq('id', id)
      .single();

    if (!conversation || 
        (conversation.participant1_id !== req.user.userId && 
         conversation.participant2_id !== req.user.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Upload file to Supabase Storage
    const fileName = `messages/${id}/${Date.now()}_${req.file.originalname}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('message-files')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype
      });

    if (uploadError) {
      throw uploadError;
    }

    // Save message with file reference
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: id,
        sender_id: req.user.userId,
        content: uploadData.path,
        message_type: messageType || 'file',
        file_name: req.file.originalname,
        file_size: req.file.size,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        sender:sender_id (
          first_name,
          last_name,
          user_type
        )
      `)
      .single();

    if (insertError) {
      throw insertError;
    }

    res.status(201).json({
      message: 'File uploaded successfully',
      data: message
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/messaging/conversations/:id/read', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Mark messages as read
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', id)
      .neq('sender_id', req.user.userId)
      .is('read_at', null);

    if (error) {
      throw error;
    }

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a message (soft delete)
app.delete('/messaging/messages/:messageId', verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params;

    // Verify user is the sender of the message
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('sender_id, conversation_id')
      .eq('id', messageId)
      .single();

    if (fetchError) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Soft delete the message
    const { error: deleteError } = await supabase
      .from('messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', messageId);

    if (deleteError) {
      throw deleteError;
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Message deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Archive a conversation
app.put('/messaging/conversations/:id/archive', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify user is participant in conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('participant1_id, participant2_id, status')
      .eq('id', id)
      .single();

    if (!conversation || 
        (conversation.participant1_id !== req.user.userId && 
         conversation.participant2_id !== req.user.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (conversation.status === 'archived') {
      return res.status(400).json({ error: 'Conversation already archived' });
    }

    // Archive the conversation
    const { error } = await supabase
      .from('conversations')
      .update({ status: 'archived' })
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({ message: 'Conversation archived successfully' });
  } catch (error) {
    console.error('Conversation archive error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread message count for a conversation
app.get('/messaging/conversations/:id/unread-count', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify user is participant in conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('participant1_id, participant2_id')
      .eq('id', id)
      .single();

    if (!conversation || 
        (conversation.participant1_id !== req.user.userId && 
         conversation.participant2_id !== req.user.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Count unread messages
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', id)
      .neq('sender_id', req.user.userId)
      .is('read_at', null)
      .is('deleted_at', null);

    if (error) {
      throw error;
    }

    res.json({ unreadCount: count || 0 });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// RabbitMQ functions removed - using direct Socket.io + Supabase messaging

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'messaging',
    architecture: 'Socket.io + Supabase'
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Messaging service running on port ${PORT}`);
});

// Handle server errors gracefully
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please kill the existing process or use a different port.`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});
