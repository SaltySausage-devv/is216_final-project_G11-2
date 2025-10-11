-- Add updated_at column to bookings table (trigger already exists)
ALTER TABLE public.bookings
ADD COLUMN updated_at timestamp with time zone DEFAULT now();
