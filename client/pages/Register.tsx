import { useState } from "react";
import { ChevronDown, Eye, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSchools } from "../hooks/use-data";
import { useIndustries } from "../hooks/use-data";
import { AuthService, RegistrationData } from "../lib/services/auth.service";

type UserType = 'Student' | 'Institution-Based Supervisor' | 'Industry-Based Supervisor'; 

export default function Register() {
  const navigate = useNavigate();
  const { schools, isLoading: schoolsLoading, error: schoolsError } = useSchools();
  const { industries, isLoading: industriesLoading, error: industriesError } = useIndustries();
  
  const [selectedUserType, setSelectedUserType] = useState<UserType>('Student');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    institution: '',
    matricNumber: '',
    faculty: '',
    department: '',
    bankName: '',
    accountNumber: '',
    industryBasedSupervisor: '',
    institutionBasedSupervisor: '',
    industry: '',
    organization: '',
    position: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (!agreeToTerms) {
      setError('Please agree to the Terms and Privacy Policy');
      return false;
    }

    // User type specific validation
    if (selectedUserType === 'Student') {
      if (!formData.institution || !formData.matricNumber || !formData.faculty || !formData.department) {
        setError('Please fill in all required student fields');
        return false;
      }
    } else if (selectedUserType === 'Institution-Based Supervisor') {
      if (!formData.institution || !formData.faculty || !formData.department) {
        setError('Please fill in all required institution supervisor fields');
        return false;
      }
    } else if (selectedUserType === 'Industry-Based Supervisor') {
      if (!formData.organization || !formData.position) {
        setError('Please fill in all required industry supervisor fields');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const registrationData: RegistrationData = {
        email: formData.email,
        password: formData.password,
        userType: selectedUserType,
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        institution: formData.institution,
        matricNumber: formData.matricNumber,
        faculty: formData.faculty,
        department: formData.department,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        industryBasedSupervisor: formData.industryBasedSupervisor,
        institutionBasedSupervisor: formData.institutionBasedSupervisor,
        organization: formData.organization,
        industry: formData.industry,
        position: formData.position,
      };

      const result = await AuthService.registerUser(registrationData);

      if (result.success) {
        setSuccess(true);
        // Show success message for 2 seconds then redirect to login
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Registration successful! Please log in with your new account.' 
            } 
          });
        }, 2000);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const userTypeOptions: UserType[] = [
    'Student',
    'Institution-Based Supervisor', 
    'Industry-Based Supervisor'
  ];

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-gray-600">Your account has been created. Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
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

      {/* Registration Form */}
      <div className="flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-[1072px] bg-white rounded-[32px] border border-[#EDF3FC] shadow-[81px_232px_69px_0_rgba(0,0,0,0.00),52px_149px_63px_0_rgba(0,0,0,0.01),29px_84px_53px_0_rgba(0,0,0,0.05),13px_37px_39px_0_rgba(0,0,0,0.09),3px_9px_22px_0_rgba(0,0,0,0.10)] p-10">
          
          {/* Header */}
          <div className="flex flex-col items-center gap-6 mb-12">
            <h1 className="font-poppins text-2xl font-bold text-[#2D3C52] leading-[42px]">
              Create an account
            </h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Type Dropdown */}
            <div className="space-y-2">
              <label className="block font-poppins text-base text-[#61728C]">
                User Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedUserType}
                  onChange={(e) => setSelectedUserType(e.target.value as UserType)}
                  className="w-full px-4 py-3.5 rounded-lg border border-[#EDF3FC] bg-white text-[#2D3C52] font-poppins text-base appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/20"
                  disabled={isSubmitting}
                >
                  {userTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-[#141B34] pointer-events-none" />
              </div>
            </div>

            {/* First, Middle, Last Name Fields */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block font-poppins text-base text-[#61728C]">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Input your first name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full px-4 py-3.5 rounded-lg border border-[#EDF3FC] bg-white text-[#2D3C52] font-poppins text-base placeholder:text-[#2D3C52] placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-black/20"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block font-poppins text-base text-[#61728C]">
                  Middle Name <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Input your middle name"
                  value={formData.middleName}
                  onChange={(e) => handleInputChange('middleName', e.target.value)}
                  className="w-full px-4 py-3.5 rounded-lg border border-[#EDF3FC] bg-white text-[#2D3C52] font-poppins text-base placeholder:text-[#2D3C52] placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-black/20"
                  disabled={isSubmitting}
                />
              </div>
            <div className="space-y-2">
              <label className="block font-poppins text-base text-[#61728C]">
                  Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                  placeholder="Input your last name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="w-full px-4 py-3.5 rounded-lg border border-[#EDF3FC] bg-white text-[#2D3C52] font-poppins text-base placeholder:text-[#2D3C52] placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-black/20"
                  disabled={isSubmitting}
                  required
              />
              </div>
            </div>

            {/* Phone Number and Email */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-poppins text-base text-[#61728C]">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="Input your Phone number"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className="w-full px-4 py-3.5 rounded-lg border border-[#EDF3FC] bg-white text-[#2D3C52] font-poppins text-base placeholder:text-[#2D3C52] placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-black/20"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block font-poppins text-base text-[#61728C]">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="Input your email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3.5 rounded-lg border border-[#EDF3FC] bg-white text-[#2D3C52] font-poppins text-base placeholder:text-[#2D3C52] placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-black/20"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            {/* Conditional Fields Based on User Type */}
            {selectedUserType === 'Student' && (
              <>
                {/* Institution and Industry */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block font-poppins text-base text-[#61728C]">
                      Institution <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.institution}
                        onChange={(e) => handleInputChange('institution', e.target.value)}
                        className="w-full px-4 py-3.5 rounded-lg border border-[#EDF3FC] bg-white text-[#2D3C52] font-poppins text-base appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/20"
                        disabled={isSubmitting || schoolsLoading}
                        required
                      >
                        <option value="" className="text-[#2D3C52] opacity-50">Select your institution</option>
                        {schoolsLoading ? (
                          <option disabled>Loading schools...</option>
                        ) : schoolsError ? (
                          <option disabled>Error loading schools</option>
                        ) : (
                          schools.map((school) => (
                            <option key={school.id} value={school.id}>
                              {school.name}
                            </option>
                          ))
                        )}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-[#141B34] pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block font-poppins text-base text-[#61728C]">
                      Industry <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.industry}
                        onChange={(e) => handleInputChange('industry', e.target.value)}
                        className="w-full px-4 py-3.5 rounded-lg border border-[#EDF3FC] bg-white text-[#2D3C52] font-poppins text-base appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/20"
                        disabled={isSubmitting || industriesLoading}
                        required
                      >
                        <option value="" className="text-[#2D3C52] opacity-50">Select your industry</option>
                        {industriesLoading ? (
                          <option disabled>Loading industries...</option>
                        ) : industriesError ? (
                          <option disabled>Error loading industries</option>
                        ) : (
                          industries.map((industry) => (
                            <option key={industry.id} value={industry.id}>
                              {industry.name}
                            </option>
                          ))
                        )}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-[#141B34] pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Matric Number */}
                <div className="space-y-2">
                  <label className="block font-poppins text-base text-[#61728C]">
                    Matric Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Input your matric number"
                      value={formData.matricNumber}
                      onChange={(e) => handleInputChange('matricNumber', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-lg border border-[#EDF3FC] bg-white text-[#2D3C52] font-poppins text-base placeholder:text-[#2D3C52] placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-black/20"
                    disabled={isSubmitting}
                    required
                    />
                </div>

                {/* Faculty and Department */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block font-poppins text-base text-[#61728C]">
                      Faculty <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Select your faculty"
                      value={formData.faculty}
                      onChange={(e) => handleInputChange('faculty', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-lg border border-[#EDF3FC] bg-white text-[#2D3C52] font-poppins text-base placeholder:text-[#2D3C52] placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-black/20"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block font-poppins text-base text-[#61728C]">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Select your Department"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-lg border border-[#EDF3FC] bg-white text-[#2D3C52] font-poppins text-base placeholder:text-[#2D3C52] placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-black/20"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                {/* Bank Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block font-poppins text-base text-[#61728C]">
                      Name of Bank
                    </label>
                    <div className="relative">
                      <select
                        value={formData.bankName}
                        onChange={(e) => handleInputChange('bankName', e.target.value)}
                        className="w-full px-4 py-3.5 rounded-lg border border-[#EDF3FC] bg-white text-[#2D3C52] font-poppins text-base appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/20"
                        disabled={isSubmitting}
                      >
                        <option value="" className="text-[#2D3C52] opacity-50">Select your Bank</option>
                        <option value="First Bank">First Bank</option>
                        <option value="GTB">GTB</option>
                        <option value="Access Bank">Access Bank</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-[#141B34] pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block font-poppins text-base text-[#61728C]">
                      Account Number
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your account number"
                      value={formData.accountNumber}
                      onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-lg border border-[#EDF3FC] bg-white text-[#2D3C52] font-poppins text-base placeholder:text-[#2D3C52] placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-black/20"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Supervisor Fields */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block font-poppins text-base text-[#61728C]">
                      Industry Based Supervisor
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Supervisor ID"
                      value={formData.industryBasedSupervisor}
                      onChange={(e) => handleInputChange('industryBasedSupervisor', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-lg border border-[#EDF3FC] bg-white text-[#2D3C52] font-poppins text-base placeholder:text-[#2D3C52] placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-black/20"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block font-poppins text-base text-[#61728C]">
                      Institution Based Supervisor
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Supervisor ID"
                      value={formData.institutionBasedSupervisor}
                      onChange={(e) => handleInputChange('institutionBasedSupervisor', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-lg border border-[#EDF3FC] bg-white text-[#2D3C52] font-poppins text-base placeholder:text-[#2D3C52] placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-black/20"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </>
            )}

            {selectedUserType === 'Institution-Based Supervisor' && (
              <>
                {/* Institution and Faculty */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block font-poppins text-base text-[#61728C]">
                      Institution <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.institution}
                        onChange={(e) => handleInputChange('institution', e.target.value)}
                        className="w-full px-4 py-3.5 rounded-lg border border-[#EDF3FC] bg-white text-[#2D3C52] font-poppins text-base appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/20"
                        disabled={isSubmitting || schoolsLoading}
                        required
                      >
                        <option value="" className="text-[#2D3C52] opacity-50">Select your Institution</option>
                        {schoolsLoading ? (
                          <option disabled>Loading schools...</option>
                        ) : schoolsError ? (
                          <option disabled>Error loading schools</option>
                        ) : (
                          schools.map((school) => (
                            <option key={school.id} value={school.id}>
                              {school.name}
                            </option>
                          ))
                        )}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-[#141B34] pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block font-poppins text-base text-[#61728C]">
                      Faculty <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Input your Faculty"
                      value={formData.faculty}
                      onChange={(e) => handleInputChange('faculty', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-lg border border-[#EDF3FC] bg-white text-[#2D3C52] font-poppins text-base placeholder:text-[#2D3C52] placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-black/20"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                {/* Department and Position */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block font-poppins text-base text-[#61728C]">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Input your Department"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-lg border border-[#EDF3FC] bg-white text-[#2D3C52] font-poppins text-base placeholder:text-[#2D3C52] placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-black/20"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block font-poppins text-base text-[#61728C]">
                      Position
                    </label>
                    <input
                      type="text"
                      placeholder="Input your position"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-lg border border-[#EDF3FC] bg-white text-[#2D3C52] font-poppins text-base placeholder:text-[#2D3C52] placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-black/20"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </>
            )}

            {selectedUserType === 'Industry-Based Supervisor' && (
              <>
                {/* Organization and Position */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block font-poppins text-base text-[#61728C]">
                      Organization <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.organization}
                        onChange={(e) => handleInputChange('organization', e.target.value)}
                        className="w-full px-4 py-3.5 rounded-lg border border-[#EDF3FC] bg-white text-[#2D3C52] font-poppins text-base appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/20"
                        disabled={isSubmitting || industriesLoading}
                        required
                      >
                        <option value="" className="text-[#2D3C52] opacity-50">select your company</option>
                        {industriesLoading ? (
                          <option disabled>Loading industries...</option>
                        ) : industriesError ? (
                          <option disabled>Error loading industries</option>
                        ) : (
                          industries.map((industry) => (
                            <option key={industry.id} value={industry.id}>
                              {industry.name}
                            </option>
                          ))
                        )}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-[#141B34] pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block font-poppins text-base text-[#61728C]">
                      Position <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Input your position"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-lg border border-[#EDF3FC] bg-white text-[#2D3C52] font-poppins text-base placeholder:text-[#2D3C52] placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-black/20"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Password Fields */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block font-poppins text-base text-[#61728C]">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-4 py-3.5 pr-12 rounded-lg border border-[#EDF3FC] bg-white text-[#2D3C52] font-poppins text-base placeholder:text-[#2D3C52] placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-black/20"
                    disabled={isSubmitting}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2"
                    disabled={isSubmitting}
                  >
                    <Eye className="w-5 h-5 text-[#202124]" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block font-poppins text-base text-[#61728C]">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="enter your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full px-4 py-3.5 pr-12 rounded-lg border border-[#EDF3FC] bg-white text-[#2D3C52] font-poppins text-base placeholder:text-[#2D3C52] placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-black/20"
                    disabled={isSubmitting}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2"
                    disabled={isSubmitting}
                  >
                    <Eye className="w-5 h-5 text-[#202124]" />
                  </button>
                </div>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="w-6 h-6 rounded border border-[#EDF3FC] focus:outline-none focus:ring-2 focus:ring-black/20"
                disabled={isSubmitting}
                required
              />
              <label className="font-poppins text-base text-[#61728C]">
                I agree to the Terms and Privacy Policy <span className="text-red-500">*</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full h-16 bg-black text-white font-poppins text-base rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Register'
              )}
            </button>

            {/* Sign In Link */}
            <div className="text-center">
              <span className="font-poppins text-base text-[#61728C]">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-[#2D3C52] hover:underline">
                  Sign In
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
