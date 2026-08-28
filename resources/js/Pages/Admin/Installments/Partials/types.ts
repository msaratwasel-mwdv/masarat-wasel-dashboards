export interface SchoolData {
  id: number;
  name: string;
  total_due: number;
  oldest_installment?: {
    id: number;
    amount: number;
    paid_amount: number;
    installment_number: number;
  } | null;
}

export interface PaymentTransaction {
  id: number;
  amount: number;
  payment_method: string;
  reference_number?: string;
  paid_at?: string;
  created_at?: string;
}

export interface InstallmentPayment {
  id: number;
  amount: number;
  payment_transaction?: PaymentTransaction;
}

export interface Installment {
  id: number;
  school_id: number;
  subscription_id: number;
  installment_number: number;
  amount: number;
  paid_amount: number;
  due_date: string;
  status: "pending" | "paid" | "partially_paid" | "overdue";
  receipt_path?: string | null;
  verification_status?: string;
  admin_note?: string;
  school?: {
    id: number;
    name: string;
    logo?: string;
    address?: string;
  };
  subscription?: {
    id: number;
    plan_id: number;
    start_date: string;
    end_date?: string;
    plan?: {
      id: number;
      name: string;
      name_ar?: string;
      name_en?: string;
      price_per_student?: number;
      currency?: string;
    };
  };
  installment_payments?: InstallmentPayment[];
}
