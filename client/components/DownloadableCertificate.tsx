import { CheckCircle2 } from "lucide-react";

export default function DownloadableCertificate() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const certificateRef = `SIWES/CS/2025/${new Date().getTime().toString().slice(-6)}`;

  return (
    <div className="w-[8.5in] h-[11in] bg-white p-12 mx-auto" style={{ fontFamily: 'serif' }}>
      {/* Decorative Border */}
      <div className="border-4 border-double border-[#2D3C52] h-full p-8 relative">
        {/* Corner Decorations */}
        <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-[#2D3C52]"></div>
        <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-[#2D3C52]"></div>
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-[#2D3C52]"></div>
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-[#2D3C52]"></div>

        {/* Certificate Content */}
        <div className="h-full flex flex-col justify-between">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-[#2D3C52] rounded-full flex items-center justify-center">
                <img 
                  src="https://api.builder.io/api/v1/image/assets/TEMP/642e401f10ae75780a2b9566ab9425c388a65c21?width=144" 
                  alt="Institution Logo" 
                  className="w-16 h-16 invert"
                />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-[#2D3C52] mb-2 tracking-wide">
              FEDERAL UNIVERSITY OF TECHNOLOGY, MINNA
            </h1>
            <p className="text-lg text-[#61728C] mb-4">School of Information and Communication Technology</p>
            <p className="text-base text-[#61728C] mb-8">Department of Computer Science</p>
            
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-[#2D3C52] to-transparent mx-auto mb-8"></div>
            
            <h2 className="text-3xl font-bold text-[#2D3C52] mb-2 tracking-wider">
              CERTIFICATE OF COMPLETION
            </h2>
            <p className="text-xl text-[#61728C] mb-8">
              Students Industrial Work Experience Scheme (SIWES)
            </p>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col justify-center text-center">
            <div className="mb-8">
              <p className="text-lg text-[#61728C] mb-4 italic">This is to certify that</p>
              
              <h3 className="text-4xl font-bold text-[#2D3C52] mb-2 tracking-wide underline decoration-2 underline-offset-8">
                YAQUB TAWAB
              </h3>
              
              <p className="text-lg text-[#61728C] mb-6">
                Matric Number: <span className="font-semibold text-[#2D3C52]">2019/1/00031CS</span>
              </p>
              
              <p className="text-lg text-[#61728C] leading-relaxed max-w-4xl mx-auto mb-6">
                has successfully completed the <strong>Students Industrial Work Experience Scheme (SIWES)</strong> 
                program for a duration of <strong>Twenty-Four (24) weeks</strong> from 
                <strong> May 2025 to September 2025</strong> at
              </p>
              
              <h4 className="text-2xl font-bold text-[#2D3C52] mb-6">
                SOFTWORKS NIGERIA LIMITED
              </h4>
              
              <p className="text-lg text-[#61728C] mb-8">
                The student has demonstrated exceptional commitment, professionalism, and has fulfilled 
                all academic and industrial requirements of the program.
              </p>
            </div>

            {/* Achievement Badge */}
            <div className="flex justify-center mb-8">
              <div className="bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-300 rounded-full p-4">
                <CheckCircle2 className="w-16 h-16 text-green-600" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="space-y-8">
            {/* Signatures */}
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="border-b-2 border-[#2D3C52] mb-3 h-16 flex items-end justify-center">
                  <span className="text-2xl font-bold text-[#2D3C52] mb-2 italic">M. Yusuf</span>
                </div>
                <p className="font-semibold text-[#2D3C52]">Industry Supervisor</p>
                <p className="text-sm text-[#61728C]">Softworks Nigeria Ltd.</p>
              </div>
              
              <div>
                <div className="border-b-2 border-[#2D3C52] mb-3 h-16 flex items-end justify-center">
                  <span className="text-2xl font-bold text-[#2D3C52] mb-2 italic">A. Balogun</span>
                </div>
                <p className="font-semibold text-[#2D3C52]">Academic Supervisor</p>
                <p className="text-sm text-[#61728C]">FUTMINNA</p>
              </div>
              
              <div>
                <div className="border-b-2 border-[#2D3C52] mb-3 h-16 flex items-end justify-center">
                  <span className="text-2xl font-bold text-[#2D3C52] mb-2 italic">Prof. O. Awodele</span>
                </div>
                <p className="font-semibold text-[#2D3C52]">SIWES Coordinator</p>
                <p className="text-sm text-[#61728C]">Computer Science Dept.</p>
              </div>
            </div>

            {/* Date and Reference */}
            <div className="text-center border-t-2 border-[#2D3C52] pt-6">
              <p className="text-lg font-semibold text-[#2D3C52] mb-2">
                Awarded on {currentDate}
              </p>
              <p className="text-sm text-[#61728C]">
                Certificate Reference: <span className="font-mono font-semibold">{certificateRef}</span>
              </p>
              <div className="mt-4">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#2D3C52] to-[#61728C] rounded-full flex items-center justify-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-[#2D3C52]" />
                  </div>
                </div>
                <p className="text-xs text-[#61728C] mt-2 font-semibold">CERTIFIED AUTHENTIC</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
