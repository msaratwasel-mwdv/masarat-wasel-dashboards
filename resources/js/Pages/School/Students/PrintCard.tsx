import { Head } from "@inertiajs/react";
import { useEffect } from "react";
import { ShieldCheck, GraduationCap, Nfc } from "lucide-react";

interface Student {
  id: number;
  full_name: string;
  full_name_en: string;
  student_code: string;
  national_id: string;
  gender: string;
  image: string | null;
  created_at: string;
  current_enrollment: {
    classroom: { id: number; name: string };
  } | null;
  guardians?: {
    id: number;
    name: string;
    phone: string;
  }[];
}

interface Props {
  student: Student;
}

export default function PrintCard({ student }: Props) {
  useEffect(() => {
    // Automatically trigger print when the component mounts
    setTimeout(() => {
      window.print();
    }, 1000); // 1s delay to allow images (QR and Avatar) to load
  }, []);

  const qrData = `STUDENT-${student.student_code || student.national_id}`;
  const className = student.current_enrollment?.classroom?.name || "—";

  // Formatting dates for display
  const joinDateObj = student.created_at
    ? new Date(student.created_at)
    : new Date();
  const joinDate = joinDateObj.toLocaleDateString("en-GB"); // DD/MM/YYYY
  const expireDateObj = new Date(joinDateObj);
  expireDateObj.setFullYear(expireDateObj.getFullYear() + 1); // Expiry 1 year later
  const expireDate = expireDateObj.toLocaleDateString("en-GB");

  return (
    <>
      <Head title={`طباعة بطاقة - ${student.full_name}`} />

      {/* Print Override Styles */}
      <style>{`
        @media print {
          @page { margin: 0; size: A4 portrait; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: transparent !important; }
          #app-navbar, #app-sidebar, header { display: none !important; }
        }

        body {
          background-color: #f3f4f6;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          font-family: 'Tajawal', sans-serif, system-ui;
        }
      `}</style>

      <div className="w-full max-w-4xl mx-auto flex flex-wrap justify-center gap-10 p-8 print:p-0 print:gap-8">
        {/* ======================= SINGLE CARD ======================= */}
        <div
          className="relative w-[340px] h-[540px] rounded-[24px] overflow-hidden shadow-2xl flex flex-col bg-white print:shadow-none"
          style={{ border: "1px solid #e2e8f0" }}
          dir="ltr"
        >
          {/* Top Navy Header */}
          <div className="bg-[#1f285c] w-full h-[60px] flex items-center justify-between px-5 text-white relative shrink-0">
            {/* Logo */}
            <div className="flex flex-col items-center justify-center">
              <img
                src="/images/logo-blue-no-background.png"
                alt="Wasel Logo"
                className="w-14 h-auto object-contain bg-white/10 rounded px-1 pb-0.5"
              />
            </div>
            {/* Header Text */}
            <div className="text-right" dir="rtl">
              <h2 className="text-[12px] font-black text-[#f5db68] leading-tight">
                شركة إدارة النقل والخدمات
              </h2>
              <h3
                className="text-[6px] font-bold uppercase tracking-widest text-gray-200 mt-1"
                dir="ltr"
              >
                WASEL TRANSPORTATION & SERVICES
              </h3>
            </div>
          </div>

          {/* Card Title */}
          <div className="text-center mt-3 shrink-0">
            <h1
              className="text-[20px] font-black text-[#1f285c] leading-none"
              dir="rtl"
            >
              بطاقة هوية {student.gender == "male" ? "طالب" : "طالبة"}
            </h1>
            <h2 className="text-[14px] font-black text-[#1f285c] tracking-widest uppercase mt-1">
              STUDENT <span className="text-[#f5db68]">ID CARD</span>
            </h2>
          </div>

          {/* Student Photo */}
          <div className="flex justify-center mt-2 shrink-0 z-10 relative">
            <div className="relative w-[85px] h-[85px] rounded-full overflow-hidden bg-gray-200 p-1 border-[3px] border-[#1f285c] shadow-sm">
              {student.image ? (
                <img
                  src={`/storage/${student.image}`}
                  className="w-full h-full object-cover rounded-full"
                  alt="Student"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-full h-full rounded-full flex items-center justify-center text-3xl text-[#1f285c] font-black bg-gray-100">
                  {student.full_name.charAt(0)}
                </div>
              )}
            </div>
          </div>

          {/* Data Rows */}
          <div className="px-4 mt-3 w-full flex flex-col justify-start space-y-1 shrink-0 z-10 relative bg-white">
            {/* Student Name */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-1">
              <div className="w-[75px] text-[8.5px] font-bold text-gray-400 text-left uppercase tracking-wide">
                Student Name:
              </div>
              <div className="flex-1 px-1 flex flex-col items-center justify-center text-center">
                <span
                  className="text-[12px] font-black text-[#1f285c] leading-tight w-full truncate"
                  dir="rtl"
                >
                  {student.full_name}
                </span>
                {student.full_name_en && (
                  <span className="text-[8.5px] font-bold text-gray-500 uppercase leading-tight mt-0.5 w-full truncate">
                    {student.full_name_en}
                  </span>
                )}
              </div>
              <div
                className="w-[75px] text-[10px] font-black text-gray-500 text-right"
                dir="rtl"
              >
                {student.gender == "male" ? "اسم الطالب:" : "اسم الطالبة:"}
              </div>
            </div>

            {/* Student ID */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-1">
              <div className="w-[75px] text-[8.5px] font-bold text-gray-400 text-left uppercase tracking-wide">
                Student ID:
              </div>
              <div className="flex-1 px-1 flex items-center justify-center text-center">
                <span className="text-[11px] font-black text-[#1f285c] font-mono">
                  {student.student_code || student.national_id}
                </span>
              </div>
              <div
                className="w-[75px] text-[10px] font-black text-gray-500 text-right"
                dir="rtl"
              >
                رقم البطاقة:
              </div>
            </div>

            {/* Major/Grade */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-1">
              <div className="w-[75px] text-[8.5px] font-bold text-gray-400 text-left uppercase tracking-wide">
                Major/Grade:
              </div>
              <div className="flex-1 px-1 flex flex-col items-center justify-center text-center">
                <span
                  className="text-[11px] font-black text-[#1f285c] text-center truncate"
                  dir="rtl"
                >
                  {className}
                </span>
              </div>
              <div
                className="w-[75px] text-[10px] font-black text-gray-500 text-right"
                dir="rtl"
              >
                المرحلة/التخصص:
              </div>
            </div>

            {/* Dates Row (Combined to save space) */}
            <div className="flex items-center justify-between pb-1">
              {/* Expire Date Left */}
              <div className="w-[100px] flex flex-col items-start">
                <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wide">
                  Expire Date:
                </span>
                <span className="text-[10px] font-bold text-[#1f285c]">
                  {expireDate}
                </span>
              </div>
              {/* Join Date Right */}
              <div
                className="w-[100px] flex flex-col items-end text-right"
                dir="rtl"
              >
                <span className="text-[10px] font-black text-gray-500">
                  تاريخ الإصدار:
                </span>
                <span
                  className="text-[10px] font-bold text-[#1f285c]"
                  dir="ltr"
                >
                  {joinDate}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="flex-1 flex justify-center items-center relative z-20 mt-1 mb-2">
            <div className="p-1.5 bg-white border-[3px] border-[#f5db68] rounded-xl shadow-sm">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(
                  qrData
                )}&margin=0&color=1f285c&bgcolor=FFFFFF`}
                alt="Student QR"
                className="w-[85px] h-[85px]"
                crossOrigin="anonymous"
              />
            </div>
          </div>

          {/* Bottom Navy Footer Section */}
          <div className="relative w-full h-[65px] bg-[#1f285c] flex items-center justify-center gap-8 text-white mt-auto shrink-0 z-10">
            {/* Top Curve */}
            <div className="absolute -top-[14px] left-0 w-full overflow-hidden leading-none pointer-events-none">
              <svg
                viewBox="0 0 340 15"
                className="w-full h-[15px] preserve-3d"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,15 C100,0 240,0 340,15 L340,15 L0,15 Z"
                  fill="#1f285c"
                />
              </svg>
            </div>

            {/* Icons */}
            <div className="relative z-10 w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center bg-white/5">
              <ShieldCheck
                size={16}
                strokeWidth={1.5}
                className="text-[#f5db68]"
              />
            </div>
            <div className="relative z-10 w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center bg-white/5">
              <GraduationCap
                size={16}
                strokeWidth={1.5}
                className="text-[#f5db68]"
              />
            </div>
            <div className="relative z-10 w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center bg-white/5">
              <Nfc size={16} strokeWidth={1.5} className="text-[#f5db68]" />
            </div>

            {/* Flag Ornament Placeholder (Oman shape) - Added for a national/academic touch */}
            <div className="absolute bottom-0 right-4 w-8 h-4 flex rounded-t-sm overflow-hidden bg-white shadow-sm opacity-90">
              <div className="w-1/3 h-full bg-red-600"></div>
              <div className="w-2/3 h-full flex flex-col">
                <div className="h-1/3 w-full bg-white"></div>
                <div className="h-1/3 w-full bg-red-600"></div>
                <div className="h-1/3 w-full bg-green-600"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
