# TutorConnect

A comprehensive marketplace platform connecting students with verified tutors and tuition centres in Singapore. Built with a modern microservices architecture.

## Features

- **User Management**: Students, tutors, and tuition centres
- **Booking System**: Real-time availability and instant booking
- **Messaging**: Real-time chat with Socket.io
- **Reviews & Ratings**: Comprehensive review system
- **Analytics**: Performance tracking and reporting
- **Gamification**: Badges, points, and leaderboards
- **Calendar Integration**: Google Calendar sync
- **Maps Integration**: Google Maps for location services
- **Notifications**: Email and SMS notifications via Twilio

## Tech Stack

### Frontend
- Vue.js 3 (Composition API)
- Vue Router 4
- Pinia (State Management)
- Vite
- Bootstrap 5
- Socket.io Client

### Backend
- Node.js 18+
- Express.js
- Socket.io
- JWT Authentication
- Supabase (PostgreSQL)

### Infrastructure
- Supabase (Database)
- Railway (Deployment)
- Google APIs (Calendar, Maps)

## Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Supabase account
- (Optional) Google Cloud Platform account for Calendar/Maps APIs
- (Optional) Twilio account for SMS notifications

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ploject
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   This will install dependencies for the root, frontend, and all microservices.

3. **Configure environment variables**
   
   **Root `.env` file** (for backend services):
   
   Create a `.env` file in the root directory. Reference `services/auth/env.example` for the required structure.
   
   **Required variables:**
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `JWT_SECRET` - Secret key for JWT token signing
   - `FRONTEND_URL` - Frontend URL (default: `http://localhost:3000`)
   
   **Frontend `.env` file** (for Vue.js application):
   
   Create a `.env` file in the `frontend/` directory with Vite-prefixed variables:
   
   ```bash
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   **Note:** Service URLs (e.g., `VITE_AUTH_SERVICE_URL`) are optional for local development as they default to `http://localhost:300X`.

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start all services:
   - Frontend: http://localhost:3000
   - Auth: http://localhost:3001
   - Users: http://localhost:3002
   - Profiles: http://localhost:3003
   - Bookings: http://localhost:3004
   - Messaging: http://localhost:3005
   - Reviews: http://localhost:3006
   - Notifications: http://localhost:3007
   - Analytics: http://localhost:3008
   - Calendar: http://localhost:3011
   - Maps: http://localhost:3012

## Test Accounts

The following test accounts are available for testing. All accounts use the password: `password123`

### Tutors
- **Jason Chui** - `jasonchui@smu.edu.sg` - Mathematics & Physics tutor ($25/hr)
- **Andrew Tan** - `andrewtan@smu.edu.sg` - Chemistry & Biology tutor ($20/hr)

### Students
- **Daryl Lim** - `daryl@smu.edu.sg`
- **Deshaun Wong** - `deshaun@smu.edu.sg`
- **Weiyau Lee** - `weiyau@smu.edu.sg`
- **Wayne Ng** - `wayne@smu.edu.sg`

All test accounts have:
- 250 credits (tokens)
- Phone verified
- Complete user profiles

**Note:** To set up these test accounts in your database, run the SQL script `create_user_profiles.sql` in your Supabase SQL editor.

## Project Structure

```
ploject/
├── frontend/              # Vue.js frontend application
│   ├── src/
│   │   ├── components/   # Reusable Vue components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── stores/       # Pinia stores
│   │   └── lib/          # Libraries (Supabase client)
│   └── package.json
├── services/              # Microservices backend
│   ├── auth/             # Authentication service
│   ├── users/            # User management
│   ├── profiles/         # Profile management
│   ├── bookings/         # Booking management
│   ├── messaging/        # Real-time messaging
│   ├── reviews/          # Reviews and ratings
│   ├── notifications/    # Notifications service
│   ├── analytics/        # Analytics service
│   ├── gamification/     # Gamification service
│   ├── earnings/         # Earnings tracking
│   ├── calendar/         # Calendar integration
│   └── maps/             # Maps integration
├── scripts/
│   └── super-dev.js      # Development orchestration script
└── package.json          # Root package configuration
```

## Available Scripts

### Development
```bash
npm run dev              # Start all services in development mode
npm run dev:auth         # Start auth service only
npm run dev:users        # Start users service only
npm run dev:frontend     # Start frontend only
# ... similar for other services
```

### Production
```bash
npm run build            # Build frontend for production
npm run start            # Start all services in production mode
```

### Deployment
```bash
npm run deploy:railway   # Deploy to Railway
npm run deploy:setup     # Setup Railway CLI
```

## Environment Variables

### Root `.env` (Backend Services)

See `services/auth/env.example` for the complete list of environment variables.

**Required:**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `JWT_SECRET`
- `FRONTEND_URL`

**Optional:**
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` (SMS)
- `GOOGLE_MAPS_API_KEY`, `GOOGLE_CALENDAR_API_KEY` (Google APIs)
- `EMAIL_USER`, `EMAIL_PASS` (Email service)

### Frontend `.env` (Vue.js Application)

**Required:**
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

**Optional (for production):**
- `VITE_AUTH_SERVICE_URL` - Auth service URL (defaults to `http://localhost:3001`)
- `VITE_USERS_SERVICE_URL` - Users service URL (defaults to `http://localhost:3002`)
- `VITE_PROFILES_SERVICE_URL` - Profiles service URL (defaults to `http://localhost:3003`)
- `VITE_BOOKINGS_SERVICE_URL` - Bookings service URL (defaults to `http://localhost:3004`)
- `VITE_MESSAGING_SERVICE_URL` - Messaging service URL (defaults to `http://localhost:3005`)
- `VITE_REVIEWS_SERVICE_URL` - Reviews service URL (defaults to `http://localhost:3006`)
- `VITE_NOTIFICATIONS_SERVICE_URL` - Notifications service URL (defaults to `http://localhost:3007`)
- `VITE_ANALYTICS_SERVICE_URL` - Analytics service URL (defaults to `http://localhost:3008`)
- `VITE_CALENDAR_SERVICE_URL` - Calendar service URL (defaults to `http://localhost:3011`)
- `VITE_MAPS_SERVICE_URL` - Maps service URL (defaults to `http://localhost:3012`)

## Architecture

### Microservices

The application follows a microservices architecture with 12 independent services:

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Vue.js application |
| Auth | 3001 | Authentication & authorization |
| Users | 3002 | User management |
| Profiles | 3003 | Profile management |
| Bookings | 3004 | Booking management |
| Messaging | 3005 | Real-time messaging (Socket.io) |
| Reviews | 3006 | Reviews & ratings |
| Notifications | 3007 | Email & SMS notifications |
| Analytics | 3008 | Analytics & reporting |
| Calendar | 3011 | Google Calendar integration |
| Maps | 3012 | Google Maps integration |

### Database

The application uses Supabase (PostgreSQL) for data storage. Key tables include:
- `users` - User accounts
- `tutor_profiles` - Tutor information
- `centre_profiles` - Centre information
- `bookings` - Booking records
- `messages` - Chat messages
- `reviews` - Reviews and ratings
- `notifications` - Notification records

## Development

The project uses `super-dev.js` to orchestrate development:
- Automatically installs dependencies for all services
- Cleans up ports 3000-3012
- Starts all services concurrently
- Excludes `gamification` and `earnings` services by default

## Deployment

The application is configured for deployment on Railway:
- All services can be deployed using the `super-dev.js` script
- Environment variables are managed via Railway's dashboard
- Database is hosted on Supabase

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.
