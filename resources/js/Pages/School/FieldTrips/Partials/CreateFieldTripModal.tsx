import { useState, FormEventHandler } from 'react';
import { useForm } from '@inertiajs/react';
import useTranslation from '@/hooks/useTranslation';
import LocationPicker from '@/Components/LocationPicker';

interface Teacher {
    id: number;
    name: string;
    phone: string | null;
}

export interface TripMember {
    type: 'teacher' | 'external';
    id?: number;
    name: string;
    phone?: string;
    national_id?: string;
}

interface Props {
    show: boolean;
    onClose: () => void;
    teachers?: Teacher[];
}

export default function CreateFieldTripModal({ show, onClose, teachers = [] }: Props) {
    const { t, isRtl } = useTranslation();
    const [currentStep, setCurrentStep] = useState(1);

    // Member Modal State
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [memberType, setMemberType] = useState<'teacher' | 'external'>('teacher');
    const [memberForm, setMemberForm] = useState<TripMember>({ type: 'teacher', name: '' });

    const { data, setData, post, processing, reset, errors } = useForm({
        trip_name: '',
        description: '',
        trip_date: '',
        trip_time: '08:00',
        destination: '',
        destination_lat: null as number | null,
        destination_lng: null as number | null,
        number_of_students: 1,
        teacher_names: [] as TripMember[],
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('school.field-trips.store'), {
            onSuccess: () => {
                onClose();
                setCurrentStep(1);
                reset();
            },
        });
    };

    if (!show) return null;

    const steps = [
        { id: 1, name: t('Details'), icon: '📝' },
        { id: 2, name: t('Map'), icon: '📍' },
        { id: 3, name: t('Review'), icon: '📋' },
    ];

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn"
            onClick={onClose}
        >
            <div
                className={`bg-white dark:bg-gray-800 rounded-[35px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden transform animate-slideUp flex flex-col ${isRtl ? 'rtl' : 'ltr'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Compact Header */}
                <div className="relative overflow-hidden bg-gradient-to-r from-[#0e7490] to-blue-600 p-5 text-white flex-shrink-0">
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-xl shadow-lg border border-white/30">
                                {steps.find(s => s.id === currentStep)?.icon || '🎒'}
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight leading-none">
                                    {t('New Field Trip')}
                                </h2>
                                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">
                                    {t('Professional Deployment')}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Compact Stepper */}
                    <div className="relative flex items-center justify-between mt-6 max-w-sm mx-auto">
                        {steps.map((step, idx) => (
                            <div key={step.id} className="flex items-center flex-1 last:flex-none">
                                <div className="flex flex-col items-center gap-1.5 relative z-10">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] transition-all duration-500 border-2 ${currentStep === step.id
                                        ? 'bg-white text-[#0e7490] border-white scale-110 shadow-lg'
                                        : currentStep > step.id
                                            ? 'bg-green-400 text-white border-green-400'
                                            : 'bg-white/20 text-white/60 border-white/20'
                                        }`}>
                                        {currentStep > step.id ? '✓' : step.id}
                                    </div>
                                    <span className={`text-[8px] uppercase tracking-[0.15em] font-black transition-colors ${currentStep === step.id ? 'text-white' : 'text-white/40'
                                        }`}>
                                        {step.name}
                                    </span>
                                </div>
                                {idx < steps.length - 1 && (
                                    <div className="flex-1 h-[1.5px] mx-2 -mt-4">
                                        <div className={`h-full transition-all duration-700 ${currentStep > step.id ? 'bg-green-400' : 'bg-white/20'
                                            }`} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Compact Content */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {currentStep === 1 && (
                        <div className="space-y-4 animate-fadeIn">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">
                                    {t('Trip Name')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.trip_name}
                                    onChange={e => setData('trip_name', e.target.value)}
                                    className="w-full px-5 py-3 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] transition-all font-bold text-sm placeholder-gray-400"
                                    placeholder={t('Example: Science Museum')}
                                    required
                                />
                                {errors.trip_name && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{errors.trip_name}</p>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">
                                    {t('Description')} <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    rows={3}
                                    className="w-full px-5 py-3 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] transition-all font-medium text-sm placeholder-gray-400"
                                    placeholder={t('Objectives and itinerary...')}
                                    required
                                />
                                {errors.description && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{errors.description}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">
                                        {t('Date')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={data.trip_date}
                                        onChange={e => setData('trip_date', e.target.value)}
                                        className="w-full px-5 py-3 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] transition-all font-bold text-sm"
                                        required
                                    />
                                    {errors.trip_date && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{errors.trip_date}</p>}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">
                                        {t('Start Time')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        value={data.trip_time}
                                        onChange={e => setData('trip_time', e.target.value)}
                                        className="w-full px-5 py-3 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] transition-all font-bold text-sm"
                                        required
                                    />
                                    {errors.trip_time && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{errors.trip_time}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-inner relative z-10 transition-all">
                                <LocationPicker
                                    lat={data.destination_lat}
                                    lng={data.destination_lng}
                                    onChange={(lat, lng) => {
                                        setData(prev => ({ ...prev, destination_lat: lat, destination_lng: lng }));
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">
                                        {t('Destination Address')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.destination}
                                        onChange={e => setData('destination', e.target.value)}
                                        className="w-full px-5 py-3 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] transition-all font-bold text-sm"
                                        placeholder={t('Location name...')}
                                        required
                                    />
                                    {errors.destination && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{errors.destination}</p>}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">
                                        {t('Student Count')} <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            value={data.number_of_students}
                                            onChange={e => setData('number_of_students', parseInt(e.target.value))}
                                            className="w-full px-5 py-3 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] transition-all font-black text-base"
                                            required
                                        />
                                        <span className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase tracking-widest`}>
                                            {t('Seats')}
                                        </span>
                                    </div>
                                    {errors.number_of_students && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{errors.number_of_students}</p>}
                                </div>
                            </div>
                            {(errors.destination_lat || errors.destination_lng) && (
                                <p className="text-red-500 text-[10px] text-center font-bold bg-red-50 dark:bg-red-950/20 py-2 rounded-xl border border-red-100 dark:border-red-900/10">
                                    📍 {t('Please select a destination on the map')}
                                </p>
                            )}
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-4 animate-fadeIn pb-2">
                            {/* Faculty Selection */}
                            <div className="bg-gray-50/50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-[10px] font-black text-[#0e7490] dark:text-cyan-400 uppercase tracking-widest">
                                        👨‍🏫 {t('Accompanying Members')}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowMemberModal(true)}
                                        className="px-3 py-1 bg-cyan-600 text-white text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-[#0e7490] transition-all"
                                    >
                                        + {t('Add Member')}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                                    {data.teacher_names.map((member, index) => (
                                        <div key={index} className="flex flex-col bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-2.5 rounded-xl relative group">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newMembers = data.teacher_names.filter((_, i) => i !== index);
                                                    setData('teacher_names', newMembers);
                                                }}
                                                className={`absolute top-2 ${isRtl ? 'left-2' : 'right-2'} p-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100`}
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${member.type === 'teacher' ? 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400' : 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                                                    {member.type === 'teacher' ? t('Teacher') : t('External')}
                                                </span>
                                                <span className={`font-bold text-xs text-gray-800 dark:text-white truncate ${isRtl ? 'pl-6' : 'pr-6'}`}>{member.name}</span>
                                            </div>
                                            {member.type === 'external' && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    {member.phone && <span className="text-[9px] font-bold text-gray-500">📞 {member.phone}</span>}
                                                    {member.national_id && <span className="text-[9px] font-bold text-gray-500">🔖 {member.national_id}</span>}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {data.teacher_names.length === 0 && (
                                        <p className="col-span-full py-2 text-center text-[8px] font-black text-gray-400 uppercase tracking-widest border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">{t('No members added')}</p>
                                    )}
                                </div>
                            </div>

                            {/* Review Grid */}
                            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
                                <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-4">
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t('Trip Identity')}</p>
                                        <p className="font-black text-gray-800 dark:text-white text-xs truncate">{data.trip_name || '---'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t('Schedule')}</p>
                                        <p className="font-black text-gray-800 dark:text-white text-xs">{data.trip_date || '---'} {data.trip_time}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t('Destination')}</p>
                                        <p className="font-black text-gray-800 dark:text-white text-xs truncate">📍 {data.destination || '---'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t('Seats')}</p>
                                        <p className="font-black text-gray-800 dark:text-white text-xs">{data.number_of_students}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t('Faculty')}</p>
                                        <p className="font-black text-gray-800 dark:text-white text-xs">{data.teacher_names.length}</p>
                                    </div>
                                </div>
                                <div className="px-4 py-2 bg-orange-50 dark:bg-orange-950/20 flex gap-2 border-t border-orange-100 dark:border-orange-900/10">
                                    <span className="text-orange-500 text-sm">⚠️</span>
                                    <p className="text-[8px] text-orange-700 dark:text-orange-400 font-bold leading-normal">
                                        {t('Pricing and vehicle assignment will be finalized by the administrator.')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Foot Action */}
                <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex flex-shrink-0 justify-between items-center">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 font-black uppercase tracking-widest text-[9px]"
                    >
                        {t('Cancel')}
                    </button>

                    <div className="flex gap-2">
                        {currentStep > 1 && (
                            <button
                                type="button"
                                onClick={prevStep}
                                className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all font-black uppercase tracking-widest text-[9px]"
                            >
                                {t('Back')}
                            </button>
                        )}

                        {currentStep < 3 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                disabled={
                                    (currentStep === 1 && (!data.trip_name || !data.trip_date)) ||
                                    (currentStep === 2 && (!data.destination || !data.destination_lat))
                                }
                                className="px-8 py-2.5 bg-[#0e7490] text-white font-black rounded-xl hover:bg-[#155e75] shadow-lg transition-all uppercase tracking-widest text-[9px] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('Next Step')}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={processing}
                                className="px-10 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black rounded-xl hover:shadow-lg transition-all uppercase tracking-widest text-[9px] disabled:opacity-50"
                            >
                                {processing ? t('Submitting...') : t('Submit Request')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Member Addition Popup */}
            {showMemberModal && (
                <div
                    className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
                    onClick={() => setShowMemberModal(false)}
                >
                    <div
                        className={`bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-sm w-full p-6 transform animate-slideUp flex flex-col ${isRtl ? 'rtl' : 'ltr'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-gray-800 dark:text-white tracking-tight">{t('Add Member')}</h3>
                            <button
                                onClick={() => setShowMemberModal(false)}
                                className="w-8 h-8 bg-gray-50 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-full flex items-center justify-center transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex p-1 bg-gray-50 dark:bg-gray-900/50 rounded-xl mb-6">
                            <button
                                type="button"
                                onClick={() => {
                                    setMemberType('teacher');
                                    setMemberForm({ type: 'teacher', name: '' });
                                }}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${memberType === 'teacher' ? 'bg-white dark:bg-gray-800 shadow-sm text-cyan-600 dark:text-cyan-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                            >
                                {t('School Teacher')}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setMemberType('external');
                                    setMemberForm({ type: 'external', name: '', phone: '', national_id: '' });
                                }}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${memberType === 'external' ? 'bg-white dark:bg-gray-800 shadow-sm text-purple-600 dark:text-purple-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                            >
                                {t('External Escort')}
                            </button>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-4 mb-8">
                            {memberType === 'teacher' ? (
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">
                                        {t('Select Teacher')} <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={memberForm.id || ''}
                                            onChange={e => {
                                                const teacherId = parseInt(e.target.value);
                                                const teacherInfo = teachers.find(t => t.id === teacherId);
                                                if (teacherInfo) {
                                                    setMemberForm({
                                                        type: 'teacher',
                                                        id: teacherInfo.id,
                                                        name: teacherInfo.name,
                                                        phone: teacherInfo.phone || undefined,
                                                    });
                                                }
                                            }}
                                            className="w-full px-4 py-3 border border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-white focus:ring-2 focus:ring-cyan-500 transition-all font-bold text-sm appearance-none"
                                        >
                                            <option value="" disabled>{t('Choose from list...')}</option>
                                            {teachers.map(teacher => (
                                                <option key={teacher.id} value={teacher.id}>
                                                    {teacher.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className={`absolute inset-y-0 ${isRtl ? 'left-4' : 'right-4'} flex items-center pointer-events-none text-gray-400`}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">
                                            {t('Full Name')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={memberForm.name}
                                            onChange={e => setMemberForm({ ...memberForm, name: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 transition-all font-bold text-sm"
                                            placeholder={t('Example: Ahmed Ali')}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">
                                                {t('Phone')} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={memberForm.phone || ''}
                                                onChange={e => setMemberForm({ ...memberForm, phone: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 transition-all font-bold text-xs"
                                                dir="ltr"
                                                placeholder="05XXXXXXXX"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">
                                                {t('National ID')} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={memberForm.national_id || ''}
                                                onChange={e => setMemberForm({ ...memberForm, national_id: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 transition-all font-bold text-xs tracking-wider"
                                                dir="ltr"
                                                placeholder="10XXXXXX"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                if (memberType === 'teacher' && !memberForm.id) return;
                                if (memberType === 'external' && (!memberForm.name || !memberForm.phone || !memberForm.national_id)) return;

                                setData('teacher_names', [...data.teacher_names, memberForm]);
                                setShowMemberModal(false);
                                setMemberForm({ type: memberType, name: '' });
                            }}
                            disabled={
                                (memberType === 'teacher' && !memberForm.id) ||
                                (memberType === 'external' && (!memberForm.name || !memberForm.phone || !memberForm.national_id))
                            }
                            className={`w-full py-3.5 text-white font-black rounded-xl shadow-lg transition-all uppercase tracking-widest text-[10px] disabled:opacity-50 disabled:cursor-not-allowed ${memberType === 'teacher' ? 'bg-[#0e7490] hover:bg-cyan-700 hover:shadow-cyan-500/30' : 'bg-purple-600 hover:bg-purple-700 hover:shadow-purple-500/30'}`}
                        >
                            {t('Confirm Addition')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
