// resources/js/components/app-logo.tsx
import { usePage } from '@inertiajs/react';
import AppLogoIcon from './app-logo-icon';

type SharedSettings = {
  settings: {
    appName: string;
    logoUrl: string | null;
  };
};

export default function AppLogo() {
  // 1) Sacamos settings.appName y settings.logoUrl de todos los props Inertia
  const { settings } = usePage<SharedSettings>().props;

  return (
    <>
      {settings.logoUrl ? (
        // 2) Si hay logoUrl, lo mostramos como <img>
        <img
          src={settings.logoUrl}
          alt={settings.appName}
          className="h-8 w-auto object-contain rounded-md"
        />
      ) : (
        // 3) Si no, caemos al SVG con su contenedor original
        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md">
          <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
        </div>
      )}

      {/* 4) Título al lado */}
      <div className="ml-1 grid flex-1 text-left text-sm">
        <span className="mb-0.5 truncate leading-none font-semibold">
          {settings.appName}
        </span>
      </div>
    </>
  );
}
