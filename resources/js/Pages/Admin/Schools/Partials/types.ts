export interface SchoolAdminUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  national_id?: string;
  address?: string;
  image?: string;
}

export interface SchoolAdminRelation {
  id: number;
  user_id: number;
  school_id: number;
  user?: SchoolAdminUser;
}

export interface PlanData {
  id: number;
  name: string;
  name_ar?: string;
  name_en?: string;
  description?: string;
  description_ar?: string;
  description_en?: string;
  price_per_student?: number;
  price_per_student_yearly?: number;
  max_buses?: number | null;
  currency?: string;
  is_active?: boolean;
  has_driver_app?: boolean;
  has_parent_app?: boolean;
  has_supervisor_app?: boolean;
  has_reports?: boolean;
  badge_ar?: string | null;
  badge_en?: string | null;
  sort_order?: number;
}

export interface InstallmentData {
  id: number;
  installment_number: number;
  amount: number;
  paid_amount: number;
  due_date: string;
  status: string;
  admin_note?: string;
}

export interface SubscriptionData {
  id: number;
  school_id: number;
  plan_id: number;
  status: string;
  start_date: string;
  end_date: string;
  final_price: number;
  notes?: {
    billing_type?: string;
    student_count?: number;
    price_per_student?: number;
    installments_count?: number;
    custom_notes?: string;
  };
  plan?: PlanData;
  installments?: InstallmentData[];
}

export interface School {
  id: number;
  name: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  has_transport?: number | boolean;
  has_attendance?: number | boolean;
  plan_id?: number | null;
  logo?: string;
  buses_count?: number;
  enrollments_count?: number;
  max_buses?: number | null;
  plan?: PlanData;
  current_subscription?: SubscriptionData | null;
  school_admins?: SchoolAdminRelation[];
}
