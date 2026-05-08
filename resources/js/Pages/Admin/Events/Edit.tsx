import { FormEventHandler } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import { useTheme } from "@/Contexts/ThemeContext";
import { DS_pageTitle, DS_btnSecondary } from "@/lib/DS";
import { Save, ArrowRight, ArrowLeft } from "lucide-react";

interface Event {
  id: number;
  title_ar: string;
  title_en: string;
  content_ar: string;
  content_en: string;
  type: string;
  tag_ar: string;
  tag_en: string;
  event_date: string;
  is_published: boolean;
  image: string | null;
}

export default function Edit({ event }: { event: Event }) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const { data, setData, post, processing, errors } = useForm({
    _method: "put", // Required for Laravel file uploads on PUT
    title_ar: event.title_ar || "",
    title_en: event.title_en || "",
    content_ar: event.content_ar || "",
    content_en: event.content_en || "",
    type: event.type || "news",
    tag_ar: event.tag_ar || "",
    tag_en: event.tag_en || "",
    event_date: event.event_date ? event.event_date.split('T')[0] : "",
    is_published: event.is_published,
    image: null as File | null,
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post(route("admin.events.update", event.id));
  };

  const inputClass = `mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-brand-yellow focus:ring-brand-yellow shadow-sm`;

  return (
    <AuthenticatedLayout>
      <Head title={isRTL ? "تعديل الفعالية" : "Edit Event"} />

      <div className={`pb-8 space-y-6 max-w-4xl mx-auto dir-${isRTL ? "rtl" : "ltr"}`}>
        <div className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className={isRTL ? "text-right" : "text-left"}>
            <h1 className={DS_pageTitle}>{isRTL ? "تعديل الفعالية" : "Edit Event"}</h1>
          </div>
          <Link href={route("admin.events.index")} className={DS_btnSecondary}>
            {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isRTL ? "عودة" : "Back"}
          </Link>
        </div>

        <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm ${isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-100"}`}>
          <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title AR */}
              <div>
                <InputLabel htmlFor="title_ar" value={isRTL ? "العنوان (عربي)" : "Title (Arabic)"} />
                <TextInput
                  id="title_ar"
                  type="text"
                  className={inputClass}
                  value={data.title_ar}
                  onChange={(e) => setData("title_ar", e.target.value)}
                  required
                  dir="rtl"
                />
                <InputError message={errors.title_ar} className="mt-2" />
              </div>

              {/* Title EN */}
              <div>
                <InputLabel htmlFor="title_en" value={isRTL ? "العنوان (إنجليزي)" : "Title (English)"} />
                <TextInput
                  id="title_en"
                  type="text"
                  className={inputClass}
                  value={data.title_en}
                  onChange={(e) => setData("title_en", e.target.value)}
                  required
                  dir="ltr"
                />
                <InputError message={errors.title_en} className="mt-2" />
              </div>

              {/* Type */}
              <div>
                <InputLabel htmlFor="type" value={isRTL ? "النوع" : "Type"} />
                <select
                  id="type"
                  className={inputClass}
                  value={data.type}
                  onChange={(e) => setData("type", e.target.value)}
                  required
                >
                  <option value="news">{isRTL ? "أخبار" : "News"}</option>
                  <option value="workshop">{isRTL ? "ورشة عمل" : "Workshop"}</option>
                  <option value="activity">{isRTL ? "نشاط" : "Activity"}</option>
                  <option value="bus_photos">{isRTL ? "صور حافلات" : "Bus Photos"}</option>
                </select>
                <InputError message={errors.type} className="mt-2" />
              </div>

              {/* Date */}
              <div>
                <InputLabel htmlFor="event_date" value={isRTL ? "التاريخ" : "Date"} />
                <TextInput
                  id="event_date"
                  type="date"
                  className={inputClass}
                  value={data.event_date}
                  onChange={(e) => setData("event_date", e.target.value)}
                />
                <InputError message={errors.event_date} className="mt-2" />
              </div>

              {/* Content AR */}
              <div className="md:col-span-2">
                <InputLabel htmlFor="content_ar" value={isRTL ? "المحتوى (عربي)" : "Content (Arabic)"} />
                <textarea
                  id="content_ar"
                  className={inputClass}
                  rows={4}
                  value={data.content_ar}
                  onChange={(e) => setData("content_ar", e.target.value)}
                  dir="rtl"
                ></textarea>
                <InputError message={errors.content_ar} className="mt-2" />
              </div>

              {/* Content EN */}
              <div className="md:col-span-2">
                <InputLabel htmlFor="content_en" value={isRTL ? "المحتوى (إنجليزي)" : "Content (English)"} />
                <textarea
                  id="content_en"
                  className={inputClass}
                  rows={4}
                  value={data.content_en}
                  onChange={(e) => setData("content_en", e.target.value)}
                  dir="ltr"
                ></textarea>
                <InputError message={errors.content_en} className="mt-2" />
              </div>
              
              {/* Image Upload */}
              <div className="md:col-span-2">
                <InputLabel htmlFor="image" value={isRTL ? "تحديث الصورة (اختياري)" : "Update Image (Optional)"} />
                {event.image && (
                   <div className="mb-3">
                     <img src={event.image} alt="Current" className="w-24 h-24 object-cover rounded-xl border" />
                   </div>
                )}
                <input
                  id="image"
                  type="file"
                  className={`mt-1 block w-full text-sm ${isDark ? "text-gray-400" : "text-gray-500"}
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-xl file:border-0
                    file:text-sm file:font-bold
                    ${isDark ? "file:bg-brand-yellow/10 file:text-brand-yellow hover:file:bg-brand-yellow/20" : "file:bg-brand-navy/10 file:text-brand-navy hover:file:bg-brand-navy/20"}
                    transition-all
                  `}
                  onChange={(e) => setData("image", e.target.files?.[0] || null)}
                  accept="image/*"
                />
                <InputError message={errors.image} className="mt-2" />
              </div>

              {/* Status */}
              <div className="md:col-span-2 flex items-center gap-3 mt-4">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={data.is_published}
                  onChange={(e) => setData("is_published", e.target.checked)}
                  className="rounded border-gray-300 text-brand-yellow focus:ring-brand-yellow w-5 h-5"
                />
                <label htmlFor="is_published" className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {isRTL ? "نشر الفعالية لتظهر للعامة" : "Publish event publicly"}
                </label>
              </div>
            </div>

            <div className={`flex items-center justify-end mt-8 border-t pt-6 ${isDark ? "border-gray-700" : "border-gray-100"}`}>
              <PrimaryButton disabled={processing} className="bg-brand-navy hover:bg-brand-dark px-8 py-3">
                <Save className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                {isRTL ? "حفظ التعديلات" : "Save Changes"}
              </PrimaryButton>
            </div>
          </form>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
