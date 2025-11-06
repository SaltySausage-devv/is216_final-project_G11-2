console.log('🔍 STARTUP: Loading dependencies...');

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

console.log('🔍 STARTUP: Dependencies loaded, loading environment variables...');
// Load environment variables (optional for Railway deployment)
try {
  require('dotenv').config({ path: '../../.env' });
} catch (error) {
  console.log('⚠️ Could not load .env file, using system environment variables');
}
console.log('🔍 STARTUP: Environment variables loaded');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://tutorconnect-production.up.railway.app',
      'https://beautiful-celebration-production.up.railway.app',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true
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

// Helper function to create notification for message recipient
const createMessageNotification = async (senderId, conversationId, messageContent) => {
  try {
    console.log(`🔔 Creating notification for message in conversation ${conversationId} from sender ${senderId}`);
    
    // Get conversation to find recipient
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('participant1_id, participant2_id')
      .eq('id', conversationId)
      .maybeSingle();

    if (convError || !conversation) {
      console.error('❌ Failed to fetch conversation for notification:', convError);
      return null;
    }

    // Determine recipient (the other participant)
    const recipientId = conversation.participant1_id === senderId 
      ? conversation.participant2_id 
      : conversation.participant1_id;

    if (!recipientId) {
      console.error('❌ No recipient found for notification');
      return null;
    }

    console.log(`🔔 Recipient ID: ${recipientId}`);

    // Get sender name for notification
    const { data: sender } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', senderId)
      .maybeSingle();

    const senderName = sender 
      ? `${sender.first_name} ${sender.last_name}`.trim()
      : 'Someone';

    const notificationMessage = `${senderName}: ${messageContent.substring(0, 100)}${messageContent.length > 100 ? '...' : ''}`;

    // Create notification in database
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type: 'push',
        subject: 'New Message',
        message: notificationMessage,
        data: {
          conversationId,
          messageType: 'text',
          senderId
        },
        status: 'sent',
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .maybeSingle();

    if (notifError) {
      console.error('❌ Failed to create notification:', notifError);
      return null;
    }

    console.log(`✅ Notification created for user ${recipientId}, ID: ${notification?.id}`);
    
    // Return notification data for socket broadcasting
    return {
      notification,
      recipientId,
      senderName,
      messagePreview: notificationMessage
    };
  } catch (error) {
    console.error('❌ Error creating message notification:', error);
    return null;
  }
};

// Helper function to create notification for booking offer recipient
const createBookingOfferNotification = async (senderId, conversationId, bookingOffer) => {
  try {
    console.log(`🔔 Creating notification for booking offer in conversation ${conversationId} from sender ${senderId}`);
    
    // Get conversation to find recipient
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('participant1_id, participant2_id')
      .eq('id', conversationId)
      .maybeSingle();

    if (convError || !conversation) {
      console.error('❌ Failed to fetch conversation for notification:', convError);
      return null;
    }

    // Determine recipient (the other participant)
    const recipientId = conversation.participant1_id === senderId 
      ? conversation.participant2_id 
      : conversation.participant1_id;

    if (!recipientId) {
      console.error('❌ No recipient found for notification');
      return null;
    }

    console.log(`🔔 Recipient ID: ${recipientId}`);

    // Get sender name for notification
    const { data: sender } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', senderId)
      .maybeSingle();

    const senderName = sender 
      ? `${sender.first_name} ${sender.last_name}`.trim()
      : 'Someone';

    // Create a descriptive notification message for booking offer
    const sessionType = bookingOffer.is_online ? 'Online' : 'On-site';
    const notificationMessage = `${senderName} sent a booking request for ${bookingOffer.subject || 'a session'} (${sessionType})`;

    // Create notification in database
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type: 'push',
        subject: 'Booking Request',
        message: notificationMessage,
        data: {
          conversationId,
          messageType: 'booking_offer',
          senderId,
          bookingOfferId: bookingOffer.id
        },
        status: 'sent',
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .maybeSingle();

    if (notifError) {
      console.error('❌ Failed to create notification:', notifError);
      return null;
    }

    console.log(`✅ Booking offer notification created for user ${recipientId}, ID: ${notification?.id}`);
    
    // Return notification data for socket broadcasting
    return {
      notification,
      recipientId,
      senderName,
      messagePreview: notificationMessage
    };
  } catch (error) {
    console.error('❌ Error creating booking offer notification:', error);
    return null;
  }
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
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://tutorconnect-production.up.railway.app',
    'https://beautiful-celebration-production.up.railway.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());

// Rate limiting - More generous for development, skip for OPTIONS requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased from 100 to 1000 requests per window
  message: {
    error: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS'
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
      .maybeSingle();

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
  
  console.log('🔍 AUTH: Socket authentication attempt for token:', token ? 'Present' : 'Missing');
  
  if (!token) {
    console.log('🔍 AUTH: No token provided, allowing connection for now');
    socket.userId = 'anonymous';
    socket.userType = 'student';
    return next();
  }

  try {
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.log('🔍 AUTH: Token verification failed:', error?.message || 'No user');
      socket.userId = 'anonymous';
      socket.userType = 'student';
      return next();
    }

    // Get user profile from database
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    socket.userId = user.id;
    socket.userType = userProfile?.user_type || 'student';
    console.log('🔍 AUTH: User authenticated:', user.id, 'Type:', socket.userType);
    console.log('🔍 AUTH: Socket authentication successful, proceeding to connection handler');
    next();
  } catch (error) {
    console.error('🔍 AUTH: Socket authentication error:', error);
    socket.userId = 'anonymous';
    socket.userType = 'student';
    return next();
  }
});

// Store active connections
const activeConnections = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 SOCKET: User ${socket.userId} connected to Socket.io`)
  console.log(`🔌 SOCKET: User type: ${socket.userType}`);
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
        .maybeSingle();

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
        .maybeSingle();

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

      // Create notification for recipient and broadcast it - AWAIT to ensure it's created
      try {
        const notifResult = await createMessageNotification(socket.userId, conversationId, sanitizedContent);
        
        if (notifResult && notifResult.notification) {
          const notificationPayload = {
            id: notifResult.notification.id,
            type: 'push',
            subject: 'New Message',
            message: notifResult.notification.message,
            data: notifResult.notification.data,
            created_at: notifResult.notification.created_at,
            read_at: null,
            senderName: notifResult.senderName,
            recipientId: notifResult.recipientId // Include recipientId so frontend can filter
          };
          
          // Broadcast to conversation room (like new_message) - works if recipient is in room
          console.log(`🔔 Broadcasting notification to conversation room: conversation_${conversationId}`);
          io.to(`conversation_${conversationId}`).emit('new_notification', notificationPayload);
          
          // ALSO send directly to recipient socket if they're connected (fallback for new conversations)
          // This ensures they get it even if they haven't joined the room yet
          const recipientSocket = activeConnections.get(notifResult.recipientId);
          if (recipientSocket) {
            console.log(`🔔 Also sending notification directly to recipient ${notifResult.recipientId}`);
            recipientSocket.emit('new_notification', notificationPayload);
          } else {
            console.log(`⚠️ Recipient ${notifResult.recipientId} not connected via socket, notification saved to database for later fetch`);
          }
          
          console.log(`✅ Notification created and broadcasted, recipient: ${notifResult.recipientId}`);
        } else {
          console.error('❌ Notification creation returned null/undefined result');
        }
      } catch (err) {
        // Log error but don't fail the message send - notification is created in DB
        console.error('❌ Notification creation/broadcast failed:', err);
        console.log('⚠️ Message sent successfully but notification may not have been created - recipient should fetch from DB');
      }

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
  messageType: Joi.string().valid('text', 'image', 'file', 'document', 'booking_offer', 'booking_proposal', 'booking_confirmation', 'booking_rejection', 'reschedule_request', 'reschedule_accepted', 'reschedule_rejected', 'booking_cancelled', 'attendance_marked', 'session_completed', 'attendance_notification').default('text'),
  bookingOfferId: Joi.string().uuid().allow(null).optional()
});

const createBookingOfferSchema = Joi.object({
  conversationId: Joi.string().uuid().required(),
  isOnline: Joi.boolean().default(false),
  tuteeLocation: Joi.string().allow(null, '').optional(),
  notes: Joi.string().max(500).allow(null, '').optional(),
  subject: Joi.string().allow(null, '').optional(),
  level: Joi.string().allow(null, '').optional()
});

const createBookingProposalSchema = Joi.object({
  bookingOfferId: Joi.string().uuid().required(),
  proposedTime: Joi.date().required(),
  proposedEndTime: Joi.date().optional(),
  duration: Joi.number().min(1).max(480).optional(),
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
      // Students can only message tutors with 100% profile completion
      const tutorUsers = allUsers?.filter(user => 
        user.user_type === 'tutor' && user.id !== req.user.userId
      ) || [];
      
      // Fetch tutor profiles and filter by completeness
      const tutorIds = tutorUsers.map(t => t.id);
      if (tutorIds.length > 0) {
        const { data: tutorProfiles, error: profilesError } = await supabase
          .from('tutor_profiles')
          .select('user_id, bio, headline, teaching_philosophy, subjects, levels, languages, qualifications, experience_years, previous_experience, hourly_rate, location, specialties, preferred_locations')
          .in('user_id', tutorIds);
        
        if (profilesError) {
          console.error('Error fetching tutor profiles:', profilesError);
          // Continue without filtering if profile fetch fails
          participants = tutorUsers;
        } else {
          // Calculate completeness for each tutor and filter to 100% only
          const completeTutorIds = new Set();
          
          // Fetch user info for completeness calculation
          const { data: tutorUserData, error: usersError } = await supabase
            .from('users')
            .select('id, first_name, last_name, date_of_birth')
            .in('id', tutorIds);
          
          const userMap = new Map();
          if (tutorUserData && !usersError) {
            tutorUserData.forEach(user => {
              userMap.set(user.id, user);
            });
          }
          
          tutorProfiles.forEach(profile => {
            let completeness = 0;
            const pointsPerField = 100 / 16; // 16 fields: 13 tutor profile + 3 user info
            
            const user = userMap.get(profile.user_id);
            
            // Personal Information fields (3)
            if (user && user.first_name && user.first_name.trim().length > 0) completeness += pointsPerField;
            if (user && user.last_name && user.last_name.trim().length > 0) completeness += pointsPerField;
            if (user && user.date_of_birth) completeness += pointsPerField;
            
            // Professional Information fields (13)
            if (profile.bio && profile.bio.trim().length > 0) completeness += pointsPerField;
            if (profile.headline && profile.headline.trim().length > 0) completeness += pointsPerField;
            if (profile.teaching_philosophy && profile.teaching_philosophy.trim().length > 0) completeness += pointsPerField;
            if (profile.subjects && profile.subjects.length > 0) completeness += pointsPerField;
            if (profile.levels && profile.levels.length > 0) completeness += pointsPerField;
            if (profile.languages && profile.languages.length > 0) completeness += pointsPerField;
            
            const validQualifications = profile.qualifications && profile.qualifications.filter(q =>
              q.degree && q.degree.trim() && q.institution && q.institution.trim() && q.year
            );
            if (validQualifications && validQualifications.length > 0) completeness += pointsPerField;
            
            if (profile.experience_years && profile.experience_years > 0) completeness += pointsPerField;
            if (profile.previous_experience && profile.previous_experience.trim().length > 0) completeness += pointsPerField;
            if (profile.hourly_rate !== null && profile.hourly_rate !== undefined) completeness += pointsPerField;
            if (profile.location && profile.location.address && profile.location.address.trim().length > 0) completeness += pointsPerField;
            if (profile.specialties && profile.specialties.length > 0) completeness += pointsPerField;
            if (profile.preferred_locations && profile.preferred_locations.length > 0) completeness += pointsPerField;
            
            const roundedCompleteness = Math.round(completeness);
            if (roundedCompleteness === 100) {
              completeTutorIds.add(profile.user_id);
            }
          });
          
          // Filter to only include tutors with 100% complete profiles
          participants = tutorUsers.filter(user => completeTutorIds.has(user.id));
          
          console.log(`📊 Filtered tutors: ${tutorUsers.length} total, ${participants.length} with 100% completion`);
        }
      }
    } else if (req.user.userType === 'tutor') {
      // Tutors can only message students (no profile completion requirement for students)
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
          id,
          first_name,
          last_name,
          user_type
        ),
        participant2:participant2_id (
          id,
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
          id,
          first_name,
          last_name,
          user_type
        ),
        participant2:participant2_id (
          id,
          first_name,
          last_name,
          user_type
        )
      `)
      .maybeSingle();

    // Auto-join both participants to the conversation room so they can receive notifications
    if (conversation && !insertError) {
      const participant1Socket = activeConnections.get(conversation.participant1_id);
      const participant2Socket = activeConnections.get(conversation.participant2_id);
      
      if (participant1Socket) {
        participant1Socket.join(`conversation_${conversation.id}`);
        console.log(`🔔 Auto-joined participant1 (${conversation.participant1_id}) to conversation room: conversation_${conversation.id}`);
      }
      if (participant2Socket) {
        participant2Socket.join(`conversation_${conversation.id}`);
        console.log(`🔔 Auto-joined participant2 (${conversation.participant2_id}) to conversation room: conversation_${conversation.id}`);
      }
    }

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
    console.log('🔍 CONVERSATIONS: Fetching conversations for user:', req.user.userId);
    
    // Validate and sanitize pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))

    const offset = (page - 1) * limit;
    console.log('🔍 CONVERSATIONS: Pagination - page:', page, 'limit:', limit, 'offset:', offset);

    console.log('🔍 CONVERSATIONS: Starting database query...');
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participant1:participant1_id (
          id,
          first_name,
          last_name,
          user_type
        ),
        participant2:participant2_id (
          id,
          first_name,
          last_name,
          user_type
        )
      `)
      .or(`participant1_id.eq.${req.user.userId},participant2_id.eq.${req.user.userId}`)
      .not('last_message_content', 'is', null) // Only return conversations that have messages
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    console.log('🔍 CONVERSATIONS: Database query completed');
    console.log('🔍 CONVERSATIONS: Query result:', { 
      conversationsCount: conversations?.length || 0, 
      hasError: !!error,
      errorMessage: error?.message 
    });

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
    console.error('🔍 CONVERSATIONS: Error fetching conversations:', error);
    console.error('🔍 CONVERSATIONS: Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
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
      .maybeSingle();

    if (!conversation || 
        (conversation.participant1_id !== req.user.userId && 
         conversation.participant2_id !== req.user.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const offset = (page - 1) * limit;

    console.log(`📨 Fetching messages for conversation: ${id}`);

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
      console.error('📨 Messages fetch error:', error);
      throw error;
    }

    console.log(`📨 Fetched ${messages?.length || 0} messages`);
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
      .maybeSingle();

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
      .maybeSingle();

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

    // Create notification for recipient and broadcast it - AWAIT to ensure it's created before response
    try {
      const notifResult = await createMessageNotification(req.user.userId, id, sanitizedContent);
      
      if (notifResult && notifResult.notification) {
        const notificationPayload = {
          id: notifResult.notification.id,
          type: 'push',
          subject: 'New Message',
          message: notifResult.notification.message,
          data: notifResult.notification.data,
          created_at: notifResult.notification.created_at,
          read_at: null,
          senderName: notifResult.senderName,
          recipientId: notifResult.recipientId // Include recipientId so frontend can filter
        };
        
        // Broadcast to conversation room (like new_message) - works if recipient is in room
        console.log(`🔔 Broadcasting notification to conversation room: conversation_${id}`);
        io.to(`conversation_${id}`).emit('new_notification', notificationPayload);
        
        // ALSO send directly to recipient socket if they're connected (fallback for new conversations)
        // This ensures they get it even if they haven't joined the room yet
        const recipientSocket = activeConnections.get(notifResult.recipientId);
        if (recipientSocket) {
          console.log(`🔔 Also sending notification directly to recipient ${notifResult.recipientId}`);
          recipientSocket.emit('new_notification', notificationPayload);
        } else {
          console.log(`⚠️ Recipient ${notifResult.recipientId} not connected via socket, notification saved to database for later fetch`);
        }
        
        console.log(`✅ Notification created and broadcasted, recipient: ${notifResult.recipientId}`);
      } else {
        console.error('❌ Notification creation returned null/undefined result');
      }
    } catch (err) {
      // Log error but don't fail the message send - notification is created in DB
      console.error('❌ Notification creation/broadcast failed:', err);
      console.log('⚠️ Message sent successfully but notification may not have been created - recipient should fetch from DB');
    }

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
      .maybeSingle();

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
      .maybeSingle();

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
      .maybeSingle();

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
      .maybeSingle();

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
// Endpoint to emit booking update events (called by bookings/calendar service)
app.post('/messaging/booking-updated', verifyToken, async (req, res) => {
  try {
    const { bookingId, tutorId, studentId, updateType } = req.body; // updateType: 'attendance_marked' or 'completed'
    
    if (!bookingId || !tutorId || !studentId || !updateType) {
      return res.status(400).json({ error: 'Missing required fields: bookingId, tutorId, studentId, updateType' });
    }
    
    console.log(`📢 Broadcasting booking update event: bookingId=${bookingId}, type=${updateType}`);
    
    // Emit event to both tutor and student
    const tutorSocket = activeConnections.get(tutorId);
    const studentSocket = activeConnections.get(studentId);
    
    const eventData = {
      bookingId,
      updateType, // 'attendance_marked' or 'completed'
      timestamp: new Date().toISOString()
    };
    
    if (tutorSocket) {
      tutorSocket.emit('booking_updated', eventData);
      console.log(`✅ Booking update event sent to tutor ${tutorId}`);
    } else {
      console.log(`⚠️ Tutor ${tutorId} not connected, cannot send booking update event`);
    }
    
    if (studentSocket) {
      studentSocket.emit('booking_updated', eventData);
      console.log(`✅ Booking update event sent to student ${studentId}`);
    } else {
      console.log(`⚠️ Student ${studentId} not connected, cannot send booking update event`);
    }
    
    res.json({ 
      success: true, 
      message: 'Booking update event broadcasted',
      tutorSent: !!tutorSocket,
      studentSent: !!studentSocket
    });
  } catch (error) {
    console.error('Error broadcasting booking update:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/messaging/conversations/:id/unread-count', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify user is participant in conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('participant1_id, participant2_id')
      .eq('id', id)
      .maybeSingle();

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
    console.log('📝 BOOKING OFFER: Creating booking offer, request body:', req.body);
    const { error, value } = createBookingOfferSchema.validate(req.body);
    if (error) {
      console.error('❌ BOOKING OFFER: Validation error:', error.details[0].message);
      return res.status(400).json({ error: error.details[0].message });
    }

    const { conversationId, isOnline, tuteeLocation, notes, subject, level } = value;
    console.log('📝 BOOKING OFFER: Parsed values:', { conversationId, isOnline, tuteeLocation, notes, subject, level });

    // Verify user is participant in conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('participant1_id, participant2_id')
      .eq('id', conversationId)
      .maybeSingle();

    if (!conversation ||
        (conversation.participant1_id !== req.user.userId &&
         conversation.participant2_id !== req.user.userId)) {
      console.error('❌ BOOKING OFFER: User is not a participant in conversation');
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Determine tutor and tutee IDs
    const tutorId = conversation.participant1_id === req.user.userId ?
                   conversation.participant2_id : conversation.participant1_id;
    const tuteeId = req.user.userId;
    console.log('📝 BOOKING OFFER: Tutor ID:', tutorId, 'Tutee ID:', tuteeId);

    // Create booking offer
    const bookingOfferData = {
      conversation_id: conversationId,
      tutee_id: tuteeId,
      tutor_id: tutorId,
      is_online: isOnline,
      tutee_location: tuteeLocation,
      notes: notes,
      subject: subject,
      level: level,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    console.log('📝 BOOKING OFFER: Inserting data:', JSON.stringify(bookingOfferData, null, 2));
    
    const { data: bookingOffer, error: insertError } = await supabase
      .from('booking_offers')
      .insert(bookingOfferData)
      .select()
      .maybeSingle();

    if (insertError) {
      console.error('❌ BOOKING OFFER: Insert error:', insertError);
      console.error('❌ BOOKING OFFER: Insert error details:', JSON.stringify(insertError, null, 2));
      throw insertError;
    }
    
    console.log('✅ BOOKING OFFER: Successfully created booking offer:', bookingOffer.id);

    // Create booking offer message
    const messageContent = JSON.stringify({
      bookingOfferId: bookingOffer.id,
      subject: subject,
      level: level,
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
      .maybeSingle();

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

    // Create notification for recipient and broadcast it (same pattern as regular messages)
    createBookingOfferNotification(req.user.userId, conversationId, bookingOffer)
      .then(notifResult => {
        if (notifResult && notifResult.notification) {
          const notificationPayload = {
            id: notifResult.notification.id,
            type: 'push',
            subject: 'Booking Request',
            message: notifResult.notification.message,
            data: notifResult.notification.data,
            created_at: notifResult.notification.created_at,
            read_at: null,
            senderName: notifResult.senderName,
            recipientId: notifResult.recipientId // Include recipientId so frontend can filter
          };
          
          // Broadcast to conversation room (like new_message) - works if recipient is in room
          console.log(`🔔 Broadcasting booking offer notification to conversation room: conversation_${conversationId}`);
          io.to(`conversation_${conversationId}`).emit('new_notification', notificationPayload);
          
          // ALSO send directly to recipient socket if they're connected (fallback for new conversations)
          // This ensures they get it even if they haven't joined the room yet
          const recipientSocket = activeConnections.get(notifResult.recipientId);
          if (recipientSocket) {
            console.log(`🔔 Also sending booking offer notification directly to recipient ${notifResult.recipientId}`);
            recipientSocket.emit('new_notification', notificationPayload);
          }
          
          console.log(`✅ Booking offer notification broadcasted, recipient: ${notifResult.recipientId}`);
        }
      })
      .catch(err => {
        console.error('❌ Booking offer notification creation/broadcast failed:', err);
      });

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

    const { bookingOfferId, proposedTime, proposedEndTime, duration, tutorLocation, finalLocation } = value;

    // Get booking offer and verify user is the tutor
    const { data: bookingOffer, error: fetchError } = await supabase
      .from('booking_offers')
      .select('*, conversations:conversation_id(participant1_id, participant2_id)')
      .eq('id', bookingOfferId)
      .maybeSingle();

    if (fetchError || !bookingOffer) {
      return res.status(404).json({ error: 'Booking offer not found' });
    }

    if (bookingOffer.tutor_id !== req.user.userId) {
      return res.status(403).json({ error: 'Only tutors can create proposals' });
    }

    // Calculate end time if not provided (for backwards compatibility)
    const calculatedEndTime = proposedEndTime || new Date(new Date(proposedTime).getTime() + (duration || 60) * 60000);

    // Update booking offer with proposal
    const { data: updatedOffers, error: updateError } = await supabase
      .from('booking_offers')
      .update({
        proposed_time: proposedTime,
        proposed_end_time: calculatedEndTime,
        duration: duration || 60,
        tutor_location: tutorLocation,
        final_location: finalLocation,
        status: 'proposed',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingOfferId)
      .select();

    if (updateError) {
      throw updateError;
    }

    // Use the first updated offer if multiple were updated
    const updatedOffer = updatedOffers && updatedOffers.length > 0 ? updatedOffers[0] : bookingOffer;

    // Get tutor's hourly rate for credits calculation
    const { data: tutorProfile } = await supabase
      .from('tutor_profiles')
      .select('hourly_rate')
      .eq('user_id', req.user.userId)
      .maybeSingle();

    const hourlyRate = tutorProfile?.hourly_rate || 0;
    const sessionDuration = duration || 60; // in minutes
    const creditsAmount = (hourlyRate * sessionDuration / 60).toFixed(2);

    // Create booking proposal message
    const messageContent = JSON.stringify({
      bookingOfferId: bookingOfferId,
      proposedTime: proposedTime,
      proposedEndTime: calculatedEndTime,
      duration: sessionDuration,
      tutorLocation: tutorLocation,
      finalLocation: finalLocation,
      hourlyRate: hourlyRate,
      creditsAmount: creditsAmount
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
      .maybeSingle();

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
    console.log('🔄 BOOKING CONFIRMATION: Starting booking confirmation process');
    console.log('🔄 BOOKING CONFIRMATION: Request body:', req.body);
    console.log('🔄 BOOKING CONFIRMATION: User ID:', req.user.userId);
    console.log('🔄 BOOKING CONFIRMATION: User object:', req.user);
    
    const { bookingOfferId } = req.body;

    if (!bookingOfferId) {
      console.log('❌ BOOKING CONFIRMATION: No booking offer ID provided');
      return res.status(400).json({ error: 'Booking offer ID is required' });
    }

    // Get booking offer - handle potential duplicates
    console.log('🔄 BOOKING CONFIRMATION: Fetching booking offer with ID:', bookingOfferId);
    
    // First, let's check if there are multiple booking offers with the same ID
    const { data: allOffers, error: allOffersError } = await supabase
      .from('booking_offers')
      .select('*')
      .eq('id', bookingOfferId);

    console.log('🔄 BOOKING CONFIRMATION: All offers with this ID:', { allOffers, allOffersError, count: allOffers?.length });

    if (allOffersError) {
      console.error('❌ BOOKING CONFIRMATION - Error fetching all offers:', allOffersError);
      return res.status(500).json({ error: 'Database error', details: allOffersError.message });
    }

    if (!allOffers || allOffers.length === 0) {
      console.log('❌ BOOKING CONFIRMATION: No booking offers found with ID:', bookingOfferId);
      return res.status(404).json({ error: 'Booking offer not found' });
    }

    if (allOffers.length > 1) {
      console.warn('⚠️ BOOKING CONFIRMATION: Multiple booking offers found with same ID:', bookingOfferId);
      console.warn('⚠️ BOOKING CONFIRMATION: Using the first one:', allOffers[0]);
    }

    // Use the first booking offer if there are duplicates
    const bookingOffer = allOffers[0];
    console.log('🔄 BOOKING CONFIRMATION: Using booking offer:', bookingOffer);


    // Verify user is involved in this booking
    console.log('🔄 BOOKING CONFIRMATION: Verifying user permissions:', {
      tutee_id: bookingOffer.tutee_id,
      tutor_id: bookingOffer.tutor_id,
      user_id: req.user.userId
    });
    
    if (bookingOffer.tutee_id !== req.user.userId && bookingOffer.tutor_id !== req.user.userId) {
      console.log('❌ BOOKING CONFIRMATION: User not authorized for this booking');
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Check if booking offer is already confirmed
    const alreadyConfirmed = bookingOffer.status === 'confirmed';

    // Check if a booking already exists for this offer
    console.log('🔄 BOOKING CONFIRMATION: Checking for existing booking:', {
      tutor_id: bookingOffer.tutor_id,
      student_id: bookingOffer.tutee_id,
      start_time: bookingOffer.proposed_time
    });
    
    const { data: existingBookings, error: bookingCheckError } = await supabase
      .from('bookings')
      .select('*')
      .eq('tutor_id', bookingOffer.tutor_id)
      .eq('student_id', bookingOffer.tutee_id)
      .eq('start_time', bookingOffer.proposed_time);

    // Use the first existing booking if multiple are found
    const existingBooking = existingBookings && existingBookings.length > 0 ? existingBookings[0] : null;

    console.log('🔄 BOOKING CONFIRMATION: Existing booking check result:', { existingBooking, bookingCheckError });

    if (bookingCheckError) {
      console.error('❌ BOOKING CONFIRMATION: Error checking existing booking:', bookingCheckError);
      throw bookingCheckError;
    }

    // Get tutor's actual hourly rate FIRST (before updating status)
    const { data: tutorProfiles, error: tutorProfileError } = await supabase
      .from('tutor_profiles')
      .select('hourly_rate')
      .eq('user_id', bookingOffer.tutor_id);

    // Use the first tutor profile if multiple are found
    const tutorProfile = tutorProfiles && tutorProfiles.length > 0 ? tutorProfiles[0] : null;

    if (tutorProfileError) {
      console.error('❌ Error fetching tutor profile:', tutorProfileError);
    }

    const hourlyRate = tutorProfile?.hourly_rate;
    const sessionDuration = bookingOffer.duration || 60; // in minutes
    const sessionDurationHours = sessionDuration / 60; // convert to hours
    
    let finalHourlyRate = hourlyRate;
    let finalTotalAmount = 0;

    if (!hourlyRate || hourlyRate <= 0) {
      console.warn(`⚠️ Tutor ${bookingOffer.tutor_id} has no hourly rate set, using default 10 credits/hour`);
      finalHourlyRate = 10; // Changed from 50 to 10 to match Tutor A's actual rate
      finalTotalAmount = finalHourlyRate * sessionDurationHours;
      console.log(`💰 Booking credit calculation (DEFAULT): ${finalHourlyRate} credits/hour × ${sessionDurationHours} hours = ${finalTotalAmount} credits`);
    } else {
      finalTotalAmount = hourlyRate * sessionDurationHours;
      console.log(`💰 Booking credit calculation: ${hourlyRate} credits/hour × ${sessionDurationHours} hours = ${finalTotalAmount} credits`);
    }

    // Get tutor's primary subject for the booking (fallback if no subject selected)
    const { data: tutorProfileData } = await supabase
      .from('tutor_profiles')
      .select('subjects')
      .eq('user_id', bookingOffer.tutor_id)
      .single();
    
    const primarySubject = bookingOffer.subject || tutorProfileData?.subjects?.[0] || 'General Tutoring';
    // Validate level - reject invalid values like "Multi-Subject" or "Single Subject"
    const validLevels = ['Primary', 'Secondary', 'JC', 'IB', 'Poly', 'University'];
    const rawLevel = bookingOffer.level || 'Secondary';
    const bookingLevel = validLevels.includes(rawLevel) ? rawLevel : 'Secondary'; // Default to Secondary if invalid

    // CRITICAL: Check credits BEFORE updating booking offer status or creating booking
    // Only check credits for students confirming bookings
    if (bookingOffer.tutee_id === req.user.userId) {
      // Check if credits have already been deducted for this booking offer
      // by checking if the booking already exists and has credits deducted
      if (existingBooking && existingBooking.status === 'confirmed' && existingBooking.total_amount > 0) {
        console.log('✅ Credits already deducted for existing confirmed booking. Skipping credit check.');
      } else {
        // Check if student has sufficient credits before proceeding
        const { data: student, error: studentError } = await supabase
          .from('users')
          .select('credits, user_type')
          .eq('id', bookingOffer.tutee_id)
          .maybeSingle();

        if (studentError) {
          console.error('❌ BOOKING CONFIRMATION: Error fetching student data:', studentError);
          return res.status(500).json({ error: 'Failed to verify student credits' });
        }

        if (!student) {
          console.error('❌ BOOKING CONFIRMATION: Student not found');
          return res.status(404).json({ error: 'Student not found' });
        }

        // Only check credits for students
        if (student.user_type === 'student') {
          const currentCredits = student.credits || 0;
          
          if (currentCredits < finalTotalAmount) {
            const shortfall = finalTotalAmount - currentCredits;
            console.log(`❌ BOOKING CONFIRMATION: Insufficient credits: Student has ${currentCredits}, needs ${finalTotalAmount}, shortfall: ${shortfall}`);
            
            // Send notification to student about insufficient credits
            try {
              await supabase
                .from('notifications')
                .insert({
                  user_id: bookingOffer.tutee_id,
                  type: 'push',
                  subject: 'Insufficient Credits',
                  message: `You need ${shortfall} more credits to confirm this booking. Please top up your credits.`,
                  data: { 
                    notificationType: 'insufficient_credits',
                    bookingOfferId: bookingOfferId,
                    requiredCredits: finalTotalAmount,
                    currentCredits: currentCredits,
                    shortfall: shortfall
                  },
                  status: 'pending',
                  created_at: new Date().toISOString()
                });
              console.log('✅ BOOKING CONFIRMATION: Credit notification saved to database');
            } catch (notificationError) {
              console.error('❌ BOOKING CONFIRMATION: Error saving insufficient credits notification:', notificationError);
            }
            
            return res.status(400).json({ 
              error: 'Insufficient credits', 
              details: {
                requiredCredits: finalTotalAmount,
                currentCredits: currentCredits,
                shortfall: shortfall
              }
            });
          }
        }
      }
    }

    // Only update booking offer status AFTER credit check passes
    let confirmedOffer = bookingOffer;
    if (!alreadyConfirmed) {
      // Update all booking offers with this ID to handle potential duplicates
      const { data: updatedOffers, error: updateError } = await supabase
        .from('booking_offers')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingOfferId)
        .select();

      if (updateError) {
        console.error('❌ BOOKING CONFIRMATION: Error updating booking offer:', updateError);
        throw updateError;
      }

      // Use the first updated offer if multiple were updated
      confirmedOffer = updatedOffers && updatedOffers.length > 0 ? updatedOffers[0] : bookingOffer;
      console.log('✅ BOOKING CONFIRMATION: Updated booking offer(s):', updatedOffers?.length || 0);
    }

    // Create booking record in bookings table (only after credit check passes)
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        tutor_id: bookingOffer.tutor_id,
        student_id: bookingOffer.tutee_id,
        title: `${primarySubject} Session`, // Dynamic title based on selected subject
        subject: primarySubject, // Use selected subject or tutor's primary subject
        level: bookingLevel, // Use level from booking offer
        start_time: bookingOffer.proposed_time,
        end_time: bookingOffer.proposed_end_time || new Date(new Date(bookingOffer.proposed_time).getTime() + (bookingOffer.duration || 60) * 60 * 1000), // Use proposed_end_time or calculate from duration
        location: bookingOffer.final_location,
        is_online: bookingOffer.is_online,
        notes: bookingOffer.notes,
        hourly_rate: finalHourlyRate, // Use actual tutor rate or default
        total_amount: finalTotalAmount, // Calculate based on actual rate and duration
        status: 'confirmed',
        created_at: new Date().toISOString()
      })
      .select();

    if (bookingError) {
      console.error('❌ BOOKING CONFIRMATION: Error creating booking record:', bookingError);
      // Don't fail the whole operation if booking creation fails
    } else {
      console.log('✅ BOOKING CONFIRMATION: Booking record created successfully:', booking);
    }

    // Get the first booking if multiple were created (shouldn't happen but just in case)
    const createdBooking = booking && booking.length > 0 ? booking[0] : null;

    // Handle credit transactions when student confirms booking
    // Deduct credits (only if not already deducted)
    if (bookingOffer.tutee_id === req.user.userId) {
      try {
        console.log('🔄 Processing credit transaction for booking confirmation...');
        
        // Skip if booking already exists and is confirmed (credits already deducted)
        if (existingBooking && existingBooking.status === 'confirmed' && existingBooking.total_amount > 0) {
          console.log('✅ Credits already deducted for existing confirmed booking. Skipping deduction.');
        } else {
          // Get student data again to get latest credits
          const { data: student, error: studentError } = await supabase
            .from('users')
            .select('credits, user_type')
            .eq('id', bookingOffer.tutee_id)
            .maybeSingle();

          if (studentError || !student) {
            console.error('❌ BOOKING CONFIRMATION: Error fetching student data for deduction:', studentError);
            // Don't fail the whole operation, just log the error
          } else if (student.user_type === 'student') {

            // NOTE: Credits are deducted from student but NOT transferred to tutor yet
            // Credits will be held in student account and transferred to tutor only after session completion
            // This prevents tutors from receiving payment for sessions that don't actually happen
            const newStudentCredits = Math.max(0, (student.credits || 0) - finalTotalAmount);
            console.log(`💸 Reserving ${finalTotalAmount} credits from student. Old: ${student.credits}, New: ${newStudentCredits}`);
            
            const { error: studentUpdateError } = await supabase
              .from('users')
              .update({ 
                credits: newStudentCredits,
                updated_at: new Date().toISOString()
              })
              .eq('id', bookingOffer.tutee_id);
              
            if (studentUpdateError) {
              console.error('❌ Error updating student credits:', studentUpdateError);
              throw studentUpdateError; // Throw error to prevent confirmation if credit update fails
            } else {
              console.log('✅ Student credits reserved successfully');
            }

            console.log(`💰 Credits reserved: ${finalTotalAmount} credits held until session completion`);
          }
        }
      } catch (creditError) {
        console.error('❌ Error processing credit transaction:', creditError);
        // Fail the booking confirmation if credit processing fails
        return res.status(500).json({ 
          error: 'Failed to process credit transaction',
          details: creditError.message 
        });
      }
    }

    // Create booking confirmation message
    const messageContent = JSON.stringify({
      bookingOfferId: bookingOfferId,
      confirmedTime: bookingOffer.proposed_time,
      confirmedEndTime: bookingOffer.proposed_end_time,
      duration: bookingOffer.duration,
      location: bookingOffer.final_location,
      isOnline: bookingOffer.is_online,
      bookingId: createdBooking?.id,
      subject: primarySubject,
      level: bookingLevel
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
      .maybeSingle();

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
      booking: createdBooking,
      message
    });
  } catch (error) {
    console.error('❌ BOOKING CONFIRMATION: Unhandled error:', error);
    console.error('❌ BOOKING CONFIRMATION: Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// Reject booking proposal
app.post('/messaging/booking-rejections', verifyToken, async (req, res) => {
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
      .maybeSingle();

    if (fetchError || !bookingOffer) {
      return res.status(404).json({ error: 'Booking offer not found' });
    }

    // Verify user is involved in this booking (student or parent)
    if (bookingOffer.tutee_id !== req.user.userId) {
      return res.status(403).json({ error: 'Only the student can reject booking proposals' });
    }

    // Check if booking offer is already rejected or confirmed
    if (bookingOffer.status === 'rejected') {
      return res.status(400).json({
        error: 'Booking already rejected',
        message: 'This booking proposal has already been rejected.'
      });
    }

    if (bookingOffer.status === 'confirmed') {
      return res.status(400).json({
        error: 'Booking already confirmed',
        message: 'This booking has already been confirmed and cannot be rejected.'
      });
    }

    // Update booking offer to rejected
    const { data: rejectedOffers, error: updateError } = await supabase
      .from('booking_offers')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingOfferId)
      .select();

    if (updateError) {
      throw updateError;
    }

    // Use the first rejected offer if multiple were updated
    const rejectedOffer = rejectedOffers && rejectedOffers.length > 0 ? rejectedOffers[0] : bookingOffer;

    // Create booking rejection message
    const messageContent = JSON.stringify({
      bookingOfferId: bookingOfferId,
      proposedTime: bookingOffer.proposed_time,
      finalLocation: bookingOffer.final_location,
      isOnline: bookingOffer.is_online,
      rejectionReason: 'Booking proposal rejected by student'
    });

    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: bookingOffer.conversation_id,
        sender_id: req.user.userId,
        content: messageContent,
        message_type: 'booking_rejection',
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
      .maybeSingle();

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
        last_message_content: 'Booking proposal rejected'
      })
      .eq('id', bookingOffer.conversation_id);

    res.status(201).json({
      message: 'Booking proposal rejected successfully',
      bookingOffer: rejectedOffer,
      message
    });
  } catch (error) {
    console.error('Booking rejection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get booking offer by ID
app.get('/messaging/booking-offers/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: bookingOffer, error } = await supabase
      .from('booking_offers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!bookingOffer) {
      return res.status(404).json({ error: 'Booking offer not found' });
    }

    // Verify user has access to this booking offer
    if (bookingOffer.tutee_id !== req.user.userId && bookingOffer.tutor_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ bookingOffer });
  } catch (error) {
    console.error('Booking offer fetch error:', error);
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

// System message endpoint (for other services to send messages with Socket.IO broadcast)
app.post('/messaging/system-message', verifyToken, async (req, res) => {
  console.log('📧 MESSAGING: System message endpoint called');
  console.log('📧 MESSAGING: Request body:', req.body);
  console.log('📧 MESSAGING: User ID:', req.user?.userId);
  
  try {
    const { conversationId, content, messageType = 'text' } = req.body;

    if (!conversationId || !content) {
      return res.status(400).json({ error: 'conversationId and content are required' });
    }

    // Verify conversation exists
    const { data: conversation } = await supabase
      .from('conversations')
      .select('participant1_id, participant2_id')
      .eq('id', conversationId)
      .maybeSingle();

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // For system messages, allow sending regardless of user participation
    // For regular messages, verify user is participant in conversation
    const isSystemMessage = messageType === 'booking_cancelled' || 
                           messageType === 'reschedule_request' || 
                           messageType === 'reschedule_accepted' || 
                           messageType === 'reschedule_rejected' ||
                           messageType === 'session_completed' ||
                           messageType === 'attendance_notification';

    if (!isSystemMessage && 
        (conversation.participant1_id !== req.user.userId && 
         conversation.participant2_id !== req.user.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // For system messages, use the authenticated user's ID (the one who triggered the action)
    // This ensures the foreign key constraint is satisfied
    const senderId = req.user.userId;

    // Insert message into database
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content,
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
      .maybeSingle();

    if (insertError) {
      throw insertError;
    }

    // For system messages (like session_completed), ensure both participants are in the room
    // and send directly to them if connected
    if (isSystemMessage) {
      const participants = [conversation.participant1_id, conversation.participant2_id];
      console.log(`📢 System message ${messageType}: Ensuring participants are in room and broadcasting`);
      
      participants.forEach(participantId => {
        const socket = activeConnections.get(participantId);
        if (socket) {
          // Automatically join them to the conversation room
          socket.join(`conversation_${conversationId}`);
          console.log(`📢 Auto-joined user ${participantId} to conversation room: conversation_${conversationId}`);
          
          // Send directly to their socket
          console.log(`📢 Sending ${messageType} directly to user ${participantId}`);
          socket.emit('new_message', message);
        } else {
          console.log(`📢 User ${participantId} not currently connected`);
        }
      });
    }
    
    // Broadcast message to conversation room via Socket.IO
    console.log(`📢 Broadcasting ${messageType} message to room: conversation_${conversationId}`);
    io.to(`conversation_${conversationId}`).emit('new_message', message);

    // Update conversation last message
    const lastMessagePreview = messageType === 'text' ? content : 
                              messageType === 'reschedule_request' ? 'Reschedule request sent' :
                              messageType === 'reschedule_accepted' ? 'Reschedule request accepted' :
                              messageType === 'reschedule_rejected' ? 'Reschedule request declined' : 
                              messageType === 'booking_cancelled' ? 'Booking cancelled' :
                              messageType === 'session_completed' ? 'Session completed' :
                              messageType === 'attendance_notification' ? 'Attendance marked' :
                              'New message';

    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_content: lastMessagePreview
      })
      .eq('id', conversationId);

    res.status(201).json({
      message: 'System message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('📧 MESSAGING: System message error:', error);
    console.error('📧 MESSAGING: Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'messaging',
    architecture: 'Socket.io + Supabase'
  });
});

// Start server
console.log('🔍 STARTUP: Starting server on port', PORT);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Messaging service running on port ${PORT}`);
  console.log('🔍 STARTUP: Server started successfully');
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
