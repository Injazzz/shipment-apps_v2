import { DataPagination } from '@/components/data-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FlagIcon } from '@/components/ui/flag-icon';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { ShipOperationsPageProps } from '@/types/ship-operations';
import { Head, Link, router } from '@inertiajs/react';
import {
    CalendarIcon,
    Check,
    ChevronDownIcon,
    ChevronUpIcon,
    DownloadIcon,
    EditIcon,
    EyeIcon,
    FileSpreadsheetIcon,
    FilterIcon,
    PlusIcon,
    SearchIcon,
    Trash2Icon,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

// Custom Year Selector Component
const YearSelector = ({
    selectedYears,
    onYearsChange,
    availableYears,
}: {
    selectedYears: number[];
    onYearsChange: (years: number[]) => void;
    availableYears: number[];
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter years based on search
    const filteredYears = availableYears.filter((year) => year.toString().includes(searchTerm));

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle year selection
    const handleYearToggle = (year: number) => {
        const newYears = selectedYears.includes(year) ? selectedYears.filter((y) => y !== year) : [...selectedYears, year];
        onYearsChange(newYears);
    };

    // Handle select all
    const handleSelectAll = () => {
        onYearsChange(filteredYears);
    };

    // Handle clear all
    const handleClearAll = () => {
        onYearsChange([]);
    };

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">Tahun</label>
            <div className="relative" ref={dropdownRef}>
                <Button variant="outline" className="w-full justify-between text-left font-normal" onClick={() => setIsOpen(!isOpen)} type="button">
                    <div className="flex items-center">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedYears.length > 0 ? `${selectedYears.length} tahun dipilih` : 'Pilih tahun'}
                    </div>
                    {isOpen ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                </Button>

                {isOpen && (
                    <div className="absolute top-full right-0 left-0 z-[9999] mt-1 max-h-[300px] overflow-hidden rounded-md border bg-white shadow-lg">
                        <div className="border-b p-3">
                            <Input placeholder="Cari tahun..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="mb-2" />
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={handleSelectAll} className="flex-1">
                                    Pilih Semua
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleClearAll} className="flex-1">
                                    Hapus Semua
                                </Button>
                            </div>
                        </div>

                        <div className="max-h-[200px] overflow-y-auto">
                            {filteredYears.length > 0 ? (
                                filteredYears.map((year) => (
                                    <div
                                        key={year}
                                        className={cn(
                                            'flex cursor-pointer items-center p-3 transition-colors hover:bg-gray-100',
                                            selectedYears.includes(year) && 'bg-blue-50',
                                        )}
                                        onClick={() => handleYearToggle(year)}
                                    >
                                        <div className="flex w-full items-center">
                                            <div
                                                className={cn(
                                                    'mr-3 flex h-4 w-4 items-center justify-center rounded border-2',
                                                    selectedYears.includes(year) ? 'border-blue-500 bg-blue-500' : 'border-gray-300',
                                                )}
                                            >
                                                {selectedYears.includes(year) && <Check className="h-3 w-3 text-white" />}
                                            </div>
                                            <span className="font-medium">{year}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-3 text-center text-gray-500">Tidak ada tahun yang ditemukan</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {selectedYears.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedYears
                        .sort((a, b) => b - a)
                        .map((year) => (
                            <Badge
                                key={year}
                                variant="secondary"
                                className="flex cursor-pointer items-center gap-1 hover:bg-gray-300"
                                onClick={() => handleYearToggle(year)}
                            >
                                {year}
                                <X className="h-3 w-3" />
                            </Badge>
                        ))}
                </div>
            )}
        </div>
    );
};

export default function ShipOperationsIndex({ operations, shippingLines, filters, flash }: ShipOperationsPageProps) {
    // Search and Filter States
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [cargoCategory, setCargoCategory] = useState(filters.cargo_category || '');
    const [selectedShippingLine, setSelectedShippingLine] = useState(filters.shipping_line || '');

    // Year Options
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);

    // Export Dialog States
    const [exportPeriod, setExportPeriod] = useState('monthly');
    const [exportYears, setExportYears] = useState<number[]>([currentYear]);
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

    // Import Dialog States
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);

    // Handle flash messages
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success, {
                duration: 5000,
                description: 'Import berhasil dijalankan',
            });
        }
        if (flash?.error) {
            toast.error(flash.error, {
                duration: 7000,
                description: 'Silakan periksa format file dan coba lagi',
            });
        }
    }, [flash]);

    // Search handler
    const handleSearch = () => {
        router.get(
            route('user.ship-operations.index'),
            {
                search: searchTerm,
                date_from: dateFrom,
                date_to: dateTo,
                cargo_category: cargoCategory,
                shipping_line: selectedShippingLine,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    // Reset filters
    const handleReset = () => {
        setSearchTerm('');
        setDateFrom('');
        setDateTo('');
        setCargoCategory('');
        setSelectedShippingLine('');
        router.get(route('user.ship-operations.index'));
    };

    // Export handler
    const handleExport = (withFilter: boolean) => {
        if (exportYears.length === 0) {
            toast.error('Pilih minimal 1 tahun');
            return;
        }

        const exportParams = {
            period: exportPeriod,
            years: exportYears.join(','),
            ...(withFilter && {
                search: searchTerm,
                date_from: dateFrom,
                date_to: dateTo,
                cargo_category: cargoCategory,
                shipping_line: selectedShippingLine,
            }),
        };

        window.location.href = route('user.ship-operations.export', exportParams);
        setIsExportDialogOpen(false);
    };

    // Import handler
    const handleImport = () => {
        if (!importFile) {
            toast.error('Pilih file terlebih dahulu');
            return;
        }

        const formData = new FormData();
        formData.append('file', importFile);

        const loadingToast = toast.loading('Mengimpor data...', {
            description: 'Mohon tunggu, sedang memproses file Excel',
        });

        router.post(route('user.ship-operations.import'), formData, {
            onSuccess: () => {
                toast.dismiss(loadingToast);
                setIsImportDialogOpen(false);
                setImportFile(null);
            },
            onError: (errors) => {
                toast.dismiss(loadingToast);
                console.error('Import error:', errors);
                const errorMessage = errors.file ? errors.file[0] : 'Terjadi kesalahan saat import';
                toast.error(errorMessage, {
                    description: 'Periksa format file dan coba lagi',
                });
            },
        });
    };

    // Delete handler
    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this operation?')) {
            router.delete(route('user.ship-operations.destroy', id));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ship Operations" />

            <div className="space-y-2 p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Data Produksi</h1>
                        <p className="text-muted-foreground">Atur data produksi anda</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline">
                            <Link href={route('user.ship-operations.analytics.index')}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                Analisa
                            </Link>
                        </Button>

                        {/* Export Dialog */}
                        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <DownloadIcon className="mr-2 h-4 w-4" />
                                    Export
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Export Laporan Produksi</DialogTitle>
                                    <DialogDescription>Pilih periode dan tahun untuk ekspor laporan komprehensif</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Periode Laporan</label>
                                        <Select value={exportPeriod} onValueChange={setExportPeriod}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="monthly">Per Bulan</SelectItem>
                                                <SelectItem value="quarterly">Per Kuartal (3 Bulan)</SelectItem>
                                                <SelectItem value="semi-annual">Per Semester (6 Bulan)</SelectItem>
                                                <SelectItem value="annual">Per Tahun</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Custom Year Selector */}
                                    <YearSelector selectedYears={exportYears} onYearsChange={setExportYears} availableYears={yearOptions} />

                                    <div className="border-t pt-4">
                                        <p className="mb-3 text-sm text-muted-foreground">Laporan akan mencakup:</p>
                                        <ul className="ml-4 space-y-1 text-xs text-muted-foreground">
                                            <li>• Sheet terpisah untuk setiap tahun yang dipilih</li>
                                            {exportYears.length > 1 && <li>• Sheet ringkasan multi-tahun</li>}
                                            <li>• Data terpisah per kategori (GC & Container)</li>
                                            <li>• Total kapal, tonnage bongkar & muat</li>
                                            <li>• Kapal & cargo paling produktif</li>
                                        </ul>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <Button onClick={() => handleExport(false)} className="flex-1" disabled={exportYears.length === 0}>
                                            <FileSpreadsheetIcon className="mr-2 h-4 w-4" />
                                            {exportYears.length > 1 ? 'Export Multi-Tahun' : 'Export'}
                                        </Button>
                                        <Button
                                            onClick={() => handleExport(true)}
                                            variant="outline"
                                            className="flex-1"
                                            disabled={exportYears.length === 0}
                                        >
                                            Export dengan Filter
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* Import Dialog */}
                        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <FileSpreadsheetIcon className="mr-2 h-4 w-4" />
                                    Import
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Import Data Produksi</DialogTitle>
                                    <DialogDescription>Upload file Excel (.xlsx/.xls) dengan format data produksi</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">File Excel</label>
                                        <Input type="file" accept=".xlsx,.xls" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
                                    </div>
                                    {importFile && <div className="text-sm text-muted-foreground">File selected: {importFile.name}</div>}
                                    <div className="border-t pt-4">
                                        <p className="mb-3 text-sm text-muted-foreground">Format yang didukung:</p>
                                        <ul className="ml-4 space-y-1 text-xs text-muted-foreground">
                                            <li>• Data terpisah per kategori (GC & Container)</li>
                                            <li>• Kolom: No, Nama Kapal, Line, Bendera, Cargo, T/Bongkar, T/Muat</li>
                                            <li>• Header bulan/tahun (contoh: JANUARI 2024)</li>
                                            <li>• Format angka dengan koma atau titik desimal</li>
                                        </ul>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <Button onClick={handleImport} disabled={!importFile} className="flex-1">
                                            <FileSpreadsheetIcon className="mr-2 h-4 w-4" />
                                            Import Data
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setIsImportDialogOpen(false);
                                                setImportFile(null);
                                            }}
                                            className="flex-1"
                                        >
                                            Batal
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Button asChild>
                            <Link href={route('user.ship-operations.create')}>
                                <PlusIcon className="mr-2 h-4 w-4" />
                                Tambah data
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Search and Filter Card */}
                <Card className="border-0">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-4 md:flex-row">
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                    <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search ships or cargo..."
                                        className="max-w-3xl pl-10"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button variant="outline">
                                            <FilterIcon className="mr-2 h-4 w-4" />
                                            Filter
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="right" className="z-50 w-[400px] p-4 sm:w-[740px]">
                                        <SheetHeader>
                                            <SheetTitle>Advanced Filters</SheetTitle>
                                        </SheetHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Dari tanggal</label>
                                                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Sampai tanggal</label>
                                                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Kategori Kargo</label>
                                                <Select value={cargoCategory} onValueChange={setCargoCategory}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="All Categories" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all" disabled>
                                                            All Categories
                                                        </SelectItem>
                                                        <SelectItem value="CONTAINER">Container</SelectItem>
                                                        <SelectItem value="GC">General Cargo</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Shipping Line</label>
                                                <Select value={selectedShippingLine} onValueChange={setSelectedShippingLine}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="All Shipping Lines" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all" disabled>
                                                            All Shipping Lines
                                                        </SelectItem>
                                                        {shippingLines.map((line) => (
                                                            <SelectItem key={line.id} value={line.id.toString()}>
                                                                {line.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={handleSearch}>Terapkan Filter</Button>
                                            <Button variant="outline" onClick={handleReset}>
                                                Reset
                                            </Button>
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Data Table */}
                {operations.data.length > 0 ? (
                    <Card className="p-2">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kapal</TableHead>
                                    <TableHead>Tanggal Operasi</TableHead>
                                    <TableHead>Kargo</TableHead>
                                    <TableHead>Bongkar (T)</TableHead>
                                    <TableHead>Muat (T)</TableHead>
                                    <TableHead>Total (T)</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {operations.data.map((operation) => (
                                    <TableRow key={operation.id} className="hover:bg-muted-foreground/10">
                                        <TableCell className="flex h-full items-center gap-2">
                                            <FlagIcon countryCode={operation.ship.country.code} className="mr-2" />
                                            <div className="font-medium">{operation.ship.name}</div>
                                            <div className="text-xs text-muted-foreground">{operation.ship.shipping_line.name}</div>
                                        </TableCell>
                                        <TableCell>{formatDate(operation.operation_date)}</TableCell>
                                        <TableCell className="flex items-center gap-2">
                                            <div>{operation.cargo_type.name}</div>
                                            <Badge variant="outline" className="mt-1 text-xs">
                                                {operation.cargo_type.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatNumber(operation.unloading_tonnage)}</TableCell>
                                        <TableCell>{formatNumber(operation.loading_tonnage)}</TableCell>
                                        <TableCell className="font-medium">
                                            {formatNumber(
                                                parseFloat(operation.unloading_tonnage.toString()) + parseFloat(operation.loading_tonnage.toString()),
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        ⋮
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={route('user.ship-operations.show', operation.id)}>
                                                            <EyeIcon className="mr-2 h-4 w-4" />
                                                            Lihat
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={route('user.ship-operations.edit', operation.id)}>
                                                            <EditIcon className="mr-2 h-4 w-4" />
                                                            Ubah
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(operation.id)}>
                                                        <Trash2Icon className="mr-2 h-4 w-4" />
                                                        Hapus
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="mt-2">
                            <DataPagination
                                links={operations.links}
                                current_page={operations.current_page}
                                last_page={operations.last_page}
                                from={operations.from}
                                to={operations.to}
                                total={operations.total}
                            />
                        </div>
                    </Card>
                ) : (
                    <Card className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="text-lg text-muted-foreground">Tidak ada data produksi dibuat</div>
                        <Button asChild className="mt-4 w-full max-w-sm">
                            <Link href={route('user.ship-operations.create')}>
                                <PlusIcon className="mr-2 h-4 w-4" />
                                Buat data pertamamu
                            </Link>
                        </Button>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
