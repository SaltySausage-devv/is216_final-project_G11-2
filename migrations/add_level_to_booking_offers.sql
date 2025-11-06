-- Migration: Add level column to booking_offers table
-- Date: 2024
-- Description: Adds level field (Primary, Secondary, JC, etc.) to booking offers for better categorization

-- Check if column exists before adding (PostgreSQL)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'booking_offers' 
        AND column_name = 'level'
    ) THEN
        ALTER TABLE public.booking_offers 
        ADD COLUMN level text;
        
        RAISE NOTICE 'Added level column to booking_offers table';
    ELSE
        RAISE NOTICE 'level column already exists in booking_offers table';
    END IF;
END $$;

-- Optional: Add comment to document the column
COMMENT ON COLUMN public.booking_offers.level IS 'Education level for the booking (e.g., Primary, Secondary, JC, Polytechnic, University, Other)';



