import React from 'react';
import PlanOption from '@/Components/PlanOption';

interface Plan {
    id: number;
    name: string;
    name_ar?: string;
    name_en?: string;
    description?: string;
    description_ar?: string;
    description_en?: string;
    price_per_student: number;
    price_per_student_yearly?: number;
    currency?: string;
    badge_ar?: string;
    badge_en?: string;
    feature_list_ar: string[];
    feature_list_en: string[];
}

interface Props {
    plans: Plan[];
    selectedId: number | null;
    onSelect: (id: number) => void;
    billingCycle?: 'monthly' | 'yearly';
    lang?: 'ar' | 'en';
    theme?: 'light' | 'dark';
}

export default function PlanSelectorGrid({ plans, selectedId, onSelect, billingCycle = 'monthly', lang = 'ar', theme = 'light' }: Props) {
    const isAr = lang === 'ar';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans && plans.map((plan) => {
                const title = isAr ? (plan.name_ar || plan.name) : (plan.name_en || plan.name);
                const description = isAr ? (plan.description_ar || plan.description) : (plan.description_en || plan.description);
                const badge = isAr ? plan.badge_ar : plan.badge_en;
                const features = isAr ? plan.feature_list_ar : plan.feature_list_en;
                
                // For yearly, we show the monthly equivalent
                const rawPrice = billingCycle === 'yearly' ? plan.price_per_student_yearly : plan.price_per_student;
                const isAvailable = Number(rawPrice) > 0;
                
                const displayPrice = billingCycle === 'yearly' 
                    ? (plan.price_per_student_yearly || 0)
                    : plan.price_per_student;

                return (
                    <PlanOption
                        key={plan.id}
                        id={plan.id}
                        title={title}
                        description={description}
                        price={displayPrice}
                        isAvailable={isAvailable}
                        currency={plan.currency}
                        selected={selectedId === plan.id}
                        onClick={() => isAvailable && onSelect(plan.id)}
                        badge={badge}
                        features={features}
                        billingCycle={billingCycle}
                        lang={lang}
                        theme={theme}
                    />
                );
            })}
        </div>
    );
}
