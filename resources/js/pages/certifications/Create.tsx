import { Textarea } from "@/components/ui/textarea";import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import AppLayout from "@/layouts/app-layout";
import { Head, useForm, router } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { CalendarIcon, Upload, User, Building, FileText, Shield, MapPin, Plus } from "lucide-react";
import ErrorModal from "@/components/ErrorModal";
import { Signature } from "@/types";
import axios from "axios";
import { toast } from "sonner";

// En tu interfaz, puedes ser más específico
interface CreateCertificationProps {
    applicationTypes: Record<string, string>;
    periods: Signature[]; // Usar el tipo Signature en lugar de Array<any>
    cities: Array<{id: number; name: string}>;
    provinces: Array<{id: number; name: string}>;
}

interface FormData {
    // Información personal
    identificationNumber: string;
    applicantName: string;
    applicantLastName: string;
    applicantSecondLastName: string;
    dateOfBirth: string;
    fingerCode: string;
    emailAddress: string;
    cellphoneNumber: string;
    
    // Ubicación
    city: string;
    province: string;
    address: string;
    countryCode: string;
    
    // Información empresarial
    companyRuc: string;
    positionCompany: string;
    companySocialReason: string;
    appointmentExpirationDate: string;
    
    // Tipo de documento y aplicación
    documentType: string;
    applicationType: string;
    
    // Transacción
    referenceTransaction: string;
    period: string;
    
    // Archivos
    identificationFront: File | null;
    identificationBack: File | null;
    identificationSelfie: File | null;
    pdfCompanyRuc: File | null;
    pdfRepresentativeAppointment: File | null;
    pdfAppointmentAcceptance: File | null;
    pdfCompanyConstitution: File | null;
    authorizationVideo: File | null;
    
    // Términos
    terms_accepted: boolean;
    
    // Signatura de índice para compatibilidad con Inertia.js
    [key: string]: any;
}

export default function CreateCertification({ 
    applicationTypes, 
    periods, 
    cities, 
    provinces 
}: CreateCertificationProps) {
    const { userBreadcrumbs } = useBreadcrumbs();
    const breadcrumbs = userBreadcrumbs.certifications.create();
    
    const [currentStep, setCurrentStep] = useState(1);
    const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
    const [availableCities, setAvailableCities] = useState<Array<{id: number; name: string}>>([]);
    const [loadingCities, setLoadingCities] = useState(false);
    
    // Estados para el modal de crear ciudad
    const [isCreateCityModalOpen, setIsCreateCityModalOpen] = useState(false);
    const [isCreatingCity, setIsCreatingCity] = useState(false);
    const [newCityForm, setNewCityForm] = useState({
        name: '',
        province_id: ''
    });
    
    const totalSteps = 4;

    const { data, setData, post, processing, errors, progress } = useForm<FormData>({
        // Información personal
        identificationNumber: '',
        applicantName: '',
        applicantLastName: '',
        applicantSecondLastName: '',
        dateOfBirth: '',
        fingerCode: '',
        emailAddress: '',
        cellphoneNumber: '+593',
        
        // Ubicación
        city: '',
        province: '',
        address: '',
        countryCode: 'EC',
        
        // Información empresarial
        companyRuc: '',
        positionCompany: '',
        companySocialReason: '',
        appointmentExpirationDate: '',
        
        // Tipo de documento y aplicación
        documentType: 'CI',
        applicationType: '',
        
        // Transacción
        referenceTransaction: '',
        period: '',
        
        // Archivos
        identificationFront: null,
        identificationBack: null,
        identificationSelfie: null,
        pdfCompanyRuc: null,
        pdfRepresentativeAppointment: null,
        pdfAppointmentAcceptance: null,
        pdfCompanyConstitution: null,
        authorizationVideo: null,
        
        // Términos
        terms_accepted: false,
    });

    const isLegalRepresentative = data.applicationType === 'LEGAL_REPRESENTATIVE';
    const requiresCompanyDocs   = isLegalRepresentative || data.companyRuc;

    // Funciones para calcular edad
    const calculateAge = (birthDate: string): number => {
        if (!birthDate) return 0;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    };

    const age = calculateAge(data.dateOfBirth);
    const isOver65 = age >= 65;
    const isUnder18 = age < 18 && data.dateOfBirth !== '';

    // Función para cargar ciudades por provincia
    const loadCitiesByProvince = async (provinceId: number) => {
        if (!provinceId) {
            setAvailableCities([]);
            return;
        }
        
        setLoadingCities(true);
        try {
            const response = await axios.get(`/user/api/cities-by-province/${provinceId}`);
            if (response.data.success) {
                setAvailableCities(response.data.cities);
            } else {
                console.error('Error al cargar ciudades:', response.data.message);
                setAvailableCities([]);
            }
        } catch (error) {
            console.error('Error al cargar ciudades:', error);
            setAvailableCities([]);
        } finally {
            setLoadingCities(false);
        }
    };

    // Efecto para cargar ciudades cuando cambia la provincia
    useEffect(() => {
        const selectedProvince = provinces.find(p => p.name === data.province);
        if (selectedProvince) {
            loadCitiesByProvince(selectedProvince.id);
            // Limpiar la ciudad seleccionada si no es de esta provincia
            if (data.city && !availableCities.some(c => c.name === data.city)) {
                setData('city', '');
            }
        } else {
            setAvailableCities([]);
        }
    }, [data.province]);

    // Funciones para manejar el modal de crear ciudad
    const openCreateCityModal = () => {
        const selectedProvince = provinces.find(p => p.name === data.province);
        setNewCityForm({
            name: '',
            province_id: selectedProvince ? selectedProvince.id.toString() : ''
        });
        setIsCreateCityModalOpen(true);
    };

    const closeCreateCityModal = () => {
        setIsCreateCityModalOpen(false);
        setNewCityForm({ name: '', province_id: '' });
    };

    const handleCreateCitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newCityForm.name.trim() || !newCityForm.province_id) {
            toast.error('Por favor completa todos los campos');
            return;
        }
        
        setIsCreatingCity(true);
        
        try {
            const response = await axios.post(route('user.sectors.store'), newCityForm);
            
            if (response.status === 200 || response.status === 201) {
                toast.success('Ciudad creada correctamente');
                closeCreateCityModal();
                
                // Recargar las ciudades de la provincia seleccionada
                const selectedProvince = provinces.find(p => p.name === data.province);
                if (selectedProvince) {
                    await loadCitiesByProvince(selectedProvince.id);
                    // Seleccionar automáticamente la nueva ciudad
                    setData('city', newCityForm.name);
                }
            }
        } catch (error: any) {
            console.error('Error al crear ciudad:', error);
            console.log('Full error object:', JSON.stringify(error, null, 2));
            
            let errorMessage = 'Error al crear la ciudad';
            
            if (error.response) {
                // Error del servidor con respuesta
                const { status, data: errorData } = error.response;
                
                console.log('Error response status:', status);
                console.log('Error response data:', errorData);
                console.log('Error response data.errors:', errorData?.errors);
                console.log('Error response data.message:', errorData?.message);
                
                if (status === 422) {
                    // Errores de validación - priorizar el mensaje del campo 'name'
                    if (errorData.errors?.name && Array.isArray(errorData.errors.name)) {
                        errorMessage = errorData.errors.name[0];
                        console.log('Using name error:', errorMessage);
                    } else if (errorData.message) {
                        errorMessage = errorData.message;
                        console.log('Using message error:', errorMessage);
                    }
                } else if (status === 409) {
                    // Conflicto - ciudad ya existe
                    errorMessage = errorData.message || `La ciudad "${newCityForm.name}" ya existe en esta provincia`;
                } else if (status === 500) {
                    errorMessage = 'Error interno del servidor. Intente nuevamente';
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } else if (error.request) {
                // Error de red
                errorMessage = 'Error de conexión. Verifique su conexión a internet';
            } else {
                // Otro tipo de error
                errorMessage = error.message || 'Error inesperado al crear la ciudad';
            }
            
            console.log('Final error message:', errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsCreatingCity(false);
        }
    };

    // Función para generar la plantilla del video
    const generateVideoTemplate = (): string => {
        const today = new Date();
        const currentDate = today.toLocaleDateString('es-EC', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
        }).toUpperCase();
        
        // Construir nombre completo: NOMBRE1 NOMBRE2 APELLIDO1 APELLIDO2
        let fullName = data.applicantName;
        if (data.applicantLastName) fullName += ' ' + data.applicantLastName;
        if (data.applicantSecondLastName) fullName += ' ' + data.applicantSecondLastName;
        
        return `"Hoy ${currentDate}, Yo ${fullName.toUpperCase()} con CI. ${data.identificationNumber} autorizo a FIRMASEGURA emitir mi firma electrónica, sabiendo que tiene la misma validez legal que la firma manuscrita y sea enviada a mi correo electrónico ${data.emailAddress}"`;
    };

    // Funciones de validación por paso
    const validateStep1 = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!data.applicationType) newErrors.applicationType = 'Seleccione el tipo de aplicación';
        if (!data.identificationNumber) newErrors.identificationNumber = 'Ingrese el número de identificación';
        if (!data.applicantName) newErrors.applicantName = 'Ingrese el nombre';
        if (!data.applicantLastName) newErrors.applicantLastName = 'Ingrese el apellido paterno';
        if (!data.dateOfBirth) newErrors.dateOfBirth = 'Ingrese la fecha de nacimiento';
        if (!data.fingerCode) newErrors.fingerCode = 'Ingrese el código dactilar';
        if (!data.emailAddress) newErrors.emailAddress = 'Ingrese el correo electrónico';
        if (!data.cellphoneNumber || data.cellphoneNumber === '+593') newErrors.cellphoneNumber = 'Ingrese el número de celular';

        // Validaciones de formato
        if (data.identificationNumber && data.identificationNumber.length !== 10) {
            newErrors.identificationNumber = 'La cédula debe tener 10 dígitos';
        }
        const FINGER_CODE_REGEX = /^[A-Z]\d{4}[A-Z]\d{4}$/;

        // En tu función de validación:
        if (data.fingerCode && !FINGER_CODE_REGEX.test(data.fingerCode)) {
        newErrors.fingerCode = 'Formato inválido. Ejemplo: V1234V1234';
        }
        if (data.emailAddress && !/\S+@\S+\.\S+/.test(data.emailAddress)) {
            newErrors.emailAddress = 'Formato de correo inválido';
        }
        if (data.cellphoneNumber && !/^\+5939\d{8}$/.test(data.cellphoneNumber)) {
            newErrors.cellphoneNumber = 'Formato de celular inválido';
        }

        // Validación de edad
        if (data.dateOfBirth) {
            const currentAge = calculateAge(data.dateOfBirth);
            if (currentAge < 18) {
                newErrors.dateOfBirth = 'Debe ser mayor de 18 años para solicitar el certificado';
            }
            
            // Validar que la fecha no sea futura
            const today = new Date();
            const birthDate = new Date(data.dateOfBirth);
            if (birthDate > today) {
                newErrors.dateOfBirth = 'La fecha de nacimiento no puede ser futura';
            }
        }

        setStepErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Validaciones existentes
        if (!data.province)             newErrors.province = 'Seleccione la provincia';
        if (!data.city)                 newErrors.city = 'Seleccione la ciudad';
        if (!data.address)              newErrors.address = 'Ingrese la dirección';
        if (!data.referenceTransaction) newErrors.referenceTransaction = 'Ingrese la referencia de transacción';
        if (!data.period)               newErrors.period = 'Seleccione el período';

        // ¿Persona natural “con RUC”?
        const isNaturalWithRuc =
            data.personType === 'NATURAL_PERSON' &&
            data.identificationNumber?.length === 13;

        // Si es NATURAL_PERSON y el identificationNumber tiene 13 dígitos, obligamos companyRuc
        if (isNaturalWithRuc && !data.companyRuc) {
            newErrors.companyRuc = 'Debes ingresar el RUC de la empresa';
        }
        // Y validamos su longitud si ya lo ingresó
        if (isNaturalWithRuc && data.companyRuc?.length !== 13) {
            newErrors.companyRuc = 'El RUC debe tener 13 dígitos';
        }

        // Resto de validaciones (representante legal, etc.)
        if (isLegalRepresentative) {
            if (!data.companySocialReason)       newErrors.companySocialReason = 'Ingrese la razón social';
            if (!data.positionCompany)           newErrors.positionCompany   = 'Ingrese el cargo en la empresa';
            if (!data.appointmentExpirationDate) newErrors.appointmentExpirationDate = 'Ingrese la fecha de expiración del nombramiento';
        }

        setStepErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep3 = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Documentos de identificación (siempre requeridos)
        if (!data.identificationFront) newErrors.identificationFront = 'Suba la foto frontal de la cédula';
        if (!data.identificationBack) newErrors.identificationBack = 'Suba la foto posterior de la cédula';
        if (!data.identificationSelfie) newErrors.identificationSelfie = 'Suba la selfie con la cédula';

        // Reutilizamos la misma bandera
        const isNaturalWithRuc = data.personType === 'NATURAL_PERSON' && data.identificationNumber?.length === 13;
        
        // Caso especial: si es NATURAL con RUC → forzamos el PDF
        if (isNaturalWithRuc && !data.pdfCompanyRuc) {
            newErrors.pdfCompanyRuc = 'Suba el PDF del RUC de la empresa';
        }      
        // Documentos empresariales si se requieren
        if (requiresCompanyDocs) {
            if (!data.pdfCompanyRuc) newErrors.pdfCompanyRuc = 'Suba el PDF del RUC de la empresa';
        }

        // Documentos de nombramiento para representantes legales
        if (isLegalRepresentative) {
            if (!data.pdfRepresentativeAppointment) newErrors.pdfRepresentativeAppointment = 'Suba el nombramiento de representante';
            if (!data.pdfAppointmentAcceptance) newErrors.pdfAppointmentAcceptance = 'Suba la aceptación del nombramiento';
        }

        // Video requerido solo para mayores de 65 años
        if (isOver65 && !data.authorizationVideo) {
            newErrors.authorizationVideo = 'El video de autorización es obligatorio para personas mayores de 65 años';
        }

        setStepErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep4 = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!data.terms_accepted) {
            newErrors.terms_accepted = 'Debe aceptar los términos y condiciones';
        }

        setStepErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFileChange = (fieldName: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setData(fieldName, file as any);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('user.certifications.store'));
    };

    const nextStep = () => {
        let isValid = false;

        // Validar el paso actual antes de avanzar
        switch (currentStep) {
            case 1:
                isValid = validateStep1();
                break;
            case 2:
                isValid = validateStep2();
                break;
            case 3:
                isValid = validateStep3();
                break;
            case 4:
                isValid = validateStep4();
                break;
            default:
                isValid = true;
        }

        // Solo avanzar si la validación es exitosa
        if (isValid && currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
            setStepErrors({}); // Limpiar errores al avanzar
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setStepErrors({}); // Limpiar errores al retroceder
        }
    };

    const getStepTitle = (step: number) => {
        const titles = {
            1: 'Información Personal',
            2: 'Información Empresarial',
            3: 'Documentos Requeridos',
            4: 'Revisión y Envío'
        };
        return titles[step as keyof typeof titles];
    };

    const StepIndicator = () => (
        <div className="flex items-center justify-between mb-8">
            {Array.from({ length: totalSteps }, (_, i) => (
                <div key={i} className="flex items-center">
                    <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                        ${currentStep > i + 1 ? 'bg-green-500 text-white' : 
                          currentStep === i + 1 ? 'bg-blue-500 text-white' : 
                          'bg-gray-200 text-gray-600'}
                    `}>
                        {i + 1}
                    </div>
                    {i < totalSteps - 1 && (
                        <div className={`
                            w-16 h-1 mx-2
                            ${currentStep > i + 1 ? 'bg-green-500' : 'bg-gray-200'}
                        `} />
                    )}
                </div>
            ))}
        </div>
    );

    const renderStep1 = () => (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información Personal
                </CardTitle>
                <CardDescription>
                    Complete sus datos personales y de contacto
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="applicationType">Tipo de Aplicación *</Label>
                        <Select value={data.applicationType} onValueChange={(value) => setData('applicationType', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione tipo de aplicación" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(applicationTypes).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.applicationType || stepErrors.applicationType && <p className="text-sm text-red-500">{errors.applicationType || stepErrors.applicationType}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="identificationNumber">Número de Identificación *</Label>
                        <Input
                            id="identificationNumber"
                            type="text"
                            value={data.identificationNumber}
                            onChange={(e) => setData('identificationNumber', e.target.value)}
                            placeholder="1234567890"
                            maxLength={10}
                        />
                        {(errors.identificationNumber || stepErrors.identificationNumber) && <p className="text-sm text-red-500">{errors.identificationNumber || stepErrors.identificationNumber}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="applicantName">Nombre *</Label>
                        <Input
                            id="applicantName"
                            type="text"
                            value={data.applicantName}
                            onChange={(e) => setData('applicantName', e.target.value)}
                        />
                        {(errors.applicantName || stepErrors.applicantName) && <p className="text-sm text-red-500">{errors.applicantName || stepErrors.applicantName}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="applicantLastName">Apellido Paterno *</Label>
                        <Input
                            id="applicantLastName"
                            type="text"
                            value={data.applicantLastName}
                            onChange={(e) => setData('applicantLastName', e.target.value)}
                        />
                        {(errors.applicantLastName || stepErrors.applicantLastName) && <p className="text-sm text-red-500">{errors.applicantLastName || stepErrors.applicantLastName}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="applicantSecondLastName">Apellido Materno</Label>
                        <Input
                            id="applicantSecondLastName"
                            type="text"
                            value={data.applicantSecondLastName}
                            onChange={(e) => setData('applicantSecondLastName', e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Fecha de Nacimiento *</Label>
                        <Input
                            id="dateOfBirth"
                            type="date"
                            value={data.dateOfBirth}
                            onChange={(e) => setData('dateOfBirth', e.target.value)}
                            max={new Date().toISOString().split('T')[0]} // No permite fechas futuras
                        />
                        {data.dateOfBirth && (
                            <p className="text-xs text-gray-600">
                                Edad: {age} años
                                {isUnder18 && <span className="text-red-600 ml-2">⚠️ Debe ser mayor de 18 años</span>}
                                {isOver65 && <span className="text-blue-600 ml-2">ℹ️ Se requerirá video de autorización</span>}
                            </p>
                        )}
                        {(errors.dateOfBirth || stepErrors.dateOfBirth) && <p className="text-sm text-red-500">{errors.dateOfBirth || stepErrors.dateOfBirth}</p>}
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="fingerCode">Código Dactilar *</Label>
                        <Input
                            id="fingerCode"
                            type="text"
                            value={data.fingerCode}
                            onChange={(e) => setData('fingerCode', e.target.value)}
                            placeholder="V1234V1234"
                            maxLength={10}
                        />
                        <p className="text-xs text-gray-500">Formato: V1234V1234</p>
                        {(errors.fingerCode || stepErrors.fingerCode) && <p className="text-sm text-red-500">{errors.fingerCode || stepErrors.fingerCode}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="emailAddress">Correo Electrónico *</Label>
                        <Input
                            id="emailAddress"
                            type="email"
                            value={data.emailAddress}
                            onChange={(e) => setData('emailAddress', e.target.value)}
                        />
                        {(errors.emailAddress || stepErrors.emailAddress) && <p className="text-sm text-red-500">{errors.emailAddress || stepErrors.emailAddress}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="cellphoneNumber">Número de Celular *</Label>
                    <div className="flex">
                        <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                            +593
                        </span>
                        <Input
                            id="cellphoneNumber"
                            type="tel"
                            value={data.cellphoneNumber.replace('+593', '')}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, ''); // Solo números
                                if (value.length <= 9) {
                                    // Formatear: XX XXX XXXX
                                    let formatted = value;
                                    if (value.length >= 2) {
                                        formatted = value.substring(0, 2) + ' ' + value.substring(2);
                                    }
                                    if (value.length >= 5) {
                                        formatted = value.substring(0, 2) + ' ' + value.substring(2, 5) + ' ' + value.substring(5);
                                    }
                                    setData('cellphoneNumber', '+593' + value);
                                }
                            }}
                            placeholder="96 831 9032"
                            maxLength={11} // Permite espacios en el formato
                            className="rounded-l-none"
                        />
                    </div>
                    <p className="text-xs text-gray-500">Formato: 96 831 9032 (9 dígitos)</p>
                    {(errors.cellphoneNumber || stepErrors.cellphoneNumber) && <p className="text-sm text-red-500">{errors.cellphoneNumber || stepErrors.cellphoneNumber}</p>}
                </div>
            </CardContent>
        </Card>
    );

    const renderStep2 = () => (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Ubicación e Información Empresarial
                </CardTitle>
                <CardDescription>
                    Complete su dirección y datos empresariales si aplica
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="province">Provincia *</Label>
                        <Select value={data.province} onValueChange={(value) => setData('province', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione provincia" />
                            </SelectTrigger>
                            <SelectContent>
                                {provinces.map((province) => (
                                    <SelectItem key={province.id} value={province.name}>{province.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {(errors.province || stepErrors.province) && <p className="text-sm text-red-500">{errors.province || stepErrors.province}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-medium">Ciudad *</Label>
                        <div className="flex gap-2">
                            <Select 
                                value={data.city} 
                                onValueChange={(value) => setData('city', value)}
                                disabled={!data.province || loadingCities}
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder={
                                        !data.province 
                                            ? "Seleccione una provincia primero" 
                                            : loadingCities 
                                                ? "Cargando ciudades..." 
                                                : "Seleccione ciudad"
                                    } />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableCities.map((city) => (
                                        <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {data.province && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={openCreateCityModal}
                                    className="px-3 whitespace-nowrap"
                                    disabled={loadingCities}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Agregar
                                </Button>
                            )}
                        </div>
                        {(errors.city || stepErrors.city) && <p className="text-sm text-red-500">{errors.city || stepErrors.city}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="address">Dirección *</Label>
                    <Textarea
                        id="address"
                        value={data.address}
                        onChange={(e) => setData('address', e.target.value)}
                        placeholder="Ingrese su dirección completa"
                        rows={3}
                    />
                    {(errors.address || stepErrors.address) && <p className="text-sm text-red-500">{errors.address || stepErrors.address}</p>}
                </div>

                {/* Información empresarial */}
                <div className="border-t pt-4">
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Información Empresarial
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="companyRuc">RUC de la Empresa</Label>
                            <Input
                                id="companyRuc"
                                type="text"
                                value={data.companyRuc}
                                onChange={(e) => setData('companyRuc', e.target.value)}
                                placeholder="1234567890001"
                                maxLength={13}
                            />
                            {(errors.companyRuc || stepErrors.companyRuc) && <p className="text-sm text-red-500">{errors.companyRuc || stepErrors.companyRuc}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="companySocialReason">Razón Social de la Empresa</Label>
                            <Input
                                id="companySocialReason"
                                type="text"
                                value={data.companySocialReason}
                                onChange={(e) => setData('companySocialReason', e.target.value)}
                            />
                            {(errors.companySocialReason || stepErrors.companySocialReason) && <p className="text-sm text-red-500">{errors.companySocialReason || stepErrors.companySocialReason}</p>}
                        </div>
                    </div>

                    {isLegalRepresentative && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="positionCompany">Cargo en la Empresa *</Label>
                                    <Input
                                        id="positionCompany"
                                        type="text"
                                        value={data.positionCompany}
                                        onChange={(e) => setData('positionCompany', e.target.value)}
                                    />
                                    {(errors.positionCompany || stepErrors.positionCompany) && <p className="text-sm text-red-500">{errors.positionCompany || stepErrors.positionCompany}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="appointmentExpirationDate">Fecha de Expiración del Nombramiento *</Label>
                                    <Input
                                        id="appointmentExpirationDate"
                                        type="date"
                                        value={data.appointmentExpirationDate}
                                        onChange={(e) => setData('appointmentExpirationDate', e.target.value)}
                                    />
                                    {(errors.appointmentExpirationDate || stepErrors.appointmentExpirationDate) && <p className="text-sm text-red-500">{errors.appointmentExpirationDate || stepErrors.appointmentExpirationDate}</p>}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Información de transacción */}
                <div className="border-t pt-4">
                    <h3 className="text-lg font-medium mb-4">Información de Transacción</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="referenceTransaction">Referencia de Transacción *</Label>
                            <Input
                                id="referenceTransaction"
                                type="text"
                                value={data.referenceTransaction}
                                onChange={(e) => setData('referenceTransaction', e.target.value)}
                            />
                                <p className="text-xs text-gray-500 italic">
                                    El número de referencia se asignará al completar el proceso.
                                </p>
                            {(errors.referenceTransaction || stepErrors.referenceTransaction) && <p className="text-sm text-red-500">{errors.referenceTransaction || stepErrors.referenceTransaction}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="period">Período *</Label>
                            <Select value={data.period} onValueChange={(value) => setData('period', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione período" />
                                </SelectTrigger>
                                <SelectContent>
                                    {/* CORRECTO: Usar .map() directamente sobre el array de objetos */}
                                    {periods.map((plan) => (
                                        <SelectItem 
                                            key={plan.id}
                                            value={plan.period}
                                        >
                                            {plan.display_name} - ${plan.price}  
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {(errors.period || stepErrors.period) && <p className="text-sm text-red-500">{errors.period || stepErrors.period}</p>}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    const renderStep3 = () => (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documentos Requeridos
                </CardTitle>
                <CardDescription>
                    Suba todos los documentos necesarios para su solicitud
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Documentos de identificación */}
                <div>
                    <h3 className="text-lg font-medium mb-4">Documentos de Identificación</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="identificationFront">Cédula (Frontal) *</Label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                <Input
                                    id="identificationFront"
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange('identificationFront')}
                                    className="hidden"
                                />
                                <Label htmlFor="identificationFront" className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                                    Seleccionar archivo
                                </Label>
                                {data.identificationFront && (
                                    <p className="text-xs text-green-600 mt-1">{data.identificationFront.name}</p>
                                )}
                            </div>
                            {(errors.identificationFront || stepErrors.identificationFront) && <p className="text-sm text-red-500">{errors.identificationFront || stepErrors.identificationFront}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="identificationBack">Cédula (Posterior) *</Label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                <Input
                                    id="identificationBack"
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange('identificationBack')}
                                    className="hidden"
                                />
                                <Label htmlFor="identificationBack" className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                                    Seleccionar archivo
                                </Label>
                                {data.identificationBack && (
                                    <p className="text-xs text-green-600 mt-1">{data.identificationBack.name}</p>
                                )}
                            </div>
                            {(errors.identificationBack || stepErrors.identificationBack) && <p className="text-sm text-red-500">{errors.identificationBack || stepErrors.identificationBack}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="identificationSelfie">Selfie con Cédula *</Label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                <Input
                                    id="identificationSelfie"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange('identificationSelfie')}
                                    className="hidden"
                                />
                                <Label htmlFor="identificationSelfie" className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                                    Seleccionar archivo
                                </Label>
                                {data.identificationSelfie && (
                                    <p className="text-xs text-green-600 mt-1">{data.identificationSelfie.name}</p>
                                )}
                            </div>
                            {(errors.identificationSelfie || stepErrors.identificationSelfie) && <p className="text-sm text-red-500">{errors.identificationSelfie || stepErrors.identificationSelfie}</p>}
                        </div>
                    </div>
                </div>

                {/* Documentos empresariales */}
                {requiresCompanyDocs && (
                    <div className="border-t pt-4">
                        <h3 className="text-lg font-medium mb-4">Documentos Empresariales</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="pdfCompanyRuc">RUC de la Empresa *</Label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                    <Input
                                        id="pdfCompanyRuc"
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange('pdfCompanyRuc')}
                                        className="hidden"
                                    />
                                    <Label htmlFor="pdfCompanyRuc" className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                                        Seleccionar PDF
                                    </Label>
                                        {data.pdfCompanyRuc && (
                                        <p className="text-xs text-green-600 mt-1">{data.pdfCompanyRuc.name}</p>
                                    )}
                                </div>
                                {(errors.pdfCompanyRuc || stepErrors.pdfCompanyRuc) && <p className="text-sm text-red-500">{errors.pdfCompanyRuc || stepErrors.pdfCompanyRuc}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pdfCompanyConstitution">Constitución de la Empresa</Label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                    <Input
                                        id="pdfCompanyConstitution"
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange('pdfCompanyConstitution')}
                                        className="hidden"
                                    />
                                    <Label htmlFor="pdfCompanyConstitution" className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                                        Seleccionar PDF
                                    </Label>
                                    {data.pdfCompanyConstitution && (
                                        <p className="text-xs text-green-600 mt-1">{data.pdfCompanyConstitution.name}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Documentos de nombramiento */}
                {isLegalRepresentative && (
                    <div className="border-t pt-4">
                        <h3 className="text-lg font-medium mb-4">Documentos de Nombramiento</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="pdfRepresentativeAppointment">Nombramiento de Representante *</Label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                    <Input
                                        id="pdfRepresentativeAppointment"
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange('pdfRepresentativeAppointment')}
                                        className="hidden"
                                    />
                                    <Label htmlFor="pdfRepresentativeAppointment" className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                                        Seleccionar PDF
                                    </Label>
                                    {data.pdfRepresentativeAppointment && (
                                        <p className="text-xs text-green-600 mt-1">{data.pdfRepresentativeAppointment.name}</p>
                                    )}
                                </div>
                                {(errors.pdfRepresentativeAppointment || stepErrors.pdfRepresentativeAppointment) && <p className="text-sm text-red-500">{errors.pdfRepresentativeAppointment || stepErrors.pdfRepresentativeAppointment}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pdfAppointmentAcceptance">Aceptación del Nombramiento *</Label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                    <Input
                                        id="pdfAppointmentAcceptance"
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange('pdfAppointmentAcceptance')}
                                        className="hidden"
                                    />
                                    <Label htmlFor="pdfAppointmentAcceptance" className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                                        Seleccionar PDF
                                    </Label>
                                    {data.pdfAppointmentAcceptance && (
                                        <p className="text-xs text-green-600 mt-1">{data.pdfAppointmentAcceptance.name}</p>
                                    )}
                                </div>
                                {(errors.pdfAppointmentAcceptance || stepErrors.pdfAppointmentAcceptance) && <p className="text-sm text-red-500">{errors.pdfAppointmentAcceptance || stepErrors.pdfAppointmentAcceptance}</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Video de autorización - Solo para mayores de 65 años */}
                {isOver65 && (
                    <div className="border-t pt-4">
                        <h3 className="text-lg font-medium mb-4 text-orange-600">Video de Autorización Requerido</h3>
                        <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-4">
                            <h4 className="font-medium text-orange-800 mb-2">
                                ⚠️ Requisito Especial - Mayor de 65 años
                            </h4>
                            <p className="text-sm text-orange-700 mb-3">
                                Como persona mayor de 65 años, debe grabar un video de autorización leyendo exactamente el siguiente texto:
                            </p>
                            <div className="bg-white border border-orange-300 rounded p-3 text-sm font-mono text-gray-800">
                                {generateVideoTemplate()}
                            </div>
                            <p className="text-xs text-orange-600 mt-2">
                                📹 El video debe ser claro, con buena iluminación y audio. Asegúrese de leer el texto completo tal como aparece arriba.
                            </p>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="authorizationVideo">Video de Autorización *</Label>
                            <div className="border-2 border-dashed border-orange-300 rounded-lg p-4 text-center">
                                <Upload className="h-8 w-8 mx-auto text-orange-400 mb-2" />
                                <Input
                                    id="authorizationVideo"
                                    type="file"
                                    accept="video/*"
                                    onChange={handleFileChange('authorizationVideo')}
                                    className="hidden"
                                />
                                <Label htmlFor="authorizationVideo" className="cursor-pointer text-sm text-orange-600 hover:text-orange-800">
                                    Seleccionar Video
                                </Label>
                                {data.authorizationVideo && (
                                    <p className="text-xs text-green-600 mt-1">{data.authorizationVideo.name}</p>
                                )}
                            </div>
                            {(errors.authorizationVideo || stepErrors.authorizationVideo) && <p className="text-sm text-red-500">{errors.authorizationVideo || stepErrors.authorizationVideo}</p>}
                        </div>
                    </div>
                )}

                {/* Video de autorización opcional para menores de 65 años */}
                {!isOver65 && age >= 18 && (
                    <div className="border-t pt-4">
                        <h3 className="text-lg font-medium mb-4">Video de Autorización (Opcional)</h3>
                        <div className="space-y-2">
                            <Label htmlFor="authorizationVideo">Video de Autorización</Label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                <Input
                                    id="authorizationVideo"
                                    type="file"
                                    accept="video/*"
                                    onChange={handleFileChange('authorizationVideo')}
                                    className="hidden"
                                />
                                <Label htmlFor="authorizationVideo" className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                                    Seleccionar Video
                                </Label>
                                {data.authorizationVideo && (
                                    <p className="text-xs text-green-600 mt-1">{data.authorizationVideo.name}</p>
                                )}
                            </div>
                            <p className="text-xs text-gray-500">Grabe un video donde se identifique y autorice la solicitud (opcional)</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    const renderStep4 = () => (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Revisión y Envío
                </CardTitle>
                <CardDescription>
                    Revise su información antes de enviar la solicitud
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Resumen de información */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-3">Resumen de su solicitud:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <strong>Tipo:</strong> {applicationTypes[data.applicationType]}
                        </div>
                        <div>
                            <strong>Período:</strong> { periods.find(p => p.period === data.period)?.display_name }
                        </div>
                        <div>
                            <strong>Nombre:</strong> {data.applicantName} {data.applicantLastName}
                        </div>
                        <div>
                            <strong>Identificación:</strong> {data.identificationNumber}
                        </div>
                        <div>
                            <strong>Fecha de Nacimiento:</strong> {data.dateOfBirth} ({age} años)
                        </div>
                        <div>
                            <strong>Email:</strong> {data.emailAddress}
                        </div>
                        <div>
                            <strong>Teléfono:</strong> {data.cellphoneNumber}
                        </div>
                        <div className="md:col-span-2">
                            <strong>Dirección:</strong> {data.address}, {data.city}, {data.province}
                        </div>
                        {isOver65 && (
                            <div className="md:col-span-2 p-3 bg-orange-50 border border-orange-200 rounded">
                                <strong className="text-orange-800">⚠️ Requisito especial:</strong>
                                <span className="text-orange-700"> Video de autorización requerido (mayor de 65 años)</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Términos y condiciones */}
                <div className="border-t pt-4">
                    <div className="flex items-start space-x-2">
                        <Checkbox
                            id="terms"
                            checked={data.terms_accepted}
                            onCheckedChange={(checked) => setData('terms_accepted', checked as boolean)}
                        />
                        <Label htmlFor="terms" className="text-sm leading-relaxed">
                            Acepto los términos y condiciones, y autorizo el procesamiento de mis datos personales 
                            de acuerdo con las políticas de privacidad establecidas. Confirmo que toda la información 
                            proporcionada es veraz y completa.
                        </Label>
                    </div>
                    {(errors.terms_accepted || stepErrors.terms_accepted) && <p className="text-sm text-red-500 mt-1">{errors.terms_accepted || stepErrors.terms_accepted}</p>}
                </div>

                {/* Progreso de subida */}
                {progress && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${progress.percentage}%` }}
                        />
                        <p className="text-sm text-gray-600 mt-1">
                            Subiendo archivos... {progress.percentage}%
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nueva Solicitud de Certificado" />

            {/* --- modal que reaccionará a props.errors --- */}
            <ErrorModal />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Nueva Solicitud de Certificado</h1>
                        <p className="text-gray-600">
                            Complete el formulario para solicitar su certificado digital
                        </p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                        Paso {currentStep} de {totalSteps}
                    </div>
                </div>

                <StepIndicator />

                {/* Mostrar errores de validación si existen */}
                {Object.keys(stepErrors).length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    Hay errores que deben corregirse:
                                </h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <ul className="list-disc pl-5 space-y-1">
                                        {Object.values(stepErrors).map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-2">{getStepTitle(currentStep)}</h2>
                    </div>

                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                    {currentStep === 4 && renderStep4()}

                    <div className="flex justify-between pt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={prevStep}
                            disabled={currentStep === 1}
                        >
                            Anterior
                        </Button>

                        <div className="flex gap-3">
                            {currentStep < totalSteps ? (
                                <Button type="button" onClick={nextStep}>
                                    Siguiente
                                </Button>
                            ) : (
                                <Button 
                                    type="submit" 
                                    disabled={processing || !data.terms_accepted}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {processing ? 'Enviando...' : 'Enviar Solicitud'}
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
            </div>

            {/* Modal para crear ciudad */}
            <Dialog open={isCreateCityModalOpen} onOpenChange={setIsCreateCityModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Agregar Nueva Ciudad</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateCitySubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="modal-province">Provincia</Label>
                            <Select
                                value={newCityForm.province_id}
                                onValueChange={(value) => setNewCityForm({...newCityForm, province_id: value})}
                            >
                                <SelectTrigger>
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
                        
                        <div>
                            <Label htmlFor="modal-city-name">Nombre de la Ciudad</Label>
                            <Input
                                id="modal-city-name"
                                type="text"
                                value={newCityForm.name}
                                onChange={(e) => setNewCityForm({...newCityForm, name: e.target.value})}
                                placeholder="Ingresa el nombre de la ciudad"
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsCreateCityModalOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isCreatingCity}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {isCreatingCity ? 'Guardando...' : 'Guardar Ciudad'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}