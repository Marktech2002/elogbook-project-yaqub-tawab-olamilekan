export type UserRole = 'student' | 'supervisor_school' | 'supervisor_industry' | 'super_admin';
export type ClearanceStatus = 'cleared' | 'not_cleared';
export type LogbookStatus = 'pending' | 'approved' | 'draft';
export type DayName = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface School {
  id: string;
  name: string;
  logo?: string;
  location?: string;
  created_at?: string;
}

export interface Industry {
  id: string;
  name: string;
  location?: string;
  niche?: string;
  status?: string;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  role: UserRole;
  first_name: string;
  middle_name?: string;
  last_name: string;
  username?: string;
  logo?: string;
  metric_no?: string;
  department?: string;
  account_no?: string;
  level?: string;
  phone_number?: string;
  school_id?: string;
  industry_id?: string;
  industry_supervisor_id?: string;
  school_supervisor_id?: string;
  bank_name?: string;
  siwes_duration?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LogbookEntry {
  id: string;
  student_id: string;
  date: string;
  day_name?: DayName;
  title: string;
  task_done: string;
  comments_from_supervisor?: string;
  media_url?: string[];
  status: LogbookStatus;
  created_at?: string;
  updated_at?: string;
}

export interface ClearanceForm {
  id: string;
  student_id: string;
  industry_supervisor_approved: boolean;
  school_supervisor_approved: boolean;
  school_supervisor_id?: string;
  school_approval_date?: string;
  total_weeks_completed: number;
  total_entries_approved: number;
  status: ClearanceStatus;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      schools: {
        Row: School;
        Insert: Omit<School, 'id' | 'created_at'>;
        Update: Partial<Omit<School, 'id' | 'created_at'>>;
      };
      industries: {
        Row: Industry;
        Insert: Omit<Industry, 'id' | 'created_at'>;
        Update: Partial<Omit<Industry, 'id' | 'created_at'>>;
      };
      user_profile: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>;
      };
      logbook: {
        Row: LogbookEntry;
        Insert: Omit<LogbookEntry, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<LogbookEntry, 'id' | 'created_at' | 'updated_at'>>;
      };
      clearance_form: {
        Row: ClearanceForm;
        Insert: Omit<ClearanceForm, 'id' | 'created_at'>;
        Update: Partial<Omit<ClearanceForm, 'id' | 'created_at'>>;
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
    };
    Functions: {
      [key: string]: {
        Args: Record<string, any>;
        Returns: any;
      };
    };
    Enums: {
      user_role: UserRole;
      clearance_status: ClearanceStatus;
      logbook_status: LogbookStatus;
      day_name: DayName;
    };
  };
} 