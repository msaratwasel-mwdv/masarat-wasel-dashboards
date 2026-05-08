<?php

namespace App\Policies;

use App\Models\Student;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class StudentPolicy
{
    /**
     * القاعدة: هل يمكن للمستخدم (مدير المدرسة) عرض/تعديل/حذف هذا الطالب؟
     * الجواب: نعم، إذا كان معرف مدرسة المدير يطابق معرف مدرسة الطالب.
     */
    private function belongsToSchool(User $user, Student $student): bool
    {
        // جلب سجل التحاق الطالب الحالي
        $enrollment = $student->currentEnrollment;

        // إذا لم يكن للطالب سجل التحاق، أو أن المستخدم ليس له مدرسة، امنعه
        if (!$enrollment || !$user->getSchoolId()) {
            return false;
        }

        // الحصول على معرف المدرسة من خلال الفصل
        $schoolId = $enrollment->classroom?->school_id ?? $enrollment->school_id;

        // إذا تطابقت مدرسة المدير مع مدرسة الطالب، اسمح له
        return $user->getSchoolId() === $schoolId;
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


