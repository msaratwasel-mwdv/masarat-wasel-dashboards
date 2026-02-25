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
    role: "admin" | "school_admin" | "driver" | "parent" | "teacher" | "student";
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

export interface Supervisor {
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

export interface Student {
    id: number;
    full_name: string;
    student_code: string;
    national_id?: string;
    gender?: string; // ⬅️ أضف هذا
    image?: string;
    is_active: boolean;
    guardian_id?: number;
    supervisor_id?: number;
    school_id?: number; // ⬅️ أضف هذا
    guardian?: Guardian | null;
    supervisor?: Supervisor | null;
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
