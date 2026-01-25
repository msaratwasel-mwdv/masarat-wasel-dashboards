import { FormEventHandler, useState, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import SchoolAuthenticatedLayout from '@/Layouts/SchoolAuthenticatedLayout';
import useTranslation from '@/hooks/useTranslation';

interface Template {
    id: number;
    name_ar: string;
    name_en: string;
    title_ar: string;
    title_en: string;
    body_ar: string;
    body_en: string;
    template_type: string;
}

interface Classroom {
    id: number;
    name: string;
}

interface Bus {
    id: number;
    bus_number: string;
}

interface Guardian {
    id: number;
    name: string;
    user: { name: string };
}

interface Props {
    auth: any;
    templates: Template[];
    classrooms: Classroom[];
    buses: Bus[];
    guardians: Guardian[];
}

export default function Create({ auth, templates, classrooms, buses, guardians }: Props) {
    const { t } = useTranslation();
    const [previewData, setPreviewData] = useState<any>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        message: '',
        template_id: '',
        recipient_type: 'all_parents',
        recipient_filter: {} as any,
        type: 'bus',
    });

    // Load template when selected
    useEffect(() => {
        if (data.template_id) {
            const template = templates.find(t => t.id === parseInt(data.template_id));
            if (template) {
                setData({
                    ...data,
                    title: template.title_ar, // You can detect language
                    message: template.body_ar,
                    type: template.template_type,
                });
            }
        }
    }, [data.template_id]);

    // Update filter based on recipient type
    const handleRecipientTypeChange = (type: string) => {
        setData({
            ...data,
            recipient_type: type,
            recipient_filter: {},
        });
    };

    const handlePreview = () => {
        router.post(route('school.notifications.preview'), data, {
            preserveState: true,
            onSuccess: (page: any) => {
                setPreviewData(page.props.preview);
            },
        });
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('school.notifications.store'), {
            onSuccess: () => reset(),
        });
    };

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="text-3xl font-extrabold text-[#0e7490] dark:text-cyan-400">
                    {t('Send New Notification')} 📨
                </h2>
            }
        >
            <Head title={t('Send Notification')} />

            <div className="max-w-2xl mx-auto space-y-6">
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-[30px] shadow-sm border border-gray-100 dark:border-gray-700 p-8 space-y-6">
                    {/* Template Selector */}
                    <div className="bg-cyan-50 dark:bg-cyan-900/20 p-6 rounded-[25px] border border-cyan-200 dark:border-cyan-800">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2">
                            📋 {t('Use Template')} ({t('Optional')})
                        </label>
                        <select
                            value={data.template_id}
                            onChange={e => setData('template_id', e.target.value)}
                            className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent font-medium"
                        >
                            <option value="">{t('Select a template or create custom')}</option>
                            {templates.map(template => (
                                <option key={template.id} value={template.id}>
                                    {template.name_ar} - {template.name_en}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2">
                            📝 {t('Title')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={e => setData('title', e.target.value)}
                            className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent font-medium"
                            placeholder={t('Enter notification title')}
                            required
                        />
                        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                    </div>

                    {/* Message */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2">
                            💬 {t('Message')} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={data.message}
                            onChange={e => setData('message', e.target.value)}
                            rows={5}
                            className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[25px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent font-medium"
                            placeholder={t('Enter notification message')}
                            required
                        />
                        {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2">
                            🏷️ {t('Type')} <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {['bus', 'general', 'emergency', 'announcement'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setData('type', type)}
                                    className={`px-4 py-3 rounded-[25px] font-bold transition-all ${
                                        data.type === type
                                            ? 'bg-[#0e7490] text-white shadow-md'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {t(type.charAt(0).toUpperCase() + type.slice(1))}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Recipient Type */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-[30px] border border-gray-100 dark:border-gray-700">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 ml-2">
                            👥 {t('Recipients')} <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-3">
                            <label className={`flex items-center gap-4 p-4 border rounded-[20px] cursor-pointer transition-all ${
                                data.recipient_type === 'all_parents' 
                                    ? 'border-[#0e7490] bg-cyan-50 dark:bg-cyan-900/10 ring-1 ring-[#0e7490]' 
                                    : 'border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-600'
                            }`}>
                                <input
                                    type="radio"
                                    name="recipient_type"
                                    value="all_parents"
                                    checked={data.recipient_type === 'all_parents'}
                                    onChange={e => handleRecipientTypeChange(e.target.value)}
                                    className="w-5 h-5 text-[#0e7490] focus:ring-[#0e7490]"
                                />
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-white">🌍 {t('All Parents')}</p>
                                    <p className="text-sm text-gray-500">{t('Send to all guardians in the school')}</p>
                                </div>
                            </label>

                            <label className={`flex items-center gap-4 p-4 border rounded-[20px] cursor-pointer transition-all ${
                                data.recipient_type === 'by_classroom' 
                                    ? 'border-[#0e7490] bg-cyan-50 dark:bg-cyan-900/10 ring-1 ring-[#0e7490]' 
                                    : 'border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-600'
                            }`}>
                                <input
                                    type="radio"
                                    name="recipient_type"
                                    value="by_classroom"
                                    checked={data.recipient_type === 'by_classroom'}
                                    onChange={e => handleRecipientTypeChange(e.target.value)}
                                    className="w-5 h-5 text-[#0e7490] focus:ring-[#0e7490]"
                                />
                                <div className="flex-1">
                                    <p className="font-bold text-gray-800 dark:text-white">🏫 {t('By Classroom')}</p>
                                    <p className="text-sm text-gray-500">{t('Send to parents of specific classrooms')}</p>
                                </div>
                            </label>

                            {data.recipient_type === 'by_classroom' && (
                                <div className="ml-9 mt-2 p-4 bg-white dark:bg-gray-800 rounded-[20px] border border-gray-200 dark:border-gray-600">
                                    <select
                                        multiple
                                        value={data.recipient_filter.classroom_ids || []}
                                        onChange={e => {
                                            const selected = Array.from(e.target.selectedOptions, option => option.value);
                                            setData('recipient_filter', { classroom_ids: selected });
                                        }}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-[15px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent font-medium"
                                        size={5}
                                    >
                                        {classrooms.map(classroom => (
                                            <option key={classroom.id} value={classroom.id}>
                                                {classroom.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-2 font-medium">💡 {t('Hold Ctrl/Cmd to select multiple')}</p>
                                </div>
                            )}

                            <label className={`flex items-center gap-4 p-4 border rounded-[20px] cursor-pointer transition-all ${
                                data.recipient_type === 'by_bus' 
                                    ? 'border-[#0e7490] bg-cyan-50 dark:bg-cyan-900/10 ring-1 ring-[#0e7490]' 
                                    : 'border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-600'
                            }`}>
                                <input
                                    type="radio"
                                    name="recipient_type"
                                    value="by_bus"
                                    checked={data.recipient_type === 'by_bus'}
                                    onChange={e => handleRecipientTypeChange(e.target.value)}
                                    className="w-5 h-5 text-[#0e7490] focus:ring-[#0e7490]"
                                />
                                <div className="flex-1">
                                    <p className="font-bold text-gray-800 dark:text-white">🚌 {t('By Bus')}</p>
                                    <p className="text-sm text-gray-500">{t('Send to parents of students on specific buses')}</p>
                                </div>
                            </label>

                            {data.recipient_type === 'by_bus' && (
                                <div className="ml-9 mt-2 p-4 bg-white dark:bg-gray-800 rounded-[20px] border border-gray-200 dark:border-gray-600">
                                    <select
                                        multiple
                                        value={data.recipient_filter.bus_ids || []}
                                        onChange={e => {
                                            const selected = Array.from(e.target.selectedOptions, option => option.value);
                                            setData('recipient_filter', { bus_ids: selected });
                                        }}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-[15px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent font-medium"
                                        size={5}
                                    >
                                        {buses.map(bus => (
                                            <option key={bus.id} value={bus.id}>
                                                {bus.bus_number}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-2 font-medium">💡 {t('Hold Ctrl/Cmd to select multiple')}</p>
                                </div>
                            )}

                            <label className={`flex items-center gap-4 p-4 border rounded-[20px] cursor-pointer transition-all ${
                                data.recipient_type === 'specific_parent' 
                                    ? 'border-[#0e7490] bg-cyan-50 dark:bg-cyan-900/10 ring-1 ring-[#0e7490]' 
                                    : 'border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-600'
                            }`}>
                                <input
                                    type="radio"
                                    name="recipient_type"
                                    value="specific_parent"
                                    checked={data.recipient_type === 'specific_parent'}
                                    onChange={e => handleRecipientTypeChange(e.target.value)}
                                    className="w-5 h-5 text-[#0e7490] focus:ring-[#0e7490]"
                                />
                                <div className="flex-1">
                                    <p className="font-bold text-gray-800 dark:text-white">👤 {t('Specific Parent')}</p>
                                    <p className="text-sm text-gray-500">{t('Send to a single guardian')}</p>
                                </div>
                            </label>

                            {data.recipient_type === 'specific_parent' && (
                                <div className="ml-9 mt-2">
                                    <select
                                        value={data.recipient_filter.guardian_id || ''}
                                        onChange={e => setData('recipient_filter', { guardian_id: e.target.value })}
                                        className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent font-medium"
                                    >
                                        <option value="">{t('Select a guardian')}</option>
                                        {guardians.map(guardian => (
                                            <option key={guardian.id} value={guardian.id}>
                                                {guardian.name} ({guardian.user?.name || 'No user'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Preview Section */}
                    {previewData && (
                        <div className="bg-cyan-50 dark:bg-cyan-900/20 p-6 rounded-[25px] border border-cyan-200 dark:border-cyan-800">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">👀 {t('Preview')}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {t('Total Recipients')}: <span className="font-bold text-[#0e7490]">{previewData.total_recipients}</span>
                            </p>
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-[20px] shadow-sm">
                                <p className="font-bold text-gray-800 dark:text-white">{previewData.title}</p>
                                <p className="text-gray-600 dark:text-gray-400 mt-2">{previewData.message}</p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={handlePreview}
                            className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-[35px] hover:bg-gray-200 hover:text-gray-900 transition-all border border-gray-200"
                        >
                            👀 {t('Preview')}
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 px-6 py-4 bg-[#0e7490] text-white font-bold rounded-[35px] hover:bg-[#155e75] shadow-lg hover:shadow-xl transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
                        >
                            {processing ? '⏳ ' + t('Sending...') : '📨 ' + t('Send Notification')}
                        </button>
                    </div>
                </form>
            </div>
        </SchoolAuthenticatedLayout>
    );
}
