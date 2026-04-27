import { useForm, usePage } from "@inertiajs/react";
import { Transition } from "@headlessui/react";
import { FormEventHandler } from "react";
import InputError from "@/Components/InputError";
import { useTheme } from "@/Contexts/ThemeContext";
import { DS_inputCls, DS_labelCls, DS_submitBtn } from "@/lib/DS";
import { Building2, MapPin, Upload, Check } from "lucide-react";
import FieldTripMapPicker from "@/Components/FieldTripMapPicker";

export default function UpdateSchoolInformationForm() {
    const { isRTL: isRtl, theme } = useTheme();
    const isDark = theme === 'dark';
    const user = usePage().props.auth.user as any;
    const school = user.school || {};

    const { data, setData, post, errors, processing, recentlySuccessful } = useForm({
        name: school.name || "",
        address: school.address || "",
        latitude: school.latitude ? Number(school.latitude) : null,
        longitude: school.longitude ? Number(school.longitude) : null,
        logo: null as File | null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("school.settings.school.update"), {
            preserveScroll: true,
            forceFormData: true,
        });
    };

    return (
        <section className="space-y-6">
            <header>
                <h2 className="text-lg font-bold text-[#0f2044] dark:text-white">
                    {isRtl ? "بيانات المدرسة" : "School Information"}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {isRtl 
                        ? "تحديث الاسم، العنوان، وشعار المدرسة الذي يظهر في النظام والتقارير."
                        : "Update school name, address, and logo used across the system and reports."}
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={DS_labelCls} htmlFor="school_name">
                            <Building2 className="w-3 h-3 inline-block mb-1 mx-1" />
                            {isRtl ? "اسم المدرسة" : "School Name"}
                        </label>
                        <input
                            id="school_name"
                            className={DS_inputCls}
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            required
                        />
                        <InputError className="mt-2" message={errors.name} />
                    </div>

                    <div>
                        <label className={DS_labelCls} htmlFor="school_address">
                            <MapPin className="w-3 h-3 inline-block mb-1 mx-1" />
                            {isRtl ? "العنوان" : "Address"}
                        </label>
                        <input
                            id="school_address"
                            className={DS_inputCls}
                            value={data.address}
                            onChange={(e) => setData("address", e.target.value)}
                        />
                        <InputError className="mt-2" message={errors.address} />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-[#0f2044] dark:text-white">
                            {isRtl ? "تحديد الموقع على الخريطة" : "Select Location on Map"}
                        </p>
                        {(data.latitude && data.longitude) && (
                            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                {isRtl ? "تم تحديد الموقع" : "Location Selected"}
                            </span>
                        )}
                    </div>
                    <div className="h-[300px] rounded-2xl overflow-hidden border-2 border-[#0f2044]/10 dark:border-[#243460] shadow-inner relative z-10">
                        <FieldTripMapPicker
                            lat={data.latitude}
                            lng={data.longitude}
                            isDark={isDark}
                            isRtl={isRtl}
                            onChange={(lat, lng, address) => {
                                setData(prev => ({
                                    ...prev,
                                    latitude: lat,
                                    longitude: lng,
                                    address: address || prev.address
                                }));
                            }}
                        />
                    </div>
                    <InputError className="mt-2" message={errors.latitude as string} />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-[#0f2044]/5 dark:bg-[#0f2044]/20 border border-[#0f2044]/10 dark:border-[#243460]">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-2xl bg-white dark:bg-[#1a2845] border-2 border-dashed border-[#0f2044]/20 dark:border-[#243460] flex items-center justify-center overflow-hidden shadow-inner transition-all group-hover:border-[#f5b800]">
                            {school.logo ? (
                                <img 
                                    src={school.logo.startsWith('http') ? school.logo : `/storage/${school.logo}`} 
                                    alt="Logo" 
                                    className="w-full h-full object-contain p-2" 
                                />
                            ) : (
                                <Building2 className="w-10 h-10 text-gray-300" />
                            )}
                        </div>
                    </div>
                    
                    <div className="flex-1 text-center sm:text-start space-y-3">
                        <div>
                            <h4 className="text-sm font-bold text-[#0f2044] dark:text-white">
                                {isRtl ? "شعار المدرسة" : "School Logo"}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {isRtl 
                                    ? "يفضل استخدام صورة مربعة بخلفية شفافة (PNG/JPG، بحد أقصى 2 ميجا)" 
                                    : "Prefer square image with transparent background (PNG/JPG, max 2MB)"}
                            </p>
                        </div>
                        
                        <div className="relative">
                            <input
                                type="file"
                                id="school_logo"
                                className="hidden"
                                onChange={(e) => setData("logo", e.target.files?.[0] || null)}
                                accept="image/*"
                            />
                            <label
                                htmlFor="school_logo"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a2845] border border-gray-200 dark:border-[#243460] rounded-xl text-xs font-bold text-[#0f2044] dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-[#243460] transition-all shadow-sm"
                            >
                                <Upload className="w-3.5 h-3.5" />
                                {isRtl ? "اختيار صورة جديدة" : "Choose New Image"}
                            </label>
                            {data.logo && (
                                <span className="mx-3 text-[10px] font-bold text-[#f5b800]">
                                    {data.logo.name}
                                </span>
                            )}
                        </div>
                        <InputError className="mt-2" message={errors.logo} />
                    </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-[#243460]">
                    <button type="submit" className={DS_submitBtn(processing)} disabled={processing}>
                        {isRtl ? "حفظ التغييرات" : "Save Changes"}
                    </button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {isRtl ? "✓ تم الحفظ بنجاح" : "✓ Saved successfully"}
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
