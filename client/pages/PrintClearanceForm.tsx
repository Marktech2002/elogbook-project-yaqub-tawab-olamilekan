import { 
  Bell, 
  ChevronDown, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Download,
  FileText,
  Calendar,
  User,
  Building2,
  GraduationCap,
  Printer,
  Loader2,
  Eye,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import PrintableForm from "../components/PrintableForm";
import DownloadableCertificate from "../components/DownloadableCertificate";
import Header from "../components/layout/Header";
import { useAuth } from "../hooks/use-auth";
import { useSupervisor } from "../hooks/use-supervisor";
import clearanceService, { ClearanceData, ClearanceRequirement } from "../lib/services/clearance.service";

export default function PrintClearanceForm() {
  const { profile, user } = useAuth();
  const { 
    assignedStudents, 
    allStudentEntries, 
    isLoading: supervisorLoading,
    getStudentsReadyForClearance,
    getAllAssignedStudentsWithClearance,
    markStudentAsCleared
  } = useSupervisor();
  
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [clearanceData, setClearanceData] = useState<ClearanceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentClearanceData, setStudentClearanceData] = useState<ClearanceData | null>(null);
  const [studentsReadyForClearance, setStudentsReadyForClearance] = useState<any[]>([]);
  const [allAssignedStudents, setAllAssignedStudents] = useState<any[]>([]);
  const certificateRef = useRef<HTMLDivElement>(null);

  // Determine if user is a supervisor
  const isSupervisor = profile?.role === 'supervisor_school' || profile?.role === 'supervisor_industry';
  const isIndustrySupervisor = profile?.role === 'supervisor_industry';

  // Fetch students ready for clearance
  const fetchStudentsReadyForClearance = async () => {
    if (profile?.role === 'supervisor_school') {
      try {
        const students = await getStudentsReadyForClearance();
        setStudentsReadyForClearance(students);
      } catch (err) {
        console.error('Error fetching students ready for clearance:', err);
      }
    }
  };

  // Fetch all assigned students with clearance status
  const fetchAllAssignedStudents = async () => {
    if (profile?.role === 'supervisor_school') {
      try {
        const students = await getAllAssignedStudentsWithClearance();
        setAllAssignedStudents(students);
      } catch (err) {
        console.error('Error fetching all assigned students:', err);
      }
    }
  };

  // Mark student as cleared
  const handleMarkAsCleared = async (studentId: string) => {
    try {
      await markStudentAsCleared(studentId);
      // Refresh both lists
      await Promise.all([
        fetchStudentsReadyForClearance(),
        fetchAllAssignedStudents()
      ]);
      // Show success message
      alert('Student marked as cleared successfully!');
    } catch (err) {
      console.error('Error marking student as cleared:', err);
      alert('Failed to mark student as cleared');
    }
  };

  // Fetch clearance data when component mounts
  useEffect(() => {
    const fetchClearanceData = async () => {
      if (!profile?.id) return;
      
      if (isSupervisor) {
        // For supervisors, fetch students ready for clearance and all assigned students
        await Promise.all([
          fetchStudentsReadyForClearance(),
          fetchAllAssignedStudents()
        ]);
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
        setError(err.message || 'Failed to fetch clearance data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClearanceData();
  }, [profile?.id, isSupervisor, getStudentsReadyForClearance, getAllAssignedStudentsWithClearance]);

  // Fetch clearance data for a specific student
  const fetchStudentClearanceData = async (studentId: string) => {
    try {
      const data = await clearanceService.getClearanceData(studentId);
      setStudentClearanceData(data);
    } catch (err: any) {
      console.error('Error fetching student clearance data:', err);
      setError(err.message || 'Failed to fetch student clearance data');
    }
  };

  // Check if student is eligible for clearance
  const checkClearanceEligibility = async (studentId: string) => {
    try {
      const eligibility = await clearanceService.checkClearanceEligibility(studentId);
      
      if (eligibility.isEligible) {
        // Update clearance form status to cleared
        await clearanceService.createOrUpdateClearanceForm(studentId, 'cleared');
        return true;
      } else {
        // Check if ready for school approval
        const industryApproved = eligibility.requirements.find(req => req.type === 'supervisor_approval')?.status === 'completed';
        const weeksCompleted = eligibility.requirements.find(req => req.type === 'duration')?.status === 'completed';
        
        if (industryApproved && weeksCompleted) {
          await clearanceService.createOrUpdateClearanceForm(studentId, 'ready_for_school_approval');
        } else {
          await clearanceService.createOrUpdateClearanceForm(studentId, 'not_cleared');
        }
        return false;
      }
    } catch (error) {
      console.error('Error checking clearance eligibility:', error);
      return false;
    }
  };

  // Handle student selection
  const handleStudentSelect = async (student: any) => {
    setSelectedStudent(student);
    await fetchStudentClearanceData(student.id);
    
    // Check eligibility when student is selected
    if (profile?.role === 'supervisor_school') {
      await checkClearanceEligibility(student.id);
    }
  };

  // Check if student can print clearance form
  const canPrintClearanceForm = (data: ClearanceData) => {
    if (!data) return false;
    
    // Check if clearance form status is cleared
    return data.clearanceStatus.status === 'cleared';
  };

  // Download certificate as PDF functionality
  const handleDownloadCertificate = async () => {
    if (!clearanceData && !studentClearanceData) return;
    
    const data = studentClearanceData || clearanceData;
    if (!data) return;
    
    // Check if student is eligible to print
    if (!canPrintClearanceForm(data)) {
      alert('Student is not eligible for clearance yet. Both industry and school supervisors must approve all requirements.');
      return;
    }
    
    // Create a new window with the certificate
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const studentName = `${data.studentInfo.first_name} ${data.studentInfo.middle_name || ''} ${data.studentInfo.last_name}`.trim();
    const matricNo = data.studentInfo.matric_no;
    const schoolName = data.schoolInfo.name;
    const department = data.studentInfo.department;
    const industryName = data.industryInfo.name;
    const industrySupervisorName = data.industrySupervisor ? 
      `${data.industrySupervisor.first_name} ${data.industrySupervisor.middle_name || ''} ${data.industrySupervisor.last_name}`.trim() : 'Unknown';
    const schoolSupervisorName = data.schoolSupervisor ? 
      `${data.schoolSupervisor.first_name} ${data.schoolSupervisor.middle_name || ''} ${data.schoolSupervisor.last_name}`.trim() : 'Unknown';

    // Certificate HTML content
    const certificateHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>SIWES Certificate - ${studentName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Times New Roman', serif; background: white; }
            .certificate-container {
              width: 8.5in;
              height: 11in;
              margin: 0 auto;
              padding: 1in;
              background: white;
            }
            .border-frame {
              border: 4px double #2D3C52;
              height: 100%;
              padding: 0.5in;
              position: relative;
            }
            .corner { position: absolute; width: 32px; height: 32px; }
            .corner-tl { top: 16px; left: 16px; border-top: 4px solid #2D3C52; border-left: 4px solid #2D3C52; }
            .corner-tr { top: 16px; right: 16px; border-top: 4px solid #2D3C52; border-right: 4px solid #2D3C52; }
            .corner-bl { bottom: 16px; left: 16px; border-bottom: 4px solid #2D3C52; border-left: 4px solid #2D3C52; }
            .corner-br { bottom: 16px; right: 16px; border-bottom: 4px solid #2D3C52; border-right: 4px solid #2D3C52; }
            .header { text-align: center; margin-bottom: 2in; }
            .logo { width: 80px; height: 80px; background: #2D3C52; border-radius: 50%; margin: 0 auto 24px; }
            .title { font-size: 28px; font-weight: bold; color: #2D3C52; margin-bottom: 8px; letter-spacing: 1px; }
            .subtitle { font-size: 18px; color: #61728C; margin-bottom: 16px; }
            .dept { font-size: 16px; color: #61728C; margin-bottom: 32px; }
            .divider { width: 128px; height: 4px; background: linear-gradient(to right, transparent, #2D3C52, transparent); margin: 32px auto; }
            .cert-title { font-size: 36px; font-weight: bold; color: #2D3C52; margin-bottom: 8px; letter-spacing: 2px; }
            .cert-subtitle { font-size: 20px; color: #61728C; margin-bottom: 32px; }
            .content { text-align: center; margin: 2in 0; }
            .certify { font-size: 18px; color: #61728C; margin-bottom: 16px; font-style: italic; }
            .name { font-size: 48px; font-weight: bold; color: #2D3C52; margin-bottom: 8px; letter-spacing: 1px; text-decoration: underline; text-underline-offset: 8px; }
            .matric { font-size: 18px; color: #61728C; margin-bottom: 24px; }
            .description { font-size: 18px; color: #61728C; line-height: 1.6; max-width: 600px; margin: 0 auto 24px; }
            .company { font-size: 28px; font-weight: bold; color: #2D3C52; margin-bottom: 24px; }
            .achievement { text-align: center; margin: 32px 0; }
            .badge { width: 80px; height: 80px; background: linear-gradient(135deg, #dcfce7, #bbf7d0); border: 2px solid #86efac; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 32px; margin: 32px 0; text-align: center; }
            .signature { border-bottom: 2px solid #2D3C52; height: 64px; margin-bottom: 12px; display: flex; align-items: end; justify-content: center; }
            .sig-name { font-size: 24px; font-weight: bold; color: #2D3C52; font-style: italic; margin-bottom: 8px; }
            .sig-title { font-weight: bold; color: #2D3C52; }
            .sig-org { font-size: 14px; color: #61728C; }
            .footer { text-align: center; border-top: 2px solid #2D3C52; padding-top: 24px; }
            .date { font-size: 18px; font-weight: bold; color: #2D3C52; margin-bottom: 8px; }
            .ref { font-size: 14px; color: #61728C; margin-bottom: 16px; }
            .seal { width: 80px; height: 80px; background: linear-gradient(135deg, #2D3C52, #61728C); border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; }
            .seal-inner { width: 64px; height: 64px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
            .authentic { font-size: 12px; color: #61728C; margin-top: 8px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="certificate-container">
            <div class="border-frame">
              <div class="corner corner-tl"></div>
              <div class="corner corner-tr"></div>
              <div class="corner corner-bl"></div>
              <div class="corner corner-br"></div>

              <div class="header">
                <div class="logo"></div>
                <div class="title">${schoolName.toUpperCase()}</div>
                <div class="subtitle">School of Information and Communication Technology</div>
                <div class="dept">Department of ${department}</div>
                <div class="divider"></div>
                <div class="cert-title">CERTIFICATE OF COMPLETION</div>
                <div class="cert-subtitle">Students Industrial Work Experience Scheme (SIWES)</div>
              </div>

              <div class="content">
                <div class="certify">This is to certify that</div>
                <div class="name">${studentName.toUpperCase()}</div>
                <div class="matric">Matric Number: <strong>${matricNo}</strong></div>
                <div class="description">
                  has successfully completed the <strong>Students Industrial Work Experience Scheme (SIWES)</strong>
                  program for a duration of <strong>Twenty-Four (24) weeks</strong> from
                  <strong>May 2025 to September 2025</strong> at
                </div>
                <div class="company">${industryName.toUpperCase()}</div>
                <div class="description">
                  The student has demonstrated exceptional commitment, professionalism, and has fulfilled
                  all academic and industrial requirements of the program.
                </div>
                <div class="achievement">
                  <div class="badge">✓</div>
                </div>
              </div>

              <div class="signatures">
                <div>
                  <div class="signature"><div class="sig-name">${industrySupervisorName}</div></div>
                  <div class="sig-title">Industry Supervisor</div>
                  <div class="sig-org">${industryName}</div>
                </div>
                <div>
                  <div class="signature"><div class="sig-name">${schoolSupervisorName}</div></div>
                  <div class="sig-title">Academic Supervisor</div>
                  <div class="sig-org">${schoolName}</div>
                </div>
                <div>
                  <div class="signature"><div class="sig-name">Prof. O. Awodele</div></div>
                  <div class="sig-title">SIWES Coordinator</div>
                  <div class="sig-org">${department} Dept.</div>
                </div>
              </div>

              <div class="footer">
                <div class="date">Awarded on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                <div class="ref">Certificate Reference: SIWES/CS/2025/${new Date().getTime().toString().slice(-6)}</div>
                <div class="seal">
                  <div class="seal-inner">✓</div>
                </div>
                <div class="authentic">CERTIFIED AUTHENTIC</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(certificateHTML);
    printWindow.document.close();

    // Trigger print dialog which can be used to save as PDF
    setTimeout(() => {
      printWindow.print();
    }, 1000);
  };

  const StatusIcon = ({ status }: { status: 'completed' | 'in-progress' | 'pending' }) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: 'completed' | 'in-progress' | 'pending') => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Completed
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-sm font-medium">
            <Clock className="w-4 h-4" />
            In Progress
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 text-gray-500 text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            Pending
          </span>
        );
    }
  };

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

  // Calculate student clearance progress
  const getStudentClearanceProgress = (student: any) => {
    const studentEntries = allStudentEntries.filter(entry => entry.student_id === student.id);
    const totalEntries = studentEntries.length;
    const approvedEntries = studentEntries.filter(entry => entry.status === 'approved').length;
    const pendingEntries = studentEntries.filter(entry => entry.status === 'pending').length;
    
    // Simple progress calculation based on logbook entries
    const progress = totalEntries > 0 ? Math.round((approvedEntries / Math.max(totalEntries, 24)) * 100) : 0;
    
    return {
      progress: Math.min(progress, 100),
      totalEntries,
      approvedEntries,
      pendingEntries,
      isEligible: approvedEntries >= 20 // At least 20 approved entries
    };
  };

  // Show loading state
  if (isLoading || (isSupervisor && supervisorLoading)) {
    return (
      <div className="min-h-screen bg-figma-bg">
        <Header 
          activePath="/print-clearance" 
          logoSrc="https://api.builder.io/api/v1/image/assets/TEMP/642e401f10ae75780a2b9566ab9425c388a65c21?width=144" 
          userName={getUserFullName()}
          userRole={getUserRole()}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></Loader2>
            <p className="text-figma-text-secondary">
              {isSupervisor ? 'Loading student data...' : 'Loading clearance data...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || (!isSupervisor && !clearanceData)) {
    return (
      <div className="min-h-screen bg-figma-bg">
        <Header 
          activePath="/print-clearance" 
          logoSrc="https://api.builder.io/api/v1/image/assets/TEMP/642e401f10ae75780a2b9566ab9425c388a65c21?width=144" 
          userName={getUserFullName()}
          userRole={getUserRole()}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4"></AlertCircle>
            <h3 className="text-lg font-semibold text-figma-text-primary mb-2">Error Loading Data</h3>
            <p className="text-figma-text-secondary mb-4">{error || 'Failed to load data'}</p>
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

  // Supervisor View
  if (isSupervisor) {
    return (
      <div className="min-h-screen bg-figma-bg">
        <Header 
          activePath="/print-clearance" 
          logoSrc="https://api.builder.io/api/v1/image/assets/TEMP/642e401f10ae75780a2b9566ab9425c388a65c21?width=144" 
          userName={getUserFullName()}
          userRole={getUserRole()}
        />

        <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-poppins text-2xl font-semibold text-figma-text-primary">
                Student Clearance Overview
              </h1>
              <p className="text-figma-text-secondary mt-2">
                Monitor your assigned students' clearance progress and requirements
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="flex items-center gap-2 px-4 py-3 rounded border font-poppins text-base transition-colors border-figma-text-primary text-figma-text-primary hover:bg-gray-50"
              >
                <Printer className="w-5 h-5" />
                Print Summary
              </button>
            </div>
          </div>

          {/* Students Overview */}
          <div className="bg-figma-card rounded-[22px] border border-figma-border p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-figma-text-primary" />
              <h2 className="font-poppins text-xl font-semibold text-figma-text-primary">
                Assigned Students ({assignedStudents.length})
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignedStudents.map((student) => {
                const clearanceProgress = getStudentClearanceProgress(student);
                const studentName = `${student.first_name} ${student.last_name}`.trim();
                
                return (
                  <div 
                    key={student.id}
                    className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                      selectedStudent?.id === student.id 
                        ? 'border-figma-text-primary bg-figma-text-primary/5' 
                        : 'border-figma-border hover:border-figma-text-primary/50'
                    }`}
                    onClick={() => handleStudentSelect(student)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-poppins font-medium text-figma-text-primary">
                        {studentName}
                      </h3>
                      <Eye className="w-4 h-4 text-figma-text-secondary" />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="text-sm">
                        <span className="text-figma-text-secondary">Matric:</span>
                        <span className="ml-2 font-medium text-figma-text-primary">
                          {student.metric_no || 'Not provided'}
                        </span>
                      </div>
                      
                      <div className="text-sm">
                        <span className="text-figma-text-secondary">Department:</span>
                        <span className="ml-2 font-medium text-figma-text-primary">
                          {student.department || 'Not provided'}
                        </span>
                      </div>
                      
                      <div className="text-sm">
                        <span className="text-figma-text-secondary">Progress:</span>
                        <span className="ml-2 font-medium text-figma-text-primary">
                          {clearanceProgress.progress}%
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            clearanceProgress.isEligible ? 'bg-green-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${clearanceProgress.progress}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-figma-text-secondary">
                        <span>Entries: {clearanceProgress.totalEntries}</span>
                        <span>Approved: {clearanceProgress.approvedEntries}</span>
                        <span>Pending: {clearanceProgress.pendingEntries}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-figma-border">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                        clearanceProgress.isEligible 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-orange-50 text-orange-600'
                      }`}>
                        {clearanceProgress.isEligible ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Eligible
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            In Progress
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Students Ready for Clearance - School Supervisor View */}
          {profile?.role === 'supervisor_school' && studentsReadyForClearance.length > 0 && (
            <div className="bg-figma-card border border-figma-border rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-figma-text-primary mb-4">
                Students Ready for Clearance
              </h2>
              <p className="text-figma-text-secondary mb-6">
                These students have completed 24 weeks and are ready for final clearance approval.
              </p>
              
              <div className="space-y-4">
                {studentsReadyForClearance.map((student) => (
                  <div key={student.id} className="bg-figma-bg p-4 rounded-lg border border-figma-border">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-figma-text-primary">
                          {student.first_name} {student.last_name}
                        </h3>
                        <div className="text-sm text-figma-text-secondary mt-1">
                          <span>Matric: {student.metric_no || 'N/A'}</span>
                          <span className="mx-2">•</span>
                          <span>Dept: {student.department || 'N/A'}</span>
                          <span className="mx-2">•</span>
                          <span>Weeks: {student.totalApproved}/24</span>
                        </div>
                        <div className="text-sm text-figma-text-secondary mt-1">
                          Status: {student.clearanceForm?.status === 'cleared' ? 
                            <span className="text-green-600 font-medium">✓ Cleared</span> : 
                            <span className="text-yellow-600 font-medium">Ready for Clearance</span>
                          }
                        </div>
                      </div>
                      
                      {student.canBeCleared && (
                        <button
                          onClick={() => handleMarkAsCleared(student.id)}
                          className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors font-poppins text-sm"
                        >
                          Mark as Cleared
                        </button>
                      )}
                      
                      {student.clearanceForm?.status === 'cleared' && (
                        <div className="text-green-600 font-medium text-sm">
                          ✓ Already Cleared
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Assigned Students with Clearance Status */}
          {profile?.role === 'supervisor_school' && allAssignedStudents.length > 0 && (
            <div className="bg-figma-card border border-figma-border rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-figma-text-primary mb-4">
                All Assigned Students
              </h2>
              <p className="text-figma-text-secondary mb-6">
                View the current clearance status for all students assigned to you.
              </p>
              
              <div className="space-y-4">
                {allAssignedStudents.map((student) => (
                  <div key={student.id} className="bg-figma-bg p-4 rounded-lg border border-figma-border">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-figma-text-primary">
                          {student.first_name} {student.last_name}
                        </h3>
                        <div className="text-sm text-figma-text-secondary mt-1">
                          <span>Matric: {student.metric_no || 'N/A'}</span>
                          <span className="mx-2">•</span>
                          <span>Dept: {student.department || 'N/A'}</span>
                          <span className="mx-2">•</span>
                          <span>Weeks: {student.totalApproved}/24</span>
                        </div>
                        <div className="text-sm text-figma-text-secondary mt-1">
                          Status: {student.displayStatus === 'cleared' ? 
                            <span className="text-green-600 font-medium">✓ Cleared</span> : 
                            student.displayStatus === 'ready_for_clearance' ? 
                            <span className="text-yellow-600 font-medium">Ready for Clearance</span> :
                            <span className="text-blue-600 font-medium">Awaiting Clearance ({student.totalApproved}/24 weeks)</span>
                          }
                        </div>
                      </div>
                      
                      {student.canBeCleared && (
                        <button
                          onClick={() => handleMarkAsCleared(student.id)}
                          className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors font-poppins text-sm"
                        >
                          Mark as Cleared
                        </button>
                      )}
                      
                      {student.displayStatus === 'cleared' && (
                        <div className="text-green-600 font-medium text-sm">
                          ✓ Already Cleared
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Student Details */}
          {selectedStudent && studentClearanceData && (
            <div className="bg-figma-card rounded-[22px] border border-figma-border p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-poppins text-xl font-semibold text-figma-text-primary">
                  {`${selectedStudent.first_name} ${selectedStudent.last_name}`.trim()} - Clearance Details
                </h2>
                <button
                  onClick={() => handleDownloadCertificate()}
                  disabled={!studentClearanceData.isEligible}
                  className={`flex items-center gap-2 px-4 py-2 rounded font-poppins text-sm transition-colors ${
                    studentClearanceData.isEligible
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  Download Certificate
                </button>
              </div>
              
              {/* Student Clearance Progress */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-poppins font-medium text-figma-text-primary">Student Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-figma-text-secondary">Full Name:</span>
                      <span className="font-medium text-figma-text-primary">
                        {`${studentClearanceData.studentInfo.first_name} ${studentClearanceData.studentInfo.middle_name || ''} ${studentClearanceData.studentInfo.last_name}`.trim()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-figma-text-secondary">Matric Number:</span>
                      <span className="font-medium text-figma-text-primary">{studentClearanceData.studentInfo.matric_no}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-figma-text-secondary">Department:</span>
                      <span className="font-medium text-figma-text-primary">{studentClearanceData.studentInfo.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-figma-text-secondary">Company:</span>
                      <span className="font-medium text-figma-text-primary">{studentClearanceData.industryInfo.name}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-poppins font-medium text-figma-text-primary">Clearance Status</h3>
                  <div className="text-center">
                    <div className={`w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold ${
                      studentClearanceData.isEligible 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-orange-100 text-orange-500'
                    }`}>
                      {studentClearanceData.overallProgress}%
                    </div>
                    <p className={`font-medium ${
                      studentClearanceData.isEligible ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {studentClearanceData.isEligible ? 'Ready for Clearance' : 'Requirements Pending'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clearance Status for School Supervisors */}
          {profile?.role === 'supervisor_school' && selectedStudent && studentClearanceData && (
            <div className="bg-figma-card border border-figma-border rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-figma-text-primary mb-4">
                Clearance Status for {selectedStudent.first_name} {selectedStudent.last_name}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-figma-bg p-4 rounded-lg border border-figma-border">
                  <h3 className="font-semibold text-figma-text-primary mb-2">Overall Progress</h3>
                  <div className="text-3xl font-bold text-figma-text-primary">
                    {studentClearanceData.overallProgress}%
                  </div>
                  <div className="text-sm text-figma-text-secondary mt-1">
                    {studentClearanceData.isEligible ? 'Eligible for clearance' : 'Requirements pending'}
                  </div>
                </div>
                
                <div className="bg-figma-bg p-4 rounded-lg border border-figma-border">
                  <h3 className="font-semibold text-figma-text-primary mb-2">Clearance Status</h3>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    studentClearanceData.clearanceStatus.status === 'cleared'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {studentClearanceData.clearanceStatus.status === 'cleared' ? 'Cleared' : 'Not Cleared'}
                  </div>
                  
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-figma-text-secondary">Industry Supervisor:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        studentClearanceData.clearanceStatus.industry_supervisor_approved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {studentClearanceData.clearanceStatus.industry_supervisor_approved ? '✓ Approved' : '⏳ Pending'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-figma-text-secondary">School Supervisor:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        studentClearanceData.clearanceStatus.school_supervisor_approved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {studentClearanceData.clearanceStatus.school_supervisor_approved ? '✓ Approved' : '⏳ Pending'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-figma-text-secondary">Weeks Completed:</span>
                      <span className="text-figma-text-primary font-medium">
                        {studentClearanceData.clearanceStatus.total_weeks_completed}/24
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-figma-text-secondary">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        studentClearanceData.clearanceStatus.status === 'cleared'
                          ? 'bg-green-100 text-green-800'
                          : studentClearanceData.clearanceStatus.status === 'ready_for_school_approval'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {studentClearanceData.clearanceStatus.status === 'cleared' ? 'Cleared' :
                         studentClearanceData.clearanceStatus.status === 'ready_for_school_approval' ? 'Ready for School Approval' : 'Not Cleared'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold text-figma-text-primary">Requirements Status</h3>
                {studentClearanceData.requirements.map((requirement) => (
                  <div key={requirement.id} className="flex items-center justify-between p-3 bg-figma-bg rounded-lg border border-figma-border">
                    <div className="flex-1">
                      <div className="font-medium text-figma-text-primary">{requirement.title}</div>
                      <div className="text-sm text-figma-text-secondary">{requirement.description}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-figma-text-secondary">
                        {requirement.current}/{requirement.required}
                      </div>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        requirement.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : requirement.status === 'in-progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {requirement.status === 'completed' ? '✓ Completed' :
                         requirement.status === 'in-progress' ? '⟳ In Progress' : '⏳ Pending'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Student Selected */}
          {!selectedStudent && (
            <div className="bg-figma-card rounded-[22px] border border-figma-border p-6 text-center">
              <Users className="w-16 h-16 text-figma-text-secondary mx-auto mb-4" />
              <h3 className="font-poppins text-lg font-medium text-figma-text-primary mb-2">
                Select a Student
              </h3>
              <p className="text-figma-text-secondary">
                Click on any student card above to view their detailed clearance information
              </p>
            </div>
          )}
        </div>

        {/* Printable Form Modal */}
        <PrintableForm
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          clearanceData={studentClearanceData || clearanceData}
        />
      </div>
    );
  }

  // Student View (existing code)
  return (
    <div className="min-h-screen bg-figma-bg">
      {/* Use the shared Header component */}
      <Header 
        activePath="/print-clearance" 
        logoSrc="https://api.builder.io/api/v1/image/assets/TEMP/642e401f10ae75780a2b9566ab9425c388a65c21?width=144" 
        userName={getUserFullName()}
        userRole={getUserRole()}
      />

      {/* Page Content */}
      <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-figma-text-primary mb-2">
              {isSupervisor ? 'Student Clearance Review' : 'Clearance Form'}
            </h1>
            <p className="text-figma-text-secondary">
              {isSupervisor 
                ? 'Review student clearance requirements and provide final approval.'
                : 'View your clearance status and requirements for SIWES completion.'
              }
            </p>
          </div>
          
          {!isSupervisor && clearanceData && canPrintClearanceForm(clearanceData) && (
            <button
              onClick={handleDownloadCertificate}
              className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-poppins text-base"
            >
              <Printer className="w-5 h-5" />
              Print Clearance Form
            </button>
          )}
        </div>

        {/* Overall Progress Card */}
        <div className="bg-figma-card rounded-[22px] border border-figma-border p-6 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            <div className="flex-1">
              <h2 className="font-poppins text-xl font-semibold text-figma-text-primary mb-2">
                Clearance Progress
              </h2>
              <p className="text-figma-text-secondary mb-4">
                Complete all requirements to be eligible for clearance certificate
              </p>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${clearanceData.overallProgress}%` }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-figma-text-secondary">Overall Progress</span>
                <span className="font-semibold text-figma-text-primary">{clearanceData.overallProgress}% Complete</span>
              </div>
            </div>
            
            <div className="text-center">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold ${
                clearanceData.isEligible 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {clearanceData.overallProgress}%
              </div>
              <p className={`mt-2 font-medium ${
                clearanceData.isEligible ? 'text-green-600' : 'text-gray-500'
              }`}>
                {clearanceData.isEligible ? 'Ready for Clearance' : 'Requirements Pending'}
              </p>
            </div>
          </div>
        </div>

        {/* Requirements Checklist */}
        <div className="bg-figma-card rounded-[22px] border border-figma-border p-6 mb-8">
          <h2 className="font-poppins text-xl font-semibold text-figma-text-primary mb-6">
            Clearance Requirements
          </h2>
          
          <div className="space-y-4">
            {clearanceData.requirements.map((requirement) => (
              <div key={requirement.id} className="flex items-center gap-4 p-4 border border-figma-border rounded-xl">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    requirement.status === 'completed' ? 'bg-green-100' :
                    requirement.status === 'in-progress' ? 'bg-orange-100' : 'bg-gray-100'
                  }`}>
                    {requirement.type === 'duration' && <Calendar className="w-6 h-6" />}
                    {requirement.type === 'log_entries' && <FileText className="w-6 h-6" />}
                    {requirement.type === 'supervisor_approval' && <Building2 className="w-6 h-6" />}
                    {requirement.type === 'academic_approval' && <GraduationCap className="w-6 h-6" />}
                    {requirement.type === 'final_assessment' && <User className="w-6 h-6" />}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-poppins font-medium text-figma-text-primary">
                      {requirement.title}
                    </h3>
                    {getStatusBadge(requirement.status)}
                  </div>
                  <p className="text-figma-text-secondary text-sm mb-2">
                    {requirement.description}
                  </p>
                  
                  {/* Progress for numeric requirements */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            requirement.status === 'completed' ? 'bg-green-500' :
                            requirement.status === 'in-progress' ? 'bg-orange-500' : 'bg-gray-300'
                          }`}
                          style={{ width: `${Math.min((requirement.current / requirement.required) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-figma-text-secondary">
                      {requirement.current}/{requirement.required}
                    </span>
                  </div>
                </div>
                
                <StatusIcon status={requirement.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Student Information Summary */}
        <div className="bg-figma-card rounded-[22px] border border-figma-border p-6 mb-8">
          <h2 className="font-poppins text-xl font-semibold text-figma-text-primary mb-6">
            Student Information
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-figma-text-secondary">Full Name:</span>
                <span className="font-medium text-figma-text-primary">
                  {`${clearanceData.studentInfo.first_name} ${clearanceData.studentInfo.middle_name || ''} ${clearanceData.studentInfo.last_name}`.trim()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-figma-text-secondary">Matric Number:</span>
                <span className="font-medium text-figma-text-primary">{clearanceData.studentInfo.matric_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-figma-text-secondary">Institution:</span>
                <span className="font-medium text-figma-text-primary">{clearanceData.schoolInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-figma-text-secondary">Department:</span>
                <span className="font-medium text-figma-text-primary">{clearanceData.studentInfo.department}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-figma-text-secondary">SIWES Duration:</span>
                <span className="font-medium text-figma-text-primary">{clearanceData.studentInfo.siwes_duration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-figma-text-secondary">Company:</span>
                <span className="font-medium text-figma-text-primary">{clearanceData.industryInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-figma-text-secondary">Industry Supervisor:</span>
                <span className="font-medium text-figma-text-primary">
                  {clearanceData.industrySupervisor ? 
                    `${clearanceData.industrySupervisor.first_name} ${clearanceData.industrySupervisor.middle_name || ''} ${clearanceData.industrySupervisor.last_name}`.trim() : 
                    'Not Assigned'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-figma-text-secondary">Academic Supervisor:</span>
                <span className="font-medium text-figma-text-primary">
                  {clearanceData.schoolSupervisor ? 
                    `${clearanceData.schoolSupervisor.first_name} ${clearanceData.schoolSupervisor.middle_name || ''} ${clearanceData.schoolSupervisor.last_name}`.trim() : 
                    'Not Assigned'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Clearance Status */}
        <div className={`rounded-[22px] border p-6 text-center ${
          clearanceData.isEligible 
            ? 'bg-green-50 border-green-200' 
            : 'bg-orange-50 border-orange-200'
        }`}>
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
            clearanceData.isEligible ? 'bg-green-100' : 'bg-orange-100'
          }`}>
            {clearanceData.isEligible ? (
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            ) : (
              <Clock className="w-8 h-8 text-orange-500" />
            )}
          </div>
          
          <h3 className={`font-poppins text-xl font-semibold mb-2 ${
            clearanceData.isEligible ? 'text-green-800' : 'text-orange-800'
          }`}>
            {clearanceData.isEligible ? 'Clearance Approved' : 'Clearance Pending'}
          </h3>
          
          <p className={`text-sm ${
            clearanceData.isEligible ? 'text-green-700' : 'text-orange-700'
          }`}>
            {clearanceData.isEligible 
              ? 'Congratulations! You have met all requirements and are cleared for completion.'
              : `Complete ${clearanceData.requirements.filter(r => r.status !== 'completed').length} more requirement(s) to be eligible for clearance.`
            }
          </p>
        </div>
      </div>

      {/* Printable Form Modal */}
      <PrintableForm
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        clearanceData={clearanceData}
      />
    </div>
  );
}