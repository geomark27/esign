// resources/js/Pages/Auth/Login.tsx
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, Eye, EyeOff } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthSimpleLayout from '@/layouts/auth/auth-simple-layout';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    // Estado para mostrar/ocultar contraseña
    const [showPassword, setShowPassword] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
        onFinish: () => reset('password'),
        });
    };

    return (
        <AuthSimpleLayout
        title="Esign"
        description="Securely manage your electronic signatures"
        >
        <Head title="Log in" />

        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden">
            {/* CARD HEADER */}
            <div className="bg-teal-600 px-6 py-4">
            <h2 className="text-center text-lg font-semibold text-white">Log in</h2>
            </div>

            {/* CARD BODY */}
            <div className="px-6 py-8 space-y-6">
            {status && (
                <div className="text-center text-sm font-medium text-green-600">
                {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-6">
                {/* Email */}
                <div className="space-y-1">
                <Label htmlFor="email">Email address</Label>
                <Input
                    id="email"
                    type="email"
                    required
                    autoFocus
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1 focus:ring-teal-500 focus:border-teal-500"
                />
                <InputError message={errors.email} className="mt-1" />
                </div>

                {/* Password */}
                <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                    <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    placeholder="••••••••"
                    className="focus:ring-teal-500 focus:border-teal-500 pr-10"
                    />
                    <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                    >
                    {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                    ) : (
                        <Eye className="h-5 w-5" />
                    )}
                    </button>
                </div>
                <InputError message={errors.password} className="mt-1" />
                </div>

                {/* Remember */}
                <div className="flex items-center space-x-2">
                <Checkbox
                    id="remember"
                    checked={data.remember}
                    onClick={() => setData('remember', !data.remember)}
                />
                <Label htmlFor="remember" className="text-sm">
                    Remember me
                </Label>
                </div>

                {/* Submit */}
                <Button
                type="submit"
                className="w-full flex items-center justify-center bg-teal-600 hover:bg-teal-700"
                disabled={processing}
                >
                {processing && (
                    <LoaderCircle className="h-5 w-5 animate-spin mr-2 text-white" />
                )}
                <span className="text-white">Log in</span>
                </Button>
            </form>
            </div>
        </div>
        </AuthSimpleLayout>
    );
}
