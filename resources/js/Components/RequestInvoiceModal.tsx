import { useRef } from 'react';
import useTranslation from '@/hooks/useTranslation';
import Modal from '@/Components/Modal';
import { useTheme } from '@/Contexts/ThemeContext';
import { FileText, Printer, CheckCircle, Bus, Users, MapPin, Calendar, Building2, Banknote, ShieldCheck, Mail, Phone, Hash, Clock } from 'lucide-react';
import ApplicationLogo from '@/Components/ApplicationLogo';

interface AssignedBus {
    id: number;
    bus_number: string;
    plate_number: string;
    capacity: number;
}

interface BusRequest {
    id: number;
    request_type: string;
    requested_seats: number;
    start_date: string;
    end_date?: string;
    reason: string;
    special_requirements?: string;
    status: string;
    total_cost?: string | number | null;
    approvedBy?: { name: string };
    approved_at?: string;
    created_at: string;
    buses?: AssignedBus[];
}

interface Props {
    show: boolean;
    onClose: () => void;
    request: BusRequest | null;
    schoolName: string;
}

export default function RequestInvoiceModal({ show, onClose, request, schoolName }: Props) {
    const { t } = useTranslation();
    const { isRTL, theme } = useTheme();
    const isDark = theme === "dark";
    const printRef: any = useRef();

    if (!show || !request) return null;

    const handlePrint = () => {
        if (!printRef.current) return;

        // Temporary tag body for print overriding
        document.body.classList.add('printing-invoice-mode');

        // Clone node to append to body directly (bypasses Portal issues)
        const clone = printRef.current.cloneNode(true);
        clone.id = 'print-clone-container';
        // Remove React specific event listeners / avoid conflicts
        document.body.appendChild(clone);

        setTimeout(() => {
            window.print();
            // Cleanup
            document.body.removeChild(clone);
            document.body.classList.remove('printing-invoice-mode');
        }, 100);
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = isRTL
            ? { permanent: "باص دائم", temporary: "باص مؤقت", field_trip: "رحلة ميدانية" }
            : { permanent: "Permanent", temporary: "Temporary", field_trip: "Field Trip" };
        return labels[type] || t(type);
    };

    const totalCost = request.total_cost ? Number(request.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";

    return (
      <Modal show={show} onClose={onClose} maxWidth="3xl">
        {/* Control Header - Hidden in Print */}
        <div
          className={`p-4 flex items-center justify-between border-b print:hidden ${
            isDark
              ? "bg-gray-800 border-gray-700"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <h3
            className={`text-lg font-bold flex items-center gap-2 ${
              isDark ? "text-white" : "text-gray-800"
            }`}
          >
            <FileText className="w-5 h-5 text-[#0e7490]" />
            {isRTL ? "تقرير وتكلفة الطلب" : "Request Report & Cost"}
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#0e7490] hover:bg-cyan-700 text-white rounded-lg flex items-center gap-2 font-bold transition-colors"
            >
              <Printer className="w-4 h-4" />
              {isRTL ? "طباعة" : "Print"}
            </button>
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                isDark
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
            >
              {isRTL ? "إغلاق" : "Close"}
            </button>
          </div>
        </div>

        <div className="max-h-[80vh] overflow-y-auto w-full">
          {/* Printable Area - Formatted as absolute official A4 document layout */}
          <div
            ref={printRef}
            className={`p-10 print:p-8 print:w-[210mm] print:min-h-[297mm] print:mx-auto print:bg-white print:text-black ${
              isDark ? "bg-gray-900 text-white" : "bg-white text-gray-900"
            } ${isRTL ? "text-right" : "text-left"}`}
            style={{ direction: isRTL ? "rtl" : "ltr" }}
          >
            {/* Official Corporate Header */}
            <div className="flex justify-between items-start border-b-4 border-[#0e7490] pb-6 mb-6 print:border-[#0e7490]">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 p-1.5 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-gray-100 print:border-gray-200">
                  <ApplicationLogo className="w-full h-full" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-[#0e7490] tracking-tight print:text-[#0e7490]">
                    مؤسسة مسارات واصل
                  </h1>
                  <p className="text-xs font-bold text-gray-500 print:text-gray-600 tracking-wide mt-1">
                    لحلول النقل الذكي والخدمات اللوجستية
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400 font-bold print:text-gray-500">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> 9200-XXXXX
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" /> support@masarat.sa
                    </span>
                  </div>
                </div>
              </div>
              <div className={isRTL ? "text-left" : "text-right"}>
                <h2 className="text-xl font-black mb-1 opacity-80 print:text-black uppercase tracking-widest border-b-2 border-gray-200 inline-block pb-1">
                  {isRTL ? "تقرير تفاصيل وتكلفة الطلب" : "REPORT & COST"}
                </h2>
                <p className="font-mono text-lg font-bold text-[#0e7490] print:text-[#0e7490] mt-2 flex items-center justify-end gap-1">
                  <Hash className="w-4 h-4" /> REQ-
                  {request.id.toString().padStart(6, "0")}
                </p>
                <p className="text-xs text-gray-500 font-bold mt-1 flex items-center justify-end gap-1">
                  <Calendar className="w-3 h-3" />{" "}
                  {new Date().toLocaleDateString(isRTL ? "ar-SA" : "en-US")}
                </p>
              </div>
            </div>

            {/* High-Profile Important Entities Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* School Badge */}
              <div
                className={`p-4 rounded-xl border-l-4 border-l-[#0e7490] print:border-gray-300 print:border-l-[#0e7490] print:border print:bg-gray-50 bg-gray-50 dark:bg-gray-800`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-[#0e7490] print:text-[#0e7490]" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 print:text-gray-500">
                    {isRTL ? "الجهة الطالبة (المدرسة)" : "Requesting School"}
                  </p>
                </div>
                <h3 className="text-2xl font-black text-gray-900 print:text-black mb-2">
                  {schoolName}
                </h3>
                <p className="text-xs font-bold text-gray-600 print:text-gray-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {isRTL ? "تاريخ تقديم الطلب:" : "Requested On:"}{" "}
                  <span className="font-medium mx-1">
                    {new Date(request.created_at).toLocaleDateString()}
                  </span>
                </p>
              </div>

              {/* Approval Section */}
              <div
                className={`p-4 rounded-xl border print:border-gray-300 print:bg-white bg-white dark:bg-gray-800`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-5 h-5 text-green-600 print:text-green-600" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 print:text-gray-500">
                    {isRTL ? "التصديق المعتمد" : "Official Approval"}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 print:bg-green-100 print:-webkit-print-color-adjust-exact rounded text-green-800 text-sm font-bold mb-3">
                  <CheckCircle className="w-4 h-4" />
                  {isRTL ? "معتمد وموثق بنجاح" : "Approved & Verified"}
                </div>
                <p className="text-xs font-bold text-gray-600 print:text-gray-700 flex items-center gap-1 mb-1">
                  <Users className="w-3.5 h-3.5" />
                  {isRTL ? "اعتماد المسؤول:" : "Authorized by:"}{" "}
                  <span className="font-medium mx-1">
                    {request.approvedBy?.name || "N/A"}
                  </span>
                </p>
                <p className="text-xs font-bold text-gray-600 print:text-gray-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {isRTL ? "توقيت التصديق:" : "Timestamp:"}{" "}
                  <span className="font-medium mx-1">
                    {request.approved_at
                      ? new Date(request.approved_at).toLocaleDateString()
                      : "N/A"}
                  </span>
                </p>
              </div>
            </div>

            {/* Request Specifics - More Compact */}
            <div className="mb-6 border print:border-gray-300 rounded-lg overflow-hidden">
              <h4 className="text-sm font-black bg-gray-100 print:bg-gray-100 print:-webkit-print-color-adjust-exact text-gray-800 p-2.5 border-b print:border-gray-300 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {isRTL ? "مواصفات وسبب الطلب" : "Request Specifications"}
              </h4>
              <div className="grid grid-cols-3 divide-x divide-x-reverse print:divide-gray-300 border-b print:border-gray-300">
                <div className={`p-4 print:bg-white bg-white dark:bg-gray-800`}>
                  <p className="text-[10px] uppercase font-bold text-[#0e7490] mb-1">
                    {isRTL ? "نوع الخدمة" : "Service Type"}
                  </p>
                  <p className="font-bold text-sm text-gray-900 print:text-black">
                    {getTypeLabel(request.request_type)}
                  </p>
                </div>
                <div className={`p-4 print:bg-white bg-white dark:bg-gray-800`}>
                  <p className="text-[10px] uppercase font-bold text-[#0e7490] mb-1">
                    {isRTL ? "المقاعد المطلوبة" : "Requested Seats"}
                  </p>
                  <p className="font-bold text-sm text-gray-900 print:text-black flex items-center gap-1.5">
                    {request.requested_seats}{" "}
                    <Users className="w-4 h-4 text-gray-400" />
                  </p>
                </div>
                <div className={`p-4 print:bg-white bg-white dark:bg-gray-800`}>
                  <p className="text-[10px] uppercase font-bold text-[#0e7490] mb-1">
                    {isRTL ? "فترة التشغيل" : "Operation Period"}
                  </p>
                  <p className="font-bold text-sm text-gray-900 print:text-black flex items-center gap-1.5 flex-wrap">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {isRTL ? "من" : "From"}{" "}
                    <span className="text-[#0e7490]">{new Date(request.start_date).toLocaleDateString()}</span>{" "}
                    {request.end_date && (
                        <>
                            {isRTL ? "إلى" : "To"}{" "}
                            <span className="text-[#0e7490]">{new Date(request.end_date).toLocaleDateString()}</span>
                        </>
                    )}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 divide-x divide-x-reverse print:divide-gray-300 bg-gray-50 print:bg-white dark:bg-gray-800/50">
                <div className="p-4">
                  <p className="text-[10px] uppercase font-bold text-[#0e7490] mb-1">
                    {isRTL ? "المبررات والملاحظات" : "Reason & Remarks"}
                  </p>
                  <p className="font-medium text-sm text-gray-700 print:text-black leading-relaxed">
                    {request.reason || (isRTL ? "لا يوجد" : "None")}
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-[10px] uppercase font-bold text-[#0e7490] mb-1">
                    {isRTL ? "متطلبات خاصة" : "Special Requirements"}
                  </p>
                  <p className="font-medium text-sm text-gray-700 print:text-black leading-relaxed">
                    {request.special_requirements || (isRTL ? "لا توجد متطلبات خاصة" : "None")}
                  </p>
                </div>
              </div>
            </div>

            {/* Assigned Buses Table - Formal styling */}
            {request.buses && request.buses.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-black text-gray-800 print:text-black mb-2 flex items-center gap-2">
                  <Bus className="w-5 h-5 text-[#0e7490] print:text-[#0e7490]" />
                  {isRTL
                    ? "بيان الحافلات المُسندة والمركبات"
                    : "Assigned Fleet Manifesto"}
                </h4>
                <table className="w-full text-left print:text-black border-collapse border border-gray-300 print:border-black">
                  <thead>
                    <tr className="bg-gray-100 print:bg-gray-100 print:-webkit-print-color-adjust-exact">
                      <th className="py-2.5 px-4 font-bold text-xs uppercase text-gray-700 print:text-black border border-gray-300 print:border-black text-center w-12">
                        #
                      </th>
                      <th className="py-2.5 px-4 font-bold text-xs uppercase text-gray-700 print:text-black border border-gray-300 print:border-black text-center">
                        {isRTL ? "الرمز (كود)" : "Bus Code"}
                      </th>
                      <th className="py-2.5 px-4 font-bold text-xs uppercase text-gray-700 print:text-black border border-gray-300 print:border-black text-center">
                        {isRTL ? "رقم اللوحة" : "Plate No."}
                      </th>
                      <th className="py-2.5 px-4 font-bold text-xs uppercase text-gray-700 print:text-black border border-gray-300 print:border-black text-center">
                        {isRTL ? "سعة المركبة" : "Capacity"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {request.buses.map((bus, idx) => (
                      <tr key={bus.id} className="bg-white print:bg-white">
                        <td className="py-3 px-4 text-sm font-bold border border-gray-300 print:border-black text-center text-gray-500 print:text-gray-800">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 text-sm font-bold border border-gray-300 print:border-black text-center text-[#0e7490] print:text-black tracking-wide">
                          {bus.bus_number}
                        </td>
                        <td className="py-3 px-4 text-sm font-mono border border-gray-300 print:border-black text-center text-gray-700 print:text-black">
                          {bus.plate_number}
                        </td>
                        <td className="py-3 px-4 text-sm font-bold border border-gray-300 print:border-black text-center text-gray-800 print:text-black">
                          {bus.capacity}{" "}
                          <Users className="w-3.5 h-3.5 inline text-gray-400 ml-1" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Financial Summary & Disclaimers */}
            <div className="flex justify-between items-end mt-10 print:mt-10 mb-4 border-t-2 border-dashed border-gray-200 print:border-gray-400 pt-6">

              <div className="flex-1 max-w-sm">
                 <div className="p-4 bg-gray-50 dark:bg-gray-800 print:bg-white border print:border-gray-300 rounded-lg">
                    <p className="text-xs font-bold text-gray-800 print:text-black mb-1 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-gray-400" />
                        {isRTL ? "ملاحظة هامة للمدرسة" : "Important Notice"}
                    </p>
                    <p className="text-[11px] text-gray-500 print:text-gray-600 leading-relaxed">
                        {isRTL
                            ? "هذا التقرير مخصص لإطلاع المدرسة على تكلفة الخدمة والحافلات المُسندة ولا يُعتبر طلب أولي، حيث أن الطلب الرسمي والموافقة عليه تم إقراره إلكترونياً عبر البوابة."
                            : "This report is for the school's review to view service costs and assigned logistics. It does not replace the official electronic request approved via the portal."}
                    </p>
                 </div>
              </div>

              {/* Total Cost Block */}
              <div
                className={`p-4 rounded-lg min-w-[200px] text-center print:bg-[#0e7490] bg-[#0e7490] print:-webkit-print-color-adjust-exact`}
              >
                <div className="flex items-center justify-center gap-2 text-white/90 mb-1">
                  <Banknote className="w-4 h-4" />
                  <p className="text-[10px] uppercase font-bold">
                    {isRTL ? "التكلفة المُعتمدة للخدمة" : "Approved Subtotal"}
                  </p>
                </div>
                <p className="text-2xl font-black text-white">{totalCost}</p>
                <p className="text-[10px] font-bold text-white/70 mt-0.5">
                  {isRTL ? "ريال سعودي" : "SAR"}
                </p>
              </div>
            </div>

            {/* Footer Disclaimers */}
            <div className="mt-8 text-center opacity-70 text-[10px] font-bold tracking-widest text-gray-500 print:text-black break-after-avoid">
              <p className="mt-1 font-mono tracking-widest uppercase bg-gray-100 print:bg-gray-100 print:-webkit-print-color-adjust-exact inline-block px-2 py-0.5 rounded text-gray-400">
                MASARAT WASEL SYSTEM ENGINE V2.0.0
              </p>
            </div>
          </div>
        </div>

        {/* Print Override Styles */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
                @media print {
                    @page { size: A4 portrait; margin: 10mm; }
                    /* Hide EVERYTHING in body when printing */
                    body.printing-invoice-mode > * {
                        display: none !important;
                    }
                    /* Except the cloned node */
                    body.printing-invoice-mode > #print-clone-container {
                        display: block !important;
                        position: relative !important;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white !important;
                        color: black !important;
                    }
                    /* Force color printing */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `,
          }}
        />
      </Modal>
    );
}
