import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type Payment, type Signature, type Certification } from '@/types'; // Importa tus tipos base
import { FileText } from 'lucide-react';

interface CashPaymentDetail {
    id: number;
    received_amount: string;
    change_given: string;
}

interface BankPaymentDetail {
    id: number;
    type: 'deposit' | 'transfer';
    reference_number: string;
    transaction_date: string;
    origin_bank: string | null;
    receipt: string | null;
}

interface CardPaymentDetail {
    id: number;
    card_brand: string;
    last_four_digits: string;
    transaction_code: string | null;
    authorization_code: string | null;
    receipt: string | null;
}

interface PaymentWithDetails extends Payment {
    payment_date: string; // Aseguramos que este campo exista
    detailable_type: string; // Aseguramos que no sea opcional
    detailable: (CashPaymentDetail | BankPaymentDetail | CardPaymentDetail) & { receipt?: string | null };
    certification: Certification & { period?: Signature };
}

// --- Props que el modal recibirá ---
interface PaymentDetailsModalProps {
    payment: PaymentWithDetails | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

function isCardDetail(detail: any): detail is CardPaymentDetail {
    return detail && typeof detail.card_brand !== 'undefined';
}

function isBankDetail(detail: any): detail is BankPaymentDetail {
    return detail && typeof detail.reference_number !== 'undefined';
}

function isCashDetail(detail: any): detail is CashPaymentDetail {
    return detail && typeof detail.received_amount !== 'undefined';
}

// --- Componente del Modal ---
export function PaymentDetailsModal({ payment, isOpen, onOpenChange }: PaymentDetailsModalProps) {
    if (!payment) {
        return null; // No renderizar nada si no hay un pago seleccionado
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Detalles del Pago #{payment.id}</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                    {/* Detalles de Tarjeta */}
                    {isCardDetail(payment.detailable) && (
                        <div className="p-4 border rounded-lg bg-slate-50 space-y-1">
                            <h4 className="font-semibold mb-2">Pago con Tarjeta</h4>
                            <p><strong>Marca:</strong> {payment.detailable.card_brand}</p>
                            <p><strong>Terminación:</strong> **** {payment.detailable.last_four_digits}</p>
                            <p><strong>Cód. Transacción:</strong> {payment.detailable.transaction_code || 'N/A'}</p>
                            <p><strong>Cód. Autorización:</strong> {payment.detailable.authorization_code || 'N/A'}</p>
                        </div>
                    )}
                    {/* Detalles de Banco */}
                    {isBankDetail(payment.detailable) && (
                        <div className="p-4 border rounded-lg bg-slate-50 space-y-1">
                            <h4 className="font-semibold mb-2">Pago Bancario ({payment.detailable.type})</h4>
                            <p><strong>N° Referencia:</strong> {payment.detailable.reference_number}</p>
                            <p><strong>Fecha Transacción:</strong> {new Date(payment.detailable.transaction_date).toLocaleDateString('es-ES')}</p>
                            <p><strong>Banco Origen:</strong> {payment.detailable.origin_bank || 'N/A'}</p>
                        </div>
                    )}
                    {/* Detalles de Efectivo */}
                    {isCashDetail(payment.detailable) && (
                        <div className="p-4 border rounded-lg bg-slate-50 space-y-1">
                            <h4 className="font-semibold mb-2">Pago en Efectivo</h4>
                            <p><strong>Monto Recibido:</strong> ${parseFloat(payment.detailable.received_amount).toFixed(2)}</p>
                        </div>
                    )}
                    {/* Comprobante */}
                    {(isBankDetail(payment.detailable) || isCardDetail(payment.detailable)) && payment.detailable.receipt && (
                        <a href={`/storage/${payment.detailable.receipt}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="secondary" className="w-full"><FileText className="h-4 w-4 mr-2"/>Ver Comprobante</Button>
                        </a>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}