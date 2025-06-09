import { PageProps } from '@inertiajs/core';

export interface Country {
    id: number;
    name: string;
    code: string;
    alpha3: string;
    flag_emoji: string;
}

export interface ShippingLine {
    id: number;
    name: string;
}

export interface CargoType {
    id: number;
    name: string;
    category: 'bulk' | 'container' | 'general';
}

export interface Ship {
    id: number;
    name: string;
    shipping_line: ShippingLine;
    shipping_line_id: number;
    country: Country;
    country_id: number;
    capacity: number | null;
    created_at: string;
    updated_at: string;
}

export interface ShipOperation {
    remarks: string;
    id: number;
    ship: Ship;
    operation_date: string;
    cargo_type: CargoType;
    unloading_tonnage: number;
    loading_tonnage: number;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedData<T> {
    data: T[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
}

export interface ShipOperationsFilters {
    search?: string;
    date_from?: string;
    date_to?: string;
    cargo_category?: string;
    shipping_line?: string;
}

export interface ShipOperationsPageProps extends PageProps {
    operations: PaginatedData<ShipOperation>;
    shippingLines: ShippingLine[];
    filters: {
        search?: string;
        date_from?: string;
        date_to?: string;
        cargo_category?: string;
        shipping_line?: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}
