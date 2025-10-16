const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const axios = require('axios');
require('dotenv').config({ path: '../../.env' });

const app = express();
const PORT = process.env.PORT || 3011;

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

// Helper function to send messages via messaging service (with Socket.IO broadcast)
async function sendMessageViaMessagingService(conversationId, content, messageType, authToken) {
  try {
    const messagingServiceUrl = process.env.MESSAGING_SERVICE_URL || 'http://localhost:3005';
    const response = await axios.post(`${messagingServiceUrl}/messaging/system-message`, {
      conversationId,
      content,
      messageType
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Message sent via messaging service:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Error sending message via messaging service:', error.response?.data || error.message);
    return false;
  }
}
app.use(limiter);

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

// Validation schemas
const availabilitySchema = Joi.object({
  day_of_week: Joi.number().integer().min(0).max(6).required(),
  start_time: Joi.string().required(),
  end_time: Joi.string().required(),
  is_available: Joi.boolean().default(true),
  recurrence_type: Joi.string().valid('weekly', 'biweekly', 'monthly').default('weekly'),
  timezone: Joi.string().default('Asia/Singapore'),
  notes: Joi.string().optional()
});

const dateAvailabilitySchema = Joi.object({
  specific_date: Joi.date().required(),
  start_time: Joi.string().required(),
  end_time: Joi.string().required(),
  is_available: Joi.boolean().default(true),
  location: Joi.string().optional(),
  hourly_rate: Joi.number().optional(),
  notes: Joi.string().optional()
});

const timeOffSchema = Joi.object({
  start_date: Joi.date().required(),
  end_date: Joi.date().required(),
  reason: Joi.string().optional(),
  is_recurring_annually: Joi.boolean().default(false)
});

// Routes

// Get user's calendar data (bookings only)
app.get('/calendar', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    console.log('📅 Calendar request:', { userId, userType: req.user.userType, startDate, endDate });

    // Get user's bookings - simple query
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .or(`tutor_id.eq.${userId},student_id.eq.${userId}`)
      .order('start_time', { ascending: true });

    if (bookingsError) {
      console.error('❌ Bookings error:', bookingsError);
      return res.status(500).json({ error: 'Failed to fetch bookings', details: bookingsError });
    }

    console.log(`✅ Found ${bookings?.length || 0} bookings for user ${userId}`);
    if (bookings && bookings.length > 0) {
      console.log('📊 Sample booking:', JSON.stringify(bookings[0], null, 2));
    }

    // Format bookings for FullCalendar
    const formattedBookings = (bookings || []).map(booking => ({
      id: booking.id,
      title: booking.title || 'Tutoring Session',
      start: booking.start_time,
      end: booking.end_time,
      status: booking.status,
      subject: booking.subject,
      level: booking.level,
      location: booking.location,
      notes: booking.notes,
      tutor_id: booking.tutor_id,
      student_id: booking.student_id,
      start_time: booking.start_time,
      end_time: booking.end_time,
      // Include reschedule request fields
      reschedule_status: booking.reschedule_status,
      pending_reschedule_start_time: booking.pending_reschedule_start_time,
      pending_reschedule_end_time: booking.pending_reschedule_end_time,
      pending_reschedule_location: booking.pending_reschedule_location,
      reschedule_requested_by: booking.reschedule_requested_by,
      reschedule_requester_type: booking.reschedule_requester_type,
      reschedule_reason: booking.reschedule_reason,
      reschedule_requested_at: booking.reschedule_requested_at,
      reschedule_responded_at: booking.reschedule_responded_at,
      reschedule_response_message: booking.reschedule_response_message
    }));

    console.log(`📤 Sending ${formattedBookings.length} formatted bookings`);

    res.json({
      data: formattedBookings
    });
  } catch (error) {
    console.error('❌ Calendar data error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Create tutor availability
app.post('/availability', verifyToken, async (req, res) => {
  try {
    if (req.user.userType !== 'tutor') {
      return res.status(403).json({ error: 'Only tutors can set availability' });
    }

    const { error, value } = availabilitySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { data, error: insertError } = await supabase
      .from('tutor_availability')
      .insert({
        tutor_id: req.user.userId,
        ...value
      })
      .select()
      .single();

    if (insertError) {
      console.error('Availability creation error:', insertError);
      return res.status(500).json({ error: 'Failed to create availability' });
    }

    res.status(201).json({ data });
  } catch (error) {
    console.error('Availability error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create specific date availability
app.post('/availability/date', verifyToken, async (req, res) => {
  try {
    if (req.user.userType !== 'tutor') {
      return res.status(403).json({ error: 'Only tutors can set availability' });
    }

    const { error, value } = dateAvailabilitySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { data, error: insertError } = await supabase
      .from('tutor_date_availability')
      .insert({
        tutor_id: req.user.userId,
        ...value
      })
      .select()
      .single();

    if (insertError) {
      console.error('Date availability creation error:', insertError);
      return res.status(500).json({ error: 'Failed to create availability' });
    }

    res.status(201).json({ data });
  } catch (error) {
    console.error('Date availability error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tutor's available slots
app.get('/tutor/:tutorId/availability', verifyToken, async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 6 = Saturday
    const dateString = targetDate.toISOString().split('T')[0];

    // Get recurring availability for this day
    const { data: recurringAvailability, error: recurringError } = await supabase
      .from('tutor_availability')
      .select('*')
      .eq('tutor_id', tutorId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true);

    // Get specific date availability
    const { data: specificAvailability, error: specificError } = await supabase
      .from('tutor_date_availability')
      .select('*')
      .eq('tutor_id', tutorId)
      .eq('specific_date', dateString)
      .eq('is_available', true);

    // Check if tutor has time off on this date
    const { data: timeOff, error: timeOffError } = await supabase
      .from('tutor_time_off')
      .select('*')
      .eq('tutor_id', tutorId)
      .lte('start_date', dateString)
      .gte('end_date', dateString);

    if (recurringError || specificError || timeOffError) {
      console.error('Availability fetch error:', { recurringError, specificError, timeOffError });
      return res.status(500).json({ error: 'Failed to fetch availability' });
    }

    // If tutor has time off, return empty availability
    if (timeOff && timeOff.length > 0) {
      return res.json({ data: [] });
    }

    // Combine and format availability
    const availability = [
      ...(recurringAvailability || []).map(slot => ({
        ...slot,
        start_time: `${dateString}T${slot.start_time}:00`,
        end_time: `${dateString}T${slot.end_time}:00`,
        availability_type: 'recurring'
      })),
      ...(specificAvailability || []).map(slot => ({
        ...slot,
        start_time: `${dateString}T${slot.start_time}:00`,
        end_time: `${dateString}T${slot.end_time}:00`,
        availability_type: 'specific'
      }))
    ];

    res.json({ data: availability });
  } catch (error) {
    console.error('Tutor availability error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add tutor time off
app.post('/time-off', verifyToken, async (req, res) => {
  try {
    if (req.user.userType !== 'tutor') {
      return res.status(403).json({ error: 'Only tutors can add time off' });
    }

    const { error, value } = timeOffSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { data, error: insertError } = await supabase
      .from('tutor_time_off')
      .insert({
        tutor_id: req.user.userId,
        ...value
      })
      .select()
      .single();

    if (insertError) {
      console.error('Time off creation error:', insertError);
      return res.status(500).json({ error: 'Failed to add time off' });
    }

    res.status(201).json({ data });
  } catch (error) {
    console.error('Time off error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update availability
app.put('/availability/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.userType !== 'tutor') {
      return res.status(403).json({ error: 'Only tutors can update availability' });
    }

    const { id } = req.params;
    const updates = req.body;

    // Check if availability belongs to this tutor
    const { data: existing, error: checkError } = await supabase
      .from('tutor_availability')
      .select('*')
      .eq('id', id)
      .eq('tutor_id', req.user.userId)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({ error: 'Availability not found' });
    }

    const { data, error: updateError } = await supabase
      .from('tutor_availability')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Availability update error:', updateError);
      return res.status(500).json({ error: 'Failed to update availability' });
    }

    res.json({ data });
  } catch (error) {
    console.error('Availability update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete availability
app.delete('/availability/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.userType !== 'tutor') {
      return res.status(403).json({ error: 'Only tutors can delete availability' });
    }

    const { id } = req.params;

    // Check if availability belongs to this tutor
    const { data: existing, error: checkError } = await supabase
      .from('tutor_availability')
      .select('*')
      .eq('id', id)
      .eq('tutor_id', req.user.userId)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({ error: 'Availability not found' });
    }

    const { error: deleteError } = await supabase
      .from('tutor_availability')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Availability deletion error:', deleteError);
      return res.status(500).json({ error: 'Failed to delete availability' });
    }

    res.json({ message: 'Availability deleted successfully' });
  } catch (error) {
    console.error('Availability deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions
function getBookingColor(status) {
  switch (status) {
    case 'confirmed': return '#007bff';
    case 'completed': return '#28a745';
    case 'cancelled': return '#dc3545';
    case 'scheduled': return '#ffc107';
    default: return '#6c757d';
  }
}

function generateNextOccurrence(dayOfWeek, time) {
  const today = new Date();
  const currentDay = today.getDay();
  let daysUntilNext = dayOfWeek - currentDay;

  if (daysUntilNext <= 0) {
    daysUntilNext += 7;
  }

  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntilNext);

  const [hours, minutes] = time.split(':');
  nextDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  return nextDate.toISOString();
}

// Booking management endpoints
app.put('/bookings/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { start_time, end_time } = req.body;

    // Get booking and verify user is involved
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.tutor_id !== req.user.userId && booking.student_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Update booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        start_time: start_time || booking.start_time,
        end_time: end_time || booking.end_time,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({ data: updatedBooking });
  } catch (error) {
    console.error('Booking update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a reschedule request (sends invitation to other party)
app.post('/bookings/:id/reschedule', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { start_time, end_time, reschedule_reason, new_location } = req.body;

    // Get booking and verify user is involved
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.tutor_id !== req.user.userId && booking.student_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Check if there's already a pending reschedule request
    if (booking.reschedule_status === 'pending') {
      return res.status(400).json({ error: 'There is already a pending reschedule request for this booking' });
    }

    // Determine requester type
    const requesterType = booking.tutor_id === req.user.userId ? 'tutor' : 'student';

    // Update booking with reschedule request details
    const updateData = {
      pending_reschedule_start_time: start_time,
      pending_reschedule_end_time: end_time,
      reschedule_requested_by: req.user.userId,
      reschedule_requester_type: requesterType,
      reschedule_reason: reschedule_reason,
      reschedule_status: 'pending',
      reschedule_requested_at: new Date().toISOString(),
      reschedule_responded_at: null,
      reschedule_response_message: null
    };

    // Add new location if provided
    if (new_location) {
      updateData.pending_reschedule_location = new_location;
    }
    
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Reschedule request creation error:', updateError);
      return res.status(500).json({ error: 'Failed to create reschedule request' });
    }


    // Send notification to the other party via messaging system
    const recipientId = requesterType === 'tutor' ? booking.student_id : booking.tutor_id;
    console.log(`📧 Sending notification to user ${recipientId} about reschedule request for booking ${id}`);

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
        // Create new conversation
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            participant1_id: booking.tutor_id,
            participant2_id: booking.student_id,
            booking_id: booking.id,
            created_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (convError) {
          console.error('Failed to create conversation:', convError);
        } else {
          conversationId = newConversation.id;
        }
      }

      if (conversationId) {
        // Format the reschedule request message data
        const messageData = {
          bookingId: booking.id,
          currentStartTime: booking.start_time,
          currentEndTime: booking.end_time,
          proposedStartTime: start_time,
          proposedEndTime: end_time,
          reason: reschedule_reason || 'No reason provided',
          requesterType: requesterType,
          subject: booking.subject || 'Tutoring Session',
          currentLocation: booking.location
        };
        
        // Only include proposedLocation if a new location was actually provided
        if (new_location && new_location.trim() !== '') {
          messageData.proposedLocation = new_location;
        }
        
        const messageContent = JSON.stringify(messageData);

        // Get auth token from request
        const authToken = req.headers.authorization?.split(' ')[1];
        
        // Send message via messaging service (with Socket.IO broadcast)
        const sent = await sendMessageViaMessagingService(
          conversationId,
          messageContent,
          'reschedule_request',
          authToken
        );

        if (sent) {
          console.log(`✅ Reschedule notification sent to user ${recipientId} via messaging service`);
        } else {
          console.error('Failed to send reschedule notification via messaging service');
        }
      }
    } catch (notificationError) {
      // Don't fail the whole operation if notification fails
      console.error('Error sending reschedule notification:', notificationError);
    }

    res.status(201).json({ data: updatedBooking, message: 'Reschedule request sent successfully' });
  } catch (error) {
    console.error('Booking reschedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/bookings/:id/cancel', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellation_reason, cancellation_details } = req.body;

    // Get booking and verify user is involved
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.tutor_id !== req.user.userId && booking.student_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Update booking status to cancelled
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason,
        notes: cancellation_details
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({ data: updatedBooking });
  } catch (error) {
    console.error('Booking cancellation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/bookings/:id/confirm', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get booking and verify user is involved
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.tutor_id !== req.user.userId && booking.student_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Update booking status to confirmed
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({ data: updatedBooking });
  } catch (error) {
    console.error('Booking confirmation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/bookings/:id/complete', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get booking and verify user is involved
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Only tutors can mark bookings as complete
    if (booking.tutor_id !== req.user.userId) {
      return res.status(403).json({ error: 'Only tutors can mark bookings as complete' });
    }

    // Update booking status to completed
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({ data: updatedBooking });
  } catch (error) {
    console.error('Booking completion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Accept a reschedule request
app.post('/bookings/:id/reschedule/accept', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { response_message } = req.body;

    // Get booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify user is the recipient (not the requester)
    if (booking.reschedule_requested_by === userId) {
      return res.status(403).json({ error: 'Cannot accept your own reschedule request' });
    }

    // Verify user is involved in the booking
    if (booking.tutor_id !== userId && booking.student_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Check if there's a pending reschedule request
    if (booking.reschedule_status !== 'pending') {
      return res.status(400).json({ error: 'No pending reschedule request found' });
    }

    // Update the booking: apply new times and location, clear reschedule request fields
    const updateData = {
      start_time: booking.pending_reschedule_start_time,
      end_time: booking.pending_reschedule_end_time,
      rescheduled_at: new Date().toISOString(),
      reschedule_status: 'accepted',
      reschedule_responded_at: new Date().toISOString(),
      reschedule_response_message: response_message || 'Accepted',
      // Clear pending fields after accepting
      pending_reschedule_start_time: null,
      pending_reschedule_end_time: null,
      pending_reschedule_location: null
    };

    // Update location if a new one was proposed
    if (booking.pending_reschedule_location) {
      updateData.location = booking.pending_reschedule_location;
    }

    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Handle credit transactions for reschedule acceptance
    try {
      console.log('🔄 Processing credit transaction for reschedule acceptance...');
      console.log('🔍 Reschedule acceptance details:', {
        bookingId: booking.id,
        userId: userId,
        studentId: booking.student_id,
        tutorId: booking.tutor_id,
        currentStart: booking.start_time,
        currentEnd: booking.end_time,
        newStart: booking.pending_reschedule_start_time,
        newEnd: booking.pending_reschedule_end_time
      });

      // Get tutor's hourly rate
      const { data: tutorProfile, error: tutorProfileError } = await supabase
        .from('tutor_profiles')
        .select('hourly_rate')
        .eq('user_id', booking.tutor_id)
        .single();

      if (tutorProfileError) {
        console.error('❌ Error fetching tutor profile:', tutorProfileError);
      } else if (tutorProfile?.hourly_rate) {
        const hourlyRate = tutorProfile.hourly_rate;
        
        // Calculate current session duration (in hours)
        const currentStart = new Date(booking.start_time);
        const currentEnd = new Date(booking.end_time);
        const currentDurationHours = (currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60);
        const currentCredits = hourlyRate * currentDurationHours;

        // Calculate new session duration (in hours)
        const newStart = new Date(booking.pending_reschedule_start_time);
        const newEnd = new Date(booking.pending_reschedule_end_time);
        const newDurationHours = (newEnd.getTime() - newStart.getTime()) / (1000 * 60 * 60);
        const newCredits = hourlyRate * newDurationHours;

        // Calculate credit difference
        const creditDifference = newCredits - currentCredits;

        console.log('💰 Credit calculation:', {
          hourlyRate,
          currentDurationHours,
          currentCredits,
          newDurationHours,
          newCredits,
          creditDifference
        });

        if (creditDifference !== 0) {
          console.log('🔍 Credit difference is not zero, proceeding with transaction...');
          console.log('🔄 Updating credits for BOTH student and tutor...');
          
          // Update credits for BOTH parties
          const updatePromises = [];
          
          // Update student credits
          const { data: student, error: studentError } = await supabase
            .from('users')
            .select('credits')
            .eq('id', booking.student_id)
            .single();
          
          if (studentError) {
            console.error('❌ Error fetching student credits:', studentError);
          } else {
            const currentStudentCredits = student.credits || 0;
            const newStudentCredits = Math.max(0, currentStudentCredits - creditDifference);
            console.log(`💸 Student credit adjustment: ${currentStudentCredits} → ${newStudentCredits} (difference: ${creditDifference})`);
            
            updatePromises.push(
              supabase
                .from('users')
                .update({
                  credits: newStudentCredits,
                  updated_at: new Date().toISOString()
                })
                .eq('id', booking.student_id)
                .select('id, credits')
                .then(result => {
                  if (result.error) {
                    console.error('❌ Error updating student credits:', result.error);
                  } else {
                    console.log(`✅ Student credits updated successfully:`, result.data);
                  }
                  return result;
                })
            );
          }
          
          // Update tutor credits
          const { data: tutor, error: tutorError } = await supabase
            .from('users')
            .select('credits')
            .eq('id', booking.tutor_id)
            .single();
          
          if (tutorError) {
            console.error('❌ Error fetching tutor credits:', tutorError);
          } else {
            const currentTutorCredits = tutor.credits || 0;
            const newTutorCredits = Math.max(0, currentTutorCredits + creditDifference);
            console.log(`💰 Tutor credit adjustment: ${currentTutorCredits} → ${newTutorCredits} (difference: ${creditDifference})`);
            
            updatePromises.push(
              supabase
                .from('users')
                .update({
                  credits: newTutorCredits,
                  updated_at: new Date().toISOString()
                })
                .eq('id', booking.tutor_id)
                .select('id, credits')
                .then(result => {
                  if (result.error) {
                    console.error('❌ Error updating tutor credits:', result.error);
                  } else {
                    console.log(`✅ Tutor credits updated successfully:`, result.data);
                  }
                  return result;
                })
            );
          }
          
          // Wait for both updates to complete
          try {
            await Promise.all(updatePromises);
            console.log('✅ All credit updates completed successfully');
          } catch (error) {
            console.error('❌ Error in credit update process:', error);
          }
        } else {
          console.log('ℹ️ No credit difference - no transaction needed');
          console.log('🔍 Credit calculation details:', {
            currentCredits,
            newCredits,
            creditDifference,
            hourlyRate,
            currentDurationHours,
            newDurationHours
          });
        }
      } else {
        console.log('⚠️ Tutor hourly rate not found - skipping credit transaction');
      }
    } catch (creditError) {
      console.error('❌ Error processing credit transaction:', creditError);
      // Don't fail the reschedule acceptance if credit processing fails
    }

    // Send notification to requester
    console.log(`📧 Sending notification to user ${booking.reschedule_requested_by} that reschedule was accepted`);

    try {
      // Find conversation between tutor and student
      const { data: existingConversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant1_id.eq.${booking.tutor_id},participant2_id.eq.${booking.student_id}),and(participant1_id.eq.${booking.student_id},participant2_id.eq.${booking.tutor_id})`)
        .limit(1);

      if (existingConversations && existingConversations.length > 0) {
        const conversationId = existingConversations[0].id;
        
        // Format the acceptance message data
        const messageContent = JSON.stringify({
          bookingId: booking.id,
          newStartTime: updatedBooking.start_time,
          newEndTime: updatedBooking.end_time,
          responseMessage: response_message || '',
          subject: booking.subject || 'Tutoring Session',
          location: booking.location
        });

        // Get auth token from request
        const authToken = req.headers.authorization?.split(' ')[1];
        
        // Send message via messaging service (with Socket.IO broadcast)
        const sent = await sendMessageViaMessagingService(
          conversationId,
          messageContent,
          'reschedule_accepted',
          authToken
        );

        if (sent) {
          console.log(`✅ Acceptance notification sent to user ${booking.reschedule_requested_by} via messaging service`);
        } else {
          console.error('Failed to send acceptance notification via messaging service');
        }
      }
    } catch (notificationError) {
      // Don't fail the whole operation if notification fails
      console.error('Error sending acceptance notification:', notificationError);
    }

    res.json({ 
      data: updatedBooking, 
      message: 'Reschedule request accepted successfully. Booking has been updated.' 
    });
  } catch (error) {
    console.error('Accept reschedule request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject a reschedule request
app.post('/bookings/:id/reschedule/reject', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { response_message } = req.body;

    // Get booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify user is the recipient (not the requester)
    if (booking.reschedule_requested_by === userId) {
      return res.status(403).json({ error: 'Cannot reject your own reschedule request' });
    }

    // Verify user is involved in the booking
    if (booking.tutor_id !== userId && booking.student_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Check if there's a pending reschedule request
    if (booking.reschedule_status !== 'pending') {
      return res.status(400).json({ error: 'No pending reschedule request found' });
    }

    // Update the booking: reject and clear reschedule request fields
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        reschedule_status: 'rejected',
        reschedule_responded_at: new Date().toISOString(),
        reschedule_response_message: response_message || 'Rejected',
        // Clear pending fields after rejecting
        pending_reschedule_start_time: null,
        pending_reschedule_end_time: null
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Send notification to requester
    console.log(`📧 Sending notification to user ${booking.reschedule_requested_by} that reschedule was rejected`);

    try {
      // Find conversation between tutor and student
      const { data: existingConversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant1_id.eq.${booking.tutor_id},participant2_id.eq.${booking.student_id}),and(participant1_id.eq.${booking.student_id},participant2_id.eq.${booking.tutor_id})`)
        .limit(1);

      if (existingConversations && existingConversations.length > 0) {
        const conversationId = existingConversations[0].id;
        
        // Format the rejection message data
        const messageContent = JSON.stringify({
          bookingId: booking.id,
          originalStartTime: booking.start_time,
          originalEndTime: booking.end_time,
          responseMessage: response_message || '',
          subject: booking.subject || 'Tutoring Session',
          location: booking.location
        });

        // Get auth token from request
        const authToken = req.headers.authorization?.split(' ')[1];
        
        // Send message via messaging service (with Socket.IO broadcast)
        const sent = await sendMessageViaMessagingService(
          conversationId,
          messageContent,
          'reschedule_rejected',
          authToken
        );

        if (sent) {
          console.log(`✅ Rejection notification sent to user ${booking.reschedule_requested_by} via messaging service`);
        } else {
          console.error('Failed to send rejection notification via messaging service');
        }
      }
    } catch (notificationError) {
      // Don't fail the whole operation if notification fails
      console.error('Error sending rejection notification:', notificationError);
    }

    res.json({ 
      data: updatedBooking,
      message: 'Reschedule request rejected. Original booking time remains unchanged.' 
    });
  } catch (error) {
    console.error('Reject reschedule request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'calendar' });
});

// Test endpoint to manually update user credits (for debugging)
app.post('/test-update-credits', verifyToken, async (req, res) => {
  try {
    const { userId, newCredits } = req.body;
    const currentUserId = req.user.userId;
    
    console.log('🧪 Test credit update:', { userId, newCredits, currentUserId });
    
    const { data: updateResult, error: updateError } = await supabase
      .from('users')
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, credits');
    
    if (updateError) {
      console.error('❌ Test credit update error:', updateError);
      return res.status(500).json({ error: 'Failed to update credits', details: updateError });
    }
    
    console.log('✅ Test credit update success:', updateResult);
    res.json({ success: true, result: updateResult });
  } catch (error) {
    console.error('❌ Test credit update exception:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test endpoint to simulate student credit update (for debugging)
app.post('/test-student-credit-update', verifyToken, async (req, res) => {
  try {
    const { studentId, creditDifference } = req.body;
    const currentUserId = req.user.userId;
    
    console.log('🧪 Test student credit update:', { studentId, creditDifference, currentUserId });
    
    // Get current student credits
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', studentId)
      .single();
    
    if (studentError) {
      console.error('❌ Error fetching student credits:', studentError);
      return res.status(500).json({ error: 'Failed to fetch student credits', details: studentError });
    }
    
    const currentCredits = student.credits || 0;
    const newCredits = Math.max(0, currentCredits - creditDifference);
    
    console.log(`🧪 Student credit calculation: ${currentCredits} - ${creditDifference} = ${newCredits}`);
    
    // Update student credits
    const { data: updateResult, error: updateError } = await supabase
      .from('users')
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString()
      })
      .eq('id', studentId)
      .select('id, credits');
    
    if (updateError) {
      console.error('❌ Test student credit update error:', updateError);
      return res.status(500).json({ error: 'Failed to update student credits', details: updateError });
    }
    
    console.log('✅ Test student credit update success:', updateResult);
    res.json({ success: true, result: updateResult });
  } catch (error) {
    console.error('❌ Test student credit update exception:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.listen(PORT, () => {
  console.log(`Calendar service running on port ${PORT}`);
});