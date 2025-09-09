import { Bell, ChevronDown, Loader2, Users, Building2, GraduationCap, FileText, CheckCircle2, Clock, Upload, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import Header from "../components/layout/Header";
import { useAuth } from "../hooks/use-auth";
import { useSupervisor } from "../hooks/use-supervisor";
import clearanceService from "../lib/services/clearance.service";
import { UploadService } from "../lib/services/upload.service";
import { supabase } from "../lib/supabase/client";

export default function Profile() {
  const { profile, user, updateProfile } = useAuth();
  const { 
    assignedStudents, 
    allStudentEntries, 
    supervisorStats,
    isLoading: supervisorLoading 
  } = useSupervisor();
  
  const [isLoading, setIsLoading] = useState(true);
  const [clearanceData, setClearanceData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [logoUploadSuccess, setLogoUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine if user is a supervisor
  const isSupervisor = profile?.role === 'supervisor_school' || profile?.role === 'supervisor_industry';
  const isIndustrySupervisor = profile?.role === 'supervisor_industry';

  // Fetch clearance data when component mounts (only for students)
  useEffect(() => {
    const fetchClearanceData = async () => {
      if (!profile?.id || isSupervisor) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await clearanceService.getClearanceData(profile.id);
        setClearanceData(data);
      } catch (err: any) {
        console.error('Error fetching clearance data:', err);
        setError(err.message || 'Failed to fetch profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClearanceData();
  }, [profile?.id, isSupervisor]);

  // Get user display info
  const getUserFullName = () => {
    if (!profile) return 'User';
    const { first_name, middle_name, last_name } = profile;
    return [first_name, middle_name, last_name].filter(Boolean).join(' ');
  };

  const getUserRole = () => {
    if (!profile) return 'User';
    return profile.role === 'student' ? 'Student' : 
           profile.role === 'supervisor_school' ? 'School Supervisor' : 
           'Industry Supervisor';
  };

  // Calculate supervisor statistics
  const getSupervisorStats = () => {
    if (!supervisorStats) return null;
    
    const totalStudents = assignedStudents.length;
    const pendingReviews = allStudentEntries.filter(entry => entry.status === 'pending').length;
    const approvedEntries = allStudentEntries.filter(entry => entry.status === 'approved').length;
    const completionRate = totalStudents > 0 ? Math.round((approvedEntries / Math.max(allStudentEntries.length, 1)) * 100) : 0;
    
    return {
      totalStudents,
      pendingReviews,
      approvedEntries,
      completionRate
    };
  };

  // Handle logo file selection
  const handleLogoFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadLogo(file);
    }
  };

  // Upload logo to Cloudinary and update profile
  const uploadLogo = async (file: File) => {
    if (!profile?.id) return;

    setIsUploadingLogo(true);
    setLogoUploadError(null);
    setLogoUploadSuccess(false);

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Upload to Cloudinary
      const uploadResult = await UploadService.uploadImage(file);
      
      // Update user profile in database
      const { error: updateError } = await supabase
        .from('user_profile')
        .update({ logo: uploadResult.url })
        .eq('id', profile.id);

      if (updateError) {
        throw new Error('Failed to update profile');
      }

      // Update local profile state using the auth context
      await updateProfile({ logo: uploadResult.url });
      
      setLogoUploadSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setLogoUploadSuccess(false);
      }, 3000);
      
    } catch (err: any) {
      console.error('Error uploading logo:', err);
      setLogoUploadError(err.message || 'Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Show loading state
  if (isLoading || (isSupervisor && supervisorLoading)) {
    return (
      <div className="min-h-screen bg-figma-bg">
        <Header 
          activePath="/profile" 
          logoSrc="https://api.builder.io/api/v1/image/assets/TEMP/06a5fef2d74d4e97ef25d5fa5c379c9ecbdcc43a?width=144" 
          userName={getUserFullName()}
          userRole={getUserRole()}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></Loader2>
            <p className="text-figma-text-secondary">
              {isSupervisor ? 'Loading supervisor data...' : 'Loading profile data...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state (only for students)
  if (!isSupervisor && (error || !clearanceData)) {
    return (
      <div className="min-h-screen bg-figma-bg">
        <Header 
          activePath="/profile" 
          logoSrc="https://api.builder.io/api/v1/image/assets/TEMP/06a5fef2d74d4e97ef25d5fa5c379c9ecbdcc43a?width=144" 
          userName={getUserFullName()}
          userRole={getUserRole()}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-lg font-semibold text-figma-text-primary mb-2">Error Loading Profile Data</p>
            <p className="text-figma-text-secondary mb-4">{error || 'Failed to load profile data'}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-figma-bg">
      {/* Use the shared header component */}
      <Header 
        activePath="/profile" 
        logoSrc="https://api.builder.io/api/v1/image/assets/TEMP/06a5fef2d74d4e97ef25d5fa5c379c9ecbdcc43a?width=144" 
        userName={getUserFullName()}
        userRole={getUserRole()}
      />

      {/* Page Content */}
      <div className="p-4 sm:p-6 max-w-[1400px] mx-auto pt-4">
        {/* Page Title */}
        <h1 className="font-poppins text-2xl font-semibold text-figma-text-primary mb-8">
          {isSupervisor ? 'Supervisor Profile' : 'My Profile'}
        </h1>

        {/* Supervisor Profile View */}
        {isSupervisor ? (
          <>
            {/* Hidden file input for logo upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoFileSelect}
              className="hidden"
            />

            {/* Supervisor Biodata Section */}
            <div className="mb-8">
              <h2 className="font-inter text-xl text-[#2D3C52] mb-3">Supervisor Information</h2>
              <div className="bg-figma-card border border-figma-border rounded-2xl p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Supervisor Profile Image with Upload */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden border-4 border-figma-border bg-gray-100">
                        {profile?.logo ? (
                          <img 
                            src={profile.logo}
                            alt="Supervisor Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                            <span className="text-4xl text-gray-600 font-bold">
                              {profile?.first_name?.charAt(0) || 'S'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Upload Overlay */}
                      <button
                        onClick={triggerFileInput}
                        disabled={isUploadingLogo}
                        className="absolute bottom-0 right-0 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Update Profile Picture"
                      >
                        {isUploadingLogo ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    
                    {/* Upload Error */}
                    {logoUploadError && (
                      <div className="mt-2 text-sm text-red-600 text-center">
                        {logoUploadError}
                      </div>
                    )}
                    
                    {/* Upload Success */}
                    {logoUploadSuccess && (
                      <div className="mt-2 text-sm text-green-600 text-center">
                        ✓ Logo updated successfully!
                      </div>
                    )}
                    
                    {/* Upload Instructions */}
                    <div className="mt-2 text-xs text-gray-500 text-center">
                      Click camera icon to update
                    </div>
                  </div>

                  {/* Supervisor Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 flex-grow">
                    <div>
                      <h3 className="font-inter text-sm text-figma-text-secondary mb-1">Full Name</h3>
                      <p className="font-inter text-base text-figma-text-primary">{getUserFullName()}</p>
                    </div>
                    <div>
                      <h3 className="font-inter text-sm text-figma-text-secondary mb-1">Role</h3>
                      <p className="font-inter text-base text-figma-text-primary">{getUserRole()}</p>
                    </div>
                    <div>
                      <h3 className="font-inter text-sm text-figma-text-secondary mb-1">Email</h3>
                      <p className="font-inter text-base text-figma-text-primary">{user?.email || 'Not Available'}</p>
                    </div>
                    <div>
                      <h3 className="font-inter text-sm text-figma-text-secondary mb-1">Phone</h3>
                      <p className="font-inter text-base text-figma-text-primary">{profile?.phone_number || 'Not Available'}</p>
                    </div>
                    <div>
                      <h3 className="font-inter text-sm text-figma-text-secondary mb-1">Department</h3>
                      <p className="font-inter text-base text-figma-text-primary">{profile?.department || 'Not Available'}</p>
                    </div>
                    <div>
                      <h3 className="font-inter text-sm text-figma-text-secondary mb-1">Account Number</h3>
                      <p className="font-inter text-base text-figma-text-primary">{profile?.account_no || 'Not Available'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Supervisor Statistics */}
            {supervisorStats && (
              <div className="mb-8">
                <h2 className="font-inter text-xl text-[#2D3C52] mb-3">Supervision Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-figma-card border border-figma-border rounded-2xl p-6 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="font-inter text-2xl font-bold text-figma-text-primary mb-1">
                      {supervisorStats.studentsCount}
                    </h3>
                    <p className="font-inter text-sm text-figma-text-secondary">Students Assigned</p>
                  </div>
                  
                  <div className="bg-figma-card border border-figma-border rounded-2xl p-6 text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h3 className="font-inter text-2xl font-bold text-figma-text-primary mb-1">
                      {supervisorStats.pendingReviews}
                    </h3>
                    <p className="font-inter text-sm text-figma-text-secondary">Pending Reviews</p>
                  </div>
                  
                  <div className="bg-figma-card border border-figma-border rounded-2xl p-6 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="font-inter text-2xl font-bold text-figma-text-primary mb-1">
                      {supervisorStats.completedReviews}
                    </h3>
                    <p className="font-inter text-sm text-figma-text-secondary">Completed Reviews</p>
                  </div>
                  
                  <div className="bg-figma-card border border-figma-border rounded-2xl p-6 text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="font-inter text-2xl font-bold text-figma-text-primary mb-1">
                      {supervisorStats.thisWeekReviews}
                    </h3>
                    <p className="font-inter text-sm text-figma-text-secondary">This Week</p>
                  </div>
                </div>
              </div>
            )}

            {/* Assigned Students Overview */}
            <div className="mb-8">
              <h2 className="font-inter text-xl text-[#2D3C52] mb-3">Assigned Students</h2>
              <div className="bg-figma-card border border-figma-border rounded-2xl p-6">
                {assignedStudents.length > 0 ? (
                  <div className="space-y-4">
                    {assignedStudents.map((student) => {
                      const studentEntries = allStudentEntries.filter(entry => entry.student_id === student.id);
                      const totalEntries = studentEntries.length;
                      const approvedEntries = studentEntries.filter(entry => entry.status === 'approved').length;
                      const pendingEntries = studentEntries.filter(entry => entry.status === 'pending').length;
                      
                      return (
                        <div key={student.id} className="flex items-center justify-between p-4 border border-figma-border rounded-xl">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-lg font-bold text-gray-600">
                                {student.first_name?.charAt(0) || 'S'}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-inter font-medium text-figma-text-primary">
                                {student.first_name} {student.last_name}
                              </h3>
                              <p className="font-inter text-sm text-figma-text-secondary">
                                {student.metric_no || 'No Matric Number'} • {student.department || 'No Department'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <p className="font-inter text-sm text-figma-text-secondary">Total Entries</p>
                              <p className="font-inter font-bold text-figma-text-primary">{totalEntries}</p>
                            </div>
                            <div className="text-center">
                              <p className="font-inter text-sm text-figma-text-secondary">Approved</p>
                              <p className="font-inter font-bold text-green-600">{approvedEntries}</p>
                            </div>
                            <div className="text-center">
                              <p className="font-inter text-sm text-figma-text-secondary">Pending</p>
                              <p className="font-inter font-bold text-yellow-600">{pendingEntries}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 text-figma-text-secondary mx-auto mb-4" />
                    <p className="font-inter text-figma-text-secondary">No students assigned yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Institution/Industry Information */}
            <div className="mb-8">
              <h2 className="font-inter text-xl text-[#2D3C52] mb-3">
                {isIndustrySupervisor ? 'Industry Information' : 'Institution Information'}
              </h2>
              <div className="bg-figma-card border border-figma-border rounded-2xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                  <div>
                    <h3 className="font-inter text-sm text-figma-text-secondary mb-1">
                      {isIndustrySupervisor ? 'Industry Name' : 'Institution Name'}
                    </h3>
                    <p className="font-inter text-base text-figma-text-primary">
                      {isIndustrySupervisor ? 'Software Development Company' : 'Federal University of Technology, Minna'}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-inter text-sm text-figma-text-secondary mb-1">Location</h3>
                    <p className="font-inter text-base text-figma-text-primary">
                      {isIndustrySupervisor ? 'Lagos, Nigeria' : 'Minna, Niger State'}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-inter text-sm text-figma-text-secondary mb-1">Department</h3>
                    <p className="font-inter text-base text-figma-text-primary">
                      {isIndustrySupervisor ? 'Software Development' : 'Computer Science'}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-inter text-sm text-figma-text-secondary mb-1">Contact Email</h3>
                    <p className="font-inter text-base text-figma-text-primary">
                      {isIndustrySupervisor ? 'hr@company.com' : 'info@futminna.edu.ng'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Student Profile View (existing code) */}
            {/* Student Biodata Section */}
            <div className="mb-8">
              <h2 className="font-inter text-xl text-[#2D3C52] mb-3">Student Biodata</h2>
              <div className="bg-figma-card border border-figma-border rounded-2xl p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Student Profile Image with Upload */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden border-4 border-figma-border bg-gray-100">
                        {profile?.logo ? (
                          <img 
                            src={profile.logo}
                            alt="Student Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                            <span className="text-4xl text-gray-600 font-bold">
                              {profile?.first_name?.charAt(0) || 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Upload Overlay */}
                      <button
                        onClick={triggerFileInput}
                        disabled={isUploadingLogo}
                        className="absolute bottom-0 right-0 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Update Profile Picture"
                      >
                        {isUploadingLogo ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    
                    {/* Upload Error */}
                    {logoUploadError && (
                      <div className="mt-2 text-sm text-red-600 text-center">
                        {logoUploadError}
                      </div>
                    )}
                    
                    {/* Upload Success */}
                    {logoUploadSuccess && (
                      <div className="mt-2 text-sm text-green-600 text-center">
                        ✓ Logo updated successfully!
                      </div>
                    )}
                    
                    {/* Upload Instructions */}
                    <div className="mt-2 text-xs text-gray-500 text-center">
                      Click camera icon to update
                    </div>
                  </div>

                  {/* Student Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 flex-grow">
                    <div>
                      <h3 className="font-inter text-sm text-figma-text-secondary mb-1">Full Name</h3>
                      <p className="font-inter text-base text-figma-text-primary">{getUserFullName()}</p>
                    </div>
                    <div>
                      <h3 className="font-inter text-sm text-figma-text-secondary mb-1">Student ID</h3>
                      <p className="font-inter text-base text-figma-text-primary">{profile?.metric_no || 'Not Available'}</p>
                    </div>
                    <div>
                      <h3 className="font-inter text-sm text-figma-text-secondary mb-1">Department</h3>
                      <p className="font-inter text-base text-figma-text-primary">{clearanceData.studentInfo.department}</p>
                    </div>
                    <div>
                      <h3 className="font-inter text-sm text-figma-text-secondary mb-1">Level</h3>
                      <p className="font-inter text-base text-figma-text-primary">{clearanceData.studentInfo.level} Level</p>
                    </div>
                    <div>
                      <h3 className="font-inter text-sm text-figma-text-secondary mb-1">Email</h3>
                      <p className="font-inter text-base text-figma-text-primary">{user?.email || 'Not Available'}</p>
                    </div>
                    <div>
                      <h3 className="font-inter text-sm text-figma-text-secondary mb-1">Phone</h3>
                      <p className="font-inter text-base text-figma-text-primary">{profile?.phone_number || 'Not Available'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Institution Details */}
            <div className="mb-8">
              <h2 className="font-inter text-xl text-[#2D3C52] mb-3">Institution Details</h2>
              <div className="bg-figma-card border border-figma-border rounded-2xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                  <div>
                    <h3 className="font-inter text-sm text-figma-text-secondary mb-1">Institution Name</h3>
                    <p className="font-inter text-base text-figma-text-primary">{clearanceData.schoolInfo.name}</p>
                  </div>
                  <div>
                    <h3 className="font-inter text-sm text-figma-text-secondary mb-1">Faculty</h3>
                    <p className="font-inter text-base text-figma-text-primary">School of Information and Communication Technology</p>
                  </div>
                  <div>
                    <h3 className="font-inter text-sm text-figma-text-secondary mb-1">Institution Supervisor</h3>
                    <p className="font-inter text-base text-figma-text-primary">
                      {clearanceData.schoolSupervisor ? 
                        `${clearanceData.schoolSupervisor.first_name} ${clearanceData.schoolSupervisor.middle_name || ''} ${clearanceData.schoolSupervisor.last_name}`.trim() : 
                        'Not Assigned'
                      }
                    </p>
                  </div>
                  <div>
                    <h3 className="font-inter text-sm text-figma-text-secondary mb-1">Supervisor Email</h3>
                    <p className="font-inter text-base text-figma-text-primary">futminna.asakpa@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Industry Details */}
            <div className="mb-8">
              <h2 className="font-inter text-xl text-[#2D3C52] mb-3">Industry Details</h2>
              <div className="bg-figma-card border border-figma-border rounded-2xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                  <div>
                    <h3 className="font-inter text-sm text-figma-text-secondary mb-1">Industry Name</h3>
                    <p className="font-inter text-base text-figma-text-primary">{clearanceData.industryInfo.name}</p>
                  </div>
                  <div>
                    <h3 className="font-inter text-sm text-figma-text-secondary mb-1">Department</h3>
                    <p className="font-inter text-base text-figma-text-primary">Software Development</p>
                  </div>
                  <div>
                    <h3 className="font-inter text-sm text-figma-text-secondary mb-1">Industry Supervisor</h3>
                    <p className="font-inter text-base text-figma-text-primary">
                      {clearanceData.industrySupervisor ? 
                        `${clearanceData.industrySupervisor.first_name} ${clearanceData.industrySupervisor.middle_name || ''} ${clearanceData.industrySupervisor.last_name}`.trim() : 
                        'Not Assigned'
                      }
                    </p>
                  </div>
                  <div>
                    <h3 className="font-inter text-sm text-figma-text-secondary mb-1">Supervisor Email</h3>
                    <p className="font-inter text-base text-figma-text-primary">bigfixintegrated@gmail.com</p>
                  </div>
                  <div>
                    <h3 className="font-inter text-sm text-figma-text-secondary mb-1">Address</h3>
                    <p className="font-inter text-base text-figma-text-primary">{clearanceData.industryInfo.location || 'Not Available'}</p>
                  </div>
                  <div>
                    <h3 className="font-inter text-sm text-figma-text-secondary mb-1">SIWES Duration</h3>
                    <p className="font-inter text-base text-figma-text-primary">{clearanceData.studentInfo.siwes_duration || '6 Months'}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
