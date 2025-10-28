const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const axios = require('axios');
// Load environment variables (optional for Railway deployment)
try {
  require('dotenv').config({ path: '../../.env' });
} catch (error) {
  console.log('⚠️ Could not load .env file, using system environment variables');
}

const app = express();
const PORT = process.env.PORT || 3012;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_BASE_URL = 'https://maps.googleapis.com/maps/api';

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://tutorconnect-production.up.railway.app',
  'https://beautiful-celebration-production.up.railway.app',
  process.env.FRONTEND_URL
].filter(Boolean);

console.log('🔧 MAPS SERVICE: Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: allowedOrigins,
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
const geocodeSchema = Joi.object({
  address: Joi.string().required()
});

const distanceMatrixSchema = Joi.object({
  origins: Joi.array().items(Joi.string()).required(),
  destinations: Joi.array().items(Joi.string()).required(),
  mode: Joi.string().valid('driving', 'walking', 'bicycling', 'transit').default('driving')
});

const nearbySearchSchema = Joi.object({
  location: Joi.string().required(),
  radius: Joi.number().min(1).max(50000).default(5000),
  type: Joi.string().optional(),
  keyword: Joi.string().optional()
});

// Handle all OPTIONS requests explicitly
app.options('*', cors());

// Routes
app.post('/maps/geocode', async (req, res) => {
  try {
    const { error, value } = geocodeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { address } = value;

    const response = await axios.get(`${GOOGLE_MAPS_BASE_URL}/geocode/json`, {
      params: {
        address,
        key: GOOGLE_MAPS_API_KEY,
        region: 'sg' // Singapore region
      }
    });

    if (response.data.status !== 'OK') {
      return res.status(400).json({ error: 'Geocoding failed', details: response.data.status });
    }

    const result = response.data.results[0];
    const location = result.geometry.location;
    const formattedAddress = result.formatted_address;

    res.json({
      location: {
        latitude: location.lat,
        longitude: location.lng
      },
      formattedAddress,
      placeId: result.place_id,
      addressComponents: result.address_components
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/maps/reverse-geocode', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const response = await axios.get(`${GOOGLE_MAPS_BASE_URL}/geocode/json`, {
      params: {
        latlng: `${latitude},${longitude}`,
        key: GOOGLE_MAPS_API_KEY,
        region: 'sg'
      }
    });

    if (response.data.status !== 'OK') {
      return res.status(400).json({ error: 'Reverse geocoding failed', details: response.data.status });
    }

    const result = response.data.results[0];
    const formattedAddress = result.formatted_address;

    res.json({
      formattedAddress,
      placeId: result.place_id,
      addressComponents: result.address_components
    });
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/maps/distance-matrix', async (req, res) => {
  try {
    const { error, value } = distanceMatrixSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { origins, destinations, mode } = value;

    const response = await axios.get(`${GOOGLE_MAPS_BASE_URL}/distancematrix/json`, {
      params: {
        origins: origins.join('|'),
        destinations: destinations.join('|'),
        mode,
        key: GOOGLE_MAPS_API_KEY,
        units: 'metric'
      }
    });

    if (response.data.status !== 'OK') {
      return res.status(400).json({ error: 'Distance matrix failed', details: response.data.status });
    }

    const results = response.data.rows.map(row => 
      row.elements.map(element => ({
        distance: element.distance,
        duration: element.duration,
        status: element.status
      }))
    );

    res.json({ results });
  } catch (error) {
    console.error('Distance matrix error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/maps/nearby-search', async (req, res) => {
  try {
    const { error, value } = nearbySearchSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { location, radius, type, keyword } = value;

    const response = await axios.get(`${GOOGLE_MAPS_BASE_URL}/place/nearbysearch/json`, {
      params: {
        location,
        radius,
        type,
        keyword,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status !== 'OK') {
      return res.status(400).json({ error: 'Nearby search failed', details: response.data.status });
    }

    const results = response.data.results.map(place => ({
      placeId: place.place_id,
      name: place.name,
      location: place.geometry.location,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      vicinity: place.vicinity,
      types: place.types,
      photos: place.photos?.map(photo => ({
        photoReference: photo.photo_reference,
        height: photo.height,
        width: photo.width
      })) || []
    }));

    res.json({ results });
  } catch (error) {
    console.error('Nearby search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/maps/place-details/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    const { fields = 'name,formatted_address,geometry,rating,user_ratings_total,photos,types,website,formatted_phone_number' } = req.query;

    const response = await axios.get(`${GOOGLE_MAPS_BASE_URL}/place/details/json`, {
      params: {
        place_id: placeId,
        fields,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status !== 'OK') {
      return res.status(400).json({ error: 'Place details failed', details: response.data.status });
    }

    const result = response.data.result;
    res.json({
      placeId: result.place_id,
      name: result.name,
      formattedAddress: result.formatted_address,
      location: result.geometry?.location,
      rating: result.rating,
      userRatingsTotal: result.user_ratings_total,
      photos: result.photos?.map(photo => ({
        photoReference: photo.photo_reference,
        height: photo.height,
        width: photo.width
      })) || [],
      types: result.types,
      website: result.website,
      formattedPhoneNumber: result.formatted_phone_number
    });
  } catch (error) {
    console.error('Place details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/maps/photo/:photoReference', async (req, res) => {
  try {
    const { photoReference } = req.params;
    const { maxWidth = 400, maxHeight = 400 } = req.query;

    const response = await axios.get(`${GOOGLE_MAPS_BASE_URL}/place/photo`, {
      params: {
        photo_reference: photoReference,
        maxwidth: maxWidth,
        maxheight: maxHeight,
        key: GOOGLE_MAPS_API_KEY
      },
      responseType: 'arraybuffer'
    });

    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Length': response.data.length
    });
    res.send(response.data);
  } catch (error) {
    console.error('Photo fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/maps/autocomplete', async (req, res) => {
  try {
    const { input, sessionToken } = req.body;

    console.log('🔍 Autocomplete request:', { input, sessionToken });

    if (!input) {
      return res.status(400).json({ error: 'Input is required' });
    }

    const response = await axios.get(`${GOOGLE_MAPS_BASE_URL}/place/autocomplete/json`, {
      params: {
        input,
        sessiontoken: sessionToken,
        key: GOOGLE_MAPS_API_KEY,
        components: 'country:sg' // Singapore only
      }
    });

    console.log('🗺️ Google Maps API status:', response.data.status);
    console.log('🗺️ Google Maps API predictions count:', response.data.predictions?.length || 0);

    if (response.data.status !== 'OK') {
      console.error('❌ Autocomplete failed:', response.data.status, response.data.error_message);
      return res.status(400).json({ error: 'Autocomplete failed', details: response.data.status });
    }

    const predictions = response.data.predictions.map(prediction => ({
      placeId: prediction.place_id,
      description: prediction.description,
      structuredFormatting: prediction.structured_formatting,
      types: prediction.types
    }));

    res.json({ predictions });
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/maps/route', async (req, res) => {
  try {
    const { origin, destination, mode = 'driving', waypoints } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    const response = await axios.get(`${GOOGLE_MAPS_BASE_URL}/directions/json`, {
      params: {
        origin,
        destination,
        mode,
        waypoints: waypoints?.join('|'),
        key: GOOGLE_MAPS_API_KEY,
        alternatives: true
      }
    });

    if (response.data.status !== 'OK') {
      return res.status(400).json({ error: 'Route calculation failed', details: response.data.status });
    }

    const routes = response.data.routes.map(route => ({
      summary: route.summary,
      legs: route.legs.map(leg => ({
        distance: leg.distance,
        duration: leg.duration,
        startAddress: leg.start_address,
        endAddress: leg.end_address,
        steps: leg.steps.map(step => ({
          distance: step.distance,
          duration: step.duration,
          instruction: step.html_instructions,
          travelMode: step.travel_mode
        }))
      })),
      overviewPolyline: route.overview_polyline
    }));

    res.json({ routes });
  } catch (error) {
    console.error('Route calculation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/maps/tutors-nearby', verifyToken, async (req, res) => {
  try {
    const { latitude, longitude, radius = 10000, subject, level } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Get tutors within radius
    const { data: tutors } = await supabase
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
      .not('location', 'is', null);

    if (!tutors) {
      return res.json({ tutors: [] });
    }

    // Filter tutors by distance and criteria
    const nearbyTutors = [];
    
    for (const tutor of tutors) {
      if (!tutor.location) continue;

      const tutorLat = tutor.location.latitude;
      const tutorLng = tutor.location.longitude;
      
      // Calculate distance (simple haversine formula)
      const distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        tutorLat,
        tutorLng
      );

      if (distance <= radius) {
        // Check subject and level filters
        if (subject && !tutor.subjects?.includes(subject)) continue;
        if (level && !tutor.levels?.includes(level)) continue;

        nearbyTutors.push({
          ...tutor,
          distance: Math.round(distance)
        });
      }
    }

    // Sort by distance
    nearbyTutors.sort((a, b) => a.distance - b.distance);

    res.json({ tutors: nearbyTutors });
  } catch (error) {
    console.error('Nearby tutors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000; // Return distance in meters
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'maps' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Maps service running on port ${PORT}`);
});
