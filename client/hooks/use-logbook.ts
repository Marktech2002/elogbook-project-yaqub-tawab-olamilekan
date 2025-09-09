import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { LogbookService } from '../lib/services/logbook.service';
import { LogbookEntry, LogbookStatus } from '../types/database.types';

interface LogbookFilters {
  page?: number;
  limit?: number;
  status?: LogbookStatus;
  searchQuery?: string;
}

interface LogbookStats {
  total: number;
  approved: number;
  pending: number;
  draft: number;
}

export function useLogbook() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<LogbookEntry[]>([]);
  const [stats, setStats] = useState<LogbookStats>({
    total: 0,
    approved: 0,
    pending: 0,
    draft: 0
  });
  
  // Fetch logbook entries
  const fetchEntries = useCallback(async () => {
    if (!user) {
      setError('User not authenticated');
      return [];
    }

    setError(null);
    setIsLoading(true);
    try {
      console.log('Fetching logbook entries for user:', user.id);
      const entries = await LogbookService.getLogbookEntries(user.id);
      setEntries(entries);
      return entries;
    } catch (err: any) {
      console.error('Error fetching logbook entries:', err);
      setError(err.message || 'Failed to fetch logbook entries');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch logbook statistics
  const fetchStats = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      console.log('Fetching logbook stats for user:', user.id);
      const stats = await LogbookService.getLogbookStats(user.id);
      setStats(stats);
    } catch (err: any) {
      console.error('Error fetching logbook stats:', err);
    }
  }, [user]);

  // Initial data fetch
  useEffect(() => {
    if (user) {
      fetchEntries();
      fetchStats();
    }
  }, [user, fetchEntries, fetchStats]);
  
  const getLogbookEntries = async () => {
    return entries;
  };

  const getLogbookEntriesPaginated = async (filters: LogbookFilters = {}) => {
    if (!user) {
      setError('User not authenticated');
      return {
        data: [],
        count: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };
    }

    setError(null);
    setIsLoading(true);
    try {
      const result = await LogbookService.getLogbookEntriesPaginated(user.id, filters);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch logbook entries');
      return {
        data: [],
        count: 0,
        page: filters.page || 1,
        limit: filters.limit || 10,
        totalPages: 0,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const getLogbookEntryById = async (id: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const entry = await LogbookService.getLogbookEntryById(id);
      return entry;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch logbook entry');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const createLogbookEntry = async (entry: Omit<LogbookEntry, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    setError(null);
    setIsLoading(true);
    try {
      // Make sure student_id is set to current user
      const entryWithUserId = {
        ...entry,
        student_id: user.id,
      };
      
      const newEntry = await LogbookService.createLogbookEntry(entryWithUserId);
      
      // Refresh entries and stats after creating a new entry
      await fetchEntries();
      await fetchStats();
      
      return newEntry;
    } catch (err: any) {
      setError(err.message || 'Failed to create logbook entry');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateLogbookEntry = async (
    id: string,
    updates: Partial<Omit<LogbookEntry, 'id' | 'created_at' | 'updated_at'>>,
  ) => {
    setError(null);
    setIsLoading(true);
    try {
      const updatedEntry = await LogbookService.updateLogbookEntry(id, updates);
      
      // Refresh entries and stats after update
      await fetchEntries();
      await fetchStats();
      
      return updatedEntry;
    } catch (err: any) {
      setError(err.message || 'Failed to update logbook entry');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLogbookEntry = async (id: string) => {
    setError(null);
    setIsLoading(true);
    try {
      await LogbookService.deleteLogbookEntry(id);
      
      // Refresh entries and stats after deletion
      await fetchEntries();
      await fetchStats();
      
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to delete logbook entry');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateLogbookStatus = async (id: string, status: LogbookStatus, comments?: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const updatedEntry = await LogbookService.updateLogbookStatus(id, status, comments);
      
      // Refresh entries and stats after status update
      await fetchEntries();
      await fetchStats();
      
      return updatedEntry;
    } catch (err: any) {
      setError(err.message || 'Failed to update logbook status');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to manually refresh data
  const refreshData = async () => {
    await fetchEntries();
    await fetchStats();
  };

  return {
    isLoading,
    error,
    entries,
    stats,
    refreshData,
    getLogbookEntries,
    getLogbookEntriesPaginated,
    getLogbookEntryById,
    createLogbookEntry,
    updateLogbookEntry,
    deleteLogbookEntry,
    updateLogbookStatus,
  };
} 