import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';

// Tipos
import { type PageProps } from '@/types';
import { type Signature, type PaginatedSignatures } from '@/types/index';

// Layout y Componentes UI
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
// CAMBIO: Importar componentes de Dialog
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toaster, toast } from "sonner";
import { PlusCircle, FilePenLine, Trash2, Search, ChevronLeft, ChevronRight, LucidePowerSquare, EyeOff, PowerIcon, PowerOff } from 'lucide-react';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';

// Interfaz de Props para la página
interface PlanIndexProps extends PageProps {
    signatures: PaginatedSignatures;
    filters: {
        search?: string;
        sort?: string;
    }
}

// --- COMPONENTE ---
export default function PlansIndex(props: PlanIndexProps) {
    const { adminBreadcrumbs } = useBreadcrumbs();
    const breadcrumbs = adminBreadcrumbs.signatures.index();

    const { signatures, filters = {}, flash = {} } = props;

    // CAMBIO: Renombrar estado para claridad
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Signature | null>(null);

    const [sort, setSort] = useState(
        typeof filters?.sort === 'string' 
            ? filters.sort 
            : 'created_at_desc'
    );

    // Y de paso, haz lo mismo con `search`:
    const [search, setSearch] = useState(
        typeof filters?.search === 'string'
            ? filters.search 
            : ''
    );

    // Hook del formulario de Inertia
    const { data, setData, post, put, processing, errors, reset } = useForm({
        period: '', // SOLUCIÓN 2: Estandarizar a 'period'
        display_name: '',
        cost: '',
        price: '',
        description: '',
    });

    // --- MANEJADORES DE EVENTOS ---

    const handleFilter = () => {
        router.get(route('admin.signatures.index'), {
            search: search || undefined,
            sort: sort,
        }, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        setSearch('');
        setSort('created_at_desc');
        router.get(route('admin.signatures.index'));
    };
    
    const goToPage = (url: string) => {
        router.get(url, { preserveState: true, preserveScroll: true });
    };

    const openCreateModal = () => { // CAMBIO: Renombrar función
        setEditingPlan(null);
        reset();
        setIsModalOpen(true); // CAMBIO: Usar el nuevo setter del estado
    };

    const openEditModal = (plan: Signature) => { // CAMBIO: Renombrar función
        setEditingPlan(plan);
        setData({
            period: plan.period,
            display_name: plan.display_name,
            cost: plan.cost,
            price: plan.price,
            description: plan.description || '',
        });
        setIsModalOpen(true); // CAMBIO: Usar el nuevo setter del estado
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const onFinish = () => {
            setIsModalOpen(false); // CAMBIO: Usar el nuevo setter del estado
            setEditingPlan(null);
            reset();
        };

        if (editingPlan) {
            put(route('admin.signatures.update', editingPlan.id), { onSuccess: onFinish, preserveScroll: true });
        } else {
            post(route('admin.signatures.store'), { onSuccess: onFinish, preserveScroll: true });
        }
    };

    // --- RENDERIZADO DEL COMPONENTE ---
    const handleDelete = (plan: Signature) => {
        toast.error("¿Estás seguro de que quieres eliminar este plan?", {
            description: `Firma: "${plan.display_name}"`,
            action: {
                label: "Confirmar",
                onClick: () => router.delete(route('admin.signatures.destroy', plan.id), { preserveScroll: true }),
            },
            cancel: {
                label: "Cancelar",
                onClick: () => {}, // Requerido por el tipo de Sonner
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión de Planes" />
            <Toaster position="top-center" richColors />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 sm:p-6">
                {/* Encabezado */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Gestión de firmas</h1>
                        <p className="text-muted-foreground">Administra los planes y precios del sistema.</p>
                    </div>
                    <Button onClick={openCreateModal}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Crear firma
                    </Button>
                </div>

                {/* Mensajes Flash */}
                {flash?.success && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                        {flash.error}
                    </div>
                )}
                
                {/* Filtros */}
                <Card className="p-4">
                     <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <label className="text-sm font-medium mb-2 block">Buscar firmas</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="search" type="text" placeholder="Buscar por nombre o código..."
                                    value={search} onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10" onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                                />
                            </div>
                        </div>
                        <div className="min-w-[200px]">
                            <label className="text-sm font-medium mb-2 block">Ordenar por</label>
                            <Select value={sort} onValueChange={(value) => setSort(value)}>
                                <SelectTrigger><SelectValue placeholder="Ordenar por..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="created_at_desc">Más recientes</SelectItem>
                                    <SelectItem value="name_asc">Nombre (A-Z)</SelectItem>
                                    <SelectItem value="name_desc">Nombre (Z-A)</SelectItem>
                                    <SelectItem value="price_desc">Precio (Mayor a menor)</SelectItem>
                                    <SelectItem value="price_asc">Precio (Menor a mayor)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex space-x-2">
                            <Button onClick={handleFilter}>Filtrar</Button>
                            <Button variant="outline" onClick={clearFilters}>Limpiar</Button>
                        </div>
                    </div>
                </Card>

                {/* Tabla de Planes */}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b">
                                <tr>
                                    <th className="text-left p-4 font-medium">Nombre</th>
                                    <th className="text-left p-4 font-medium">Código/Periodo</th>
                                    <th className="text-right p-4 font-medium">Costo</th>
                                    <th className="text-right p-4 font-medium">Precio</th>
                                    <th className="text-left p-4 font-medium">Estado</th>
                                    <th className="text-right p-4 font-medium">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {signatures.data.length > 0 ? (
                                    signatures.data.map((plan: Signature) => ( // SOLUCIÓN 3: Tipado explícito del parámetro 'plan'.
                                        <tr key={plan.id} className="border-b hover:bg-gray-50">
                                            <td className="p-4 font-medium">{plan.display_name}</td>
                                            <td className="p-4">{plan.period}</td>
                                            <td className="p-4 text-right">${parseFloat(plan.cost).toFixed(2)}</td>
                                            <td className="p-4 text-right">${parseFloat(plan.price).toFixed(2)}</td>
                                            <td className="p-4">
                                                <Badge variant={plan.is_active ? 'default' : 'destructive'}>
                                                    {plan.is_active ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Button variant="outline" size="sm" onClick={() => openEditModal(plan)}>
                                                        <FilePenLine className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant={plan.is_active ? "outline" : "default"}
                                                        size="sm"
                                                        onClick={() => {
                                                            router.put(
                                                                route('admin.signatures.change.status', plan.id),
                                                                {},
                                                                { preserveScroll: true }
                                                            );
                                                        }}
                                                        className={plan.is_active ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                                                    >
                                                        {plan.is_active ? (
                                                            <span className="flex items-center">
                                                                <PowerOff className="h-4 w-4 mr-1" />
                                                                Desactivar
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center">
                                                                <PowerIcon className="h-4 w-4 mr-1" />
                                                                Activar
                                                            </span>
                                                        )}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">
                                            No se encontraron planes.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    {signatures.data.length > 0 && (
                        <div className="flex items-center justify-between p-4 border-t">
                             <div className="text-sm text-gray-500">
                                 Mostrando {signatures.from} a {signatures.to} de {signatures.total} planes
                             </div>
                             <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm" onClick={() => goToPage(signatures.prev_page_url!)} disabled={!signatures.prev_page_url}>
                                    <ChevronLeft className="h-4 w-4" /> Anterior
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => goToPage(signatures.next_page_url!)} disabled={!signatures.next_page_url}>
                                    Siguiente <ChevronRight className="h-4 w-4" />
                                </Button>
                             </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* CAMBIO: Reemplazar Sheet por Dialog */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{editingPlan ? 'Editar Signature' : 'Crear Nuevo Signature'}</DialogTitle>
                            <DialogDescription>
                                {editingPlan ? 'Modifica los detalles del plan.' : 'Completa el formulario para añadir un nuevo plan.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-6">
                            {/* El contenido del formulario es exactamente el mismo */}
                            <div className="space-y-1">
                                <Label htmlFor="display_name">Nombre</Label>
                                <Input id="display_name" value={data.display_name} onChange={(e) => setData('display_name', e.target.value)} />
                                {errors.display_name && <p className="text-sm text-red-500">{errors.display_name}</p>}
                            </div>
                            <div className="space-y-1" hidden={!!editingPlan}>
                                <Label htmlFor="period">Código/Periodo</Label>
                                <Input id="period" value={data.period} onChange={(e) => setData('period', e.target.value)} readOnly={!!editingPlan} />
                                {errors.period && <p className="text-sm text-red-500">{errors.period}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-1">
                                    <Label htmlFor="cost">Costo</Label>
                                    <Input id="cost" type="number" step="0.01" value={data.cost} onChange={(e) => setData('cost', e.target.value)} />
                                    {errors.cost && <p className="text-sm text-red-500">{errors.cost}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="price">Precio</Label>
                                    <Input id="price" type="number" step="0.01" value={data.price} onChange={(e) => setData('price', e.target.value)} />
                                    {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="description">Descripción (Opcional)</Label>
                                <Textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} rows={4}/>
                                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}