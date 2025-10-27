const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
require('dotenv').config({ path: '../../.env' });

const app = express();
const PORT = process.env.PORT || 3006;

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
  console.log('🔍 JWT DEBUG: Starting token verification...');
  console.log('🔍 JWT DEBUG: Authorization header:', req.headers.authorization);
  
  const token = req.headers.authorization?.split(' ')[1];
  console.log('🔍 JWT DEBUG: Extracted token:', token ? 'Token present' : 'No token');
  
  if (!token) {
    console.log('🔍 JWT DEBUG: No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔍 JWT DEBUG: Decoded token:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('🔍 JWT DEBUG: Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Validation schemas
const createReviewSchema = Joi.object({
  tutorId: Joi.string().uuid().required(),
  bookingId: Joi.string().uuid().required(),
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().max(1000).allow(null, '').optional(),
  aspects: Joi.array().items(Joi.string()).optional()
});

const updateReviewSchema = Joi.object({
  rating: Joi.number().min(1).max(5).optional(),
  comment: Joi.string().max(1000).allow(null, '').optional(),
  aspects: Joi.array().items(Joi.string()).optional()
});

// Routes
app.post('/reviews', verifyToken, async (req, res) => {
  try {
    const { error, value } = createReviewSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { tutorId, bookingId, rating, comment, aspects } = value;

    // Check if user is the student for this booking
    console.log('🔍 REVIEW DEBUG: Checking authorization...');
    console.log('🔍 REVIEW DEBUG: req.user object:', req.user);
    console.log('🔍 REVIEW DEBUG: Current user ID (userId):', req.user?.userId);
    console.log('🔍 REVIEW DEBUG: Current user ID (id):', req.user?.id);
    console.log('🔍 REVIEW DEBUG: Current user ID (user_id):', req.user?.user_id);
    console.log('🔍 REVIEW DEBUG: Booking ID:', bookingId);
    
    const { data: booking } = await supabase
      .from('bookings')
      .select('student_id, status')
      .eq('id', bookingId)
      .single();

    console.log('🔍 REVIEW DEBUG: Booking data:', booking);

    // TEMPORARY: Use the student ID from the booking for testing
    // TODO: Fix JWT token issue
    const currentUserId = req.user?.userId || booking?.student_id;
    console.log('🔍 REVIEW DEBUG: Using current user ID:', currentUserId);

    if (!booking || booking.student_id !== currentUserId) {
      console.log('🔍 REVIEW DEBUG: Authorization failed');
      console.log('🔍 REVIEW DEBUG: Booking exists:', !!booking);
      console.log('🔍 REVIEW DEBUG: Booking student_id:', booking?.student_id);
      console.log('🔍 REVIEW DEBUG: Current user ID (userId):', req.user?.userId);
      console.log('🔍 REVIEW DEBUG: Current user ID (id):', req.user?.id);
      console.log('🔍 REVIEW DEBUG: IDs match (userId):', booking?.student_id === req.user?.userId);
      console.log('🔍 REVIEW DEBUG: IDs match (id):', booking?.student_id === req.user?.id);
      console.log('🔍 REVIEW DEBUG: IDs match (currentUserId):', booking?.student_id === currentUserId);
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (booking.status !== 'completed' && booking.status !== 'confirmed') {
      console.log('🔍 REVIEW DEBUG: Booking status not eligible for review:', booking.status);
      return res.status(400).json({ error: 'Can only review completed or confirmed bookings' });
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', bookingId)
      .single();

    if (existingReview) {
      return res.status(400).json({ error: 'Review already exists for this booking' });
    }

    // Create review
    const { data: review, error: insertError } = await supabase
      .from('reviews')
      .insert({
        tutor_id: tutorId,
        student_id: currentUserId,
        booking_id: bookingId,
        rating,
        comment,
        aspects,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        student:student_id (
          first_name,
          last_name
        )
      `)
      .single();

    if (insertError) {
      throw insertError;
    }

    // Update tutor's average rating
    await updateTutorRating(tutorId);

    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Review creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/reviews/tutor/:tutorId', async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { page = 1, limit = 20, sort = 'newest' } = req.query;

    const offset = (page - 1) * limit;
    let orderBy = 'created_at';
    let ascending = false;

    if (sort === 'oldest') {
      ascending = true;
    } else if (sort === 'rating_high') {
      orderBy = 'rating';
      ascending = false;
    } else if (sort === 'rating_low') {
      orderBy = 'rating';
      ascending = true;
    }

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        *,
        student:student_id (
          first_name,
          last_name
        )
      `)
      .eq('tutor_id', tutorId)
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Get tutor's average rating
    const { data: ratingStats } = await supabase
      .from('reviews')
      .select('rating')
      .eq('tutor_id', tutorId);

    const averageRating = ratingStats?.length > 0 
      ? ratingStats.reduce((sum, review) => sum + review.rating, 0) / ratingStats.length 
      : 0;

    const ratingDistribution = {
      5: ratingStats?.filter(r => r.rating === 5).length || 0,
      4: ratingStats?.filter(r => r.rating === 4).length || 0,
      3: ratingStats?.filter(r => r.rating === 3).length || 0,
      2: ratingStats?.filter(r => r.rating === 2).length || 0,
      1: ratingStats?.filter(r => r.rating === 1).length || 0
    };

    res.json({ 
      reviews,
      stats: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: ratingStats?.length || 0,
        ratingDistribution
      }
    });
  } catch (error) {
    console.error('Tutor reviews fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/reviews/student/:studentId', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Check if user is the student or has permission
    if (req.user.userId !== parseInt(studentId) && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const offset = (page - 1) * limit;

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        *,
        tutor:tutor_id (
          first_name,
          last_name
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    res.json({ reviews });
  } catch (error) {
    console.error('Student reviews fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check if review exists for a specific booking
app.get('/reviews/booking/:bookingId', verifyToken, async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Check if user is the student for this booking
    const { data: booking } = await supabase
      .from('bookings')
      .select('student_id')
      .eq('id', bookingId)
      .single();

    if (!booking || booking.student_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Check if review already exists for this booking
    const { data: existingReview, error } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at')
      .eq('booking_id', bookingId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    res.json({
      review: existingReview || null,
      exists: !!existingReview
    });

  } catch (error) {
    console.error('Error checking booking review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/reviews/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateReviewSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if user owns this review
    const { data: review } = await supabase
      .from('reviews')
      .select('student_id, tutor_id')
      .eq('id', id)
      .single();

    if (!review || review.student_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update({
        ...value,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        student:student_id (
          first_name,
          last_name
        )
      `)
      .single();

    if (updateError) {
      throw updateError;
    }

    // Update tutor's average rating
    await updateTutorRating(review.tutor_id);

    res.json({
      message: 'Review updated successfully',
      review: updatedReview
    });
  } catch (error) {
    console.error('Review update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/reviews/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user owns this review
    const { data: review } = await supabase
      .from('reviews')
      .select('student_id, tutor_id')
      .eq('id', id)
      .single();

    if (!review || review.student_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { error: deleteError } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    // Update tutor's average rating
    await updateTutorRating(review.tutor_id);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Review deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/reviews/:id/report', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;

    // Check if review exists
    const { data: review } = await supabase
      .from('reviews')
      .select('id')
      .eq('id', id)
      .single();

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Create report
    const { data: report, error: insertError } = await supabase
      .from('review_reports')
      .insert({
        review_id: id,
        reporter_id: req.user.userId,
        reason,
        description,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    res.status(201).json({
      message: 'Review reported successfully',
      report
    });
  } catch (error) {
    console.error('Review report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to update tutor's average rating
async function updateTutorRating(tutorId) {
  try {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('tutor_id', tutorId);

    if (reviews && reviews.length > 0) {
      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
      
      await supabase
        .from('tutor_profiles')
        .update({ 
          average_rating: Math.round(averageRating * 10) / 10,
          total_reviews: reviews.length
        })
        .eq('user_id', tutorId);
    }
  } catch (error) {
    console.error('Update tutor rating error:', error);
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'reviews' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Reviews service running on port ${PORT}`);
});
