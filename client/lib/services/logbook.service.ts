import { supabase } from '../supabase/client';
import { LogbookEntry, LogbookStatus } from '../../types/database.types';

const isMockMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

// Cache for logbook entries and stats to reduce database calls
const cache = {
  entries: new Map<string, { data: LogbookEntry[], timestamp: number }>(),
  stats: new Map<string, { data: any, timestamp: number }>(),
  // Cache expiration time: 30 seconds
  expirationTime: 30 * 1000
};

// Mock data for development
const mockEntries: LogbookEntry[] = [
  {
    id: '1',
    student_id: 'mock-user-id',
    date: '2025-08-15',
    day_name: 'monday',
    title: 'Database Design',
    task_done: 'Created ERD and implemented database schema for the project.',
    status: 'approved',
    comments_from_supervisor: 'Good job on the database design. The relationships are well structured.',
    created_at: '2025-08-15T10:00:00Z',
    updated_at: '2025-08-15T10:00:00Z'
  },
  {
    id: '2',
    student_id: 'mock-user-id',
    date: '2025-08-14',
    day_name: 'tuesday',
    title: 'API Development',
    task_done: 'Implemented RESTful API endpoints for user authentication.',
    status: 'approved',
    comments_from_supervisor: 'The API endpoints are well documented and follow best practices.',
    created_at: '2025-08-14T10:00:00Z',
    updated_at: '2025-08-14T10:00:00Z'
  },
  {
    id: '3',
    student_id: 'mock-user-id',
    date: '2025-08-13',
    day_name: 'wednesday',
    title: 'Frontend Development',
    task_done: 'Created responsive UI components using React and Tailwind CSS.',
    status: 'pending',
    created_at: '2025-08-13T10:00:00Z',
    updated_at: '2025-08-13T10:00:00Z'
  },
  {
    id: '4',
    student_id: 'mock-user-id',
    date: '2025-08-12',
    day_name: 'thursday',
    title: 'Testing',
    task_done: 'Wrote unit tests for backend services using Jest.',
    status: 'draft',
    created_at: '2025-08-12T10:00:00Z',
    updated_at: '2025-08-12T10:00:00Z'
  },
  {
    id: '5',
    student_id: 'mock-user-id',
    date: '2025-08-11',
    day_name: 'friday',
    title: 'Testing and Debugging',
    task_done: 'Performed unit testing and fixed bugs in the application.',
    status: 'pending',
    created_at: '2025-08-11T10:00:00Z',
    updated_at: '2025-08-11T10:00:00Z'
  }
];

export const LogbookService = {
  getLogbookEntries: async (userId: string): Promise<LogbookEntry[]> => {
    // Check cache first
    const cachedData = cache.entries.get(userId);
    const now = Date.now();
    
    if (cachedData && (now - cachedData.timestamp < cache.expirationTime)) {
      console.log('Using cached logbook entries');
      return cachedData.data;
    }
    
    if (isMockMode) {
      console.log('DEV MODE: Returning mock logbook entries');
      // Update cache
      cache.entries.set(userId, { data: mockEntries, timestamp: now });
      return mockEntries;
    }

    try {
      console.log('Fetching logbook entries from database');
      const { data, error } = await supabase
        .from('logbook')
        .select('*')
        .eq('student_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching logbook entries:', error);
        throw error;
      }

      // Update cache
      cache.entries.set(userId, { data: data as LogbookEntry[], timestamp: now });
      return data as LogbookEntry[];
    } catch (err) {
      console.error('Error in getLogbookEntries:', err);
      throw err;
    }
  },

  getLogbookEntriesPaginated: async (userId: string, filters: any = {}) => {
    const { page = 1, limit = 10, status, searchQuery } = filters;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    if (isMockMode) {
      console.log('DEV MODE: Returning mock paginated logbook entries');
      let filtered = [...mockEntries];

      if (status) {
        filtered = filtered.filter(entry => entry.status === status);
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(entry => 
          entry.title.toLowerCase().includes(query) || 
          entry.task_done.toLowerCase().includes(query)
        );
      }

      const paginatedData = filtered.slice(from, to + 1);
      return {
        data: paginatedData,
        count: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit)
      };
    }

    try {
      let query = supabase
        .from('logbook')
        .select('*', { count: 'exact' })
        .eq('student_id', userId);

      if (status) {
        query = query.eq('status', status);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,task_done.ilike.%${searchQuery}%`);
      }

      const { data, error, count } = await query
        .order('date', { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      return {
        data: data as LogbookEntry[],
        count: count || 0,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0
      };
    } catch (err) {
      console.error('Error in getLogbookEntriesPaginated:', err);
      throw err;
    }
  },

  getLogbookEntryById: async (id: string): Promise<LogbookEntry | null> => {
    if (isMockMode) {
      console.log('DEV MODE: Returning mock logbook entry by ID');
      const entry = mockEntries.find(entry => entry.id === id);
      return entry || null;
    }

    try {
      const { data, error } = await supabase
        .from('logbook')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data as LogbookEntry;
    } catch (err) {
      console.error('Error in getLogbookEntryById:', err);
      throw err;
    }
  },

  createLogbookEntry: async (entry: Omit<LogbookEntry, 'id' | 'created_at' | 'updated_at'>) => {
    if (isMockMode) {
      console.log('DEV MODE: Creating mock logbook entry');
      const newEntry: LogbookEntry = {
        id: `mock-${Date.now()}`,
        ...entry,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockEntries.unshift(newEntry);
      
      // Invalidate cache
      cache.entries.delete(entry.student_id);
      cache.stats.delete(entry.student_id);
      
      return newEntry;
    }

    try {
      console.log('Creating logbook entry in Supabase:', entry);
      
      const entryData = {
        ...entry,
        media_url: Array.isArray(entry.media_url) ? entry.media_url : 
                  (entry.media_url ? [entry.media_url] : null)
      };
      
      const { data, error } = await supabase
        .from('logbook')
        .insert([entryData])
        .select();

      if (error) {
        console.error('Supabase error creating logbook entry:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error('No data returned after insert');
        throw new Error('Failed to create logbook entry - no data returned');
      }
      
      // Invalidate cache
      cache.entries.delete(entry.student_id);
      cache.stats.delete(entry.student_id);
      
      console.log('Successfully created logbook entry:', data[0]);
      return data[0] as LogbookEntry;
    } catch (err) {
      console.error('Error in createLogbookEntry:', err);
      throw err;
    }
  },

  updateLogbookEntry: async (id: string, updates: Partial<Omit<LogbookEntry, 'id' | 'created_at' | 'updated_at'>>) => {
    if (isMockMode) {
      console.log('DEV MODE: Updating mock logbook entry');
      const index = mockEntries.findIndex(entry => entry.id === id);
      if (index !== -1) {
        mockEntries[index] = {
          ...mockEntries[index],
          ...updates,
          updated_at: new Date().toISOString()
        };
        
        // Invalidate cache
        cache.entries.delete(mockEntries[index].student_id);
        cache.stats.delete(mockEntries[index].student_id);
        
        return mockEntries[index];
      }
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('logbook')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }
      
      // Invalidate cache for this user
      if (data) {
        cache.entries.delete(data.student_id);
        cache.stats.delete(data.student_id);
      }

      return data as LogbookEntry;
    } catch (err) {
      console.error('Error in updateLogbookEntry:', err);
      throw err;
    }
  },

  deleteLogbookEntry: async (id: string) => {
    if (isMockMode) {
      console.log('DEV MODE: Deleting mock logbook entry');
      const index = mockEntries.findIndex(entry => entry.id === id);
      if (index !== -1) {
        const studentId = mockEntries[index].student_id;
        mockEntries.splice(index, 1);
        
        // Invalidate cache
        cache.entries.delete(studentId);
        cache.stats.delete(studentId);
      }
      return;
    }

    try {
      // First get the entry to know which user's cache to invalidate
      const { data: entryData } = await supabase
        .from('logbook')
        .select('student_id')
        .eq('id', id)
        .single();
        
      const { error } = await supabase
        .from('logbook')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
      
      // Invalidate cache
      if (entryData) {
        cache.entries.delete(entryData.student_id);
        cache.stats.delete(entryData.student_id);
      }
    } catch (err) {
      console.error('Error in deleteLogbookEntry:', err);
      throw err;
    }
  },

  updateLogbookStatus: async (id: string, status: LogbookStatus, comments?: string) => {
    if (isMockMode) {
      console.log('DEV MODE: Updating mock logbook status');
      const index = mockEntries.findIndex(entry => entry.id === id);
      if (index !== -1) {
        mockEntries[index] = {
          ...mockEntries[index],
          status,
          comments_from_supervisor: comments || mockEntries[index].comments_from_supervisor,
          updated_at: new Date().toISOString()
        };
        
        // Invalidate cache
        cache.entries.delete(mockEntries[index].student_id);
        cache.stats.delete(mockEntries[index].student_id);
        
        return mockEntries[index];
      }
      return null;
    }

    try {
      const updates: any = { status };
      if (comments !== undefined) {
        updates.comments_from_supervisor = comments;
      }

      const { data, error } = await supabase
        .from('logbook')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }
      
      // Invalidate cache
      if (data) {
        cache.entries.delete(data.student_id);
        cache.stats.delete(data.student_id);
      }

      return data as LogbookEntry;
    } catch (err) {
      console.error('Error in updateLogbookStatus:', err);
      throw err;
    }
  },

  getLogbookStats: async (userId: string) => {
    // Check cache first
    const cachedStats = cache.stats.get(userId);
    const now = Date.now();
    
    if (cachedStats && (now - cachedStats.timestamp < cache.expirationTime)) {
      console.log('Using cached logbook stats');
      return cachedStats.data;
    }
    
    if (isMockMode) {
      console.log('DEV MODE: Returning mock logbook stats');
      const stats = {
        total: mockEntries.length,
        approved: mockEntries.filter(entry => entry.status === 'approved').length,
        pending: mockEntries.filter(entry => entry.status === 'pending').length,
        draft: mockEntries.filter(entry => entry.status === 'draft').length,
      };
      
      // Update cache
      cache.stats.set(userId, { data: stats, timestamp: now });
      return stats;
    }

    try {
      console.log('Fetching logbook stats from database');
      const { data, error } = await supabase
        .from('logbook')
        .select('status')
        .eq('student_id', userId);

      if (error) {
        throw error;
      }

      const entries = data as { status: LogbookStatus }[];
      const stats = {
        total: entries.length,
        approved: entries.filter((entry) => entry.status === 'approved').length,
        pending: entries.filter((entry) => entry.status === 'pending').length,
        draft: entries.filter((entry) => entry.status === 'draft').length,
      };
      
      // Update cache
      cache.stats.set(userId, { data: stats, timestamp: now });
      return stats;
    } catch (err) {
      console.error('Error in getLogbookStats:', err);
      throw err;
    }
  },
}; 