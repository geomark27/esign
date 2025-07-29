import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import { type PageProps } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Toaster, toast } from "sonner";
import { 
    MapPin, Plus, Search, Edit, Trash2
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { route } from 'ziggy-js';

// 1. Definición de Tipos para Provincias y Ciudades
interface City {
    id: number;
    name: string;
    province_id: number;
}

interface Province {
    id: number;
    name: string;
    cities: City[];
}

interface SectorsIndexProps extends PageProps {
    provinces: Province[];
}

export default function SectorsIndex({ provinces, flash }: SectorsIndexProps) {
    const { userBreadcrumbs } = useBreadcrumbs();
    // Breadcrumbs para sectors
    const breadcrumbs = userBreadcrumbs.sectors?.index() || [];
    
    // Estado para el término de búsqueda
    const [search, setSearch] = useState('');
    
    // Estados para los modales
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Estados para los formularios
    const [createForm, setCreateForm] = useState({
        name: '',
        province_id: ''
    });
    
    const [editForm, setEditForm] = useState({
        id: 0,
        name: '',
        province_id: ''
    });

    // Hook para mostrar notificaciones flash que vienen del backend
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);
    
    // Hook para manejar teclas de escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isCreateModalOpen) {
                    closeCreateModal();
                }
                if (isEditModalOpen) {
                    closeEditModal();
                }
            }
        };
        
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isCreateModalOpen, isEditModalOpen]);
    
    // Memoizamos el resultado del filtro para optimizar el rendimiento.
    // El filtro se hace en el cliente (navegador) para una respuesta instantánea.
    const filteredProvinces = useMemo(() => {
        if (!search) {
            return provinces;
        }
        const lowercasedSearch = search.toLowerCase();
        
        return provinces
            .map(province => {
                // Primero, filtramos las ciudades que coinciden con la búsqueda
                const matchingCities = province.cities.filter(city =>
                    city.name.toLowerCase().includes(lowercasedSearch)
                );

                // Verificamos si el nombre de la provincia coincide
                const provinceMatches = province.name.toLowerCase().includes(lowercasedSearch);

                // Si ni la provincia ni ninguna de sus ciudades coinciden, la descartamos (return null)
                if (!provinceMatches && matchingCities.length === 0) {
                    return null;
                }

                // Si la provincia coincide, la devolvemos con TODAS sus ciudades originales.
                if (provinceMatches) {
                    return province;
                }
                
                // Si la provincia NO coincide, pero SÍ tiene ciudades que coinciden,
                // la devolvemos solo con las ciudades que coincidieron.
                return { ...province, cities: matchingCities };
            })
            .filter((p): p is Province => p !== null); // Limpiamos los resultados nulos del array
    }, [search, provinces]);
    
    // Funciones para manejar el modal de crear ciudad
    const openCreateModal = () => {
        setCreateForm({ name: '', province_id: '' });
        setIsCreateModalOpen(true);
    };
    
    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        setCreateForm({ name: '', province_id: '' });
    };
    
    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!createForm.name.trim() || !createForm.province_id) {
            toast.error('Por favor completa todos los campos');
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            router.post(route('user.sectors.store'), createForm, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Ciudad creada correctamente');
                    closeCreateModal();
                    // La página se actualizará automáticamente gracias a Inertia
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0] as string;
                    toast.error(firstError || 'Error al crear la ciudad');
                },
                onFinish: () => {
                    setIsSubmitting(false);
                }
            });
        } catch (error) {
            toast.error('Error inesperado al crear la ciudad');
            setIsSubmitting(false);
        }
    };
    
    // Funciones para manejar el modal de editar ciudad
    const openEditModal = (city: City) => {
        setEditForm({
            id: city.id,
            name: city.name,
            province_id: city.province_id.toString()
        });
        setIsEditModalOpen(true);
    };
    
    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditForm({ id: 0, name: '', province_id: '' });
    };
    
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!editForm.name.trim() || !editForm.province_id) {
            toast.error('Por favor completa todos los campos');
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            router.put(route('user.sectors.update', editForm.id), {
                name: editForm.name,
                province_id: editForm.province_id
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Ciudad actualizada correctamente');
                    closeEditModal();
                    // La página se actualizará automáticamente gracias a Inertia
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0] as string;
                    toast.error(firstError || 'Error al actualizar la ciudad');
                },
                onFinish: () => {
                    setIsSubmitting(false);
                }
            });
        } catch (error) {
            toast.error('Error inesperado al actualizar la ciudad');
            setIsSubmitting(false);
        }
    };
    
    // Función para eliminar una ciudad, con un diálogo de confirmación
    const deleteCity = (city: City) => {
        toast.error(`¿Estás seguro de eliminar "${city.name}"?`, {
            description: 'Esta acción no se puede deshacer.',
            action: {
                label: 'Confirmar',
                onClick: () => {
                    router.delete(route('user.sectors.destroy', city.id), {
                        preserveScroll: true,
                    });
                },
            },
            cancel: {
                label: "Cancelar",
                onClick: () => {
                    // Solo cerrar el toast, no hacer nada más
                },
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión de Sectores" />
            <Toaster position="top-center" richColors />
            
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Cabecera de la página */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Gestión de Sectores</h1>
                        <p className="text-muted-foreground">
                            Administra las provincias y ciudades del sistema.
                        </p>
                    </div>
                    <Button 
                        onClick={openCreateModal}
                        className="flex items-center space-x-2"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Nueva Ciudad</span>
                    </Button>
                </div>

                {/* Filtro de Búsqueda */}
                <Card className="p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <label className="text-sm font-medium mb-2 block">Buscar sector</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Buscar por provincia o ciudad..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Lista de Provincias y Ciudades en formato de Acordeón */}
                <div className="grid gap-4">
                    {filteredProvinces.length > 0 ? (
                        <Card>
                            <Accordion type="multiple" className="w-full">
                                {filteredProvinces.map((province) => (
                                    <AccordionItem value={`province-${province.id}`} key={province.id}>
                                        <AccordionTrigger className="px-6 hover:bg-gray-50">
                                            <div className="flex items-center space-x-3">
                                                <MapPin className="h-5 w-5 text-gray-500" />
                                                <span className="font-semibold text-lg">{province.name}</span>
                                                <span className="text-sm text-gray-400">
                                                    ({province.cities.length} {province.cities.length === 1 ? 'ciudad' : 'ciudades'})
                                                </span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-6 pt-2 pb-4 bg-white">
                                            {province.cities.length > 0 ? (
                                                <ul className="space-y-2">
                                                    {province.cities.map((city) => (
                                                        <li key={city.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                                                            <span>{city.name}</span>
                                                            <div className="flex items-center space-x-2">
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm"
                                                                    onClick={() => openEditModal(city)}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => deleteCity(city)}
                                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-center text-gray-500 py-4">No hay ciudades que coincidan con la búsqueda en esta provincia.</p>
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </Card>
                    ) : (
                        <Card className="p-8 text-center">
                            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="font-medium text-gray-900 mb-2">No se encontraron sectores</h3>
                            <p className="text-gray-500 mb-4">
                                El filtro no arrojó resultados. Intenta con otro término de búsqueda.
                            </p>
                        </Card>
                    )}
                </div>
            </div>

            {/* Modal para crear ciudad */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Nueva Ciudad</DialogTitle>
                        <DialogDescription>
                            Agrega una nueva ciudad al sistema. Selecciona la provincia correspondiente.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="create-province">Provincia</Label>
                                <Select 
                                    value={createForm.province_id} 
                                    onValueChange={(value) => setCreateForm(prev => ({ ...prev, province_id: value }))}
                                >
                                    <SelectTrigger id="create-province">
                                        <SelectValue placeholder="Selecciona una provincia" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {provinces.map((province) => (
                                            <SelectItem key={province.id} value={province.id.toString()}>
                                                {province.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="create-name">Nombre de la Ciudad</Label>
                                <Input
                                    id="create-name"
                                    type="text"
                                    placeholder="Ingresa el nombre de la ciudad"
                                    value={createForm.name}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={closeCreateModal}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Creando...' : 'Crear Ciudad'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal para editar ciudad */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Editar Ciudad</DialogTitle>
                        <DialogDescription>
                            Modifica los datos de la ciudad seleccionada.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-province">Provincia</Label>
                                <Select 
                                    value={editForm.province_id} 
                                    onValueChange={(value) => setEditForm(prev => ({ ...prev, province_id: value }))}
                                >
                                    <SelectTrigger id="edit-province">
                                        <SelectValue placeholder="Selecciona una provincia" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {provinces.map((province) => (
                                            <SelectItem key={province.id} value={province.id.toString()}>
                                                {province.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Nombre de la Ciudad</Label>
                                <Input
                                    id="edit-name"
                                    type="text"
                                    placeholder="Ingresa el nombre de la ciudad"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={closeEditModal}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Actualizando...' : 'Actualizar Ciudad'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
