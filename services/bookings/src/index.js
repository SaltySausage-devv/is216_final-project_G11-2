const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const cron = require('node-cron');
require('dotenv').config({ path: '../../.env' });

const app = express();
const PORT = process.env.PORT || 3004;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
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
      .select('tutor_id, student_id, status')
      .eq('id', id)
      .single();

    if (!booking || (booking.tutor_id !== req.user.userId && booking.student_id !== req.user.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

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

    res.json({
      message: 'Booking cancelled successfully',
      booking: updatedBooking
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

    // Create a final booking record from the confirmed offer
    const { data: finalBooking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        tutor_id: bookingOffer.tutor_id,
        student_id: bookingOffer.tutee_id,
        start_time: bookingOffer.proposed_time,
        end_time: new Date(new Date(bookingOffer.proposed_time).getTime() + 60 * 60 * 1000).toISOString(), // 1 hour session
        location: bookingOffer.final_location,
        is_online: bookingOffer.is_online,
        status: 'confirmed',
        notes: bookingOffer.notes,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Failed to create final booking:', bookingError);
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'bookings' });
});

app.listen(PORT, () => {
  console.log(`Bookings service running on port ${PORT}`);
});
