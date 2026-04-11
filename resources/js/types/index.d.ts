export interface School {
    id: number;
    name: string;
    logo?: string;
    location?: string;
    status: "Active" | "Inactive";
}

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string;
    role: "admin" | "school_admin" | "driver" | "parent" | "teacher" | "student" | "assistant" | "field_supervisor";
    school_id?: number;
    school?: School;
    // حقول ولي الأمر (متاحة عندما يكون role = parent)
    name_en?: string;
    national_id?: string;
    phone?: string;
    address?: string;
    home_number?: string;
    preferred_language?: "ar" | "en";
    image?: string;
}

// Guardian هو الآن نفس User (للتوافق مع الكود القديم)
export type Guardian = User;

export interface Assistant {
    id: number;
    name: string;
    email?: string;
    phone?: string;
}

export interface Classroom {
    id: number;
    name: string;
    grade_level?: string;
    school_id?: number; // ⬅️ أضف هذا
}

export interface Route {
    id: number;
    name: string;
    code?: string;
    description?: string;
}

export interface Student {
    id: number;
    full_name: string;
    student_code: string;
    national_id?: string;
    gender?: string;
    image?: string;
    is_active: boolean;
    guardian_id?: number;
    assistant_id?: number;
    forth_route_id?: number; // ⬅️ أضف هذا
    back_route_id?: number;  // ⬅️ أضف هذا
    school_id?: number;
    guardian?: Guardian | null;
    assistant?: Assistant | null;
    forth_route?: Route | null; // ⬅️ أضف هذا
    back_route?: Route | null;  // ⬅️ أضف هذا
    current_enrollment: {
        classroom: Classroom;
    } | null;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>
> = T & {
    auth: {
        user: User;
    };
}
