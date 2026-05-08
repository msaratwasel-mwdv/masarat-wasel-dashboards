import React from 'react';
import PlanOption from '@/Components/PlanOption';

interface Plan {
    id: number;
    name: string;
    description?: string;
    price_per_student: number;
    currency?: string;
    badge?: string;
    feature_list: string[];
}

interface Props {
    plans: Plan[];
    selectedId: number | null;
    onSelect: (id: number) => void;
}

export default function PlanSelectorGrid({ plans, selectedId, onSelect }: Props) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans && plans.map((plan) => (
                <PlanOption
                    key={plan.id}
                    id={plan.id}
                    title={plan.name}
                    description={plan.description}
                    price={plan.price_per_student}
                    currency={plan.currency}
                    selected={selectedId === plan.id}
                    onClick={() => onSelect(plan.id)}
                    isMostPopular={plan.badge !== null}
                    features={plan.feature_list}
                />
            ))}
        </div>
    );
}
