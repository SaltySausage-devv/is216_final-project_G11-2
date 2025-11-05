-- ============================================
-- Database Wipe Script (TRUNCATE Version)
-- WARNING: This will delete ALL data from all tables!
-- Use with extreme caution!
-- 
-- This version uses TRUNCATE CASCADE which is faster
-- and automatically handles foreign key constraints
-- ============================================

BEGIN;

-- ============================================
-- Truncate all tables with CASCADE
-- CASCADE will automatically truncate dependent tables
-- ============================================

-- Truncate tables in dependency order (though CASCADE handles this)
TRUNCATE TABLE public.messages CASCADE;
TRUNCATE TABLE public.booking_offers CASCADE;
TRUNCATE TABLE public.bookings CASCADE;
TRUNCATE TABLE public.calendar_events CASCADE;
TRUNCATE TABLE public.conversations CASCADE;
TRUNCATE TABLE public.earnings CASCADE;
TRUNCATE TABLE public.review_reports CASCADE;
TRUNCATE TABLE public.reviews CASCADE;
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.notification_preferences CASCADE;
TRUNCATE TABLE public.push_tokens CASCADE;
TRUNCATE TABLE public.phone_verification_logs CASCADE;
TRUNCATE TABLE public.profile_views CASCADE;
TRUNCATE TABLE public.user_badges CASCADE;
TRUNCATE TABLE public.user_points CASCADE;
TRUNCATE TABLE public.user_engagement CASCADE;
TRUNCATE TABLE public.leaderboards CASCADE;
TRUNCATE TABLE public.availability_slots CASCADE;
TRUNCATE TABLE public.tutor_date_availability CASCADE;
TRUNCATE TABLE public.tutor_availability CASCADE;
TRUNCATE TABLE public.tutor_time_off CASCADE;
TRUNCATE TABLE public.calendar_sync_status CASCADE;
TRUNCATE TABLE public.calendar_tokens CASCADE;
TRUNCATE TABLE public.verification_documents CASCADE;
TRUNCATE TABLE public.tutor_profiles CASCADE;
TRUNCATE TABLE public.centre_profiles CASCADE;
TRUNCATE TABLE public.travel_times CASCADE;
TRUNCATE TABLE public.location_cache CASCADE;
TRUNCATE TABLE public.subject_analytics CASCADE;
TRUNCATE TABLE public.tutor_earnings CASCADE;

-- Truncate users last (it may have foreign key to auth.users)
TRUNCATE TABLE public.users CASCADE;

-- Reset sequences
ALTER SEQUENCE IF EXISTS tutor_earnings_id_seq RESTART WITH 1;

COMMIT;

-- ============================================
-- Verification Query
-- ============================================
-- Run this after to verify all tables are empty:
/*
SELECT 
    schemaname,
    tablename,
    (SELECT COUNT(*) FROM information_schema.tables t 
     WHERE t.table_schema = schemaname 
     AND t.table_name = tablename) as table_exists
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
*/

