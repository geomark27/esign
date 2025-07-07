// resources/js/Pages/Settings/General.tsx
import { Head, useForm, usePage }   from '@inertiajs/react';
import { route }                    from 'ziggy-js';
import { useEffect, useState }      from 'react';

import AppLayout       from '@/layouts/app-layout';
import SettingsLayout  from '@/layouts/settings/layout';
import HeadingSmall    from '@/components/heading-small';
import AppearanceTabs  from '@/components/appearance-tabs';
import { Label }       from '@/components/ui/label';
import { Input }       from '@/components/ui/input';
import { Button }      from '@/components/ui/button';

type InitialData = {
  appName: string;
  logoUrl: string | null;
};

export default function GeneralSettings() {
    const { initialData, flash } = usePage<{
        initialData: InitialData;
        flash: string;
    }>().props;

    // Formulario Inertia: solo appName y logo
    const form = useForm({
        appName: initialData.appName,
        logo: null as File | null,
    });

    // Preview de logo
    const [preview, setPreview] = useState<string | null>(initialData.logoUrl);
    const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.currentTarget.files?.[0] ?? null;
        form.setData('logo', file);
        setPreview(file ? URL.createObjectURL(file) : initialData.logoUrl);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(route('settings.general.update'), {
        preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'General settings', href: '/settings/general' }]}>
        <Head title="Ajustes generales" />

        <SettingsLayout>
            {flash && <div className="text-green-600">{flash}</div>}

            <div className="space-y-6">
            <HeadingSmall title="Ajustes generales" />

            <form onSubmit={submit} className="space-y-6 max-w-lg">
                {/* Application Name */}
                <div>
                <Label htmlFor="appName">Nombre de la aplicación</Label>
                <Input
                    id="appName"
                    name="appName"
                    value={form.data.appName}
                    onChange={e => form.setData('appName', e.currentTarget.value)}
                    className="mt-1 w-full"
                />
                {form.errors.appName && (
                    <p className="text-sm text-red-600 mt-1">{form.errors.appName}</p>
                )}
                </div>

                {/* Logo Upload */}
                <div>
                <Label htmlFor="logo">Logo</Label>
                <Input
                    id="logo"
                    name="logo"
                    type="file"
                    onChange={onLogoChange}
                    className="mt-1 w-full"
                />
                {form.errors.logo && (
                    <p className="text-sm text-red-600 mt-1">{form.errors.logo}</p>
                )}
                {preview && (
                    <img
                    src={preview}
                    alt="Logo preview"
                    className="mt-4 h-20 object-contain"
                    />
                )}
                </div>

                {/* Submit */}
                <Button type="submit" disabled={form.processing}>
                {form.processing ? 'Guardando...' : 'Guardar cambios'}
                </Button>
            </form>
            </div>
        </SettingsLayout>
        </AppLayout>
    );
}
