/// <reference types="react" />
/// <reference types="react-dom" />

import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href?: string; // Href es opcional para los items que son solo contenedores de sub-menús
    icon?: LucideIcon | null;
    isActive?: boolean;
    children?: NavItem[]; // Array de sub-items para el desplegable
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

// Usuario base (extendido para incluir roles)
export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    roles?: Role[];
    permissions?: string[];
    [key: string]: unknown;
}

// Nuevas interfaces para el sistema de roles
export interface Role {
    id: number;
    name: string;
    display_name: string;
    description?: string;
    permissions?: Permission[];
    users_count?: number;
    created_at: string;
    updated_at: string;
}

export interface Permission {
    id: number;
    name: string;
    display_name: string;
    description?: string;
    module: string;
    created_at: string;
    updated_at: string;
}

export interface PaginatedUsers {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    prev_page_url?: string;
    next_page_url?: string;
}

// Usuario autenticado con métodos de roles
export interface AuthUser extends User {
    hasRole: (role: string) => boolean;
    hasPermission: (permission: string) => boolean;
    getAllPermissions: () => string[];
}

// Props globales de página
export interface PageProps {
    auth: {
        user: AuthUser;
    };
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
}

// Interfaces para Certificaciones
export interface Certification {
    id: number;
    certification_number?: string;
    user_id: number;
    
    // Información personal
    identificationNumber: string;
    applicantName: string;
    applicantLastName: string;
    applicantSecondLastName?: string;
    fingerCode: string;
    emailAddress: string;
    cellphoneNumber: string;
    dateOfBirth?: string;
    clientAge?: number;
    
    // Ubicación
    city: string;
    province: string;
    address: string;
    countryCode: string;
    
    // Información empresarial
    companyRuc?: string;
    positionCompany?: string;
    companySocialReason?: string;
    appointmentExpirationDate?: string;
    
    // Tipo y transacción
    documentType: string;
    applicationType: 'NATURAL_PERSON' | 'LEGAL_REPRESENTATIVE';
    referenceTransaction: string;
    period: 'ONE_WEEK' | 'ONE_MONTH' | 'ONE_YEAR' | 'TWO_YEARS' | 'THREE_YEARS' | 'FOUR_YEARS' | 'FIVE_YEARS';
    
    // Archivos
    identificationFront?: string;
    identificationBack?: string;
    identificationSelfie?: string;
    pdfCompanyRuc?: string;
    pdfRepresentativeAppointment?: string;
    pdfAppointmentAcceptance?: string;
    pdfCompanyConstitution?: string;
    authorizationVideo?: string;
    
    // Estados
    status: 'draft' | 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed';
    validationStatus: 'REGISTERED' | 'VALIDATING' | 'REFUSED' | 'ERROR' | 'APPROVED' | 'GENERATED' | 'EXPIRED';
    rejection_reason?: string;
    processed_by?: number;
    processed_at?: string;
    submitted_at?: string;
    
    // Metadatos
    metadata?: any;
    terms_accepted: boolean;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
    updated_at: string;
    
    // Relaciones
    user?: User;
    processedBy?: User;
}

export interface PaginatedCertifications {
    data: Certification[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    prev_page_url?: string;
    next_page_url?: string;
}

export interface PaymentMethod {
    id: number;
    name: string;
    display_name: string;
    description?: string;
    is_active: boolean;
}

export interface Signature {
    id: number;
    period: string;
    display_name: string;
    cost: string; // Eloquent los devuelve como strings
    price: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
}

export interface PaginatedSignatures {
    data: Signature[];
    current_page: number;
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: { url: string | null; label: string; active: boolean }[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

export interface Payment {
    id: number;
    certification_id: number;
    method_id: number;
    amount: string; // Eloquent los devuelve como strings
    status: 'pending' | 'verified';
    transaction_id?: string;
    receipt?: string;
    detailable_type?: string;
    detailable_id?: number;
    created_at: string;
    updated_at: string;

    // Relaciones
    certification?: Certification;
    method?: PaymentMethod;
}

export interface PaginatedPayments {
    data: Payment[];
    current_page: number;
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: { url: string | null; label: string; active: boolean }[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}
