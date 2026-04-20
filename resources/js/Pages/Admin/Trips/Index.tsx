import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import SecondaryButton from "@/Components/SecondaryButton";
import { useTheme } from "@/Contexts/ThemeContext";
import BaseDataTable, {
  ActionButton,
  StatusBadge,
  type PaginationMeta,
} from "@/Components/BaseDataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bus as BusIcon,
  Video,
  Play,
  Calendar,
  Clock,
  ShieldCheck,
  MapPin,
  X as LucideX,
  FileVideo,
  ExternalLink,
} from "lucide-react";

interface Bus {
  id: number;
  bus_number: string;
  plate_number: string;
  school?: {
    id: number;
    name: string;
  };
}

interface Trip {
  id: number;
  bus_id: number;
  trip_date: string;
  type: "forth" | "back";
  status: "pending" | "in_progress" | "completed";
  video_check: boolean;
  video_path: string | null;
  departure_time: string | null;
  arrival_time: string | null;
  end_qr_scanned_at: string | null;
  bus?: Bus;
}

interface Props {
  trips: {
    data: Trip[];
    links: PaginationMeta["links"];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  filters: {
    bus_id?: string;
    date?: string;
  };
}

export default function TripsIndex({ trips, filters }: Props) {
  const { isDarkMode } = useTheme();
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columnHelper = createColumnHelper<Trip>();

  const columns = [
    columnHelper.accessor("bus", {
      header: "الحافلة",
      cell: (info) => (
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDarkMode ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}>
            <BusIcon size={18} />
          </div>
          <div>
            <div className="font-bold">{info.getValue()?.bus_number || "غير محدد"}</div>
            <div className="text-xs opacity-60">{info.getValue()?.school?.name || "بدون مدرسة"}</div>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor("type", {
      header: "نوع الرحلة",
      cell: (info) => (
        <StatusBadge 
          status={info.getValue() === "forth" ? "forth" : "back"}
          label={info.getValue() === "forth" ? "ذهاب" : "عودة"}
          colors={{
            forth: "bg-blue-500/10 text-blue-500 border-blue-500/20",
            back: "bg-orange-500/10 text-orange-500 border-orange-500/20",
          }}
        />
      ),
    }),
    columnHelper.accessor("trip_date", {
      header: "التاريخ",
      cell: (info) => (
        <div className="flex items-center gap-2 text-sm">
          <Calendar size={14} className="opacity-50" />
          {new Date(info.getValue()).toLocaleDateString("ar-SA")}
        </div>
      ),
    }),
    columnHelper.accessor("departure_time", {
      header: "الوقت",
      cell: (info) => {
        const arrival = info.row.original.arrival_time;
        return (
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="opacity-50">بدأ:</span>
              <span>{info.getValue() ? new Date(info.getValue()!).toLocaleTimeString("ar-SA", { hour: '2-digit', minute: '2-digit' }) : "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="opacity-50">انتهى:</span>
              <span>{arrival ? new Date(arrival).toLocaleTimeString("ar-SA", { hour: '2-digit', minute: '2-digit' }) : "-"}</span>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("video_check", {
      header: "التوثيق",
      cell: (info) => (
        <div className="flex items-center gap-2">
          {info.getValue() ? (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] border border-emerald-500/20">
              <ShieldCheck size={12} />
              موثق بالكامل
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] border border-amber-500/20">
              <Clock size={12} />
              قيد المراجعة
            </div>
          )}
        </div>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "الإجراءات",
      cell: (info) => (
        <div className="flex items-center gap-2">
          {info.row.original.video_path && (
            <ActionButton
              icon={Play}
              variant="primary"
              tooltip="مشاهدة فديو التحقق"
              onClick={() => {
                setSelectedVideo(info.row.original.video_path);
                setIsModalOpen(true);
              }}
            />
          )}
          <ActionButton
             icon={ExternalLink}
             variant="secondary"
             tooltip="تفاصيل الرحلة"
             onClick={() => router.get(route('admin.daily-trips.show', info.row.original.id))}
          />
        </div>
      ),
    }),
  ];

  return (
    <AuthenticatedLayout>
      <Head title="مراقبة وتوثيق الرحلات" />

      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-1">مراقبة وتوثيق الرحلات</h2>
            <p className="opacity-60 text-sm">مراجعة فيديوهات التحقق الأمنية للتأكد من خلو الحافلات</p>
          </div>
          
          {/* Quick Stats */}
          <div className="flex gap-4">
            <div className={`px-6 py-3 rounded-2xl border ${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-100"} shadow-sm text-center min-w-[120px]`}>
               <div className="text-2xl font-bold text-emerald-500">{trips.total}</div>
               <div className="text-[10px] uppercase tracking-wider opacity-60">إجمالي الرحلات اليوم</div>
            </div>
          </div>
        </div>

        <BaseDataTable
          columns={columns}
          data={trips.data}
          pagination={trips}
          onSearch={(val) => router.get(route('admin.trips.index'), { search: val }, { preserveState: true })}
          isLoading={false}
        />
      </div>

      {/* Video Verification Modal */}
      <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="2xl">
        <div className={`p-0 overflow-hidden ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
             <div className="flex items-center gap-2 font-bold">
               <Video className="text-indigo-500" size={20} />
               توثيق فديو التحقق
             </div>
             <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
               <LucideX size={20} />
             </button>
          </div>
          
          <div className="aspect-video bg-black flex items-center justify-center relative group">
            <AnimatePresence mode="wait">
              {selectedVideo ? (
                <video
                  key={selectedVideo}
                  src={`/storage/${selectedVideo}`}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  poster="/assets/images/video-placeholder.jpg"
                />
              ) : (
                <div className="text-white flex flex-col items-center gap-3">
                   <FileVideo size={48} className="animate-pulse opacity-40" />
                   <span className="opacity-60 italic text-sm">جاري تحميل المعاينة...</span>
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-6 bg-indigo-500/5">
             <div className="flex items-start gap-4">
               <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                 <ShieldCheck size={24} />
               </div>
               <div>
                  <h4 className="font-bold text-lg mb-1">تم التحقق من خلال QR</h4>
                  <p className="text-sm opacity-70 leading-relaxed">
                    هذا الفديو تم تسجيله تلقائياً بواسطة السائق بين نقطتي مسح كود الـ QR الأمامي والخلفي لضمان خلو كافة مقاعد الحافلة من الطلاب.
                  </p>
               </div>
             </div>
          </div>

          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
            <SecondaryButton onClick={() => setIsModalOpen(false)}>إغلاق</SecondaryButton>
          </div>
        </div>
      </Modal>
    </AuthenticatedLayout>
  );
}
