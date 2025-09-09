import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import LogbookReports from "./pages/LogbookReports";
import Profile from "./pages/Profile";
import PrintClearanceForm from "./pages/PrintClearanceForm";
import Register from "./pages/Register";
import Placeholder from "./pages/Placeholder";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./hooks/use-auth";
import RouteGuard from "./components/RouteGuard";
import Login from "./pages/Login";
import { useAuth } from "./hooks/use-auth";
import { UserRole } from "./types/database.types";

// Development mode detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isMockMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

const queryClient = new QueryClient();

// For development convenience, redirect to dashboard instead of login
const DefaultRedirect = () => {
  if (isDevelopment && isMockMode) {
    // In development with missing env vars, go straight to dashboard
    return <Navigate to="/dashboard" />;
  }
  // In production or with proper env vars, go to login
  return <Navigate to="/login" />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Home redirects to dashboard or login based on environment */}
            <Route path="/" element={<DefaultRedirect />} />
            
            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <RouteGuard redirectTo="/login">
                  <Dashboard />
                </RouteGuard>
              }
            />
            <Route
              path="/logbook-reports"
              element={
                <RouteGuard redirectTo="/login">
                  <LogbookReports />
                </RouteGuard>
              }
            />
            <Route
              path="/print-clearance"
              element={
                <RouteGuard redirectTo="/login">
                  <PrintClearanceForm />
                </RouteGuard>
              }
            />
            <Route
              path="/profile"
              element={
                <RouteGuard redirectTo="/login">
                  <Profile />
                </RouteGuard>
              }
            />
            
            {/* Supervisor Routes */}
            <Route path="/supervisor/students" element={
              <RouteGuard allowedRoles={['supervisor_school', 'supervisor_industry', 'super_admin']} redirectTo="/login">
                <Placeholder title="Students List" description="View and manage your assigned students" />
              </RouteGuard>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin/users" element={
              <RouteGuard allowedRoles={['super_admin']} redirectTo="/login">
                <Placeholder title="User Management" description="Manage all users in the system" />
              </RouteGuard>
            } />
            <Route path="/admin/schools" element={
              <RouteGuard allowedRoles={['super_admin']} redirectTo="/login">
                <Placeholder title="Schools Management" description="Manage schools in the system" />
              </RouteGuard>
            } />
            <Route path="/admin/industries" element={
              <RouteGuard allowedRoles={['super_admin']} redirectTo="/login">
                <Placeholder title="Industries Management" description="Manage industry partners" />
              </RouteGuard>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
