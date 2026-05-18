import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import { FormEventHandler, useState } from 'react';
import { Users, User, CreditCard, Briefcase, Mail, Upload, ArrowLeft, Loader2, X } from 'lucide-react';

export default function CreateDriver() {
    const { data, setData, post, processing, errors } = useForm({
        first_name_ar: '',
        last_name_ar: '',
        first_name_en: '',
        last_name_en: '',
        national_id: '',
        email: '',
        phone: '',
        license_number: '',
        license_expiry_date: '',
        preferred_language: 'ar',
        address: '',
        image: null as File | null,
        license_front_image: null as File | null,
        license_back_image: null as File | null,
        id_card_front_image: null as File | null,
        id_card_back_image: null as File | null,
    });

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewLicenseFront, setPreviewLicenseFront] = useState<string | null>(null);
    const [previewLicenseBack, setPreviewLicenseBack] = useState<string | null>(null);
    const [previewIdCardFront, setPreviewIdCardFront] = useState<string | null>(null);
    const [previewIdCardBack, setPreviewIdCardBack] = useState<string | null>(null);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('admin.drivers.store'), {
            forceFormData: true,
        });
    };

    // Design tokens synced with Admin Driver Index
    const DS_label = "text-[10px] font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-wider block";
    const DS_input = "w-full text-xs font-bold text-[#0f2044] dark:text-white bg-gray-50/50 dark:bg-[#0f2044]/15 border border-gray-200 dark:border-[#243460] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#f5b800] dark:focus:border-[#f5b800] focus:ring-1 focus:ring-[#f5b800] dark:focus:ring-[#f5b800] transition-all placeholder-gray-400";
    const DS_select = "w-full text-xs font-bold text-[#0f2044] dark:text-white bg-gray-50/50 dark:bg-[#0f2044]/15 border border-gray-200 dark:border-[#243460] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#f5b800] dark:focus:border-[#f5b800] transition-all appearance-none cursor-pointer";
    const DS_btnGold = "inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#f5b800] to-[#e0a800] text-xs font-black text-[#0f2044] uppercase tracking-wider rounded-xl hover:shadow-lg hover:shadow-amber-500/10 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none";

    const isArabicNameRequired = !data.first_name_en && !data.last_name_en;
    const isEnglishNameRequired = !data.first_name_ar && !data.last_name_ar;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link href={route('admin.drivers.index')} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                        <ArrowLeft size={18} />
                    </Link>
                    <h2 className="font-bold text-xl text-gray-800 dark:text-white leading-tight">Register New Driver</h2>
                </div>
            }
        >
            <Head title="Add Driver" />

            <div className="py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-extrabold text-[#0f2044] dark:text-white tracking-tight">New Driver Registration</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enroll a new driver with their documents in a single compact interface.</p>
                        </div>
                    </div>

                    {/* Main Card */}
                    <div className="bg-white dark:bg-[#121e3d] overflow-hidden shadow-xl sm:rounded-3xl border border-gray-100 dark:border-[#243460]/40">
                        <form onSubmit={submit} className="flex flex-col">
                            <div className="p-6 md:p-8 space-y-8">
                                
                                {/* §1 The Names */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#243460] pb-2">
                                        <h4 className="text-xs font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.15em] flex items-center gap-2">
                                            <Users size={14} className="text-[#f5b800] dark:text-[#7ba7e8]" />
                                            Official Names
                                        </h4>
                                        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded">
                                            * Req: Arabic or English
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Arabic Panel */}
                                        <div className="p-4 bg-gray-50/50 dark:bg-[#0f2044]/10 rounded-2xl border border-gray-100/85 dark:border-[#243460]/40 space-y-3">
                                            <span className="text-[9px] font-black text-gray-400 dark:text-gray-400 tracking-wider">ARABIC DOSSIER</span>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <label className={DS_label}>First Name {isArabicNameRequired && <span className="text-rose-500">*</span>}</label>
                                                    <input type="text" value={data.first_name_ar} onChange={e => setData("first_name_ar", e.target.value)} className={DS_input} dir="rtl" required={isArabicNameRequired} />
                                                    <InputError message={errors.first_name_ar} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={DS_label}>Last Name {isArabicNameRequired && <span className="text-rose-500">*</span>}</label>
                                                    <input type="text" value={data.last_name_ar} onChange={e => setData("last_name_ar", e.target.value)} className={DS_input} dir="rtl" required={isArabicNameRequired} />
                                                    <InputError message={errors.last_name_ar} />
                                                </div>
                                            </div>
                                        </div>
                                        {/* English Panel */}
                                        <div className="p-4 bg-gray-50/50 dark:bg-[#0f2044]/10 rounded-2xl border border-gray-100/85 dark:border-[#243460]/40 space-y-3">
                                            <span className="text-[9px] font-black text-gray-400 dark:text-gray-400 tracking-wider">ENGLISH DOSSIER</span>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <label className={DS_label}>First Name {isEnglishNameRequired && <span className="text-rose-500">*</span>}</label>
                                                    <input type="text" value={data.first_name_en} onChange={e => setData("first_name_en", e.target.value)} className={DS_input} dir="ltr" required={isEnglishNameRequired} />
                                                    <InputError message={errors.first_name_en} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={DS_label}>Last Name {isEnglishNameRequired && <span className="text-rose-500">*</span>}</label>
                                                    <input type="text" value={data.last_name_en} onChange={e => setData("last_name_en", e.target.value)} className={DS_input} dir="ltr" required={isEnglishNameRequired} />
                                                    <InputError message={errors.last_name_en} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* §2 Personal Identity */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.15em] border-b border-gray-100 dark:border-[#243460] pb-2 flex items-center gap-2">
                                        <CreditCard size={14} className="text-[#f5b800] dark:text-[#7ba7e8]" />
                                        Personal Identity & Documents
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Left Col: Inputs & Profile photo */}
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <label className={DS_label}>Civil ID / Iqama <span className="text-rose-500">*</span></label>
                                                    <input type="text" value={data.national_id} onChange={e => setData("national_id", e.target.value)} className={`${DS_input} font-mono`} dir="ltr" required />
                                                    <InputError message={errors.national_id} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={DS_label}>Phone Number <span className="text-rose-500">*</span></label>
                                                    <input type="text" value={data.phone} onChange={e => setData("phone", e.target.value)} className={`${DS_input} font-mono`} dir="ltr" placeholder="5XXXXXXXX" required />
                                                    <InputError message={errors.phone} />
                                                </div>
                                            </div>
                                            {/* Profile photo upload directly under */}
                                            <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                                <div className="w-12 h-12 rounded-xl border border-gray-200 dark:border-[#243460] flex items-center justify-center overflow-hidden bg-white dark:bg-[#0f2044] flex-shrink-0 relative group">
                                                    {data.image ? (
                                                        <>
                                                            <img src={URL.createObjectURL(data.image)} className="w-full h-full object-cover" />
                                                            <button type="button" onClick={() => { setData("image", null); setPreviewImage(null); }} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <X size={14} className="text-white" />
                                                            </button>
                                                        </>
                                                    ) : previewImage ? (
                                                        <>
                                                            <img src={previewImage} className="w-full h-full object-cover" />
                                                            <button type="button" onClick={() => setPreviewImage(null)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <X size={14} className="text-white" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <User size={20} className="text-gray-400 dark:text-[#7ba7e8]/60" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-[#0f2044] dark:text-white leading-tight">Profile Photo</p>
                                                    {!data.image && !previewImage ? (
                                                        <label className="cursor-pointer text-[10px] font-black text-[#0f2044] dark:text-[#f5b800] uppercase underline mt-1 inline-block">
                                                            Choose Photo
                                                            <input type="file" className="hidden" accept="image/*" onChange={e => {
                                                                const file = e.target.files?.[0] || null;
                                                                setData("image", file);
                                                                if (file) setPreviewImage(URL.createObjectURL(file));
                                                            }} />
                                                        </label>
                                                    ) : (
                                                        <button type="button" onClick={() => { setData("image", null); setPreviewImage(null); }} className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase underline mt-1 inline-block">
                                                            Remove
                                                        </button>
                                                    )}
                                                    <InputError message={errors.image} />
                                                </div>
                                            </div>
                                        </div>
                                        {/* Right Col: ID Docs grouped next to inputs */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className={DS_label}>ID Card Front</label>
                                                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-[#0f2044]/20 rounded-2xl border border-dashed border-gray-200 dark:border-[#243460] min-h-[100px] text-center relative group">
                                                    <div className="w-12 h-12 rounded overflow-hidden bg-white dark:bg-[#0f2044] border border-gray-200 dark:border-[#243460]/50 flex items-center justify-center mb-2 relative">
                                                        {data.id_card_front_image ? (
                                                            <>
                                                                <img src={URL.createObjectURL(data.id_card_front_image)} className="w-full h-full object-cover" />
                                                                <button type="button" onClick={() => { setData("id_card_front_image", null); setPreviewIdCardFront(null); }} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <X size={12} className="text-white" />
                                                                </button>
                                                            </>
                                                        ) : previewIdCardFront ? (
                                                            <>
                                                                <img src={previewIdCardFront} className="w-full h-full object-cover" />
                                                                <button type="button" onClick={() => setPreviewIdCardFront(null)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <X size={12} className="text-white" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <CreditCard size={18} className="text-gray-400 dark:text-[#7ba7e8]/60" />
                                                        )}
                                                    </div>
                                                    {!data.id_card_front_image && !previewIdCardFront ? (
                                                        <label className="cursor-pointer text-[10px] font-black text-[#0f2044] dark:text-[#f5b800] uppercase underline">
                                                            Upload Front
                                                            <input type="file" className="hidden" accept="image/*" onChange={e => {
                                                                const file = e.target.files?.[0] || null;
                                                                setData("id_card_front_image", file);
                                                                if (file) setPreviewIdCardFront(URL.createObjectURL(file));
                                                            }} />
                                                        </label>
                                                    ) : (
                                                        <button type="button" onClick={() => { setData("id_card_front_image", null); setPreviewIdCardFront(null); }} className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase underline">
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className={DS_label}>ID Card Back</label>
                                                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-[#0f2044]/20 rounded-2xl border border-dashed border-gray-200 dark:border-[#243460] min-h-[100px] text-center relative group">
                                                    <div className="w-12 h-12 rounded overflow-hidden bg-white dark:bg-[#0f2044] border border-gray-200 dark:border-[#243460]/50 flex items-center justify-center mb-2 relative">
                                                        {data.id_card_back_image ? (
                                                            <>
                                                                <img src={URL.createObjectURL(data.id_card_back_image)} className="w-full h-full object-cover" />
                                                                <button type="button" onClick={() => { setData("id_card_back_image", null); setPreviewIdCardBack(null); }} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <X size={12} className="text-white" />
                                                                </button>
                                                            </>
                                                        ) : previewIdCardBack ? (
                                                            <>
                                                                <img src={previewIdCardBack} className="w-full h-full object-cover" />
                                                                <button type="button" onClick={() => setPreviewIdCardBack(null)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <X size={12} className="text-white" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <CreditCard size={18} className="text-gray-400 dark:text-[#7ba7e8]/60" />
                                                        )}
                                                    </div>
                                                    {!data.id_card_back_image && !previewIdCardBack ? (
                                                        <label className="cursor-pointer text-[10px] font-black text-[#0f2044] dark:text-[#f5b800] uppercase underline">
                                                            Upload Back
                                                            <input type="file" className="hidden" accept="image/*" onChange={e => {
                                                                const file = e.target.files?.[0] || null;
                                                                setData("id_card_back_image", file);
                                                                if (file) setPreviewIdCardBack(URL.createObjectURL(file));
                                                            }} />
                                                        </label>
                                                    ) : (
                                                        <button type="button" onClick={() => { setData("id_card_back_image", null); setPreviewIdCardBack(null); }} className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase underline">
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* §3 Driving Credentials */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.15em] border-b border-gray-100 dark:border-[#243460] pb-2 flex items-center gap-2">
                                        <Briefcase size={14} className="text-[#f5b800] dark:text-[#7ba7e8]" />
                                        Driving Credentials & Documents
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Left Col: License Inputs */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className={DS_label}>License Number <span className="text-rose-500">*</span></label>
                                                <input type="text" value={data.license_number} onChange={e => setData("license_number", e.target.value)} className={`${DS_input} font-mono`} dir="ltr" required />
                                                <InputError message={errors.license_number} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className={DS_label}>License Expiry <span className="text-rose-500">*</span></label>
                                                <input type="date" value={data.license_expiry_date} onChange={e => setData("license_expiry_date", e.target.value)} className={DS_input} dir="ltr" required />
                                                <InputError message={errors.license_expiry_date} />
                                            </div>
                                        </div>
                                        {/* Right Col: License Copy front/back */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className={DS_label}>License Front</label>
                                                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-[#0f2044]/20 rounded-2xl border border-dashed border-gray-200 dark:border-[#243460] min-h-[100px] text-center relative group">
                                                    <div className="w-12 h-12 rounded overflow-hidden bg-white dark:bg-[#0f2044] border border-gray-200 dark:border-[#243460]/50 flex items-center justify-center mb-2 relative">
                                                        {data.license_front_image ? (
                                                            <>
                                                                <img src={URL.createObjectURL(data.license_front_image)} className="w-full h-full object-cover" />
                                                                <button type="button" onClick={() => { setData("license_front_image", null); setPreviewLicenseFront(null); }} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <X size={12} className="text-white" />
                                                                </button>
                                                            </>
                                                        ) : previewLicenseFront ? (
                                                            <>
                                                                <img src={previewLicenseFront} className="w-full h-full object-cover" />
                                                                <button type="button" onClick={() => setPreviewLicenseFront(null)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <X size={12} className="text-white" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <CreditCard size={18} className="text-gray-400 dark:text-[#7ba7e8]/60" />
                                                        )}
                                                    </div>
                                                    {!data.license_front_image && !previewLicenseFront ? (
                                                        <label className="cursor-pointer text-[10px] font-black text-[#0f2044] dark:text-[#f5b800] uppercase underline">
                                                            Upload Front
                                                            <input type="file" className="hidden" accept="image/*" onChange={e => {
                                                                const file = e.target.files?.[0] || null;
                                                                setData("license_front_image", file);
                                                                if (file) setPreviewLicenseFront(URL.createObjectURL(file));
                                                            }} />
                                                        </label>
                                                    ) : (
                                                        <button type="button" onClick={() => { setData("license_front_image", null); setPreviewLicenseFront(null); }} className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase underline">
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className={DS_label}>License Back</label>
                                                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-[#0f2044]/20 rounded-2xl border border-dashed border-gray-200 dark:border-[#243460] min-h-[100px] text-center relative group">
                                                    <div className="w-12 h-12 rounded overflow-hidden bg-white dark:bg-[#0f2044] border border-gray-200 dark:border-[#243460]/50 flex items-center justify-center mb-2 relative">
                                                        {data.license_back_image ? (
                                                            <>
                                                                <img src={URL.createObjectURL(data.license_back_image)} className="w-full h-full object-cover" />
                                                                <button type="button" onClick={() => { setData("license_back_image", null); setPreviewLicenseBack(null); }} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <X size={12} className="text-white" />
                                                                </button>
                                                            </>
                                                        ) : previewLicenseBack ? (
                                                            <>
                                                                <img src={previewLicenseBack} className="w-full h-full object-cover" />
                                                                <button type="button" onClick={() => setPreviewLicenseBack(null)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <X size={12} className="text-white" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <CreditCard size={18} className="text-gray-400 dark:text-[#7ba7e8]/60" />
                                                        )}
                                                    </div>
                                                    {!data.license_back_image && !previewLicenseBack ? (
                                                        <label className="cursor-pointer text-[10px] font-black text-[#0f2044] dark:text-[#f5b800] uppercase underline">
                                                            Upload Back
                                                            <input type="file" className="hidden" accept="image/*" onChange={e => {
                                                                const file = e.target.files?.[0] || null;
                                                                setData("license_back_image", file);
                                                                if (file) setPreviewLicenseBack(URL.createObjectURL(file));
                                                            }} />
                                                        </label>
                                                    ) : (
                                                        <button type="button" onClick={() => { setData("license_back_image", null); setPreviewLicenseBack(null); }} className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase underline">
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* §4 Contact & Preferences */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.15em] border-b border-gray-100 dark:border-[#243460] pb-2 flex items-center gap-2">
                                        <Mail size={14} className="text-[#f5b800] dark:text-[#7ba7e8]" />
                                        Contact & Preferences
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <label className={DS_label}>Email Address</label>
                                            <input type="email" value={data.email} onChange={e => setData("email", e.target.value)} className={DS_input} dir="ltr" placeholder="driver@company.com" />
                                            <InputError message={errors.email} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={DS_label}>Preferred Language</label>
                                            <select value={data.preferred_language} onChange={e => setData("preferred_language", e.target.value)} className={DS_select}>
                                                <option value="ar">العربية (Arabic)</option>
                                                <option value="en">English</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className={DS_label}>Residential Address</label>
                                            <input type="text" value={data.address} onChange={e => setData("address", e.target.value)} className={DS_input} placeholder="Street, City" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="px-6 py-5 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-[#243460] flex items-center justify-end gap-3">
                                <Link href={route('admin.drivers.index')} className="text-xs font-bold text-gray-400 hover:text-[#0f2044] dark:hover:text-white transition-colors">
                                    Cancel
                                </Link>
                                <button type="submit" disabled={processing} className={DS_btnGold}>
                                    {processing && <Loader2 size={16} className="animate-spin" />}
                                    Save &amp; Register Driver
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
