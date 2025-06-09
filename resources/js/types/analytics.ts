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
}

export interface TonnageTrend {
    period: string;
    loading: number;
    unloading: number;
    total: number;
}

export interface CargoComparison {
    name: string;
    category: string;
    loading: number;
    unloading: number;
}

export interface TopShip {
    name: string;
    country: string;
    flag_emoji: string;
    total_tonnage: number;
    total_operations: number;
}

export interface AnalyticsData {
    summary: AnalyticsSummary;
    trends: TonnageTrend[];
    cargoComparison: CargoComparison[];
    topShips: TopShip[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    monthlyOperations: any[]; // TODO: Define proper type if needed
}
