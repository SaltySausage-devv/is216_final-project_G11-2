const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const multer = require('multer');
// Load environment variables (optional for Railway deployment)
try {
  require('dotenv').config({ path: '../../.env' });
} catch (error) {
  console.log('⚠️ Could not load .env file, using system environment variables');
}

const app = express();
const PORT = process.env.PORT || 3003;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

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

// Handle all OPTIONS requests explicitly
app.options('*', cors());

// JWT verification middleware
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    console.log('🔑 Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Handle both Supabase tokens (uses 'sub') and custom tokens (uses 'userId')
    const userId = decoded.sub || decoded.userId;

    console.log('✅ Token verified successfully');
    console.log('   User ID:', userId);

    // Fetch user type from database for Supabase tokens
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      console.error('❌ Failed to fetch user profile:', profileError);
      return res.status(403).json({ error: 'User profile not found' });
    }

    const userType = userProfile.user_type;
    console.log('   User Type:', userType);

    req.user = {
      userId,
      userType,
      ...decoded
    };
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Validation schemas
const tutorProfileSchema = Joi.object({
  headline: Joi.string().max(200).allow('').optional(),
  bio: Joi.string().max(2000).allow('').optional(),
  teachingPhilosophy: Joi.string().max(1000).allow('').optional(),
  subjects: Joi.array().items(Joi.string()).optional(),
  levels: Joi.array().items(Joi.string().valid('Primary', 'Secondary', 'JC', 'IB', 'IGCSE')).optional(),
  languages: Joi.array().items(Joi.string()).optional(),
  qualifications: Joi.array().items(Joi.object({
    degree: Joi.string().required(),
    institution: Joi.string().required(),
    year: Joi.number().required(),
    field: Joi.string().optional()
  })).optional(),
  certifications: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    issuer: Joi.string().required(),
    year: Joi.number().required()
  })).optional(),
  experienceYears: Joi.number().min(0).allow(null).optional(),
  previousExperience: Joi.string().allow('').optional(),
  hourlyRate: Joi.number().min(0).allow(null).optional(),
  monthlyPackage: Joi.string().allow('').optional(),
  weeklyPackage: Joi.string().allow('').optional(),
  bulkPackage: Joi.string().allow('').optional(),
  location: Joi.object({
    address: Joi.string().allow('').optional(),
    latitude: Joi.number().allow(null).optional(),
    longitude: Joi.number().allow(null).optional(),
    radius: Joi.number().min(1).max(50).allow(null).optional()
  }).optional(),
  preferredLocations: Joi.array().items(Joi.string()).optional(),
  availability: Joi.object().optional(),
  timezone: Joi.string().optional(),
  profileImageUrl: Joi.string().uri().optional(),
  videoIntroductionUrl: Joi.string().uri().optional(),
  specialties: Joi.array().items(Joi.string()).optional(),
  preferredStudentLevels: Joi.array().items(Joi.string()).optional(),
  achievements: Joi.array().optional(),
  searchTags: Joi.array().items(Joi.string()).optional()
});

const centreProfileSchema = Joi.object({
  name: Joi.string().required(),
  bio: Joi.string().max(1000).optional(),
  subjects: Joi.array().items(Joi.string()).optional(),
  levels: Joi.array().items(Joi.string().valid('Primary', 'Secondary', 'JC', 'IB', 'IGCSE')).optional(),
  hourlyRate: Joi.number().min(0).optional(),
  packageRates: Joi.array().optional(),
  facilities: Joi.array().items(Joi.string()).optional(),
  capacity: Joi.number().min(1).optional(),
  location: Joi.object({
    address: Joi.string().required(),
    latitude: Joi.number().required(),
    longitude: Joi.number().required()
  }).required(),
  operatingHours: Joi.object().optional(),
  contactInfo: Joi.object({
    phone: Joi.string().optional(),
    email: Joi.string().email().optional(),
    website: Joi.string().uri().optional()
  }).optional()
});

// Routes
app.get('/profiles/tutor/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Fetching tutor profile for user_id:', id);

    // Simple query without package_rates join first
    const { data: profile, error } = await supabase
      .from('tutor_profiles')
      .select(`
        *,
        users:user_id (
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('user_id', id)
      .single();

    if (error) {
      console.error('❌ Profile fetch error:', error);
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Try to get package rates separately if the table exists
    let packageRates = [];
    try {
      const { data: rates } = await supabase
        .from('package_rates')
        .select('*')
        .eq('tutor_profile_id', profile.id)
        .eq('is_active', true);

      packageRates = rates || [];
    } catch (packageError) {
      console.log('⚠️ Package rates table not found or error:', packageError.message);
      // Continue without package rates
    }

    // Add package rates to the response if we found any
    const response = {
      profile: {
        ...profile,
        package_rates: packageRates
      }
    };

    console.log('✅ Profile found:', profile.users?.first_name, profile.users?.last_name);
    res.json(response);
  } catch (error) {
    console.error('❌ Tutor profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/profiles/centre/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: profile, error } = await supabase
      .from('centre_profiles')
      .select(`
        *,
        users:user_id (
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('user_id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ profile });
  } catch (error) {
    console.error('Centre profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/profiles/tutor', verifyToken, async (req, res) => {
  try {
    console.log('📝 POST /profiles/tutor - Creating/updating tutor profile');
    console.log('   User ID:', req.user.userId);
    console.log('   User Type:', req.user.userType);

    if (req.user.userType !== 'tutor') {
      console.error('❌ User is not a tutor:', req.user.userType);
      return res.status(403).json({ error: 'Only tutors can create tutor profiles' });
    }

    console.log('✅ User type check passed');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));

    const { error, value } = tutorProfileSchema.validate(req.body);
    if (error) {
      console.error('❌ Validation error:', error.details[0].message);
      return res.status(400).json({ error: error.details[0].message });
    }

    console.log('✅ Validation passed');

    // Check if profile already exists (upsert pattern)
    const { data: existingProfile } = await supabase
      .from('tutor_profiles')
      .select('id')
      .eq('user_id', req.user.userId)
      .single();

    // Convert camelCase to snake_case for database
    const dbPayload = {
      user_id: req.user.userId,
      headline: value.headline,
      bio: value.bio,
      teaching_philosophy: value.teachingPhilosophy,
      subjects: value.subjects,
      levels: value.levels,
      languages: (value.languages && Array.isArray(value.languages) && value.languages.length > 0) ? value.languages : [], // Explicitly set to empty array if not provided to avoid DB default
      qualifications: value.qualifications,
      certifications: value.certifications,
      experience_years: value.experienceYears,
      previous_experience: value.previousExperience,
      hourly_rate: value.hourlyRate,
      monthly_package: value.monthlyPackage,
      weekly_package: value.weeklyPackage,
      bulk_package: value.bulkPackage,
      location: value.location,
      preferred_locations: value.preferredLocations,
      availability: value.availability,
      timezone: value.timezone || 'Asia/Singapore',
      profile_image_url: value.profileImageUrl,
      video_introduction_url: value.videoIntroductionUrl,
      specialties: value.specialties,
      preferred_student_levels: value.preferredStudentLevels,
      achievements: value.achievements,
      search_tags: value.searchTags,
      updated_at: new Date().toISOString()
    };

    let profile;
    if (existingProfile) {
      // Update existing profile
      const { data, error: updateError } = await supabase
        .from('tutor_profiles')
        .update(dbPayload)
        .eq('id', existingProfile.id)
        .select()
        .single();

      if (updateError) throw updateError;
      profile = data;
    } else {
      // Create new profile
      dbPayload.created_at = new Date().toISOString();
      const { data, error: insertError } = await supabase
        .from('tutor_profiles')
        .insert(dbPayload)
        .select()
        .single();

      if (insertError) throw insertError;
      profile = data;
    }

    
    res.status(existingProfile ? 200 : 201).json({
      message: existingProfile ? 'Tutor profile updated successfully' : 'Tutor profile created successfully',
      profile
    });
  } catch (error) {
    console.error('Tutor profile save error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.post('/profiles/centre', verifyToken, async (req, res) => {
  try {
    if (req.user.userType !== 'centre') {
      return res.status(403).json({ error: 'Only centres can create centre profiles' });
    }

    const { error, value } = centreProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { data: profile, error: insertError } = await supabase
      .from('centre_profiles')
      .insert({
        user_id: req.user.userId,
        ...value,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    res.status(201).json({
      message: 'Centre profile created successfully',
      profile
    });
  } catch (error) {
    console.error('Centre profile creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/profiles/tutor/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user owns this profile
    const { data: existingProfile } = await supabase
      .from('tutor_profiles')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existingProfile || existingProfile.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { error, value } = tutorProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { data: profile, error: updateError } = await supabase
      .from('tutor_profiles')
      .update({
        ...value,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({
      message: 'Tutor profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Tutor profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/profiles/centre/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user owns this profile
    const { data: existingProfile } = await supabase
      .from('centre_profiles')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existingProfile || existingProfile.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { error, value } = centreProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { data: profile, error: updateError } = await supabase
      .from('centre_profiles')
      .update({
        ...value,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({
      message: 'Centre profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Centre profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search profiles
app.get('/profiles/search', async (req, res) => {
  try {
    const { 
      type, 
      subject, 
      level, 
      location, 
      minRate, 
      maxRate,
      page = 1,
      limit = 20
    } = req.query;

    let query = supabase
      .from(type === 'centre' ? 'centre_profiles' : 'tutor_profiles')
      .select(`
        *,
        users:user_id (
          first_name,
          last_name,
          email
        )
      `);

    // Apply filters
    if (subject) {
      query = query.contains('subjects', [subject]);
    }
    if (level) {
      query = query.contains('levels', [level]);
    }
    if (minRate) {
      // Only filter by minimum rate if it's greater than 0
      // This ensures we don't exclude NULL/0 rates when minRate is 0
      if (parseFloat(minRate) > 0) {
        query = query.gte('hourly_rate', minRate);
      }
    }
    if (maxRate) {
      // Include tutors with hourly_rate <= maxRate OR NULL (treating NULL as $0/hr)
      query = query.or(`hourly_rate.lte.${maxRate},hourly_rate.is.null`);
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: profiles, error } = await query;

    if (error) {
      throw error;
    }

    // Filter out incomplete tutor profiles (require 100% completeness)
    // Only show tutors who have completed all profile information
    let filteredProfiles = profiles;
    
    console.log(`🔍 Total profiles before filtering: ${profiles.length}`);
    
    // Filter tutor profiles by completeness (only if querying tutor_profiles table)
    if (type === 'tutor' || !type) {
      filteredProfiles = profiles.filter(profile => {
        // Calculate profile completeness using the same logic as frontend
        // All fields are weighted equally (13 fields, each worth ~7.69 points)
        let completeness = 0;
        const pointsPerField = 100 / 13; // ~7.69 points per field

        // All fields are weighted equally
        if (profile.bio && profile.bio.trim().length > 0) completeness += pointsPerField;
        if (profile.headline && profile.headline.trim().length > 0) completeness += pointsPerField;
        if (profile.teaching_philosophy && profile.teaching_philosophy.trim().length > 0) completeness += pointsPerField;
        if (profile.subjects && profile.subjects.length > 0) completeness += pointsPerField;
        if (profile.levels && profile.levels.length > 0) completeness += pointsPerField;
        if (profile.languages && profile.languages.length > 0) completeness += pointsPerField;
        
        const validQualifications = profile.qualifications && profile.qualifications.filter(q => 
          q.degree && q.degree.trim() && q.institution && q.institution.trim() && q.year
        );
        if (validQualifications && validQualifications.length > 0) completeness += pointsPerField;
        if (profile.experience_years && profile.experience_years > 0) completeness += pointsPerField;
        if (profile.previous_experience && profile.previous_experience.trim().length > 0) completeness += pointsPerField;
        if (profile.hourly_rate !== null && profile.hourly_rate !== undefined) completeness += pointsPerField;
        if (profile.location && profile.location.address && profile.location.address.trim().length > 0) completeness += pointsPerField;
        if (profile.specialties && profile.specialties.length > 0) completeness += pointsPerField;
        if (profile.preferred_locations && profile.preferred_locations.length > 0) completeness += pointsPerField;

        const roundedCompleteness = Math.round(completeness);
        const is100PercentComplete = roundedCompleteness === 100;
        
        if (!is100PercentComplete) {
          const tutorName = profile.headline || (profile.users ? `${profile.users.first_name} ${profile.users.last_name}` : 'Unknown');
          console.log(`❌ Filtering out tutor (${roundedCompleteness}% complete): ${tutorName}`);
        }
        
        return is100PercentComplete;
      });
    }

    console.log(`✅ Returning ${filteredProfiles.length} profiles after filtering`);
    res.json({ profiles: filteredProfiles });
  } catch (error) {
    console.error('Profile search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload verification documents
app.post('/profiles/verification/:id', verifyToken, upload.single('document'), async (req, res) => {
  try {
    const { id } = req.params;
    const { documentType } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload file to Supabase Storage
    const fileName = `verification/${id}/${documentType}_${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('verification-documents')
      .upload(fileName, req.file.buffer, {
        contentType: 'application/pdf'
      });

    if (uploadError) {
      throw uploadError;
    }

    // Update verification status
    const { error: updateError } = await supabase
      .from('verification_documents')
      .insert({
        profile_id: id,
        document_type: documentType,
        file_path: uploadData.path,
        status: 'pending',
        uploaded_at: new Date().toISOString()
      });

    if (updateError) {
      throw updateError;
    }

    res.json({
      message: 'Verification document uploaded successfully',
      filePath: uploadData.path
    });
  } catch (error) {
    console.error('Verification upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'profiles' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Profiles service running on port ${PORT}`);
});
