// هذا هو الملف الكامل والنهائي الذي يخدم كل صفحات المشروع

// التعريف الأول: شكل بيانات المستخدم
export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string;
    // ✅ قمنا بتعريف الصلاحية بشكل دقيق لمنع الأخطاء
    role: "admin" | "school_admin" | "driver" | "parent" | "teacher" | "student";
}

// التعريف الثاني: شكل بيانات الفصل الدراسي
export interface Classroom {
    id: number;
    name: string;
    grade_level?: string;
}

// ✅ التعريف الثالث (المهم جداً): المخطط الذي تستخدمه الصفحات العامة مثل Welcome.tsx
// هذا هو الجزء الذي كان محذوفاً وتسبب في الخطأ الأخير
export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>
> = T & {
    auth: {
        user: User;
    };
};
