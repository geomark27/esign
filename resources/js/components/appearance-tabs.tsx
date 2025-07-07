// resources/js/components/appearance-tabs.tsx
import { Appearance, useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { LucideIcon, Monitor, Moon, Sun } from 'lucide-react';
import { HTMLAttributes } from 'react';

export default function AppearanceTabs({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    const tabs: { value: Appearance; icon: LucideIcon; label: string }[] = [
        { value: 'light',  icon: Sun,     label: 'Light'  },
        { value: 'dark',   icon: Moon,    label: 'Dark'   },
        { value: 'system', icon: Monitor, label: 'System' },
    ];

    return (
        <div
        className={cn(
            'inline-flex w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
            className
        )}
        {...props}
        >
        {tabs.map(({ value, icon: Icon, label }) => {
            const active = appearance === value;
            return (
            <button
                key={value}
                onClick={() => updateAppearance(value)}
                className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 py-2 px-4 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                active
                    ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                    : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                )}
            >
                <span>{label}</span>
                <Icon className="h-5 w-5" />
            </button>
            );
        })}
        </div>
    );
}
