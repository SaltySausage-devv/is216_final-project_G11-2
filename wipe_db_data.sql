-- ============================================
-- Database Wipe Script
-- WARNING: This will delete ALL data from all tables!
-- Use with extreme caution!
-- ============================================

-- Disable foreign key checks temporarily (PostgreSQL doesn't have this, but we'll delete in order)
-- This script deletes data in the correct order to respect foreign key constraints

BEGIN;

-- ============================================
-- Step 1: Delete from child tables first
-- ============================================

-- Delete messages (references conversations, booking_offers, users)
DELETE FROM public.messages;

-- Delete booking offers (references conversations, users)
DELETE FROM public.booking_offers;

-- Delete calendar events (references bookings, users)
DELETE FROM public.calendar_events;

-- Delete earnings (references bookings, users)
DELETE FROM public.earnings;

-- Delete reviews and review reports (references bookings, users)
DELETE FROM public.review_reports;
DELETE FROM public.reviews;

-- Delete conversations (references bookings, users)
DELETE FROM public.conversations;

-- Delete bookings (references users)
DELETE FROM public.bookings;

-- Delete notifications and preferences (references users)
DELETE FROM public.notifications;
DELETE FROM public.notification_preferences;

-- Delete push tokens (references users)
DELETE FROM public.push_tokens;

-- Delete phone verification logs (references users)
DELETE FROM public.phone_verification_logs;

-- Delete profile views (references users)
DELETE FROM public.profile_views;

-- Delete user badges (references users)
DELETE FROM public.user_badges;

-- Delete user points (references users)
DELETE FROM public.user_points;

-- Delete user engagement (references users)
DELETE FROM public.user_engagement;

-- Delete leaderboards (references users)
DELETE FROM public.leaderboards;

-- Delete availability slots (references users)
DELETE FROM public.availability_slots;

-- Delete tutor availability (references users)
DELETE FROM public.tutor_date_availability;
DELETE FROM public.tutor_availability;
DELETE FROM public.tutor_time_off;

-- Delete calendar sync and tokens (references users)
DELETE FROM public.calendar_sync_status;
DELETE FROM public.calendar_tokens;

-- Delete profiles (references users)
DELETE FROM public.verification_documents;
DELETE FROM public.tutor_profiles;
DELETE FROM public.centre_profiles;

-- Delete location cache and travel times (no foreign keys)
DELETE FROM public.travel_times;
DELETE FROM public.location_cache;

-- Delete subject analytics (no foreign keys)
DELETE FROM public.subject_analytics;

-- Delete tutor_earnings (legacy table, references integers not UUIDs)
DELETE FROM public.tutor_earnings;

-- ============================================
-- Step 2: Delete from users table
-- Note: This will also delete auth.users if cascade is enabled
-- ============================================
DELETE FROM public.users;

-- ============================================
-- Step 3: Reset sequences (if needed)
-- ============================================
-- Reset tutor_earnings sequence if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'tutor_earnings_id_seq') THEN
        ALTER SEQUENCE tutor_earnings_id_seq RESTART WITH 1;
    END IF;
END $$;

COMMIT;

-- ============================================
-- Verification: Count records in all tables
-- ============================================
-- Uncomment to verify all tables are empty:
/*
SELECT 
    'messages' as table_name, COUNT(*) as count FROM public.messages
UNION ALL SELECT 'booking_offers', COUNT(*) FROM public.booking_offers
UNION ALL SELECT 'bookings', COUNT(*) FROM public.bookings
UNION ALL SELECT 'calendar_events', COUNT(*) FROM public.calendar_events
UNION ALL SELECT 'conversations', COUNT(*) FROM public.conversations
UNION ALL SELECT 'earnings', COUNT(*) FROM public.earnings
UNION ALL SELECT 'messages', COUNT(*) FROM public.messages
UNION ALL SELECT 'notifications', COUNT(*) FROM public.notifications
UNION ALL SELECT 'reviews', COUNT(*) FROM public.reviews
UNION ALL SELECT 'users', COUNT(*) FROM public.users
ORDER BY table_name;
*/

