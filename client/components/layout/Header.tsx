import { useState, ReactNode, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, ChevronDown, Menu, X } from "lucide-react";
import { useAuth } from "../../hooks/use-auth";
import { useNotifications } from "../../hooks/use-notifications";
import { supabase } from "../../lib/supabase/client";

interface NavItem {
  path: string;
  label: string;
  isActive?: boolean;
}

interface HeaderProps {
  activePath: string;
  logoSrc: string;
  userName?: string;
  userRole?: string;
}

export default function Header({ activePath, logoSrc, userName, userRole }: HeaderProps) {
  const { profile, user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [displayName, setDisplayName] = useState<string>('User');
  const [displayRole, setDisplayRole] = useState<string>('User');
  
  // Update last activity timestamp on user interaction
  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(Date.now());
    };
    
    // Monitor user activity
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);
    
    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, []);
  
  // Session recovery mechanism
  useEffect(() => {
    // Refresh session periodically to prevent session expiration
    const refreshInterval = setInterval(async () => {
      try {
        const now = Date.now();
        const inactiveTime = now - lastActivity;
        
        // Only refresh if user has been active in the last 10 minutes
        if (inactiveTime < 10 * 60 * 1000) {
          console.log('[Header] Refreshing session to prevent expiration');
          await supabase.auth.refreshSession();
        }
      } catch (error) {
        console.error('[Header] Error refreshing session:', error);
      }
    }, 10 * 60 * 1000); // 10 minutes interval
    
    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, [lastActivity]);

  // Update display name and role whenever profile or props change
  useEffect(() => {
    // Priority 1: Use props if provided (allows parent components to override)
    if (userName) {
      setDisplayName(userName);
    } 
    // Priority 2: Use profile from auth context if available
    else if (profile) {
      const fullName = [profile.first_name, profile.middle_name, profile.last_name]
        .filter(Boolean)
        .join(' ');
      setDisplayName(fullName || 'User');
    } 
    // Priority 3: Use email from user if available
    else if (user?.email) {
      setDisplayName(user.email.split('@')[0]);
    } 
    // Priority 4: Default fallback
    else {
      setDisplayName('User');
    }

    // Same priority logic for role
    if (userRole) {
      setDisplayRole(userRole);
    } else if (profile) {
      setDisplayRole(getRoleDisplayName(profile.role));
    } else {
      setDisplayRole('User');
    }
  }, [userName, userRole, profile, user]);

  const navItems: NavItem[] = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/logbook-reports", label: "Logbook Reports" },
    { path: "/print-clearance", label: "Print Clearance Form" },
    { path: "/profile", label: "Profile" },
  ];

  function getRoleDisplayName(role: string): string {
    switch (role) {
      case 'student':
        return 'Student';
      case 'supervisor_school':
        return 'School Supervisor';
      case 'supervisor_industry':
        return 'Industry Supervisor';
      case 'super_admin':
        return 'Super Admin';
      default:
        return 'User';
    }
  }

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId);
    setIsNotificationDropdownOpen(false);
  };

  return (
    <div className="sticky top-0 z-50">
      <header className="bg-figma-card border-b border-figma-border px-4 sm:px-8 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src={logoSrc}
              alt="Logo"
              className="w-16 h-16 sm:w-18 sm:h-18"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-10">
            {navItems.map((item) => {
              const isActive = item.path === activePath;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity"
                >
                  <span 
                    className={`font-poppins ${
                      isActive ? "font-bold text-black" : "font-medium text-figma-text-secondary"
                    } text-base`}
                  >
                    {item.label}
                  </span>
                  <div 
                    className={`${
                      isActive ? "bg-black" : "bg-transparent"
                    } h-1 rounded-full ${
                      isActive ? (item.label.length > 10 ? "w-36" : "w-24") : "w-5"
                    }`}
                  ></div>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* User Info - Desktop */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationDropdownOpen(!isNotificationDropdownOpen)}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Bell className="w-6 h-6 text-figma-text-primary" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {isNotificationDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg py-2 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                  </div>
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification.id)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-sm text-gray-900 mb-1">
                          {notification.title}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-500">
                      No notifications
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="w-9 h-9 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                {profile?.logo ? (
                  <img 
                    src={profile.logo}
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-gray-600">
                    {profile?.first_name?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              <div className="hidden xl:flex flex-col">
                <span className="font-poppins font-semibold text-sm text-figma-text-primary">
                  {displayName}
                </span>
                <span className="font-poppins text-xs text-figma-text-secondary">
                  {displayRole}
                </span>
              </div>
              <div className="relative group">
                <ChevronDown className="w-4 h-4 text-figma-text-secondary cursor-pointer" />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-figma-border pt-4">
            <nav className="flex flex-col gap-4">
              {navItems.map((item) => {
                const isActive = item.path === activePath;
                return isActive ? (
                  <span key={item.path} className="font-poppins font-bold text-base text-black py-2">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="font-poppins font-medium text-base text-figma-text-secondary py-2 hover:opacity-80 transition-opacity"
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-figma-border">
              <div className="w-9 h-9 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                {profile?.logo ? (
                  <img 
                    src={profile.logo}
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-gray-600">
                    {profile?.first_name?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-poppins font-semibold text-sm text-figma-text-primary">
                  {displayName}
                </span>
                <span className="font-poppins text-xs text-figma-text-secondary">
                  {displayRole}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
            >
              Sign Out
            </button>
          </div>
        )}
      </header>
    </div>
  );
} 