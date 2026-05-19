import React from "react";
import ApplicationLogo from "@/Components/ApplicationLogo";
import { GraduationCap } from "lucide-react";

interface PrintReportHeaderProps {
  title: string;
  schoolName: string;
  schoolLogo: string | null;
  printDate?: string;
  schoolAdminText?: string;
  companyNameAr?: string;
  companyNameEn?: string;
}

export default function PrintReportHeader({
  title,
  schoolName,
  schoolLogo,
  printDate,
  schoolAdminText = "إدارة المدرسة",
  companyNameAr = "شركة مسارات واصل",
  companyNameEn = "Masarat Wasel",
}: PrintReportHeaderProps) {
  const dateStr = printDate || new Date().toLocaleDateString("ar-SA", { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex items-center justify-between border-b-2 border-gray-300 pb-6 mb-8 mt-4 px-4" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
      {/* Company Logo (Right) */}
      <div className="flex flex-col items-center justify-center w-1/4">
        <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-b from-[#1e293b] to-[#0f172a] shadow-lg p-2 mb-2">
          <div className="w-full h-full rounded-lg bg-white flex items-center justify-center p-1.5 shadow-sm">
            <ApplicationLogo className="w-full h-full object-contain" />
          </div>
        </div>
        <span className="text-xs font-bold text-gray-800">{companyNameAr}</span>
        <span className="text-[10px] text-gray-500 uppercase tracking-widest">{companyNameEn}</span>
      </div>

      {/* Report Title & Info (Center) */}
      <div className="flex flex-col items-center justify-center text-center w-2/4 px-4">
        <h1 className="text-3xl font-black mb-2 text-black">{title}</h1>
        <h2 className="text-xl font-bold text-gray-800">{schoolName}</h2>
        <div className="mt-4 inline-block border-2 border-gray-200 rounded-xl px-5 py-2 bg-gray-50">
          <span className="text-sm font-bold text-gray-700">{dateStr}</span>
        </div>
      </div>

      {/* School Logo (Left) */}
      <div className="flex flex-col items-center justify-center w-1/4">
        {schoolLogo ? (
          <>
            <div className="w-16 h-16 rounded-xl flex items-center justify-center border-2 border-gray-100 shadow-md p-1.5 mb-2 bg-white" style={{ backgroundColor: '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              <img src={schoolLogo} alt="School Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xs font-bold text-gray-800 text-center">{schoolName}</span>
          </>
        ) : (
          <span className="text-xs font-bold text-gray-800 text-center">{schoolName}</span>
        )}
      </div>
    </div>
  );
}
