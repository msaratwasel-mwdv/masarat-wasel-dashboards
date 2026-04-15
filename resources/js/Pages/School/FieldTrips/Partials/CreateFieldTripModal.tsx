import { useState, FormEventHandler, useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import useTranslation from '@/hooks/useTranslation';
import FieldTripMapPicker from '@/Components/FieldTripMapPicker';
import { useTheme } from '@/Contexts/ThemeContext';

interface Teacher {
    id: number;
    first_name_ar: string;
    last_name_ar: string;
    phone: string | null;
}

interface Student {
    id: number;
    first_name_ar: string;
    last_name_ar: string;
    student_code: string;
}

interface Classroom {
    id: number;
    name: string;
    students: Student[];
}

export interface TripMember {
    name: string;
    phone?: string;
    national_id?: string;
}

interface Props {
    show: boolean;
    onClose: () => void;
    teachers?: Teacher[];
    classrooms?: Classroom[];
}

export default function CreateFieldTripModal({ show, onClose, teachers = [], classrooms = [] }: Props) {
    const { t } = useTranslation();
    const { isRTL, theme } = useTheme();
    const isDark = theme === 'dark';
    const [currentStep, setCurrentStep] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClassroomId, setSelectedClassroomId] = useState<number | 'all'>('all');

    // Member Modal State (For External Members)
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [memberForm, setMemberForm] = useState<TripMember>({ name: '' });

    const { data, setData, post, processing, reset, errors } = useForm({
        name: '',
        description: '',
        date: '',
        departure_time: '08:00',
        arrival_time: '',
        destination_address: '',
        destination_latitude: null as number | null,
        destination_longitude: null as number | null,
        student_ids: [] as number[],
        teacher_ids: [] as number[],
        external_members: [] as TripMember[],
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

    const filteredStudents = useMemo(() => {
        let students: (Student & { classroomName: string })[] = [];
        
        classrooms.forEach(cls => {
            if (selectedClassroomId === 'all' || selectedClassroomId === cls.id) {
                cls.students.forEach(s => {
                    students.push({ ...s, classroomName: cls.name });
                });
            }
        });

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            students = students.filter(s => 
                s.first_name_ar.toLowerCase().includes(term) || 
                s.last_name_ar.toLowerCase().includes(term) ||
                s.student_code.toLowerCase().includes(term)
            );
        }

        return students;
    }, [classrooms, selectedClassroomId, searchTerm]);

    if (!show) return null;

    const steps = [
        { id: 1, name: t('Details'), icon: '📝' },
        { id: 2, name: t('Location'), icon: '📍' },
        { id: 3, name: t('Students'), icon: '🎓' },
        { id: 4, name: t('Faculty'), icon: '📋' },
    ];

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const toggleStudent = (id: number) => {
        setData('student_ids', data.student_ids.includes(id) 
            ? data.student_ids.filter(sid => sid !== id) 
            : [...data.student_ids, id]
        );
    };

    const toggleTeacher = (id: number) => {
        setData('teacher_ids', data.teacher_ids.includes(id) 
            ? data.teacher_ids.filter(tid => tid !== id) 
            : [...data.teacher_ids, id]
        );
    };

    const selectAllFiltered = () => {
        const ids = filteredStudents.map(s => s.id);
        const newIds = Array.from(new Set([...data.student_ids, ...ids]));
        setData('student_ids', newIds);
    };

    const deselectAllFiltered = () => {
        const ids = filteredStudents.map(s => s.id);
        const newIds = data.student_ids.filter(id => !ids.includes(id));
        setData('student_ids', newIds);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn" onClick={onClose}>
            <div className={`bg-white dark:bg-gray-800 rounded-[35px] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden transform animate-slideUp flex flex-col ${isRTL ? 'rtl' : 'ltr'}`} onClick={e => e.stopPropagation()}>
                
                {/* Modern Header */}
                <div className="relative overflow-hidden bg-gradient-to-r from-brand-navy to-brand-dark p-6 text-white flex-shrink-0">
                    <div className="relative flex items-center justify-between z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center text-2xl shadow-xl border border-white/20">
                                {steps.find(s => s.id === currentStep)?.icon || '🎒'}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight leading-none">{t('Field Trip Requisition')}</h2>
                                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mt-1.5">{t('Educational Excellence Program')}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all border border-white/10">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Stepper Logic */}
                    <div className="relative flex items-center justify-between mt-8 max-w-md mx-auto">
                        {steps.map((step, idx) => (
                            <div key={step.id} className="flex items-center flex-1 last:flex-none">
                                <div className="flex flex-col items-center gap-2 relative z-10">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-500 border-2 ${currentStep === step.id
                                        ? 'bg-brand-yellow text-brand-navy border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                                        : currentStep > step.id
                                            ? 'bg-green-400 text-white border-green-400'
                                            : 'bg-white/10 text-white/40 border-white/10'
                                        }`}>
                                        {currentStep > step.id ? '✓' : step.id}
                                    </div>
                                    <span className={`text-[9px] uppercase tracking-widest font-black transition-colors ${currentStep === step.id ? 'text-white' : 'text-white/40'}`}>{step.name}</span>
                                </div>
                                {idx < steps.length - 1 && (
                                    <div className="flex-1 h-[2px] mx-3 -mt-5">
                                        <div className={`h-full transition-all duration-700 ${currentStep > step.id ? 'bg-green-400' : 'bg-white/10'}`} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar scroll-smooth">
                    {/* Step 1: Details */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-fadeIn">
                            <div>
                                <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2.5 ml-1">{t('Expedition Title')}</label>
                                <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} className="w-full px-6 py-4 border-2 border-gray-100 dark:border-gray-700/50 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-800 dark:text-white focus:ring-4 focus:ring-brand-navy/10 focus:border-brand-navy transition-all font-bold text-base" placeholder={t('Science Museum Tour...')} />
                                {errors.name && <p className="text-red-500 text-[10px] mt-2 font-bold">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2.5 ml-1">{t('Objectives & Description')}</label>
                                <textarea value={data.description} onChange={e => setData('description', e.target.value)} rows={3} className="w-full px-6 py-4 border-2 border-gray-100 dark:border-gray-700/50 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-800 dark:text-white focus:ring-4 focus:ring-brand-navy/10 focus:border-brand-navy transition-all font-medium text-sm" placeholder={t('Detail the trip purpose...')} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2.5 ml-1">{t('Date')}</label>
                                    <input type="date" value={data.date} onChange={e => setData('date', e.target.value)} className="w-full px-6 py-4 border-2 border-gray-100 dark:border-gray-700/50 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 font-bold text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2.5 ml-1">{t('Departure')}</label>
                                    <input type="time" value={data.departure_time} onChange={e => setData('departure_time', e.target.value)} className="w-full px-6 py-4 border-2 border-gray-100 dark:border-gray-700/50 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 font-bold text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2.5 ml-1">{t('Arrival (Est.)')}</label>
                                    <input type="time" value={data.arrival_time} onChange={e => setData('arrival_time', e.target.value)} className="w-full px-6 py-4 border-2 border-gray-100 dark:border-gray-700/50 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 font-bold text-sm text-brand-navy dark:text-brand-yellow" />
                                    {errors.arrival_time && <p className="text-red-500 text-[10px] mt-2 font-bold">{errors.arrival_time}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Location */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-fadeIn">
                            <FieldTripMapPicker
                                lat={data.destination_latitude}
                                lng={data.destination_longitude}
                                isDark={isDark}
                                isRtl={isRTL}
                                onChange={(lat, lng, address) => {
                                    setData(prev => ({ 
                                        ...prev, 
                                        destination_latitude: lat, 
                                        destination_longitude: lng,
                                        destination_address: address || prev.destination_address
                                    }));
                                }}
                            />
                            <div>
                                <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2.5 ml-1">{t('Destination Name')}</label>
                                <input type="text" value={data.destination_address} onChange={e => setData('destination_address', e.target.value)} className="w-full px-6 py-4 border-2 border-gray-100 dark:border-gray-700/50 rounded-2xl font-bold bg-white dark:bg-gray-900" placeholder={t('Search or enter destination...')} />
                                {errors.destination_latitude && <p className="text-red-500 text-[10px] mt-3 text-center font-black">⚠️ {t('Geolocation required on map')}</p>}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Student Selection */}
                    {currentStep === 3 && (
                        <div className="space-y-6 animate-fadeIn h-full flex flex-col">
                            <div className="flex flex-col md:flex-row gap-4 mb-2">
                                <div className="flex-1 relative">
                                    <input 
                                        type="text" 
                                        value={searchTerm} 
                                        onChange={e => setSearchTerm(e.target.value)}
                                        placeholder={t('Search by student name or code...')}
                                        className="w-full pl-12 pr-6 py-4 border-2 border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50/30 dark:bg-gray-900/30 font-bold text-sm focus:ring-brand-navy"
                                    />
                                    <svg className="w-5 h-5 absolute left-4 top-4.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <select 
                                    value={selectedClassroomId} 
                                    onChange={e => setSelectedClassroomId(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                                    className="px-6 py-4 border-2 border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50/30 dark:bg-gray-900/30 font-black text-xs uppercase tracking-widest"
                                >
                                    <option value="all">{t('All Classes')}</option>
                                    {classrooms.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                                </select>
                            </div>

                            <div className="flex justify-between items-center px-2">
                                <div className="flex items-center gap-3">
                                    <span className="px-4 py-1.5 bg-brand-navy text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                                        {data.student_ids.length} {t('Selected')}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        / {filteredStudents.length} {t('Visible')}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={selectAllFiltered} type="button" className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest hover:underline">{t('Select All')}</button>
                                    <span className="text-gray-300">|</span>
                                    <button onClick={deselectAllFiltered} type="button" className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">{t('Clear')}</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto custom-scrollbar p-2">
                                {filteredStudents.map(student => {
                                    const isSelected = data.student_ids.includes(student.id);
                                    return (
                                        <div 
                                            key={student.id} 
                                            onClick={() => toggleStudent(student.id)}
                                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex items-center justify-between group ${
                                                isSelected 
                                                ? 'border-brand-navy bg-brand-navy/5 shadow-md scale-[1.02]' 
                                                : 'border-gray-50 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-colors ${
                                                    isSelected ? 'bg-brand-navy text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                                                }`}>
                                                    {student.first_name_ar.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className={`font-black text-sm ${isSelected ? 'text-brand-navy dark:text-cyan-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                                        {student.first_name_ar} {student.last_name_ar}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{student.student_code}</span>
                                                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                        <span className="text-[8px] font-black text-brand-navy/60 dark:text-cyan-400/60 uppercase tracking-widest">{student.classroomName}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                                isSelected ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200 dark:border-gray-700'
                                            }`}>
                                                {isSelected && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Faculty Mapping */}
                    {currentStep === 4 && (
                        <div className="space-y-6 animate-fadeIn">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Internal Teachers */}
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-brand-navy dark:text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                                        🏛 {t('Internal Faculty')}
                                    </label>
                                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                        {teachers.map(teacher => (
                                            <div 
                                                key={teacher.id} 
                                                onClick={() => toggleTeacher(teacher.id)}
                                                className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                                                    data.teacher_ids.includes(teacher.id) 
                                                    ? 'border-brand-navy bg-brand-navy/5 shadow-sm' 
                                                    : 'border-gray-50 dark:border-gray-800'
                                                }`}
                                            >
                                                <span className="font-bold text-xs text-gray-700 dark:text-gray-200">{teacher.first_name_ar} {teacher.last_name_ar}</span>
                                                {data.teacher_ids.includes(teacher.id) && <span className="text-brand-navy">✓</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* External Members */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[11px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest flex items-center gap-2">
                                            👥 {t('External Escorts')}
                                        </label>
                                        <button type="button" onClick={() => setShowMemberModal(true)} className="text-[9px] font-black text-purple-600 underline uppercase tracking-widest">+ {t('Add')}</button>
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                        {data.external_members.map((member, idx) => (
                                            <div key={idx} className="p-3 bg-purple-50/50 dark:bg-purple-900/10 border-2 border-purple-100/50 dark:border-purple-800/30 rounded-xl relative group">
                                                <button 
                                                    onClick={() => setData('external_members', data.external_members.filter((_, i) => i !== idx))}
                                                    className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                                <p className="font-bold text-xs text-purple-900 dark:text-purple-300">{member.name}</p>
                                                <p className="text-[9px] text-purple-400 font-bold mt-1">{member.phone}</p>
                                            </div>
                                        ))}
                                        {data.external_members.length === 0 && (
                                            <div className="h-32 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl flex flex-col items-center justify-center text-gray-300">
                                                <span className="text-2xl mb-2">👤</span>
                                                <p className="text-[9px] font-black uppercase tracking-widest">{t('No externals added')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                             </div>

                             {/* Final Summary Card */}
                             <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-[2.5rem] border-2 border-gray-100 dark:border-gray-800 shadow-inner">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                    <div className="p-4 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('Students')}</p>
                                        <p className="text-xl font-black text-brand-navy dark:text-brand-yellow">{data.student_ids.length}</p>
                                    </div>
                                    <div className="p-4 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('Teachers')}</p>
                                        <p className="text-xl font-black text-cyan-500">{data.teacher_ids.length}</p>
                                    </div>
                                    <div className="p-4 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('Externals')}</p>
                                        <p className="text-xl font-black text-purple-500">{data.external_members.length}</p>
                                    </div>
                                    <div className="p-4 bg-brand-navy/90 text-white rounded-3xl shadow-xl shadow-brand-navy/20">
                                        <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1">{t('Departure')}</p>
                                        <p className="text-xl font-black">{data.departure_time}</p>
                                    </div>
                                </div>
                             </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t-2 border-gray-50 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center z-20">
                    <button onClick={onClose} className="px-8 py-3.5 text-gray-400 hover:text-red-500 font-black uppercase tracking-widest text-[10px] transition-colors">{t('Dismiss')}</button>
                    
                    <div className="flex gap-4">
                        {currentStep > 1 && (
                            <button onClick={prevStep} className="px-8 py-3.5 border-2 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-all font-black uppercase tracking-widest text-[10px]">
                                {t('Previous')}
                            </button>
                        )}
                        
                        {currentStep < 4 ? (
                            <button 
                                onClick={nextStep} 
                                disabled={
                                    (currentStep === 1 && (!data.name || !data.date)) ||
                                    (currentStep === 2 && (!data.destination_address || !data.destination_latitude)) ||
                                    (currentStep === 3 && data.student_ids.length === 0)
                                }
                                className="px-12 py-3.5 bg-brand-navy text-white font-black rounded-2xl hover:bg-brand-dark shadow-2xl shadow-brand-navy/30 transition-all uppercase tracking-widest text-[10px] disabled:opacity-30 disabled:grayscale"
                            >
                                {t('Advance Step')}
                            </button>
                        ) : (
                            <button 
                                onClick={handleSubmit} 
                                disabled={processing}
                                className="px-14 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black rounded-2xl hover:shadow-2xl shadow-emerald-500/30 transition-all uppercase tracking-widest text-[10px] disabled:opacity-50"
                            >
                                {processing ? t('Processing...') : t('Finalize & Submit')}
                            </button>
                        )}
                    </div>
                </div>

                {/* External Member Sub-Modal */}
                {showMemberModal && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/70 backdrop-blur-xl animate-fadeIn" onClick={() => setShowMemberModal(false)}>
                        <div className={`bg-white dark:bg-gray-900 rounded-[35px] shadow-2xl max-w-sm w-full p-8 transform animate-slideUp ${isRtl ? 'rtl' : 'ltr'}`} onClick={e => e.stopPropagation()}>
                            <h3 className="text-xl font-black text-gray-800 dark:text-white mb-6 flex items-center gap-3">
                                <span className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-lg">➕</span>
                                {t('External Escort')}
                            </h3>
                            <div className="space-y-5 mb-8">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">{t('Legal Name')}</label>
                                    <input type="text" value={memberForm.name} onChange={e => setMemberForm({...memberForm, name: e.target.value})} className="w-full px-5 py-4 border-2 border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50/50 font-bold text-sm" placeholder="Full name..." />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">{t('Contact #')}</label>
                                    <input type="text" value={memberForm.phone || ''} onChange={e => setMemberForm({...memberForm, phone: e.target.value})} className="w-full px-5 py-4 border-2 border-gray-100 dark:border-gray-800 rounded-2xl font-bold text-sm" placeholder="05XXXXXXXX" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">{t('ID / Passport')}</label>
                                    <input type="text" value={memberForm.national_id || ''} onChange={e => setMemberForm({...memberForm, national_id: e.target.value})} className="w-full px-5 py-4 border-2 border-gray-100 dark:border-gray-800 rounded-2xl font-bold text-sm" placeholder="ID number..." />
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    if(memberForm.name && memberForm.phone) {
                                        setData('external_members', [...data.external_members, memberForm]);
                                        setShowMemberModal(false);
                                        setMemberForm({name: ''});
                                    }
                                }}
                                className="w-full py-4 bg-purple-600 text-white font-black rounded-2xl hover:bg-purple-700 shadow-xl shadow-purple-500/20 transition-all uppercase tracking-widest text-[10px]"
                            >
                                {t('Register Member')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
