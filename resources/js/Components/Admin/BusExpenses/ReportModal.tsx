import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, Bus as BusIcon, TrendingUp, AlertTriangle, 
  Download, FileText, BarChart3, ChevronLeft, ChevronRight,
  Zap, ArrowRight, Loader2, CheckCircle2
} from 'lucide-react';
import axios from 'axios';
import { useTheme } from '@/Contexts/ThemeContext';

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
          className={`relative max-w-4xl w-full rounded-[40px] shadow-2xl overflow-hidden border ${
            isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`p-8 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'} flex justify-between items-center bg-gradient-to-r from-brand-yellow/5 to-transparent`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-yellow/20 flex items-center justify-center text-brand-yellow">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isRTL ? "تقرير استهلاك الوقود" : "Fuel Consumption Report"}
                </h3>
                <p className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest`}>
                    {isRTL ? "تحليل الكفاءة والمقارنة المعيارية" : "Efficiency Analytics & Benchmarking"}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-50 text-slate-400'}`}
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-8">
            {step === 1 ? (
              <div className="space-y-8 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Bus Selection */}
                  <div className="space-y-3">
                    <label className={`text-sm font-black flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      <BusIcon size={16} className="text-brand-yellow" />
                      {isRTL ? "اختر الحافلة" : "Select Bus"}
                    </label>
                    <select 
                      value={formData.bus_id}
                      onChange={(e) => setFormData({...formData, bus_id: e.target.value})}
                      className={`w-full p-4 rounded-2xl border-0 focus:ring-2 focus:ring-brand-yellow transition-all ${
                        isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-900'
                      }`}
                    >
                      <option value="">{isRTL ? "اختر حافلة..." : "Choose a bus..."}</option>
                      {buses.map(bus => (
                        <option key={bus.id} value={bus.id}>{bus.bus_number} - {bus.plate_number}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-3">
                    <label className={`text-sm font-black flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      <Calendar size={16} className="text-brand-yellow" />
                      {isRTL ? "نطاق التاريخ" : "Date Range"}
                    </label>
                    <div className="flex items-center gap-2">
                       <input 
                         type="date" 
                         value={formData.start_date}
                         onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                         className={`w-full p-4 rounded-2xl border-0 focus:ring-2 focus:ring-brand-yellow transition-all ${
                           isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-900'
                         }`}
                       />
                       <ArrowRight size={20} className="text-slate-400" />
                       <input 
                         type="date" 
                         value={formData.end_date}
                         onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                         className={`w-full p-4 rounded-2xl border-0 focus:ring-2 focus:ring-brand-yellow transition-all ${
                           isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-900'
                         }`}
                       />
                    </div>
                  </div>
                </div>

                <div className={`p-6 rounded-3xl border flex items-center gap-4 ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-blue-50/50 border-blue-100'}`}>
                    <Zap className="text-brand-yellow shrink-0" size={24} />
                    <p className={`text-xs font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {isRTL 
                          ? "سيقوم النظام بتحليل قراءات العداد (Odometer) الموثقة في سجلات الوقود لحساب معدل الاستهلاك الفعلي ومقارنته بباقي الأسطول."
                          : "The system will analyze odometer readings documented in fuel logs to calculate the actual consumption rate and compare it with the fleet average."
                        }
                    </p>
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    disabled={!formData.bus_id || loading}
                    onClick={handleGenerate}
                    className={`px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 transition-all ${
                      loading || !formData.bus_id
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800"
                        : "bg-brand-yellow text-brand-dark hover:shadow-xl hover:shadow-brand-yellow/20 active:scale-95"
                    }`}
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : (isRTL ? "بدء التحليل" : "Start Analysis")}
                    {!loading && <ChevronRight size={20} />}
                  </button>
                </div>
              </div>
            ) : (
              // STEP 2: RESULTS
              <div className="space-y-8 py-2">
                 {/* Summary Header */}
                 <div className={`p-8 rounded-[32px] border relative overflow-hidden ${
                   reportData.stats.is_outlier 
                    ? 'border-rose-500/50 bg-rose-500/5' 
                    : 'border-emerald-500/50 bg-emerald-500/5'
                 }`}>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-right">
                       <div>
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            reportData.stats.is_outlier ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                          }`}>
                             {reportData.stats.is_outlier 
                               ? (isRTL ? 'تنبيه: استهلاك مرتفع' : 'Warning: High Consumption') 
                               : (isRTL ? 'كفاءة ممتازة' : 'Excellent Efficiency')}
                          </span>
                          <h4 className={`text-3xl font-black mt-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                             {reportData.stats.efficiency} <span className="text-sm opacity-50">SAR/KM</span>
                          </h4>
                          <p className={`text-sm font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                             {isRTL 
                               ? `هذا الباص يستهلك ${Math.abs(reportData.stats.diff_percent)}% ${reportData.stats.diff_percent > 0 ? 'أكثر' : 'أقل'} من متوسط الأسطول.`
                               : `This bus consumes ${Math.abs(reportData.stats.diff_percent)}% ${reportData.stats.diff_percent > 0 ? 'more' : 'less'} than fleet average.`}
                          </p>
                       </div>
                       
                       <div className="flex gap-4">
                          <div className={`p-6 rounded-2xl text-center ${isDark ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
                             <p className="text-[10px] font-black opacity-40 uppercase mb-1">{isRTL ? 'متوسط الأسطول' : 'Fleet Avg'}</p>
                             <p className="font-black text-brand-yellow">{reportData.stats.fleet_avg}</p>
                          </div>
                          <div className={`p-6 rounded-2xl text-center ${isDark ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
                             <p className="text-[10px] font-black opacity-40 uppercase mb-1">{isRTL ? 'المسافة' : 'Distance'}</p>
                             <p className={`font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{reportData.stats.distance} KM</p>
                          </div>
                       </div>
                    </div>

                    {/* Gauge Visual */}
                    <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-current to-transparent opacity-[0.03] pointer-events-none" />
                 </div>

                 {/* Actions */}
                 <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={() => handleExport('pdf')}
                      className={`flex-1 p-6 rounded-[24px] border transition-all flex items-center justify-center gap-4 group ${
                        isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-750' : 'bg-white border-slate-100 hover:shadow-xl'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText size={24} />
                      </div>
                      <div className={isRTL ? 'text-right' : 'text-left'}>
                         <p className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{isRTL ? "تصدير كملف PDF" : "Export as PDF"}</p>
                         <p className="text-[10px] font-bold opacity-40">{isRTL ? "جاهز للطباعة" : "Ready for print"}</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => handleExport('excel')}
                      className={`flex-1 p-6 rounded-[24px] border transition-all flex items-center justify-center gap-4 group ${
                        isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-750' : 'bg-white border-slate-100 hover:shadow-xl'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Download size={24} />
                      </div>
                      <div className={isRTL ? 'text-right' : 'text-left'}>
                         <p className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{isRTL ? "تصدير Excel (CSV)" : "Export Excel (CSV)"}</p>
                         <p className="text-[10px] font-bold opacity-40">{isRTL ? "للمراجعة المحاسبية" : "For accounting review"}</p>
                      </div>
                    </button>
                 </div>

                 <div className="flex justify-between items-center pt-8">
                    <button 
                      onClick={() => setStep(1)}
                      className={`text-sm font-black flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''} ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'} transition-all`}
                    >
                       <ChevronLeft size={20} className={isRTL ? 'rotate-180' : ''} />
                       {isRTL ? "تعديل الخيارات" : "Modify Selection"}
                    </button>
                    
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-xl">
                       <CheckCircle2 size={16} />
                       {isRTL ? "تم تحديث البيانات للتو" : "Data just updated"}
                    </div>
                 </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
