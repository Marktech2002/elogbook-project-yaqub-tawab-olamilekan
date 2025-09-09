-- Migration script to update clearance_form table structure
-- Run this script on your existing database to add the new fields

-- IMPORTANT: Clearance forms should be created:
-- 1. When a student registers (initial state: not_cleared)
-- 2. When industry supervisor approves 24 weeks (status: ready_for_school_approval)
-- 3. When school supervisor gives final approval (status: cleared)

-- Add new columns to existing clearance_form table
ALTER TABLE clearance_form 
ADD COLUMN IF NOT EXISTS industry_supervisor_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS school_supervisor_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS school_supervisor_id UUID REFERENCES user_profile(id),
ADD COLUMN IF NOT EXISTS school_approval_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_weeks_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_entries_approved INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to set default values
UPDATE clearance_form 
SET 
  industry_supervisor_approved = FALSE,
  school_supervisor_approved = FALSE,
  total_weeks_completed = 0,
  total_entries_approved = 0,
  updated_at = CURRENT_TIMESTAMP
WHERE industry_supervisor_approved IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_clearance_form_student_id ON clearance_form(student_id);
CREATE INDEX IF NOT EXISTS idx_clearance_form_status ON clearance_form(status);
CREATE INDEX IF NOT EXISTS idx_clearance_form_industry_approved ON clearance_form(industry_supervisor_approved);
CREATE INDEX IF NOT EXISTS idx_clearance_form_school_approved ON clearance_form(school_supervisor_approved);

-- Optional: Create clearance forms for existing students who don't have one
-- Uncomment the following if you want to create clearance forms for existing students
/*
INSERT INTO clearance_form (student_id, industry_supervisor_approved, school_supervisor_approved, total_weeks_completed, total_entries_approved, status, created_at, updated_at)
SELECT 
  up.id,
  FALSE,
  FALSE,
  0,
  0,
  'not_cleared',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM user_profile up
WHERE up.role = 'student'
  AND NOT EXISTS (SELECT 1 FROM clearance_form cf WHERE cf.student_id = up.id);
*/ 