<?php

return [
    'student_boarding' => 'صعد :student_name إلى الحافلة بنجاح.',
    'arrival_school' => 'وصل :student_name إلى المدرسة بسلام.',
    'approaching_home' => 'الحافلة تقترب من المنزل لتوصيل :student_name.',
    'student_absence' => 'تم تسجيل :student_name غائباً عن رحلة اليوم.',
    'absence_request_processed' => 'تمت معالجة طلب الغياب الخاص بـ :student_name.',
    'chat_message' => 'لديك رسالة جديدة من :sender_name.',
    'address_change' => 'تم تحديث موقع المنزل لـ :student_name بنجاح.',
    'custom_admin_alert' => 'تنبيه إداري جديد من المدرسة.',
    'trip_started_forth' => 'بدأت رحلة الذهاب للمدرسة للأبناء: :students',
    'trip_started_back' => 'بدأت رحلة العودة للمنزل للأبناء: :students',
    'student_picked_up' => 'تم صعود الطالب :student الحافلة',
    'student_dropped_off' => 'تم نزول الطالب :student من الحافلة',
    'trip_started_title' => 'تحديث الرحلة',
    'student_status_title' => 'حالة الطالب',

    // Absence Requests
    'absence_approved_title' => 'تحديث طلب غياب: مقبول',
    'absence_approved_message' => 'تم قبول طلب غياب الطالب :student',
    'absence_rejected_title' => 'تحديث طلب غياب: مرفوض',
    'absence_rejected_message' => 'تم رفض طلب غياب الطالب :student. السبب: :reason',
    'absence_alert_title' => 'تنبيه غياب (:type): :student',
    'absence_alert_message' => 'أفاد ولي الأمر بغياب الطالب (:type) يوم (:date). يرجى عدم المرور بالمنزل.',

    // Location Change Request
    'location_request_title' => 'طلب تغيير موقع منزل',
    'location_request_message' => 'قام ولي الأمر :guardian بتقديم طلب لتغيير موقع منزل الطالب :student',
    'initial_location_setup_title' => 'تحديد موقع منزل طالب',
    'initial_location_setup_message' => 'قام ولي الأمر :guardian بتحديد موقع منزل الطالب :student لأول مرة.',
    'location_approved_title' => 'تحديث طلب الموقع: مقبول',
    'location_approved_message' => 'تم قبول طلب تغيير موقع الطالب :student وتحديث بيانات الحافلة.',
    'location_rejected_title' => 'تحديث طلب الموقع: مرفوض',
    'location_rejected_message' => 'تم رفض طلب تغيير موقع الطالب :student. السبب: :reason',

    // Bus Approaching / Proximity
    'bus_approaching_title' => 'الحافلة تقترب',
    'bus_approaching_message' => 'الحافلة تقترب الآن من منزل الطالب :student. يرجى التجهيز.',
    'bus_proximity_to_school_title' => 'الحافلة تقترب لاستلام :student',
    'bus_proximity_to_school_message' => 'الحافلة على بعد :distance من منزلك، ستصل خلال دقيقتين تقريباً. يرجى تجهيز الطالب للركوب.',
    'bus_proximity_to_home_title' => 'طالبك :student سيصل خلال دقيقتين',
    'bus_proximity_to_home_message' => 'الحافلة على بعد :distance من منزلك، ستصل خلال دقيقتين تقريباً. يرجى الاستعداد لاستلام الطالب.',

    // Student Absent (Trip)
    'student_absent_title' => 'غياب الطالب :student',
    'student_absent_message' => 'تم تسجيل غياب الطالب عن الرحلة الحالية.',

    // Trip Finished
    'trip_finished_title' => 'انتهت الرحلة',
    'trip_finished_message' => 'قام السائق بإنهاء الرحلة بنجاح وتوثيق خلو الحافلة.',
    
    // Alighted (Arrived)
    'student_alighted_school_title' => 'وصل طالبك للمدرسة',
    'student_alighted_school_message' => 'لقد وصل الطالب :student إلى المدرسة الآن بسلام.',
    'student_alighted_home_title' => 'وصل طالبك للمنزل',
    'student_alighted_home_message' => 'لقد نزل الطالب :student من الحافلة الآن عند المنزل بسلام.',

    // Incident Report
    'incident_title' => ':type - حافلة :bus',
    'incident_message' => 'تم الإبلاغ بواسطة (:role) :name. التفاصيل: :details',

    // School Attendance
    'school_attendance_title' => 'تحديث سجل الحضور المدرسي',
    'school_attendance_message' => 'تم تسجيل :student :status اليوم.',

    // Driver notifications
    'address_change_title' => 'تم تحديث موقع طالب',
    'address_change_message' => 'تم تحديث موقع منزل الطالب :student المرتبط بحافلتك.',

    // Chat
    'chat_message_title' => 'رسالة جديدة من :name',
    'chat_message_message' => ':message',

    // Holidays
    'holiday_announcement_title' => 'إجازة رسمية جديدة: :holiday',
    'holiday_announcement_message' => 'تم تسجيل إجازة من :start إلى :end',

    // Field Trips
    'field_trip_approved_title' => 'تمت الموافقة على الرحلة الميدانية ✅',
    'field_trip_approved_message' => 'وافقت الشركة على رحلة: :trip. التكلفة المقدرة: :cost ر.ع',
    'field_trip_rejected_title' => 'تم رفض طلب الرحلة الميدانية ❌',
    'field_trip_rejected_message' => 'تم رفض طلب رحلة: :trip من قبل الإدارة. :reason',
];
