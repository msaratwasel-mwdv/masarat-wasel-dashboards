import { useForm } from "@inertiajs/react";
import { FormEventHandler, useState, useEffect } from "react";
import useTranslation from "@/hooks/useTranslation";
import Modal from "@/Components/Modal";
import InputError from "@/Components/InputError";
import { Megaphone, X, FileText, Bus, AlertTriangle, Send } from "lucide-react";
import {
    DS_modalHeader,
    DS_searchInput,
    DS_cancelBtn,
    DS_submitBtn,
} from "@/lib/DS";

interface NotificationTemplate {
    id: number;
    name_en: string;
    name_ar: string;
    title_en: string;
    title_ar: string;
    body_en: string;
    body_ar: string;
    type: string;
}

interface Classroom {
    id: number;
    name: string;
}

interface BusData {
    id: number;
    bus_number: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    templates: NotificationTemplate[];
    classrooms: Classroom[];
    buses: BusData[];
    parents: User[];
    initialData?: {
        type?: string;
        title_en?: string;
        title_ar?: string;
        body_en?: string;
        body_ar?: string;
        recipient_type?: string;
        recipient_filter?: any;
    };
}

export default function NotificationModal({
    isOpen,
    onClose,
    templates,
    classrooms,
    buses,
    parents,
    initialData,
}: Props) {
    const { t, lang } = useTranslation();
    const isRtl = lang === "ar";
    const [showPreview, setShowPreview] = useState(false);

    const { data, setData, post, processing, errors, reset, transform } =
        useForm({
            template_id: "",
            type: initialData?.type || "school_announcement",
            title_en: initialData?.title_en || "",
            title_ar: initialData?.title_ar || "",
            body_en: initialData?.body_en || "",
            body_ar: initialData?.body_ar || "",
            recipient_type: initialData?.recipient_type || "all_parents",
            recipient_filter: initialData?.recipient_filter || {},
        });

    transform((data) => {
        const transformed: Record<string, any> = {
            title: data.title_ar,
            title_en: data.title_en,
            message: data.body_ar,
            message_en: data.body_en,
            type: data.type,
            recipient_type: data.recipient_type,
            recipient_filter: { ...data.recipient_filter },
            template_id: data.template_id || null,
        };

        if (
            data.recipient_type === "specific_parent" &&
            (data.recipient_filter as any).parent_id
        ) {
            transformed.recipient_filter = {
                guardian_id: (data.recipient_filter as any).parent_id,
            };
        }
        if (
            data.recipient_type === "by_classroom" &&
            (data.recipient_filter as any).classroom_id
        ) {
            transformed.recipient_filter = {
                classroom_ids: [(data.recipient_filter as any).classroom_id],
            };
        }
        if (
            data.recipient_type === "by_bus" &&
            (data.recipient_filter as any).bus_id
        ) {
            transformed.recipient_filter = {
                bus_ids: [(data.recipient_filter as any).bus_id],
            };
        }

        return transformed;
    });

    useEffect(() => {
        if (!isOpen) {
            reset();
            setShowPreview(false);
        } else if (initialData) {
            setData({
                template_id: "",
                type: initialData.type || "school_announcement",
                title_en: initialData.title_en || "",
                title_ar: initialData.title_ar || "",
                body_en: initialData.body_en || "",
                body_ar: initialData.body_ar || "",
                recipient_type: initialData.recipient_type || "all_parents",
                recipient_filter: initialData.recipient_filter || {},
            });
        }
    }, [isOpen]);

    const handleTemplateChange = (templateId: string) => {
        setData("template_id", templateId);
        const template = templates.find((t) => t.id === parseInt(templateId));
        if (template) {
            setData({
                ...data,
                template_id: templateId,
                type: template.type,
                title_en: template.title_en,
                title_ar: template.title_ar,
                body_en: template.body_en,
                body_ar: template.body_ar,
            });
        }
    };

    const handleRecipientTypeChange = (type: string) => {
        setData("recipient_type", type);
        setData("recipient_filter", {});
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("school.notifications.store"), {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                reset();
            },
        });
    };

    const types = [
        { id: "school_announcement", label: isRtl ? "إعلان مدرسي" : "School Announcement", icon: <Megaphone className="w-4 h-4" /> },
        { id: "bus_notification", label: isRtl ? "إشعار حافلة" : "Bus Notification", icon: <Bus className="w-4 h-4" /> },
        { id: "emergency", label: isRtl ? "إشعار طوارئ" : "Emergency", icon: <AlertTriangle className="w-4 h-4" /> },
        { id: "general", label: isRtl ? "عام" : "General", icon: <FileText className="w-4 h-4" /> },
    ];

    const recipientOptions = [
        { id: "all_parents", label: isRtl ? "جميع أولياء الأمور" : "All Parents" },
        { id: "by_classroom", label: isRtl ? "حسب الفصل" : "By Classroom" },
        { id: "by_bus", label: isRtl ? "حسب الحافلة" : "By Bus" },
        { id: "specific_parent", label: isRtl ? "ولي أمر محدد" : "Specific Parent" },
    ];

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="2xl">
            <div className={DS_modalHeader(isRtl)}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-[12px] flex items-center justify-center">
                        <Send className="w-5 h-5 text-white" />
                    </div>
                    <div className={isRtl ? "text-right" : "text-left"}>
                        <h3 className="text-xl font-bold text-white">
                            {isRtl ? "إرسال إشعار جديد" : "Send New Notification"}
                        </h3>
                        <p className="text-[#7ba7e8] text-sm font-semibold mt-0.5">
                            {isRtl ? "تأليف وإرسال إشعار للمستلمين" : "Compose and send a notification to recipients"}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={submit} className="p-6 max-h-[75vh] overflow-y-auto">
                <div className="space-y-6">
                    {/* Template Selection */}
                    <div className="bg-[#0f2044]/5 dark:bg-[#0f2044]/20 p-5 rounded-[20px] border border-[#0f2044]/10 dark:border-[#243460]">
                        <label className="block text-sm font-bold text-[#0f2044] dark:text-gray-300 mb-2">
                            {isRtl ? "استخدام قالب جاهز (اختياري)" : "Quick Template (Optional)"}
                        </label>
                        <select
                            value={data.template_id}
                            onChange={(e) => handleTemplateChange(e.target.value)}
                            className={DS_searchInput}
                        >
                            <option value="">{isRtl ? "— اختر قالباً —" : "— Select a template —"}</option>
                            {templates.map((template) => (
                                <option key={template.id} value={template.id}>
                                    {isRtl ? template.name_ar : template.name_en}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Notification Type */}
                    <div>
                        <label className="block text-sm font-bold text-[#0f2044] dark:text-gray-300 mb-2">
                            {isRtl ? "نوع الإشعار" : "Notification Type"}
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {types.map((type) => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setData("type", type.id)}
                                    className={`px-3 py-2.5 flex items-center justify-center gap-2 rounded-[14px] font-bold text-xs transition-all border ${
                                        data.type === type.id
                                            ? "bg-[#0f2044] text-[#f5b800] border-[#0f2044] shadow-md"
                                            : "bg-[#0f2044]/5 text-gray-600 dark:text-gray-400 border-transparent hover:bg-[#0f2044]/10"
                                    }`}
                                >
                                    {type.icon}
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Recipients */}
                    <div>
                        <label className="block text-sm font-bold text-[#0f2044] dark:text-gray-300 mb-2">
                            {isRtl ? "المستهدفون (المستلمون)" : "Recipients"}
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                            {recipientOptions.map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => handleRecipientTypeChange(opt.id)}
                                    className={`px-3 py-2.5 rounded-[14px] font-bold text-xs transition-all border ${
                                        data.recipient_type === opt.id
                                            ? "bg-[#f5b800] text-[#0f2044] border-[#f5b800] shadow-md"
                                            : "bg-[#0f2044]/5 text-gray-600 dark:text-gray-400 border-transparent hover:bg-[#0f2044]/10"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* Conditional Filters */}
                        {data.recipient_type === "by_classroom" && (
                            <select
                                onChange={(e) => setData("recipient_filter", { classroom_id: e.target.value })}
                                className={DS_searchInput}
                            >
                                <option value="">{isRtl ? "— اختر الفصل —" : "— Select Classroom —"}</option>
                                {classrooms.map((classroom) => (
                                    <option key={classroom.id} value={classroom.id}>{classroom.name}</option>
                                ))}
                            </select>
                        )}

                        {data.recipient_type === "by_bus" && (
                            <select
                                onChange={(e) => setData("recipient_filter", { bus_id: e.target.value })}
                                className={DS_searchInput}
                            >
                                <option value="">{isRtl ? "— اختر الحافلة —" : "— Select Bus —"}</option>
                                {buses.map((bus) => (
                                    <option key={bus.id} value={bus.id}>{bus.bus_number}</option>
                                ))}
                            </select>
                        )}

                        {data.recipient_type === "specific_parent" && (
                            <select
                                onChange={(e) => setData("recipient_filter", { parent_id: e.target.value })}
                                className={DS_searchInput}
                            >
                                <option value="">{isRtl ? "— اختر ولي الأمر —" : "— Select Parent —"}</option>
                                {parents.map((parent) => (
                                    <option key={parent.id} value={parent.id}>{parent.name} ({parent.email})</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Title */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-[#0f2044] dark:text-gray-300 mb-2">
                                {isRtl ? "عنوان الإشعار (بالعربية)" : "Title (Arabic)"} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.title_ar}
                                onChange={(e) => setData("title_ar", e.target.value)}
                                className={DS_searchInput}
                                required
                                dir="rtl"
                            />
                            <InputError message={errors.title_ar} className="mt-1" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[#0f2044] dark:text-gray-300 mb-2">
                                {isRtl ? "عنوان الإشعار (بالإنجليزية)" : "Title (English)"} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.title_en}
                                onChange={(e) => setData("title_en", e.target.value)}
                                className={DS_searchInput}
                                required
                                dir="ltr"
                            />
                            <InputError message={errors.title_en} className="mt-1" />
                        </div>
                    </div>

                    {/* Message Body */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-[#0f2044] dark:text-gray-300 mb-2">
                                {isRtl ? "محتوى الإشعار (بالعربية)" : "Message (Arabic)"} <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={data.body_ar}
                                onChange={(e) => setData("body_ar", e.target.value)}
                                rows={4}
                                className={DS_searchInput}
                                required
                                dir="rtl"
                            />
                            <InputError message={errors.body_ar} className="mt-1" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[#0f2044] dark:text-gray-300 mb-2">
                                {isRtl ? "محتوى الإشعار (بالإنجليزية)" : "Message (English)"} <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={data.body_en}
                                onChange={(e) => setData("body_en", e.target.value)}
                                rows={4}
                                className={DS_searchInput}
                                required
                                dir="ltr"
                            />
                            <InputError message={errors.body_en} className="mt-1" />
                        </div>
                    </div>

                </div>

                {/* Footer Buttons */}
                <div className={`flex gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-gray-700 ${isRtl ? 'justify-start' : 'justify-end'}`}>
                    <button type="button" onClick={onClose} className={DS_cancelBtn}>
                        {isRtl ? "إلغاء" : "Cancel"}
                    </button>
                    <button type="submit" disabled={processing} className={DS_submitBtn(processing) + " flex items-center gap-2"}>
                        <Send className="w-4 h-4" />
                        {processing ? (isRtl ? "جاري الإرسال..." : "Sending...") : (isRtl ? "إرسال الإشعار" : "Send Notification")}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
