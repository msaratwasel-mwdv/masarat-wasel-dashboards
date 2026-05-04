import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, Bus as BusIcon, TrendingUp, AlertTriangle, 
  Download, FileText, BarChart3, ChevronLeft, ChevronRight,
  Zap, ArrowRight, Loader2, CheckCircle2
} from 'lucide-react';
import axios from 'axios';
import { useTheme } from '@/Contexts/ThemeContext';
import OmaniRial from '@/Components/OmaniRial';
import {
  DS_modalContainer,
  DS_modalHeader,
  DS_modalHeaderTitle,
  DS_modalHeaderAccent,
  DS_modalClose,
  DS_modalBody,
  DS_inputCls,
  DS_labelCls,
  DS_submitBtn,
  DS_cancelBtn,
} from '@/lib/DS';

interface Bus {
  id: number;
  bus_number: string;
  plate_number: string;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  buses: Bus[];
  isRTL: boolean;
}

export default function ReportModal({ isOpen, onClose, buses, isRTL }: ReportModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [step, setStep] = useState(1); // 1: Selection, 2: Results
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bus_id: '',
    start_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  const [reportData, setReportData] = useState<any>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await axios.get(route('admin.bus-expenses.reports.consumption'), {
        params: formData
      });
      setReportData(response.data);
      setStep(2);
    } catch (error) {
      console.error("Report generation failed", error);
      alert(isRTL ? "فشل إنشاء التقرير. تأكد من وجود سجلات كافية لهذه الفترة." : "Report generation failed. Ensure enough logs exist for this period.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    const url = route(`admin.bus-expenses.reports.export-${type}`, formData);
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className={`relative max-w-3xl w-full bg-white dark:bg-[#1a2845] ${DS_modalContainer}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={DS_modalHeader(isRTL)}>
            <div className="flex items-center gap-3">
              <div className={DS_modalHeaderAccent} />
              <div className="flex items-center gap-2">
                 <BarChart3 className="w-5 h-5 text-[#f5b800]" />
                 <h2 className={DS_modalHeaderTitle}>
                   {isRTL ? "تقرير استهلاك الوقود" : "Fuel Consumption Report"}
                 </h2>
              </div>
            </div>
            <button type="button" onClick={onClose} className={DS_modalClose}>
              <X size={20} />
            </button>
          </div>

          <div className={DS_modalBody}>
            {step === 1 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bus Selection */}
                  <div>
                    <label className={DS_labelCls}>
                      {isRTL ? "اختر الحافلة" : "Select Bus"}
                    </label>
                    <div className="relative">
                       <BusIcon size={16} className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-[#0f2044]/40 dark:text-[#7ba7e8]/40`} />
                       <select 
                         value={formData.bus_id}
                         onChange={(e) => setFormData({...formData, bus_id: e.target.value})}
                         className={`${DS_inputCls} ${isRTL ? 'pr-10' : 'pl-10'}`}
                       >
                         <option value="">{isRTL ? "-- اختر حافلة --" : "-- Choose a bus --"}</option>
                         {buses.map(bus => (
                           <option key={bus.id} value={bus.id}>{bus.bus_number} - {bus.plate_number}</option>
                         ))}
                       </select>
                    </div>
                  </div>

                  {/* Date Range */}
                  <div>
                    <label className={DS_labelCls}>
                      {isRTL ? "نطاق التاريخ" : "Date Range"}
                    </label>
                    <div className="flex items-center gap-2">
                       <input 
                         type="date" 
                         value={formData.start_date}
                         onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                         className={DS_inputCls}
                       />
                       <ArrowRight size={16} className="text-[#0f2044]/40 dark:text-[#7ba7e8]/40 shrink-0" />
                       <input 
                         type="date" 
                         value={formData.end_date}
                         onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                         className={DS_inputCls}
                       />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-[14px] bg-[#0f2044]/[0.05] dark:bg-[#0f2044]/30 flex gap-3 items-start border border-[#0f2044]/10 dark:border-[#243460]">
                    <Zap className="text-[#f5b800] shrink-0 mt-0.5" size={18} />
                    <p className="text-xs font-medium leading-relaxed text-gray-600 dark:text-gray-400">
                        {isRTL 
                          ? "سيقوم النظام بتحليل قراءات العداد (Odometer) الموثقة في سجلات الوقود لحساب معدل الاستهلاك الفعلي ومقارنته بباقي الأسطول."
                          : "The system will analyze odometer readings documented in fuel logs to calculate the actual consumption rate and compare it with the fleet average."
                        }
                    </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-[#243460]">
                  <button type="button" onClick={onClose} className={DS_cancelBtn}>
                    {isRTL ? "إلغاء" : "Cancel"}
                  </button>
                  <button 
                    disabled={!formData.bus_id || loading}
                    onClick={handleGenerate}
                    className={DS_submitBtn(loading)}
                  >
                    {loading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : (isRTL ? "بدء التحليل" : "Start Analysis")}
                    {!loading && <ChevronRight className="w-5 h-5 ml-1" />}
                  </button>
                </div>
              </div>
            ) : (
              // STEP 2: RESULTS
              <div className="space-y-6">
                 {/* Summary Header */}
                 <div className={`p-6 rounded-[20px] border relative overflow-hidden ${
                   reportData.stats.is_outlier 
                    ? 'border-rose-100 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-900/10' 
                    : 'border-emerald-100 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/10'
                 }`}>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-right">
                       <div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            reportData.stats.is_outlier ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                          }`}>
                             {reportData.stats.is_outlier 
                               ? (isRTL ? 'تنبيه: استهلاك مرتفع' : 'Warning: High Consumption') 
                               : (isRTL ? 'كفاءة ممتازة' : 'Excellent Efficiency')}
                          </span>
                          <h4 className={`text-2xl font-black mt-3 text-[#0f2044] dark:text-white`}>
                             {reportData.stats.efficiency} <span className="text-xs opacity-60"><OmaniRial size="1.2em" className="inline-block align-middle me-1" />/KM</span>
                          </h4>
                          <p className={`text-xs font-bold mt-1 text-gray-600 dark:text-gray-400`}>
                             {isRTL 
                               ? `هذا الباص يستهلك ${Math.abs(reportData.stats.diff_percent)}% ${reportData.stats.diff_percent > 0 ? 'أكثر' : 'أقل'} من متوسط الأسطول.`
                               : `This bus consumes ${Math.abs(reportData.stats.diff_percent)}% ${reportData.stats.diff_percent > 0 ? 'more' : 'less'} than fleet average.`}
                          </p>
                       </div>
                       
                       <div className="flex gap-3">
                          <div className={`p-4 rounded-[14px] text-center bg-white dark:bg-[#0f2044]/40 shadow-sm border border-gray-100 dark:border-[#243460]`}>
                             <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{isRTL ? 'متوسط الأسطول' : 'Fleet Avg'}</p>
                             <p className="font-bold text-[#f5b800]">{reportData.stats.fleet_avg}</p>
                          </div>
                          <div className={`p-4 rounded-[14px] text-center bg-white dark:bg-[#0f2044]/40 shadow-sm border border-gray-100 dark:border-[#243460]`}>
                             <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{isRTL ? 'المسافة' : 'Distance'}</p>
                             <p className={`font-bold text-[#0f2044] dark:text-white`}>{reportData.stats.distance} KM</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Actions */}
                 <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={() => handleExport('pdf')}
                      className={`flex-1 p-4 rounded-[14px] border border-[#0f2044]/10 dark:border-[#243460] transition-all flex items-center justify-center gap-3 group bg-white dark:bg-[#0f2044]/20 hover:bg-gray-50 dark:hover:bg-[#0f2044]/40`}
                    >
                      <div className="w-10 h-10 rounded-[12px] bg-rose-500/10 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText size={20} />
                      </div>
                      <div className={isRTL ? 'text-right' : 'text-left'}>
                         <p className={`text-sm font-bold text-[#0f2044] dark:text-white`}>{isRTL ? "تصدير كملف PDF" : "Export as PDF"}</p>
                         <p className="text-[10px] font-bold text-gray-400">{isRTL ? "جاهز للطباعة" : "Ready for print"}</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => handleExport('excel')}
                      className={`flex-1 p-4 rounded-[14px] border border-[#0f2044]/10 dark:border-[#243460] transition-all flex items-center justify-center gap-3 group bg-white dark:bg-[#0f2044]/20 hover:bg-gray-50 dark:hover:bg-[#0f2044]/40`}
                    >
                      <div className="w-10 h-10 rounded-[12px] bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Download size={20} />
                      </div>
                      <div className={isRTL ? 'text-right' : 'text-left'}>
                         <p className={`text-sm font-bold text-[#0f2044] dark:text-white`}>{isRTL ? "تصدير Excel" : "Export Excel"}</p>
                         <p className="text-[10px] font-bold text-gray-400">{isRTL ? "للمراجعة المحاسبية" : "For accounting review"}</p>
                      </div>
                    </button>
                 </div>

                 <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-[#243460]">
                    <button 
                      onClick={() => setStep(1)}
                      className={`text-sm font-bold flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''} text-[#0f2044]/60 hover:text-[#0f2044] dark:text-[#7ba7e8]/60 dark:hover:text-[#7ba7e8] transition-all`}
                    >
                       <ChevronLeft size={16} className={isRTL ? 'rotate-180' : ''} />
                       {isRTL ? "تعديل الخيارات" : "Modify Selection"}
                    </button>
                    
                    <button type="button" onClick={onClose} className={DS_cancelBtn}>
                      {isRTL ? "إغلاق" : "Close"}
                    </button>
                 </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
