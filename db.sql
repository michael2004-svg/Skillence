-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  parent_comment_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.comments(id)
);
CREATE TABLE public.course_enrollments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  course_id bigint NOT NULL,
  progress integer DEFAULT 0,
  completed boolean DEFAULT false,
  enrolled_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT course_enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT course_enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT course_enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.courses (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  title text NOT NULL,
  description text,
  level text DEFAULT 'Beginner'::text,
  duration text DEFAULT '2h 30m'::text,
  image_url text,
  link text,
  industry text,
  inserted_at timestamp with time zone DEFAULT now(),
  CONSTRAINT courses_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cv_analysis (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  score integer,
  industry text,
  skills ARRAY,
  timestamp timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  cv_text text,
  file_name text,
  analysis_data jsonb,
  CONSTRAINT cv_analysis_pkey PRIMARY KEY (id),
  CONSTRAINT cv_analysis_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.cv_uploads (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id text,
  filename text NOT NULL,
  url text NOT NULL,
  uploaded_at timestamp without time zone DEFAULT now(),
  CONSTRAINT cv_uploads_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cvs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  file_url text NOT NULL,
  analysis jsonb,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT cvs_pkey PRIMARY KEY (id),
  CONSTRAINT cvs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.follows (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  followed_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT follows_pkey PRIMARY KEY (id),
  CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES auth.users(id),
  CONSTRAINT follows_followed_id_fkey FOREIGN KEY (followed_id) REFERENCES auth.users(id)
);
CREATE TABLE public.job_applications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  adzuna_job_id text NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT job_applications_pkey PRIMARY KEY (id),
  CONSTRAINT job_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.jobs (
  id integer NOT NULL DEFAULT nextval('jobs_id_seq'::regclass),
  title text,
  company text,
  location text,
  description text,
  salary_min integer,
  salary_max integer,
  redirect_url text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT jobs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.mentor_bookings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  mentor_id bigint NOT NULL,
  booking_date timestamp with time zone NOT NULL,
  duration_minutes integer DEFAULT 30,
  status text DEFAULT 'pending'::text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mentor_bookings_pkey PRIMARY KEY (id),
  CONSTRAINT mentor_bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT mentor_bookings_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES public.mentors(id)
);
CREATE TABLE public.mentors (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  title text,
  bio text,
  expertise ARRAY,
  image_url text,
  booking_link text,
  inserted_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mentors_pkey PRIMARY KEY (id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id),
  CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  actor_id uuid,
  actor_name text,
  type text NOT NULL,
  action text NOT NULL,
  post_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT notifications_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id),
  CONSTRAINT notifications_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id)
);
CREATE TABLE public.post_likes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  post_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT post_likes_pkey PRIMARY KEY (id),
  CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id)
);
CREATE TABLE public.post_reports (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  post_id uuid NOT NULL,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  CONSTRAINT post_reports_pkey PRIMARY KEY (id),
  CONSTRAINT post_reports_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT post_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.profiles(id),
  CONSTRAINT post_reports_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.post_views (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  post_id uuid NOT NULL,
  user_id uuid,
  viewed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT post_views_pkey PRIMARY KEY (id),
  CONSTRAINT post_views_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT post_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.posts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  content text NOT NULL,
  tags ARRAY DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  image_url text,
  visibility text DEFAULT 'public'::text CHECK (visibility = ANY (ARRAY['public'::text, 'connections'::text, 'private'::text])),
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  job_title text,
  industry text,
  experience_level text CHECK (experience_level = ANY (ARRAY['Beginner'::text, 'Intermediate'::text, 'Expert'::text])),
  top_skills ARRAY,
  goals ARRAY,
  profile_picture_url text,
  location text,
  education jsonb,
  work_experience jsonb,
  portfolio_links jsonb,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  skill_score integer DEFAULT 0,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.saved_posts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  post_id uuid NOT NULL,
  saved_at timestamp with time zone DEFAULT now(),
  CONSTRAINT saved_posts_pkey PRIMARY KEY (id),
  CONSTRAINT saved_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT saved_posts_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id)
);
CREATE TABLE public.skill_endorsements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  endorsed_user_id uuid NOT NULL,
  endorser_id uuid NOT NULL,
  skill_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT skill_endorsements_pkey PRIMARY KEY (id),
  CONSTRAINT skill_endorsements_endorsed_user_id_fkey FOREIGN KEY (endorsed_user_id) REFERENCES public.profiles(id),
  CONSTRAINT skill_endorsements_endorser_id_fkey FOREIGN KEY (endorser_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  achievement_key text NOT NULL,
  achievement_name text NOT NULL,
  achievement_description text,
  icon text,
  awarded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_achievements_pkey PRIMARY KEY (id),
  CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_activity (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  event_data jsonb,
  timestamp timestamp with time zone DEFAULT now(),
  CONSTRAINT user_activity_pkey PRIMARY KEY (id),
  CONSTRAINT user_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_interests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  interest text NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_interests_pkey PRIMARY KEY (id),
  CONSTRAINT user_interests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_privacy_settings (
  user_id uuid NOT NULL,
  profile_visibility text DEFAULT 'public'::text,
  show_email boolean DEFAULT false,
  show_phone boolean DEFAULT false,
  allow_messages text DEFAULT 'everyone'::text,
  show_activity boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_privacy_settings_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_privacy_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);