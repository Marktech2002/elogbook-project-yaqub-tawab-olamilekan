import { supabase } from '../supabase/client';
import type { UserProfile, UserRole } from '../../types/database.types';

export interface RegistrationData {
  email: string;
  password: string;
  userType: UserType;
  firstName: string;
  middleName?: string;
  lastName: string;
  phoneNumber: string;
  institution?: string;
  matricNumber?: string;
  faculty?: string;
  department?: string;
  bankName?: string;
  accountNumber?: string;
  industryBasedSupervisor?: string;
  institutionBasedSupervisor?: string;
  organization?: string;
  industry?: string;
  position?: string;
}

type UserType = 'Student' | 'Institution-Based Supervisor' | 'Industry-Based Supervisor';

// Map UI user types to database user roles
const mapUserTypeToRole = (userType: UserType): UserRole => {
  switch (userType) {
    case 'Student':
      return 'student';
    case 'Institution-Based Supervisor':
      return 'supervisor_school';
    case 'Industry-Based Supervisor':
      return 'supervisor_industry';
    default:
      return 'student';
  }
};

export const AuthService = {
  async registerUser(registrationData: RegistrationData): Promise<{ success: boolean; error?: string; user?: any }> {
    try {
      // Step 1: Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registrationData.email,
        password: registrationData.password,
        
        

      });

      if (authError) {
        console.error('Auth signup error:', authError);
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create user account' };
      }

      // Check if email confirmation is required
      if (authData.user.email_confirmed_at === null) {
        console.log('User created but email confirmation required');
        // You might want to show a message about checking email
      }

      // Step 2: Create user profile with the correct user ID
      const userProfile: Omit<UserProfile, 'created_at' | 'updated_at'> = {
        id: authData.user.id, // Use the actual auth user ID
        role: mapUserTypeToRole(registrationData.userType),
        first_name: registrationData.firstName,
        middle_name: registrationData.middleName || null,
        last_name: registrationData.lastName,
        phone_number: registrationData.phoneNumber,
        status: 'active'
      };

      // Add conditional fields based on user type - only include fields that exist in the schema
      if (registrationData.userType === 'Student') {
        Object.assign(userProfile, {
          metric_no: registrationData.matricNumber || null,
          department: registrationData.department || null,
          account_no: registrationData.accountNumber || null,
          bank_name: registrationData.bankName || null,
          school_id: registrationData.institution || null,
          industry_id: registrationData.industry || null,
          industry_supervisor_id: registrationData.industryBasedSupervisor || null,
          school_supervisor_id: registrationData.institutionBasedSupervisor || null,
        });
      } else if (registrationData.userType === 'Institution-Based Supervisor') {
        Object.assign(userProfile, {
          department: registrationData.department || null,
          school_id: registrationData.institution || null,
        });
      } else if (registrationData.userType === 'Industry-Based Supervisor') {
        Object.assign(userProfile, {
          industry_id: registrationData.industry || null,
        });
      }

      // Insert user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profile')
        .insert([userProfile])
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        return { success: false, error: `Profile creation failed: ${profileError.message}` };
      }

      return { 
        success: true, 
        user: { ...authData.user, profile: profileData }
      };

    } catch (error) {
      console.error('Unexpected registration error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      };
    }
  },

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string; user?: any }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, user: data.user };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      };
    }
  },

  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      };
    }
  }
}; 