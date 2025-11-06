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
  
  // For periods 90 and 365, group by month instead of day
  const periodInt = parseInt(period);
  if (periodInt === 90 || periodInt === 365) {
    // Group by month
    const monthMap = new Map();
    
    // Process data items within date range
    data.forEach(item => {
      const itemDate = new Date(item.start_time || item.created_at);
      // Only include items within the date range
      if (itemDate < startDate || itemDate > endDate) return;
      
      const monthKey = `${itemDate.getFullYear()}-${itemDate.getMonth()}`;
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          month: itemDate.getMonth(),
          year: itemDate.getFullYear(),
          hours: 0,
          spending: 0
        });
      }
      
      const monthData = monthMap.get(monthKey);
      
      // Only count completed/confirmed bookings
      if (item.status === 'completed' || item.status === 'confirmed') {
        // Calculate hours
        if (item.start_time && item.end_time) {
          const start = new Date(item.start_time);
          const end = new Date(item.end_time);
          const hours = (end - start) / (1000 * 60 * 60);
          monthData.hours += Math.max(0, hours);
        }
        
        // Calculate spending
        const amount = parseFloat(item.total_amount) || 0;
        monthData.spending += Math.max(0, amount);
      }
    });
    
    // Get all months within the date range
    const months = [];
    const currentDate = new Date(startDate);
    currentDate.setDate(1); // Start of month
    currentDate.setHours(0, 0, 0, 0);
    
    while (currentDate <= endDate) {
      const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
      months.push({
        key: monthKey,
        date: new Date(currentDate),
        month: currentDate.getMonth(),
        year: currentDate.getFullYear()
      });
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // Generate labels and data for each month
    months.forEach(({ date, month, year }) => {
      const monthKey = `${year}-${month}`;
      const monthData = monthMap.get(monthKey) || { hours: 0, spending: 0 };
      
      chartLabels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      hoursData.push(Math.max(0, parseFloat(monthData.hours.toFixed(1))));
      spendingData.push(Math.max(0, parseFloat(monthData.spending.toFixed(2))));
    });
    
    return { 
      chartData: hoursData, 
      spendingData: spendingData,
      chartLabels 
    };
  }
  
  // Original daily grouping for periods 7 and 30
  // Generate dates based on the actual filter range (startDate to endDate)
  // Do NOT include future dates beyond the filter range
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  const filterEndDate = new Date(endDate);
  filterEndDate.setHours(23, 59, 59, 999);
  
  // Generate all days in the filter range
  while (currentDate <= filterEndDate) {
    const date = new Date(currentDate);
    chartLabels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayData = data.filter(item => {
      const itemDate = new Date(item.start_time || item.created_at);
      // Only include items that fall within this specific day
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
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
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

// Helper function to format duration with hours and minutes
const formatDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return 'N/A';
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end - start;
  
  if (diffMs < 0) return 'N/A';
  
  // Calculate total minutes
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  // Format: "Xh Ym" or just "Ym" if less than 1 hour
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return '0m';
  }
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

    if (allBookingsError) {
      console.error('📊 ANALYTICS: All bookings error:', allBookingsError);
      throw allBookingsError;
    }

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

    // Get student reviews - fetch ALL reviews (not date-filtered) to match with allBookings
    // This ensures ratings show correctly for bookings regardless of when the review was created
    const { data: allReviews, error: allReviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('student_id', studentId);

    if (allReviewsError) {
      console.error('📊 ANALYTICS: All reviews error:', allReviewsError);
      throw allReviewsError;
    }

    // Get date-filtered reviews for totalReviews metric (to match the selected period)
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('student_id', studentId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (reviewsError) {
      console.error('📊 ANALYTICS: Reviews error:', reviewsError);
      throw reviewsError;
    }

    console.log('📊 ANALYTICS: Found all reviews (for ratings):', allReviews?.length || 0);
    console.log('📊 ANALYTICS: Found date-filtered reviews (for metrics):', reviews?.length || 0);

    // Get student messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', studentId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (messagesError) {
      console.error('📊 ANALYTICS: Messages error:', messagesError);
      throw messagesError;
    }

    console.log('📊 ANALYTICS: Found messages:', messages?.length || 0);

    // Calculate metrics according to business requirements
    console.log('📊 STUDENT ANALYTICS: Calculating metrics with business rules...');
    
    // Active Bookings: confirmed bookings with future date (start_time > now)
    // AND attendance has NOT been marked (attendance_status !== 'attended')
    // These are bookings that are live and waiting for attendance to be marked
    const now = new Date();
    const activeBookings = allBookings
      ?.filter(b => {
        if (b.status !== 'confirmed') return false;
        if (!b.start_time) return false;
        // Exclude bookings where attendance has already been marked (these are completed)
        if (b.attendance_status === 'attended') return false;
        const startTime = new Date(b.start_time);
        return startTime > now; // Future date
      }) || [];

    console.log('📊 Active Bookings (confirmed future, attendance not marked):', activeBookings.length);

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

    // Total Spent: total amount from bookings where attendance was marked as 'attended'
    // AND cancelled bookings where student cancelled < 24 hours (no refund, credits count as spent)
    const attendedBookings = allBookings?.filter(b => b.attendance_status === 'attended') || [];
    console.log('📊 Attended Bookings (for total spent - credits deducted):', attendedBookings.length);

    // Filter cancelled bookings where student cancelled < 24 hours (no refund)
    console.log('📊 STUDENT ANALYTICS: Filtering cancelled bookings for spending calculation...');
    const cancelledBookingsWithNoRefund = allBookings?.filter(b => {
      if (b.status !== 'cancelled') {
        return false;
      }
      
      if (!b.cancelled_at || !b.start_time) {
        return false;
      }
      
      // Check who cancelled - if tutor cancelled, student gets refunded (don't count as spent)
      // Parse cancelled_by from notes field: "CANCELLED_BY: {user_id}"
      let cancelledBy = null;
      if (b.notes && b.notes.includes('CANCELLED_BY:')) {
        const match = b.notes.match(/CANCELLED_BY:\s*([^\s\n]+)/);
        if (match && match[1]) {
          cancelledBy = match[1];
        }
      }
      
      // If tutor cancelled, skip (student gets refunded, so credits don't count as spent)
      if (cancelledBy && String(cancelledBy) === String(b.tutor_id)) {
        console.log(`📊 STUDENT ANALYTICS: Skipping cancelled booking ${b.id} - tutor cancelled (student refunded)`);
        return false;
      }
      
      // Check if cancellation was less than 24 hours before start
      const cancelledAt = new Date(b.cancelled_at);
      const startTime = new Date(b.start_time);
      
      if (isNaN(cancelledAt.getTime()) || isNaN(startTime.getTime())) {
        return false;
      }
      
      const hoursBeforeStart = (startTime - cancelledAt) / (1000 * 60 * 60);
      
      // Credits count as spent ONLY if:
      // 1. Student cancelled (not tutor)
      // 2. AND cancelled < 24 hours before start (no refund)
      return hoursBeforeStart < 24 && hoursBeforeStart > 0 && (!cancelledBy || String(cancelledBy) === String(b.student_id));
    }) || [];

    console.log('📊 STUDENT ANALYTICS: Cancelled Bookings with No Refund (credits count as spent):', cancelledBookingsWithNoRefund.length);

    // Calculate spending from attended sessions
    const spendingFromAttended = attendedBookings
      ?.reduce((sum, b) => {
        const amount = parseFloat(b.total_amount) || 0;
        return sum + Math.max(0, amount);
      }, 0) || 0;

    // Calculate spending from cancelled bookings (no refund)
    const spendingFromCancelled = cancelledBookingsWithNoRefund
      ?.reduce((sum, b) => {
        const amount = parseFloat(b.total_amount) || 0;
        return sum + Math.max(0, amount);
      }, 0) || 0;

    const totalSpent = spendingFromAttended + spendingFromCancelled;

    console.log('📊 Total Spent (from attended sessions + cancelled <24h):', {
      fromAttended: spendingFromAttended,
      fromCancelled: spendingFromCancelled,
      total: totalSpent
    });
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

    // Recent activity with ratings (completed/confirmed bookings + cancelled bookings where student cancelled < 24h)
    // Only include cancelled bookings where student cancelled < 24 hours (no refund, credits count as spent)
    // This matches tutor analytics behavior where only cancelled bookings with funds released are shown
    const completedConfirmedBookings = allBookings
      ?.filter(booking => booking.status === 'completed' || booking.status === 'confirmed') || [];
    
    // Use the same cancelledBookingsWithNoRefund filter we created for spending calculation
    const cancelledBookingsForActivity = cancelledBookingsWithNoRefund || [];
    
    // Combine and sort by date (most recent first)
    const sortedBookings = [...completedConfirmedBookings, ...cancelledBookingsForActivity]
      .sort((a, b) => {
        // Use cancelled_at for cancelled bookings, created_at for others
        const dateA = a.status === 'cancelled' && a.cancelled_at 
          ? new Date(a.cancelled_at) 
          : new Date(a.created_at || 0);
        const dateB = b.status === 'cancelled' && b.cancelled_at 
          ? new Date(b.cancelled_at) 
          : new Date(b.created_at || 0);
        return dateB.getTime() - dateA.getTime();
      });
    
    console.log('📊 ANALYTICS: Sorted bookings for recentActivity:', {
      totalBookings: sortedBookings.length,
      latestBooking: sortedBookings[0] ? {
        id: sortedBookings[0].id,
        status: sortedBookings[0].status,
        created_at: sortedBookings[0].created_at,
        subject: sortedBookings[0].subject
      } : null
    });
    
    const recentActivity = sortedBookings
      .slice(0, 10)
      .map(booking => {
        // Find rating for this booking (use allReviews to find ratings regardless of review date)
        // Convert both IDs to strings to ensure proper comparison (handles UUID type mismatches)
        const bookingIdStr = String(booking.id || '').trim();
        const bookingReview = allReviews?.find(review => {
          const reviewBookingId = String(review.booking_id || '').trim();
          return reviewBookingId === bookingIdStr;
        });
        
        const rating = bookingReview ? bookingReview.rating : 'N/A';
        
        // Debug logging only for the first (latest) booking to help diagnose issues
        if (sortedBookings.indexOf(booking) === 0) {
          console.log('📊 ANALYTICS: Latest booking rating lookup:', {
            bookingId: bookingIdStr,
            bookingStatus: booking.status,
            bookingCreatedAt: booking.created_at,
            foundReview: !!bookingReview,
            rating: rating,
            totalReviews: allReviews?.length || 0,
            reviewBookingIds: allReviews?.slice(0, 5).map(r => ({
              id: String(r.booking_id || '').trim(),
              rating: r.rating,
              matches: String(r.booking_id || '').trim() === bookingIdStr
            }))
          });
        }
        
        // For cancelled bookings, use cancelled_at as date and show duration as 0
        const activityDate = booking.status === 'cancelled' && booking.cancelled_at
          ? booking.cancelled_at
          : booking.created_at;
        
        const activityDuration = booking.status === 'cancelled'
          ? '0 hours (cancelled)'
          : formatDuration(booking.start_time, booking.end_time);
        
        return {
          date: activityDate,
          subject: booking.subject || 'General',
          tutorName: `${booking.tutor?.first_name || ''} ${booking.tutor?.last_name || ''}`.trim() || 'Tutor',
          duration: activityDuration,
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
    
    if (allBookingsError) {
      console.error('📊 TUTOR ANALYTICS: All bookings error:', allBookingsError);
      throw allBookingsError;
    }
    
    console.log('📊 TUTOR ANALYTICS: All bookings for tutor:', { 
      allBookingsCount: allBookings?.length || 0, 
      sampleAllBooking: allBookings?.[0] 
    });
    
    // Debug: Check cancelled bookings
    const allCancelledBookings = allBookings?.filter(b => b.status === 'cancelled') || [];
    console.log('📊 TUTOR ANALYTICS: Total cancelled bookings found:', allCancelledBookings.length);
    if (allCancelledBookings.length > 0) {
      console.log('📊 TUTOR ANALYTICS: Sample cancelled booking:', {
        id: allCancelledBookings[0].id,
        status: allCancelledBookings[0].status,
        cancelled_at: allCancelledBookings[0].cancelled_at,
        start_time: allCancelledBookings[0].start_time,
        student_id: allCancelledBookings[0].student_id,
        hasStudent: !!allCancelledBookings[0].student
      });
    }
    
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
    
    if (allConfirmedError) {
      console.error('📊 TUTOR ANALYTICS: All confirmed bookings error:', allConfirmedError);
      throw allConfirmedError;
    }
    
    console.log('📊 TUTOR ANALYTICS: All confirmed bookings:', { 
      allConfirmedCount: allConfirmedBookings?.length || 0, 
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

    // Get tutor's reviews (ALL reviews, not just date-filtered, for average rating)
    // Average rating should be from all reviews the tutor has received
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('tutor_id', tutorId);

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

    // Total Students: Count unique students ONLY from bookings where attendance was marked as 'attended'
    // Cancelled bookings (even with funds released) should NOT count as students taught
    // Only students from completed sessions count
    const attendedBookingsForStudents = allBookings?.filter(b => b.attendance_status === 'attended') || [];
    const totalStudents = new Set(attendedBookingsForStudents.map(b => b.student_id)).size || 0;
    
    console.log('📊 TUTOR ANALYTICS: Total Students (from attended sessions only):', totalStudents);

    // Hours This Month: Only from bookings where attendance was marked as 'attended'
    // AND the session start_time is in current month
    // Only sessions where attendance was marked count towards hours
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    currentMonthStart.setHours(0, 0, 0, 0);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    currentMonthEnd.setHours(23, 59, 59, 999);

    console.log('📊 TUTOR ANALYTICS: Current month range:', {
      start: currentMonthStart.toISOString(),
      end: currentMonthEnd.toISOString()
    });

    const bookingsWithAttendanceThisMonth = allBookings
      ?.filter(b => {
        // Must have attendance marked as 'attended'
        if (b.attendance_status !== 'attended') {
          return false;
        }
        // Must have start_time to check the month
        if (!b.start_time) {
          return false;
        }
        // Check if the session START TIME is in the current month
        const sessionStart = new Date(b.start_time);
        return sessionStart >= currentMonthStart && sessionStart <= currentMonthEnd;
      }) || [];

    console.log('📊 TUTOR ANALYTICS: Bookings with attendance this month:', bookingsWithAttendanceThisMonth.length);

    const totalHours = bookingsWithAttendanceThisMonth
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

    console.log('📊 TUTOR ANALYTICS: Total Hours This Month (from attended sessions):', totalHours);

    // Earnings: From bookings where attendance was marked as 'attended' AND cancelled bookings where funds were released
    // For cancelled bookings: funds are released to tutor when student cancels < 24 hours before start
    const attendedBookings = allBookings?.filter(b => b.attendance_status === 'attended') || [];
    console.log('📊 TUTOR ANALYTICS: Attended Bookings (for earnings):', attendedBookings.length);

    // Calculate earnings from attended sessions
    const earningsFromAttended = attendedBookings
      ?.reduce((sum, b) => {
        const amount = parseFloat(b.total_amount) || 0;
        // Ensure earnings is never negative
        return sum + Math.max(0, amount);
      }, 0) || 0;

    // Calculate earnings from cancelled bookings where funds were released to tutor
    // Funds are released when: student cancels < 24 hours before start_time
    // According to cancellation logic:
    // - If tutor cancels: student always gets refunded (no funds to tutor)
    // - If student cancels < 24 hours: tutor gets 100% funds (no refund to student)
    // - If student cancels >= 24 hours: student gets refunded (no funds to tutor)
    // Since we can't determine who cancelled from booking data alone, we use a heuristic:
    // If cancelled < 24 hours before start, it's likely a student cancellation (funds released)
    // If cancelled >= 24 hours, it's likely either student or tutor cancellation (no funds released)
    console.log('📊 TUTOR ANALYTICS: Filtering cancelled bookings for funds released...');
    const allCancelled = allBookings?.filter(b => b.status === 'cancelled') || [];
    console.log('📊 TUTOR ANALYTICS: All cancelled bookings:', allCancelled.length);
    
    const cancelledBookingsWithFunds = allBookings?.filter(b => {
      if (b.status !== 'cancelled') {
        return false;
      }
      
      if (!b.cancelled_at) {
        console.log(`📊 TUTOR ANALYTICS: Skipping cancelled booking ${b.id} - no cancelled_at timestamp`);
        return false;
      }
      
      if (!b.start_time) {
        console.log(`📊 TUTOR ANALYTICS: Skipping cancelled booking ${b.id} - no start_time`);
        return false;
      }
      
      // Check who cancelled - if tutor cancelled, NO funds are released (student always refunded)
      // Parse cancelled_by from notes field: "CANCELLED_BY: {user_id}"
      let cancelledBy = null;
      if (b.notes && b.notes.includes('CANCELLED_BY:')) {
        const match = b.notes.match(/CANCELLED_BY:\s*([^\s\n]+)/);
        if (match && match[1]) {
          cancelledBy = match[1];
        }
      }
      
      // If tutor cancelled, skip (no funds released to tutor)
      if (cancelledBy && String(cancelledBy) === String(b.tutor_id)) {
        console.log(`📊 TUTOR ANALYTICS: Skipping cancelled booking ${b.id} - tutor cancelled (no funds released)`);
        return false;
      }
      
      // Check if cancellation was less than 24 hours before start
      const cancelledAt = new Date(b.cancelled_at);
      const startTime = new Date(b.start_time);
      
      // Check if dates are valid
      if (isNaN(cancelledAt.getTime())) {
        console.log(`📊 TUTOR ANALYTICS: Skipping cancelled booking ${b.id} - invalid cancelled_at: ${b.cancelled_at}`);
        return false;
      }
      
      if (isNaN(startTime.getTime())) {
        console.log(`📊 TUTOR ANALYTICS: Skipping cancelled booking ${b.id} - invalid start_time: ${b.start_time}`);
        return false;
      }
      
      const hoursBeforeStart = (startTime - cancelledAt) / (1000 * 60 * 60);
      
      console.log(`📊 TUTOR ANALYTICS: Checking cancelled booking ${b.id}:`, {
        cancelled_at: b.cancelled_at,
        start_time: b.start_time,
        hoursBeforeStart: hoursBeforeStart.toFixed(2),
        cancelledBy: cancelledBy || 'unknown',
        isTutorCancellation: cancelledBy && String(cancelledBy) === String(b.tutor_id),
        meetsCriteria: hoursBeforeStart < 24 && hoursBeforeStart > 0 && (!cancelledBy || String(cancelledBy) !== String(b.tutor_id))
      });
      
      // Funds are released ONLY if:
      // 1. Student cancelled (not tutor)
      // 2. AND cancelled < 24 hours before start
      // This matches the cancellation endpoint logic: student cancels < 24h = tutor gets funds
      return hoursBeforeStart < 24 && hoursBeforeStart > 0 && (!cancelledBy || String(cancelledBy) !== String(b.tutor_id));
    }) || [];

    console.log('📊 TUTOR ANALYTICS: Cancelled Bookings with Funds Released:', cancelledBookingsWithFunds.length);

    const earningsFromCancelled = cancelledBookingsWithFunds
      ?.reduce((sum, b) => {
        const amount = parseFloat(b.total_amount) || 0;
        // Ensure earnings is never negative
        return sum + Math.max(0, amount);
      }, 0) || 0;

    // Detailed logging for cancelled bookings with funds released
    if (cancelledBookingsWithFunds.length > 0) {
      console.log('📊 TUTOR ANALYTICS: Detailed <24h Cancellation Log:');
      console.log('='.repeat(80));
      cancelledBookingsWithFunds.forEach((b, index) => {
        const cancelledAt = new Date(b.cancelled_at);
        const startTime = new Date(b.start_time);
        const hoursBeforeStart = (startTime - cancelledAt) / (1000 * 60 * 60);
        const studentName = b.student 
          ? `${b.student.first_name || ''} ${b.student.last_name || ''}`.trim() 
          : 'Unknown Student';
        const amount = parseFloat(b.total_amount) || 0;
        
        // Format date for display
        const cancelledDateStr = cancelledAt.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        console.log(`  [${index + 1}] Cancellation Details:`);
        console.log(`      Date of Cancellation: ${cancelledDateStr} (${cancelledAt.toISOString()})`);
        console.log(`      Subject: ${b.subject || 'N/A'}`);
        console.log(`      Student: ${studentName} (ID: ${b.student_id})`);
        console.log(`      Duration: 0 hours (cancelled)`);
        console.log(`      Earnings: $${amount.toFixed(2)}`);
        console.log(`      Hours Before Start: ${hoursBeforeStart.toFixed(2)} hours`);
        console.log(`      Booking ID: ${b.id}`);
        console.log('-'.repeat(80));
      });
      console.log('='.repeat(80));
      console.log(`📊 Total Cancelled Bookings with Funds Released: ${cancelledBookingsWithFunds.length}`);
      console.log(`📊 Total Earnings from Cancellations: $${earningsFromCancelled.toFixed(2)}`);
    }

    const totalEarnings = earningsFromAttended + earningsFromCancelled;

    console.log('📊 TUTOR ANALYTICS: Total Earnings (from attended + cancelled with funds):', {
      fromAttended: earningsFromAttended,
      fromCancelled: earningsFromCancelled,
      total: totalEarnings
    });
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

    // Calculate previous period earnings: include attended sessions + cancelled with funds
    const prevAttendedBookings = prevBookings?.filter(b => b.attendance_status === 'attended') || [];
    const prevEarningsFromAttended = prevAttendedBookings
      ?.reduce((sum, b) => {
        const amount = parseFloat(b.total_amount) || 0;
        return sum + Math.max(0, amount);
      }, 0) || 0;
    
    // Also include cancelled bookings with funds released from previous period
    const prevCancelledWithFunds = prevBookings?.filter(b => {
      if (b.status !== 'cancelled' || !b.cancelled_at || !b.start_time) {
        return false;
      }
      const cancelledAt = new Date(b.cancelled_at);
      const startTime = new Date(b.start_time);
      const hoursBeforeStart = (startTime - cancelledAt) / (1000 * 60 * 60);
      return hoursBeforeStart < 24 && hoursBeforeStart > 0;
    }) || [];
    
    const prevEarningsFromCancelled = prevCancelledWithFunds
      ?.reduce((sum, b) => {
        const amount = parseFloat(b.total_amount) || 0;
        return sum + Math.max(0, amount);
      }, 0) || 0;
    
    const prevEarnings = prevEarningsFromAttended + prevEarningsFromCancelled;

    const earningsChange = calculateGrowth(totalEarnings, prevEarnings);
    const bookingsChange = calculateGrowth(totalBookings, prevBookings?.length || 0);
    
    // Calculate previous period students: only from attended sessions (not cancelled)
    const prevAttendedBookingsForStudents = prevBookings?.filter(b => b.attendance_status === 'attended') || [];
    const prevStudentsCount = new Set(prevAttendedBookingsForStudents.map(b => b.student_id)).size || 0;
    const studentsChange = calculateGrowth(totalStudents, prevStudentsCount);

    // Chart data - use all confirmed bookings for earnings, date-filtered for hours
    console.log('📊 TUTOR ANALYTICS: Generating chart data with:', {
      allConfirmedBookingsCount: allConfirmedBookings?.length || 0,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      period,
      sampleBooking: allConfirmedBookings?.[0]
    });
    
    // Earnings chart data generation
    const earningsData = [];
    const earningsLabels = [];
    const periodInt = parseInt(period);
    
    // For periods 90 and 365, group by month
    if (periodInt === 90 || periodInt === 365) {
      // Group by month
      const monthMap = new Map();
      
      // Process attended bookings within date range
      attendedBookings?.forEach(booking => {
        if (!booking.start_time) return;
        
        const bookingDate = new Date(booking.start_time);
        // Only include bookings within the date range
        if (bookingDate < startDate || bookingDate > endDate) return;
        
        const monthKey = `${bookingDate.getFullYear()}-${bookingDate.getMonth()}`;
        
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, {
            month: bookingDate.getMonth(),
            year: bookingDate.getFullYear(),
            earnings: 0
          });
        }
        
        const monthData = monthMap.get(monthKey);
        const amount = parseFloat(booking.total_amount) || 0;
        monthData.earnings += Math.max(0, amount);
      });
      
      // Also process cancelled bookings with funds released (student cancelled < 24h)
      cancelledBookingsWithFunds?.forEach(booking => {
        if (!booking.start_time) return;
        
        const bookingDate = new Date(booking.start_time);
        // Only include bookings within the date range
        if (bookingDate < startDate || bookingDate > endDate) return;
        
        const monthKey = `${bookingDate.getFullYear()}-${bookingDate.getMonth()}`;
        
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, {
            month: bookingDate.getMonth(),
            year: bookingDate.getFullYear(),
            earnings: 0
          });
        }
        
        const monthData = monthMap.get(monthKey);
        const amount = parseFloat(booking.total_amount) || 0;
        monthData.earnings += Math.max(0, amount);
      });
      
      // Get all months within the date range
      const months = [];
      const currentDate = new Date(startDate);
      currentDate.setDate(1); // Start of month
      currentDate.setHours(0, 0, 0, 0);
      
      while (currentDate <= endDate) {
        const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
        months.push({
          key: monthKey,
          date: new Date(currentDate),
          month: currentDate.getMonth(),
          year: currentDate.getFullYear()
        });
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      // Generate labels and data for each month
      months.forEach(({ date, month, year }) => {
        const monthKey = `${year}-${month}`;
        const monthData = monthMap.get(monthKey) || { earnings: 0 };
        
        earningsLabels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
        earningsData.push(Math.max(0, parseFloat(monthData.earnings.toFixed(2))));
      });
    } else {
      // Original daily grouping for periods 7 and 30
      // Generate dates based on the actual filter range (startDate to endDate)
      // Do NOT include future dates beyond the filter range
      const currentDate = new Date(startDate);
      currentDate.setHours(0, 0, 0, 0);
      const filterEndDate = new Date(endDate);
      filterEndDate.setHours(23, 59, 59, 999);
      
      // Generate all days in the filter range
      while (currentDate <= filterEndDate) {
        const date = new Date(currentDate);
        earningsLabels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        
        // Chart earnings: From attended sessions + cancelled bookings with funds released
        // This ensures chart data matches the main earnings metric
        const dayEarningsFromAttended = attendedBookings
          ?.filter(booking => {
            if (!booking.start_time) return false;
            const bookingDate = new Date(booking.start_time);
            return bookingDate >= dayStart && bookingDate <= dayEnd;
          })
          ?.reduce((sum, booking) => {
            const amount = parseFloat(booking.total_amount) || 0;
            return sum + Math.max(0, amount);
          }, 0) || 0;
        
        const dayEarningsFromCancelled = cancelledBookingsWithFunds
          ?.filter(booking => {
            if (!booking.start_time) return false;
            const bookingDate = new Date(booking.start_time);
            return bookingDate >= dayStart && bookingDate <= dayEnd;
          })
          ?.reduce((sum, booking) => {
            const amount = parseFloat(booking.total_amount) || 0;
            return sum + Math.max(0, amount);
          }, 0) || 0;
        
        const dayEarnings = dayEarningsFromAttended + dayEarningsFromCancelled;
        
        // Ensure final earnings value is non-negative
        earningsData.push(Math.max(0, parseFloat(dayEarnings.toFixed(2))));
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    console.log('📊 TUTOR ANALYTICS: Simple earnings data generated:', {
      earningsDataLength: earningsData.length,
      earningsLabelsLength: earningsLabels.length,
      nonZeroDays: earningsData.filter(d => d > 0).length,
      sampleEarnings: earningsData.slice(0, 5),
      sampleLabels: earningsLabels.slice(0, 5)
    });
    
    const { chartData, spendingData, chartLabels } = generateChartData(allConfirmedBookings || [], startDate, endDate, period);

    // Recent activity: Include completed/confirmed bookings AND cancelled bookings with funds released
    // Combine both types and sort by date (cancelled_at for cancelled, created_at for others)
    const completedConfirmedActivities = allConfirmedBookings
      ?.filter(booking => booking.status === 'completed' || booking.status === 'confirmed')
      ?.map(booking => ({
        date: booking.created_at,
        subject: booking.subject || 'General',
        studentName: `${booking.student?.first_name || ''} ${booking.student?.last_name || ''}`.trim() || 'Student',
        duration: formatDuration(booking.start_time, booking.end_time),
        earnings: Math.max(0, parseFloat(booking.total_amount || 0)),
        status: booking.status,
        sortDate: new Date(booking.created_at || 0)
      })) || [];
    
    // Include cancelled bookings with funds released (student cancelled <24hr)
    const cancelledActivities = cancelledBookingsWithFunds
      ?.map(booking => {
        const cancelledAt = booking.cancelled_at || booking.created_at;
        const studentName = booking.student 
          ? `${booking.student.first_name || ''} ${booking.student.last_name || ''}`.trim() 
          : 'Unknown Student';
        return {
          date: cancelledAt,
          subject: booking.subject || 'General',
          studentName: studentName,
          duration: '0 hours (cancelled)',
          earnings: Math.max(0, parseFloat(booking.total_amount || 0)),
          status: 'cancelled',
          sortDate: new Date(cancelledAt || 0)
        };
      }) || [];
    
    // Combine and sort by date (most recent first)
    const allActivities = [...completedConfirmedActivities, ...cancelledActivities]
      .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())
      .slice(0, 10)
      .map(({ sortDate, ...rest }) => rest); // Remove sortDate before returning
    
    const recentActivity = allActivities;

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