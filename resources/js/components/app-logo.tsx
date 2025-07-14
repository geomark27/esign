// resources/js/components/app-logo.tsx
import { usePage } from '@inertiajs/react';
import AppLogoIcon from './app-logo-icon';

type SharedSettings = {
    settings: {
        appName: string;
        logoPath: string | null; // Cambiar 'logoUrl' a 'logoPath'
    };
};

export default function AppLogo() {
    const { settings } = usePage<SharedSettings>().props;

    return (
        <>
        {settings.logoPath ? (
            <img
                src={settings.logoPath}
                alt={settings.appName}
                className="h-8 w-auto object-contain rounded-md"
            />
        ): (
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md">
            <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
            </div>
        )}
        <div className="ml-1 grid flex-1 text-left text-sm">
            <span className="mb-0.5 truncate leading-none font-semibold">
            {settings.appName}
            </span>
        </div>
        </>
    );
}
