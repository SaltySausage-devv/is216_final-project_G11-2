# TutorConnect Deployment Guide

This guide covers deploying the TutorConnect microservices architecture to various platforms.

## Architecture Overview

TutorConnect uses a decoupled microservices architecture with the following components:

- **Frontend**: Vue.js 3 with motion.js animations (Port 3000)
- **Authentication Service**: JWT-based auth (Port 3001)
- **Users Service**: User management (Port 3002)
- **Profiles Service**: Tutor/centre profiles (Port 3003)
- **Bookings Service**: Availability and booking management (Port 3004)
- **Messaging Service**: Real-time chat with Socket.io (Port 3005)
- **Reviews Service**: Reviews and ratings (Port 3006)
- **Notifications Service**: Email/SMS notifications (Port 3007)
- **Analytics Service**: Analytics and reporting (Port 3008)

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Supabase account
- Email service (Gmail/SendGrid)
- SMS service (Twilio)
- Google APIs (Calendar, Maps)

## Local Development Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd tutorconnect
npm run install:all
```

### 2. Environment Configuration

Copy the environment example file and configure your variables:

```bash
cp env.example .env
```

Fill in your environment variables:

```env
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret

# Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# SMS
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number

# Google APIs
GOOGLE_CALENDAR_API_KEY=your_calendar_key
GOOGLE_MAPS_API_KEY=your_maps_key
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the database schema:

```bash
psql -h your-supabase-host -U postgres -d postgres -f database/schema.sql
```

### 4. Start Development Servers

```bash
npm run dev
```

This will start all services concurrently:
- Frontend: http://localhost:3000
- Auth Service: http://localhost:3001
- Users Service: http://localhost:3002
- Profiles Service: http://localhost:3003
- Bookings Service: http://localhost:3004
- Messaging Service: http://localhost:3005
- Reviews Service: http://localhost:3006
- Notifications Service: http://localhost:3007
- Analytics Service: http://localhost:3008

## Docker Deployment

### 1. Build and Run with Docker Compose

```bash
docker-compose up -d
```

### 2. Check Service Health

```bash
docker-compose ps
```

### 3. View Logs

```bash
docker-compose logs -f [service-name]
```

## Vercel Deployment (Frontend)

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Configure Vercel

Create `vercel.json` in the frontend directory:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### 3. Deploy

```bash
cd frontend
vercel --prod
```

## Heroku Deployment (Backend Services)

### 1. Install Heroku CLI

```bash
# macOS
brew tap heroku/brew && brew install heroku

# Ubuntu
curl https://cli-assets.heroku.com/install.sh | sh
```

### 2. Create Heroku Apps

```bash
# Create apps for each service
heroku create tutorconnect-auth
heroku create tutorconnect-users
heroku create tutorconnect-profiles
heroku create tutorconnect-bookings
heroku create tutorconnect-messaging
heroku create tutorconnect-reviews
heroku create tutorconnect-notifications
heroku create tutorconnect-analytics
```

### 3. Configure Environment Variables

```bash
# For each service
heroku config:set SUPABASE_URL=your_supabase_url -a tutorconnect-auth
heroku config:set SUPABASE_ANON_KEY=your_supabase_anon_key -a tutorconnect-auth
heroku config:set JWT_SECRET=your_jwt_secret -a tutorconnect-auth
# ... repeat for all services
```

### 4. Deploy Services

```bash
# Deploy each service
cd services/auth
git init
heroku git:remote -a tutorconnect-auth
git add .
git commit -m "Initial commit"
git push heroku main
```

## Production Considerations

### 1. Security

- Use HTTPS in production
- Set up proper CORS policies
- Implement rate limiting
- Use environment variables for secrets
- Enable database SSL

### 2. Monitoring

- Set up health checks for all services
- Implement logging with structured logs
- Use APM tools (New Relic, DataDog)
- Monitor database performance

### 3. Scaling

- Use load balancers (Nginx, HAProxy)
- Implement horizontal scaling
- Use Redis for session storage
- Consider database read replicas

### 4. Backup Strategy

- Regular database backups
- File storage backups (Supabase Storage)
- Environment configuration backups

## Environment-Specific Configurations

### Development

```env
NODE_ENV=development
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000
```

### Staging

```env
NODE_ENV=staging
LOG_LEVEL=info
CORS_ORIGIN=https://staging.tutorconnect.sg
```

### Production

```env
NODE_ENV=production
LOG_LEVEL=error
CORS_ORIGIN=https://tutorconnect.sg
```

## Troubleshooting

### Common Issues

1. **Service Connection Issues**
   - Check environment variables
   - Verify network connectivity
   - Check service health endpoints

2. **Database Connection Issues**
   - Verify Supabase credentials
   - Check database SSL settings
   - Verify connection limits

3. **Authentication Issues**
   - Check JWT secret consistency
   - Verify token expiration
   - Check CORS settings

### Health Check Endpoints

All services expose health check endpoints:

- Auth: `GET /health`
- Users: `GET /health`
- Profiles: `GET /health`
- Bookings: `GET /health`
- Messaging: `GET /health`
- Reviews: `GET /health`
- Notifications: `GET /health`
- Analytics: `GET /health`

### Logs and Debugging

```bash
# View service logs
docker-compose logs -f [service-name]

# Check service status
curl http://localhost:3001/health

# Debug database connections
docker-compose exec [service-name] node -e "console.log(process.env.SUPABASE_URL)"
```

## Performance Optimization

### 1. Database Optimization

- Add proper indexes
- Use connection pooling
- Implement query optimization
- Use database caching

### 2. API Optimization

- Implement response caching
- Use compression (gzip)
- Optimize payload sizes
- Implement pagination

### 3. Frontend Optimization

- Enable code splitting
- Use CDN for static assets
- Implement lazy loading
- Optimize bundle size

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database SSL enabled
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Input validation enabled
- [ ] SQL injection prevention
- [ ] XSS protection enabled
- [ ] CSRF protection enabled
- [ ] Security headers configured

## Monitoring and Alerting

### 1. Application Monitoring

- Service health monitoring
- Performance metrics
- Error tracking
- User analytics

### 2. Infrastructure Monitoring

- Server resources
- Database performance
- Network connectivity
- Storage usage

### 3. Business Metrics

- User registrations
- Booking conversions
- Revenue tracking
- User engagement

## Backup and Recovery

### 1. Database Backups

```bash
# Automated daily backups
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### 2. File Storage Backups

- Supabase Storage automatic backups
- Cross-region replication
- Version control for important files

### 3. Configuration Backups

- Environment variable backups
- Infrastructure as Code
- Documentation versioning

## Support and Maintenance

### 1. Regular Maintenance

- Security updates
- Dependency updates
- Performance monitoring
- Database maintenance

### 2. User Support

- Help documentation
- FAQ section
- Contact support
- Bug reporting system

### 3. Development Workflow

- Feature branches
- Code reviews
- Automated testing
- Continuous deployment
