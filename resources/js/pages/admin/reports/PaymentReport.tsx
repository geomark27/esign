import { useState } from 'react';
import { Head, router } from '@inertiajs/react';

// --- Tipos ---
import { type PageProps, type Payment, type Certification, type Signature } from '@/types';

// --- Layout y Componentes UI ---
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Search, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';

// --- Componente de Modal Personalizado ---
import { PaymentDetailsModal } from '@/components/PaymentDetailsModal';

// --- DEFINICIÓN DE TIPOS ESPECIALIZADOS ---

interface Paginated<T> {
    data: T[];
    from: number;
    to: number;
    total: number;
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

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
    payment_date: string;
    detailable_type: string;
    detailable: (CashPaymentDetail | BankPaymentDetail | CardPaymentDetail) & { receipt?: string | null };
    certification: Certification & { period?: Signature };
}

interface PaymentIndexProps extends PageProps {
    payments: Paginated<PaymentWithDetails>;
    filters: {
        search?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
    };
    statusOptions: Record<string, string>;
}


// --- COMPONENTE PRINCIPAL ---
export default function PaymentsIndex({ payments, filters, statusOptions }: PaymentIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const [selectedPayment, setSelectedPayment] = useState<PaymentWithDetails | null>(null);

    const handleFilter = () => {
        router.get(route('admin.reports.payments'), {
            search: search || undefined,
            status: status || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
        }, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        setSearch(''); setStatus(''); setDateFrom(''); setDateTo('');
        router.get(route('admin.reports.payments'));
    };

    const goToPage = (url: string | null) => {
        if (!url) return;
        router.get(url, { preserveState: true, preserveScroll: true });
    };

    const getPaymentMethodName = (detailableType: string): string => {
        if (detailableType.includes('Cash')) return 'Efectivo';
        if (detailableType.includes('Card')) return 'Tarjeta';
        if (detailableType.includes('Bank')) return 'Banco';
        return 'Desconocido';
    };

    const exportToExcel = () => {
        // Creamos un objeto con los filtros actuales
        const queryParams = new URLSearchParams({
            search: search || '',
            status: status === 'all' ? '' : status || '',
            date_from: dateFrom || '',
            date_to: dateTo || '',
        }).toString();

        // Redirigimos el navegador a la URL de exportación con los filtros.
        // El navegador iniciará la descarga del archivo automáticamente.
        window.location.href = route('admin.reports.export.payments') + '?' + queryParams;
    };

    return (
        <AppLayout>
            <Head title="Historial de Pagos" />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 sm:p-6">
                <h1 className="text-2xl font-bold tracking-tight">Historial de Pagos</h1>

                {/* Filtros */}
                <Card className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Buscar</label>
                            <Input placeholder="Nombre o N° Certificación..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleFilter()} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Estado</label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger><SelectValue placeholder="Todos los estados" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {Object.entries(statusOptions).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Desde</label>
                            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Hasta</label>
                            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                        </div>
                        <div className="lg:col-span-4 flex justify-end space-x-2 mt-2">
                            <Button onClick={handleFilter}><Search className="h-4 w-4 mr-2" />Filtrar</Button>
                            <Button variant="outline" onClick={clearFilters}>Limpiar</Button>
                            <Button variant="secondary" onClick={exportToExcel}>
                                <FileDown className="h-4 w-4 mr-2" /> Exportar
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Tabla de Pagos */}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b">
                                <tr>
                                    <th className="text-center p-4 font-medium">Cliente / Certificación</th>
                                    <th className="text-center p-4 font-medium">Monto</th>
                                    <th className="text-center p-4 font-medium">Método</th>
                                    <th className="text-center p-4 font-medium">Estado</th>
                                    <th className="text-center p-4 font-medium">Fecha</th>
                                    <th className="text-center p-4 font-medium">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.data.length > 0 ? (
                                    payments.data.map((payment) => (
                                        <tr key={payment.id} className="border-b hover:bg-gray-50">
                                            <td className="p-4 text-center text-gray-700">
                                                <div className="font-medium">{payment.certification.applicantName}</div>
                                                <div className="text-sm text-gray-500">{payment.certification.certification_number || 'N/A'}</div>
                                            </td>
                                            <td className="p-4 text-center text-gray-700">${parseFloat(payment.amount).toFixed(2)}</td>
                                            <td className="p-4 text-center text-gray-700">{getPaymentMethodName(payment.detailable_type)}</td>
                                            <td className="p-4 text-center text-gray-700"><Badge>{statusOptions[payment.status]}</Badge></td>
                                            <td className="p-4 text-center text-gray-700">{new Date(payment.payment_date).toLocaleDateString('es-ES')}</td>
                                            <td className="p-4 text-center text-gray-700">
                                                <Button variant="outline" size="sm" onClick={() => setSelectedPayment(payment)}>
                                                    <Eye className="h-4 w-4 mr-1" /> Ver Detalles
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">No se encontraron pagos que coincidan con los filtros.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Paginación */}
                    {payments.data.length > 0 && (
                        <div className="flex items-center justify-between p-4 border-t">
                             <div className="text-sm text-gray-500">Mostrando {payments.from} a {payments.to} de {payments.total}</div>
                             <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm" onClick={() => goToPage(payments.prev_page_url)} disabled={!payments.prev_page_url}><ChevronLeft className="h-4 w-4" /> Anterior</Button>
                                <Button variant="outline" size="sm" onClick={() => goToPage(payments.next_page_url)} disabled={!payments.next_page_url}>Siguiente <ChevronRight className="h-4 w-4" /></Button>
                             </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Uso del componente de modal dedicado */}
            <PaymentDetailsModal 
                payment={selectedPayment}
                isOpen={!!selectedPayment}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        setSelectedPayment(null);
                    }
                }}
            />
        </AppLayout>
    );
}