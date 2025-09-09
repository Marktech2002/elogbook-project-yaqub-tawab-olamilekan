import { supabase } from '../supabase/client';

export interface ClearanceRequirement {
  id: string;
  title: string;
  description: string;
  current: number;
  required: number;
  status: 'completed' | 'in-progress' | 'pending';
  type: 'duration' | 'log_entries' | 'supervisor_approval' | 'academic_approval' | 'final_assessment';
}

export interface ClearanceStatus {
  id: string;
  student_id: string;
  industry_supervisor_approved: boolean;
  school_supervisor_approved: boolean;
  school_supervisor_id?: string;
  school_approval_date?: string;
  total_weeks_completed: number;
  total_entries_approved: number;
  status: 'not_cleared' | 'ready_for_school_approval' | 'cleared';
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentInfo {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  matric_no: string;
  department: string;
  level: string;
  siwes_duration: string;
  school_id: string;
  industry_id: string;
  industry_supervisor_id?: string;
  school_supervisor_id?: string;
}

export interface SupervisorInfo {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  role: string;
  organization: string;
}

export interface SchoolInfo {
  id: string;
  name: string;
  logo?: string;
  location?: string;
}

export interface IndustryInfo {
  id: string;
  name: string;
  location?: string;
  niche?: string;
}

export interface ClearanceData {
  requirements: ClearanceRequirement[];
  overallProgress: number;
  isEligible: boolean;
  studentInfo: StudentInfo;
  schoolInfo: SchoolInfo;
  industryInfo: IndustryInfo;
  industrySupervisor?: SupervisorInfo;
  schoolSupervisor?: SupervisorInfo;
  clearanceStatus: ClearanceStatus;
}

class ClearanceService {
  async getClearanceData(studentId: string): Promise<ClearanceData> {
    // Check if we're in development mock mode
    const isMockMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (isMockMode) {
      console.log('DEV MODE: Returning mock clearance data');
      return this.getMockClearanceData();
    }

    try {
      // Fetch all required data in parallel
      const [
        studentProfile,
        clearanceStatus,
        schoolInfo,
        industryInfo,
        industrySupervisor,
        schoolSupervisor,
        logbookStats
      ] = await Promise.all([
        this.getStudentProfile(studentId),
        this.getClearanceStatus(studentId),
        this.getSchoolInfo(studentId),
        this.getIndustryInfo(studentId),
        this.getIndustrySupervisor(studentId),
        this.getSchoolSupervisor(studentId),
        this.getLogbookStats(studentId)
      ]);

      if (!studentProfile) {
        throw new Error('Student profile not found');
      }

      // Calculate requirements based on fetched data
      const requirements = this.calculateRequirements(
        logbookStats,
        clearanceStatus,
        industrySupervisor,
        schoolSupervisor
      );

      const overallProgress = Math.round(
        (requirements.reduce((acc, req) => acc + (req.current / req.required), 0) / requirements.length) * 100
      );

      const isEligible = requirements.every(req => req.status === 'completed');

      return {
        requirements,
        overallProgress,
        isEligible,
        studentInfo: studentProfile,
        schoolInfo: schoolInfo || { id: '', name: 'Unknown', logo: '', location: '' },
        industryInfo: industryInfo || { id: '', name: 'Unknown', location: '', niche: '' },
        industrySupervisor,
        schoolSupervisor,
        clearanceStatus: clearanceStatus || {
          id: '',
          student_id: studentId,
          industry_supervisor_approved: false,
          school_supervisor_approved: false,
          total_weeks_completed: 0,
          total_entries_approved: 0,
          status: 'not_cleared',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error fetching clearance data:', error);
      throw error;
    }
  }

  async checkClearanceEligibility(studentId: string): Promise<{
    isEligible: boolean;
    requirements: ClearanceRequirement[];
    overallProgress: number;
  }> {
    try {
      const clearanceData = await this.getClearanceData(studentId);
      
      return {
        isEligible: clearanceData.isEligible,
        requirements: clearanceData.requirements,
        overallProgress: clearanceData.overallProgress
      };
    } catch (error) {
      console.error('Error checking clearance eligibility:', error);
      throw error;
    }
  }

  async createOrUpdateClearanceForm(studentId: string, status: 'not_cleared' | 'ready_for_school_approval' | 'cleared'): Promise<void> {
    try {
      // Check if clearance form exists
      const { data: existingForm } = await supabase
        .from('clearance_form')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (existingForm) {
        // Update existing form
        const updates: any = {
          status,
          updated_at: new Date().toISOString()
        };

        if (status === 'cleared') {
          updates.completed_at = new Date().toISOString();
        }

        const { error: updateError } = await supabase
          .from('clearance_form')
          .update(updates)
          .eq('student_id', studentId);

        if (updateError) {
          throw updateError;
        }
      } else {
        // Create new clearance form
        const { error: insertError } = await supabase
          .from('clearance_form')
          .insert([{
            student_id: studentId,
            industry_supervisor_approved: false,
            school_supervisor_approved: false,
            total_weeks_completed: 0,
            total_entries_approved: 0,
            status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (insertError) {
          throw insertError;
        }
      }
    } catch (error) {
      console.error('Error creating/updating clearance form:', error);
      throw error;
    }
  }

  // Create initial clearance form for new student
  async createInitialClearanceForm(studentId: string): Promise<void> {
    try {
      // Check if clearance form already exists
      const { data: existingForm } = await supabase
        .from('clearance_form')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (!existingForm) {
        // Create new clearance form with initial state
        const { error: insertError } = await supabase
          .from('clearance_form')
          .insert([{
            student_id: studentId,
            industry_supervisor_approved: false,
            school_supervisor_approved: false,
            total_weeks_completed: 0,
            total_entries_approved: 0,
            status: 'not_cleared',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (insertError) {
          throw insertError;
        }
      }
    } catch (error) {
      console.error('Error creating initial clearance form:', error);
      throw error;
    }
  }

  private async getStudentProfile(studentId: string): Promise<StudentInfo | null> {
    const { data, error } = await supabase
      .from('user_profile')
      .select('*')
      .eq('id', studentId)
      .single();

    if (error) {
      console.error('Error fetching student profile:', error);
      return null;
    }

    return data as StudentInfo;
  }

  private async getClearanceStatus(studentId: string): Promise<ClearanceStatus | null> {
    const { data, error } = await supabase
      .from('clearance_form')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error fetching clearance status:', error);
      return null;
    }

    return data as ClearanceStatus;
  }

  private async getSchoolInfo(studentId: string): Promise<SchoolInfo | null> {
    const { data, error } = await supabase
      .from('user_profile')
      .select('school_id')
      .eq('id', studentId)
      .single();

    if (error || !data.school_id) {
      return null;
    }

    const { data: schoolData, error: schoolError } = await supabase
      .from('schools')
      .select('*')
      .eq('id', data.school_id)
      .single();

    if (schoolError) {
      console.error('Error fetching school info:', schoolError);
      return null;
    }

    return schoolData as SchoolInfo;
  }

  private async getIndustryInfo(studentId: string): Promise<IndustryInfo | null> {
    const { data, error } = await supabase
      .from('user_profile')
      .select('industry_id')
      .eq('id', studentId)
      .single();

    if (error || !data.industry_id) {
      return null;
    }

    const { data: industryData, error: industryError } = await supabase
      .from('industries')
      .select('*')
      .eq('id', data.industry_id)
      .single();

    if (industryError) {
      console.error('Error fetching industry info:', industryError);
      return null;
    }

    return industryData as IndustryInfo;
  }

  private async getIndustrySupervisor(studentId: string): Promise<SupervisorInfo | null> {
    const { data, error } = await supabase
      .from('user_profile')
      .select('industry_supervisor_id')
      .eq('id', studentId)
      .single();

    if (error || !data.industry_supervisor_id) {
      return null;
    }

    const { data: supervisorData, error: supervisorError } = await supabase
      .from('user_profile')
      .select('first_name, middle_name, last_name, role')
      .eq('id', data.industry_supervisor_id)
      .single();

    if (supervisorError) {
      console.error('Error fetching industry supervisor:', supervisorError);
      return null;
    }

    // Get industry name for organization
    const industryInfo = await this.getIndustryInfo(studentId);
    
    return {
      ...supervisorData,
      id: data.industry_supervisor_id,
      organization: industryInfo?.name || 'Unknown Industry'
    } as SupervisorInfo;
  }

  private async getSchoolSupervisor(studentId: string): Promise<SupervisorInfo | null> {
    const { data, error } = await supabase
      .from('user_profile')
      .select('school_supervisor_id')
      .eq('id', studentId)
      .single();

    if (error || !data.school_supervisor_id) {
      return null;
    }

    const { data: supervisorData, error: supervisorError } = await supabase
      .from('user_profile')
      .select('first_name, middle_name, last_name, role')
      .eq('id', data.school_supervisor_id)
      .single();

    if (supervisorError) {
      console.error('Error fetching school supervisor:', supervisorError);
      return null;
    }

    // Get school name for organization
    const schoolInfo = await this.getSchoolInfo(studentId);
    
    return {
      ...supervisorData,
      id: data.school_supervisor_id,
      organization: schoolInfo?.name || 'Unknown School'
    } as SupervisorInfo;
  }

  private async getLogbookStats(studentId: string): Promise<{ total: number; approved: number; pending: number }> {
    const { data, error } = await supabase
      .from('logbook')
      .select('status')
      .eq('student_id', studentId);

    if (error) {
      console.error('Error fetching logbook stats:', error);
      return { total: 0, approved: 0, pending: 0 };
    }

    const total = data.length;
    const approved = data.filter(entry => entry.status === 'approved').length;
    const pending = data.filter(entry => entry.status === 'pending').length;

    return { total, approved, pending };
  }

  private calculateRequirements(
    logbookStats: { total: number; approved: number; pending: number },
    clearanceStatus: ClearanceStatus | null,
    industrySupervisor?: SupervisorInfo,
    schoolSupervisor?: SupervisorInfo
  ): ClearanceRequirement[] {
    const requirements: ClearanceRequirement[] = [
      {
        id: '1',
        title: 'Complete Minimum Duration',
        description: 'Complete at least 24 weeks of internship',
        current: Math.min(logbookStats.total, 24),
        required: 24,
        status: logbookStats.total >= 24 ? 'completed' : 'in-progress',
        type: 'duration'
      },
      {
        id: '2',
        title: 'Submit Log Entries',
        description: 'Submit daily log entries for each week',
        current: logbookStats.total,
        required: 24,
        status: logbookStats.total >= 24 ? 'completed' : 'in-progress',
        type: 'log_entries'
      },
      {
        id: '3',
        title: 'Industry Supervisor Approval',
        description: 'Get approval from industry-based supervisor',
        current: clearanceStatus?.industry_supervisor_approved ? 1 : 0,
        required: 1,
        status: clearanceStatus?.industry_supervisor_approved ? 'completed' : 'pending',
        type: 'supervisor_approval'
      },
      {
        id: '4',
        title: 'School Supervisor Approval',
        description: 'Get approval from institution-based supervisor',
        current: clearanceStatus?.school_supervisor_approved ? 1 : 0,
        required: 1,
        status: clearanceStatus?.school_supervisor_approved ? 'completed' : 'pending',
        type: 'academic_approval'
      },
      {
        id: '5',
        title: 'Final Assessment',
        description: 'Complete final evaluation and assessment',
        current: clearanceStatus?.status === 'cleared' ? 1 : 0,
        required: 1,
        status: clearanceStatus?.status === 'cleared' ? 'completed' : 'pending',
        type: 'final_assessment'
      }
    ];

    return requirements;
  }

  private getMockClearanceData(): ClearanceData {
    return {
      requirements: [
        {
          id: '1',
          title: 'Complete Minimum Duration',
          description: 'Complete at least 24 weeks of internship',
          current: 24,
          required: 24,
          status: 'completed',
          type: 'duration'
        },
        {
          id: '2',
          title: 'Submit Log Entries',
          description: 'Submit daily log entries for each week',
          current: 24,
          required: 24,
          status: 'completed',
          type: 'log_entries'
        },
        {
          id: '3',
          title: 'Industry Supervisor Approval',
          description: 'Get approval from industry-based supervisor',
          current: 1,
          required: 1,
          status: 'completed',
          type: 'supervisor_approval'
        },
        {
          id: '4',
          title: 'School Supervisor Approval',
          description: 'Get approval from institution-based supervisor',
          current: 1,
          required: 1,
          status: 'completed',
          type: 'academic_approval'
        },
        {
          id: '5',
          title: 'Final Assessment',
          description: 'Complete final evaluation and assessment',
          current: 1,
          required: 1,
          status: 'completed',
          type: 'final_assessment'
        }
      ],
      overallProgress: 100,
      isEligible: true,
      studentInfo: {
        id: 'mock-student',
        first_name: 'Yaqub',
        middle_name: '',
        last_name: 'Tawab',
        matric_no: '2019/1/00031CS',
        department: 'Computer Science',
        level: '400',
        siwes_duration: 'May – September 2025',
        school_id: 'mock-school',
        industry_id: 'mock-industry'
      },
      schoolInfo: {
        id: 'mock-school',
        name: 'FUTMINNA',
        logo: '',
        location: 'Minna, Niger State'
      },
      industryInfo: {
        id: 'mock-industry',
        name: 'Softworks Nigeria Ltd.',
        location: 'Lagos, Nigeria',
        niche: 'Software Development'
      },
      industrySupervisor: {
        id: 'mock-industry-supervisor',
        first_name: 'Mike',
        middle_name: '',
        last_name: 'Yusuf',
        role: 'Industry Supervisor',
        organization: 'Softworks Nigeria Ltd.'
      },
      schoolSupervisor: {
        id: 'mock-school-supervisor',
        first_name: 'A.',
        middle_name: '',
        last_name: 'Balogun',
        role: 'Academic Supervisor',
        organization: 'FUTMINNA'
      },
      clearanceStatus: {
        id: 'mock-clearance',
        student_id: 'mock-student',
        industry_supervisor_approved: true,
        school_supervisor_approved: true,
        total_weeks_completed: 24,
        total_entries_approved: 24,
        status: 'cleared',
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
  }
}

export const clearanceService = new ClearanceService();
export default clearanceService; 