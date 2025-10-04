# OnlyTutor - Singapore's Premier Tutoring Marketplace

A comprehensive marketplace platform connecting students with verified tutors and tuition centres in Singapore, built with a modern microservices architecture and featuring advanced animations.

## 🎯 Project Overview

OnlyTutor is a full-stack web application that revolutionizes the tutoring industry in Singapore by providing:
- **Transparent pricing** comparison across tutors and centres
- **Real-time availability** and instant booking
- **Verified tutor profiles** with comprehensive reviews
- **Gamification system** with badges, points, and leaderboards
- **Analytics dashboard** for performance tracking
- **Earnings tracking** for tutors
- **Advanced animations** with study-themed backgrounds

## 🏗️ Architecture

### **Microservices Backend (12 Services)**
| Service | Port | Technology | Purpose |
|---------|------|-------------|---------|
| **Auth** | 3001 | Node.js + JWT | User authentication & authorization |
| **Users** | 3002 | Node.js + Express | Student, tutor, centre management |
| **Profiles** | 3003 | Node.js + Express | Tutor/centre profiles & verification |
| **Bookings** | 3004 | Node.js + Express | Availability & booking management |
| **Messaging** | 3005 | Node.js + Socket.io | Real-time chat & Q&A |
| **Reviews** | 3006 | Node.js + Express | Reviews & ratings system |
| **Notifications** | 3007 | Node.js + Email/SMS | Email & WhatsApp notifications |
| **Analytics** | 3008 | Node.js + Express | Analytics & reporting |
| **Gamification** | 3009 | Node.js + Express | Badges, points, leaderboards |
| **Earnings** | 3010 | Node.js + Express | Tutor earnings tracking |
| **Calendar** | 3011 | Node.js + Google API | Google Calendar integration |
| **Maps** | 3012 | Node.js + Google API | Google Maps integration |

### **Frontend Application**
- **Framework**: Vue.js 3 with Composition API
- **Router**: Vue Router 4
- **State Management**: Pinia
- **Styling**: Bootstrap 5 + Custom Cyberpunk Theme
- **Animations**: Anime.js 4.2.0 + Motion.js
- **Build Tool**: Vite
- **Port**: 3000

### **Database & Infrastructure**
- **Database**: Supabase (PostgreSQL)
- **Message Queue**: RabbitMQ
- **Load Balancer**: Nginx
- **Containerization**: Docker + Docker Compose
- **Deployment**: Vercel/Heroku ready

## 📁 Complete Codebase Structure

```
OnlyTutor/
├── 📁 database/
│   └── schema.sql                    # PostgreSQL database schema
├── 📁 frontend/                      # Vue.js frontend application
│   ├── 📁 src/
│   │   ├── 📁 components/           # Reusable Vue components
│   │   │   ├── Navbar.vue           # Navigation with cyberpunk styling
│   │   │   └── Footer.vue           # Footer component
│   │   ├── 📁 pages/                # Vue page components
│   │   │   ├── Home.vue             # Landing page with animations
│   │   │   ├── Login.vue            # User authentication
│   │   │   ├── Register.vue         # User registration
│   │   │   ├── Dashboard.vue        # User dashboard
│   │   │   ├── SearchTutors.vue     # Tutor search interface
│   │   │   ├── TutorProfile.vue    # Individual tutor profiles
│   │   │   ├── Booking.vue          # Booking interface
│   │   │   ├── Messages.vue         # Messaging interface
│   │   │   ├── Analytics.vue        # Analytics dashboard
│   │   │   ├── Profile.vue          # User profile management
│   │   │   └── Gamification.vue     # Gamification features
│   │   ├── 📁 composables/          # Vue composables (custom hooks)
│   │   │   ├── useAnimatedBackground.js  # Study-themed background animations
│   │   │   └── useScrollAnimations.js  # Scroll-triggered animations
│   │   ├── 📁 stores/               # Pinia state management
│   │   │   └── auth.js              # Authentication store
│   │   ├── 📁 services/             # API services
│   │   │   └── api.js               # API client
│   │   ├── App.vue                  # Main Vue component
│   │   ├── main.js                  # Vue app entry point
│   │   └── style.css                # Global styles with cyberpunk theme
│   ├── package.json                 # Frontend dependencies
│   ├── vite.config.js               # Vite configuration
│   └── Dockerfile                   # Frontend container
├── 📁 services/                     # Microservices backend
│   ├── 📁 auth/                     # Authentication service
│   │   ├── src/index.js             # Auth service implementation
│   │   ├── package.json             # Auth dependencies
│   │   └── Dockerfile               # Auth container
│   ├── 📁 users/                    # Users service
│   ├── 📁 profiles/                 # Profiles service
│   ├── 📁 bookings/                 # Bookings service
│   ├── 📁 messaging/                # Messaging service
│   ├── 📁 reviews/                  # Reviews service
│   ├── 📁 notifications/            # Notifications service
│   ├── 📁 analytics/                # Analytics service
│   ├── 📁 gamification/             # Gamification service
│   ├── 📁 earnings/                 # Earnings service
│   ├── 📁 calendar/                 # Calendar service
│   └── 📁 maps/                     # Maps service
├── 📄 package.json                  # Root package configuration
├── 📄 docker-compose.yml            # Container orchestration
├── 📄 nginx.conf                    # Load balancer configuration
├── 📄 start-dev.sh                  # Development startup script
├── 📄 env.example                   # Environment variables template
└── 📄 README.md                     # This file
```

## 🚀 Quick Start Guide

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Docker (optional, for containerized deployment)
- Supabase account
- Google Cloud Platform account (for Calendar/Maps APIs)

### **1. Clone and Install Dependencies**

```bash
# Clone the repository
git clone <repository-url>
cd OnlyTutor

# Install all dependencies (root + all services + frontend)
npm run install:all
```

### **2. Environment Setup**

```bash
# Copy environment template
cp env.example .env

# Edit environment variables
nano .env
```

**Required Environment Variables:**
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# Email Service (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@onlytutor.sg

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Google APIs
GOOGLE_CALENDAR_API_KEY=your_google_calendar_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Service URLs
FRONTEND_URL=http://localhost:3000
RABBITMQ_URL=amqp://localhost:5672
```

### **3. Database Setup**

```bash
# Create Supabase project at https://supabase.com
# Run the database schema
psql -h your-db-host -U postgres -d postgres -f database/schema.sql
```

### **4. Start Development Servers**

#### **Option A: Quick Start (All Services)**
```bash
# Set environment variables and start all services
chmod +x start-dev.sh
./start-dev.sh
```

#### **Option B: Individual Services**
```bash
# Start all services concurrently
npm run dev

# Or start individual services
npm run dev:auth      # Port 3001
npm run dev:users     # Port 3002
npm run dev:profiles  # Port 3003
npm run dev:bookings  # Port 3004
npm run dev:messaging # Port 3005
npm run dev:reviews   # Port 3006
npm run dev:notifications # Port 3007
npm run dev:analytics # Port 3008
npm run dev:gamification # Port 3009
npm run dev:earnings  # Port 3010
npm run dev:calendar  # Port 3011
npm run dev:maps      # Port 3012
npm run dev:frontend  # Port 3000
```

### **5. Access the Application**

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:3001 (Auth service)
- **RabbitMQ Management**: http://localhost:15672 (admin/password)

## 🎨 Design System

### **Cyberpunk Theme**
- **Primary Colors**: Dark grey (#1a1a1a, #2a2a2a)
- **Accent Colors**: Orange (#ff8c42), Yellow (#ffd23f)
- **Typography**: Inter font family
- **Animations**: Anime.js with study-themed elements

### **Background Animations**
- **Study Elements**: 📚 Books, ✏️ Pencils, 📝 Notebooks, 🧮 Calculators
- **Academic Symbols**: 🎓 Graduation caps, 🔬 Microscopes, 💡 Light bulbs
- **Mathematical Symbols**: π, ∑, ∞, +, =, ∫, ∆, √
- **Performance**: Optimized to 10 elements for smooth performance

### **Custom Scrollbar**
- **White segmented design** with horizontal dashes
- **20px width** for better visibility
- **Glow effects** for enhanced user experience
- **Lag-free performance** with optimized CSS

## 🛠️ Development Commands

```bash
# Install dependencies
npm run install:all

# Start development
npm run dev

# Build for production
npm run build

# Start individual services
npm run dev:auth
npm run dev:users
npm run dev:frontend
# ... etc

# Docker deployment
docker-compose up -d
```

## 📊 Database Schema

### **Core Tables**
- `users` - User accounts (students, tutors, centres, admins)
- `tutor_profiles` - Tutor-specific information
- `centre_profiles` - Tuition centre information
- `bookings` - Booking records
- `reviews` - Reviews and ratings
- `messages` - Chat messages
- `notifications` - Notification records
- `analytics_events` - User behavior tracking
- `gamification_points` - Points and badges
- `earnings` - Tutor earnings tracking

### **Integration Tables**
- `calendar_events` - Google Calendar integration
- `location_data` - Google Maps location data

## 🚀 Deployment

### **Docker Deployment**
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### **Production Deployment**
- **Frontend**: Deploy to Vercel/Netlify
- **Backend**: Deploy to Heroku/Railway
- **Database**: Use Supabase production instance
- **Load Balancer**: Configure Nginx for production

## 🔧 Performance Optimizations

### **Frontend Optimizations**
- **Removed unused animations** (6 functions removed)
- **Optimized background elements** (10 max for smooth performance)
- **Simplified CSS animations** (removed complex keyframes)
- **Hardware-accelerated scrollbar** (CSS-only implementation)

### **Backend Optimizations**
- **Microservices architecture** for scalability
- **RabbitMQ message queuing** for async processing
- **JWT authentication** for stateless sessions
- **Database indexing** for query optimization

## 📱 Features

### **For Students**
- Browse verified tutors and centres
- Compare pricing transparently
- Book sessions instantly
- Track progress with gamification
- Real-time messaging with tutors

### **For Tutors**
- Create detailed profiles
- Set availability and pricing
- Track earnings and analytics
- Earn badges and points
- Manage bookings and messages

### **For Centres**
- Manage multiple tutors
- Bulk booking management
- Analytics dashboard
- Brand customization
- Revenue tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

---

**OnlyTutor** - Revolutionizing education in Singapore, one connection at a time. 🎓✨