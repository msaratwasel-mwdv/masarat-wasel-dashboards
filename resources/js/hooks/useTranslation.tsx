import { useState, useEffect } from 'react';

type Lang = 'ar' | 'en';

const dictionary = {
    // General & Actions
    'Dashboard': { ar: 'لوحة التحكم', en: 'Dashboard' },
    'Schools': { ar: 'المدارس', en: 'Schools' },
    'Students': { ar: 'الطلاب', en: 'Students' },
    'Buses': { ar: 'الحافلات', en: 'Buses' },
    'Drivers': { ar: 'الكباتن', en: 'Drivers' }, 
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
    'Search by National ID': { ar: 'بحث برقم الهوية', en: 'Search by National ID' },
    'Active': { ar: 'نشط', en: 'Active' },
    'Inactive': { ar: 'غير نشط', en: 'Inactive' },
    'Confirm Deletion': { ar: 'تأكيد الحذف', en: 'Confirm Deletion' },
    'Yes, Delete': { ar: 'نعم، حذف', en: 'Yes, Delete' },
    'No Data Found': { ar: 'لا توجد بيانات', en: 'No Data Found' },
    'Loading...': { ar: 'جار التحميل...', en: 'Loading...' },
    'All systems operational': { ar: 'الأنظمة تعمل بكفاءة', en: 'All systems operational' },

    // Dashboard
    'School Control Panel': { ar: 'لوحة التحكم المدرسية', en: 'School Control Panel' },
    'Welcome back, Principal!': { ar: 'أهلاً بعودتك، أيها المدير!', en: 'Welcome back, Principal!' },
    'Today Overview': { ar: 'نظرة عامة لليوم', en: 'Today\'s Overview' },
    'Here is today\'s overview for your school.': { ar: 'إليك نظرة عامة على مدرستك اليوم.', en: 'Here is today\'s overview for your school.' },
    'Registered Students': { ar: 'الطلاب المسجلين', en: 'Registered Students' },
    'Assigned Buses': { ar: 'الحافلات المعينة', en: 'Assigned Buses' },
    'Staff': { ar: 'الكادر المدرسي', en: 'School Staff' },
    'Drivers & Supervisors': { ar: 'الكباتن والمشرفين', en: 'Captains & Supervisors' },
    'Attendance': { ar: 'الحضور', en: 'Attendance' },
    'Daily Attendance': { ar: 'سجل الحضور اليومي', en: 'Daily Attendance' },
    'Todays Presence': { ar: 'نسبة الحضور اليوم', en: 'Today\'s Presence' },
    'Quick Actions': { ar: 'إجراءات سريعة', en: 'Quick Actions' },
    'Track Buses': { ar: 'تتبع الحافلات', en: 'Track Buses' },
    'Send Alert': { ar: 'إرسال تنبيه', en: 'Send Alert' },
    'Need Help?': { ar: 'تحتاج مساعدة؟', en: 'Need Help?' },
    'Contact Support': { ar: 'تواصل مع الدعم الفني لأي مشاكل.', en: 'Contact Support Center for any technical issues.' },
    'System Health': { ar: 'حالة النظام', en: 'System Health' },

    // Classrooms Management
    'Classes Management': { ar: 'إدارة الفصول والمراحل', en: 'Classes & Levels Management' },
    'Classes List': { ar: 'قائمة الفصول', en: 'Classes List' },
    'Supervisors List': { ar: 'قائمة المشرفين', en: 'Supervisors List' },
    'Organize and manage school classes and grade levels.': { ar: 'تنظيم وإدارة الفصول والمراحل الدراسية.', en: 'Organize and manage school classes and grade levels.' },
    'Total Classes': { ar: 'إجمالي الفصول', en: 'Total Classes' },
    'Add New Class': { ar: 'إضافة فصل جديد', en: 'Add New Class' },
    'Class Name': { ar: 'اسم الفصل', en: 'Class Name' },
    'Grade Level': { ar: 'المرحلة الدراسية', en: 'Grade Level' },
    'Assign Supervisor': { ar: 'تعيين مشرف', en: 'Assign Supervisor' },
    'Select Supervisor': { ar: 'اختر المشرف', en: 'Select Supervisor' },
    'Search by Class, Grade...': { ar: 'بحث باسم الفصل أو المرحلة...', en: 'Search by Class, Grade...' },
    'Are you sure you want to delete this class? This action cannot be undone.': { ar: 'هل أنت متأكد من حذف هذا الفصل؟ لا يمكن التراجع عن هذا الإجراء.', en: 'Are you sure you want to delete this class? This action cannot be undone.' },
    'Delete Class': { ar: 'حذف الفصل', en: 'Delete Class' },
    'Edit Class': { ar: 'تعديل الفصل', en: 'Edit Class' },
    'Create Class': { ar: 'إنشاء فصل', en: 'Create Class' },
    'Add Class': { ar: 'إضافة فصل', en: 'Add Class' },
    'This Class': { ar: 'هذا الفصل', en: 'This Class' },
    'Optional': { ar: 'اختياري', en: 'Optional' },

    // Supervisors Management
    'Supervisors Management': { ar: 'إدارة المشرفين', en: 'Supervisors Management' },
    'Total Supervisors': { ar: 'إجمالي المشرفين', en: 'Total Supervisors' },
    'Add New Supervisor': { ar: 'إضافة مشرف جديد', en: 'Add New Supervisor' },
    'Enter supervisor details': { ar: 'أدخل بيانات المشرف', en: 'Enter supervisor details' },
    'Name': { ar: 'الاسم', en: 'Name' },
    'National ID': { ar: 'رقم الهوية', en: 'National ID' },
    'Email': { ar: 'البريد الإلكتروني', en: 'Email' },
    'Phone Number': { ar: 'رقم الهاتف', en: 'Phone Number' },
    'Search by Name, ID...': { ar: 'بحث بالاسم أو الهوية...', en: 'Search by Name, ID...' },
    'Are you sure you want to delete this supervisor? This action cannot be undone.': { ar: 'هل أنت متأكد من حذف هذا المشرف؟ لا يمكن التراجع عن هذا الإجراء.', en: 'Are you sure you want to delete this supervisor? This action cannot be undone.' },
    'No supervisors found': { ar: 'لم يتم العثور على مشرفين', en: 'No supervisors found' },
    'Edit Supervisor': { ar: 'تعديل بيانات المشرف', en: 'Edit Supervisor' },
    'Add Supervisor': { ar: 'إضافة مشرف', en: 'Add Supervisor' },
    'Academic': { ar: 'أكاديمي', en: 'Academic' },
    'Identification': { ar: 'الهوية', en: 'Identification' },
    'Verify': { ar: 'تحقق', en: 'Verify' },
    'Follow the steps to register a student': { ar: 'اتبع الخطوات لتسجيل طالب جديد', en: 'Follow the steps to register a student' },
    'Update student and guardian information': { ar: 'تحديث بيانات الطالب وولي الأمر', en: 'Update student and guardian information' },
    'Search by Civil ID to find existing guardian.': { ar: 'ابحث بالرقم المدني للعثور على ولي أمر مسجل.', en: 'Search by Civil ID to find existing guardian.' },
    'Searching...': { ar: 'جاري البحث...', en: 'Searching...' },
    'Select & Continue': { ar: 'اختيار ومتابعة', en: 'Select & Continue' },
    'Create & Continue': { ar: 'إنشاء ومتابعة', en: 'Create & Continue' },
    'Upload Guardian Photo': { ar: 'رفع صورة ولي الأمر', en: 'Upload Guardian Photo' },
    'Not Assigned': { ar: 'غير معين', en: 'Not Assigned' },
    'No Supervisor': { ar: 'لا يوجد مشرف', en: 'No Supervisor' },
    'Student Profile': { ar: 'ملف الطالب', en: 'Student Profile' },

    // Students Management
    'Students Directory': { ar: 'دليل الطلاب', en: 'Students Directory' },
    'Students List': { ar: 'قائمة الطلاب', en: 'Students List' },
    'Enroll New Student': { ar: 'تسجيل طالب جديد', en: 'Enroll New Student' },
    'Enroll Student': { ar: 'تسجيل طالب', en: 'Enroll Student' },
    'Student Name': { ar: 'اسم الطالب', en: 'Student Name' },
    'Civil ID': { ar: 'الرقم المدني', en: 'Civil ID' },
    'Student Civil ID': { ar: 'الرقم المدني للطالب', en: 'Student Civil ID' },
    'Guardian Civil ID': { ar: 'الرقم المدني لولي الأمر', en: 'Guardian Civil ID' },
    'Guardian Photo': { ar: 'صورة ولي الأمر', en: 'Guardian Photo' },
    'Student Photo': { ar: 'صورة الطالب', en: 'Student Photo' },
    'Code': { ar: 'الكود', en: 'Code' },
    'Student Code': { ar: 'كود الطالب', en: 'Student Code' },
    'Gender': { ar: 'الجنس', en: 'Gender' },
    'Male': { ar: 'ذكر', en: 'Male' },
    'Female': { ar: 'أنثى', en: 'Female' },
    'Photo': { ar: 'الصورة', en: 'Photo' },
    'Class': { ar: 'الفصل', en: 'Class' },
    'Supervisor': { ar: 'المشرف', en: 'Supervisor' },
    'Guardian Name': { ar: 'اسم ولي الأمر', en: 'Guardian Name' },
    'Guardian ID': { ar: 'هوية ولي الأمر', en: 'Guardian ID' },
    'Guardian Phone': { ar: 'جوال ولي الأمر', en: 'Guardian Phone' },
    'Address': { ar: 'العنوان', en: 'Address' },
    'G. Photo': { ar: 'صورة الولي', en: 'G. Photo' },
    'Edit Student': { ar: 'تعديل بيانات الطالب', en: 'Edit Student' },
    'Are you sure you want to delete this student? This action cannot be undone.': { ar: 'هل أنت متأكد من حذف هذا الطالب؟ لا يمكن التراجع عن هذا الإجراء.', en: 'Are you sure you want to delete this student? This action cannot be undone.' },

    // Enroll Student Flow
    'Search Guardian': { ar: 'البحث عن ولي أمر', en: 'Search Guardian' },
    'Student Information': { ar: 'بيانات الطالب', en: 'Student Information' },
    'Student Details': { ar: 'تفاصيل الطالب', en: 'Student Details' },
    'Guardian Verification': { ar: 'التحقق من ولي الأمر', en: 'Guardian Verification' },
    'Search by name, National ID or Father ID...': { ar: 'ابحث بالاسم أو رقم الهوية...', en: 'Search by name, National ID or Father ID...' },
    'Guardian Found': { ar: 'تم العثور على ولي الأمر', en: 'Guardian Found' },
    'Guardian Not Found': { ar: 'لم يتم العثور على ولي الأمر', en: 'Guardian Not Found' },
    'Select Guardian & Continue': { ar: 'اعتماد ولي الأمر والمتابعة', en: 'Select Guardian & Continue' },
    'No guardian was found with this national ID. Create a new guardian below': { ar: 'لا يوجد ولي أمر مسجل بهذه الهوية. قم بإنشاء ملف جديد أدناه.', en: 'No guardian was found with this national ID. Create a new guardian below' },
    'Create New Guardian': { ar: 'إنشاء ولي أمر جديد', en: 'Create New Guardian' },
    'Guardian Name (Arabic)': { ar: 'اسم ولي الأمر (عربي)', en: 'Guardian Name (Arabic)' },
    'Guardian Name (English)': { ar: 'اسم ولي الأمر (إنجليزي)', en: 'Guardian Name (English)' },
    'Guardian Information': { ar: 'بيانات ولي الأمر', en: 'Guardian Information' },
    'Click to upload guardian photo': { ar: 'اضغط لرفع صورة ولي الأمر', en: 'Click to upload guardian photo' },
    'Click to upload student photo': { ar: 'اضغط لرفع صورة الطالب', en: 'Click to upload student photo' },
    'Select gender...': { ar: 'اختر الجنس...', en: 'Select gender...' },
    'Select a class...': { ar: 'اختر الفصل...', en: 'Select a class...' },
    'Select a supervisor...': { ar: 'اختر المشرف...', en: 'Select a supervisor...' },
    'Active Student': { ar: 'طالب نشط', en: 'Active Student' },
    'Class Information': { ar: 'معلومات الفصل', en: 'Class Information' },
    'Referenced Supervisors': { ar: 'المشرفين المرجعيين', en: 'Referenced Supervisors' },
    'No supervisors available': { ar: 'لا يوجد مشرفين متاحين', en: 'No supervisors available' },
    'Supervisor Information': { ar: 'معلومات المشرف', en: 'Supervisor Information' },
    'Active Supervisor': { ar: 'مشرف نشط', en: 'Active Supervisor' },
    'Guardian Name (EN)': { ar: 'اسم ولي الأمر (EN)', en: 'Guardian Name (EN)' },
    'Guardian': { ar: 'ولي الأمر', en: 'Guardian' },
    'Create Guardian': { ar: 'إنشاء ولي أمر', en: 'Create Guardian' },
    'Save Changes': { ar: 'حفظ التغييرات', en: 'Save Changes' },
    'Student ID': { ar: 'الرقم الأكاديمي', en: 'Student ID' }, 
    'Change': { ar: 'تغيير', en: 'Change' },
    'Please complete Step 1': { ar: 'يرجى إكمال الخطوة 1', en: 'Please complete Step 1' },
    'City, District, Street...': { ar: 'المدينة، الحي، الشارع...', en: 'City, District, Street...' },
    'Home Number': { ar: 'رقم المنزل', en: 'Home Number' },
    'Saving...': { ar: 'جار الحفظ...', en: 'Saving...' },


    // Buses Page
    'Buses Management': { ar: 'إدارة الحافلات', en: 'Buses Management' },
    'All Buses': { ar: 'كل الحافلات', en: 'All Buses' },
    'Add Bus': { ar: 'إضافة حافلة', en: 'Add Bus' },
    'Bus Number': { ar: 'رقم الحافلة', en: 'Bus Number' },
    'Plate': { ar: 'اللوحة', en: 'Plate' },
    'Capacity': { ar: 'السعة', en: 'Capacity' },
    'Driver': { ar: 'الكابتن', en: 'Captain' },
    'Add New Bus': { ar: 'إضافة حافلة جديدة', en: 'Add New Bus' },
    'Plate Number': { ar: 'رقم اللوحة', en: 'Plate Number' },
    'Select Driver': { ar: 'اختر الكابتن', en: 'Select Captain' },
    'Drivers Management': { ar: 'إدارة الكباتن', en: 'Captains Management' },
    'License Number': { ar: 'رقم الرخصة', en: 'License Number' },
    'Add Driver': { ar: 'إضافة كابتن', en: 'Add Captain' },
    'Edit Driver': { ar: 'تعديل بيانات الكابتن', en: 'Edit Captain' },
    'Main Menu': { ar: 'القائمة الرئيسية', en: 'Main Menu' },
    'School Dashboard': { ar: 'لوحة تحكم المدرسة', en: 'School Dashboard' },
    'Dark Mode': { ar: 'الوضع الليلي', en: 'Dark Mode' },
    'Light Mode': { ar: 'الوضع النهاري', en: 'Light Mode' },

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
    'Select Bus': { ar: 'اختر الحافلة', en: 'Select Bus' },

    // Attendance Module
    'Search by ID (Student / Guardian / Supervisor)': { ar: 'بحث بالهوية (طالب / ولي أمر / مشرف)', en: 'Search by ID (Student / Guardian / Supervisor)' },
    'Enter National ID...': { ar: 'أدخل رقم الهوية...', en: 'Enter National ID...' },
    'Reset Filters': { ar: 'إعادة تعيين', en: 'Reset Filters' },
    'Student Found': { ar: 'تم العثور على طالب', en: 'Student Found' },
    'Supervisor Found': { ar: 'تم العثور على مشرف', en: 'Supervisor Found' },
    'Add Attendance Now': { ar: 'تسجيل الحضور الآن', en: 'Add Attendance Now' },
    'Current Class': { ar: 'الفصل الحالي', en: 'Current Class' },
    'Contact': { ar: 'الاتصال', en: 'Contact' },
    'Children': { ar: 'الأبناء المسجلين', en: 'Children' },
    'Supervisor Name': { ar: 'اسم المشرف', en: 'Supervisor Name' },
    'Class Managed': { ar: 'الفصل المشرف عليه', en: 'Class Managed' },
    'Unknown Student': { ar: 'طالب غير معروف', en: 'Unknown Student' },
    'Unknown': { ar: 'مجهول', en: 'Unknown' },
    'No attendance data found': { ar: 'لا توجد سجلات حضور', en: 'No attendance data found' },
    'Click Search to load records or Add Record to create new ones': { ar: 'اضغط بحث لعرض السجلات أو إضافة سجل لإنشاء جديد', en: 'Click Search to load records or Add Record to create new ones' },
    'Edit Attendance': { ar: 'تعديل الحضور', en: 'Edit Attendance' },
    'Add Attendance Record': { ar: 'إضافة سجل حضور', en: 'Add Attendance Record' },
    'Record student attendance': { ar: 'تسجيل حضور الطالب', en: 'Record student attendance' },
    'Error loading metadata': { ar: 'خطأ في تحميل البيانات الأساسية', en: 'Error loading metadata' },
    'Error loading attendance data': { ar: 'خطأ في تحميل سجلات الحضور', en: 'Error loading attendance data' },
    'Attendance updated successfully': { ar: 'تم تحديث الحضور بنجاح', en: 'Attendance updated successfully' },
    'Attendance recorded successfully': { ar: 'تم تسجيل الحضور بنجاح', en: 'Attendance recorded successfully' },
    'Error saving attendance': { ar: 'خطأ في حفظ الحضور', en: 'Error saving attendance' },
    'Attendance record deleted': { ar: 'تم حذف سجل الحضور', en: 'Attendance record deleted' },
    'Error deleting record': { ar: 'خطأ في حذف السجل', en: 'Error deleting record' },
    'Please select a class first': { ar: 'يرجى اختيار الفصل أولاً', en: 'Please select a class first' },
    'Bulk attendance recorded successfully': { ar: 'تم تسجيل الحضور الجماعي بنجاح', en: 'Bulk attendance recorded successfully' },
    'Error saving bulk attendance': { ar: 'خطأ في حفظ الحضور الجماعي', en: 'Error saving bulk attendance' },
    'All Present': { ar: 'الكل حاضر', en: 'All Present' },
    'All Absent': { ar: 'الكل غائب', en: 'All Absent' },
    'Save Attendance': { ar: 'حفظ الحضور', en: 'Save Attendance' },
    'Delete Attendance Record?': { ar: 'حذف سجل الحضور؟', en: 'Delete Attendance Record?' },
    'Are you sure you want to delete this record? This action cannot be undone.': { ar: 'هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء.', en: 'Are you sure you want to delete this record? This action cannot be undone.' },
    'From Date': { ar: 'من تاريخ', en: 'From Date' },
    'To Date': { ar: 'إلى تاريخ', en: 'To Date' },
    'Select Student': { ar: 'اختر الطالب', en: 'Select Student' },
    'Select Class': { ar: 'اختر الفصل', en: 'Select Class' },
    'Search Filtering': { ar: 'فلترة البحث', en: 'Search Filtering' },
    'Mark attendance for all students in a class': { ar: 'تسجيل الحضور لجميع طلاب الفصل', en: 'Mark attendance for all students in a class' },
    'Take Class Attendance': { ar: 'تحضير الفصل', en: 'Take Class Attendance' },
    'Total Records': { ar: 'إجمالي السجلات', en: 'Total Records' },
    'Present': { ar: 'حاضر', en: 'Present' },
    'Absent': { ar: 'غائب', en: 'Absent' },
    'This action cannot be undone.': { ar: 'لا يمكن التراجع عن هذا الإجراء.', en: 'This action cannot be undone.' },
    'records': { ar: 'سجلات', en: 'records' },
    'Showing': { ar: 'عرض', en: 'Showing' },
    'Add Record': { ar: 'إضافة سجل', en: 'Add Record' },
    'Select Status': { ar: 'اختر الحالة', en: 'Select Status' },
    'No students found in this class': { ar: 'لم يتم العثور على طلاب في هذا الفصل', en: 'No students found in this class' },
    'Reset': { ar: 'إعادة تعيين', en: 'Reset' },
    'Attendance System': { ar: 'نظام الحضور', en: 'Attendance System' },
    'Student Portal': { ar: 'بوابة الطلاب', en: 'Student Portal' },
    'Recently Added Students': { ar: 'الطلاب المضافون حديثاً', en: 'Recently Added Students' },
    'Version': { ar: 'الإصدار', en: 'Version' },
} as Record<string, { ar: string; en: string }>;




export default function useTranslation() {
    const [lang, setLang] = useState<Lang>('ar'); // Default to Arabic

    useEffect(() => {
        const storedLang = localStorage.getItem('lang') as Lang;
        if (storedLang) {
            setLang(storedLang);
            document.documentElement.dir = storedLang === 'ar' ? 'rtl' : 'ltr';
        } else {
            // Default to Arabic
             localStorage.setItem('lang', 'ar');
             document.documentElement.dir = 'rtl';
            setLang('ar');
        }

        // --- THEME ENFORCEMENT ---
        // Basic enforcement of dark mode preference if not set
        if (!localStorage.getItem('theme')) {
            localStorage.setItem('theme', 'dark');
            document.documentElement.classList.add('dark');
        } else {
            if (localStorage.getItem('theme') === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }, []);

    const changeLang = (newLang: Lang) => {
        setLang(newLang);
        localStorage.setItem('lang', newLang);
        document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
        window.location.reload(); 
    };

    const t = (key: string) => {
        if (!dictionary[key]) {
            console.warn(`Missing translation for key: "${key}"`);
            return key;
        }
        return dictionary[key][lang];
    };

    return { t, lang, changeLang, isRtl: lang === 'ar' };
}
