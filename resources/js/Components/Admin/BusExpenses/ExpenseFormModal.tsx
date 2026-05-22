import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Pencil, Bus as BusIcon, Fuel, Wrench, Calendar, DollarSign, FileText, Upload, Loader2 } from 'lucide-react';
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
import OmaniRial from '@/Components/OmaniRial';

interface Bus {
  id: number;
  bus_number: string;
  plate_number: string;
}

interface Expense {
  id: number;
  bus_id: number;
  type: 'fuel' | 'maintenance';
  amount: number;
  date: string;
  extra_info: string;
  receipt_photo: string | null;
}

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  buses: Bus[];
  isRTL: boolean;
  expense?: Expense | null; // null = create, object = edit
}

export default function ExpenseFormModal({ isOpen, onClose, buses, isRTL, expense }: ExpenseFormModalProps) {
  const isEditing = !!expense;

  const { data, setData, post, put, processing, errors, reset } = useForm({
    bus_id: expense?.bus_id?.toString() || '',
    type: expense?.type || 'fuel',
    amount: expense?.amount?.toString() || '',
    date: expense?.date || new Date().toISOString().split('T')[0],
    extra_info: expense?.extra_info || '',
    receipt_photo: null as File | null,
  });

  // Reset form when modal opens/closes or expense changes
  useEffect(() => {
    if (isOpen) {
      setData({
        bus_id: expense?.bus_id?.toString() || '',
        type: expense?.type || 'fuel',
        amount: expense?.amount?.toString() || '',
        date: expense?.date || new Date().toISOString().split('T')[0],
        extra_info: expense?.extra_info || '',
        receipt_photo: null,
      });
    }
  }, [isOpen, expense]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('bus_id', data.bus_id);
    formData.append('type', data.type);
    formData.append('amount', data.amount);
    formData.append('date', data.date);
    formData.append('extra_info', data.extra_info || '');
    if (data.receipt_photo) {
      formData.append('receipt_photo', data.receipt_photo);
    }

    if (isEditing && expense) {
      formData.append('_method', 'PUT');
      post(route('admin.bus-expenses.update', expense.id), {
        preserveScroll: true,
        onSuccess: () => {
          reset();
          onClose();
        },
      });
    } else {
      post(route('admin.bus-expenses.store'), {
        preserveScroll: true,
        onSuccess: () => {
          reset();
          onClose();
        },
      });
    }
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
          className={`relative max-w-lg w-full rounded-[22px] bg-white dark:bg-[#1a2845] ${DS_modalContainer}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={DS_modalHeader(isRTL)}>
            <div className="flex items-center gap-3">
              <div className={DS_modalHeaderAccent} />
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Pencil className="w-5 h-5 text-[#f5b800]" />
                ) : (
                  <Plus className="w-5 h-5 text-[#f5b800]" />
                )}
                <h2 className={DS_modalHeaderTitle}>
                  {isEditing
                    ? (isRTL ? "تعديل السجل" : "Edit Record")
                    : (isRTL ? "إضافة سجل جديد" : "Add New Record")}
                </h2>
              </div>
            </div>
            <button type="button" onClick={onClose} className={DS_modalClose}>
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className={DS_modalBody}>
              {/* Bus Selection */}
              <div>
                <label className={DS_labelCls}>
                  {isRTL ? "الحافلة" : "Bus"} *
                </label>
                <div className="relative">
                  <BusIcon size={16} className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-[#0f2044]/40 dark:text-[#7ba7e8]/40`} />
                  <select
                    value={data.bus_id}
                    onChange={(e) => setData('bus_id', e.target.value)}
                    className={`${DS_inputCls} ${isRTL ? 'pr-10' : 'pl-10'} cursor-pointer`}
                    required
                  >
                    <option value="">{isRTL ? "-- اختر حافلة --" : "-- Select Bus --"}</option>
                    {buses.map(bus => (
                      <option key={bus.id} value={bus.id}>{bus.bus_number} - {bus.plate_number}</option>
                    ))}
                  </select>
                </div>
                {errors.bus_id && <p className="text-xs text-red-500 mt-1">{errors.bus_id}</p>}
              </div>

              {/* Type Selection */}
              <div>
                <label className={DS_labelCls}>
                  {isRTL ? "النوع" : "Type"} *
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setData('type', 'fuel')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-[14px] border-2 transition-all text-sm font-bold ${
                      data.type === 'fuel'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-500'
                        : 'border-gray-200 dark:border-[#243460] text-gray-500 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <Fuel size={16} />
                    {isRTL ? "وقود" : "Fuel"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setData('type', 'maintenance')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-[14px] border-2 transition-all text-sm font-bold ${
                      data.type === 'maintenance'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-500'
                        : 'border-gray-200 dark:border-[#243460] text-gray-500 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <Wrench size={16} />
                    {isRTL ? "صيانة" : "Maintenance"}
                  </button>
                </div>
                {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={DS_labelCls}>
                    {isRTL ? "المبلغ" : "Amount"} (<OmaniRial size="1em" className="inline-block align-middle" />) *
                  </label>
                  <div className="relative">
                    <DollarSign size={16} className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-[#0f2044]/40 dark:text-[#7ba7e8]/40`} />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={data.amount}
                      onChange={(e) => setData('amount', e.target.value)}
                      className={`${DS_inputCls} ${isRTL ? 'pr-10' : 'pl-10'}`}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
                </div>

                <div>
                  <label className={DS_labelCls}>
                    {isRTL ? "التاريخ" : "Date"} *
                  </label>
                  <div className="relative">
                    <Calendar size={16} className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-[#0f2044]/40 dark:text-[#7ba7e8]/40`} />
                    <input
                      type="date"
                      value={data.date}
                      onChange={(e) => setData('date', e.target.value)}
                      className={`${DS_inputCls} ${isRTL ? 'pr-10' : 'pl-10'}`}
                      required
                    />
                  </div>
                  {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
                </div>
              </div>

              {/* Extra Info */}
              <div>
                <label className={DS_labelCls}>
                  {isRTL ? "التفاصيل / الملاحظات" : "Details / Notes"}
                </label>
                <div className="relative">
                  <FileText size={16} className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-3 text-[#0f2044]/40 dark:text-[#7ba7e8]/40`} />
                  <textarea
                    value={data.extra_info}
                    onChange={(e) => setData('extra_info', e.target.value)}
                    className={`${DS_inputCls} ${isRTL ? 'pr-10' : 'pl-10'} min-h-[80px] resize-none`}
                    placeholder={isRTL ? "أضف ملاحظات أو تفاصيل إضافية..." : "Add notes or additional details..."}
                    rows={3}
                  />
                </div>
                {errors.extra_info && <p className="text-xs text-red-500 mt-1">{errors.extra_info}</p>}
              </div>

              {/* Receipt Photo */}
              <div>
                <label className={DS_labelCls}>
                  {isRTL ? "صورة الإيصال (اختياري)" : "Receipt Photo (optional)"}
                </label>
                <label
                  className={`flex items-center justify-center gap-3 px-4 py-4 rounded-[14px] border-2 border-dashed cursor-pointer transition-all ${
                    data.receipt_photo
                      ? 'border-[#f5b800] bg-[#f5b800]/5 dark:bg-[#f5b800]/10'
                      : 'border-gray-200 dark:border-[#243460] hover:border-[#f5b800]/50'
                  }`}
                >
                  <Upload size={20} className={data.receipt_photo ? 'text-[#f5b800]' : 'text-gray-400'} />
                  <span className={`text-sm font-bold ${data.receipt_photo ? 'text-[#f5b800]' : 'text-gray-400'}`}>
                    {data.receipt_photo
                      ? (data.receipt_photo as File).name
                      : (isRTL ? "اضغط لرفع صورة" : "Click to upload image")}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setData('receipt_photo', e.target.files[0]);
                      }
                    }}
                  />
                </label>
                {errors.receipt_photo && <p className="text-xs text-red-500 mt-1">{errors.receipt_photo}</p>}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-[#243460] flex justify-end gap-3">
              <button type="button" onClick={onClose} className={DS_cancelBtn}>
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button type="submit" disabled={processing} className={DS_submitBtn(processing)}>
                {processing ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : isEditing ? (
                  isRTL ? "حفظ التعديلات" : "Save Changes"
                ) : (
                  isRTL ? "إضافة السجل" : "Add Record"
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
