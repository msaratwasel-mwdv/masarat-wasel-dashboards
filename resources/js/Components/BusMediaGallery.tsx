import { useState, useEffect } from "react";

interface BusDocument {
  id: number;
  type: string;
  file_path: string;
}

interface Props {
  documents?: BusDocument[];
  editable?: boolean; // هل نحن في وضع التعديل؟ (لاحقاً يمكن إضافة زر حذف)
  onDelete?: (id: number) => void;
}

export default function BusMediaGallery({
  documents = [],
  editable = false,
  onDelete,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // دالة لفتح المعرض عند صورة معينة
  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  // التنقل لليمين واليسار
  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % documents.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + documents.length) % documents.length);
  };

  // دعم لوحة المفاتيح (Esc, Arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") setIsOpen(false);
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!documents || documents.length === 0) {
    return (
      <div className="text-sm text-gray-400 italic p-2 border border-dashed rounded text-center">
        لا توجد صور مرفقة
      </div>
    );
  }

  return (
    <div>
      {/* 1. شبكة الصور المصغرة (Thumbnails Grid) */}
      <div className="grid grid-cols-4 gap-3">
        {documents.map((doc, idx) => (
          <div
            key={doc.id}
            className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:shadow-md transition"
          >
            <div className="w-full h-full" onClick={() => openLightbox(idx)}>
              {doc.type === "photo" ? (
                <img
                  src={`/storage/${doc.file_path}`}
                  alt="Bus"
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500">
                  <span className="text-[10px] font-bold uppercase">DOC</span>
                </div>
              )}
            </div>

            {/* Delete button in editable mode */}
            {editable && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(doc.id);
                }}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 z-20"
                title="حذف"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}

            {/* تلميح لفتح الصورة */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center pointer-events-none">
              <span className="opacity-0 group-hover:opacity-100 text-white bg-black/50 rounded-full p-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                  />
                </svg>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 2. وضع العرض الكامل (Lightbox Modal) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          {/* زر الإغلاق (X) */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-5 right-5 text-white/70 hover:text-white z-50 p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* المحتوى الرئيسي */}
          <div
            className="relative max-w-5xl max-h-screen w-full p-4 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* زر السابق */}
            {documents.length > 1 && (
              <button
                onClick={prevImage}
                className="absolute left-4 p-3 rounded-full bg-black/50 text-white hover:bg-white hover:text-black transition"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}

            {/* الصورة أو الملف */}
            {documents[currentIndex].type === "photo" ? (
              <img
                src={`/storage/${documents[currentIndex].file_path}`}
                className="max-h-[85vh] max-w-full rounded shadow-2xl"
                alt="Preview"
              />
            ) : (
              <div className="bg-white p-10 rounded-lg text-center">
                <p className="text-xl font-bold mb-4">ملف PDF / مستند</p>
                <a
                  href={`/storage/${documents[currentIndex].file_path}`}
                  target="_blank"
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                >
                  تحميل المستند
                </a>
              </div>
            )}

            {/* زر التالي */}
            {documents.length > 1 && (
              <button
                onClick={nextImage}
                className="absolute right-4 p-3 rounded-full bg-black/50 text-white hover:bg-white hover:text-black transition"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* العداد (1/5) */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/80 font-mono bg-black/50 px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {documents.length}
          </div>
        </div>
      )}
    </div>
  );
}
