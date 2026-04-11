import { useState, useEffect } from "react";

interface BusDocument {
  id: number;
  type: string;
  file_path: string;
}

interface Props {
  documents?: BusDocument[];
  editable?: boolean;
  onDelete?: (id: number) => void;
  isDark?: boolean;
}

export default function BusMediaGallery({
  documents = [],
  editable = false,
  onDelete,
  isDark = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % documents.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + documents.length) % documents.length);
  };

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
      <div className={`text-sm italic p-4 border-2 border-dashed rounded-xl text-center ${
        isDark ? "border-gray-700 text-gray-600" : "border-gray-200 text-gray-400"
      }`}>
        لا توجد صور أو مستندات مرفقة
      </div>
    );
  }

  const isPhoto = (doc: BusDocument) => doc.type === "photo";
  const isPdf = (doc: BusDocument) => doc.file_path?.toLowerCase().endsWith(".pdf");
  const getExt = (doc: BusDocument) => doc.file_path?.split(".").pop()?.toUpperCase() || "FILE";

  return (
    <div>
      {/* Thumbnails Grid */}
      <div className="grid grid-cols-4 gap-2.5">
        {documents.map((doc, idx) => (
          <div
            key={doc.id}
            className={`relative group aspect-square rounded-xl overflow-hidden border cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${
              isDark
                ? "border-gray-700/60 bg-gray-800"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <div className="w-full h-full" onClick={() => openLightbox(idx)}>
              {isPhoto(doc) ? (
                <>
                  <img
                    src={`/storage/${doc.file_path}`}
                    alt="Bus photo"
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  />
                  {/* Photo overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 bg-black/50 text-white rounded-full p-2 transition-all">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  {/* Photo badge */}
                  <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                    IMG
                  </div>
                </>
              ) : isPdf(doc) ? (
                <div className={`w-full h-full flex flex-col items-center justify-center gap-1.5 group-hover:bg-red-50 dark:group-hover:bg-red-900/10 transition-colors`}>
                  <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-wider ${
                    isDark ? "text-red-400" : "text-red-500"
                  }`}>PDF</span>
                </div>
              ) : (
                <div className={`w-full h-full flex flex-col items-center justify-center gap-1.5 group-hover:bg-blue-50 transition-colors`}>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm6 6H7v2h6v-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-wider ${
                    isDark ? "text-blue-400" : "text-blue-500"
                  }`}>{getExt(doc)}</span>
                </div>
              )}
            </div>

            {/* Delete button */}
            {editable && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(doc.id);
                }}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                title="حذف"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-5 right-5 text-white/60 hover:text-white z-50 p-2.5 bg-white/10 rounded-full hover:bg-white/20 transition"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Type badge */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-xs font-bold uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-full">
            {isPhoto(documents[currentIndex]) ? "📸 صورة" : isPdf(documents[currentIndex]) ? "📄 PDF" : "📎 مستند"}
          </div>

          {/* Content */}
          <div
            className="relative max-w-5xl max-h-screen w-full p-8 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev */}
            {documents.length > 1 && (
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white hover:text-black transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Main Content */}
            {isPhoto(documents[currentIndex]) ? (
              <img
                src={`/storage/${documents[currentIndex].file_path}`}
                className="max-h-[82vh] max-w-full rounded-2xl shadow-2xl ring-1 ring-white/10"
                alt="Preview"
              />
            ) : (
              <div className="bg-white rounded-2xl p-10 text-center shadow-2xl max-w-sm w-full">
                <div className={`w-16 h-16 rounded-2xl ${isPdf(documents[currentIndex]) ? "bg-red-100" : "bg-blue-100"} flex items-center justify-center mx-auto mb-4`}>
                  <svg className={`w-8 h-8 ${isPdf(documents[currentIndex]) ? "text-red-500" : "text-blue-500"}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-gray-800 font-bold mb-1">{getExt(documents[currentIndex])} مستند</p>
                <p className="text-gray-400 text-xs mb-6 font-mono truncate">{documents[currentIndex].file_path.split("/").pop()}</p>
                <a
                  href={`/storage/${documents[currentIndex].file_path}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 bg-brand-dark hover:bg-brand-navy text-white px-6 py-2.5 rounded-xl font-bold text-sm transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  تحميل / فتح
                </a>
              </div>
            )}

            {/* Next */}
            {documents.length > 1 && (
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white hover:text-black transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* Counter + Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
            <div className="flex gap-1.5">
              {documents.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
                  className={`transition-all rounded-full ${
                    i === currentIndex
                      ? "w-5 h-2 bg-brand-yellow"
                      : "w-2 h-2 bg-white/30 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
            <span className="text-white/50 font-mono text-xs">
              {currentIndex + 1} / {documents.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

