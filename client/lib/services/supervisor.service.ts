import { supabase } from '../supabase/client';
import { UserProfile, LogbookEntry, LogbookStatus } from '../../types/database.types';

export interface StudentProfile {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  metric_no?: string;
  department?: string;
  level?: string;
  phone_number?: string;
  school_id?: string;
  industry_id?: string;
  industry_supervisor_id?: string;
  siwes_duration?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupervisorStats {
  studentsCount: number;
  pendingReviews: number;
  completedReviews: number;
  thisWeekReviews: number;
}

export interface PendingReview {
  id: string;
  student_id: string;
  date: string;
  day_name?: string;
  title: string;
  task_done: string;
  comments_from_supervisor: string;
  media_url: string[];
  status: LogbookStatus;
  created_at: string;
  updated_at: string;
  student: {
    first_name: string;
    middle_name?: string;
    last_name: string;
    metric_no?: string;
    department?: string;
  };
  // Add industry supervisor feedback for school supervisors
  industry_supervisor_feedback?: string;
  industry_supervisor_approved?: boolean;
}

export interface ReviewAction {
  entryId: string;
  action: 'approve' | 'reject';
  feedback: string;
}

class SupervisorService {
  async getAssignedStudents(supervisorId: string, supervisorType: 'school' | 'industry'): Promise<StudentProfile[]> {
    try {
      const supervisorField = supervisorType === 'school' ? 'school_supervisor_id' : 'industry_supervisor_id';
      
      const { data, error } = await supabase
        .from('user_profile')
        .select('*')
        .eq(supervisorField, supervisorId)
        .eq('role', 'student')
        .eq('status', 'active')
        .order('first_name', { ascending: true });

      if (error) {
        throw error;
      }

      return data as StudentProfile[] || [];
    } catch (err) {
      console.error('Error fetching assigned students:', err);
      throw err;
    }
  }

  async getPendingReviews(supervisorId: string, supervisorType: 'school' | 'industry'): Promise<PendingReview[]> {
    try {
      const supervisorField = supervisorType === 'school' ? 'school_supervisor_id' : 'industry_supervisor_id';
      
      // First get assigned students
      const { data: students, error: studentsError } = await supabase
        .from('user_profile')
        .select('id')
        .eq(supervisorField, supervisorId)
        .eq('role', 'student');

      if (studentsError) {
        throw studentsError;
      }

      if (!students || students.length === 0) {
        return [];
      }

      const studentIds = students.map(student => student.id);

      if (supervisorType === 'school') {
        // For school supervisors, get entries that have been approved by industry supervisors
        const { data: entries, error: entriesError } = await supabase
          .from('logbook')
          .select(`
            *,
            student:user_profile!logbook_student_id_fkey(
              first_name,
              middle_name,
              last_name,
              metric_no,
              department
            )
          `)
          .in('student_id', studentIds)
          .eq('status', 'approved')
          .not('comments_from_supervisor', 'is', null)
          .order('created_at', { ascending: false });

        if (entriesError) {
          throw entriesError;
        }

        // Filter entries that need school supervisor final approval
        const entriesNeedingApproval = entries.filter(entry => {
          // Check if this entry has been reviewed by industry supervisor but not by school supervisor
          return entry.comments_from_supervisor && 
                 !entry.comments_from_supervisor.includes('[SCHOOL_APPROVED]');
        });

        return entriesNeedingApproval as PendingReview[] || [];
      } else {
        // For industry supervisors, get pending entries as before
      const { data: entries, error: entriesError } = await supabase
        .from('logbook')
        .select(`
          *,
          student:user_profile!logbook_student_id_fkey(
            first_name,
            middle_name,
            last_name,
            metric_no,
            department
          )
        `)
        .in('student_id', studentIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (entriesError) {
        throw entriesError;
      }

      return entries as PendingReview[] || [];
      }
    } catch (err) {
      console.error('Error fetching pending reviews:', err);
      throw err;
    }
  }

  async getAllStudentEntries(supervisorId: string, supervisorType: 'school' | 'industry'): Promise<PendingReview[]> {
    try {
      const supervisorField = supervisorType === 'school' ? 'school_supervisor_id' : 'industry_supervisor_id';
      
      // First get assigned students
      const { data: students, error: studentsError } = await supabase
        .from('user_profile')
        .select('id')
        .eq(supervisorField, supervisorId)
        .eq('role', 'student');

      if (studentsError) {
        throw studentsError;
      }

      if (!students || students.length === 0) {
        return [];
      }

      const studentIds = students.map(student => student.id);

      if (supervisorType === 'school') {
        // For school supervisors, get all approved entries with industry supervisor feedback
        const { data: entries, error: entriesError } = await supabase
          .from('logbook')
          .select(`
            *,
            student:user_profile!logbook_student_id_fkey(
              first_name,
              middle_name,
              last_name,
              metric_no,
              department
            )
          `)
          .in('student_id', studentIds)
          .eq('status', 'approved')
          .not('comments_from_supervisor', 'is', null)
          .order('created_at', { ascending: false });

        if (entriesError) {
          throw entriesError;
        }

        return entries as PendingReview[] || [];
      } else {
        // For industry supervisors, get all entries as before
      const { data: entries, error: entriesError } = await supabase
        .from('logbook')
        .select(`
          *,
          student:user_profile!logbook_student_id_fkey(
            first_name,
            middle_name,
            last_name,
            metric_no,
            department
          )
        `)
        .in('student_id', studentIds)
        .in('status', ['pending', 'approved'])
        .order('created_at', { ascending: false });

      if (entriesError) {
        throw entriesError;
      }

      return entries as PendingReview[] || [];
      }
    } catch (err) {
      console.error('Error fetching all student entries:', err);
      throw err;
    }
  }

  async getSupervisorStats(supervisorId: string, supervisorType: 'school' | 'industry'): Promise<SupervisorStats> {
    try {
      const supervisorField = supervisorType === 'school' ? 'school_supervisor_id' : 'industry_supervisor_id';
      
      // First get all assigned student IDs
      const { data: studentData, error: studentsError } = await supabase
        .from('user_profile')
        .select('id')
        .eq(supervisorField, supervisorId)
        .eq('role', 'student')
        .eq('status', 'active'); // Assuming you only want active students for the count

      if (studentsError) {
        throw studentsError;
      }

      const studentIds = studentData.map(s => s.id);

      // If there are no students, return all counts as 0
      if (studentIds.length === 0) {
        return {
          studentsCount: 0,
          pendingReviews: 0,
          completedReviews: 0,
          thisWeekReviews: 0
        };
      }

      // Prepare queries to run concurrently
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const [
        { count: studentsCount },
        { count: pendingReviews },
        { count: completedReviews },
        { count: thisWeekReviews },
      ] = await Promise.all([
        supabase
          .from('user_profile')
          .select('*', { count: 'exact', head: true })
          .eq(supervisorField, supervisorId)
          .eq('role', 'student')
          .eq('status', 'active'),
        supabase
          .from('logbook')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
          .in('student_id', studentIds),
        supabase
          .from('logbook')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved')
          .in('student_id', studentIds),
        supabase
          .from('logbook')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved')
          .gte('updated_at', oneWeekAgo.toISOString())
          .in('student_id', studentIds),
      ]);

      return {
        studentsCount: studentsCount || 0,
        pendingReviews: pendingReviews || 0,
        completedReviews: completedReviews || 0,
        thisWeekReviews: thisWeekReviews || 0,
      };
    } catch (err) {
      console.error('Error fetching supervisor stats:', err);
      throw err;
    }
  }

  async reviewLogbookEntry(entryId: string, action: 'approve' | 'reject', feedback: string, supervisorType: 'school' | 'industry'): Promise<void> {
    try {
      let updates: any = {
        updated_at: new Date().toISOString()
      };

      if (supervisorType === 'industry') {
        // Industry supervisor approval
        updates.status = action === 'approve' ? 'approved' : 'pending';
        updates.comments_from_supervisor = feedback;
        
        // If approving, check if this completes 24 weeks and update clearance form
        if (action === 'approve') {
          await this.checkAndUpdateClearanceForm(entryId);
        }
      } else if (supervisorType === 'school') {
        // School supervisor final approval - add marker to existing feedback
        const { data: currentEntry } = await supabase
          .from('logbook')
          .select('comments_from_supervisor')
          .eq('id', entryId)
          .single();

        const existingFeedback = currentEntry?.comments_from_supervisor || '';
        const schoolApprovalMarker = action === 'approve' ? '[SCHOOL_APPROVED]' : '[SCHOOL_REJECTED]';
        
        updates.comments_from_supervisor = `${existingFeedback}\n\n--- SCHOOL SUPERVISOR REVIEW ---\n${schoolApprovalMarker}\n${feedback}`;
        
        // Update clearance form status for school supervisor approval
        if (action === 'approve') {
          await this.updateSchoolSupervisorApproval(entryId);
        }
      }

      const { error } = await supabase
        .from('logbook')
        .update(updates)
        .eq('id', entryId);

      if (error) {
        throw error;
      }

      console.log(`Logbook entry ${entryId} ${action}ed by ${supervisorType} supervisor successfully`);
    } catch (err) {
      console.error('Error reviewing logbook entry:', err);
      throw err;
    }
  }

  async checkAndUpdateClearanceForm(entryId: string): Promise<void> {
    try {
      // Get the student ID from the logbook entry
      const { data: entry, error: entryError } = await supabase
        .from('logbook')
        .select('student_id')
        .eq('id', entryId)
        .single();

      if (entryError) {
        throw entryError;
      }

      // Count total approved entries for this student
      const { data: approvedEntries, error: countError } = await supabase
        .from('logbook')
        .select('*')
        .eq('student_id', entry.student_id)
        .eq('status', 'approved');

      if (countError) {
        throw countError;
      }

      const totalApproved = approvedEntries?.length || 0;

      // Check if clearance form exists
      const { data: existingForm } = await supabase
        .from('clearance_form')
        .select('*')
        .eq('student_id', entry.student_id)
        .single();

      if (existingForm) {
        // Update existing form
        const updates: any = {
          industry_supervisor_approved: true,
          total_weeks_completed: totalApproved,
          total_entries_approved: totalApproved,
          updated_at: new Date().toISOString()
        };

        // If 24 weeks completed, mark as ready for school supervisor
        if (totalApproved >= 24) {
          updates.status = 'ready_for_school_approval';
        }

        const { error: updateError } = await supabase
          .from('clearance_form')
          .update(updates)
          .eq('student_id', entry.student_id);

        if (updateError) {
          throw updateError;
        }
      } else {
        // Create new clearance form
        const formData: any = {
          student_id: entry.student_id,
          industry_supervisor_approved: true,
          school_supervisor_approved: false,
          total_weeks_completed: totalApproved,
          total_entries_approved: totalApproved,
          status: totalApproved >= 24 ? 'ready_for_school_approval' : 'not_cleared',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: insertError } = await supabase
          .from('clearance_form')
          .insert([formData]);

        if (insertError) {
          throw insertError;
        }
      }
    } catch (err) {
      console.error('Error updating clearance form for industry approval:', err);
      throw err;
    }
  }

  // New method for school supervisor to easily mark student as cleared
  async markStudentAsCleared(studentId: string): Promise<void> {
    try {
      // Check if clearance form exists
      const { data: existingForm } = await supabase
        .from('clearance_form')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (existingForm) {
        // Update existing form to cleared
        const updates: any = {
          school_supervisor_approved: true,
          school_approval_date: new Date().toISOString(),
          status: 'cleared',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: updateError } = await supabase
          .from('clearance_form')
          .update(updates)
          .eq('student_id', studentId);

        if (updateError) {
          throw updateError;
        }
      } else {
        // Create new clearance form if it doesn't exist
        const { error: insertError } = await supabase
          .from('clearance_form')
          .insert([{
            student_id: studentId,
            industry_supervisor_approved: true,
            school_supervisor_approved: true,
            school_approval_date: new Date().toISOString(),
            total_weeks_completed: 24,
            total_entries_approved: 24,
            status: 'cleared',
            completed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (insertError) {
          throw insertError;
        }
      }
    } catch (err) {
      console.error('Error marking student as cleared:', err);
      throw err;
    }
  }

  // Get students ready for clearance (24 weeks completed)
  async getStudentsReadyForClearance(supervisorId: string): Promise<any[]> {
    try {
      // Get assigned students
      const { data: students, error: studentsError } = await supabase
        .from('user_profile')
        .select('*')
        .eq('school_supervisor_id', supervisorId)
        .eq('role', 'student')
        .eq('status', 'active');

      if (studentsError) {
        throw studentsError;
      }

      if (!students || students.length === 0) {
        return [];
      }

      const studentIds = students.map(student => student.id);

      // Get clearance forms for these students
      const { data: clearanceForms, error: clearanceError } = await supabase
        .from('clearance_form')
        .select('*')
        .in('student_id', studentIds);

      if (clearanceError) {
        throw clearanceError;
      }

      // Get logbook stats for each student
      const studentsWithClearance = await Promise.all(
        students.map(async (student) => {
          const clearanceForm = clearanceForms?.find(cf => cf.student_id === student.id);
          const { data: entries } = await supabase
            .from('logbook')
            .select('*')
            .eq('student_id', student.id)
            .eq('status', 'approved');

          const totalApproved = entries?.length || 0;
          const isReadyForClearance = totalApproved >= 24;
          const canBeCleared = isReadyForClearance && clearanceForm?.status !== 'cleared';

          return {
            ...student,
            clearanceForm,
            totalApproved,
            isReadyForClearance,
            canBeCleared,
            // Add status for display
            displayStatus: clearanceForm?.status === 'cleared' ? 'cleared' : 
                          isReadyForClearance ? 'ready_for_clearance' : 'awaiting_clearance'
          };
        })
      );

      // Only return students who are actually ready for clearance (24 weeks completed)
      return studentsWithClearance.filter(student => student.isReadyForClearance);
    } catch (err) {
      console.error('Error getting students ready for clearance:', err);
      throw err;
    }
  }

  async updateSchoolSupervisorApproval(entryId: string): Promise<void> {
    try {
      // Get the student ID from the logbook entry
      const { data: entry, error: entryError } = await supabase
        .from('logbook')
        .select('student_id')
        .eq('id', entryId)
        .single();

      if (entryError) {
        throw entryError;
      }

      // Get student profile to check supervisor assignments
      const { data: studentProfile, error: profileError } = await supabase
        .from('user_profile')
        .select('school_supervisor_id')
        .eq('id', entry.student_id)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Update clearance form
      const { data: existingForm } = await supabase
        .from('clearance_form')
        .select('*')
        .eq('student_id', entry.student_id)
        .single();

      if (existingForm) {
        const updates: any = {
          school_supervisor_approved: true,
          school_supervisor_id: studentProfile.school_supervisor_id,
          school_approval_date: new Date().toISOString(),
          status: 'cleared',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: updateError } = await supabase
          .from('clearance_form')
          .update(updates)
          .eq('student_id', entry.student_id);

        if (updateError) {
          throw updateError;
        }
      }
    } catch (err) {
      console.error('Error updating school supervisor approval:', err);
      throw err;
    }
  }

  async getStudentProgress(studentId: string): Promise<{
    totalEntries: number;
    approvedEntries: number;
    pendingEntries: number;
    draftEntries: number;
    lastEntryDate?: string;
    industryApprovedEntries: number;
    schoolApprovedEntries: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('logbook')
        .select('*')
        .eq('student_id', studentId)
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }

      const entries = data || [];
      const totalEntries = entries.length;
      const approvedEntries = entries.filter(entry => entry.status === 'approved').length;
      const pendingEntries = entries.filter(entry => entry.status === 'pending').length;
      const draftEntries = entries.filter(entry => entry.status === 'draft').length;
      const lastEntryDate = entries.length > 0 ? entries[0].date : undefined;

      // Count entries approved by industry supervisor
      const industryApprovedEntries = entries.filter(entry => 
        entry.status === 'approved' && 
        entry.comments_from_supervisor && 
        !entry.comments_from_supervisor.includes('[SCHOOL_APPROVED]') &&
        !entry.comments_from_supervisor.includes('[SCHOOL_REJECTED]')
      ).length;

      // Count entries approved by school supervisor
      const schoolApprovedEntries = entries.filter(entry => 
        entry.comments_from_supervisor && 
        entry.comments_from_supervisor.includes('[SCHOOL_APPROVED]')
      ).length;

      return {
        totalEntries,
        approvedEntries,
        pendingEntries,
        draftEntries,
        lastEntryDate,
        industryApprovedEntries,
        schoolApprovedEntries
      };
    } catch (err) {
      console.error('Error fetching student progress:', err);
      throw err;
    }
  }

  async getStudentDetails(studentId: string): Promise<StudentProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profile')
        .select('*')
        .eq('id', studentId)
        .eq('role', 'student')
        .single();

      if (error) {
        throw error;
      }

      return data as StudentProfile;
    } catch (err) {
      console.error('Error fetching student details:', err);
      return null;
    }
  }

  // Get all assigned students with clearance status for school supervisors
  async getAllAssignedStudentsWithClearance(supervisorId: string): Promise<any[]> {
    try {
      // Get assigned students
      const { data: students, error: studentsError } = await supabase
        .from('user_profile')
        .select('*')
        .eq('school_supervisor_id', supervisorId)
        .eq('role', 'student')
        .eq('status', 'active');

      if (studentsError) {
        throw studentsError;
      }

      if (!students || students.length === 0) {
        return [];
      }

      const studentIds = students.map(student => student.id);

      // Get clearance forms for these students
      const { data: clearanceForms, error: clearanceError } = await supabase
        .from('clearance_form')
        .select('*')
        .in('student_id', studentIds);

      if (clearanceError) {
        throw clearanceError;
      }

      // Get logbook stats for each student
      const studentsWithClearance = await Promise.all(
        students.map(async (student) => {
          const clearanceForm = clearanceForms?.find(cf => cf.student_id === student.id);
          const { data: entries } = await supabase
            .from('logbook')
            .select('*')
            .eq('student_id', student.id)
            .eq('status', 'approved');

          const totalApproved = entries?.length || 0;
          const isReadyForClearance = totalApproved >= 24;
          const canBeCleared = isReadyForClearance && clearanceForm?.status !== 'cleared';

          return {
            ...student,
            clearanceForm,
            totalApproved,
            isReadyForClearance,
            canBeCleared,
            // Add status for display
            displayStatus: clearanceForm?.status === 'cleared' ? 'cleared' : 
                          isReadyForClearance ? 'ready_for_clearance' : 'awaiting_clearance'
          };
        })
      );

      // Return all students (not filtered)
      return studentsWithClearance;
    } catch (err) {
      console.error('Error getting all assigned students with clearance:', err);
      throw err;
    }
  }
}

export const supervisorService = new SupervisorService();
export default supervisorService;
 