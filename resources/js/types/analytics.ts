export interface AnalyticsSummary {
    totalOperations: number;
    totalTonnage: number;
    totalUnloading: number;
    totalLoading: number;
    avgTonnagePerOperation: number;
    activeShips: number;
    tonnageGrowth: number;
    totalCargoTypes: number;
    operationsGrowth: number;
    activeShipsGrowth: number;
    avgTonnageGrowth: number;
    lastPeriodOperations?: number;
    lastPeriodTonnage?: number;
    yearToDateTonnage?: number;
    yearToDateOperations?: number;
    efficiencyScore?: number;
}

export interface TonnageTrend {
    period: string;
    loading: number;
    unloading: number;
    total: number;
    date: string;
    operations: number;
    averageTonnage: number;
    yearOverYearGrowth?: number;
    efficiency?: number;
}

export interface CargoComparison {
    id: number;
    name: string;
    category: 'CONTAINER' | 'GC';
    loading: number;
    unloading: number;
    percentage: number;
    year_to_date: number;
    growth: number;
    trend?: Array<{ date: string; value: number }>;
}

export interface TopShip {
    id: number;
    name: string;
    country: string;
    flag_emoji: string;
    total_tonnage: number;
    total_operations: number;
    average_tonnage: number;
    last_operation: string;
    shipping_line: string;
    performance_score?: number;
    utilization_rate?: number;
    most_common_cargo?: string;
}

export interface AnalyticsData {
    summary: AnalyticsSummary;
    trends: TonnageTrend[];
    cargoComparison: CargoComparison[];
    topShips: TopShip[];
    monthlyOperations: MonthlyOperation[];
    filters: AnalyticsFilters;
}

export interface MonthlyOperation {
    month: string;
    operations: number;
    tonnage: number;
    loading: number;
    unloading: number;
    unique_ships: number;
    average_tonnage: number;
    date: string;
    efficiency_rate?: number;
    delay_percentage?: number;
    utilization_score?: number;
}

export interface AnalyticsFilters {
    date_from?: string;
    date_to?: string;
    period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
    cargo_category?: string;
    shipping_line?: string;
    min_tonnage?: number;
    max_tonnage?: number;
    sort_by?: 'date' | 'tonnage' | 'operations' | 'efficiency';
    sort_order?: 'asc' | 'desc';
}
