-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('student', 'supervisor_school', 'supervisor_industry', 'super_admin');
CREATE TYPE clearance_status AS ENUM ('cleared', 'not_cleared');
CREATE TYPE logbook_status AS ENUM ('pending', 'approved');
CREATE TYPE day_name AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- Schools table
CREATE TABLE schools (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo TEXT,
  location VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Industries table
CREATE TABLE industries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  niche VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User profiles table (extends Supabase Auth)
CREATE TABLE user_profile (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role user_role NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE,
  logo TEXT,
  metric_no VARCHAR(50),
  department VARCHAR(100),
  account_no VARCHAR(50),
  level VARCHAR(20),
  phone_number VARCHAR(20),
  school_id UUID REFERENCES schools(id),
  industry_id UUID REFERENCES industries(id),
  industry_supervisor_id UUID REFERENCES user_profile(id),
  school_supervisor_id UUID REFERENCES user_profile(id),
  bank_name VARCHAR(100),
  siwes_duration VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Logbook entries table
CREATE TABLE logbook (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES user_profile(id) NOT NULL,
  date DATE NOT NULL,
  day_name day_name,
  title VARCHAR(200) NOT NULL,
  task_done TEXT NOT NULL,
  comments_from_supervisor TEXT,
  media_url TEXT[],
  status logbook_status DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, date)
);

-- Clearance form table
CREATE TABLE clearance_form (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES user_profile(id) NOT NULL UNIQUE,
  industry_supervisor_approved BOOLEAN DEFAULT FALSE,
  school_supervisor_approved BOOLEAN DEFAULT FALSE,
  school_supervisor_id UUID REFERENCES user_profile(id),
  school_approval_date TIMESTAMP WITH TIME ZONE,
  total_weeks_completed INTEGER DEFAULT 0,
  total_entries_approved INTEGER DEFAULT 0,
  status clearance_status DEFAULT 'not_cleared',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification table for supervisors for their students
CREATE TABLE notification (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profile(id) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, title)
);


-- Create function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_profile table
CREATE TRIGGER update_user_profile_modtime
BEFORE UPDATE ON user_profile
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create trigger for logbook table
CREATE TRIGGER update_logbook_modtime
BEFORE UPDATE ON logbook
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create initial sample data (optional - for development)
INSERT INTO schools (name, location) VALUES 
('Sample University', 'Sample Location');

INSERT INTO industries (name, location, niche) VALUES 
('Sample Industry', 'Sample Location', 'Technology');

-- Enable Row Level Security (RLS)
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE logbook ENABLE ROW LEVEL SECURITY;
ALTER TABLE clearance_form ENABLE ROW LEVEL SECURITY;

-- RLS Policies for super_admin access
CREATE POLICY super_admin_schools_policy ON schools 
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_profile 
    WHERE user_profile.id = auth.uid() 
    AND user_profile.role = 'super_admin'
  )
);

CREATE POLICY super_admin_industries_policy ON industries 
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_profile 
    WHERE user_profile.id = auth.uid() 
    AND user_profile.role = 'super_admin'
  )
);

-- RLS Policies for logbook entries
-- Students can view and edit their own entries
CREATE POLICY student_logbook_policy ON logbook 
FOR ALL TO authenticated 
USING (
  (student_id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM user_profile 
    WHERE user_profile.id = auth.uid() 
    AND (
      user_profile.role = 'super_admin' OR
      user_profile.id = (SELECT school_supervisor_id FROM user_profile WHERE id = student_id) OR
      user_profile.id = (SELECT industry_supervisor_id FROM user_profile WHERE id = student_id)
    )
  )
);

-- Supervisors can view their students' profiles
CREATE POLICY supervisor_view_student_policy ON user_profile 
FOR SELECT TO authenticated 
USING (
  id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_profile 
    WHERE user_profile.id = auth.uid() 
    AND (
      user_profile.role = 'super_admin' OR
      user_profile.id = school_supervisor_id OR
      user_profile.id = industry_supervisor_id
    )
  )
);

-- Users can edit their own profile
CREATE POLICY user_update_own_profile ON user_profile 
FOR UPDATE TO authenticated 
USING (id = auth.uid());

-- RLS for clearance forms
CREATE POLICY clearance_form_policy ON clearance_form
FOR ALL TO authenticated 
USING (
  (student_id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM user_profile 
    WHERE user_profile.id = auth.uid() 
    AND (
      user_profile.role = 'super_admin' OR
      user_profile.id = (SELECT school_supervisor_id FROM user_profile WHERE id = student_id) OR
      user_profile.id = (SELECT industry_supervisor_id FROM user_profile WHERE id = student_id)
    )
  )
); 