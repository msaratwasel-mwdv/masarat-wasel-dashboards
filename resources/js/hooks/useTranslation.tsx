import { useState, useEffect } from 'react';

type Lang = 'ar' | 'en';

const dictionary = {
    // General
    'Dashboard': { ar: 'لوحة التحكم', en: 'Dashboard' },
    'Schools': { ar: 'المدارس', en: 'Schools' },
    'Students': { ar: 'الطلاب', en: 'Students' },
    'Buses': { ar: 'الحافلات', en: 'Buses' },
    'Drivers': { ar: 'السائقين', en: 'Drivers' },
    'Supervisors': { ar: 'المشرفين', en: 'Supervisors' },
    'Trips': { ar: 'الرحلات', en: 'Trips' },
    'Attendance Reports': { ar: 'تقارير الحضور', en: 'Attendance Reports' },
    'Settings': { ar: 'الإعدادات', en: 'Settings' },
    'Logout': { ar: 'تسجيل خروج', en: 'Logout' },
    'Search': { ar: 'بحث...', en: 'Search...' },
    'Delete': { ar: 'حذف', en: 'Delete' },
    'Edit': { ar: 'تعديل', en: 'Edit' },
    'Save': { ar: 'حفظ', en: 'Save' },
    'Cancel': { ar: 'إلغاء', en: 'Cancel' },
    'Add': { ar: 'إضافة', en: 'Add' },
    'Actions': { ar: 'الإجراءات', en: 'Actions' },
    'Status': { ar: 'الحالة', en: 'Status' },
    'View': { ar: 'عرض', en: 'View' },
    'Loading': { ar: 'جار التحميل...', en: 'Loading...' },
    'No Data': { ar: 'لا توجد بيانات', en: 'No Data Available' },
    'Are you sure?': { ar: 'هل أنت متأكد؟', en: 'Are you sure?' },
    'Masarat Wasel': { ar: 'مسارات وصل', en: 'Masarat Wasel' },

    // Dashboard
    'School Control Panel': { ar: 'لوحة تحكم المدرسة', en: 'School Control Panel'},
    'Welcome back, Principal!': { ar: 'أهلاً بك، مدير المدرسة!', en: 'Welcome back, Principal!' },
    'Today Overview': { ar: 'هذه نظرة عامة لليوم', en: 'Here is today\'s overview for your school.' },
    'Registered Students': { ar: 'الطلاب المسجلين', en: 'Registered Students' },
    'Assigned Buses': { ar: 'الحافلات المعينة', en: 'Assigned Buses' },
    'Staff': { ar: 'الموظفين', en: 'Staff' },
    'Drivers & Supervisors': { ar: 'السائقين والمشرفين', en: 'Drivers & Supervisors' },
    'Attendance': { ar: 'الحضور', en: 'Attendance' },
    'Daily Attendance': { ar: 'الحضور اليومي', en: 'Your Daily Attendance' },
    'Todays Presence': { ar: 'نسبة الحضور اليوم', en: 'Today\'s Presence' },
    'Quick Actions': { ar: 'روابط سريعة', en: 'Quick Actions' },
    'Track Buses': { ar: 'تتبع الحافلات', en: 'Track Buses' },
    'Send Alert': { ar: 'إرسال تنبيه', en: 'Send Alert' },
    'Need Help?': { ar: 'تحتاج مساعدة؟', en: 'Need Help?' },
    'Contact Support': { ar: 'تواصل مع الدعم الفني لأي مشاكل.', en: 'Contact Wasel Support Center for any technical issues.' },

    // Students Page
    'All Students': { ar: 'كل الطلاب', en: 'All Students' },
    'Father ID': { ar: 'رقم هوية الأب', en: 'Father ID' },
    'Student Name': { ar: 'اسم الطالب', en: 'Student Name' },
    'Student ID': { ar: 'رقم الطالب', en: 'Student ID' },
    'Return Group': { ar: 'رحلة العودة', en: 'Return Group' },
    'Going Group': { ar: 'رحلة الذهاب', en: 'Going Group' },
    'Class': { ar: 'الفصل', en: 'Class' },
    'Reload': { ar: 'تحديث', en: 'Reload' },
    'Image': { ar: 'الصورة', en: 'Image' },
    'Going Bus': { ar: 'حافلة الذهاب', en: 'Going Bus' },
    'Return Bus': { ar: 'حافلة العودة', en: 'Return Bus' },
    'Profile': { ar: 'الملف الشخصي', en: 'Profile' },
    'Students Directory': { ar: 'دليل الطلاب', en: 'Students Directory' },
    'Manage and monitor all student profiles and transport assignments.': { ar: 'إدارة ومراقبة جميع ملفات الطلاب وتعيينات النقل الخاصة بهم.', en: 'Manage and monitor all student profiles and transport assignments.' },
    'Enroll New Student': { ar: 'تسجيل طالب جديد', en: 'Enroll New Student' },
    'Search by name, National ID or Father ID...': { ar: 'بحث بالاسم، رقم الهوية أو هوية الأب...', en: 'Search by name, National ID or Father ID...' },
    'All Statuses': { ar: 'كل الحالات', en: 'All Statuses' },
    'Student': { ar: 'الطالب', en: 'Student' },
    'National ID': { ar: 'رقم الهوية', en: 'National ID' },
    'Transport': { ar: 'النقل', en: 'Transport' },
    'Going': { ar: 'الذهاب', en: 'Going' },
    'Return': { ar: 'العودة', en: 'Return' },
    'No email': { ar: 'لا يوجد بريد', en: 'No email' },
    'Showing': { ar: 'عرض', en: 'Showing' },
    'of': { ar: 'من', en: 'of' },
    'Edit Student Profile': { ar: 'تعديل ملف الطالب', en: 'Edit Student Profile' },
    'Fill in the details below to ': { ar: 'قم بتعبئة التفاصيل أدناه لـ ', en: 'Fill in the details below to ' },
    'update': { ar: 'تحديث', en: 'update' },
    'register': { ar: 'تسجيل', en: 'register' },
    'General': { ar: 'عام', en: 'General' },
    'Academic': { ar: 'أكاديمي', en: 'Academic' },
    'Upload Photo': { ar: 'رفع صورة', en: 'Upload Photo' },
    'Change': { ar: 'تغيير', en: 'Change' },
    'Enter student full name': { ar: 'أدخل الاسم الكامل للطالب', en: 'Enter student full name' },
    'Email Address (Optional)': { ar: 'البريد الإلكتروني (اختياري)', en: 'Email Address (Optional)' },
    'Assign to Class': { ar: 'تعيين للفصل', en: 'Assign to Class' },
    'Select a class...': { ar: 'اختر فصلاً...', en: 'Select a class...' },
    'Morning (Going) Bus': { ar: 'حافلة الصباح (ذهاب)', en: 'Morning (Going) Bus' },
    'Evening (Return) Bus': { ar: 'حافلة المساء (عودة)', en: 'Evening (Return) Bus' },
    'Assigning buses helps in tracking student attendance and trip management.': { ar: 'يساعد تعيين الحافلات في تتبع حضور الطلاب وإدارة الرحلات.', en: 'Assigning buses helps in tracking student attendance and trip management.' },
    'Discard': { ar: 'تجاهل', en: 'Discard' },
    'Enroll Student': { ar: 'تسجيل الطالب', en: 'Enroll Student' },
    'Saving...': { ar: 'جار الحفظ...', en: 'Saving...' },

    // Buses Page
    'Buses Management': { ar: 'إدارة الحافلات', en: 'Buses Management' },
    'All Buses': { ar: 'كل الحافلات', en: 'All Buses' },
    'Add Bus': { ar: 'إضافة حافلة', en: 'Add Bus' },
    'Bus Number': { ar: 'رقم الحافلة', en: 'Bus Number' },
    'Plate': { ar: 'اللوحة', en: 'Plate' },
    'Capacity': { ar: 'السعة', en: 'Capacity' },
    'Driver': { ar: 'السائق', en: 'Driver' },
    'Supervisor': { ar: 'المشرف', en: 'Supervisor' },
    'Edit Bus': { ar: 'تعديل الحافلة', en: 'Edit Bus' },
    'Add New Bus': { ar: 'إضافة حافلة جديدة', en: 'Add New Bus' },
    'Plate Number': { ar: 'رقم اللوحة', en: 'Plate Number' },
    'Select Driver': { ar: 'اختر السائق', en: 'Select Driver' },
    'Select Supervisor': { ar: 'اختر المشرف', en: 'Select Supervisor' },

    // Drivers & Supervisors
    'Drivers Management': { ar: 'إدارة السائقين', en: 'Drivers Management' },
    'Supervisors Management': { ar: 'إدارة المشرفين', en: 'Supervisors Management' },
    'Name': { ar: 'الاسم', en: 'Name' },
    'Phone': { ar: 'رقم الهاتف', en: 'Phone' },
    'License Number': { ar: 'رقم الرخصة', en: 'License Number' },
    'Add Driver': { ar: 'إضافة سائق', en: 'Add Driver' },
    'Add Supervisor': { ar: 'إضافة مشرف', en: 'Add Supervisor' },
    'Edit Driver': { ar: 'تعديل سائق', en: 'Edit Driver' },
    'Edit Supervisor': { ar: 'تعديل مشرف', en: 'Edit Supervisor' },

    // Trips
    'Trips Management': { ar: 'جدولة الرحلات', en: 'Trips Management' },
    'Trips Overview': { ar: 'نظرة عامة على الرحلات', en: 'Trips Overview' },
    'Schedule Trip': { ar: 'جدولة رحلة', en: 'Schedule Trip' },
    'Date': { ar: 'التاريخ', en: 'Date' },
    'Time': { ar: 'الوقت', en: 'Time' },
    'Bus': { ar: 'الحافلة', en: 'Bus' },
    'Type': { ar: 'النوع', en: 'Type' },
    'Scheduled': { ar: 'مجدولة', en: 'Scheduled' },
    'Ongoing': { ar: 'جارية', en: 'Ongoing' },
    'Completed': { ar: 'مكتملة', en: 'Completed' },
    'Cancelled': { ar: 'ملغاة', en: 'Cancelled' },
    'Morning': { ar: 'صباحي', en: 'Morning' },
    'Evening': { ar: 'مسائي', en: 'Evening' },
    'Activity': { ar: 'نشاط', en: 'Activity' },
    'Other': { ar: 'أخرى', en: 'Other' },
    'Select Bus': { ar: 'اختر الحافلة', en: 'Select Bus' },

    // Reports
    'Search Criteria': { ar: 'معايير البحث', en: 'Search Criteria' },
    'From': { ar: 'من', en: 'From' },
    'To': { ar: 'إلى', en: 'To' },
    'All Classes': { ar: 'كل الفصول', en: 'All Classes' },

    // Student Profile
    'Student Details': { ar: 'بيانات الطالب', en: 'Student Details' },
    'Attendance History': { ar: 'سجل الحضور', en: 'Attendance History' },
    'Personal Information': { ar: 'المعلومات الشخصية', en: 'Personal Information' },
    'Edit Details': { ar: 'تعديل البيانات', en: 'Edit Details' },
    'Save Changes': { ar: 'حفظ التغييرات', en: 'Save Changes' },
    'Full Name': { ar: 'الاسم الكامل', en: 'Full Name' },
    'Morning Bus': { ar: 'حافلة الصباح', en: 'Morning Bus' },
    'Evening Bus': { ar: 'حافلة المساء', en: 'Evening Bus' },
    'Trip': { ar: 'الرحلة', en: 'Trip' },
    'Manual Entry': { ar: 'يدوي', en: 'Manual Entry' },
    'Not Assigned': { ar: 'غير معين', en: 'Not Assigned' },
    'Bus Assignment': { ar: 'تعيين الحافلات', en: 'Bus Assignment' },
    'Active': { ar: 'نشط', en: 'Active' },
    'Inactive': { ar: 'غير نشط', en: 'Inactive' },
    'Export Excel': { ar: 'تصدير إكسل', en: 'Export Excel' },
    'Print': { ar: 'طباعة', en: 'Print' },
    'Copy': { ar: 'نسخ', en: 'Copy' },
    'Visible Columns': { ar: 'الأعمدة الظاهرة', en: 'Visible Columns' },
    'Father National ID': { ar: 'الرقم المدني للأب', en: 'Father National ID' },
    'Student National ID': { ar: 'الرقم المدني للطالب', en: 'Student National ID' },
    'Morning Group': { ar: 'مجموعة الذهاب', en: 'Morning Group' },
    'Select Status': { ar: 'اختر الحالة', en: 'Select Status' },
};

export default function useTranslation() {
    const [lang, setLang] = useState<Lang>('ar'); // Default to Arabic

    useEffect(() => {
        const storedLang = localStorage.getItem('lang') as Lang;
        if (storedLang) {
            setLang(storedLang);
            document.documentElement.dir = storedLang === 'ar' ? 'rtl' : 'ltr';
        } else {
             localStorage.setItem('lang', 'ar');
             document.documentElement.dir = 'rtl';
        }
    }, []);

    const changeLang = (newLang: Lang) => {
        setLang(newLang);
        localStorage.setItem('lang', newLang);
        document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
        window.location.reload(); // Force reload to ensure all components update cleanly without context complexity
    };

    const t = (key: string) => {
        const entry = dictionary[key as keyof typeof dictionary];
        return entry ? entry[lang] : key;
    };

    const isRtl = lang === 'ar';

    return { t, lang, changeLang, isRtl };
}
