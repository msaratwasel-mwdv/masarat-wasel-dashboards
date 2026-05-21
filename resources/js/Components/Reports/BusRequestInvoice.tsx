import React from 'react';
import Modal from '@/Components/Modal';
import OmaniRial from '@/Components/OmaniRial';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Printer, X, FileText } from 'lucide-react';

interface Person {
  name: string;
  name_en?: string;
  first_name_ar?: string;
  last_name_ar?: string;
  first_name_en?: string;
  last_name_en?: string;
  email?: string;
  user?: any;
}

interface Bus {
  id: number;
  bus_number: string;
  plate_number: string;
  capacity: number;
  driver_id: number | null;
  assistant_id: number | null;
  driver?: Person;
  assistant?: Person;
}

interface BusRequest {
  id: number;
  school_id: number;
  school?: { id: number; name: string };
  request_type: string;
  seats: number;
  start_date: string;
  end_date?: string;
  purpose: string;
  details?: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string;
  cost?: string | number;
  bus?: Bus;
  approved_at?: string;
  created_at: string;
}

interface BusRequestInvoiceProps {
  show: boolean;
  onClose: () => void;
  request: BusRequest | null;
  isRtl: boolean;
  schoolName?: string;
}

export default function BusRequestInvoice({ show, onClose, request, isRtl, schoolName }: BusRequestInvoiceProps) {
  if (!request) return null;

  const getCrewName = (person?: Person | null) => {
    if (!person) return isRtl ? "غير معين" : "Not Assigned";

    // Eager-loading safety guard: Drivers store names on their related user model
    const actualPerson = (person as any).user || person;

    const nameAr = actualPerson.first_name_ar || actualPerson.last_name_ar
      ? `${actualPerson.first_name_ar || ""} ${actualPerson.last_name_ar || ""}`.trim()
      : actualPerson.name;

    const nameEn = actualPerson.first_name_en || actualPerson.last_name_en
      ? `${actualPerson.first_name_en || ""} ${actualPerson.last_name_en || ""}`.trim()
      : actualPerson.name_en;

    const email = actualPerson.email || "";

    if (isRtl) {
      return nameAr || nameEn || email || "غير معين";
    } else {
      return nameEn || nameAr || email || "Not Assigned";
    }
  };

  const resolvedSchoolName = request.school?.name || schoolName || (isRtl ? "مدرسة مسارات واصل" : "Masarat Wasel School");

  const getTypeText = (type: string) => {
    switch (type) {
      case 'permanent': return isRtl ? 'دائم' : 'Permanent';
      case 'temporary': return isRtl ? 'مؤقت' : 'Temporary';
      default: return type;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return isRtl ? 'قيد الانتظار' : 'Pending';
      case 'approved': return isRtl ? 'مقبول / معتمد' : 'Approved / Confirmed';
      case 'rejected': return isRtl ? 'مرفوض' : 'Rejected';
      default: return status;
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=850,height=950');
    if (!printWindow) return;

    const logoHtml = `<img src="/images/logo2.png" alt="Wasel Logo" style="height: 55px; object-fit: contain;" />`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${isRtl ? `تقرير طلب حافلة - #INV-${request.id}` : `Bus Request Report - #INV-${request.id}`}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Outfit:wght@400;600;700;800&display=swap');
            
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }

            body {
              font-family: ${isRtl ? "'Cairo', sans-serif" : "'Outfit', sans-serif"};
              direction: ${isRtl ? 'rtl' : 'ltr'};
              padding: 30px;
              color: #0f2044;
              background-color: #ffffff;
              line-height: 1.5;
              font-size: 13px;
            }

            .header-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }

            .header-logo {
              width: 50%;
              text-align: ${isRtl ? 'right' : 'left'};
              vertical-align: middle;
            }

            .header-meta {
              width: 50%;
              text-align: ${isRtl ? 'left' : 'right'};
              font-size: 12px;
              line-height: 1.5;
              font-weight: 700;
              color: #0f2044;
              vertical-align: middle;
            }

            .divider {
              border-top: 3px double #0f2044;
              margin: 15px 0 20px 0;
            }

            .title-badge {
              text-align: center;
              font-size: 18px;
              font-weight: 800;
              letter-spacing: 0.5px;
              margin-bottom: 25px;
              color: #0f2044;
              text-transform: uppercase;
            }

            .title-badge span {
              border-bottom: 2px solid #0f2044;
              padding-bottom: 4px;
              display: inline-block;
            }

            .info-section {
              margin-bottom: 20px;
              page-break-inside: avoid;
            }

            .section-title {
              font-size: 13px;
              font-weight: 800;
              border-bottom: 1.5px solid #0f2044;
              padding-bottom: 4px;
              margin-bottom: 12px;
              text-transform: uppercase;
              color: #0f2044;
              letter-spacing: 0.5px;
            }

            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              font-size: 12.5px;
            }

            .info-item {
              display: flex;
              justify-content: space-between;
              border-bottom: 1px dashed #cbd5e1;
              padding-bottom: 4px;
            }

            .info-label {
              font-weight: 600;
              color: #475569;
            }

            .info-value {
              font-weight: 700;
              color: #0f2044;
            }

            .details-box {
              font-size: 12.5px;
              background-color: #f8fafc;
              border: 1px solid #cbd5e1;
              padding: 12px;
              border-radius: 6px;
              margin-bottom: 8px;
            }

            .details-title {
              font-weight: 800;
              margin-bottom: 4px;
              color: #0f2044;
            }

            .cost-card {
              background-color: #f8fafc;
              border: 2px solid #0f2044;
              padding: 14px 18px;
              border-radius: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-top: 25px;
              margin-bottom: 25px;
              page-break-inside: avoid;
            }

            .cost-label {
              font-size: 13.5px;
              font-weight: 800;
              color: #0f2044;
            }

            .cost-value {
              font-size: 20px;
              font-weight: 900;
              color: #0f2044;
            }

            .signatures-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 60px;
              margin-top: 50px;
              text-align: center;
              font-size: 12px;
              font-weight: 700;
              page-break-inside: avoid;
            }

            .signature-title {
              color: #0f2044;
              margin-bottom: 45px;
            }

            .signature-line {
              border-top: 1.5px solid #0f2044;
              padding-top: 8px;
              color: #475569;
            }

            .footer {
              margin-top: 55px;
              text-align: center;
              font-size: 10px;
              color: #64748b;
              font-weight: 600;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
              page-break-inside: avoid;
            }

            @media print {
              body {
                padding: 15px;
              }
              .cost-card {
                background-color: #f8fafc !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .details-box {
                background-color: #f8fafc !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td class="header-logo">
                ${logoHtml}
              </td>
              <td class="header-meta">
                <div>${isRtl ? 'شركة مسارات واصل لخدمات النقل' : 'Masarat Wasel Transport Services'}</div>
                <div>${isRtl ? 'تاريخ الطباعة: ' : 'Print Date: '} ${new Date().toLocaleDateString(isRtl ? 'ar-OM' : 'en-US')}</div>
                <div>${isRtl ? 'رقم المستند: ' : 'Document No: '} #INV-${request.id}</div>
              </td>
            </tr>
          </table>

          <div class="divider"></div>

          <div class="title-badge">
            <span>${isRtl ? 'تقرير الفاتورة الرسمي للطلب' : 'OFFICIAL REQUEST INVOICE REPORT'}</span>
          </div>

          <div class="info-section">
            <div class="section-title">${isRtl ? 'معلومات الطلب والمدرسة' : 'REQUEST & SCHOOL INFORMATION'}</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">${isRtl ? 'اسم المدرسة:' : 'School Name:'}</span>
                <span class="info-value">${resolvedSchoolName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">${isRtl ? 'نوع الطلب:' : 'Request Type:'}</span>
                <span class="info-value">${getTypeText(request.request_type)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">${isRtl ? 'المقاعد المطلوبة:' : 'Requested Seats:'}</span>
                <span class="info-value">${request.seats} ${isRtl ? 'مقعد' : 'Seats'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">${isRtl ? 'حالة الطلب:' : 'Request Status:'}</span>
                <span class="info-value">${getStatusText(request.status)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">${isRtl ? 'تاريخ البدء:' : 'Start Date:'}</span>
                <span class="info-value">${new Date(request.start_date).toLocaleDateString(isRtl ? 'ar-OM' : 'en-US')}</span>
              </div>
              ${request.end_date ? `
              <div class="info-item">
                <span class="info-label">${isRtl ? 'تاريخ الانتهاء:' : 'End Date:'}</span>
                <span class="info-value">${new Date(request.end_date).toLocaleDateString(isRtl ? 'ar-OM' : 'en-US')}</span>
              </div>
              ` : ''}
            </div>
          </div>

          <div class="info-section">
            <div class="section-title">${isRtl ? 'الغرض وتفاصيل الطلب' : 'PURPOSE & REQUEST DETAILS'}</div>
            <div class="details-box">
              <div class="details-title">${isRtl ? 'الغرض من الطلب:' : 'Purpose of Request:'}</div>
              <div>${request.purpose}</div>
            </div>
            ${request.details ? `
            <div class="details-box">
              <div class="details-title">${isRtl ? 'تفاصيل إضافية:' : 'Additional Details:'}</div>
              <div>${request.details}</div>
            </div>
            ` : ''}
          </div>

          ${request.bus ? `
          <div class="info-section">
            <div class="section-title">${isRtl ? 'بيانات الحافلة وطاقم العمل المخصص' : 'ASSIGNED BUS & CREW DETAILS'}</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">${isRtl ? 'رقم الحافلة:' : 'Bus Number:'}</span>
                <span class="info-value">#${request.bus.bus_number}</span>
              </div>
              <div class="info-item">
                <span class="info-label">${isRtl ? 'رقم اللوحة:' : 'Plate Number:'}</span>
                <span class="info-value">${request.bus.plate_number}</span>
              </div>
              <div class="info-item">
                <span class="info-label">${isRtl ? 'سعة الحافلة:' : 'Bus Capacity:'}</span>
                <span class="info-value">${request.bus.capacity} ${isRtl ? 'مقعد' : 'Seats'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">${isRtl ? 'اسم السائق:' : 'Driver Name:'}</span>
                <span class="info-value">${getCrewName(request.bus.driver)}</span>
              </div>
              <div class="info-item" style="grid-column: span 2;">
                <span class="info-label">${isRtl ? 'المشرفة (المساعدة):' : 'Supervisor (Assistant):'}</span>
                <span class="info-value">${getCrewName(request.bus.assistant)}</span>
              </div>
            </div>
          </div>
          ` : ''}

          ${request.cost ? `
          <div class="cost-card">
            <span class="cost-label">${isRtl ? 'التكلفة الإجمالية المعتمدة:' : 'Approved Total Cost:'}</span>
            <span class="cost-value">${Number(request.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${isRtl ? 'ريال عُماني' : 'Omani Rial (OMR)'}</span>
          </div>
          ` : ''}

          <div class="signatures-grid">
            <div>
              <div class="signature-title">${isRtl ? 'اعتماد إدارة المدرسة والختم' : 'School Administration Signature & Stamp'}</div>
              <div class="signature-line">${resolvedSchoolName}</div>
            </div>
            <div>
              <div class="signature-title">${isRtl ? 'اعتماد شركة مسارات واصل' : 'Masarat Wasel Authorized Signature'}</div>
              <div class="signature-line">${isRtl ? 'إدارة العمليات والتشغيل' : 'Operations Management'}</div>
            </div>
          </div>

          <div class="footer">
            <p>${isRtl ? 'هذا التقرير تم إنشاؤه إلكترونياً وصالح لجميع المعاملات الرسمية دون الحاجة لتوقيع يدوي' : 'This report is generated electronically and is valid for all official transactions without physical signature'}</p>
            <p>© ${new Date().getFullYear()} ${isRtl ? 'شركة مسارات واصل للنقل. جميع الحقوق محفوظة.' : 'Masarat Wasel Transport Co. All Rights Reserved.'}</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <Modal show={show} onClose={onClose} maxWidth="3xl">
      <div className="bg-white dark:bg-[#1a2845] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className={`p-6 border-b border-gray-100 dark:border-[#243460] flex items-center justify-between bg-gray-50 dark:bg-[#111e35] ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-[#0f2044]/5 dark:bg-[#7ba7e8]/10 flex items-center justify-center text-[#0f2044] dark:text-[#7ba7e8]">
              <FileText className="w-5 h-5" />
            </div>
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <h3 className="font-extrabold text-lg text-[#0f2044] dark:text-white">
                {isRtl ? 'معاينة التقرير الرسمي' : 'Official Report Preview'}
              </h3>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">
                {isRtl ? `طلب حافلة #INV-${request.id}` : `Bus Request #INV-${request.id}`}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Preview Body - styled EXACTLY like the print version to avoid any reversing layout issue */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gray-100/50 dark:bg-[#152039]/50">
          <div 
            className="bg-white dark:bg-white text-[#0f2044] dark:text-[#0f2044] p-10 max-w-2xl mx-auto shadow-md border border-gray-200"
            dir={isRtl ? "rtl" : "ltr"}
            style={{ fontFamily: isRtl ? "'Cairo', sans-serif" : "'Outfit', sans-serif" }}
          >
            {/* Logo and meta */}
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
              <ApplicationLogo className="h-14 w-auto" />
              <div className={`text-xs space-y-1 font-bold text-slate-800 dark:text-slate-800 ${isRtl ? 'text-left' : 'text-right'}`}>
                <p>{isRtl ? 'شركة مسارات واصل لخدمات النقل' : 'Masarat Wasel Transport Services'}</p>
                <p>{isRtl ? 'رقم المستند: ' : 'Document No: '} #INV-{request.id}</p>
                <p>{isRtl ? 'تاريخ الطباعة: ' : 'Print Date: '} {new Date().toLocaleDateString(isRtl ? 'ar-OM' : 'en-US')}</p>
              </div>
            </div>

            <div className="divider" style={{ borderTop: "3px double #0f2044", margin: "15px 0 20px 0" }}></div>

            <div className="text-center mb-6">
              <h2 className="text-lg font-black text-[#0f2044] dark:text-[#0f2044] border-b-2 border-[#0f2044] dark:border-[#0f2044] pb-1 inline-block">
                {isRtl ? 'تقرير الفاتورة الرسمي للطلب' : 'OFFICIAL REQUEST INVOICE REPORT'}
              </h2>
            </div>

            {/* Info table */}
            <div className="mb-6">
              <h4 className={`text-xs font-black text-[#0f2044] dark:text-[#0f2044] border-b border-gray-300 dark:border-gray-300 pb-1 mb-3 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                {isRtl ? 'معلومات الطلب والمدرسة' : 'REQUEST & SCHOOL INFORMATION'}
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex justify-between border-b border-gray-100 dark:border-gray-100 pb-1.5">
                  <span className="text-slate-500 dark:text-slate-500 font-bold">{isRtl ? 'اسم المدرسة:' : 'School Name:'}</span>
                  <span className="font-extrabold text-[#0f2044] dark:text-[#0f2044]">{resolvedSchoolName}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 dark:border-gray-100 pb-1.5">
                  <span className="text-slate-500 dark:text-slate-500 font-bold">{isRtl ? 'نوع الطلب:' : 'Request Type:'}</span>
                  <span className="font-extrabold text-[#0f2044] dark:text-[#0f2044]">{getTypeText(request.request_type)}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 dark:border-gray-100 pb-1.5">
                  <span className="text-slate-500 dark:text-slate-500 font-bold">{isRtl ? 'المقاعد المطلوبة:' : 'Requested Seats:'}</span>
                  <span className="font-extrabold text-[#0f2044] dark:text-[#0f2044]">{request.seats}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 dark:border-gray-100 pb-1.5">
                  <span className="text-slate-500 dark:text-slate-500 font-bold">{isRtl ? 'حالة الطلب:' : 'Request Status:'}</span>
                  <span className="font-extrabold text-[#0f2044] dark:text-[#0f2044]">{getStatusText(request.status)}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 dark:border-gray-100 pb-1.5">
                  <span className="text-slate-500 dark:text-slate-500 font-bold">{isRtl ? 'تاريخ البدء:' : 'Start Date:'}</span>
                  <span className="font-extrabold text-[#0f2044] dark:text-[#0f2044]">{new Date(request.start_date).toLocaleDateString(isRtl ? 'ar-OM' : 'en-US')}</span>
                </div>
                {request.end_date && (
                  <div className="flex justify-between border-b border-gray-100 dark:border-gray-100 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-500 font-bold">{isRtl ? 'تاريخ الانتهاء:' : 'End Date:'}</span>
                    <span className="font-extrabold text-[#0f2044] dark:text-[#0f2044]">{new Date(request.end_date).toLocaleDateString(isRtl ? 'ar-OM' : 'en-US')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Purpose */}
            <div className="mb-6">
              <h4 className={`text-xs font-black text-[#0f2044] dark:text-[#0f2044] border-b border-gray-300 dark:border-gray-300 pb-1 mb-3 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                {isRtl ? 'الغرض وتفاصيل الطلب' : 'PURPOSE & REQUEST DETAILS'}
              </h4>
              <div className={`bg-slate-50 dark:bg-slate-50 p-3 rounded border border-slate-200 dark:border-slate-200 text-xs ${isRtl ? 'text-right' : 'text-left'}`}>
                <p className="font-bold text-[#0f2044] dark:text-[#0f2044] mb-1">{isRtl ? 'الغرض الأساسي:' : 'Primary Purpose:'}</p>
                <p className="text-slate-700 dark:text-slate-700 font-semibold">{request.purpose}</p>
              </div>
              {request.details && (
                <div className={`bg-slate-50 dark:bg-slate-50 p-3 rounded border border-slate-200 dark:border-slate-200 text-xs mt-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                  <p className="font-bold text-[#0f2044] dark:text-[#0f2044] mb-1">{isRtl ? 'تفاصيل إضافية:' : 'Additional Details:'}</p>
                  <p className="text-slate-700 dark:text-slate-700 font-semibold">{request.details}</p>
                </div>
              )}
            </div>

            {/* Bus details */}
            {request.bus && (
              <div className="mb-6">
                <h4 className={`text-xs font-black text-[#0f2044] dark:text-[#0f2044] border-b border-gray-300 dark:border-gray-300 pb-1 mb-3 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                  {isRtl ? 'بيانات الحافلة وطاقم العمل المخصص' : 'ASSIGNED BUS & CREW DETAILS'}
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="flex justify-between border-b border-gray-100 dark:border-gray-100 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-500 font-bold">{isRtl ? 'رقم الحافلة:' : 'Bus Number:'}</span>
                    <span className="font-extrabold text-[#0f2044] dark:text-[#0f2044]">#{request.bus.bus_number}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 dark:border-gray-100 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-500 font-bold">{isRtl ? 'رقم اللوحة:' : 'Plate Number:'}</span>
                    <span className="font-extrabold text-[#0f2044] dark:text-[#0f2044]">{request.bus.plate_number}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 dark:border-gray-100 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-500 font-bold">{isRtl ? 'اسم السائق:' : 'Driver Name:'}</span>
                    <span className="font-extrabold text-[#0f2044] dark:text-[#0f2044]">{getCrewName(request.bus.driver)}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 dark:border-gray-100 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-500 font-bold">{isRtl ? 'المشرفة:' : 'Supervisor:'}</span>
                    <span className="font-extrabold text-[#0f2044] dark:text-[#0f2044]">{getCrewName(request.bus.assistant)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Approved cost */}
            {request.cost && (
              <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-50 border-2 border-[#0f2044] dark:border-[#0f2044] rounded-lg flex justify-between items-center">
                <span className="font-black text-xs text-[#0f2044] dark:text-[#0f2044]">{isRtl ? 'التكلفة الإجمالية المعتمدة:' : 'Approved Total Cost:'}</span>
                <span className="text-lg font-black text-[#0f2044] dark:text-[#0f2044] flex items-center gap-1">
                  {Number(request.cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  <OmaniRial className="w-4 h-4 flex-shrink-0" />
                </span>
              </div>
            )}

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 mt-10 text-center text-xs font-bold">
              <div>
                <p className="text-[#0f2044] dark:text-[#0f2044] mb-10">{isRtl ? 'اعتماد إدارة المدرسة والختم' : 'School Administration Signature & Stamp'}</p>
                <div style={{ borderTop: "1px solid #0f2044", paddingTop: "5px", color: "#475569" }} className="dark:text-slate-600">
                  {resolvedSchoolName}
                </div>
              </div>
              <div>
                <p className="text-[#0f2044] dark:text-[#0f2044] mb-10">{isRtl ? 'اعتماد شركة مسارات واصل' : 'Masarat Wasel Authorized Signature'}</p>
                <div style={{ borderTop: "1px solid #0f2044", paddingTop: "5px", color: "#475569" }} className="dark:text-slate-600">
                  {isRtl ? 'إدارة العمليات والتشغيل' : 'Operations Management'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className={`p-6 border-t border-gray-100 dark:border-[#243460] flex gap-3 ${isRtl ? 'flex-row-reverse' : 'justify-end'} bg-gray-50 dark:bg-[#111e35]`}>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-[#243460] text-sm font-extrabold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 transition-colors"
          >
            {isRtl ? 'إغلاق' : 'Close'}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-6 py-2.5 rounded-xl bg-[#f5b800] hover:bg-[#e0a800] text-[#0f2044] text-sm font-extrabold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <Printer className="w-4 h-4" />
            {isRtl ? 'طباعة التقرير' : 'Print Report'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
