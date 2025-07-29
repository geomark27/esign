// resources/js/components/app-sidebar.tsx - Con estilo de botón unificado

import { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { 
    NavigationMenu, 
    NavigationMenuItem, 
    NavigationMenuLink, 
    NavigationMenuList,
    navigationMenuTriggerStyle 
} from '@/components/ui/navigation-menu';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
    Collapsible, 
    CollapsibleContent, 
    CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { type NavItem } from '@/types';
import { BookOpen, Folder, LayoutGrid, Users, Shield, Menu, Settings, LogOut, ChevronDown, Book, List, Receipt, ChevronsUpDown, Banknote, ReceiptCent, ReceiptCentIcon, Handshake, File, DoorClosed, FileLock, Lock, ListCheck, Pen, PenLine, UserCheck, UserCog2, Users2, Users2Icon, LockKeyholeIcon, ListTodo, PenBoxIcon, Map } from 'lucide-react';
import { route } from 'ziggy-js';
import { cn } from '@/lib/utils';
import AppLogo from './app-logo';

export function AppSidebar() {
    const page = usePage();
    const { auth } = page.props as any;
    const user = auth.user;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const currentUrl = page.url || window.location.pathname || '';
    
    const isActiveRoute = (item: NavItem): boolean => {
        if (!currentUrl || typeof currentUrl !== 'string') {
            return false;
        }
        
        if (item.children && item.children.length > 0) {
            return item.children.some(child => child.href && currentUrl.startsWith(child.href));
        }
        
        if (item.href) {
            if (item.href === '/dashboard') {
                return currentUrl === '/dashboard' || currentUrl === '/' || currentUrl === '';
            }
            return currentUrl.startsWith(item.href);
        }

        return false;
    };

    const baseNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutGrid,
        },
    ];

    const adminNavItems: NavItem[] = [
        {
            title: 'Personas',
            icon: Users2Icon,
            children:[
                {
                    title: 'Usuarios',
                    href: '/admin/users',
                    icon: UserCog2,
                },
                {
                    title: 'Roles',
                    href: '/admin/roles',
                    icon: LockKeyholeIcon,
                },
            ]
        },
        {
            title: 'Planes',
            icon: ListTodo,
            children:[
                {
                    title: 'Firmas',
                    href: '/admin/signatures',
                    icon: PenBoxIcon,
                },
            ]
        },
        {
            title: 'Informes',
            icon: List,
            children: [
                {
                    title: 'Informe de pagos',
                    href: '/admin/reports/payments',
                    icon: null,
                },
                {
                    title: 'Informe de firmas',
                    href: '/admin/reports/signatures',
                    icon: null,
                },
            ],
        },
    ];

    const userNavItems: NavItem[] = [
        {
            title: 'Certificados',
            href: '/user/certifications',
            icon: BookOpen,
        },
        {
            title: 'Sectores',
            href: '/user/sectors',
            icon: Map,
        },
    ];

    const getNavItems = (): NavItem[] => {
        let navItems = [...baseNavItems];

        if (user?.roles?.some((role: any) => role.name === 'admin')) {
            navItems.push(...adminNavItems);
        } else {
            navItems.push(...userNavItems);
        }

        return navItems;
    };

    const mainNavItems = getNavItems();

    const handleLogout = () => {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            router.post(route('logout'));
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                {/* Logo */}
                <div className="flex items-center">
                    <Link href="/dashboard" className="flex items-center space-x-2">
                        <AppLogo />
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <NavigationMenu className="hidden md:flex">
                    <NavigationMenuList>
                        {mainNavItems.map((item) => (
                            <NavigationMenuItem key={item.title}>
                                {item.children ? (
                                    // Renderizar DropdownMenu para items con hijos
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className={cn(
                                                "flex items-center gap-2",
                                                isActiveRoute(item) 
                                                  ? "bg-accent text-accent-foreground" 
                                                  : "text-muted-foreground hover:text-foreground"
                                            )}>
                                                {item.icon && <item.icon className="h-4 w-4" />}
                                                <span>{item.title}</span>
                                                <ChevronDown className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                            {item.children.map((child) => (
                                                <DropdownMenuItem key={child.title} asChild>
                                                    <Link href={child.href!} className="flex items-center gap-2">
                                                        {child.icon && <child.icon className="mr-2 h-4 w-4" />}
                                                        {child.title}
                                                    </Link>
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : (
                                    // MODIFICADO: Renderizar Button como Link para items sin hijos
                                    <Button asChild variant="ghost" className={cn(
                                        "flex items-center gap-2",
                                        isActiveRoute(item)
                                            ? "bg-accent text-accent-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}>
                                        <Link href={item.href!}>
                                            {item.icon && <item.icon className="h-4 w-4" />}
                                            <span>{item.title}</span>
                                        </Link>
                                    </Button>
                                )}
                            </NavigationMenuItem>
                        ))}
                    </NavigationMenuList>
                </NavigationMenu>

                {/* User Menu & Mobile Menu */}
                <div className="flex items-center space-x-2">
                    {/* Desktop User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild className="hidden md:flex">
                            <Button variant="ghost" className="flex items-center space-x-2 px-3 py-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium">{user.name}</span>
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <div className="flex items-center justify-start gap-2 p-2">
                                <div className="flex flex-col space-y-1 leading-none">
                                    <p className="font-medium">{user.name}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/settings/profile" className="flex items-center">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Configuración
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                                <LogOut className="mr-2 h-4 w-4" />
                                Cerrar Sesión
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Mobile Menu */}
                    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                        <SheetTrigger asChild className="md:hidden">
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Abrir menú</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-72">
                            <SheetHeader>
                                <SheetTitle className="text-left">Menú</SheetTitle>
                            </SheetHeader>
                            
                            <div className="mt-6 flex flex-col space-y-6">
                                {/* User Info Mobile */}
                                <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{user.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                    </div>
                                </div>

                                {/* Navigation Mobile */}
                                <nav className="flex flex-col space-y-1">
                                    {mainNavItems.map((item) =>
                                        item.children ? (
                                            <Collapsible key={item.title}>
                                                <CollapsibleTrigger className={cn(
                                                    "flex w-full items-center justify-between space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                                    isActiveRoute(item) ? "bg-accent text-accent-foreground" : ""
                                                )}>
                                                    <div className="flex items-center gap-3">
                                                      {item.icon && <item.icon className="h-4 w-4" />}
                                                      <span>{item.title}</span>
                                                    </div>
                                                    <ChevronsUpDown className="h-4 w-4" />
                                                </CollapsibleTrigger>
                                                <CollapsibleContent className="py-1 pl-8">
                                                    {item.children.map((child) => (
                                                        <Link
                                                            key={child.title}
                                                            href={child.href!}
                                                            className={cn(
                                                                "flex items-center space-x-3 py-2 rounded-md text-sm font-medium transition-colors",
                                                                child.href && isActiveRoute(child)
                                                                    ? "text-foreground font-semibold"
                                                                    : "text-muted-foreground hover:text-foreground"
                                                            )}
                                                            onClick={() => setIsMobileMenuOpen(false)}
                                                        >
                                                            {child.icon && <child.icon className="h-4 w-4" />}
                                                            <span>{child.title}</span>
                                                        </Link>
                                                    ))}
                                                </CollapsibleContent>
                                            </Collapsible>
                                        ) : (
                                            <Link
                                                key={item.title}
                                                href={item.href!}
                                                className={cn(
                                                    "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                                    item.href && isActiveRoute(item)
                                                        ? "bg-accent text-accent-foreground"
                                                        : "hover:bg-accent hover:text-accent-foreground"
                                                )}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                {item.icon && <item.icon className="h-4 w-4" />}
                                                <span>{item.title}</span>
                                            </Link>
                                        )
                                    )}
                                </nav>

                                {/* Footer nav items en mobile */}
                                <div className="border-t pt-6 space-y-2">
                                    <Link
                                        href="/settings/profile"
                                        className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <Settings className="h-4 w-4" />
                                        <span>Configuración</span>
                                    </Link>
                                    
                                    <button
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            handleLogout();
                                        }}
                                        className="flex w-full items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span>Cerrar Sesión</span>
                                    </button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}