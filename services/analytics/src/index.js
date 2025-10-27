const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const Joi = require('joi');
require('dotenv').config({ path: '../../.env' });

const app = express();
const PORT = process.env.PORT || 3015;

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

// JWT verification middleware - following the same pattern as other services
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
  const chartData = [];
  const chartLabels = [];
  
  const days = parseInt(period);
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    chartLabels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayData = data.filter(item => {
      const itemDate = new Date(item.created_at);
      return itemDate >= dayStart && itemDate <= dayEnd;
    });
    
    chartData.push(dayData.length);
  }
  
  return { chartData, chartLabels };
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
    
    // Check if user is the student or admin
    if (req.user.userId !== studentId && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { startDate, endDate } = getDateRange(period);

    // Get student bookings with tutor info
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
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (bookingsError) throw bookingsError;

    // Get student reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('student_id', studentId)
      .gte('created_at', startDate.toISOString());

    // Get student messages
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', studentId)
      .gte('created_at', startDate.toISOString());

    // Calculate metrics
    const totalSessions = bookings?.length || 0;
    const completedSessions = bookings?.filter(b => b.status === 'completed').length || 0;
    const cancelledSessions = bookings?.filter(b => b.status === 'cancelled').length || 0;
    const pendingSessions = bookings?.filter(b => b.status === 'pending').length || 0;

    const totalHours = bookings?.reduce((sum, b) => {
      if (b.start_time && b.end_time) {
        const start = new Date(b.start_time);
        const end = new Date(b.end_time);
        return sum + (end - start) / (1000 * 60 * 60);
      }
      return sum;
    }, 0) || 0;

    const totalSpent = bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
    const tutorsWorkedWith = new Set(bookings?.map(b => b.tutor_id)).size || 0;
    const totalReviews = reviews?.length || 0;
    const totalMessages = messages?.length || 0;

    // Subject distribution from bookings
    const subjectCounts = {};
    bookings?.forEach(booking => {
      const subject = booking.subject || 'General';
      subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
    });

    const subjectDistribution = Object.entries(subjectCounts)
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count);

    // Growth metrics (compare with previous period)
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - parseInt(period));

    const { data: prevBookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('student_id', studentId)
      .gte('created_at', prevStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    const prevSessions = prevBookings?.length || 0;
    const prevHours = prevBookings?.reduce((sum, b) => {
      if (b.start_time && b.end_time) {
        const start = new Date(b.start_time);
        const end = new Date(b.end_time);
        return sum + (end - start) / (1000 * 60 * 60);
      }
      return sum;
    }, 0) || 0;

    const sessionsChange = calculateGrowth(totalSessions, prevSessions);
    const hoursChange = calculateGrowth(totalHours, prevHours);

    // Chart data
    const { chartData, chartLabels } = generateChartData(bookings || [], startDate, endDate, period);

    // Recent activity
    const recentActivity = bookings?.slice(0, 10).map(booking => ({
      date: booking.created_at,
      subject: booking.subject || 'General',
      tutorName: `${booking.tutor?.first_name || ''} ${booking.tutor?.last_name || ''}`.trim() || 'Tutor',
      duration: booking.start_time && booking.end_time ? 
        ((new Date(booking.end_time) - new Date(booking.start_time)) / (1000 * 60 * 60)).toFixed(1) + 'h' : 'N/A',
      cost: `$${booking.total_amount || 0}`,
      status: booking.status
    })) || [];

    res.json({
      success: true,
      data: {
        totalSessions,
        completedSessions,
        cancelledSessions,
        pendingSessions,
        totalHours: totalHours.toFixed(1),
        totalSpent: totalSpent.toFixed(2),
        tutorsWorkedWith,
        totalReviews,
        totalMessages,
        subjectDistribution,
        sessionsChange: parseFloat(sessionsChange),
        hoursChange: parseFloat(hoursChange),
        chartData,
        chartLabels,
        recentActivity
      }
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
    
    // Check if user is the tutor or admin
    if (req.user.userId !== tutorId && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { startDate, endDate } = getDateRange(period);

    // Get tutor's bookings with student info
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
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (bookingsError) throw bookingsError;

    // Get tutor's reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('tutor_id', tutorId)
      .gte('created_at', startDate.toISOString());

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

    const totalEarnings = bookings
      ?.filter(b => b.status === 'completed')
      ?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

    const totalHours = bookings
      ?.filter(b => b.status === 'completed')
      ?.reduce((sum, b) => {
        if (b.start_time && b.end_time) {
          const start = new Date(b.start_time);
          const end = new Date(b.end_time);
          return sum + (end - start) / (1000 * 60 * 60);
        }
        return sum;
      }, 0) || 0;

    const totalStudents = new Set(bookings?.map(b => b.student_id)).size || 0;
    const averageRating = reviews?.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    // Subject distribution from profile
    const subjectDistribution = (profile?.subjects || []).map(subject => ({
      subject,
      count: bookings?.filter(b => b.subject === subject).length || 0
    })).sort((a, b) => b.count - a.count);

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
      ?.filter(b => b.status === 'completed')
      ?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

    const earningsChange = calculateGrowth(totalEarnings, prevEarnings);
    const bookingsChange = calculateGrowth(totalBookings, prevBookings?.length || 0);
    const studentsChange = calculateGrowth(totalStudents, new Set(prevBookings?.map(b => b.student_id)).size || 0);

    // Chart data
    const { chartData, chartLabels } = generateChartData(bookings || [], startDate, endDate, period);

    // Recent activity
    const recentActivity = bookings?.slice(0, 10).map(booking => ({
      date: booking.created_at,
      subject: booking.subject || 'General',
      studentName: `${booking.student?.first_name || ''} ${booking.student?.last_name || ''}`.trim() || 'Student',
      duration: booking.start_time && booking.end_time ? 
        ((new Date(booking.end_time) - new Date(booking.start_time)) / (1000 * 60 * 60)).toFixed(1) + 'h' : 'N/A',
      earnings: `$${booking.total_amount || 0}`,
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
        earningsChange: parseFloat(earningsChange),
        bookingsChange: parseFloat(bookingsChange),
        studentsChange: parseFloat(studentsChange),
        chartData,
        chartLabels,
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
      ?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

    const totalHours = bookings
      ?.filter(b => b.status === 'completed')
      ?.reduce((sum, b) => {
        if (b.start_time && b.end_time) {
          const start = new Date(b.start_time);
          const end = new Date(b.end_time);
          return sum + (end - start) / (1000 * 60 * 60);
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
      ?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

    const revenueChange = calculateGrowth(totalRevenue, prevRevenue);
    const bookingsChange = calculateGrowth(totalBookings, prevBookings?.length || 0);
    const studentsChange = calculateGrowth(totalStudents, new Set(prevBookings?.map(b => b.student_id)).size || 0);

    // Chart data
    const { chartData, chartLabels } = generateChartData(bookings || [], startDate, endDate, period);

    // Recent activity
    const recentActivity = bookings?.slice(0, 10).map(booking => {
      const tutor = tutors?.find(t => t.user_id === booking.tutor_id);
      return {
        date: booking.created_at,
        tutorName: `${tutor?.first_name || ''} ${tutor?.last_name || ''}`.trim() || 'Tutor',
        subject: booking.subject || 'General',
        students: 1,
        revenue: `$${booking.total_amount || 0}`,
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
    const { chartData, chartLabels } = generateChartData(bookings || [], startDate, endDate, period);

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
  res.json({ status: 'OK', service: 'analytics', timestamp: new Date().toISOString() });
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
app.listen(PORT, () => {
  console.log(`🚀 Analytics service running on port ${PORT}`);
  console.log(`📊 Supabase connected: ${process.env.SUPABASE_URL ? 'Yes' : 'No'}`);
});

module.exports = app;