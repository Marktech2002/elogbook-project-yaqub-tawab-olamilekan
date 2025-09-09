import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { UserRole } from '../types/database.types';

interface RouteGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

// Check if we're in development mode without proper env vars
const isDevelopment = process.env.NODE_ENV === 'development';
const isMockMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * A component to protect routes based on authentication and user roles
 * @param children - The components to render if the user is authenticated
 * @param allowedRoles - Optional array of roles that are allowed to access the route
 * @param redirectTo - Optional redirect path (defaults to '/')
 */
export default function RouteGuard({
  children,
  allowedRoles,
  redirectTo = '/',
}: RouteGuardProps) {
  const { user, profile, isLoading, error } = useAuth();

  // Debug logging
  console.log('[RouteGuard] State:', { 
    isLoading, 
    hasUser: !!user, 
    hasProfile: !!profile,
    userEmail: user?.email,
    profileRole: profile?.role,
    error,
    isMockMode,
    isDevelopment 
  });

  // Show loading spinner while auth is being resolved
  if (isLoading) {
    console.log('[RouteGuard] Still loading auth state');
    return (
      <div className="flex items-center justify-center min-h-screen bg-figma-bg">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-figma-text-secondary">Checking authentication...</p>
          <p className="text-xs text-figma-text-secondary mt-2">
            {/* Mock: {isMockMode ? 'Yes' : 'No'} | Dev: {isDevelopment ? 'Yes' : 'No'} */}
          </p>
        </div>
      </div>
    );
  }

  // In development mock mode, allow access to all routes
  if (isDevelopment && isMockMode) {
    console.log('[RouteGuard] Mock mode - allowing access');
    return <>{children}</>;
  }

  // No user is signed in, redirect to login
  if (!user) {
    console.log('[RouteGuard] No user found, redirecting to:', redirectTo);
    return <Navigate to={redirectTo} replace />;
  }

  // If roles are specified, check if user has required role
  if (allowedRoles && allowedRoles.length > 0) {
    if (!profile) {
      console.log('[RouteGuard] User exists but profile not loaded yet');
      return (
        <div className="flex items-center justify-center min-h-screen bg-figma-bg">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-figma-text-secondary">Loading profile...</p>
          </div>
        </div>
      );
    }
    
    if (!allowedRoles.includes(profile.role)) {
      console.log(`[RouteGuard] User role ${profile.role} not in allowed roles:`, allowedRoles);
      return <Navigate to="/dashboard" replace />;
    }
  }

  // User is authenticated and has required role, render children
  console.log('[RouteGuard] Access granted - rendering children');
  return <>{children}</>;
}