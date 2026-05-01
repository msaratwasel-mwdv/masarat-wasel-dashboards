import { useState, FormEventHandler, useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import useTranslation from '@/hooks/useTranslation';
import FieldTripMapPicker from '@/Components/FieldTripMapPicker';
import { useTheme } from '@/Contexts/ThemeContext';
import { DS_inputCls, DS_labelCls, DS_cancelBtn, DS_submitBtn, DS_btnPrimary, DS_btnSecondary } from '@/lib/DS';

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
    const { theme, isRTL } = useTheme();
    const { t } = useTranslation();
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
        destination_latitude: 23.5859 as number | null, // Default: Muscat, Oman
        destination_longitude: 58.4059 as number | null, // Default: Muscat, Oman
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0f2044]/80 backdrop-blur-sm" onClick={onClose}>
            <div className={`bg-white dark:bg-[#1a2845] rounded-[24px] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-100 dark:border-[#243460] ${isRTL ? 'rtl' : 'ltr'}`} onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="px-6 py-5 bg-[#0f2044] flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-6 bg-[#f5b800] rounded-full" />
                        <div className="w-10 h-10 bg-white/10 rounded-[14px] flex items-center justify-center text-xl border border-white/10">
                            {steps.find(s => s.id === currentStep)?.icon || '🎒'}
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white">{t('Field Trip Requisition')}</h2>
                            <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mt-0.5">{t('Educational Program')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-[10px] bg-white/10 text-white hover:bg-white/20 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Stepper */}
                <div className="px-6 py-4 bg-[#0f2044]/5 dark:bg-[#0f2044]/20 border-b border-gray-100 dark:border-[#243460] flex items-center justify-center gap-2">
                    {steps.map((step, idx) => (
                        <div key={step.id} className="flex items-center">
                            <div className="flex flex-col items-center gap-1">
                                <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center font-bold text-xs transition-all ${
                                    currentStep === step.id ? 'bg-[#0f2044] text-[#f5b800] shadow' :
                                    currentStep > step.id ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-[#0f2044]/30 text-gray-400'
                                }`}>{currentStep > step.id ? '✓' : step.id}</div>
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${ currentStep === step.id ? 'text-[#0f2044] dark:text-[#f5b800]' : 'text-gray-400'}`}>{step.name}</span>
                            </div>
                            {idx < steps.length - 1 && <div className={`w-12 h-0.5 mx-2 mb-4 ${ currentStep > step.id ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-[#243460]'}`} />}
                        </div>
                    ))}
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {/* Step 1: Details */}
                    {currentStep === 1 && (
                        <div className="space-y-5">
                            <div>
                                <label className={DS_labelCls}>{t('Trip Title')}</label>
                                <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} className={DS_inputCls} placeholder={t('Science Museum Tour...')} />
                                {errors.name && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.name}</p>}
                            </div>
                            <div>
                                <label className={DS_labelCls}>{t('Description & Objectives')}</label>
                                <textarea value={data.description} onChange={e => setData('description', e.target.value)} rows={3} className={DS_inputCls} placeholder={t('Detail the trip purpose...')} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className={DS_labelCls}>{t('Date')}</label>
                                    <input type="date" value={data.date} onChange={e => setData('date', e.target.value)} className={DS_inputCls} />
                                </div>
                                <div>
                                    <label className={DS_labelCls}>{t('Departure')}</label>
                                    <input type="time" value={data.departure_time} onChange={e => setData('departure_time', e.target.value)} className={DS_inputCls} />
                                </div>
                                <div>
                                    <label className={DS_labelCls}>{t('Arrival (Est.)')}</label>
                                    <input type="time" value={data.arrival_time} onChange={e => setData('arrival_time', e.target.value)} className={DS_inputCls} />
                                    {errors.arrival_time && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.arrival_time}</p>}
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
                                <label className={DS_labelCls}>{t('Destination Name')}</label>
                                <input type="text" value={data.destination_address} onChange={e => setData('destination_address', e.target.value)} className={DS_inputCls} placeholder={t('Search or enter destination...')} />
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
                                        className={`${DS_inputCls} ${isRTL ? 'pr-10' : 'pl-10'}`}
                                    />
                                    <svg className={`w-4 h-4 absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <select 
                                    value={selectedClassroomId} 
                                    onChange={e => setSelectedClassroomId(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                                    className={DS_inputCls}
                                >
                                    <option value="all">{t('All Classes')}</option>
                                    {classrooms.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                                </select>
                            </div>

                            <div className="flex justify-between items-center px-2">
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-[#0f2044] text-[#f5b800] rounded-[10px] text-[10px] font-black shadow">
                                        {data.student_ids.length} {t('Selected')}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400">
                                        / {filteredStudents.length} {t('Visible')}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={selectAllFiltered} type="button" className="text-[10px] font-black text-[#0f2044] dark:text-[#7ba7e8] hover:underline">{t('Select All')}</button>
                                    <span className="text-gray-300">|</span>
                                    <button onClick={deselectAllFiltered} type="button" className="text-[10px] font-black text-red-500 hover:underline">{t('Clear')}</button>
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
                                    <label className="text-[11px] font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-widest flex items-center gap-2">
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
                             <div className="p-5 bg-[#0f2044]/5 dark:bg-[#0f2044]/20 rounded-[20px] border border-[#0f2044]/10 dark:border-[#243460]">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                                    <div className="p-4 bg-white dark:bg-[#1a2845] rounded-[16px] shadow-sm border border-gray-100 dark:border-[#243460]">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('Students')}</p>
                                        <p className="text-xl font-black text-[#0f2044] dark:text-white">{data.student_ids.length}</p>
                                    </div>
                                    <div className="p-4 bg-white dark:bg-[#1a2845] rounded-[16px] shadow-sm border border-gray-100 dark:border-[#243460]">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('Teachers')}</p>
                                        <p className="text-xl font-black text-[#0f2044] dark:text-white">{data.teacher_ids.length}</p>
                                    </div>
                                    <div className="p-4 bg-white dark:bg-[#1a2845] rounded-[16px] shadow-sm border border-gray-100 dark:border-[#243460]">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('Externals')}</p>
                                        <p className="text-xl font-black text-purple-600 dark:text-purple-400">{data.external_members.length}</p>
                                    </div>
                                    <div className="p-4 bg-[#0f2044] text-white rounded-[16px] shadow">
                                        <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mb-1">{t('Departure')}</p>
                                        <p className="text-xl font-black text-[#f5b800]">{data.departure_time}</p>
                                    </div>
                                </div>
                             </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-[#243460] bg-gray-50/50 dark:bg-[#0f2044]/10 flex justify-between items-center">
                    <button onClick={onClose} className={DS_cancelBtn}>{t('Cancel')}</button>
                    <div className="flex gap-3">
                        {currentStep > 1 && (
                            <button onClick={prevStep} className={DS_btnSecondary}>{t('Previous')}</button>
                        )}
                        {currentStep < 4 ? (
                            <button
                                onClick={nextStep}
                                disabled={
                                    (currentStep === 1 && (!data.name || !data.date)) ||
                                    (currentStep === 2 && (!data.destination_address)) ||
                                    (currentStep === 3 && data.student_ids.length === 0)
                                }
                                className={DS_btnPrimary + " disabled:opacity-30 disabled:cursor-not-allowed"}
                            >
                                {t('Next Step')}
                            </button>
                        ) : (
                            <button onClick={handleSubmit} disabled={processing} className={DS_submitBtn(processing)}>
                                {processing ? t('Sending...') : t('Submit Request')}
                            </button>
                        )}
                    </div>
                </div>

                {/* External Member Sub-Modal */}
                {showMemberModal && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/70 backdrop-blur-xl animate-fadeIn" onClick={() => setShowMemberModal(false)}>
                        <div className={`bg-white dark:bg-[#1a2845] rounded-[24px] shadow-2xl max-w-sm w-full p-6 border border-gray-100 dark:border-[#243460] ${isRTL ? 'rtl' : 'ltr'}`} onClick={e => e.stopPropagation()}>
                            <h3 className="text-base font-bold text-[#0f2044] dark:text-white mb-5 flex items-center gap-3">
                                <span className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-[12px] text-lg">➕</span>
                                {t('External Escort')}
                            </h3>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className={DS_labelCls}>{t('Legal Name')}</label>
                                    <input type="text" value={memberForm.name} onChange={e => setMemberForm({...memberForm, name: e.target.value})} className={DS_inputCls} placeholder={t('Full name...')} />
                                </div>
                                <div>
                                    <label className={DS_labelCls}>{t('Contact #')}</label>
                                    <input type="text" value={memberForm.phone || ''} onChange={e => setMemberForm({...memberForm, phone: e.target.value})} className={DS_inputCls} placeholder="05XXXXXXXX" />
                                </div>
                                <div>
                                    <label className={DS_labelCls}>{t('ID / Passport')}</label>
                                    <input type="text" value={memberForm.national_id || ''} onChange={e => setMemberForm({...memberForm, national_id: e.target.value})} className={DS_inputCls} placeholder={t('ID number...')} />
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
                                className="w-full py-3 bg-purple-600 text-white font-bold rounded-[14px] hover:bg-purple-700 shadow transition-all text-sm"
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
