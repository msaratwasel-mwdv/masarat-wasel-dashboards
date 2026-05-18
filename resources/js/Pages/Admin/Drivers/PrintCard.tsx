import { Head } from "@inertiajs/react";
import { useEffect } from "react";
import { ShieldCheck, Map, Nfc } from "lucide-react";

interface Driver {
  id: number;
  name: string;
  name_en: string | null;
  image: string | null;
  user_code: string;
  national_id: string;
  created_at: string;
  driver: {
    license_expiry_date: string;
  } | null;
  assigned_bus: {
    school: { name: string } | null;
  } | null;
}

interface Props {
  driver: Driver;
  jobTitle?: string;
}

export default function PrintCard({ driver, jobTitle = "سائق حافلة" }: Props) {
  useEffect(() => {
    setTimeout(() => {
      window.print();
      // Auto-close tab after print/cancel
      window.close();
    }, 1000);
  }, []);

  return (
    <>
      <Head title={`Print ID Card - ${driver.name}`} />

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

      <div className="w-full max-w-4xl mx-auto flex justify-center p-8 print:p-0">
        {/* ======================= EXACT MATCH CARD ======================= */}
        <div
          className="relative w-[340px] h-[540px] rounded-[24px] overflow-hidden shadow-2xl text-white print:shadow-none"
          style={{ backgroundColor: "#182436", border: "1px solid #cbd5e1" }}
          dir="ltr"
        >
          {/* 1. White Edge Curve (الخط الأبيض الفاصل) */}
          {/* استخدمنا Q-Bezier لعمل خط مستقيم من الجوانب ثم ينحني بنعومة للمنتصف */}
          <svg
            className="absolute top-0 left-0 w-full z-0"
            viewBox="0 0 340 220"
            style={{ height: "220px" }}
          >
            <path
              d="M0 0 L340 0 L340 145 Q255 145 170 195 Q85 145 0 145 Z"
              fill="#ffffff"
            />
          </svg>

          {/* 2. Yellow Background Curve (الخلفية الصفراء) */}
          <svg
            className="absolute top-0 left-0 w-full z-10"
            viewBox="0 0 340 220"
            style={{ height: "220px" }}
          >
            <path
              d="M0 0 L340 0 L340 120 Q255 120 170 170 Q85 120 0 120 Z"
              fill="#fad046"
            />
          </svg>

          {/* 3. Top Left Small Logo (شعار الشركة في الزاوية) */}

          {/* 4. Center Navy Pillar with Drop Shadow (العمود الكحلي المركزي مع الظل) */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[140px] h-[230px] rounded-b-[70px] z-20"
            style={{
              backgroundColor: "#182436",
              boxShadow:
                "0 12px 20px -5px rgba(0, 0, 0, 0.65)" /* هذا الظل هو الذي يعطي البروز المطابق للصورة */,
            }}
          >
            <div className="absolute left-10 top-5 w-[60px] h-[60px] bg-white rounded-lg shadow-sm z-30 flex items-center justify-center p-1">
              <img
                src="/images/logo-white-no-background.png"
                alt="Logo"
                className="w-full h-full object-contain"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>
            {/* Avatar (الصورة الشخصية مدمجة بدقة داخل العمود) */}
            <div className="absolute bottom-[10px] left-[10px] w-[120px] h-[120px] rounded-full border-[3.5px] border-[#cbd5e1] shadow-inner overflow-hidden bg-gray-200">
              {driver.image ? (
                <img
                  src={`/storage/${driver.image}`}
                  className="w-full h-full object-cover"
                  alt="Driver"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-[#182436] font-black bg-white">
                  {(driver.name_en || driver.name).charAt(0)}
                </div>
              )}
            </div>
          </div>

          {/* 5. Main Content Area */}
          <div
            className="mt-[255px] w-full flex flex-col items-center text-center px-4 relative z-30"
            dir="rtl"
          >
            <h2 className="text-[18px] font-bold text-white tracking-wide mb-1.5">
              شركة واصل لإدارة النقل والخدمات
            </h2>
            <h3 className="text-[9px] font-bold text-gray-300 uppercase tracking-widest leading-[1.6] max-w-[280px]">
              WASEL TRANSFERY MANAGEMENT
              <br />
              AND SERVICES COMPANY
            </h3>

            <div className="mt-7 flex flex-col items-center space-y-2.5">
              <div className="text-[14.5px] font-bold text-gray-200">
                الاسم الموظف :{" "}
                <span className="text-white mr-1">{driver.name_en || driver.name}</span>
              </div>
              <div className="text-[14.5px] font-bold text-gray-200">
                المسمى الوظيفي :{" "}
                <span className="text-white mr-1">{jobTitle}</span>
              </div>
              <div className="text-[14.5px] font-bold text-gray-200">
                الرقم المدني :{" "}
                <span className="text-white font-mono mr-1">
                  {driver.national_id}
                </span>
              </div>
            </div>
          </div>

          {/* 6. Bottom Icons Container */}
          <div className="absolute bottom-6 w-full flex justify-center gap-7 z-30">
            <div className="w-[42px] h-[42px] rounded-full border-[1.5px] border-gray-400/70 flex items-center justify-center text-gray-300">
              <ShieldCheck size={20} strokeWidth={1.5} />
            </div>
            <div className="w-[42px] h-[42px] rounded-full border-[1.5px] border-gray-400/70 flex items-center justify-center text-gray-300">
              <Map size={20} strokeWidth={1.5} />
            </div>
            <div className="w-[42px] h-[42px] rounded-full border-[1.5px] border-gray-400/70 flex items-center justify-center text-gray-300">
              <Nfc size={20} strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
