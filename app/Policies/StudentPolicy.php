<?php

namespace App\Policies;

use App\Models\Student;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class StudentPolicy
{
    /**
     * القاعدة:
     * هل يمكن للمستخدم (مدير المدرسة) عرض/تعديل/حذف هذا الطالب؟
     * الجواب: نعم، إذا كان معرف مدرسة المدير يطابق معرف مدرسة الطالب.
     */
    private function belongsToSchool(User $user, Student $student): bool
    {
        $userSchoolId = $user->getSchoolId();

        // إذا لم يكن للمستخدم مدرسة، امنعه
        if (!$userSchoolId) {
            return false;
        }

        // جلب سجل التحاق الطالب الحالي
        $enrollment = $student->currentEnrollment;

        // إذا لم يكن للطالب سجل التحاق، امنعه
        if (!$enrollment) {
            return false;
        }

        // الحصول على معرف المدرسة من خلال الفصل أو enrollment
        $schoolId = $enrollment->classroom?->school_id ?? $enrollment->school_id;

        // مقارنة بعد التحويل لـ int لتجنب مشاكل PostgreSQL
        return (int) $userSchoolId === (int) $schoolId;
    }

    /**
     * صلاحية عرض بيانات طالب معين
     */
    public function view(User $user, Student $student): bool
    {
        return $this->belongsToSchool($user, $student);
    }

    /**
     * صلاحية تعديل بيانات طالب معين
     */
    public function update(User $user, Student $student): bool
    {
        return $this->belongsToSchool($user, $student);
    }

    /**
     * صلاحية حذف طالب معين
     */
    public function delete(User $user, Student $student): bool
    {
        return $this->belongsToSchool($user, $student);
    }
}