const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3008;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'gamification-service',
    timestamp: new Date().toISOString()
  });
});

// Placeholder gamification endpoints
app.get('/achievements', (req, res) => {
  res.json({ 
    message: 'Gamification service is running',
    achievements: []
  });
});

app.listen(PORT, () => {
  console.log(`Gamification service running on port ${PORT}`);
});


