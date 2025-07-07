// resources/js/layouts/SettingsLayout.tsx
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface NavItem {
    title: string;
    href: string;
    icon?: React.ElementType | null;
    adminOnly?: boolean;
}

const sidebarNavItems: NavItem[] = [
    { title: 'Perfil', href: '/settings/profile', icon: null },
    { title: 'Password', href: '/settings/password', icon: null },
    { title: 'Apariencia', href: '/settings/appearance', icon: null },
    {
        title: 'Ajustes generales',
        href: '/settings/general',
        icon: null,
        adminOnly: true, // ← solo admins
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    // SSR: no renderizar en servidor
    if (typeof window === 'undefined') {
        return null;
    }

    // Leer usuario y roles desde Inertia
    const { auth } = usePage<{ auth: { user: { roles: { name: string }[] } } }>().props;
    const isAdmin = auth.user.roles.some(role => role.name === 'admin');

    // Filtrar items según rol
    const itemsToShow = sidebarNavItems.filter(item => !item.adminOnly || isAdmin);

    const currentPath = window.location.pathname;

    return (
        <div className="px-4 py-6">
            <Heading title="Settings" description="Manage your profile and account settings" />

            <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
                <aside className="w-full max-w-xl lg:w-48">
                    <nav className="flex flex-col space-y-1">
                        {itemsToShow.map((item, index) => (
                        <Button
                            key={`${item.href}-${index}`}
                            size="sm"
                            variant="ghost"
                            asChild
                            className={cn('w-full justify-start', {
                            'bg-muted': currentPath === item.href,
                            })}
                        >
                            <Link href={item.href} prefetch>
                            {item.title}
                            </Link>
                        </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 md:hidden" />

                <div className="flex-1 md:max-w-2xl">
                    <section className="max-w-xl space-y-12">{children}</section>
                </div>
            </div>
        </div>
    );
}
