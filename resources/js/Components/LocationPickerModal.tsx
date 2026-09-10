import React, { useState, useEffect, useCallback, useMemo } from "react";
import Modal from "@/Components/Modal";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import {
  MapPin, Search, Navigation, Building2, Check, X,
  Loader2, AlertCircle, RefreshCw, Compass
} from "lucide-react";
import useTranslation from "@/hooks/useTranslation";
import { toast } from "react-toastify";

interface LocationPickerModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: (lat: number, lng: number, address: string) => void;
  initialLat?: number | string | null;
  initialLng?: number | string | null;
  initialAddress?: string | null;
  defaultCenter?: { lat: number; lng: number };
  title?: string;
  studentName?: string;
}

export default function LocationPickerModal({
  show,
  onClose,
  onConfirm,
  initialLat,
  initialLng,
  initialAddress = "",
  defaultCenter,
  title,
  studentName,
}: LocationPickerModalProps) {
  const { t, isRtl } = useTranslation();

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
  });

  // Default fallback: Muscat, Oman or provided defaultCenter (School coordinates)
  const baseCenter = useMemo(() => {
    if (defaultCenter && !isNaN(defaultCenter.lat) && !isNaN(defaultCenter.lng) && defaultCenter.lat !== 0) {
      return { lat: Number(defaultCenter.lat), lng: Number(defaultCenter.lng) };
    }
    return { lat: 23.5859, lng: 58.4059 }; // Muscat
  }, [defaultCenter]);

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [address, setAddress] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);

  // Sync state whenever modal opens
  useEffect(() => {
    if (show) {
      const parsedLat = initialLat != null && initialLat !== "" ? Number(initialLat) : null;
      const parsedLng = initialLng != null && initialLng !== "" ? Number(initialLng) : null;

      if (parsedLat != null && parsedLng != null && !isNaN(parsedLat) && !isNaN(parsedLng)) {
        setSelectedLat(parsedLat);
        setSelectedLng(parsedLng);
      } else {
        setSelectedLat(null);
        setSelectedLng(null);
      }

      setAddress(initialAddress || "");
      setSearchQuery("");
    }
  }, [show, initialLat, initialLng, initialAddress]);

  const currentCenter = useMemo(() => {
    if (selectedLat != null && selectedLng != null) {
      return { lat: selectedLat, lng: selectedLng };
    }
    return baseCenter;
  }, [selectedLat, selectedLng, baseCenter]);

  // Handle Map Load
  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    setTimeout(() => {
      if (window.google?.maps?.event) {
        window.google.maps.event.trigger(mapInstance, "resize");
        mapInstance.panTo(currentCenter);
      }
    }, 250);
  }, [currentCenter]);

  // Reverse Geocoding (coordinates -> text address)
  const fetchReverseGeocode = useCallback((lat: number, lng: number) => {
    if (!window.google?.maps?.Geocoder) return;

    setIsGeocodingAddress(true);
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      setIsGeocodingAddress(false);
      if (status === "OK" && results && results[0]) {
        // Formatted address in Arabic or English
        const formatted = results[0].formatted_address;
        setAddress(formatted);
      }
    });
  }, []);

  // Set Location and trigger geocoding
  const handleSelectCoords = useCallback((lat: number, lng: number, skipGeocode = false) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
    if (!skipGeocode) {
      fetchReverseGeocode(lat, lng);
    }
    if (map) {
      map.panTo({ lat, lng });
    }
  }, [fetchReverseGeocode, map]);

  // Map Click
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      handleSelectCoords(e.latLng.lat(), e.latLng.lng());
    }
  };

  // Marker Drag End
  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      handleSelectCoords(e.latLng.lat(), e.latLng.lng());
    }
  };

  // Search Address by Geocoder
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !window.google?.maps?.Geocoder) return;

    setIsSearching(true);
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode(
      {
        address: searchQuery,
        // Bias towards center
        bounds: map?.getBounds() || undefined,
      },
      (results, status) => {
        setIsSearching(false);
        if (status === "OK" && results && results[0]) {
          const loc = results[0].geometry.location;
          handleSelectCoords(loc.lat(), loc.lng(), true);
          setAddress(results[0].formatted_address);
          if (map) {
            map.panTo(loc);
            map.setZoom(16);
          }
          toast.success(isRtl ? "تم العثور على الموقع وتحديده" : "Location found and marked");
        } else {
          toast.error(isRtl ? "لم يتم العثور على نتائج للبحث" : "No results found for this search");
        }
      }
    );
  };

  // Current Geolocation
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.warning(isRtl ? "تحديد الموقع غير مدعوم في متصفحك" : "Geolocation not supported");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        handleSelectCoords(lat, lng);
        if (map) {
          map.panTo({ lat, lng });
          map.setZoom(16);
        }
        toast.success(isRtl ? "تم تحديد موقعك الحالي" : "Current location detected");
      },
      (err) => {
        setIsLocating(false);
        toast.error(isRtl ? "تعذر الوصول لموقعك الحالي، يرجى السماح بالإذن" : "Could not get current location");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Pan to School Location
  const handleCenterSchool = () => {
    if (defaultCenter && !isNaN(defaultCenter.lat) && !isNaN(defaultCenter.lng)) {
      if (map) {
        map.panTo(defaultCenter);
        map.setZoom(15);
      }
    }
  };

  // Confirm Selection
  const handleConfirm = () => {
    if (selectedLat == null || selectedLng == null) {
      toast.error(isRtl ? "يرجى النقر على الخريطة لتحديد موقع الطالب أولاً" : "Please click on the map to set a location");
      return;
    }
    onConfirm(selectedLat, selectedLng, address);
    onClose();
  };

  const hasSelectedLocation = selectedLat != null && selectedLng != null;

  return (
    <Modal show={show} onClose={onClose} maxWidth="4xl" zIndex={60}>
      <div className="flex flex-col h-full max-h-[92vh] overflow-hidden bg-white dark:bg-[#1a2845] rounded-[22px] text-right" dir={isRtl ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-[#0f2044]/5 via-transparent to-[#f5b800]/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0f2044] to-[#1a3668] text-[#f5b800] flex items-center justify-center shadow-md shadow-[#0f2044]/10 shrink-0">
              <MapPin size={20} className="animate-bounce" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#0f2044] dark:text-white flex items-center gap-2">
                {title || (isRtl ? "تحديد موقع منزل الطالب على الخريطة" : "Select Student Home Location")}
                {studentName && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                    {studentName}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                {isRtl
                  ? "انقر على الخريطة لتحديد المنزل بدقة أو اسحب العلامة لتحديث مسار الحافلة"
                  : "Click on the map or drag the pin to set the student's pickup location"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Quick Controls Bar */}
        <div className="p-3 sm:px-5 bg-gray-50/80 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-2.5">
          {/* Search Input Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[260px] flex items-center gap-1.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRtl ? "ابحث عن حي، معلم، أو شارع..." : "Search area, street, or landmark..."}
                className="w-full text-xs bg-white dark:bg-[#121c33] border border-gray-200 dark:border-white/10 rounded-xl py-2 px-3.5 pr-9 rtl:pr-3.5 rtl:pl-9 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f5b800]/40 focus:border-[#f5b800] transition-all"
              />
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="absolute top-1/2 -translate-y-1/2 left-2 rtl:left-auto rtl:right-2 p-1 text-gray-400 hover:text-[#f5b800] disabled:opacity-40 transition-colors"
                title={isRtl ? "بحث" : "Search"}
              >
                {isSearching ? (
                  <Loader2 size={16} className="animate-spin text-[#f5b800]" />
                ) : (
                  <Search size={16} />
                )}
              </button>
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#0f2044] hover:bg-[#183166] text-white disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm"
            >
              {isRtl ? "بحث" : "Search"}
            </button>
          </form>

          {/* Quick GPS Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCurrentLocation}
              disabled={isLocating}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-[#121c33] border border-gray-200 dark:border-white/10 hover:border-blue-400 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex items-center gap-1.5 shadow-sm"
              title={isRtl ? "تحديد موقعي الحالي بالـ GPS" : "Use current GPS location"}
            >
              {isLocating ? (
                <Loader2 size={14} className="animate-spin text-blue-500" />
              ) : (
                <Navigation size={14} className="text-blue-500" />
              )}
              <span>{isRtl ? "موقعي الحالي" : "My Location"}</span>
            </button>

            {defaultCenter && defaultCenter.lat && (
              <button
                type="button"
                onClick={handleCenterSchool}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-[#121c33] border border-gray-200 dark:border-white/10 hover:border-amber-400 text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-all flex items-center gap-1.5 shadow-sm"
                title={isRtl ? "الرجوع إلى موقع المدرسة" : "Center at school"}
              >
                <Building2 size={14} className="text-amber-500" />
                <span>{isRtl ? "موقع المدرسة" : "School"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Map Container */}
        <div className="relative w-full h-[380px] sm:h-[420px] bg-slate-100 dark:bg-slate-900">
          {loadError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400">
              <AlertCircle size={32} className="mb-2" />
              <h4 className="font-bold text-sm">{isRtl ? "تعذر تحميل خرائط جوجل" : "Failed to load Google Maps"}</h4>
              <p className="text-xs text-gray-500 mt-1">{isRtl ? "يرجى التحقق من اتصال الإنترنت أو مفتاح API" : "Check internet connection or API key"}</p>
            </div>
          )}

          {!isLoaded && !loadError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-900 text-slate-500">
              <div className="w-8 h-8 border-3 border-[#0f2044] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-bold">{isRtl ? "جاري تجهيز الخريطة التفاعلية..." : "Loading interactive map..."}</span>
            </div>
          )}

          {isLoaded && !loadError && (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={currentCenter}
              zoom={hasSelectedLocation ? 15 : 12}
              onClick={handleMapClick}
              onLoad={onMapLoad}
              options={{
                disableDefaultUI: false,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true,
                zoomControl: true,
                draggableCursor: "crosshair",
              }}
            >
              {hasSelectedLocation && (
                <Marker
                  position={{ lat: selectedLat!, lng: selectedLng! }}
                  draggable={true}
                  onDragEnd={handleMarkerDragEnd}
                  animation={window.google?.maps?.Animation?.DROP}
                  title={address || (isRtl ? "موقع منزل الطالب" : "Student Home")}
                />
              )}
            </GoogleMap>
          )}

          {/* Floating Instructions Banner */}
          <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3 pointer-events-none z-10">
            <div className="bg-[#0f2044]/90 backdrop-blur-md text-white text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg border border-white/10 flex items-center gap-2">
              <Compass size={13} className="text-[#f5b800] animate-spin" style={{ animationDuration: "12s" }} />
              <span>{isRtl ? "انقر في أي مكان لتحديد النقطة، أو اسحب الدبوس" : "Click anywhere or drag pin to position"}</span>
            </div>
          </div>
        </div>

        {/* Selected Coordinates & Address Info Bar */}
        <div className="p-4 bg-white dark:bg-[#1a2845] border-t border-gray-100 dark:border-white/10 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
            {/* Address Input */}
            <div className="sm:col-span-8 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin size={11} className="text-[#f5b800]" />
                  {isRtl ? "العنوان أو وصف موقع المنزل" : "Address / Location Description"}
                </label>
                {isGeocodingAddress && (
                  <span className="text-[9px] text-blue-500 font-bold flex items-center gap-1 animate-pulse">
                    <Loader2 size={10} className="animate-spin" />
                    {isRtl ? "جاري جلب اسم المنطقة..." : "Resolving address..."}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={isRtl ? "مثال: مسقط - السيب - قرب مسجد التقوى، فيلا 12" : "e.g., Muscat - Villa 12, near school"}
                className="w-full text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2 px-3 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#f5b800]"
              />
            </div>

            {/* Coordinates Display */}
            <div className="sm:col-span-4 space-y-1">
              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {isRtl ? "الإحداثيات الجغرافية" : "GPS Coordinates"}
              </label>
              <div className="h-9 px-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between text-xs font-mono font-bold text-gray-700 dark:text-gray-200">
                {hasSelectedLocation ? (
                  <span>
                    {selectedLat!.toFixed(5)}, {selectedLng!.toFixed(5)}
                  </span>
                ) : (
                  <span className="text-gray-400 text-[11px] font-sans font-normal italic">
                    {isRtl ? "لم يتم التحديد بعد" : "Not selected yet"}
                  </span>
                )}
                {hasSelectedLocation && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/5">
            <div>
              {hasSelectedLocation && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLat(null);
                    setSelectedLng(null);
                    setAddress("");
                  }}
                  className="text-xs text-rose-500 hover:text-rose-600 font-bold px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                >
                  {isRtl ? "إعادة ضبط (مسح التحديد)" : "Reset Pin"}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/10 transition-all"
              >
                {isRtl ? "إلغاء" : "Cancel"}
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={!hasSelectedLocation}
                className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md ${
                  hasSelectedLocation
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/20"
                    : "bg-gray-200 dark:bg-white/10 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Check size={14} />
                <span>{isRtl ? "تأكيد وحفظ الموقع" : "Confirm Location"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
