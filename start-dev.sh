#!/bin/bash

# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your_supabase_anon_key"
export JWT_SECRET="your_jwt_secret_key_here"
export SENDGRID_API_KEY="your_sendgrid_api_key"
export FROM_EMAIL="noreply@tutorconnect.sg"
export TWILIO_ACCOUNT_SID="your_twilio_account_sid"
export TWILIO_AUTH_TOKEN="your_twilio_auth_token"
export TWILIO_PHONE_NUMBER="your_twilio_phone_number"
export GOOGLE_CALENDAR_API_KEY="your_google_calendar_api_key"
export GOOGLE_MAPS_API_KEY="your_google_maps_api_key"
export GOOGLE_CLIENT_ID="your_google_client_id"
export GOOGLE_CLIENT_SECRET="your_google_client_secret"
export GOOGLE_REDIRECT_URI="http://localhost:3000/auth/google/callback"
export FRONTEND_URL="http://localhost:3000"
export AUTH_SERVICE_PORT=3001
export USERS_SERVICE_PORT=3002
export PROFILES_SERVICE_PORT=3003
export BOOKINGS_SERVICE_PORT=3004
export MESSAGING_SERVICE_PORT=3005
export REVIEWS_SERVICE_PORT=3006
export NOTIFICATIONS_SERVICE_PORT=3007
export ANALYTICS_SERVICE_PORT=3008
export GAMIFICATION_SERVICE_PORT=3009
export EARNINGS_SERVICE_PORT=3010
export CALENDAR_SERVICE_PORT=3011
export MAPS_SERVICE_PORT=3012
export RABBITMQ_URL=amqp://localhost:5672
export NODE_ENV=development

# Start all services
npm run dev
