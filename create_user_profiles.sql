-- Create complete user profiles for 6 users
-- Tutors: Jason Chui, Andrew Tan
-- Students: Daryl, Deshaun, Weiyau, Wayne
-- All users get 250 credits (tokens) and 0 penalty points

-- ============================================
-- USERS TABLE INSERTS
-- ============================================

-- Jason Chui - Tutor
INSERT INTO public.users (
  id,
  email,
  first_name,
  last_name,
  user_type,
  phone,
  phone_verified,
  credits,
  date_of_birth,
  created_at,
  updated_at
) VALUES (
  '09e324bd-cfda-4d4c-95ff-773f7541a84e',
  'jasonchui@smu.edu.sg',
  'Jason',
  'Chui',
  'tutor',
  '+65 9123 4567',
  true,
  250,
  '1998-05-15',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  user_type = EXCLUDED.user_type,
  phone = EXCLUDED.phone,
  phone_verified = EXCLUDED.phone_verified,
  credits = EXCLUDED.credits,
  date_of_birth = EXCLUDED.date_of_birth,
  updated_at = NOW();

-- Daryl - Student
INSERT INTO public.users (
  id,
  email,
  first_name,
  last_name,
  user_type,
  phone,
  phone_verified,
  credits,
  created_at,
  updated_at
) VALUES (
  '2c106248-f4bb-485c-bd52-5fe8658876ad',
  'daryl@smu.edu.sg',
  'Daryl',
  'Lim',
  'student',
  '+65 9234 5678',
  true,
  250,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  user_type = EXCLUDED.user_type,
  phone = EXCLUDED.phone,
  phone_verified = EXCLUDED.phone_verified,
  credits = EXCLUDED.credits,
  updated_at = NOW();

-- Andrew Tan - Tutor
INSERT INTO public.users (
  id,
  email,
  first_name,
  last_name,
  user_type,
  phone,
  phone_verified,
  credits,
  date_of_birth,
  created_at,
  updated_at
) VALUES (
  '3e4ae08a-7368-48c4-bac2-be1f98c0dbdc',
  'andrewtan@smu.edu.sg',
  'Andrew',
  'Tan',
  'tutor',
  '+65 9345 6789',
  true,
  250,
  '1997-08-22',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  user_type = EXCLUDED.user_type,
  phone = EXCLUDED.phone,
  phone_verified = EXCLUDED.phone_verified,
  credits = EXCLUDED.credits,
  date_of_birth = EXCLUDED.date_of_birth,
  updated_at = NOW();

-- Deshaun - Student
INSERT INTO public.users (
  id,
  email,
  first_name,
  last_name,
  user_type,
  phone,
  phone_verified,
  credits,
  created_at,
  updated_at
) VALUES (
  'b2e7439d-ed7e-4d48-9405-d345f7058a42',
  'deshaun@smu.edu.sg',
  'Deshaun',
  'Wong',
  'student',
  '+65 9456 7890',
  true,
  250,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  user_type = EXCLUDED.user_type,
  phone = EXCLUDED.phone,
  phone_verified = EXCLUDED.phone_verified,
  credits = EXCLUDED.credits,
  updated_at = NOW();

-- Weiyau - Student
INSERT INTO public.users (
  id,
  email,
  first_name,
  last_name,
  user_type,
  phone,
  phone_verified,
  credits,
  created_at,
  updated_at
) VALUES (
  'ba41dde8-e6fb-437f-b2c5-1838e43bf91e',
  'weiyau@smu.edu.sg',
  'Weiyau',
  'Lee',
  'student',
  '+65 9567 8901',
  true,
  250,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  user_type = EXCLUDED.user_type,
  phone = EXCLUDED.phone,
  phone_verified = EXCLUDED.phone_verified,
  credits = EXCLUDED.credits,
  updated_at = NOW();

-- Wayne - Student
INSERT INTO public.users (
  id,
  email,
  first_name,
  last_name,
  user_type,
  phone,
  phone_verified,
  credits,
  created_at,
  updated_at
) VALUES (
  'd240fc48-b606-459b-bb59-fde1c73a8845',
  'wayne@smu.edu.sg',
  'Wayne',
  'Ng',
  'student',
  '+65 9678 9012',
  true,
  250,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  user_type = EXCLUDED.user_type,
  phone = EXCLUDED.phone,
  phone_verified = EXCLUDED.phone_verified,
  credits = EXCLUDED.credits,
  updated_at = NOW();

-- ============================================
-- TUTOR PROFILES (Only for Tutors)
-- ============================================

-- Jason Chui - Tutor Profile
INSERT INTO public.tutor_profiles (
  user_id,
  headline,
  bio,
  teaching_philosophy,
  subjects,
  levels,
  hourly_rate,
  experience_years,
  languages,
  qualifications,
  previous_experience,
  location,
  specialties,
  preferred_locations,
  timezone,
  penalty_points,
  average_rating,
  total_reviews,
  is_active,
  created_at,
  updated_at
) VALUES (
  '09e324bd-cfda-4d4c-95ff-773f7541a84e',
  'Experienced Mathematics and Physics Tutor',
  'Passionate tutor with strong background in Mathematics and Physics. Specialized in helping students excel in their studies through clear explanations and practical examples.',
  'I believe in making complex concepts accessible through real-world applications and step-by-step problem-solving approaches. My goal is to build students'' confidence and critical thinking skills.',
  ARRAY['Mathematics', 'Physics'],
  ARRAY['Secondary', 'JC'],
  25.00,
  3,
  ARRAY['English', 'Mandarin'],
  '[{"degree": "Bachelor of Science", "institution": "National University of Singapore", "year": 2020, "field": "Mathematics"}]'::jsonb,
  'Tutored over 50 students in Mathematics and Physics over the past 3 years. Specialized in O-Level and A-Level preparation. Helped students improve their grades by an average of 2 grade levels.',
  '{"address": "City Hall", "latitude": 1.2966, "longitude": 103.8525, "radius": 10}'::jsonb,
  ARRAY['O-Level Mathematics', 'A-Level Physics', 'Problem Solving'],
  ARRAY['Orchard', 'City Hall', 'Bugis'],
  'Asia/Singapore',
  0,
  0,
  0,
  true,
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  headline = EXCLUDED.headline,
  bio = EXCLUDED.bio,
  teaching_philosophy = EXCLUDED.teaching_philosophy,
  subjects = EXCLUDED.subjects,
  levels = EXCLUDED.levels,
  hourly_rate = EXCLUDED.hourly_rate,
  experience_years = EXCLUDED.experience_years,
  languages = EXCLUDED.languages,
  qualifications = EXCLUDED.qualifications,
  previous_experience = EXCLUDED.previous_experience,
  location = EXCLUDED.location,
  specialties = EXCLUDED.specialties,
  preferred_locations = EXCLUDED.preferred_locations,
  timezone = EXCLUDED.timezone,
  penalty_points = EXCLUDED.penalty_points,
  average_rating = EXCLUDED.average_rating,
  total_reviews = EXCLUDED.total_reviews,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Andrew Tan - Tutor Profile
INSERT INTO public.tutor_profiles (
  user_id,
  headline,
  bio,
  teaching_philosophy,
  subjects,
  levels,
  hourly_rate,
  experience_years,
  languages,
  qualifications,
  previous_experience,
  location,
  specialties,
  preferred_locations,
  timezone,
  penalty_points,
  average_rating,
  total_reviews,
  is_active,
  created_at,
  updated_at
) VALUES (
  '3e4ae08a-7368-48c4-bac2-be1f98c0dbdc',
  'Expert Chemistry and Biology Tutor',
  'Dedicated tutor specializing in Chemistry and Biology. Committed to helping students understand complex concepts and achieve their academic goals.',
  'I focus on building a strong foundation in scientific principles through hands-on experiments and visual learning. My approach emphasizes understanding over memorization, helping students develop a genuine interest in the sciences.',
  ARRAY['Chemistry', 'Biology'],
  ARRAY['Secondary', 'JC', 'IB'],
  20.00,
  4,
  ARRAY['English'],
  '[{"degree": "Bachelor of Science", "institution": "Nanyang Technological University", "year": 2019, "field": "Biological Sciences"}]'::jsonb,
  '4 years of tutoring experience with focus on Chemistry and Biology. Successfully prepared students for O-Level, A-Level, and IB examinations. Worked with over 80 students, with 95% achieving their target grades.',
  '{"address": "Jurong East", "latitude": 1.3483, "longitude": 103.6831, "radius": 15}'::jsonb,
  ARRAY['O-Level Chemistry', 'A-Level Biology', 'IB Sciences'],
  ARRAY['Jurong East', 'Clementi', 'Boon Lay'],
  'Asia/Singapore',
  0,
  0,
  0,
  true,
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  headline = EXCLUDED.headline,
  bio = EXCLUDED.bio,
  teaching_philosophy = EXCLUDED.teaching_philosophy,
  subjects = EXCLUDED.subjects,
  levels = EXCLUDED.levels,
  hourly_rate = EXCLUDED.hourly_rate,
  experience_years = EXCLUDED.experience_years,
  languages = EXCLUDED.languages,
  qualifications = EXCLUDED.qualifications,
  previous_experience = EXCLUDED.previous_experience,
  location = EXCLUDED.location,
  specialties = EXCLUDED.specialties,
  preferred_locations = EXCLUDED.preferred_locations,
  timezone = EXCLUDED.timezone,
  penalty_points = EXCLUDED.penalty_points,
  average_rating = EXCLUDED.average_rating,
  total_reviews = EXCLUDED.total_reviews,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

