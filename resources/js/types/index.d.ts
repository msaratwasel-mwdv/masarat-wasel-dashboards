export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string;
    role: "admin" | "school_admin" | "driver" | "parent" | "teacher" | "student";
    school_id?: number; // ⬅️ أضف هذا إذا كان موجوداً
}

export interface Guardian {
    id: number;
    name: string;
    name_en?: string;
    national_id?: string;
    phone?: string;
    email?: string;
    address?: string;
    home_number?: string;
    image?: string;
    school_id?: number; // ⬅️ أضف هذا
}

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