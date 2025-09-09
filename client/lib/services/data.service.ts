import { supabase } from "../supabase/client";

export interface School {
  id: string;
  name: string;
  logo?: string;
  location?: string;
}

export interface Industry {
  id: string;
  name: string;
  location?: string;
  niche?: string;
  status?: string;
}

export const DataService = {
  async fetchSchools(): Promise<{ data: School[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error("Error fetching schools:", error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error("Unexpected error fetching schools:", error);
      return { data: null, error: error as Error };
    }
  },

  async fetchIndustries(): Promise<{ data: Industry[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('industries')
        .select('id, name, location, niche')
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error("Error fetching industries:", error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error("Unexpected error fetching industries:", error);
      return { data: null, error: error as Error };
    }
  },

  // Mock implementation for development without Supabase
  mockFetchSchools(): Promise<{ data: School[] | null; error: Error | null }> {
    return Promise.resolve({
      data: [
        { id: '1', name: 'Federal University of Technology, Akure', location: 'Akure, Ondo State' },
        { id: '2', name: 'University of Lagos', location: 'Lagos' },
        { id: '3', name: 'University of Ibadan', location: 'Ibadan, Oyo State' },
        { id: '4', name: 'Obafemi Awolowo University', location: 'Ile-Ife, Osun State' },
        { id: '5', name: 'Federal University of Technology, Minna', location: 'Minna, Niger State' }
      ],
      error: null
    });
  },

  mockFetchIndustries(): Promise<{ data: Industry[] | null; error: Error | null }> {
    return Promise.resolve({
      data: [
        { id: '1', name: 'TechNova Solutions Ltd', location: 'Lagos', niche: 'Technology' },
        { id: '2', name: 'Softworks Nigeria Ltd', location: 'Abuja', niche: 'Software Development' },
        { id: '3', name: 'Global Systems Ltd', location: 'Port Harcourt', niche: 'IT Consulting' },
        { id: '4', name: 'DataTrust Technologies', location: 'Kano', niche: 'Data Analytics' },
        { id: '5', name: 'WebSphere Solutions', location: 'Enugu', niche: 'Web Development' }
      ],
      error: null
    });
  }
} 