import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import { Eye, EyeOff, Mail, Lock, ChevronDown, UserRound, GraduationCap, Briefcase, Check } from "lucide-react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

type UserType = 'student' | 'industry_supervisor' | 'school_supervisor';

interface UserTypeOption {
  id: UserType;
  label: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const { login, isLoading, isAuthenticating } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({ email: "", password: "" });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType>('student');
  const [showUserTypeDropdown, setShowUserTypeDropdown] = useState(false);

  // User type options with icons and titles
  const userTypeOptions: UserTypeOption[] = [
    {
      id: 'student',
      label: 'Student',
      icon: <GraduationCap className="w-5 h-5" />,
      title: 'Student Login',
      subtitle: 'Log your daily tasks and get supervisor feedback easily.'
    },
    {
      id: 'industry_supervisor',
      label: 'Industry Supervisor',
      icon: <Briefcase className="w-5 h-5" />,
      title: 'Industry Supervisor Login',
      subtitle: 'Log in to oversee student placements & access logbook reports.'
    },
    {
      id: 'school_supervisor',
      label: 'School Supervisor',
      icon: <UserRound className="w-5 h-5" />,
      title: 'School Supervisor Login',
      subtitle: 'Log in to oversee student placements & access logbook reports.'
    }
  ];

  // Get the current selected user type option
  const currentUserType = userTypeOptions.find(option => option.id === userType) || userTypeOptions[0];

  // Determine where to redirect after login
  const from = location.state?.from?.pathname || "/";

  const validateField = (name: keyof LoginFormData, value: string) => {
    try {
      loginSchema.shape[name].parse(value);
      setErrors((prev) => ({ ...prev, [name]: undefined }));
      return true;
    } catch (error: any) {
      const errorMessage = error.errors?.[0]?.message || "Invalid input";
      setErrors((prev) => ({ ...prev, [name]: errorMessage }));
      return false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name as keyof LoginFormData, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Validate all fields
    let isValid = true;
    Object.entries(formData).forEach(([key, value]) => {
      if (!validateField(key as keyof LoginFormData, value)) {
        isValid = false;
      }
    });

    if (!isValid) return;

    try {
      // Login with the selected user type
      const { error } = await login(formData.email, formData.password);
      if (error) {
        setServerError(error.message || "Login failed. Please check your credentials.");
        return;
      }
      
      // Redirect to dashboard after successful login
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setServerError(err.message || "An unexpected error occurred.");
    }
  };

  return (
    <>
      {/* Top Navigation */}
      {/* TODO Remove the scrollbar */}
      <div className="sticky top-0 z-50 no-scrollbar">
        <header className="bg-white shadow-[0_4px_40px_0_rgba(0,0,0,0.10)] px-6 sm:px-12 py-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <img 
                src="https://api.builder.io/api/v1/image/assets/TEMP/06a5fef2d74d4e97ef25d5fa5c379c9ecbdcc43a?width=144" 
                alt="Logo" 
                className="w-18 h-[71px]"
              />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <Link to="/" className="font-roboto text-base text-[#61728C] hover:opacity-80 transition-opacity">
                Home
              </Link>
              <div className="flex items-center gap-1">
                <span className="font-roboto font-bold text-base text-[#15120D]">Logbook Report</span>
                <ChevronDown className="w-4 h-4 text-[#141B34]" />
              </div>
              <div className="flex items-center gap-1">
                <span className="font-roboto text-base text-[#61728C]">Institutions</span>
                <ChevronDown className="w-4 h-4 text-[#141B34]" />
              </div>
              <div className="flex items-center gap-1">
                <span className="font-roboto text-base text-[#61728C]">Employers</span>
                <ChevronDown className="w-4 h-4 text-[#141B34]" />
              </div>
              <span className="font-roboto text-base text-[#61728C]">Resources</span>
              <span className="font-roboto text-base text-[#61728C]">About</span>
            </nav>

            {/* Contact Button */}
            <div className="flex items-center">
              <button className="bg-black text-white px-6 py-3 rounded-2xl font-roboto text-base hover:bg-gray-800 transition-colors">
                Contact us
              </button>
            </div>
          </div>
        </header>
      </div>

      <div className="min-h-screen flex items-center justify-center bg-figma-bg">
        <div className="bg-figma-card rounded-2xl shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center items-center mb-4">
              <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center">
                {currentUserType.icon}
              </div>
            </div>
            <h2 className="text-2xl font-bold text-figma-text-primary">{currentUserType.title}</h2>
            <p className="text-sm text-figma-text-secondary mt-2">
              {currentUserType.subtitle}
            </p>
          </div>

          {serverError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-6">
              {serverError}
            </div>
          )}
          
          {/* User Type Selector */}
          <div className="mb-6 relative">
            <label className="block text-sm font-medium text-figma-text-primary mb-2">
              Login As
            </label>
            <div 
              onClick={() => setShowUserTypeDropdown(!showUserTypeDropdown)}
              className="w-full px-4 py-3 border border-figma-border rounded-lg flex justify-between items-center cursor-pointer hover:border-gray-400 transition-colors"
            >
              <div className="flex items-center gap-3">
                {currentUserType.icon}
                <span className="text-figma-text-primary">{currentUserType.label}</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showUserTypeDropdown ? 'transform rotate-180' : ''}`} />
            </div>
            
            {showUserTypeDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                {userTypeOptions.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => {
                      setUserType(option.id);
                      setShowUserTypeDropdown(false);
                    }}
                    className="px-4 py-2 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {option.icon}
                      <span className="text-figma-text-primary">{option.label}</span>
                    </div>
                    {option.id === userType && (
                      <Check className="w-4 h-4 text-black" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-figma-text-primary mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${
                    errors.email ? "border-red-500" : "border-figma-border"
                  } rounded-lg focus:outline-none focus:border-black transition-colors`}
                  disabled={isLoading || isAuthenticating}
                />
                <Mail className="absolute right-3 top-3.5 w-5 h-5 text-figma-text-muted" />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-figma-text-primary mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${
                    errors.password ? "border-red-500" : "border-figma-border"
                  } rounded-lg focus:outline-none focus:border-black transition-colors`}
                  disabled={isLoading || isAuthenticating}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-figma-text-muted" />
                  ) : (
                    <Eye className="w-5 h-5 text-figma-text-muted" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-black border-figma-border rounded focus:ring-black"
                  disabled={isLoading || isAuthenticating}
                />
                <span className="ml-2 text-sm text-figma-text-secondary">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-black hover:underline">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-900 transition-colors flex justify-center"
              disabled={isLoading || isAuthenticating}
            >
              {isLoading || isAuthenticating ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-figma-text-secondary">
            Don't have an account?{" "}
            <Link to="/register" className="text-black font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </>
  );
} 