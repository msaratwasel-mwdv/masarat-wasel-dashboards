import { useForm } from "@inertiajs/react";
import { FormEventHandler, useState, useEffect } from "react";
import useTranslation from "@/hooks/useTranslation";

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

interface Bus {
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
    buses: Bus[];
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

    // تحويل البيانات قبل الإرسال لتطابق ما يتوقعه الـ Backend
    transform((data) => {
        const transformed: Record<string, any> = {
            title: data.title_ar || data.title_en,
            message: data.body_ar || data.body_en,
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

        // إرسال البيانات المحولة باستخدام useForm helper `post` مع `transform`
        post(route("school.notifications.store"), {
            onBefore: () => {
                // Not strictly needed if we don't need to prevent default behavior here,
                // but good for tracking.
            },
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                reset();
            },
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-[30px] shadow-xl transform transition-all">
                    {/* Header */}
                    <div className="bg-[#0e7490] p-6 rounded-t-[30px]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 rounded-[15px] flex items-center justify-center text-2xl">
                                    📢
                                </div>
                                <div>
                                    <h2 className="text-2xl font-extrabold text-white">
                                        {t("Send Notification")}
                                    </h2>
                                    <p className="text-sm text-white/90">
                                        {t(
                                            "Compose and send notifications to parents",
                                        )}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-[15px] text-white transition-all flex items-center justify-center"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <form
                        onSubmit={submit}
                        className="p-8 max-h-[70vh] overflow-y-auto hide-scrollbar"
                    >
                        <div className="space-y-6">
                            {/* Template Selection */}
                            <div className="bg-cyan-50 dark:bg-cyan-900/20 p-6 rounded-[25px] border border-cyan-200 dark:border-cyan-800">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2">
                                    ⚡ {t("Quick Template")}
                                </label>
                                <select
                                    value={data.template_id}
                                    onChange={(e) =>
                                        handleTemplateChange(e.target.value)
                                    }
                                    className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent font-medium"
                                >
                                    <option value="">
                                        {t("Select a template (optional)")}
                                    </option>
                                    {templates.map((template) => (
                                        <option
                                            key={template.id}
                                            value={template.id}
                                        >
                                            {lang === "ar"
                                                ? template.name_ar
                                                : template.name_en}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Notification Type */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2">
                                    🏷️ {t("Notification Type")}
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        "school_announcement",
                                        "bus_notification",
                                        "emergency",
                                        "general",
                                    ].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() =>
                                                setData("type", type)
                                            }
                                            className={`px-4 py-3 rounded-[25px] font-bold transition-all ${
                                                data.type === type
                                                    ? "bg-[#0e7490] text-white shadow-md"
                                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                            }`}
                                        >
                                            {t(type)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Title */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2">
                                        {t("Title (English)")}{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.title_en}
                                        onChange={(e) =>
                                            setData("title_en", e.target.value)
                                        }
                                        className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                                        required
                                    />
                                    {errors.title_en && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.title_en}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2">
                                        {t("Title (Arabic)")}{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.title_ar}
                                        onChange={(e) =>
                                            setData("title_ar", e.target.value)
                                        }
                                        className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                                        required
                                        dir="rtl"
                                    />
                                    {errors.title_ar && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.title_ar}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Message Body */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2">
                                        {t("Message (English)")}{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={data.body_en}
                                        onChange={(e) =>
                                            setData("body_en", e.target.value)
                                        }
                                        rows={4}
                                        className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[25px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                                        required
                                    />
                                    {errors.body_en && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.body_en}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2">
                                        {t("Message (Arabic)")}{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={data.body_ar}
                                        onChange={(e) =>
                                            setData("body_ar", e.target.value)
                                        }
                                        rows={4}
                                        className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[25px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                                        required
                                        dir="rtl"
                                    />
                                    {errors.body_ar && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.body_ar}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Recipients */}
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-[25px] border border-purple-200 dark:border-purple-800">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2">
                                    👥 {t("Recipients")}
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                    {[
                                        "all_parents",
                                        "by_classroom",
                                        "by_bus",
                                        "specific_parent",
                                    ].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() =>
                                                handleRecipientTypeChange(type)
                                            }
                                            className={`px-4 py-3 rounded-[20px] font-bold text-sm transition-all ${
                                                data.recipient_type === type
                                                    ? "bg-[#0e7490] text-white shadow-md"
                                                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                                            }`}
                                        >
                                            {t(type)}
                                        </button>
                                    ))}
                                </div>

                                {/* Conditional Recipient Filters */}
                                {data.recipient_type === "by_classroom" && (
                                    <select
                                        onChange={(e) =>
                                            setData("recipient_filter", {
                                                classroom_id: e.target.value,
                                            })
                                        }
                                        className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                                    >
                                        <option value="">
                                            {t("Select Classroom")}
                                        </option>
                                        {classrooms.map((classroom) => (
                                            <option
                                                key={classroom.id}
                                                value={classroom.id}
                                            >
                                                {classroom.name}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {data.recipient_type === "by_bus" && (
                                    <select
                                        onChange={(e) =>
                                            setData("recipient_filter", {
                                                bus_id: e.target.value,
                                            })
                                        }
                                        className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                                    >
                                        <option value="">
                                            {t("Select Bus")}
                                        </option>
                                        {buses.map((bus) => (
                                            <option key={bus.id} value={bus.id}>
                                                {bus.bus_number}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {data.recipient_type === "specific_parent" && (
                                    <select
                                        onChange={(e) =>
                                            setData("recipient_filter", {
                                                parent_id: e.target.value,
                                            })
                                        }
                                        className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                                    >
                                        <option value="">
                                            {t("Select Parent")}
                                        </option>
                                        {parents.map((parent) => (
                                            <option
                                                key={parent.id}
                                                value={parent.id}
                                            >
                                                {parent.name} ({parent.email})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Preview Button */}
                            {data.title_en && data.body_en && (
                                <button
                                    type="button"
                                    onClick={() => setShowPreview(!showPreview)}
                                    className="w-full px-6 py-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-[35px] hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                                >
                                    👁️{" "}
                                    {showPreview
                                        ? t("Hide Preview")
                                        : t("Show Preview")}
                                </button>
                            )}

                            {/* Preview */}
                            {showPreview && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-[25px] border border-blue-200 dark:border-blue-800">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                        <span className="text-2xl">📱</span>
                                        {t("Notification Preview")}
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="bg-white dark:bg-gray-800 p-5 rounded-[20px] shadow-sm">
                                            <p className="text-xs text-gray-500 mb-1">
                                                English:
                                            </p>
                                            <h4 className="font-bold text-gray-900 dark:text-white">
                                                {data.title_en}
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                                {data.body_en}
                                            </p>
                                        </div>
                                        <div
                                            className="bg-white dark:bg-gray-800 p-5 rounded-[20px] shadow-sm"
                                            dir="rtl"
                                        >
                                            <p className="text-xs text-gray-500 mb-1">
                                                العربية:
                                            </p>
                                            <h4 className="font-bold text-gray-900 dark:text-white">
                                                {data.title_ar}
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                                {data.body_ar}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-b-[30px] flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-[35px] hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                        >
                            {t("Cancel")}
                        </button>
                        <button
                            onClick={submit}
                            disabled={processing}
                            className="flex-1 px-6 py-4 bg-[#0e7490] text-white font-bold rounded-[35px] hover:bg-[#155e75] shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing
                                ? t("Sending...")
                                : `📤 ${t("Send Notification")}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
