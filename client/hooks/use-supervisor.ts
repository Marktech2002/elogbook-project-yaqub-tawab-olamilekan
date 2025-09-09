import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import supervisorService, { StudentProfile, PendingReview, SupervisorStats } from '../lib/services/supervisor.service';

interface UseSupervisorReturn {
  assignedStudents: StudentProfile[];
  pendingReviews: PendingReview[];
  allStudentEntries: PendingReview[];
  supervisorStats: SupervisorStats | null;
  isLoading: boolean;
  error: string | null;
  fetchAssignedStudents: () => Promise<void>;
  fetchPendingReviews: () => Promise<void>;
  fetchAllStudentEntries: () => Promise<void>;
  fetchSupervisorStats: () => Promise<void>;
  reviewEntry: (entryId: string, action: 'approve' | 'reject', feedback: string) => Promise<void>;
  refreshData: () => Promise<void>;
  getStudentsReadyForClearance: () => Promise<any[]>;
  getAllAssignedStudentsWithClearance: () => Promise<any[]>;
  markStudentAsCleared: (studentId: string) => Promise<void>;
}

export function useSupervisor(): UseSupervisorReturn {
  const { profile } = useAuth();
  const [assignedStudents, setAssignedStudents] = useState<StudentProfile[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [allStudentEntries, setAllStudentEntries] = useState<PendingReview[]>([]);
  const [supervisorStats, setSupervisorStats] = useState<SupervisorStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Determine supervisor type
  const supervisorType = profile?.role === 'supervisor_school' ? 'school' : 'industry';
  const isSupervisor = profile?.role === 'supervisor_school' || profile?.role === 'supervisor_industry';

  // Fetch assigned students
  const fetchAssignedStudents = useCallback(async () => {
    if (!isSupervisor || !profile?.id) return;

    try {
      setError(null);
      const students = await supervisorService.getAssignedStudents(profile.id, supervisorType);
      setAssignedStudents(students);
    } catch (err: any) {
      console.error('Error fetching assigned students:', err);
      setError(err.message || 'Failed to fetch assigned students');
    }
  }, [isSupervisor, profile?.id, supervisorType]);

  // Fetch pending reviews
  const fetchPendingReviews = useCallback(async () => {
    if (!isSupervisor || !profile?.id) return;

    try {
      setError(null);
      const reviews = await supervisorService.getPendingReviews(profile.id, supervisorType);
      setPendingReviews(reviews);
    } catch (err: any) {
      console.error('Error fetching pending reviews:', err);
      setError(err.message || 'Failed to fetch pending reviews');
    }
  }, [isSupervisor, profile?.id, supervisorType]);

  // Fetch all student entries (pending and approved)
  const fetchAllStudentEntries = useCallback(async () => {
    if (!isSupervisor || !profile?.id) return;

    try {
      setError(null);
      const entries = await supervisorService.getAllStudentEntries(profile.id, supervisorType);
      setAllStudentEntries(entries);
    } catch (err: any) {
      console.error('Error fetching all student entries:', err);
      setError(err.message || 'Failed to fetch all student entries');
    }
  }, [isSupervisor, profile?.id, supervisorType]);

  // Fetch supervisor statistics
  const fetchSupervisorStats = useCallback(async () => {
    if (!isSupervisor || !profile?.id) return;

    try {
      setError(null);
      const stats = await supervisorService.getSupervisorStats(profile.id, supervisorType);
      setSupervisorStats(stats);
    } catch (err: any) {
      console.error('Error fetching supervisor stats:', err);
      setError(err.message || 'Failed to fetch supervisor stats');
    }
  }, [isSupervisor, profile?.id, supervisorType]);

  // Review a logbook entry
  const reviewEntry = useCallback(async (entryId: string, action: 'approve' | 'reject', feedback: string) => {
    if (!isSupervisor) return;

    try {
      setError(null);
      await supervisorService.reviewLogbookEntry(entryId, action, feedback, supervisorType);
      
      // Refresh data after review
      await Promise.all([
        fetchPendingReviews(),
        fetchAllStudentEntries(),
        fetchSupervisorStats()
      ]);
    } catch (err: any) {
      console.error('Error reviewing entry:', err);
      setError(err.message || 'Failed to review entry');
      throw err;
    }
  }, [isSupervisor, supervisorType, fetchPendingReviews, fetchAllStudentEntries, fetchSupervisorStats]);

  // Get students ready for clearance
  const getStudentsReadyForClearance = useCallback(async () => {
    if (!isSupervisor || profile?.role !== 'supervisor_school') return [];

    try {
      setError(null);
      const students = await supervisorService.getStudentsReadyForClearance(profile.id);
      return students;
    } catch (err: any) {
      console.error('Error getting students ready for clearance:', err);
      setError(err.message || 'Failed to get students ready for clearance');
      return [];
    }
  }, [isSupervisor, profile?.role, profile?.id]);

  // Get all assigned students with clearance status
  const getAllAssignedStudentsWithClearance = useCallback(async () => {
    if (!isSupervisor || profile?.role !== 'supervisor_school') return [];

    try {
      setError(null);
      const students = await supervisorService.getAllAssignedStudentsWithClearance(profile.id);
      return students;
    } catch (err: any) {
      console.error('Error getting all assigned students with clearance:', err);
      setError(err.message || 'Failed to get all assigned students with clearance');
      return [];
    }
  }, [isSupervisor, profile?.role, profile?.id]);

  // Mark student as cleared
  const markStudentAsCleared = useCallback(async (studentId: string) => {
    if (!isSupervisor || profile?.role !== 'supervisor_school') return;

    try {
      setError(null);
      await supervisorService.markStudentAsCleared(studentId);
      
      // Refresh data after marking as cleared
      await Promise.all([
        fetchAssignedStudents(),
        fetchPendingReviews(),
        fetchAllStudentEntries(),
        fetchSupervisorStats()
      ]);
    } catch (err: any) {
      console.error('Error marking student as cleared:', err);
      setError(err.message || 'Failed to mark student as cleared');
      throw err;
    }
  }, [isSupervisor, profile?.role, fetchAssignedStudents, fetchPendingReviews, fetchAllStudentEntries, fetchSupervisorStats]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    if (!isSupervisor) return;

    setIsLoading(true);
    try {
      await Promise.all([
        fetchAssignedStudents(),
        fetchPendingReviews(),
        fetchAllStudentEntries(),
        fetchSupervisorStats()
      ]);
    } catch (err) {
      console.error('Error refreshing supervisor data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isSupervisor, fetchAssignedStudents, fetchPendingReviews, fetchAllStudentEntries, fetchSupervisorStats]);

  // Initial data fetch
  useEffect(() => {
    if (isSupervisor && profile?.id) {
      refreshData();
    }
  }, [isSupervisor, profile?.id, refreshData]);

  return {
    assignedStudents,
    pendingReviews,
    allStudentEntries,
    supervisorStats,
    isLoading,
    error,
    fetchAssignedStudents,
    fetchPendingReviews,
    fetchAllStudentEntries,
    fetchSupervisorStats,
    reviewEntry,
    refreshData,
    getStudentsReadyForClearance,
    getAllAssignedStudentsWithClearance,
    markStudentAsCleared
  };
} 