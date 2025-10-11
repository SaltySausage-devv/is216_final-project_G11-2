const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
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
      student_id: booking.student_id
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

app.post('/bookings/:id/reschedule', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { start_time, end_time, reschedule_reason } = req.body;

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
        start_time,
        end_time,
        rescheduled_at: new Date().toISOString(),
        notes: reschedule_reason
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({ data: updatedBooking });
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'calendar' });
});

app.listen(PORT, () => {
  console.log(`Calendar service running on port ${PORT}`);
});