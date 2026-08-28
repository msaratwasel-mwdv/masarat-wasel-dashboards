import React, { useMemo } from "react";
import { Link } from "@inertiajs/react";
import { School as SchoolIcon, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { School } from "./types";

interface Props {
  schools: School[];
  isDark: boolean;
  isRTL: boolean;
}

export default function SchoolsDistributionMap({ schools, isDark, isRTL }: Props) {
  const validSchools = useMemo(() => {
    return schools.filter((s) => s.latitude && s.longitude);
  }, [schools]);

  const center = useMemo(() => {
    if (validSchools.length === 0) return [23.5859, 58.4059] as [number, number];
    const lat = validSchools.reduce((sum, s) => sum + Number(s.latitude), 0) / validSchools.length;
    const lng = validSchools.reduce((sum, s) => sum + Number(s.longitude), 0) / validSchools.length;
    return [lat, lng] as [number, number];
  }, [validSchools]);

  const schoolIcon = useMemo(() => {
    return L.divIcon({
      html: `
        <div style="
            width:40px;height:40px;
            background:#0f2044;
            border-radius:12px;
            display:flex;align-items:center;justify-content:center;
            border:3px solid white;
            box-shadow:0 10px 15px -3px rgba(0,0,0,0.3);
            font-size:20px;
            color:#f5b800;
        ">
            🏛
        </div>
      `,
      className: "custom-school-marker",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    });
  }, []);

  return (
    <MapContainer
      center={center}
      zoom={11}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validSchools.map((school) => (
        <Marker
          key={school.id}
          position={[Number(school.latitude), Number(school.longitude)]}
          icon={schoolIcon}
        >
          <Popup minWidth={220} className="custom-modern-popup">
            <div className={`p-4 ${isRTL ? "text-right" : "text-left"} dir-${isRTL ? "rtl" : "ltr"}`}>
              <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-navy/10 flex items-center justify-center p-1.5">
                  {school.logo ? (
                    <img src={`/storage/${school.logo}`} className="w-full h-full object-contain" alt="" />
                  ) : (
                    <SchoolIcon className="w-5 h-5 text-brand-navy" />
                  )}
                </div>
                <div>
                  <h4 className="font-black text-sm text-gray-900 leading-tight">{school.name}</h4>
                  <p className="text-[9px] text-gray-400 font-bold flex items-center gap-0.5 mt-0.5">
                    <MapPin className="w-2.5 h-2.5" />
                    {school.address?.substring(0, 25)}...
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50/50 p-2 rounded-2xl border border-blue-100/50 text-center">
                  <p className="text-[8px] font-black text-blue-400 uppercase mb-0.5">
                    {isRTL ? "الباصات" : "Buses"}
                  </p>
                  <p className="text-sm font-black text-blue-600">{school.buses_count || 0}</p>
                </div>
                <div className="bg-emerald-50/50 p-2 rounded-2xl border border-emerald-100/50 text-center">
                  <p className="text-[8px] font-black text-emerald-400 uppercase mb-0.5">
                    {isRTL ? "الطلاب" : "Students"}
                  </p>
                  <p className="text-sm font-black text-emerald-600">{school.enrollments_count || 0}</p>
                </div>
              </div>

              <Link
                href={route("admin.schools.show", school.id)}
                className="w-full py-2 bg-brand-navy text-white text-[10px] font-black rounded-xl hover:bg-brand-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-navy/20"
              >
                {isRTL ? "عرض التفاصيل والتقارير" : "View Details & Reports"}
                {isRTL ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
