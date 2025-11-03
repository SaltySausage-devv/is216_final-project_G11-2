const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
// Load environment variables (optional for Railway deployment)
try {
  require('dotenv').config({ path: '../../.env' });
} catch (error) {
  console.log('⚠️ Could not load .env file, using system environment variables');
}

const app = express();
const PORT = process.env.PORT || 3008;

// Initialize Supabase client
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

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

// Rate limiting - skip for OPTIONS requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) => req.method === 'OPTIONS'
});
app.use(limiter);

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Verify Supabase token
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
      userType: userProfile?.user_type || 'student'
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Helper function to calculate date range
const getDateRange = (period) => {
  const endDate = new Date();
  const startDate = new Date();
  
  switch (period) {
    case '7':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case '365':
      startDate.setDate(endDate.getDate() - 365);
      break;
    default:
      startDate.setDate(endDate.getDate() - 30);
  }
  
  return { startDate, endDate };
};

// Helper function to generate chart data
const generateChartData = (data, startDate, endDate, period) => {
  const hoursData = [];
  const spendingData = [];
  const chartLabels = [];
  
  // For earnings data, extend the range to include future dates
  const hasFutureData = data.some(item => {
    const itemDate = new Date(item.start_time || item.created_at);
    return itemDate > new Date();
  });
  
  let startOffset, endOffset;
  if (hasFutureData) {
    // Include future dates for earnings
    startOffset = parseInt(period) - 1;
    endOffset = 7; // Include 7 days in the future
  } else {
    // Normal behavior for past data
    startOffset = parseInt(period) - 1;
    endOffset = 0;
  }
  
  for (let i = startOffset; i >= -endOffset; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    chartLabels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayData = data.filter(item => {
      const itemDate = new Date(item.start_time || item.created_at);
      // For earnings, include future dates by checking if the item date matches the current chart date
      // This allows future confirmed bookings to appear in the chart
      return itemDate >= dayStart && itemDate <= dayEnd;
    });
    
    // Calculate total hours for the day (only completed/confirmed bookings)
    const totalHours = dayData
      .filter(item => item.status === 'completed' || item.status === 'confirmed')
      .reduce((sum, item) => {
        if (item.start_time && item.end_time) {
          const start = new Date(item.start_time);
          const end = new Date(item.end_time);
          const hours = (end - start) / (1000 * 60 * 60); // Convert to hours
          // Ensure hours is never negative
          return sum + Math.max(0, hours);
        }
        return sum;
      }, 0);
    
    // Calculate total spending for the day (only completed/confirmed bookings)
    const totalSpending = dayData
      .filter(item => item.status === 'completed' || item.status === 'confirmed')
      .reduce((sum, item) => {
        const amount = parseFloat(item.total_amount) || 0;
        // Ensure spending is never negative
        return sum + Math.max(0, amount);
      }, 0);
    
    // Ensure final values are non-negative
    hoursData.push(Math.max(0, parseFloat(totalHours.toFixed(1))));
    spendingData.push(Math.max(0, parseFloat(totalSpending.toFixed(2))));
  }
  
  return { 
    chartData: hoursData, 
    spendingData: spendingData,
    chartLabels 
  };
};

// Helper function to calculate growth percentage
const calculateGrowth = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous * 100).toFixed(1);
};

// Routes

// Student Analytics
app.get('/analytics/student/:studentId', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { period = '30' } = req.query;
    
    console.log('📊 ANALYTICS: Student analytics request:', { studentId, period, user: req.user });
    
    // Check if user is the student or admin
    if (req.user.userId !== studentId && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { startDate, endDate } = getDateRange(period);
    console.log('📊 ANALYTICS: Date range:', { startDate: startDate.toISOString(), endDate: endDate.toISOString() });

    // Get all student bookings with tutor info (no date filter for recentActivity)
    const { data: allBookings, error: allBookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        tutor:users!tutor_id(
          first_name,
          last_name
        )
      `)
      .eq('student_id', studentId);

    // Get date-filtered bookings for KPIs and charts
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        tutor:users!tutor_id(
          first_name,
          last_name
        )
      `)
      .eq('student_id', studentId)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString());

    if (bookingsError) {
      console.error('📊 ANALYTICS: Bookings error:', bookingsError);
      throw bookingsError;
    }

    console.log('📊 ANALYTICS: Found bookings:', bookings?.length || 0);

    // Get student reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('student_id', studentId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    console.log('📊 ANALYTICS: Found reviews:', reviews?.length || 0);

    // Get student messages
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', studentId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    console.log('📊 ANALYTICS: Found messages:', messages?.length || 0);

    // Calculate metrics according to business requirements
    console.log('📊 STUDENT ANALYTICS: Calculating metrics with business rules...');
    
    // Active Bookings: confirmed bookings with future date (start_time > now)
    // These are bookings from messages or calendar that are confirmed and scheduled for the future
    const now = new Date();
    const activeBookings = allBookings
      ?.filter(b => {
        if (b.status !== 'confirmed') return false;
        if (!b.start_time) return false;
        const startTime = new Date(b.start_time);
        return startTime > now; // Future date
      }) || [];

    console.log('📊 Active Bookings (confirmed future):', activeBookings.length);

    // Completed Sessions: bookings marked as present (attendance_status === 'attended')
    // These are sessions where attendance was marked as 'attended' in the calendar
    const completedSessions = allBookings
      ?.filter(b => b.attendance_status === 'attended').length || 0;
    
    console.log('📊 Completed Sessions (attendance marked):', completedSessions);
    
    // Other metrics
    const cancelledSessions = allBookings?.filter(b => b.status === 'cancelled').length || 0;
    const actualPendingSessions = allBookings?.filter(b => b.status === 'pending').length || 0;
    
    // For growth metrics: total sessions = all confirmed/completed bookings
    const totalSessions = allBookings
      ?.filter(b => b.status === 'completed' || b.status === 'confirmed').length || 0;
    
    console.log('📊 Total Sessions (confirmed/completed):', totalSessions);

    // Hours This Month: from completed sessions (attendance_status === 'attended') in current month
    // Only sessions where attendance was marked as 'attended' AND the session start_time is in current month
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    currentMonthStart.setHours(0, 0, 0, 0);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    currentMonthEnd.setHours(23, 59, 59, 999);

    console.log('📊 Current month range:', {
      start: currentMonthStart.toISOString(),
      end: currentMonthEnd.toISOString(),
      now: now.toISOString()
    });

    const bookingsWithAttendanceThisMonth = allBookings
      ?.filter(b => {
        // Must have attendance marked as 'attended'
        if (b.attendance_status !== 'attended') {
          return false;
        }
        // Must have start_time to check the month
        if (!b.start_time) {
          console.log('📊 Skipping booking (no start_time):', b.id);
          return false;
        }
        // Check if the session START TIME is in the current month (not when attendance was marked)
        const sessionStart = new Date(b.start_time);
        const isInCurrentMonth = sessionStart >= currentMonthStart && sessionStart <= currentMonthEnd;
        
        if (!isInCurrentMonth) {
          console.log('📊 Skipping booking (not in current month):', {
            id: b.id,
            start_time: b.start_time,
            sessionStart: sessionStart.toISOString(),
            currentMonthStart: currentMonthStart.toISOString(),
            currentMonthEnd: currentMonthEnd.toISOString()
          });
        }
        
        return isInCurrentMonth;
      }) || [];

    console.log('📊 Bookings with attendance this month:', {
      count: bookingsWithAttendanceThisMonth.length,
      bookings: bookingsWithAttendanceThisMonth.map(b => ({
        id: b.id,
        start_time: b.start_time,
        end_time: b.end_time,
        attendance_status: b.attendance_status,
        attendance_marked_at: b.attendance_marked_at
      }))
    });

    const totalHours = bookingsWithAttendanceThisMonth
      ?.reduce((sum, b) => {
        if (b.start_time && b.end_time) {
          const start = new Date(b.start_time);
          const end = new Date(b.end_time);
          const hours = (end - start) / (1000 * 60 * 60);
          // Ensure hours is never negative
          const validHours = Math.max(0, hours);
          console.log('📊 Adding hours for booking:', {
            id: b.id,
            start: start.toISOString(),
            end: end.toISOString(),
            hours: validHours
          });
          return sum + validHours;
        }
        console.log('📊 Skipping booking (missing start/end time):', b.id);
        return sum;
      }, 0) || 0;

    console.log('📊 Total Hours This Month (from attended sessions in current month):', totalHours);

    // Total Spent: total amount from all confirmed bookings (all time, not just current month)
    // Only confirmed bookings count towards total spent (credits used)
    const confirmedBookings = allBookings?.filter(b => b.status === 'confirmed') || [];
    console.log('📊 Confirmed Bookings (for total spent):', confirmedBookings.length);

    const totalSpent = confirmedBookings
      ?.reduce((sum, b) => {
        const amount = parseFloat(b.total_amount) || 0;
        // Ensure spending is never negative
        return sum + Math.max(0, amount);
      }, 0) || 0;

    console.log('📊 Total Spent (credits used for confirmed bookings):', totalSpent);
    const tutorsWorkedWith = new Set(
      allBookings
        ?.filter(b => b.status === 'completed' || b.status === 'confirmed')
        ?.map(b => b.tutor_id)
    ).size || 0;
    const totalReviews = reviews?.length || 0;
    const totalMessages = messages?.length || 0;

    // Subject distribution from bookings with enhanced data (only completed/confirmed)
    const subjectCounts = {};
    const subjectHours = {};
    const subjectSpending = {};
    
    allBookings
      ?.filter(booking => booking.status === 'completed' || booking.status === 'confirmed')
      ?.forEach(booking => {
        const subject = booking.subject || 'General Tutoring';
        const duration = booking.start_time && booking.end_time ? 
          (new Date(booking.end_time) - new Date(booking.start_time)) / (1000 * 60 * 60) : 0;
        const amount = booking.total_amount || 0;
        
        subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
        subjectHours[subject] = (subjectHours[subject] || 0) + duration;
        subjectSpending[subject] = (subjectSpending[subject] || 0) + amount;
      });

    const subjectDistribution = Object.entries(subjectCounts)
      .map(([subject, count]) => ({ 
        subject, 
        count,
        hours: subjectHours[subject]?.toFixed(1) || 0,
        spending: subjectSpending[subject]?.toFixed(2) || 0,
        percentage: ((count / (bookings?.filter(b => b.status === 'completed' || b.status === 'confirmed').length || 1)) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);

    // Create pie chart data
    const pieLabels = subjectDistribution.map(item => item.subject);
    const pieData = subjectDistribution.map(item => item.count);

    // Growth metrics (compare with previous period)
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - parseInt(period));

    const { data: prevBookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('student_id', studentId)
      .gte('start_time', prevStartDate.toISOString())
      .lt('start_time', startDate.toISOString());

    const prevSessions = prevBookings?.length || 0;
    const prevHours = prevBookings?.reduce((sum, b) => {
      if (b.start_time && b.end_time) {
        const start = new Date(b.start_time);
        const end = new Date(b.end_time);
        const hours = (end - start) / (1000 * 60 * 60);
        // Ensure hours is never negative
        return sum + Math.max(0, hours);
      }
      return sum;
    }, 0) || 0;

    const sessionsChange = calculateGrowth(totalSessions, prevSessions);
    const hoursChange = calculateGrowth(totalHours, prevHours);

    // Chart data
    const { chartData, spendingData, chartLabels } = generateChartData(bookings || [], startDate, endDate, period);

    // Recent activity with ratings (only completed/confirmed bookings)
    const recentActivity = allBookings
      ?.filter(booking => booking.status === 'completed' || booking.status === 'confirmed')
      ?.slice(0, 10)
      .map(booking => {
        // Find rating for this booking
        const bookingReview = reviews?.find(review => review.booking_id === booking.id);
        const rating = bookingReview ? bookingReview.rating : 'N/A';
        
        return {
          date: booking.created_at,
          subject: booking.subject || 'General',
          tutorName: `${booking.tutor?.first_name || ''} ${booking.tutor?.last_name || ''}`.trim() || 'Tutor',
          duration: booking.start_time && booking.end_time ? 
            Math.round(((new Date(booking.end_time) - new Date(booking.start_time)) / (1000 * 60 * 60))) + 'h' : 'N/A',
          cost: parseFloat(booking.total_amount || 0),
          rating: rating,
          status: booking.status
        };
      }) || [];

    const responseData = {
      totalSessions,
      completedSessions,
      cancelledSessions,
      pendingSessions: activeBookings.length, // Active Bookings: confirmed future bookings for dashboard
      totalHours: totalHours.toFixed(1),
      totalSpent: totalSpent.toFixed(2),
      tutorsWorkedWith,
      totalReviews,
      totalMessages,
      subjectDistribution,
      pieLabels,
      pieData,
      sessionsChange: parseFloat(sessionsChange),
      hoursChange: parseFloat(hoursChange),
      chartData,
      spendingData,
      chartLabels,
      recentActivity
    };

    console.log('📊 ANALYTICS: Response data:', responseData);

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Student analytics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Tutor Analytics
app.get('/analytics/tutor/:tutorId', verifyToken, async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { period = '30' } = req.query;
    
    console.log('📊 TUTOR ANALYTICS: Starting for tutorId:', tutorId);
    console.log('📊 TUTOR ANALYTICS: User making request:', req.user);
    
    // Check if user is the tutor or admin
    if (req.user.userId !== tutorId && req.user.userType !== 'admin') {
      console.log('📊 TUTOR ANALYTICS: Access denied - user not authorized');
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { startDate, endDate } = getDateRange(period);

    console.log('📊 TUTOR ANALYTICS: Date range:', { startDate: startDate.toISOString(), endDate: endDate.toISOString() });

    // Get tutor's bookings with student info
    console.log('📊 TUTOR ANALYTICS: Querying bookings for tutorId:', tutorId);
    
    // First, let's check all bookings for this tutor without date filter
    const { data: allBookings, error: allBookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        student:users!student_id(
          first_name,
          last_name
        )
      `)
      .eq('tutor_id', tutorId);
    
    console.log('📊 TUTOR ANALYTICS: All bookings for tutor:', { 
      allBookingsCount: allBookings?.length || 0, 
      allBookingsError,
      sampleAllBooking: allBookings?.[0] 
    });
    
    // Get all confirmed/completed bookings for earnings (regardless of date)
    // and bookings within date range for other metrics
    const { data: allConfirmedBookings, error: allConfirmedError } = await supabase
      .from('bookings')
      .select(`
        *,
        student:users!student_id(
          first_name,
          last_name
        )
      `)
      .eq('tutor_id', tutorId)
      .in('status', ['confirmed', 'completed']);
    
    console.log('📊 TUTOR ANALYTICS: All confirmed bookings:', { 
      allConfirmedCount: allConfirmedBookings?.length || 0, 
      allConfirmedError,
      sampleConfirmed: allConfirmedBookings?.[0] 
    });
    
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        student:users!student_id(
          first_name,
          last_name
        )
      `)
      .eq('tutor_id', tutorId)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString());
    
    console.log('📊 TUTOR ANALYTICS: Bookings query result:', { 
      bookingsCount: bookings?.length || 0, 
      bookingsError,
      sampleBooking: bookings?.[0] 
    });

    if (bookingsError) throw bookingsError;

    // Get tutor's reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('tutor_id', tutorId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (reviewsError) throw reviewsError;

    // Get tutor's profile
    const { data: profile, error: profileError } = await supabase
      .from('tutor_profiles')
      .select('*')
      .eq('user_id', tutorId)
      .single();

    if (profileError) throw profileError;

    // Calculate metrics
    const totalBookings = bookings?.length || 0;
    const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
    const cancelledBookings = bookings?.filter(b => b.status === 'cancelled').length || 0;
    const pendingBookings = bookings?.filter(b => b.status === 'pending').length || 0;

    const totalEarnings = allConfirmedBookings
      ?.reduce((sum, b) => {
        const amount = parseFloat(b.total_amount) || 0;
        // Ensure earnings is never negative
        return sum + Math.max(0, amount);
      }, 0) || 0;

    const totalHours = bookings
      ?.filter(b => b.status === 'completed' || b.status === 'confirmed')
      ?.reduce((sum, b) => {
        if (b.start_time && b.end_time) {
          const start = new Date(b.start_time);
          const end = new Date(b.end_time);
          const hours = (end - start) / (1000 * 60 * 60);
          // Ensure hours is never negative
          return sum + Math.max(0, hours);
        }
        return sum;
      }, 0) || 0;

    const totalStudents = new Set(bookings?.map(b => b.student_id)).size || 0;
    const averageRating = reviews?.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    // Subject distribution from actual bookings (only completed/confirmed)
    const subjectCounts = {};
    const subjectHours = {};
    const subjectSpending = {};
    
    bookings
      ?.filter(booking => booking.status === 'completed' || booking.status === 'confirmed')
      ?.forEach(booking => {
        const subject = booking.subject || 'General Tutoring';
        const duration = booking.start_time && booking.end_time ? 
          (new Date(booking.end_time) - new Date(booking.start_time)) / (1000 * 60 * 60) : 0;
        const amount = parseFloat(booking.total_amount) || 0;
        
        // Ensure duration and amount are never negative
        const safeDuration = Math.max(0, duration);
        const safeAmount = Math.max(0, amount);
        
        subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
        subjectHours[subject] = (subjectHours[subject] || 0) + safeDuration;
        subjectSpending[subject] = (subjectSpending[subject] || 0) + safeAmount;
      });

    const subjectDistribution = Object.entries(subjectCounts)
      .map(([subject, count]) => ({ 
        subject, 
        count,
        hours: subjectHours[subject]?.toFixed(1) || 0,
        spending: subjectSpending[subject]?.toFixed(2) || 0,
        percentage: ((count / (bookings?.filter(b => b.status === 'completed' || b.status === 'confirmed').length || 1)) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);

    // Create pie chart data
    const pieLabels = subjectDistribution.map(item => item.subject);
    const pieData = subjectDistribution.map(item => item.count);

    // Growth metrics
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - parseInt(period));

    const { data: prevBookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('tutor_id', tutorId)
      .gte('created_at', prevStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    const prevEarnings = prevBookings
      ?.filter(b => b.status === 'completed' || b.status === 'confirmed')
      ?.reduce((sum, b) => {
        const amount = parseFloat(b.total_amount) || 0;
        // Ensure earnings is never negative
        return sum + Math.max(0, amount);
      }, 0) || 0;

    const earningsChange = calculateGrowth(totalEarnings, prevEarnings);
    const bookingsChange = calculateGrowth(totalBookings, prevBookings?.length || 0);
    const studentsChange = calculateGrowth(totalStudents, new Set(prevBookings?.map(b => b.student_id)).size || 0);

    // Chart data - use all confirmed bookings for earnings, date-filtered for hours
    console.log('📊 TUTOR ANALYTICS: Generating chart data with:', {
      allConfirmedBookingsCount: allConfirmedBookings?.length || 0,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      period,
      sampleBooking: allConfirmedBookings?.[0]
    });
    
    // Simple earnings chart data generation
    const earningsData = [];
    const earningsLabels = [];
    
    // Generate last 30 days + 7 future days
    for (let i = 29; i >= -7; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      earningsLabels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayEarnings = allConfirmedBookings
        ?.filter(booking => {
          const bookingDate = new Date(booking.start_time);
          return bookingDate >= dayStart && bookingDate <= dayEnd;
        })
        ?.reduce((sum, booking) => {
          const amount = parseFloat(booking.total_amount) || 0;
          // Ensure earnings is never negative
          return sum + Math.max(0, amount);
        }, 0) || 0;
      
      // Ensure final earnings value is non-negative
      earningsData.push(Math.max(0, parseFloat(dayEarnings.toFixed(2))));
    }
    
    console.log('📊 TUTOR ANALYTICS: Simple earnings data generated:', {
      earningsDataLength: earningsData.length,
      earningsLabelsLength: earningsLabels.length,
      nonZeroDays: earningsData.filter(d => d > 0).length,
      sampleEarnings: earningsData.slice(0, 5),
      sampleLabels: earningsLabels.slice(0, 5)
    });
    
    const { chartData, spendingData, chartLabels } = generateChartData(allConfirmedBookings || [], startDate, endDate, period);

    // Recent activity (only completed/confirmed bookings)
    const recentActivity = allConfirmedBookings
      ?.filter(booking => booking.status === 'completed' || booking.status === 'confirmed')
      ?.slice(0, 10)
      .map(booking => ({
        date: booking.created_at,
        subject: booking.subject || 'General',
        studentName: `${booking.student?.first_name || ''} ${booking.student?.last_name || ''}`.trim() || 'Student',
        duration: booking.start_time && booking.end_time ? 
          Math.round(((new Date(booking.end_time) - new Date(booking.start_time)) / (1000 * 60 * 60))) + 'h' : 'N/A',
        earnings: Math.max(0, parseFloat(booking.total_amount || 0)),
        status: booking.status
      })) || [];

    res.json({
      success: true,
      data: {
        totalBookings,
        completedBookings,
        cancelledBookings,
        pendingBookings,
        totalEarnings: totalEarnings.toFixed(2),
        totalHours: totalHours.toFixed(1),
        totalStudents,
        averageRating: averageRating.toFixed(1),
        subjectDistribution,
        pieLabels,
        pieData,
        earningsChange: parseFloat(earningsChange),
        bookingsChange: parseFloat(bookingsChange),
        studentsChange: parseFloat(studentsChange),
        chartData,
        spendingData: earningsData,
        chartLabels: earningsLabels,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Tutor analytics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Centre Analytics
app.get('/analytics/centre/:centreId', verifyToken, async (req, res) => {
  try {
    const { centreId } = req.params;
    const { period = '30' } = req.query;
    
    // Check if user is the centre or admin
    if (req.user.userId !== centreId && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { startDate, endDate } = getDateRange(period);

    // Get centre's tutors
    const { data: tutors, error: tutorsError } = await supabase
      .from('tutor_profiles')
      .select('user_id, first_name, last_name, subjects, hourly_rate')
      .eq('centre_id', centreId);

    if (tutorsError) throw tutorsError;

    const tutorIds = tutors?.map(t => t.user_id) || [];

    // Get bookings for all tutors
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .in('tutor_id', tutorIds)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (bookingsError) throw bookingsError;

    // Get reviews for all tutors
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .in('tutor_id', tutorIds)
      .gte('created_at', startDate.toISOString());

    if (reviewsError) throw reviewsError;

    // Calculate metrics
    const totalBookings = bookings?.length || 0;
    const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
    const cancelledBookings = bookings?.filter(b => b.status === 'cancelled').length || 0;
    const pendingBookings = bookings?.filter(b => b.status === 'pending').length || 0;

    const totalRevenue = bookings
      ?.filter(b => b.status === 'completed')
      ?.reduce((sum, b) => {
        const amount = parseFloat(b.total_amount) || 0;
        // Ensure revenue is never negative
        return sum + Math.max(0, amount);
      }, 0) || 0;

    const totalHours = bookings
      ?.filter(b => b.status === 'completed')
      ?.reduce((sum, b) => {
        if (b.start_time && b.end_time) {
          const start = new Date(b.start_time);
          const end = new Date(b.end_time);
          const hours = (end - start) / (1000 * 60 * 60);
          // Ensure hours is never negative
          return sum + Math.max(0, hours);
        }
        return sum;
      }, 0) || 0;

    const totalStudents = new Set(bookings?.map(b => b.student_id)).size || 0;
    const totalTutors = tutors?.length || 0;
    const averageRating = reviews?.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    // Subject distribution
    const subjectCounts = {};
    bookings?.forEach(booking => {
      const subject = booking.subject || 'General';
      subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
    });

    const subjectDistribution = Object.entries(subjectCounts)
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count);

    // Growth metrics
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - parseInt(period));

    const { data: prevBookings } = await supabase
      .from('bookings')
      .select('*')
      .in('tutor_id', tutorIds)
      .gte('created_at', prevStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    const prevRevenue = prevBookings
      ?.filter(b => b.status === 'completed')
      ?.reduce((sum, b) => {
        const amount = parseFloat(b.total_amount) || 0;
        // Ensure revenue is never negative
        return sum + Math.max(0, amount);
      }, 0) || 0;

    const revenueChange = calculateGrowth(totalRevenue, prevRevenue);
    const bookingsChange = calculateGrowth(totalBookings, prevBookings?.length || 0);
    const studentsChange = calculateGrowth(totalStudents, new Set(prevBookings?.map(b => b.student_id)).size || 0);

    // Chart data
    const { chartData, spendingData, chartLabels } = generateChartData(bookings || [], startDate, endDate, period);

    // Recent activity (only completed/confirmed bookings)
    const recentActivity = bookings
      ?.filter(booking => booking.status === 'completed' || booking.status === 'confirmed')
      ?.slice(0, 10)
      .map(booking => {
        const tutor = tutors?.find(t => t.user_id === booking.tutor_id);
        return {
          date: booking.created_at,
          tutorName: `${tutor?.first_name || ''} ${tutor?.last_name || ''}`.trim() || 'Tutor',
          subject: booking.subject || 'General',
          students: 1,
          revenue: Math.max(0, parseFloat(booking.total_amount || 0)),
          status: booking.status
        };
      }) || [];

    res.json({
      success: true,
      data: {
        totalBookings,
        completedBookings,
        cancelledBookings,
        pendingBookings,
        totalRevenue: totalRevenue.toFixed(2),
        totalHours: totalHours.toFixed(1),
        totalStudents,
        totalTutors,
        averageRating: averageRating.toFixed(1),
        subjectDistribution,
        revenueChange: parseFloat(revenueChange),
        bookingsChange: parseFloat(bookingsChange),
        studentsChange: parseFloat(studentsChange),
        chartData,
        chartLabels,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Centre analytics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Platform Analytics (Admin only)
app.get('/analytics/platform', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { period = '30' } = req.query;
    const { startDate, endDate } = getDateRange(period);

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('user_type, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (usersError) throw usersError;

    // Get all bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (bookingsError) throw bookingsError;

    // Get all messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (messagesError) throw messagesError;

    // Get all reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (reviewsError) throw reviewsError;

    // Calculate metrics
    const totalUsers = users?.length || 0;
    const students = users?.filter(u => u.user_type === 'student').length || 0;
    const tutors = users?.filter(u => u.user_type === 'tutor').length || 0;
    const centres = users?.filter(u => u.user_type === 'centre').length || 0;

    const totalBookings = bookings?.length || 0;
    const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
    const cancelledBookings = bookings?.filter(b => b.status === 'cancelled').length || 0;

    const totalRevenue = bookings
      ?.filter(b => b.status === 'completed')
      ?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

    const totalMessages = messages?.length || 0;
    const totalReviews = reviews?.length || 0;
    const averageRating = reviews?.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    // Chart data
    const { chartData, spendingData, chartLabels } = generateChartData(bookings || [], startDate, endDate, period);

    res.json({
      success: true,
      data: {
        totalUsers,
        students,
        tutors,
        centres,
        totalBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue: totalRevenue.toFixed(2),
        totalMessages,
        totalReviews,
        averageRating: averageRating.toFixed(1),
        chartData,
        chartLabels
      }
    });
  } catch (error) {
    console.error('Platform analytics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'analytics', 
    timestamp: new Date().toISOString(),
    port: PORT,
    supabase: process.env.SUPABASE_URL ? 'configured' : 'not configured'
  });
});

// Test endpoint to check database connection
app.get('/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      res.json({ 
        status: 'error', 
        message: 'Database connection failed', 
        error: error.message 
      });
    } else {
      res.json({ 
        status: 'success', 
        message: 'Database connection successful',
        supabase_url: process.env.SUPABASE_URL ? 'configured' : 'not configured'
      });
    }
  } catch (err) {
    res.json({ 
      status: 'error', 
      message: 'Database test failed', 
      error: err.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Analytics service error:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: error.message 
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Analytics service running on port ${PORT}`);
  console.log(`📊 Supabase connected: ${process.env.SUPABASE_URL ? 'Yes' : 'No'}`);
});

module.exports = app;