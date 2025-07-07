// components/PaymentModal.tsx
import React, { ReactNode } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { PaymentMethod } from '@/types';

interface PaymentModalProps {
    certificationId: number;
    methods: PaymentMethod[];
    onSuccess?: () => void;
    children?: ReactNode; // Permite trigger personalizado
}

export default function PaymentModal({
    certificationId,
    methods,
    onSuccess,
    children,
}: PaymentModalProps) {
    const form = useForm({
        certification_id: certificationId,
        amount: '',
        payment_date: new Date().toISOString().substring(0, 10),
        method: '',
        notes: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post(
        route('user.certifications.payments.store', certificationId),
        {
            preserveScroll: true,
            onSuccess: () => {
            toast.success('Pago registrado correctamente.');
            form.reset();
            onSuccess?.();
            },
            onError: () => toast.error('Error al registrar el pago.'),
        }
        );
    }

    return (
        <Dialog>
        <DialogTrigger asChild>
            {children || (
            <Button variant="outline" size="sm" className="flex items-center gap-2">
                Registrar Pago
            </Button>
            )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
            <DialogTitle>Registrar Nuevo Pago</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
            <div>
                <Label htmlFor="amount">Monto</Label>
                <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                value={form.data.amount}
                onChange={e => form.setData('amount', e.currentTarget.value)}
                />
            </div>
            <div>
                <Label htmlFor="payment_date">Fecha de Pago</Label>
                <Input
                id="payment_date"
                name="payment_date"
                type="date"
                value={form.data.payment_date}
                onChange={e => form.setData('payment_date', e.currentTarget.value)}
                />
            </div>
            <div>
                <Label htmlFor="method">Método</Label>
                <Select
                value={form.data.method}
                onValueChange={val => form.setData('method', val)}
                >
                <SelectTrigger id="method">
                    <SelectValue placeholder="Selecciona un método" />
                </SelectTrigger>
                <SelectContent>
                    {methods.map(m => (
                    <SelectItem key={m.id} value={m.name}>
                        {m.display_name}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                id="notes"
                name="notes"
                value={form.data.notes}
                onChange={e => form.setData('notes', e.currentTarget.value)}
                />
            </div>
            <DialogFooter>
                <Button type="submit" disabled={form.processing}>
                Guardar
                </Button>
            </DialogFooter>
            </form>
        </DialogContent>
        </Dialog>
    );
}
