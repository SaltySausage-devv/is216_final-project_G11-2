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
const DOMPurify = require('isomorphic-dompurify');
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

// Initialize Supabase client with service role key for storage operations
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize DOMPurify for XSS protection
// DOMPurify is now imported directly from isomorphic-dompurify

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
  
  console.log('Token verification:', { 
    hasAuthHeader: !!req.headers.authorization,
    hasToken: !!token,
    endpoint: req.path 
  });
  
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
  messageType: Joi.string().valid('text', 'image', 'file', 'document', 'booking_offer', 'booking_proposal', 'booking_confirmation').default('text'),
  bookingOfferId: Joi.string().uuid().allow(null).optional()
});

const createBookingOfferSchema = Joi.object({
  conversationId: Joi.string().uuid().required(),
  isOnline: Joi.boolean().default(false),
  tuteeLocation: Joi.string().allow(null, '').optional(),
  notes: Joi.string().max(500).allow(null, '').optional()
});

const createBookingProposalSchema = Joi.object({
  bookingOfferId: Joi.string().uuid().required(),
  proposedTime: Joi.date().required(),
  tutorLocation: Joi.string().allow(null, '').optional(),
  finalLocation: Joi.string().allow(null, '').optional()
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
      .not('last_message_content', 'is', null) // Only return conversations that have messages
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

    console.log('Upload request received:', { 
      id, 
      messageType, 
      hasFile: !!req.file,
      userId: req.user?.userId,
      token: req.headers.authorization ? 'present' : 'missing'
    });

    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type - only allow images
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    if (!allowedImageTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ 
        error: 'Only images are allowed',
        message: 'Please upload an image file (JPEG, PNG, GIF, or WebP). Videos are not supported.'
      });
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

    // Upload image to Supabase Storage
    const fileName = `messages/${id}/${Date.now()}_${req.file.originalname}`;
    console.log('Uploading file to Supabase:', { fileName, size: req.file.size, type: req.file.mimetype });
    
    // Create a Supabase client with the user's token for RLS
    const token = req.headers.authorization?.split(' ')[1];
    const userSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );
    
    const { data: uploadData, error: uploadError } = await userSupabase.storage
      .from('message-files')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({ 
        error: 'Failed to upload file to storage',
        details: uploadError.message 
      });
    }

    // Get public URL for the uploaded image
    const { data: publicUrlData } = userSupabase.storage
      .from('message-files')
      .getPublicUrl(uploadData.path);

    // Save message with image reference
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: id,
        sender_id: req.user.userId,
        content: publicUrlData.publicUrl,
        message_type: 'image',
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

    // Broadcast image message to conversation room
    console.log(`Broadcasting image message to room: conversation_${id}`);
    console.log('Image message data:', message);
    io.to(`conversation_${id}`).emit('new_message', message);

    res.status(201).json({
      message: 'Image uploaded successfully',
      data: message
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload image',
      details: error.message,
      code: error.code || 'UPLOAD_ERROR'
    });
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

    // Emit real-time read status update to all users in the conversation
    io.to(`conversation_${id}`).emit('messages_read', {
      conversationId: id,
      readBy: req.user.userId,
      readAt: new Date().toISOString()
    });

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

    // Emit real-time deletion event to all users in the conversation
    io.to(`conversation_${message.conversation_id}`).emit('message_deleted', {
      messageId: messageId,
      conversationId: message.conversation_id,
      deletedBy: req.user.userId
    });

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

// Create booking offer
app.post('/messaging/booking-offers', verifyToken, async (req, res) => {
  try {
    const { error, value } = createBookingOfferSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { conversationId, isOnline, tuteeLocation, notes } = value;

    // Verify user is participant in conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('participant1_id, participant2_id')
      .eq('id', conversationId)
      .single();

    if (!conversation ||
        (conversation.participant1_id !== req.user.userId &&
         conversation.participant2_id !== req.user.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Determine tutor and tutee IDs
    const tutorId = conversation.participant1_id === req.user.userId ?
                   conversation.participant2_id : conversation.participant1_id;
    const tuteeId = req.user.userId;

    // Create booking offer
    const { data: bookingOffer, error: insertError } = await supabase
      .from('booking_offers')
      .insert({
        conversation_id: conversationId,
        tutee_id: tuteeId,
        tutor_id: tutorId,
        is_online: isOnline,
        tutee_location: tuteeLocation,
        notes: notes,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Create booking offer message
    const messageContent = JSON.stringify({
      bookingOfferId: bookingOffer.id,
      isOnline: isOnline,
      tuteeLocation: tuteeLocation,
      notes: notes
    });

    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: req.user.userId,
        content: messageContent,
        message_type: 'booking_offer',
        booking_offer_id: bookingOffer.id,
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

    if (messageError) {
      throw messageError;
    }

    // Broadcast message to conversation room
    io.to(`conversation_${conversationId}`).emit('new_message', message);

    // Update conversation last message
    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_content: 'Booking offer sent'
      })
      .eq('id', conversationId);

    res.status(201).json({
      message: 'Booking offer created successfully',
      bookingOffer,
      message
    });
  } catch (error) {
    console.error('Booking offer creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create booking proposal
app.post('/messaging/booking-proposals', verifyToken, async (req, res) => {
  try {
    const { error, value } = createBookingProposalSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { bookingOfferId, proposedTime, tutorLocation, finalLocation } = value;

    // Get booking offer and verify user is the tutor
    const { data: bookingOffer, error: fetchError } = await supabase
      .from('booking_offers')
      .select('*, conversations:conversation_id(participant1_id, participant2_id)')
      .eq('id', bookingOfferId)
      .single();

    if (fetchError || !bookingOffer) {
      return res.status(404).json({ error: 'Booking offer not found' });
    }

    if (bookingOffer.tutor_id !== req.user.userId) {
      return res.status(403).json({ error: 'Only tutors can create proposals' });
    }

    // Update booking offer with proposal
    const { data: updatedOffer, error: updateError } = await supabase
      .from('booking_offers')
      .update({
        proposed_time: proposedTime,
        tutor_location: tutorLocation,
        final_location: finalLocation,
        status: 'proposed',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingOfferId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Create booking proposal message
    const messageContent = JSON.stringify({
      bookingOfferId: bookingOfferId,
      proposedTime: proposedTime,
      tutorLocation: tutorLocation,
      finalLocation: finalLocation
    });

    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: bookingOffer.conversation_id,
        sender_id: req.user.userId,
        content: messageContent,
        message_type: 'booking_proposal',
        booking_offer_id: bookingOfferId,
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

    if (messageError) {
      throw messageError;
    }

    // Broadcast message to conversation room
    io.to(`conversation_${bookingOffer.conversation_id}`).emit('new_message', message);

    // Update conversation last message
    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_content: 'Booking proposal sent'
      })
      .eq('id', bookingOffer.conversation_id);

    res.status(201).json({
      message: 'Booking proposal created successfully',
      bookingOffer: updatedOffer,
      message
    });
  } catch (error) {
    console.error('Booking proposal creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Confirm booking
app.post('/messaging/booking-confirmations', verifyToken, async (req, res) => {
  try {
    const { bookingOfferId } = req.body;

    if (!bookingOfferId) {
      return res.status(400).json({ error: 'Booking offer ID is required' });
    }

    // Get booking offer
    const { data: bookingOffer, error: fetchError } = await supabase
      .from('booking_offers')
      .select('*')
      .eq('id', bookingOfferId)
      .single();

    if (fetchError || !bookingOffer) {
      return res.status(404).json({ error: 'Booking offer not found' });
    }

    // Verify user is involved in this booking
    if (bookingOffer.tutee_id !== req.user.userId && bookingOffer.tutor_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Check if booking offer is already confirmed
    if (bookingOffer.status === 'confirmed') {
      return res.status(400).json({
        error: 'Booking already confirmed',
        message: 'This booking has already been accepted and cannot be confirmed again.'
      });
    }

    // Check if a booking already exists for this offer
    const { data: existingBooking, error: bookingCheckError } = await supabase
      .from('bookings')
      .select('id')
      .eq('tutor_id', bookingOffer.tutor_id)
      .eq('student_id', bookingOffer.tutee_id)
      .eq('start_time', bookingOffer.proposed_time)
      .single();

    if (existingBooking) {
      return res.status(400).json({
        error: 'Booking already exists',
        message: 'A booking for this time slot has already been created. Please check your calendar.',
        bookingId: existingBooking.id
      });
    }

    // Update booking offer to confirmed
    const { data: confirmedOffer, error: updateError } = await supabase
      .from('booking_offers')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingOfferId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Create booking record in bookings table
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        tutor_id: bookingOffer.tutor_id,
        student_id: bookingOffer.tutee_id,
        subject: 'Tutoring Session', // Default subject
        level: 'General', // Default level
        start_time: bookingOffer.proposed_time,
        end_time: new Date(new Date(bookingOffer.proposed_time).getTime() + 60 * 60 * 1000), // 1 hour session
        location: bookingOffer.final_location,
        is_online: bookingOffer.is_online,
        notes: bookingOffer.notes,
        hourly_rate: 50, // Default rate - this could come from tutor profile
        total_amount: 50, // Default amount for 1 hour
        status: 'confirmed',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking record:', bookingError);
      // Don't fail the whole operation if booking creation fails
    }

    // Create booking confirmation message
    const messageContent = JSON.stringify({
      bookingOfferId: bookingOfferId,
      confirmedTime: bookingOffer.proposed_time,
      location: bookingOffer.final_location,
      isOnline: bookingOffer.is_online,
      bookingId: booking?.id
    });

    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: bookingOffer.conversation_id,
        sender_id: req.user.userId,
        content: messageContent,
        message_type: 'booking_confirmation',
        booking_offer_id: bookingOfferId,
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

    if (messageError) {
      throw messageError;
    }

    // Broadcast message to conversation room
    io.to(`conversation_${bookingOffer.conversation_id}`).emit('new_message', message);

    // Update conversation last message
    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_content: 'Booking confirmed!'
      })
      .eq('id', bookingOffer.conversation_id);

    res.status(201).json({
      message: 'Booking confirmed successfully',
      bookingOffer: confirmedOffer,
      booking: booking,
      message
    });
  } catch (error) {
    console.error('Booking confirmation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's bookings
app.get('/messaging/bookings', verifyToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = supabase
      .from('booking_offers')
      .select(`
        *,
        tutee:tutee_id (
          first_name,
          last_name,
          email
        ),
        tutor:tutor_id (
          first_name,
          last_name,
          email
        )
      `)
      .or(`tutee_id.eq.${req.user.userId},tutor_id.eq.${req.user.userId}`);

    if (status) {
      query = query.eq('status', status);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data: bookings, error } = await query;

    if (error) {
      throw error;
    }

    res.json({ bookings });
  } catch (error) {
    console.error('Bookings fetch error:', error);
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

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);

  // Close Socket.io connections
  io.close(() => {
    console.log('🔌 Socket.io connections closed');
  });

  // Close HTTP server
  server.close(() => {
    console.log('🛑 HTTP server closed');

    // Close database connections
    if (supabase) {
      console.log('🗄️  Database connections closed');
    }

    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle server errors gracefully
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error(`💡 Run 'npm run cleanup' or './scripts/cleanup-ports.sh' to free the port`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
});

// Handle uncaught exceptions - exit gracefully to prevent zombie processes
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('🔄 Restarting service due to uncaught exception...');
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('🔄 Restarting service due to unhandled rejection...');
  gracefulShutdown('unhandledRejection');
});
