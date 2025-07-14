// resources/js/Pages/admin/signatures/Report.tsx

import { useState, FormEventHandler } from 'react';
import { Head, router } from '@inertiajs/react';
import { type PageProps, type Certification, type Signature } from '@/types';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

// ✅ Correcto: El tipo ahora incluye 'display_name'
type CertificationWithSignature = Omit<Certification, 'period'> & {
    period: Pick<Signature, 'cost' | 'display_name'> | null;
};

interface ReportPageProps extends PageProps {
    certifications: Paginated<CertificationWithSignature>;
    filters: {
        search?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
    };
    statusOptions: Record<string, string>;
}

// --- COMPONENTE PRINCIPAL ---
export default function Report({ auth, certifications, filters, statusOptions }: ReportPageProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    
    const handleFilter: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(route('admin.reports.signatures'), {
            search: search || undefined,
            status: status === 'all' ? undefined : status,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
        }, { 
            preserveState: true, 
            replace: true 
        });
    };
    
    // ✅ ACTUALIZADO: Limpia todos los estados de los filtros
    const clearFilters = () => {
        setSearch('');
        setStatus('all');
        setDateFrom('');
        setDateTo('');
        router.get(route('admin.reports.signatures'));
    };

    const goToPage = (url: string | null) => {
        if (!url) return;
        router.get(url, { preserveState: true, preserveScroll: true });
    };

    const getStatusColor = (status: string) => {
        const colors: { [key: string]: string } = {
            approved: 'bg-green-100 text-green-800',
            completed: 'bg-blue-100 text-blue-800',
            rejected: 'bg-red-100 text-red-800',
            in_review: 'bg-yellow-100 text-yellow-800',
            pending: 'bg-gray-100 text-gray-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const exportToExcel = () => {
        // Creamos un objeto con los filtros actuales
        const queryParams = new URLSearchParams({
            search: search || '',
            status: status === 'all' ? '' : status || '',
            date_from: dateFrom || '',
            date_to: dateTo || '',
        }).toString();

        window.location.href = route('admin.reports.signatures.export') + '?' + queryParams;
    };

    return (
        <AppLayout>
            <Head title="Reporte de Certificaciones" />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 sm:p-6">
                <h1 className="text-2xl font-bold tracking-tight">Historial de certificados</h1>

                <Card className="p-4">
                    <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Buscar</label>
                            <Input 
                                placeholder="Nro. certificado, estado o firma..." 
                                value={search} 
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Estado</label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
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
                            <Button type="submit"><Search className="h-4 w-4 mr-2" />Filtrar</Button>
                            <Button variant="outline" type="button" onClick={clearFilters}>Limpiar</Button>
                            <Button variant="secondary" onClick={exportToExcel}>
                                <FileDown className="h-4 w-4 mr-2" /> Exportar
                            </Button>
                        </div>
                    </form>
                </Card>

                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b">
                                <tr>
                                    <th className="text-center p-4 font-medium">Nro. Certificado</th>
                                    <th className="text-center p-4 font-medium">Estado</th>
                                    <th className="text-center p-4 font-medium">Firma</th>
                                    <th className="text-center p-4 font-medium">Costo Firma</th>
                                    <th className="text-center p-4 font-medium">Última Actualización</th>
                                </tr>
                            </thead>
                            <tbody>
                                {certifications.data.length > 0 ? (
                                    certifications.data.map((cert) => (
                                        <tr key={cert.id} className="border-b hover:bg-gray-50/50">
                                            <td className="p-4 font-medium text-center text-gray-900">
                                                {cert.certification_number || 'N/A'}
                                            </td>
                                            <td className="p-4 text-center text-gray-700">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(cert.status)}`}>
                                                    {statusOptions[cert.status] || cert.status}
                                                </span>
                                            </td>
                                            {/* ✅ CORRECCIÓN DE ESTILO AQUÍ */}
                                            <td className="p-4 text-center text-gray-700">
                                                {cert.period?.display_name ?? 'N/A'}
                                            </td>
                                            <td className="p-4 text-center text-gray-700">
                                                ${parseFloat(cert.period?.cost ?? '0.00').toFixed(2)}
                                            </td>
                                            <td className="p-4 text-center text-gray-700">
                                                {new Date(cert.updated_at).toLocaleDateString('es-EC', {
                                                    year: 'numeric', month: 'long', day: 'numeric',
                                                })}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        {/* ✅ CORRECCIÓN DE COLSPAN AQUÍ */}
                                        <td colSpan={5} className="p-8 text-center text-gray-500">
                                            No se encontraron certificaciones que coincidan con los filtros.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {certifications.data.length > 0 && (
                        <div className="flex items-center justify-between p-4 border-t">
                            <div className="text-sm text-gray-500">
                                Mostrando {certifications.from} a {certifications.to} de {certifications.total}
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm" onClick={() => goToPage(certifications.prev_page_url)} disabled={!certifications.prev_page_url}>
                                    <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => goToPage(certifications.next_page_url)} disabled={!certifications.next_page_url}>
                                    Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}