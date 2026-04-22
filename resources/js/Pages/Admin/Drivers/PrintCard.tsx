import { Head } from "@inertiajs/react";
import { useEffect } from "react";
import { ShieldCheck, Map, Nfc } from "lucide-react";

interface Driver {
    id: number;
    name: string;
    name_en: string | null;
    image: string | null;
    user_code: string;
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
}

export default function PrintCard({ driver }: Props) {
    useEffect(() => {
        // Automatically trigger print when the component mounts
        setTimeout(() => {
            window.print();
        }, 1000); // 1s delay to allow images (QR and Avatar) to load
    }, []);

    const qrData = `DRIVER-${driver.user_code}`;
    const schoolName = driver.assigned_bus?.school?.name || "المدرسة العصرية العالمية الخاصة"; // Fallback to the one from image if no school

    return (
        <>
            <Head title={`Print ID Card - ${driver.name}`} />
            
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
                
                {/* --- FRONT CARD --- */}
                <div 
                    className="relative w-[340px] h-[540px] rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center bg-[#1E293B] text-white print:shadow-none"
                    style={{ border: '2px solid #cbd5e1' }}
                >
                    {/* Yellow/White Top Graphics */}
                    <div className="absolute top-0 w-full h-1/3 bg-[#FCD34D] flex justify-between">
                        {/* Logo Box (top left in RTL, top right in LTR) */}
                        <div className="absolute top-4 left-4 bg-white p-2 rounded-xl text-center shadow-sm z-10 w-16 h-16 flex items-center justify-center">
                            <div className="text-[#1E293B] font-black text-xs leading-tight">
                                <span className="text-[#F59E0B]">واصل</span><br/>Wasel
                            </div>
                        </div>
                    </div>
                    {/* Curved Navy Background overlapping the yellow */}
                    <div className="absolute top-0 w-full h-[180px]">
                        <svg viewBox="0 0 340 180" className="w-full h-full preserve-3d" preserveAspectRatio="none">
                             <path d="M 0 100 C 100 180, 240 180, 340 100 L 340 0 L 0 0 Z" fill="#1E293B"/>
                        </svg>
                    </div>

                    {/* Photo Area */}
                    <div className="relative mt-[80px] z-10 w-[140px] h-[140px] rounded-full border-[6px] border-white overflow-hidden bg-gray-200">
                        {driver.image ? (
                            <img src={`/storage/${driver.image}`} className="w-full h-full object-cover" alt="Driver" crossOrigin="anonymous"/>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl text-gray-500 font-bold">
                                {driver.name.charAt(0)}
                            </div>
                        )}
                    </div>

                    {/* Employee Identity */}
                    <div className="mt-6 flex flex-col items-center text-center px-4 w-full z-10">
                        <h2 className="text-lg font-black text-white leading-tight">شركة واصل لإدارة النقل والخدمات</h2>
                        <h3 className="text-[10px] font-bold text-gray-300 mt-1 uppercase tracking-widest text-center leading-tight">Wasel Transport Management<br/>And Services Company</h3>
                        
                        <div className="mt-8 space-y-3 w-full text-center">
                            <div className="flex items-center justify-center text-sm">
                                <span className="text-gray-300 font-medium">اسم الموظف :</span>
                                <strong className="ml-2 rtl:mr-2 text-white text-base">{driver.name}</strong>
                            </div>
                            <div className="flex items-center justify-center text-sm">
                                <span className="text-gray-300 font-medium">المسمى الوظيفي :</span>
                                <strong className="ml-2 rtl:mr-2 text-white">سائق حافلة</strong>
                            </div>
                            <div className="flex items-center justify-center text-sm">
                                <span className="text-gray-300 font-medium">الرقم الوظيفي :</span>
                                <strong className="ml-2 rtl:mr-2 text-white font-mono">{driver.user_code}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Icons */}
                    <div className="absolute bottom-6 w-full flex justify-center gap-6 text-gray-300">
                        <div className="w-10 h-10 rounded-full border border-gray-400 flex items-center justify-center">
                            <ShieldCheck size={20} strokeWidth={1.5} />
                        </div>
                        <div className="w-10 h-10 rounded-full border border-gray-400 flex items-center justify-center">
                            <Map size={20} strokeWidth={1.5} />
                        </div>
                        <div className="w-10 h-10 rounded-full border border-gray-400 flex items-center justify-center">
                            <Nfc size={20} strokeWidth={1.5} />
                        </div>
                    </div>
                </div>

                {/* --- BACK CARD --- */}
                <div 
                    className="relative w-[340px] h-[540px] rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center bg-[#1E293B] text-center text-white print:shadow-none"
                    style={{ border: '2px solid #cbd5e1' }}
                >
                    <div className="mt-8 px-6">
                        <h3 className="text-xl font-bold mb-4 border-b border-gray-600 inline-block pb-1">اشعار قانوني</h3>
                        <p className="text-[9px] text-gray-300 leading-relaxed font-semibold">
                            هذه البطاقة ملك لـ {schoolName} ومشغلة من قبل شركة واصل لإدارة النقل والخدمات وتعتبر وثيقة تعريفية لحاملها ومخصصة للاستخدامات المحددة من قبل المدرسة وغير قابلة للتداول بين الاشخاص وفي حالة تداولها او اساءة الاستخدام قد يؤدي الى مصادرتها واتخاذ الاجراءات القانونية اللازمة. في حال العثور على هذه البطاقة يرجى تسليمها لإدارة المدرسة.
                        </p>
                        
                        <h3 className="text-base font-bold mt-4 mb-2 uppercase tracking-wide">Legal Notice</h3>
                        <p className="text-[8px] text-gray-400 leading-relaxed max-w-[280px] mx-auto">
                            This card belongs to the {schoolName} and is operated by Wasel Transportation Management and Services Company. It is an identification document for its holder and is intended for the uses specified by the school and cannot be traded between persons and in case of circulation or misuse may lead to its confiscation and taking the necessary legal measures. If you find this card, please hand it over to the school administration.
                        </p>
                    </div>

                    <div className="mt-5 w-full max-w-[200px] flex justify-between text-sm font-bold bg-[#1E293B] relative z-20">
                        <div className="text-left">
                            <div className="text-white">Join</div>
                            <div className="text-white mt-2">Expire</div>
                        </div>
                        <div className="text-right text-white">
                            <div>{new Date(driver.created_at).toLocaleDateString('en-GB')}</div>
                            <div>{driver.driver?.license_expiry_date ? new Date(driver.driver.license_expiry_date).toLocaleDateString('en-GB') : 'N/A'}</div>
                        </div>
                    </div>

                    {/* Bottom Area (Yellow + QR Code) */}
                    <div className="absolute bottom-0 w-full h-[140px] bg-[#FCD34D] pt-4 flex flex-col items-center">
                        {/* Upper Semicircle (cutout into the dark) enclosing ID code */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-20 bg-white rounded-t-[100px] flex items-start justify-center pt-4 z-10 shadow-[0_-5px_15px_rgba(0,0,0,0.2)]">
                            <span className="text-[#1E293B] font-bold text-xl">{driver.user_code}</span>
                        </div>
                        
                        <div className="relative z-20 top-4 p-1 bg-white rounded-lg shadow-md border-2 border-dashed border-[#F59E0B]">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrData)}&margin=0&color=1E293B&bgcolor=FFFFFF`} 
                                alt="Driver QR" 
                                className="w-[100px] h-[100px]"
                                crossOrigin="anonymous"
                            />
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}
