import { X, CheckCircle2, Printer, Download } from "lucide-react";
import { useEffect } from "react";
import { ClearanceData } from "../lib/services/clearance.service";

interface PrintableFormProps {
  isOpen: boolean;
  onClose: () => void;
  clearanceData?: ClearanceData;
}

export default function PrintableForm({ isOpen, onClose, clearanceData }: PrintableFormProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Use clearance data if available, otherwise show loading or fallback
  const studentName = clearanceData ? 
    `${clearanceData.studentInfo.first_name} ${clearanceData.studentInfo.middle_name || ''} ${clearanceData.studentInfo.last_name}`.trim() : 
    'Loading...';
  
  const matricNo = clearanceData?.studentInfo.matric_no || 'Loading...';
  const department = clearanceData?.studentInfo.department || 'Loading...';
  const level = clearanceData?.studentInfo.level || 'Loading...';
  const duration = clearanceData?.studentInfo.siwes_duration || 'Loading...';
  const company = clearanceData?.industryInfo?.name || 'Loading...';
  const location = clearanceData?.industryInfo?.location || 'Loading...';
  const weeks = clearanceData?.requirements.find(r => r.type === 'duration')?.current || 0;
  
  const industrySupervisorName = clearanceData?.industrySupervisor ? 
    `${clearanceData.industrySupervisor.first_name} ${clearanceData.industrySupervisor.middle_name || ''} ${clearanceData.industrySupervisor.last_name}`.trim() : 
    'Not Assigned';
  
  const schoolSupervisorName = clearanceData?.schoolSupervisor ? 
    `${clearanceData.schoolSupervisor.first_name} ${clearanceData.schoolSupervisor.middle_name || ''} ${clearanceData.schoolSupervisor.last_name}`.trim() : 
    'Not Assigned';

  const schoolName = clearanceData?.schoolInfo?.name || 'Loading...';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-figma-bg print:hidden">
          <h2 className="font-poppins text-xl font-semibold text-figma-text-primary">
            SIWES Clearance Certificate
          </h2>
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-poppins text-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-figma-text-primary" />
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-8 bg-white min-h-[11in] print:p-0 print:m-0">
            {/* Official Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <img 
                  src="https://api.builder.io/api/v1/image/assets/TEMP/642e401f10ae75780a2b9566ab9425c388a65c21?width=144" 
                  alt="Institution Logo" 
                  className="w-20 h-20"
                />
              </div>
              <h1 className="font-bold text-2xl text-[#2D3C52] mb-2">
                {schoolName.toUpperCase()}
              </h1>
              <h2 className="font-semibold text-lg text-[#2D3C52] mb-1">
                SCHOOL OF INFORMATION AND COMMUNICATION TECHNOLOGY
              </h2>
              <h3 className="font-medium text-base text-[#61728C] mb-6">
                DEPARTMENT OF {department.toUpperCase()}
              </h3>
              
              <div className="w-full h-1 bg-black mb-6"></div>
              
              <h2 className="font-bold text-xl text-[#2D3C52] mb-2">
                STUDENTS INDUSTRIAL WORK EXPERIENCE SCHEME (SIWES)
              </h2>
              <h3 className="font-semibold text-lg text-[#2D3C52]">
                CLEARANCE CERTIFICATE
              </h3>
            </div>

            {/* Certificate Body */}
            <div className="space-y-8">
              {/* Student Information */}
              <div className="border border-[#EDF3FC] rounded-lg p-6">
                <h3 className="font-semibold text-lg text-[#2D3C52] mb-4 border-b border-[#EDF3FC] pb-2">
                  STUDENT INFORMATION
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex">
                      <span className="w-32 font-medium text-[#61728C]">Full Name:</span>
                      <span className="font-medium text-[#2D3C52]">{studentName}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 font-medium text-[#61728C]">Matric No:</span>
                      <span className="font-medium text-[#2D3C52]">{matricNo}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 font-medium text-[#61728C]">Department:</span>
                      <span className="font-medium text-[#2D3C52]">{department}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 font-medium text-[#61728C]">Level:</span>
                      <span className="font-medium text-[#2D3C52]">{level} Level</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex">
                      <span className="w-32 font-medium text-[#61728C]">Duration:</span>
                      <span className="font-medium text-[#2D3C52]">{duration}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 font-medium text-[#61728C]">Company:</span>
                      <span className="font-medium text-[#2D3C52]">{company}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 font-medium text-[#61728C]">Location:</span>
                      <span className="font-medium text-[#2D3C52]">{location}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 font-medium text-[#61728C]">Weeks:</span>
                      <span className="font-medium text-[#2D3C52]">{weeks} Weeks</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Supervisors Information */}
              <div className="border border-[#EDF3FC] rounded-lg p-6">
                <h3 className="font-semibold text-lg text-[#2D3C52] mb-4 border-b border-[#EDF3FC] pb-2">
                  SUPERVISORS INFORMATION
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-[#2D3C52] mb-3">Industry-Based Supervisor</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex">
                        <span className="w-20 text-[#61728C]">Name:</span>
                        <span className="text-[#2D3C52]">{industrySupervisorName}</span>
                      </div>
                      <div className="flex">
                        <span className="w-20 text-[#61728C]">Organization:</span>
                        <span className="text-[#2D3C52]">{company}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-[#2D3C52] mb-3">Institution-Based Supervisor</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex">
                        <span className="w-20 text-[#61728C]">Name:</span>
                        <span className="text-[#2D3C52]">{schoolSupervisorName}</span>
                      </div>
                      <div className="flex">
                        <span className="w-20 text-[#61728C]">Organization:</span>
                        <span className="text-[#2D3C52]">{schoolName}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clearance Statement */}
              <div className="border-2 border-green-200 bg-green-50 rounded-lg p-6 text-center">
                <div className="flex justify-center mb-4">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="font-bold text-xl text-green-800 mb-3">
                  CLEARANCE CERTIFICATION
                </h3>
                <p className="text-green-700 leading-relaxed max-w-3xl mx-auto">
                  This is to certify that <strong>{studentName.toUpperCase()}</strong> with Matric Number <strong>{matricNo}</strong> 
                  has successfully completed the Students Industrial Work Experience Scheme (SIWES) program 
                  for a period of Twenty-Four (24) weeks from {duration} at 
                  <strong> {company}</strong>
                </p>
                <p className="text-green-700 mt-4">
                  The student has fulfilled all requirements and is hereby cleared for completion of the program.
                </p>
              </div>

              {/* Requirements Checklist */}
              <div className="border border-[#EDF3FC] rounded-lg p-6">
                <h3 className="font-semibold text-lg text-[#2D3C52] mb-4 border-b border-[#EDF3FC] pb-2">
                  REQUIREMENTS COMPLETED
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    {clearanceData?.requirements.slice(0, 3).map((requirement) => (
                      <div key={requirement.id} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-[#2D3C52]">{requirement.title}</span>
                    </div>
                    ))}
                  </div>
                  
                  <div className="space-y-3">
                    {clearanceData?.requirements.slice(3).map((requirement) => (
                      <div key={requirement.id} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-[#2D3C52]">{requirement.title}</span>
                    </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-8 border-t border-[#EDF3FC]">
                <p className="text-sm text-[#61728C]">
                  Certificate Generated on {currentDate}
                </p>
                <p className="text-xs text-[#61728C] mt-2">
                  This is an official document from {schoolName}
                </p>
                <p className="text-xs text-[#61728C] mt-1">
                  Certificate Reference: SIWES/CS/2025/{new Date().getTime().toString().slice(-6)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
