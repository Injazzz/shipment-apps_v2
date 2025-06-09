/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// resources/js/Pages/user/ship-operations/analytics/index.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { AnalyticsSummary, CargoComparison, MonthlyOperation, TonnageTrend, TopShip } from '@/types/analytics';
import { Head, router } from '@inertiajs/react';
import { Activity, Download, Package, Ship, TrendingDown, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

const CHART_COLORS = {
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))',
    accent: 'hsl(var(--accent))',
    muted: 'hsl(var(--muted))',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    purple: '#a855f7',
    pink: '#ec4899',
};

const PIE_COLORS = [CHART_COLORS.primary, CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.info, CHART_COLORS.purple, CHART_COLORS.pink];

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface PageProps {
    summary: AnalyticsSummary;
    trends: TonnageTrend[];
    cargoComparison: CargoComparison[];
    topShips: TopShip[];
    monthlyOperations: MonthlyOperation[];
    filters?: {
        date_from?: string;
        date_to?: string;
        period?: string;
    };
}

const chartConfig = {
    loading: {
        label: 'Loading',
        color: CHART_COLORS.primary,
    },
    unloading: {
        label: 'Unloading',
        color: CHART_COLORS.success,
    },
    operations: {
        label: 'Operations',
        color: CHART_COLORS.info,
    },
    tonnage: {
        label: 'Tonnage (tons)',
        color: CHART_COLORS.warning,
    },
    total: {
        label: 'Total Tonnage',
        color: CHART_COLORS.primary,
    },
    average: {
        label: 'Average Tonnage',
        color: CHART_COLORS.success,
    },
} satisfies ChartConfig;

export default function ShipOperationsAnalytics({ summary, trends, cargoComparison, topShips, monthlyOperations, filters }: PageProps) {
    const [period, setPeriod] = useState(filters?.period || 'month');
    const [isLoading, setIsLoading] = useState(false);
    const { date_from, date_to } = filters || {};

    // Ref untuk mencegah multiple requests bersamaan
    const isRefreshingRef = useRef(false);
    const previousFiltersRef = useRef<string>('');

    // Handle data refresh when filters change
    const refreshData = useCallback(() => {
        // Prevent multiple simultaneous requests
        if (isRefreshingRef.current) return;

        const currentFilters = JSON.stringify({ period, date_from, date_to });

        // Only refresh if filters actually changed
        if (currentFilters === previousFiltersRef.current) return;

        isRefreshingRef.current = true;
        setIsLoading(true);
        previousFiltersRef.current = currentFilters;

        router.reload({
            data: {
                period,
                date_from,
                date_to,
            },
            onSuccess: () => {
                setIsLoading(false);
                isRefreshingRef.current = false;
            },
            onError: (error) => {
                console.error('Error reloading data:', error);
                setIsLoading(false);
                isRefreshingRef.current = false;
            },
            onFinish: () => {
                setIsLoading(false);
                isRefreshingRef.current = false;
            },
        });
    }, [period, date_from, date_to]);

    // Hanya refresh saat filters benar-benar berubah
    useEffect(() => {
        const currentFilters = JSON.stringify({ period, date_from, date_to });
        const initialFilters = JSON.stringify({
            period: filters?.period || 'month',
            date_from: filters?.date_from,
            date_to: filters?.date_to,
        });

        // Skip initial render atau jika filters tidak berubah
        if (currentFilters === initialFilters || currentFilters === previousFiltersRef.current) {
            return;
        }

        // Debounce untuk menghindari terlalu banyak request
        const timeoutId = setTimeout(() => {
            refreshData();
        }, 300);

        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [period, date_from, date_to, refreshData]);

    const handleExport = () => {
        try {
            // Pastikan window.route tersedia, jika tidak gunakan alternatif
            let exportUrl;
            if (typeof window !== 'undefined' && (window as any).route) {
                exportUrl = (window as any).route('user.ship-operations.export', {
                    period,
                    date_from,
                    date_to,
                });
            } else {
                // Fallback jika route helper tidak tersedia
                const params = new URLSearchParams({
                    period,
                    ...(date_from && { date_from }),
                    ...(date_to && { date_to }),
                }).toString();
                exportUrl = `/user/ship-operations/export?${params}`;
            }

            window.location.href = exportUrl;
        } catch (error) {
            console.error('Export error:', error);
            // Fallback export
            const params = new URLSearchParams({
                period,
                ...(date_from && { date_from }),
                ...(date_to && { date_to }),
            }).toString();
            window.location.href = `/user/ship-operations/export?${params}`;
        }
    };

    // Format trends data for area chart
    const formattedTrends = (trends ?? []).map((item) => ({
        name: item.period,
        loading: item.loading ?? 0,
        unloading: item.unloading ?? 0,
        total: item.total ?? 0,
    }));

    // Format monthly operations data for multiple bar chart
    const monthlyData = (monthlyOperations ?? []).map((item) => ({
        name: item.month ?? '',
        operations: item.operations ?? 0,
        tonnage: item.tonnage ?? 0,
        loading: item.loading ?? 0,
        unloading: item.unloading ?? 0,
        unique_ships: item.unique_ships ?? 0,
        average_tonnage: item.average_tonnage ?? 0,
    }));

    const formatNumber = (num: number) => {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        }
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toLocaleString();
    };

    const GrowthIndicator = ({ value }: { value: number }) => {
        const isPositive = value >= 0;
        const Icon = isPositive ? TrendingUp : TrendingDown;
        return (
            <div className={cn('flex items-center gap-1', isPositive ? 'text-green-300' : 'text-red-300')}>
                <Icon className="h-3 w-3" />
                <span className="text-xs font-medium">
                    {isPositive ? '+' : ''}
                    {value.toFixed(1)}%
                </span>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan dan Analisa Dashboard" />

            <div className="min-h-screen">
                <div className="container mx-auto space-y-8 p-4 md:p-6 lg:p-8">
                    {/* Header Section */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                Analisa dan Laporan Data Produksi
                            </h1>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Analisa komprehensif untuk produk</p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <DateRangePicker dateFrom={date_from} dateTo={date_to} />
                            <Select value={period} onValueChange={setPeriod}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue>{period.charAt(0).toUpperCase() + period.slice(1)}ly</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="day">Daily</SelectItem>
                                    <SelectItem value="week">Weekly</SelectItem>
                                    <SelectItem value="month">Monthly</SelectItem>
                                    <SelectItem value="quarter">Quarterly</SelectItem>
                                    <SelectItem value="year">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleExport} disabled={isLoading} className="hidden w-full sm:w-auto">
                                <Download className="mr-2 h-4 w-4" />
                                Export
                            </Button>
                        </div>
                    </div>

                    {/* Loading Overlay */}
                    {isLoading && (
                        <div className="fixed inset-0 z-50 flex h-screen items-center justify-center bg-black/20 backdrop-blur-sm">
                            <div className="rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                                    <span className="text-sm font-medium">Loading analytics...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Summary Cards */}
                    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', isLoading && 'pointer-events-none opacity-50')}>
                        <Card className="border-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium opacity-90">Total Operations</CardTitle>
                                <Activity className="h-5 w-5 opacity-80" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatNumber(summary?.totalOperations ?? 0)}</div>
                                <div className="mt-1 flex items-center justify-between">
                                    <GrowthIndicator value={summary?.operationsGrowth ?? 0} />
                                    <span className="text-xs opacity-80">vs last period</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium opacity-90">Total Tonnage</CardTitle>
                                <Package className="h-5 w-5 opacity-80" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatNumber(summary?.totalTonnage ?? 0)} tons</div>
                                <div className="mt-1 flex items-center justify-between">
                                    <GrowthIndicator value={summary?.tonnageGrowth ?? 0} />
                                    <span className="text-xs opacity-80">vs last period</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium opacity-90">Active Ships</CardTitle>
                                <Ship className="h-5 w-5 opacity-80" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{summary?.activeShips ?? 0}</div>
                                <div className="mt-1 flex items-center justify-between">
                                    <GrowthIndicator value={summary?.activeShipsGrowth ?? 0} />
                                    <span className="text-xs opacity-80">vs last period</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium opacity-90">Cargo Types</CardTitle>
                                <Package className="h-5 w-5 opacity-80" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{summary?.totalCargoTypes ?? 0}</div>
                                <p className="mt-1 text-xs opacity-80">Different cargo types handled</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Charts Grid */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Tonnage Trends Area Chart */}
                        <Card className="border-0 bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-800/70">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-blue-500" />
                                    Tonnage Trends Over Time
                                </CardTitle>
                                <CardDescription>Loading vs unloading operations comparison</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={chartConfig}>
                                    <AreaChart accessibilityLayer data={formattedTrends} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                        <defs>
                                            <linearGradient id="fillLoading" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8} />
                                                <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.1} />
                                            </linearGradient>
                                            <linearGradient id="fillUnloading" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.8} />
                                                <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0.1} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                        <Area
                                            dataKey="loading"
                                            type="natural"
                                            fill="url(#fillLoading)"
                                            fillOpacity={0.4}
                                            stroke={CHART_COLORS.primary}
                                            strokeWidth={2}
                                        />
                                        <Area
                                            dataKey="unloading"
                                            type="natural"
                                            fill="url(#fillUnloading)"
                                            fillOpacity={0.4}
                                            stroke={CHART_COLORS.success}
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        {/* Monthly Operations Multiple Bar Chart */}
                        <Card className="border-0 bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-800/70">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-orange-500" />
                                    Monthly Performance
                                </CardTitle>
                                <CardDescription>Operations count vs tonnage by month</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={chartConfig}>
                                    <BarChart accessibilityLayer data={monthlyData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                                        <Bar dataKey="operations" fill={CHART_COLORS.info} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="tonnage" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detailed Data Table */}
                    <Card className="border-0 bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-800/70">
                        <CardHeader>
                            <CardTitle>Detailed Cargo Analysis</CardTitle>
                            <CardDescription>Complete breakdown of loading and unloading operations by cargo type</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="pb-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Cargo Type</th>
                                            <th className="pb-3 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">Loading</th>
                                            <th className="pb-3 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">Unloading</th>
                                            <th className="pb-3 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">Total</th>
                                            <th className="pb-3 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {(cargoComparison ?? []).map((cargo, index) => {
                                            const loading = cargo.loading ?? 0;
                                            const unloading = cargo.unloading ?? 0;
                                            const total = loading + unloading;
                                            const totalSum = cargoComparison.reduce(
                                                (sum, item) => sum + (item.loading ?? 0) + (item.unloading ?? 0),
                                                0,
                                            );
                                            const percentage = totalSum > 0 ? (total / totalSum) * 100 : 0;

                                            return (
                                                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                    <td className="py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                                                        {cargo.name ?? 'Unknown'}
                                                    </td>
                                                    <td className="py-4 text-right text-sm text-slate-600 dark:text-slate-400">
                                                        {formatNumber(loading)} tons
                                                    </td>
                                                    <td className="py-4 text-right text-sm text-slate-600 dark:text-slate-400">
                                                        {formatNumber(unloading)} tons
                                                    </td>
                                                    <td className="py-4 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                        {formatNumber(total)} tons
                                                    </td>
                                                    <td className="py-4 text-right text-sm text-slate-600 dark:text-slate-400">
                                                        {percentage.toFixed(1)}%
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
