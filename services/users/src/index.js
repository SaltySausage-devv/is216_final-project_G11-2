const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
// Load environment variables (optional for Railway deployment)
try {
  require('dotenv').config({ path: '../../.env' });
} catch (error) {
  console.log('⚠️ Could not load .env file, using system environment variables');
}

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize Supabase client
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
const updateProfileSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  phone: Joi.string().allow(null, '').optional(),
  dateOfBirth: Joi.any().optional(), // Allow any value, we'll handle conversion in update logic
  address: Joi.string().allow(null, '').max(1000).optional(),
  bio: Joi.string().allow(null, '').max(500).optional()
});

// Routes
app.get('/users/profile', verifyToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.userId)
      .single();

    if (error) {
      throw error;
    }

    // Remove sensitive data
    delete user.password;

    res.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/users/profile', verifyToken, async (req, res) => {
  try {
    // Normalize empty strings to null before validation
    const normalizedBody = { ...req.body };
    if (normalizedBody.dateOfBirth === '') normalizedBody.dateOfBirth = null;
    if (normalizedBody.address === '') normalizedBody.address = null;
    if (normalizedBody.bio === '') normalizedBody.bio = null;
    if (normalizedBody.phone === '') normalizedBody.phone = null;

    const { error, value } = updateProfileSchema.validate(normalizedBody);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Build update object, converting empty strings to null for optional fields
    const updateData = {
      updated_at: new Date().toISOString()
    };

    // Only include fields that are provided
    if (value.firstName !== undefined) {
      updateData.first_name = value.firstName;
    }
    if (value.lastName !== undefined) {
      updateData.last_name = value.lastName;
    }
    if (value.phone !== undefined) {
      updateData.phone = value.phone === '' ? null : value.phone;
    }
    if (value.dateOfBirth !== undefined) {
      // Convert empty string, null, or invalid dates to null
      const dobValue = value.dateOfBirth;
      // Check if it's empty, null, or whitespace-only string
      const isEmpty = !dobValue || 
                      dobValue === '' || 
                      dobValue === null || 
                      (typeof dobValue === 'string' && dobValue.trim() === '');
      
      if (isEmpty) {
        updateData.date_of_birth = null;
      } else {
        // If it's a valid date string or Date object, use it
        try {
          const dateValue = new Date(dobValue);
          if (isNaN(dateValue.getTime())) {
            updateData.date_of_birth = null;
          } else {
            // Format as YYYY-MM-DD for PostgreSQL
            const year = dateValue.getFullYear();
            const month = String(dateValue.getMonth() + 1).padStart(2, '0');
            const day = String(dateValue.getDate()).padStart(2, '0');
            updateData.date_of_birth = `${year}-${month}-${day}`;
          }
        } catch (e) {
          // If date parsing fails, set to null
          console.warn('Invalid date format for dateOfBirth:', dobValue, e);
          updateData.date_of_birth = null;
        }
      }
    }
    if (value.address !== undefined) {
      updateData.address = value.address === '' ? null : value.address;
    }
    if (value.bio !== undefined) {
      updateData.bio = value.bio === '' ? null : value.bio;
    }

    const { data: user, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.user.userId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Remove sensitive data
    delete user.password;

    res.json({ 
      message: 'Profile updated successfully',
      user 
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/users/students', verifyToken, async (req, res) => {
  try {
    const { data: students, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, phone, created_at')
      .eq('user_type', 'student')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({ students });
  } catch (error) {
    console.error('Students fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/users/tutors', verifyToken, async (req, res) => {
  try {
    const { data: tutors, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, phone, created_at')
      .eq('user_type', 'tutor')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({ tutors });
  } catch (error) {
    console.error('Tutors fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/users/centres', verifyToken, async (req, res) => {
  try {
    const { data: centres, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, phone, created_at')
      .eq('user_type', 'centre')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({ centres });
  } catch (error) {
    console.error('Centres fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/users/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Only allow users to delete their own account or admin operations
    if (req.user.userId !== parseInt(id) && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'users' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Users service running on port ${PORT}`);
});
