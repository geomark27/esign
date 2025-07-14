// components/PaymentModal.tsx
import React, { ReactNode, useEffect, useRef } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { PaymentMethod } from '@/types';
import { Paperclip, CheckCircle } from 'lucide-react'; // 2. IMPORTAR ÍCONOS

interface PaymentModalProps {
    certificationId: number;
    periodPrice: number;
    methods: PaymentMethod[];
    cardBrands: string[]; // NUEVO: Prop para las marcas de tarjeta
    allBanks: string[]; // NUEVO: Prop para las marcas de tarjeta
    onSuccess?: () => void;
    children?: ReactNode;
}

// IDs de los métodos de pago que requieren campos adicionales
const BANK_PAYMENT_IDS = [2, 3]; // Asumiendo que 2=Depósito, 3=Transferencia
const CARD_PAYMENT_IDS = [4, 5]; // Asumiendo que 4=Tarjeta de Crédito, 5=Tarjeta de Débito

export default function PaymentModal({
    certificationId,
    periodPrice,
    methods,
    cardBrands, // NUEVO
    allBanks, // NUEVO
    onSuccess,
    children,
}: PaymentModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm({
        // --- Campos base del pago ---
        certification_id: certificationId,
        amount: '',
        payment_date: new Date().toISOString().substring(0, 10),
        method_id: methods && methods.length > 0 ? String(methods[0].id) : '',
        notes: '',

        // --- Campos para Detalles de Pago Bancario ---
        destination_bank_account: '',
        reference_number: '',
        transaction_date: '',
        origin_bank: '',

        // --- Campos para Detalles de Pago con Tarjeta ---
        transaction_code: '',
        authorization_code: '',
        card_brand: '', // Este campo ahora será manejado por un <Select>
        last_four_digits: '',
        installments: '',

        //comprobante para banco y tarjeta
        receipt: null as File | null,
    });

    // Efecto para limpiar los campos de detalle cuando cambia el método de pago
    useEffect(() => {
        form.reset(
            'destination_bank_account',
            'reference_number',
            'transaction_date',
            'origin_bank',
            'transaction_code',
            'authorization_code',
            'card_brand',
            'last_four_digits',
            'installments'
        );
    }, [form.data.method_id]);

    // Tu función submit en el frontend ya está bien.
    // No necesitas cambiarla.

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const amount = parseFloat(form.data.amount);
        if (isNaN(amount) || amount != periodPrice) {
            toast.error('El monto a pagar no coincide con el precio del plan.');
            form.setError('amount', 'El monto a pagar no coincide con el precio del plan.');
            return;
        }

        form.post(
            route('user.certifications.payments.store', certificationId),
            {
                forceFormData: true,
                preserveScroll: true,
                // Esta lógica se activa con el redirect()->back()->with('success', ...)
                onSuccess: () => {
                    toast.success('Pago registrado correctamente.');
                    window.location.reload();
                    onSuccess?.(); // Esto puede cerrar el modal o actualizar la lista de pagos
                },
                // Esta lógica se activa con el throw ValidationException::withMessages(...)
                onError: (errors) => {
                    const errorKeys = Object.keys(errors);
                    if (errorKeys.length > 0) {
                        // Muestra el primer mensaje de error que llegue del backend
                        const firstErrorMessage = errors[errorKeys[0]];
                        toast.error(firstErrorMessage);
                    } else {
                        // Fallback para errores 500 inesperados
                        toast.error('Ocurrió un error inesperado en el servidor.');
                    }
                },
            }
        );
    }

    const selectedMethodId = Number(form.data.method_id);
    const showReceiptField = BANK_PAYMENT_IDS.includes(selectedMethodId) || CARD_PAYMENT_IDS.includes(selectedMethodId);

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
                <form onSubmit={submit} className="space-y-4 py-4">
                    {/* --- Campos Comunes --- */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="period_price">Monto a pagar*</Label>
                            <Input
                                id="period_price"
                                type="number"
                                value={Number(periodPrice).toFixed(2)}
                                readOnly
                                disabled
                                className="bg-slate-100 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <Label htmlFor="amount">Monto pagado*</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.1"
                                value={form.data.amount}
                                onChange={e => form.setData('amount', e.currentTarget.value)}
                                required
                            />
                            {form.errors.amount && <p className="text-sm text-red-500 mt-1">{form.errors.amount}</p>}
                        </div>
                        <div>
                            <Label htmlFor="payment_date">Fecha de Pago*</Label>
                            <Input
                                id="payment_date"
                                type="date"
                                value={form.data.payment_date}
                                onChange={e => form.setData('payment_date', e.currentTarget.value)}
                                required
                            />
                            {form.errors.payment_date && <p className="text-sm text-red-500 mt-1">{form.errors.payment_date}</p>}
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="method">Método de Pago*</Label>
                        <Select value={String(form.data.method_id)} onValueChange={val => form.setData('method_id', val)} required>
                            <SelectTrigger id="method">
                                {/* El placeholder solo se mostrará si la lista de métodos está vacía */}
                                <SelectValue placeholder="Selecciona un método" />
                            </SelectTrigger>
                            <SelectContent>
                                {methods.map(m => (
                                    <SelectItem key={m.id} value={String(m.id)}>{m.display_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {form.errors.method_id && <p className="text-sm text-red-500 mt-1">{form.errors.method_id}</p>}
                    </div>

                    {/* --- Campos Dinámicos para Pagos Bancarios --- */}
                    {BANK_PAYMENT_IDS.includes(selectedMethodId) && (
                        <div className="p-4 border rounded-lg space-y-4 bg-slate-50">
                            <h3 className="font-semibold text-slate-700">Detalles del Pago Bancario</h3>
                             <div className="grid grid-cols-2 gap-4">
                                {/* ... campos bancarios sin cambios ... */}
                                <div>
                                    <Label htmlFor="destination_bank_account">Cuenta Destino</Label>
                                    <Input id="destination_bank_account" value={form.data.destination_bank_account} onChange={e => form.setData('destination_bank_account', e.target.value)} />
                                    {form.errors.destination_bank_account && <p className="text-sm text-red-500 mt-1">{form.errors.destination_bank_account}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="reference_number">N° Referencia</Label>
                                    <Input id="reference_number" value={form.data.reference_number} onChange={e => form.setData('reference_number', e.target.value)} />
                                    {form.errors.reference_number && <p className="text-sm text-red-500 mt-1">{form.errors.reference_number}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="transaction_date">Fecha Transacción</Label>
                                    <Input id="transaction_date" type="date" value={form.data.transaction_date} onChange={e => form.setData('transaction_date', e.target.value)} />
                                    {form.errors.transaction_date && <p className="text-sm text-red-500 mt-1">{form.errors.transaction_date}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="origin_bank">Banco Origen</Label>
                                    <Select
                                        value={form.data.origin_bank}
                                        onValueChange={val => form.setData('origin_bank', val)}
                                    >
                                        <SelectTrigger id="origin_bank">
                                            <SelectValue placeholder="Selecciona una banco" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(allBanks).map(([slug, displayName]) => (
                                                <SelectItem key={slug} value={slug}>
                                                    {displayName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.errors.origin_bank && <p className="text-sm text-red-500 mt-1">{form.errors.origin_bank}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- Campos Dinámicos para Pagos con Tarjeta --- */}
                    {CARD_PAYMENT_IDS.includes(selectedMethodId) && (
                        <div className="p-4 border rounded-lg space-y-4 bg-slate-50">
                             <h3 className="font-semibold text-slate-700">Detalles del Pago con Tarjeta</h3>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="transaction_code">Código Transacción</Label>
                                    <Input id="transaction_code" value={form.data.transaction_code} onChange={e => form.setData('transaction_code', e.target.value)} />
                                    {form.errors.transaction_code && <p className="text-sm text-red-500 mt-1">{form.errors.transaction_code}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="authorization_code">Código Autorización</Label>
                                    <Input id="authorization_code" value={form.data.authorization_code} onChange={e => form.setData('authorization_code', e.target.value)} />
                                    {form.errors.authorization_code && <p className="text-sm text-red-500 mt-1">{form.errors.authorization_code}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="card_brand">Marca Tarjeta</Label>
                                    <Select
                                        value={form.data.card_brand}
                                        onValueChange={val => form.setData('card_brand', val)}
                                    >
                                        <SelectTrigger id="card_brand">
                                            <SelectValue placeholder="Selecciona una marca" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(cardBrands).map(([slug, displayName]) => (
                                                <SelectItem key={slug} value={slug}>
                                                    {displayName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.errors.card_brand && <p className="text-sm text-red-500 mt-1">{form.errors.card_brand}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="last_four_digits">Últimos 4 Dígitos</Label>
                                    <Input
                                        id="last_four_digits"
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={4}
                                        pattern="\d{4}"
                                        value={form.data.last_four_digits}
                                        onChange={e => {
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                                            form.setData('last_four_digits', value);
                                        }}
                                        required
                                    />
                                    {form.errors.last_four_digits && <p className="text-sm text-red-500 mt-1">{form.errors.last_four_digits}</p>}
                                </div>
                                 <div className="col-span-2">
                                    <Label htmlFor="installments">Cuotas</Label>
                                    <Input id="installments" type="number" value={form.data.installments} onChange={e => form.setData('installments', e.target.value)} />
                                    {form.errors.installments && <p className="text-sm text-red-500 mt-1">{form.errors.installments}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {showReceiptField && (
                        <div className="p-4 border rounded-lg space-y-2 bg-slate-50">
                            <Label htmlFor="receipt">Comprobante de Pago</Label>
                            
                            {/* Input de archivo oculto */}
                            <Input
                                id="receipt"
                                type="file"
                                ref={fileInputRef} // Asignar la referencia
                                className="hidden"
                                onChange={(e) => form.setData('receipt', e.target.files ? e.target.files[0] : null)}
                            />

                            {/* Botón personalizado para activar el input de archivo */}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()} // Activa el input oculto
                                className="w-full"
                            >
                                <Paperclip className="h-4 w-4 mr-2" />
                                {form.data.receipt ? 'Cambiar archivo' : 'Seleccionar archivo'}
                            </Button>
                            
                            {/* Mostrar el nombre del archivo seleccionado */}
                            {form.data.receipt && (
                                <div className="flex items-center text-sm text-green-600 mt-2">
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    <span>{form.data.receipt.name}</span>
                                </div>
                            )}

                            {form.errors.receipt && <p className="text-sm text-red-500 mt-1">{form.errors.receipt}</p>}
                        </div>
                    )}

                    {/* --- Campo de Notas (General) --- */}
                    <div>
                        <Label htmlFor="notes">Notas (Opcional)</Label>
                        <Textarea
                            id="notes"
                            value={form.data.notes}
                            onChange={e => form.setData('notes', e.currentTarget.value)}
                        />
                        {form.errors.notes && <p className="text-sm text-red-500 mt-1">{form.errors.notes}</p>}
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Guardando...' : 'Guardar Pago'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
