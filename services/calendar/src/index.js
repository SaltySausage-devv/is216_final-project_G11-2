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
    console.log(`📧 Sending to messaging service: ${messagingServiceUrl}/messaging/system-message`);
    console.log(`📧 Request data:`, { conversationId, content, messageType });
    
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
    console.error('❌ Error status:', error.response?.status);
    console.error('❌ Error headers:', error.response?.headers);
    console.error('❌ Full error:', error);
    console.error('❌ Request URL:', `${process.env.MESSAGING_SERVICE_URL || 'http://localhost:3005'}/messaging/system-message`);
    console.error('❌ Request data:', { conversationId, content, messageType });
    console.error('❌ Auth token length:', authToken ? authToken.length : 'NO TOKEN');
    console.error('❌ ERROR RESPONSE BODY:', error.response?.data);
    console.error('❌ ERROR MESSAGE:', error.message);
    console.error('❌ ERROR CODE:', error.code);
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

    // Get user's bookings with tutor and student details
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        tutor:tutor_id (
          id,
          first_name,
          last_name,
          email
        ),
        student:student_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .or(`tutor_id.eq.${userId},student_id.eq.${userId}`)
      .order('start_time', { ascending: true });

    if (bookingsError) {
      console.error('❌ Bookings error:', bookingsError);
      return res.status(500).json({ error: 'Failed to fetch bookings', details: bookingsError });
    }

    console.log(`✅ Found ${bookings?.length || 0} bookings for user ${userId}`);
    if (bookings && bookings.length > 0) {
      console.log('📊 Sample booking data:', {
        id: bookings[0].id,
        tutor_id: bookings[0].tutor_id,
        hourly_rate: bookings[0].hourly_rate,
        total_amount: bookings[0].total_amount,
        start_time: bookings[0].start_time,
        end_time: bookings[0].end_time,
        status: bookings[0].status
      });
      
      // Check if this booking has incorrect rates
      const startTime = new Date(bookings[0].start_time);
      const endTime = new Date(bookings[0].end_time);
      const durationHours = (endTime - startTime) / (1000 * 60 * 60);
      const expectedTotal = bookings[0].hourly_rate * durationHours;
      const isIncorrect = Math.abs(bookings[0].total_amount - expectedTotal) > 0.01;
      
      if (isIncorrect) {
        console.log('⚠️ INCORRECT BOOKING DETECTED:', {
          booking_id: bookings[0].id,
          duration_hours: durationHours,
          hourly_rate: bookings[0].hourly_rate,
          current_total: bookings[0].total_amount,
          expected_total: expectedTotal,
          difference: bookings[0].total_amount - expectedTotal
        });
      }
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
      // Include credit-related fields
      hourly_rate: booking.hourly_rate,
      total_amount: booking.total_amount,
      // Include participant details
      tutor: booking.tutor,
      student: booking.student,
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
    if (formattedBookings.length > 0) {
      console.log('📊 Sample formatted booking:', {
        id: formattedBookings[0].id,
        tutor_id: formattedBookings[0].tutor_id,
        hourly_rate: formattedBookings[0].hourly_rate,
        total_amount: formattedBookings[0].total_amount,
        start_time: formattedBookings[0].start_time,
        end_time: formattedBookings[0].end_time,
        tutor: formattedBookings[0].tutor,
        student: formattedBookings[0].student
      });
      
      // Check if tutor data is missing
      if (!formattedBookings[0].tutor) {
        console.log('⚠️ TUTOR DATA MISSING for booking:', formattedBookings[0].id);
      }
      if (!formattedBookings[0].student) {
        console.log('⚠️ STUDENT DATA MISSING for booking:', formattedBookings[0].id);
      }
    }

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

    // Get tutor's hourly rate for updating booking rates
    const { data: tutorProfile, error: tutorProfileError } = await supabase
      .from('tutor_profiles')
      .select('hourly_rate')
      .eq('user_id', booking.tutor_id)
      .single();

    const hourlyRate = tutorProfile?.hourly_rate || 10; // Use 10 as fallback
    const newStartTime = start_time || booking.start_time;
    const newEndTime = end_time || booking.end_time;
    const newDurationHours = (new Date(newEndTime) - new Date(newStartTime)) / (1000 * 60 * 60);
    const newTotalAmount = hourlyRate * newDurationHours;

    console.log(`💰 Updating booking rates after direct update: ${hourlyRate} credits/hour × ${newDurationHours} hours = ${newTotalAmount} credits`);

    // Update booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        start_time: newStartTime,
        end_time: newEndTime,
        hourly_rate: hourlyRate,
        total_amount: newTotalAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating booking:', updateError);
      throw updateError;
    }

    console.log('✅ Booking updated successfully:', {
      id: updatedBooking.id,
      hourly_rate: updatedBooking.hourly_rate,
      total_amount: updatedBooking.total_amount,
      start_time: updatedBooking.start_time,
      end_time: updatedBooking.end_time
    });

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

    // Tutors can initiate reschedule requests without credit validation
    // Credit validation will happen when the student accepts the reschedule

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
    
    console.log('🔄 CREATING RESCHEDULE REQUEST:', {
      bookingId: id,
      updateData: updateData,
      requesterType: requesterType
    });
    
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

    console.log('✅ RESCHEDULE REQUEST CREATED:', {
      bookingId: id,
      rescheduleStatus: updatedBooking.reschedule_status,
      rescheduleRequestedBy: updatedBooking.reschedule_requested_by,
      pendingStartTime: updatedBooking.pending_reschedule_start_time,
      pendingEndTime: updatedBooking.pending_reschedule_end_time
    });


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
  console.log('🚨 CANCELLATION ENDPOINT CALLED!');
  console.log('🚨 Request params:', req.params);
  console.log('🚨 Request body:', req.body);
  console.log('🚨 User ID:', req.user?.userId);
  
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

    // Check if booking is already cancelled
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

      // Tutor loses credits (they were already given when booking was confirmed)
      const { data: tutor, error: tutorError } = await supabase
        .from('users')
        .select('credits')
        .eq('id', booking.tutor_id)
        .single();

      if (tutorError) {
        console.error('❌ Error fetching tutor credits:', tutorError);
      } else {
        const newTutorCredits = Math.max(0, (tutor.credits || 0) - creditsToRefund);
        console.log(`💸 Deducting ${creditsToRefund} credits from tutor. Old: ${tutor.credits}, New: ${newTutorCredits}`);
        
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
          console.log('✅ Tutor credits deducted successfully');
        }
      }
    } else {
      // Only happens when student cancels less than 24 hours before
      console.log('❌ Student cancelled less than 24 hours - no refund for student, tutor still loses credits');
      
      // Student gets no refund (credits stay with tutor)
      // Tutor still loses credits (they were already given when booking was confirmed)
      const { data: tutor, error: tutorError } = await supabase
        .from('users')
        .select('credits')
        .eq('id', booking.tutor_id)
        .single();

      if (tutorError) {
        console.error('❌ Error fetching tutor credits:', tutorError);
      } else {
        const newTutorCredits = Math.max(0, (tutor.credits || 0) - creditsToRefund);
        console.log(`💸 Deducting ${creditsToRefund} credits from tutor (late cancellation). Old: ${tutor.credits}, New: ${newTutorCredits}`);
        
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
          console.log('✅ Tutor credits deducted successfully (late cancellation)');
        }
      }
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
    console.log(`📧 Canceller ID: ${cancellerId}, Other Party ID: ${otherPartyId}`);
    console.log(`📧 Booking ID: ${booking.id}`);

    try {
      // Find or create conversation between tutor and student
      console.log(`📧 Looking for existing conversation between tutor ${booking.tutor_id} and student ${booking.student_id}`);
      
      const { data: existingConversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant1_id.eq.${booking.tutor_id},participant2_id.eq.${booking.student_id}),and(participant1_id.eq.${booking.student_id},participant2_id.eq.${booking.tutor_id})`)
        .limit(1);

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
          cancellationReason: cancellation_reason || 'No reason provided',
          refundPolicy: {
            isMoreThan24Hours,
            creditsToRefund,
            studentRefunded: shouldRefundStudent,
            tutorCreditsDeducted: true,
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
        console.log(`📧 Message content to send:`, messageContent);
        
        // Get auth token for messaging service
        const authToken = req.headers.authorization?.split(' ')[1];
        console.log(`📧 Auth token available:`, !!authToken);
        
        // Send message via messaging service (with Socket.IO broadcast to both parties)
        console.log(`📧 Sending message to messaging service...`);
        const sent = await sendMessageViaMessagingService(
          conversationId,
          messageContent,
          'booking_cancelled',
          authToken
        );
        console.log(`📧 Message sending result:`, sent);

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
      data: updatedBooking,
      refundPolicy: {
        isMoreThan24Hours,
        creditsToRefund,
        studentRefunded: isMoreThan24Hours,
        tutorCreditsDeducted: true
      }
    });
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

    // Get tutor's hourly rate for credit validation
    const { data: tutorProfile, error: tutorProfileError } = await supabase
      .from('tutor_profiles')
      .select('hourly_rate')
      .eq('user_id', booking.tutor_id)
      .single();

    const hourlyRate = tutorProfile?.hourly_rate || 10; // Use 10 as fallback

    // CREDIT VALIDATION - Check credits BEFORE updating booking
    try {
      console.log('🔄 Processing credit validation for reschedule acceptance...');
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

      // Use the hourly rate we already fetched above
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

        // Check if student has sufficient credits for reschedule (if credit difference is positive)
        if (creditDifference > 0) {
          // Get student data to check user type and credits
          const { data: studentData, error: studentDataError } = await supabase
            .from('users')
            .select('credits, user_type')
            .eq('id', booking.student_id)
            .single();

          if (studentDataError) {
            console.error('❌ Error fetching student data for credit validation:', studentDataError);
            return res.status(500).json({ error: 'Failed to verify student credits' });
          }

          // Only check credits for students
          if (studentData.user_type === 'student') {
            const currentStudentCredits = studentData.credits || 0;
            
            if (currentStudentCredits < creditDifference) {
              const shortfall = creditDifference - currentStudentCredits;
              console.log(`❌ Insufficient credits for reschedule: Student has ${currentStudentCredits}, needs ${creditDifference}, shortfall: ${shortfall}`);
              
              return res.status(400).json({ 
                error: 'Insufficient credits for reschedule', 
                details: {
                  requiredCredits: creditDifference,
                  currentCredits: currentStudentCredits,
                  shortfall: shortfall,
                  message: `You need ${shortfall} more credits to accept this reschedule. Please top up your credits.`
                }
              });
            }
          }
        }
      } else {
        console.log('⚠️ Tutor hourly rate not found - skipping credit validation');
      }
    } catch (creditError) {
      console.error('❌ Error processing credit validation:', creditError);
      return res.status(500).json({ error: 'Failed to validate credits' });
    }

    // If we get here, credit validation passed - now update the booking
    const newDurationHours = (new Date(booking.pending_reschedule_end_time) - new Date(booking.pending_reschedule_start_time)) / (1000 * 60 * 60);
    const newTotalAmount = hourlyRate * newDurationHours;

    console.log(`💰 Updating booking rates after reschedule: ${hourlyRate} credits/hour × ${newDurationHours} hours = ${newTotalAmount} credits`);

    // Update the booking: apply new times, rates, and location, clear reschedule request fields
    const updateData = {
      start_time: booking.pending_reschedule_start_time,
      end_time: booking.pending_reschedule_end_time,
      hourly_rate: hourlyRate,
      total_amount: newTotalAmount,
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
      console.error('❌ Error updating booking after reschedule:', updateError);
      throw updateError;
    }

    console.log('✅ Booking updated successfully after reschedule:', {
      id: updatedBooking.id,
      hourly_rate: updatedBooking.hourly_rate,
      total_amount: updatedBooking.total_amount,
      start_time: updatedBooking.start_time,
      end_time: updatedBooking.end_time
    });

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

      // Use the hourly rate we already fetched above
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

        // Check if student has sufficient credits for reschedule (if credit difference is positive)
        if (creditDifference > 0) {
          // Get student data to check user type and credits
          const { data: studentData, error: studentDataError } = await supabase
            .from('users')
            .select('credits, user_type')
            .eq('id', booking.student_id)
            .single();

          if (studentDataError) {
            console.error('❌ Error fetching student data for credit validation:', studentDataError);
            return res.status(500).json({ error: 'Failed to verify student credits' });
          }

          // Only check credits for students
          if (studentData.user_type === 'student') {
            const currentStudentCredits = studentData.credits || 0;
            
            if (currentStudentCredits < creditDifference) {
              const shortfall = creditDifference - currentStudentCredits;
              console.log(`❌ Insufficient credits for reschedule: Student has ${currentStudentCredits}, needs ${creditDifference}, shortfall: ${shortfall}`);
              
              return res.status(400).json({ 
                error: 'Insufficient credits for reschedule', 
                details: {
                  requiredCredits: creditDifference,
                  currentCredits: currentStudentCredits,
                  shortfall: shortfall,
                  message: `You need ${shortfall} more credits to accept this reschedule. Please top up your credits.`
                }
              });
            }
          }
        }

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

    console.log('🔍 REJECT RESCHEDULE REQUEST:', {
      bookingId: id,
      userId: userId,
      responseMessage: response_message
    });

    // Get booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    console.log('🔍 REJECT RESCHEDULE DEBUG:', {
      bookingId: id,
      userId: userId,
      booking: booking,
      fetchError: fetchError,
      rescheduleStatus: booking?.reschedule_status,
      rescheduleRequestedBy: booking?.reschedule_requested_by,
      pendingRescheduleStartTime: booking?.pending_reschedule_start_time,
      pendingRescheduleEndTime: booking?.pending_reschedule_end_time,
      rescheduleRequestedAt: booking?.reschedule_requested_at,
      rescheduleRequesterType: booking?.reschedule_requester_type,
      rescheduleReason: booking?.reschedule_reason
    });

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
    console.log('🔍 CHECKING RESCHEDULE STATUS:', {
      rescheduleStatus: booking.reschedule_status,
      isPending: booking.reschedule_status === 'pending',
      hasPendingFields: !!(booking.pending_reschedule_start_time && booking.pending_reschedule_end_time),
      bookingId: id
    });
    
    // Check if there's a valid reschedule request (either status is pending OR has pending fields OR has reschedule requester)
    const hasValidRescheduleRequest = booking.reschedule_status === 'pending' || 
                                     (booking.pending_reschedule_start_time && booking.pending_reschedule_end_time) ||
                                     booking.reschedule_requested_by;
    
    if (!hasValidRescheduleRequest) {
      console.log('❌ NO PENDING RESCHEDULE REQUEST:', {
        currentStatus: booking.reschedule_status,
        expectedStatus: 'pending',
        hasPendingFields: !!(booking.pending_reschedule_start_time && booking.pending_reschedule_end_time),
        hasRequester: !!booking.reschedule_requested_by,
        pendingStartTime: booking.pending_reschedule_start_time,
        pendingEndTime: booking.pending_reschedule_end_time,
        requesterId: booking.reschedule_requested_by
      });
      return res.status(400).json({ error: 'No pending reschedule request found' });
    }

    // Update the booking: reject and clear reschedule request fields
    console.log('🔄 REJECTING RESCHEDULE REQUEST:', {
      bookingId: id,
      currentStartTime: booking.start_time,
      currentEndTime: booking.end_time,
      pendingStartTime: booking.pending_reschedule_start_time,
      pendingEndTime: booking.pending_reschedule_end_time
    });

    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        reschedule_status: 'rejected',
        reschedule_responded_at: new Date().toISOString(),
        reschedule_response_message: response_message || 'Rejected',
        // Clear ALL pending fields after rejecting
        pending_reschedule_start_time: null,
        pending_reschedule_end_time: null,
        pending_reschedule_location: null,
        // Keep original booking times unchanged
        // start_time and end_time are NOT updated - they stay as original
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating booking for rejection:', updateError);
      throw updateError;
    }

    console.log('✅ RESCHEDULE REQUEST REJECTED:', {
      bookingId: id,
      rescheduleStatus: updatedBooking.reschedule_status,
      startTime: updatedBooking.start_time,
      endTime: updatedBooking.end_time,
      pendingStartTime: updatedBooking.pending_reschedule_start_time,
      pendingEndTime: updatedBooking.pending_reschedule_end_time
    });

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

// Debug endpoint to check tutor profile
app.get('/debug/tutor/:id/profile', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get tutor profile
    const { data: tutorProfile, error: profileError } = await supabase
      .from('tutor_profiles')
      .select('*')
      .eq('user_id', id)
      .single();

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('id', id)
      .single();

    res.json({
      tutor_id: id,
      user: user,
      profile: tutorProfile,
      errors: {
        profile_error: profileError?.message,
        user_error: userError?.message
      },
      analysis: {
        has_profile: !!tutorProfile,
        has_hourly_rate: !!(tutorProfile?.hourly_rate && tutorProfile.hourly_rate > 0),
        hourly_rate_value: tutorProfile?.hourly_rate
      }
    });
  } catch (error) {
    console.error('Debug tutor profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Debug endpoint to check booking rates
app.get('/debug/booking/:id/rates', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        tutor_id,
        student_id,
        start_time,
        end_time,
        hourly_rate,
        total_amount,
        status
      `)
      .eq('id', id)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Get tutor's actual hourly rate
    const { data: tutorProfile, error: profileError } = await supabase
      .from('tutor_profiles')
      .select('hourly_rate')
      .eq('user_id', booking.tutor_id)
      .single();

    // Calculate expected values
    const startTime = new Date(booking.start_time);
    const endTime = new Date(booking.end_time);
    const durationHours = (endTime - startTime) / (1000 * 60 * 60);
    const expectedTotal = booking.hourly_rate * durationHours;
    const actualTutorRate = tutorProfile?.hourly_rate;
    const correctTotal = actualTutorRate ? actualTutorRate * durationHours : null;

    res.json({
      booking: {
        id: booking.id,
        tutor_id: booking.tutor_id,
        duration_hours: durationHours,
        current_hourly_rate: booking.hourly_rate,
        current_total_amount: booking.total_amount,
        expected_total_amount: expectedTotal
      },
      tutor_profile: {
        hourly_rate: actualTutorRate,
        profile_found: !!tutorProfile,
        profile_error: profileError?.message
      },
      analysis: {
        calculation_correct: Math.abs(booking.total_amount - expectedTotal) < 0.01,
        rate_matches_profile: booking.hourly_rate === actualTutorRate,
        correct_total_if_using_profile_rate: correctTotal
      }
    });
  } catch (error) {
    console.error('Debug booking rates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to manually fix a booking's rates
app.post('/debug/booking/:id/fix-rates', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        tutor_id,
        start_time,
        end_time,
        hourly_rate,
        total_amount
      `)
      .eq('id', id)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Get tutor's actual hourly rate
    const { data: tutorProfile, error: profileError } = await supabase
      .from('tutor_profiles')
      .select('hourly_rate')
      .eq('user_id', booking.tutor_id)
      .single();

    if (profileError || !tutorProfile?.hourly_rate) {
      return res.status(400).json({ 
        error: 'Tutor profile not found or no hourly rate set',
        tutor_id: booking.tutor_id,
        profile_error: profileError?.message
      });
    }

    // Calculate correct values
    const startTime = new Date(booking.start_time);
    const endTime = new Date(booking.end_time);
    const durationHours = (endTime - startTime) / (1000 * 60 * 60);
    const correctTotal = tutorProfile.hourly_rate * durationHours;

    // Update the booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        hourly_rate: tutorProfile.hourly_rate,
        total_amount: correctTotal,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update booking', details: updateError });
    }

    res.json({
      message: 'Booking rates updated successfully',
      booking: {
        id: updatedBooking.id,
        old_hourly_rate: booking.hourly_rate,
        new_hourly_rate: updatedBooking.hourly_rate,
        old_total_amount: booking.total_amount,
        new_total_amount: updatedBooking.total_amount,
        duration_hours: durationHours
      },
      tutor_profile: {
        hourly_rate: tutorProfile.hourly_rate
      }
    });
  } catch (error) {
    console.error('Fix booking rates error:', error);
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