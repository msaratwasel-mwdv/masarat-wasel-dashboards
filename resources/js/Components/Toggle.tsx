import { Switch } from '@headlessui/react';
import useTranslation from '@/hooks/useTranslation';

interface Props {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    label?: string;
    description?: string;
}

export default function Toggle({ enabled, onChange, label, description }: Props) {
    const { t, isRtl } = useTranslation();

    return (
        <div className={`flex items-center justify-between gap-4 p-4 rounded-2xl transition-all border ${
            enabled 
                ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' 
                : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700'
        }`}>
            <div className="flex flex-col gap-1">
                {label && (
                    <span className={`text-sm font-bold ${enabled ? 'text-emerald-900 dark:text-emerald-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        {label}
                    </span>
                )}
                {description && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {description}
                    </span>
                )}
            </div>
            <Switch
                checked={enabled}
                onChange={onChange}
                className={`${
                    enabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                } relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2`}
            >
                <span
                    aria-hidden="true"
                    className={`${
                        enabled ? (isRtl ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
            </Switch>
        </div>
    );
}
