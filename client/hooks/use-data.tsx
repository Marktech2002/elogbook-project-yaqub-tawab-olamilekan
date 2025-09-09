import { useState, useEffect } from 'react';
import { DataService, School, Industry } from '../lib/services/data.service';

export function useSchools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSchools = async () => {
      setIsLoading(true);
      
      // Check if we're in development mock mode
      const isMockMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      try {
        const response = isMockMode 
          ? await DataService.mockFetchSchools()
          : await DataService.fetchSchools();

        if (response.error) {
          setError(response.error);
        } else {
          setSchools(response.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchools();
  }, []);

  return { schools, isLoading, error };
}

export function useIndustries() {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchIndustries = async () => {
      setIsLoading(true);
      
      // Check if we're in development mock mode
      const isMockMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      try {
        const response = isMockMode 
          ? await DataService.mockFetchIndustries()
          : await DataService.fetchIndustries();

        if (response.error) {
          setError(response.error);
        } else {
          setIndustries(response.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchIndustries();
  }, []);

  return { industries, isLoading, error };
} 