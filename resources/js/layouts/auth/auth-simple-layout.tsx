// resources/js/layouts/auth/auth-simple-layout.tsx
import { PropsWithChildren } from 'react';
import { usePage, Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';

interface AuthLayoutProps {
  title: string;
  description?: string;
}

type SharedSettings = {
  settings: {
    appName: string;
    logoUrl: string | null;
  };
};

export default function AuthSimpleLayout({
  children,
  title,
  description,
}: PropsWithChildren<AuthLayoutProps>) {
  const { settings } = usePage<SharedSettings>().props;

  return (
    <div
      className="
        bg-gradient-to-br
        from-teal-100 via-white to-teal-100
        dark:from-gray-900 dark:via-gray-800 dark:to-gray-900
        min-h-screen flex items-center justify-center p-6
      "
    >
      <div className="max-w-md w-full space-y-8">
        {/* HEADER */}
        <div className="flex flex-col items-center">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.appName}
              className="h-12 mb-4 object-contain rounded"
            />
          ) : (
            <AppLogoIcon className="h-12 w-12 text-teal-600 mb-4" />
          )}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>

        {/* FORM CARD */}
        {children}
      </div>
    </div>
  );
}
