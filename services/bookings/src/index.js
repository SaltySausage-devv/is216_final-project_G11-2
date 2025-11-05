const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const cron = require('node-cron');
const axios = require('axios');
// const multer = require('multer');
try {
  // Load environment variables (optional for Railway deployment)
  try {
    require('dotenv').config({ path: '../../.env' });
  } catch (error) {
    console.log('⚠️ Could not load .env file, using system environment variables');
  }
  console.log('✅ Environment variables loaded');
} catch (error) {
  console.log('⚠️ Could not load .env file, using system environment variables');
}

const app = express();
const PORT = process.env.PORT || 3004;
console.log('✅ Express app created, PORT:', PORT);

// Initialize Supabase client
console.log('🔗 Initializing Supabase client...');
// Initialize Supabase client
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
console.log('✅ Supabase client initialized');

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://tutorconnect-production.up.railway.app',
    'https://beautiful-celebration-production.up.railway.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Configure multer for file uploads (temporarily disabled)
// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB limit
//   },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image files are allowed'), false);
//     }
//   }
// });

// Rate limiting - skip for OPTIONS requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased for development
  skip: (req) => req.method === 'OPTIONS'
});
app.use(limiter);

// Helper function to send messages via messaging service (with Socket.IO broadcast)
async function sendMessageViaMessagingService(conversationId, content, messageType, authToken) {
  try {
    const messagingServiceUrl = process.env.MESSAGING_SERVICE_URL || 'http://localhost:3005';
    console.log(`📧 Sending to messaging service: ${messagingServiceUrl}/messaging/system-message`);
    console.log(`📧 Request data:`, { conversationId, content, messageType });
    console.log(`📧 Auth token available:`, !!authToken);
    
    const response = await axios.post(`${messagingServiceUrl}/messaging/system-message`, {
      conversationId,
      content,
      messageType
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      timeout: 10000 // 10 second timeout
    });

    console.log('✅ Message sent via messaging service:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Error sending message via messaging service:', error.message);
    console.error('❌ Error response data:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    console.error('❌ Error code:', error.code);
    console.error('❌ Full error:', error);
    return false;
  }
}

// JWT verification middleware - using Supabase token
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('❌ Token verification failed:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user profile from database
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    req.user = {
      userId: user.id, // Use user.id from Supabase (UUID format)
      email: user.email,
      userType: userProfile?.user_type || 'student'
    };

    console.log('✅ Token verified successfully, userId:', req.user.userId);
    next();
  } catch (error) {
    console.error('❌ Token verification error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Validation schemas
const createBookingSchema = Joi.object({
  tutorId: Joi.number().required(),
  studentId: Joi.number().required(),
  subject: Joi.string().required(),
  level: Joi.string().required(),
  startTime: Joi.date().required(),
  endTime: Joi.date().required(),
  location: Joi.string().optional(),
  isOnline: Joi.boolean().default(false),
  notes: Joi.string().max(500).optional(),
  hourlyRate: Joi.number().min(0).required()
});

const updateAvailabilitySchema = Joi.object({
  dayOfWeek: Joi.number().min(0).max(6).required(),
  startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  isAvailable: Joi.boolean().required()
});

// Routes
app.get('/bookings/availability/:tutorId', async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { startDate, endDate } = req.query;

    let query = supabase
      .from('availability_slots')
      .select('*')
      .eq('tutor_id', tutorId);

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data: availability, error } = await query.order('date', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({ availability });
  } catch (error) {
    console.error('Availability fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/bookings/availability', verifyToken, async (req, res) => {
  try {
    if (req.user.userType !== 'tutor') {
      return res.status(403).json({ error: 'Only tutors can set availability' });
    }

    const { error, value } = updateAvailabilitySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { data: availability, error: insertError } = await supabase
      .from('availability_slots')
      .insert({
        tutor_id: req.user.userId,
        ...value,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    res.status(201).json({
      message: 'Availability updated successfully',
      availability
    });
  } catch (error) {
    console.error('Availability update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/bookings', verifyToken, async (req, res) => {
  try {
    const { error, value } = createBookingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if slot is available
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('tutor_id', value.tutorId)
      .eq('start_time', value.startTime)
      .eq('status', 'confirmed');

    if (existingBooking) {
      return res.status(400).json({ error: 'Time slot is already booked' });
    }

    // Calculate total amount
    const duration = (new Date(value.endTime) - new Date(value.startTime)) / (1000 * 60 * 60);
    const totalAmount = duration * value.hourlyRate;

    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        ...value,
        total_amount: totalAmount,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/bookings/student/:studentId', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    let query = supabase
      .from('bookings')
      .select(`
        *,
        tutors:tutor_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq('student_id', studentId);

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
    console.error('Student bookings fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific booking by ID
app.get('/bookings/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.userId;

    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        tutor:tutor_id (
          first_name,
          last_name,
          email
        ),
        student:student_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Booking not found' });
      }
      throw error;
    }

    // Verify user has access to this booking (either student or tutor)
    if (booking.student_id !== currentUserId && booking.tutor_id !== currentUserId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Booking fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/bookings/tutor/:tutorId', verifyToken, async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    let query = supabase
      .from('bookings')
      .select(`
        *,
        students:student_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq('tutor_id', tutorId);

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
    console.error('Tutor bookings fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/bookings/:id/confirm', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is the tutor for this booking
    const { data: booking } = await supabase
      .from('bookings')
      .select('tutor_id, status')
      .eq('id', id)
      .single();

    if (!booking || booking.tutor_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Booking is not in pending status' });
    }

    const { data: updatedBooking, error } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      message: 'Booking confirmed successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Booking confirmation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/bookings/:id/cancel', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Check if user is involved in this booking
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (!booking || (booking.tutor_id !== req.user.userId && booking.student_id !== req.user.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    // Calculate time difference to determine refund policy
    const bookingTime = new Date(booking.start_time);
    const now = new Date();
    const timeDiff = bookingTime - now;
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    const isMoreThan24Hours = hoursDiff > 24;

    console.log(`🕐 Cancellation timing: ${hoursDiff.toFixed(2)} hours before session (24h+ = ${isMoreThan24Hours})`);

    // Calculate credits to refund (based on hourly rate and duration)
    const duration = (new Date(booking.end_time) - new Date(booking.start_time)) / (1000 * 60 * 60);
    const creditsToRefund = booking.hourly_rate * duration;

    console.log(`💰 Credits calculation: ${booking.hourly_rate} rate × ${duration} hours = ${creditsToRefund} credits`);

    const { data: updatedBooking, error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Determine who cancelled and apply appropriate refund policy
    const cancellerId = req.user.userId;
    const isTutorCancelling = cancellerId === booking.tutor_id;
    const isStudentCancelling = cancellerId === booking.student_id;
    
    // If tutor cancels, student always gets refunded regardless of timing
    // If student cancels, apply 24-hour policy
    const shouldRefundStudent = isTutorCancelling || isMoreThan24Hours;
    
    if (shouldRefundStudent) {
      const refundReason = isTutorCancelling ? 'tutor cancelled' : 'more than 24 hours';
      console.log(`✅ ${refundReason} - processing full refund to student`);
      
      // Student gets credits back
      const { data: student, error: studentError } = await supabase
        .from('users')
        .select('credits')
        .eq('id', booking.student_id)
        .single();

      if (studentError) {
        console.error('❌ Error fetching student credits:', studentError);
      } else {
        const newStudentCredits = (student.credits || 0) + creditsToRefund;
        console.log(`💸 Refunding ${creditsToRefund} credits to student. Old: ${student.credits}, New: ${newStudentCredits}`);
        
        const { error: studentUpdateError } = await supabase
          .from('users')
          .update({ 
            credits: newStudentCredits,
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.student_id);
          
        if (studentUpdateError) {
          console.error('❌ Error updating student credits:', studentUpdateError);
        } else {
          console.log('✅ Student credits refunded successfully');
        }
      }

      // NOTE: No tutor credit deduction needed - credits were never transferred to tutor
      // Credits were only reserved at booking confirmation, so refunding student is all that's needed
      console.log('ℹ️ No tutor credit action needed - credits were held, not transferred');
    } else {
      // Only happens when student cancels less than 24 hours before
      // Tutor receives 100% of the credits as compensation for late cancellation
      console.log('❌ Student cancelled less than 24 hours - transferring 100% credits to tutor');
      console.log(`💰 Transferring ${creditsToRefund} credits from student to tutor`);
      
      // Get tutor's current credits
      const { data: tutor, error: tutorError } = await supabase
        .from('users')
        .select('credits')
        .eq('id', booking.tutor_id)
        .single();

      if (tutorError) {
        console.error('❌ Error fetching tutor credits:', tutorError);
      } else {
        const newTutorCredits = (tutor.credits || 0) + creditsToRefund;
        console.log(`💸 Transferring ${creditsToRefund} credits to tutor. Old: ${tutor.credits}, New: ${newTutorCredits}`);
        
        const { error: tutorUpdateError } = await supabase
          .from('users')
          .update({ 
            credits: newTutorCredits,
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.tutor_id);
          
        if (tutorUpdateError) {
          console.error('❌ Error updating tutor credits:', tutorUpdateError);
        } else {
          console.log('✅ Tutor credits updated successfully - received 100% compensation for late cancellation');
        }
      }
      
      // Student does not get refund - credits remain deducted as late cancellation penalty
      console.log('ℹ️ Student credits remain deducted - no refund for late cancellation (< 24 hours)');
    }

    // Handle penalty points for tutors
    if (isTutorCancelling) {
      const penaltyPointsToAdd = isMoreThan24Hours ? 0 : 1;
      console.log(`⚠️ Tutor cancellation - adding ${penaltyPointsToAdd} penalty points`);
      
      if (penaltyPointsToAdd > 0) {
        // Get current penalty points
        const { data: tutorProfile, error: tutorProfileError } = await supabase
          .from('tutor_profiles')
          .select('penalty_points')
          .eq('user_id', booking.tutor_id)
          .single();

        if (tutorProfileError) {
          console.error('❌ Error fetching tutor penalty points:', tutorProfileError);
        } else {
          const currentPenaltyPoints = tutorProfile?.penalty_points || 0;
          const newPenaltyPoints = currentPenaltyPoints + penaltyPointsToAdd;
          
          console.log(`⚠️ Updating penalty points: ${currentPenaltyPoints} + ${penaltyPointsToAdd} = ${newPenaltyPoints}`);
          
          const { error: penaltyUpdateError } = await supabase
            .from('tutor_profiles')
            .update({ 
              penalty_points: newPenaltyPoints,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', booking.tutor_id);
            
          if (penaltyUpdateError) {
            console.error('❌ Error updating tutor penalty points:', penaltyUpdateError);
          } else {
            console.log('✅ Tutor penalty points updated successfully');
            
            // Check if account should be suspended (5+ penalty points)
            if (newPenaltyPoints >= 5) {
              console.log('🚨 ACCOUNT SUSPENSION: Tutor has reached 5+ penalty points');
              // TODO: Implement account suspension logic here
            }
          }
        }
      }
    }

    // Send notification to both parties about the cancellation
    const cancellerType = cancellerId === booking.tutor_id ? 'tutor' : 'student';
    const otherPartyId = cancellerId === booking.tutor_id ? booking.student_id : booking.tutor_id;
    
    console.log(`📧 Sending cancellation notifications to both parties (cancelled by ${cancellerType})`);

    try {
      // Find or create conversation between tutor and student
      const { data: existingConversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant1_id.eq.${booking.tutor_id},participant2_id.eq.${booking.student_id}),and(participant1_id.eq.${booking.student_id},participant2_id.eq.${booking.tutor_id})`)
        .limit(1);

      let conversationId;
      if (existingConversations && existingConversations.length > 0) {
        conversationId = existingConversations[0].id;
      } else {
        // Create new conversation if none exists
        const { data: newConversation, error: conversationError } = await supabase
          .from('conversations')
          .insert({
            participant1_id: booking.tutor_id,
            participant2_id: booking.student_id,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (conversationError) {
          console.error('Failed to create conversation for cancellation notification:', conversationError);
        } else {
          conversationId = newConversation.id;
        }
      }

      if (conversationId) {
        // Format the cancellation message data for both parties
        const messageData = {
          bookingId: booking.id,
          cancelledBy: cancellerType,
          cancellationReason: reason || 'No reason provided',
          refundPolicy: {
            isMoreThan24Hours,
            creditsToRefund,
            studentRefunded: shouldRefundStudent,
            tutorCreditsDeducted: false,
            isTutorCancelling: isTutorCancelling
          },
          subject: booking.subject || 'Tutoring Session',
          originalStartTime: booking.start_time,
          originalEndTime: booking.end_time,
          location: booking.location,
          // Include both user IDs so the frontend can show appropriate messages
          cancellerId: cancellerId,
          otherPartyId: otherPartyId
        };

        const messageContent = JSON.stringify(messageData);
        
        // Get auth token for messaging service
        const authToken = req.headers.authorization?.split(' ')[1];
        
        // Send message via messaging service (with Socket.IO broadcast to both parties)
        const sent = await sendMessageViaMessagingService(
          conversationId,
          messageContent,
          'booking_cancelled',
          authToken
        );

        if (sent) {
          console.log(`✅ Cancellation notification sent to both parties via messaging service`);
        } else {
          console.error('Failed to send cancellation notification via messaging service');
        }
      }
    } catch (notificationError) {
      // Don't fail the whole operation if notification fails
      console.error('Error sending cancellation notification:', notificationError);
    }

    res.json({
      message: 'Booking cancelled successfully',
      booking: updatedBooking,
      refundPolicy: {
        isMoreThan24Hours,
        creditsToRefund,
        studentRefunded: shouldRefundStudent,
        tutorCreditsReceived: !shouldRefundStudent && isStudentCancelling ? creditsToRefund : 0,
        isTutorCancelling: isTutorCancelling
      }
    });
  } catch (error) {
    console.error('Booking cancellation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/bookings/:id/reschedule', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { newStartTime, newEndTime } = req.body;

    // Check if user is involved in this booking
    const { data: booking } = await supabase
      .from('bookings')
      .select('tutor_id, student_id, status')
      .eq('id', id)
      .single();

    if (!booking || (booking.tutor_id !== req.user.userId && booking.student_id !== req.user.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ error: 'Only confirmed bookings can be rescheduled' });
    }

    const { data: updatedBooking, error } = await supabase
      .from('bookings')
      .update({
        start_time: newStartTime,
        end_time: newEndTime,
        rescheduled_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      message: 'Booking rescheduled successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Booking reschedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cron job to clean up expired bookings
cron.schedule('0 0 * * *', async () => {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('start_time', new Date().toISOString());

    if (error) {
      console.error('Cron job error:', error);
    }
  } catch (error) {
    console.error('Cron job error:', error);
  }
});

// Booking Offers endpoints for chat-based booking system
app.post('/booking-offers', verifyToken, async (req, res) => {
  try {
    const { conversationId, isOnline, tuteeLocation, notes } = req.body;

    // Validate input
    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }

    // Get conversation details to find tutor and tutee
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        participant1:participant1_id(id, user_type),
        participant2:participant2_id(id, user_type)
      `)
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Determine who is the tutee and who is the tutor
    const currentUserId = req.user.userId;
    let tuteeId, tutorId;

    if (conversation.participant1.user_type === 'tutor') {
      tutorId = conversation.participant1.id;
      tuteeId = conversation.participant2.id;
    } else {
      tutorId = conversation.participant2.id;
      tuteeId = conversation.participant1.id;
    }

    // Verify current user is the tutee
    if (tuteeId !== currentUserId) {
      return res.status(403).json({ error: 'Only tutees can create booking offers' });
    }

    // Create booking offer
    const { data: bookingOffer, error: offerError } = await supabase
      .from('booking_offers')
      .insert({
        conversation_id: conversationId,
        tutee_id: tuteeId,
        tutor_id: tutorId,
        is_online: isOnline || false,
        tutee_location: tuteeLocation || null,
        notes: notes || null,
        status: 'pending'
      })
      .select()
      .single();

    if (offerError) {
      throw offerError;
    }

    // Create a message in the conversation to notify about the booking offer
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: tuteeId,
        content: '📅 Booking request sent',
        message_type: 'booking_offer',
        booking_offer_id: bookingOffer.id
      });

    if (messageError) {
      console.error('Failed to create booking message:', messageError);
    }

    res.status(201).json({
      message: 'Booking offer created successfully',
      bookingOffer
    });
  } catch (error) {
    console.error('Booking offer creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/booking-offers/:conversationId', verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Verify user is part of this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('participant1_id, participant2_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const currentUserId = req.user.userId;
    if (conversation.participant1_id !== currentUserId && conversation.participant2_id !== currentUserId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get booking offers for this conversation
    const { data: bookingOffers, error } = await supabase
      .from('booking_offers')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({ bookingOffers });
  } catch (error) {
    console.error('Booking offers fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/booking-proposals', verifyToken, async (req, res) => {
  try {
    const { bookingOfferId, proposedTime, tutorLocation, finalLocation } = req.body;

    // Validate input
    if (!bookingOfferId || !proposedTime) {
      return res.status(400).json({ error: 'Booking offer ID and proposed time are required' });
    }

    // Get booking offer details
    const { data: bookingOffer, error: offerError } = await supabase
      .from('booking_offers')
      .select('*')
      .eq('id', bookingOfferId)
      .single();

    if (offerError || !bookingOffer) {
      return res.status(404).json({ error: 'Booking offer not found' });
    }

    // Verify current user is the tutor
    const currentUserId = req.user.userId;
    if (bookingOffer.tutor_id !== currentUserId) {
      return res.status(403).json({ error: 'Only tutors can create booking proposals' });
    }

    // Update booking offer with proposal details
    const { data: updatedOffer, error: updateError } = await supabase
      .from('booking_offers')
      .update({
        proposed_time: proposedTime,
        tutor_location: tutorLocation || null,
        final_location: finalLocation || null,
        status: 'proposed'
      })
      .eq('id', bookingOfferId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Create a message to notify about the proposal
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: bookingOffer.conversation_id,
        sender_id: currentUserId,
        content: '📅 Booking proposal received',
        message_type: 'booking_proposal',
        booking_offer_id: bookingOfferId
      });

    if (messageError) {
      console.error('Failed to create proposal message:', messageError);
    }

    res.status(201).json({
      message: 'Booking proposal created successfully',
      bookingOffer: updatedOffer
    });
  } catch (error) {
    console.error('Booking proposal creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/booking-confirmations', verifyToken, async (req, res) => {
  try {
    const { bookingOfferId } = req.body;

    if (!bookingOfferId) {
      return res.status(400).json({ error: 'Booking offer ID is required' });
    }

    // Get booking offer details
    const { data: bookingOffer, error: offerError } = await supabase
      .from('booking_offers')
      .select('*')
      .eq('id', bookingOfferId)
      .single();

    if (offerError || !bookingOffer) {
      return res.status(404).json({ error: 'Booking offer not found' });
    }

    // Verify current user is the tutee
    const currentUserId = req.user.userId;
    if (bookingOffer.tutee_id !== currentUserId) {
      return res.status(403).json({ error: 'Only tutees can confirm booking offers' });
    }

    // Update booking offer status to confirmed
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

    // Get tutor's actual hourly rate
    const { data: tutorProfile, error: tutorProfileError } = await supabase
      .from('tutor_profiles')
      .select('hourly_rate')
      .eq('user_id', bookingOffer.tutor_id)
      .single();

    if (tutorProfileError) {
      console.error('❌ Error fetching tutor profile:', tutorProfileError);
    }

    const hourlyRate = tutorProfile?.hourly_rate || 10; // Use 10 as fallback
    const sessionDuration = 60; // 1 hour session in minutes
    const sessionDurationHours = sessionDuration / 60; // convert to hours
    const totalAmount = hourlyRate * sessionDurationHours;

    console.log(`💰 Booking credit calculation: ${hourlyRate} credits/hour × ${sessionDurationHours} hours = ${totalAmount} credits`);

    // Check if student has sufficient credits before proceeding
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('credits, user_type')
      .eq('id', bookingOffer.tutee_id)
      .single();

    if (studentError) {
      console.error('❌ Error fetching student data:', studentError);
      return res.status(500).json({ error: 'Failed to verify student credits' });
    }

    // Only check credits for students
    if (student.user_type === 'student') {
      const currentCredits = student.credits || 0;
      
      if (currentCredits < totalAmount) {
        const shortfall = totalAmount - currentCredits;
        console.log(`❌ Insufficient credits: Student has ${currentCredits}, needs ${totalAmount}, shortfall: ${shortfall}`);
        
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
                requiredCredits: totalAmount,
                currentCredits: currentCredits,
                shortfall: shortfall
              },
              status: 'pending',
              created_at: new Date().toISOString()
            });
          console.log('✅ Credit notification saved to database');
        } catch (notificationError) {
          console.error('❌ Error saving insufficient credits notification:', notificationError);
        }
        
        return res.status(400).json({ 
          error: 'Insufficient credits', 
          details: {
            requiredCredits: totalAmount,
            currentCredits: currentCredits,
            shortfall: shortfall
          }
        });
      }
    }

    // Get tutor's primary subject for the booking (fallback if booking offer doesn't have subject)
    const { data: tutorSubjects } = await supabase
      .from('tutor_profiles')
      .select('subjects')
      .eq('user_id', bookingOffer.tutor_id)
      .single();
    
    const primarySubject = tutorSubjects?.subjects?.[0] || 'General Tutoring';
    // Use subject and level from booking offer, fallback to tutor's primary subject if not provided
    const bookingSubject = bookingOffer.subject || primarySubject;
    // Validate level - reject invalid values like "Multi-Subject" or "Single Subject"
    const validLevels = ['Primary', 'Secondary', 'JC', 'IB', 'Poly', 'University'];
    const rawLevel = bookingOffer.level || 'Secondary';
    const bookingLevel = validLevels.includes(rawLevel) ? rawLevel : 'Secondary'; // Default to Secondary if invalid

    // Create a final booking record from the confirmed offer
    const { data: finalBooking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        tutor_id: bookingOffer.tutor_id,
        student_id: bookingOffer.tutee_id,
        title: `${bookingSubject} Session`,
        subject: bookingSubject, // Use subject from booking offer
        level: bookingLevel, // Use level from booking offer
        start_time: bookingOffer.proposed_time,
        end_time: new Date(new Date(bookingOffer.proposed_time).getTime() + 60 * 60 * 1000).toISOString(), // 1 hour session
        location: bookingOffer.final_location,
        is_online: bookingOffer.is_online,
        hourly_rate: hourlyRate,
        total_amount: totalAmount,
        status: 'confirmed',
        notes: bookingOffer.notes,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Failed to create final booking:', bookingError);
    }

    // Deduct credits from student but NOT transfer to tutor yet
    // Credits will be held in student account and transferred to tutor only after session completion
    // This prevents tutors from receiving payment for sessions that don't actually happen
    if (student.user_type === 'student') {
      try {
        const newStudentCredits = Math.max(0, (student.credits || 0) - totalAmount);
        console.log(`💸 Reserving ${totalAmount} credits from student. Old: ${student.credits}, New: ${newStudentCredits}`);
        
        const { error: studentUpdateError } = await supabase
          .from('users')
          .update({ 
            credits: newStudentCredits,
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingOffer.tutee_id);
          
        if (studentUpdateError) {
          console.error('❌ Error updating student credits:', studentUpdateError);
        } else {
          console.log('✅ Student credits reserved successfully');
        }

        console.log(`💰 Credits reserved: ${totalAmount} credits held until session completion`);
      } catch (creditError) {
        console.error('Error processing credit transaction:', creditError);
        // Don't fail the booking confirmation if credit processing fails
      }
    }

    // Create confirmation message
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: bookingOffer.conversation_id,
        sender_id: currentUserId,
        content: '✅ Booking confirmed!',
        message_type: 'booking_confirmation',
        booking_offer_id: bookingOfferId
      });

    if (messageError) {
      console.error('Failed to create confirmation message:', messageError);
    }

    res.status(201).json({
      message: 'Booking confirmed successfully',
      bookingOffer: confirmedOffer,
      finalBooking
    });
  } catch (error) {
    console.error('Booking confirmation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark attendance endpoint
app.post('/bookings/:bookingId/mark-attendance', verifyToken, async (req, res) => {
  try {
    console.log('📝 Mark attendance endpoint called');
    console.log('  - Request headers:', req.headers);
    console.log('  - Request body:', req.body);
    console.log('  - Request user:', req.user);
    
    const { bookingId } = req.params;
    const { attendance_status, session_notes } = req.body;
    const currentUserId = req.user.userId; // Get user ID from verified token

    // Validate input
    if (!attendance_status || !['attended', 'no_show'].includes(attendance_status)) {
      return res.status(400).json({ error: 'Valid attendance status is required' });
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Debug logging
    console.log('🔍 Attendance Debug Info:');
    console.log('  - Current User ID:', currentUserId, '(type:', typeof currentUserId, ')');
    console.log('  - Booking Tutor ID:', booking.tutor_id, '(type:', typeof booking.tutor_id, ')');
    console.log('  - Booking ID:', bookingId);
    console.log('  - Full booking object:', JSON.stringify(booking, null, 2));
    console.log('  - IDs Match:', String(booking.tutor_id) === String(currentUserId));
    console.log('  - Strict equality:', booking.tutor_id === currentUserId);
    console.log('  - Loose equality:', booking.tutor_id == currentUserId);

    // Verify current user is the tutor for this booking
    // Use String() conversion to handle potential UUID type mismatches
    if (String(booking.tutor_id) !== String(currentUserId)) {
      return res.status(403).json({ 
        error: 'Only the tutor can mark attendance',
        debug: {
          currentUserId,
          bookingTutorId: booking.tutor_id,
          bookingId,
          currentUserIdString: String(currentUserId),
          bookingTutorIdString: String(booking.tutor_id)
        }
      });
    }

    // Check if attendance has already been marked
    if (booking.attendance_status) {
      return res.status(400).json({ error: 'Attendance has already been marked for this session' });
    }

    // Handle file upload if proof photo is provided (temporarily disabled)
    let proofPhotoUrl = null;
    // TODO: Re-enable file upload when multer is properly configured

    // Update booking with attendance information
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        attendance_status: attendance_status,
        attendance_marked_at: new Date().toISOString(),
        session_notes: session_notes || null,
        proof_photo_url: proofPhotoUrl
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({
      message: 'Attendance marked successfully',
      booking: updatedBooking
    });

  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark booking as completed
app.post('/bookings/:bookingId/complete', verifyToken, async (req, res) => {
  try {
    console.log('✅ Complete booking endpoint called');
    console.log('  - Request user:', req.user);
    
    const { bookingId } = req.params;
    const currentUserId = req.user.userId; // Get user ID from verified token

    // Get booking details with tutor and student info
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        tutor:tutor_id (
          id,
          first_name,
          last_name
        ),
        student:student_id (
          id,
          first_name,
          last_name
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Debug logging
    console.log('🔍 Complete Booking Debug Info:');
    console.log('  - Current User ID:', currentUserId, '(type:', typeof currentUserId, ')');
    console.log('  - Booking Tutor ID:', booking.tutor_id, '(type:', typeof booking.tutor_id, ')');
    console.log('  - Booking ID:', bookingId);
    console.log('  - IDs Match:', String(booking.tutor_id) === String(currentUserId));
    console.log('  - Tutor object:', booking.tutor);
    console.log('  - Student object:', booking.student);

    // Only tutors can mark bookings as complete
    // Use String() conversion to handle potential UUID type mismatches
    if (String(booking.tutor_id) !== String(currentUserId)) {
      return res.status(403).json({ 
        error: 'Only tutors can mark bookings as complete',
        debug: {
          currentUserId,
          bookingTutorId: booking.tutor_id,
          bookingId,
          currentUserIdString: String(currentUserId),
          bookingTutorIdString: String(booking.tutor_id)
        }
      });
    }

    // Verify attendance has been marked before allowing completion
    if (!booking.attendance_status || 
        !['attended', 'no_show'].includes(booking.attendance_status)) {
      return res.status(400).json({ 
        error: 'Attendance must be marked before completing the booking' 
      });
    }

    // Verify session has ended
    const sessionEndTime = new Date(booking.end_time || booking.end);
    const now = new Date();
    if (sessionEndTime > now) {
      return res.status(400).json({ 
        error: 'Cannot complete booking before session end time' 
      });
    }

    // Calculate credits to transfer (based on hourly rate and duration)
    const durationHours = (new Date(booking.end_time || booking.end) - 
                          new Date(booking.start_time || booking.start)) / (1000 * 60 * 60);
    const creditsAmount = parseFloat((booking.hourly_rate * durationHours).toFixed(2));

    console.log(`💰 Completing booking: ${creditsAmount} credits to release to tutor`);
    console.log(`   - Hourly rate: ${booking.hourly_rate}`);
    console.log(`   - Duration: ${durationHours.toFixed(2)} hours`);
    console.log(`   - NOTE: Student credits were already deducted at booking confirmation`);

    // Transfer held credits to tutor (student was already charged at confirmation)
    const { data: tutor, error: tutorError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', booking.tutor_id)
      .single();

    if (tutorError) {
      console.error('❌ Error fetching tutor credit balance:', tutorError);
      return res.status(500).json({ error: 'Failed to fetch tutor credits' });
    }

    // Calculate new tutor credit balance
    const currentTutorCredits = tutor.credits || 0;
    const newTutorCredits = parseFloat((currentTutorCredits + creditsAmount).toFixed(2));

    console.log(`💰 Credit transfer: Tutor ${currentTutorCredits} → ${newTutorCredits} (releasing held credits)`);

    // Update tutor credits only
    const { error: tutorUpdateError } = await supabase
      .from('users')
      .update({ 
        credits: newTutorCredits,
        updated_at: new Date().toISOString()
      })
      .eq('id', booking.tutor_id);

    if (tutorUpdateError) {
      console.error('❌ Error updating tutor credits:', tutorUpdateError);
      return res.status(500).json({ error: 'Failed to transfer credits to tutor' });
    }

    console.log('✅ Credits released to tutor successfully');

    // Update booking status to completed
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'completed'
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating booking status:', updateError);
      throw updateError;
    }

    console.log('✅ Booking marked as completed:', updatedBooking.id);

    // Send notifications to both tutor and student
    console.log(`📧 Sending completion notifications to both parties`);
    console.log(`📧 Tutor name: ${booking.tutor?.first_name || 'N/A'}, Student name: ${booking.student?.first_name || 'N/A'}`);
    try {
      // Find or create conversation between tutor and student
      console.log(`📧 Looking for existing conversation between tutor ${booking.tutor_id} and student ${booking.student_id}`);
      
      const { data: existingConversations, error: convQueryError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant1_id.eq.${booking.tutor_id},participant2_id.eq.${booking.student_id}),and(participant1_id.eq.${booking.student_id},participant2_id.eq.${booking.tutor_id})`)
        .limit(1);

      if (convQueryError) {
        console.error('❌ Error querying conversations:', convQueryError);
      }

      console.log(`📧 Found existing conversations:`, existingConversations);

      let conversationId;
      if (existingConversations && existingConversations.length > 0) {
        conversationId = existingConversations[0].id;
        console.log(`📧 Using existing conversation: ${conversationId}`);
      } else {
        // Create new conversation if none exists
        const { data: newConversation, error: conversationError } = await supabase
          .from('conversations')
          .insert({
            participant1_id: booking.tutor_id,
            participant2_id: booking.student_id,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (conversationError) {
          console.error('Failed to create conversation for completion notification:', conversationError);
        } else {
          conversationId = newConversation.id;
        }
      }

      if (conversationId) {
        // Format the completion message data for both parties
        const messageData = {
          bookingId: booking.id,
          subject: booking.subject || 'Tutoring Session',
          startTime: booking.start_time,
          endTime: booking.end_time,
          location: booking.location,
          creditsTransfered: creditsAmount,
          tutorId: booking.tutor_id,
          studentId: booking.student_id,
          tutorName: booking.tutor?.first_name && booking.tutor?.last_name 
            ? `${booking.tutor.first_name} ${booking.tutor.last_name}` 
            : 'Your tutor'
        };

        const messageContent = JSON.stringify(messageData);
        console.log(`📧 Message content to send:`, messageContent);
        
        // Send via messaging service - this will broadcast via Socket.IO
        try {
          const authToken = req.headers.authorization?.split(' ')[1];
          console.log(`📧 Attempting to send session_completed message via messaging service`);
          console.log(`📧 Conversation ID: ${conversationId}`);
          console.log(`📧 Message type: session_completed`);
          console.log(`📧 Auth token present: ${!!authToken}`);
          
          const sent = await sendMessageViaMessagingService(
            conversationId,
            messageContent,
            'session_completed',
            authToken
          );

          if (sent) {
            console.log(`✅ Completion notification sent successfully via messaging service (broadcasted via Socket.IO)`);
          } else {
            console.error('❌ Messaging service call returned false - message may not have been sent');
            // Still try to insert to database as fallback - student can see it when they load messages
            const { data: directMessage, error: messageError } = await supabase
              .from('messages')
              .insert({
                conversation_id: conversationId,
                sender_id: req.user.userId,
                content: messageContent,
                message_type: 'session_completed',
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
              console.error('❌ Failed to insert completion message directly:', messageError);
            } else {
              console.log('⚠️ Completion message inserted to database (no Socket.IO broadcast - student will see on next page load)');
              await supabase
                .from('conversations')
                .update({
                  last_message_at: new Date().toISOString(),
                  last_message_content: 'Session completed'
                })
                .eq('id', conversationId);
            }
          }
        } catch (error) {
          console.error('❌ Error sending completion notification via messaging service:', error);
          // Fallback: Insert message directly to database
          try {
            const { data: directMessage, error: messageError } = await supabase
              .from('messages')
              .insert({
                conversation_id: conversationId,
                sender_id: req.user.userId,
                content: messageContent,
                message_type: 'session_completed',
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
              console.error('❌ Failed to insert message directly:', messageError);
            } else {
              console.log('⚠️ Completion message inserted to database (no Socket.IO broadcast - student will see on next page load)');
              await supabase
                .from('conversations')
                .update({
                  last_message_at: new Date().toISOString(),
                  last_message_content: 'Session completed'
                })
                .eq('id', conversationId);
            }
          } catch (directError) {
            console.error('❌ Failed to insert message directly:', directError);
          }
        }

        // Try to send notifications via notifications service
        try {
          const authToken = req.headers.authorization?.split(' ')[1];
          const notificationsServiceUrl = process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3007';
          
          // Send notification to tutor
          await axios.post(
            `${notificationsServiceUrl}/notifications/send`,
            {
              userId: booking.tutor_id,
              type: 'push',
              subject: 'Session Completed',
              message: `Your session with ${booking.student?.first_name || 'Student'} has been completed. ${creditsAmount} credits have been added to your account.`,
              data: {
                bookingId: booking.id,
                conversationId: conversationId,
                notificationType: 'session_completed'
              }
            },
            {
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
              },
              timeout: 5000
            }
          );

          // Send notification to student
          await axios.post(
            `${notificationsServiceUrl}/notifications/send`,
            {
              userId: booking.student_id,
              type: 'push',
              subject: 'Session Completed',
              message: `Your session with ${booking.tutor?.first_name || 'Tutor'} has been completed. Please leave a review!`,
              data: {
                bookingId: booking.id,
                conversationId: conversationId,
                notificationType: 'session_completed'
              }
            },
            {
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
              },
              timeout: 5000
            }
          );
          console.log(`✅ Persistent notifications created for both parties`);
        } catch (notifServiceError) {
          console.log('⚠️ Notification service HTTP call failed, inserting directly to database');
          
          // Fallback: Insert notifications directly to database
          try {
            const notifications = [
              {
                user_id: booking.tutor_id,
                type: 'push',
                subject: 'Session Completed',
                message: `Your session with ${booking.student?.first_name || 'Student'} has been completed. ${creditsAmount} credits have been added to your account.`,
                data: {
                  bookingId: booking.id,
                  conversationId: conversationId,
                  notificationType: 'session_completed'
                },
                status: 'pending',
                created_at: new Date().toISOString()
              },
              {
                user_id: booking.student_id,
                type: 'push',
                subject: 'Session Completed',
                message: `Your session with ${booking.tutor?.first_name || 'Tutor'} has been completed. Please leave a review!`,
                data: {
                  bookingId: booking.id,
                  conversationId: conversationId,
                  notificationType: 'session_completed'
                },
                status: 'pending',
                created_at: new Date().toISOString()
              }
            ];

            const { error: insertError } = await supabase
              .from('notifications')
              .insert(notifications);

            if (insertError) {
              console.error('Failed to insert notifications directly:', insertError);
            } else {
              console.log('✅ Notifications inserted directly to database');
            }
          } catch (directNotifError) {
            console.error('Failed to insert notifications directly:', directNotifError);
          }
        }
      }
    } catch (notificationError) {
      // Don't fail the whole operation if notification fails
      console.error('Error sending completion notification:', notificationError);
    }

    res.json({ 
      message: 'Booking marked as completed successfully',
      data: updatedBooking,
      creditsTransfered: {
        amount: creditsAmount,
        tutorCredits: newTutorCredits
      }
    });
  } catch (error) {
    console.error('Booking completion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check attendance status for multiple bookings
app.post('/bookings/attendance-status', verifyToken, async (req, res) => {
  try {
    const { bookingIds } = req.body;
    
    if (!bookingIds || !Array.isArray(bookingIds)) {
      return res.status(400).json({ error: 'Booking IDs array is required' });
    }

    const attendanceStatuses = {};
    
    for (const bookingId of bookingIds) {
      const { data: booking, error } = await supabase
        .from('bookings')
        .select('id, attendance_status, attendance_marked_at')
        .eq('id', bookingId)
        .single();

      if (!error && booking) {
        attendanceStatuses[bookingId] = {
          hasAttendance: booking.attendance_status && 
            (booking.attendance_status === 'attended' || booking.attendance_status === 'no_show'),
          attendance_status: booking.attendance_status,
          attendance_marked_at: booking.attendance_marked_at
        };
      } else {
        attendanceStatuses[bookingId] = {
          hasAttendance: false,
          attendance_status: null,
          attendance_marked_at: null
        };
      }
    }

    res.json(attendanceStatuses);
  } catch (error) {
    console.error('Error checking attendance statuses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'bookings' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Bookings service running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Supabase URL: ${process.env.SUPABASE_URL ? 'Set' : 'Not set'}`);
  console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`);
}).on('error', (err) => {
  console.error('❌ Failed to start bookings service:', err);
  process.exit(1);
});
