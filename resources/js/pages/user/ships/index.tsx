import { DataPagination } from '@/components/data-pagination';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FlagIcon } from '@/components/ui/flag-icon';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatNumber } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import { Edit, Filter, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Ship {
    id: number;
    name: string;
    capacity: number | null;
    country: {
        id: number;
        name: string;
        code: string;
        flag_emoji: string;
    };
    shipping_line: {
        id: number;
        name: string;
        type: string;
    };
}

interface Country {
    id: number;
    name: string;
    code: string;
    flag_emoji: string;
}

interface ShippingLine {
    id: number;
    name: string;
    type: string;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    from: number;
    to: number;
    total: number;
    last_page: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface ShipsIndexProps {
    ships: PaginatedData<Ship>;
    countries: Country[];
    shippingLines: ShippingLine[];
    filters: {
        search?: string;
        shipping_line?: string;
        country?: string;
        capacity_min?: string;
        capacity_max?: string;
    };
}

export default function ShipsIndex({ ships, countries, shippingLines, filters }: ShipsIndexProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedShippingLine, setSelectedShippingLine] = useState(filters.shipping_line || '');
    const [selectedCountry, setSelectedCountry] = useState(filters.country || '');
    const [capacityMin, setCapacityMin] = useState(filters.capacity_min || '');
    const [capacityMax, setCapacityMax] = useState(filters.capacity_max || '');

    const handleSearch = () => {
        router.get(
            route('user.ships.index'),
            {
                search: searchTerm,
                shipping_line: selectedShippingLine,
                country: selectedCountry,
                capacity_min: capacityMin,
                capacity_max: capacityMax,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleReset = () => {
        setSearchTerm('');
        setSelectedShippingLine('');
        setSelectedCountry('');
        setCapacityMin('');
        setCapacityMax('');
        router.get(route('user.ships.index'));
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this ship?')) {
            router.delete(route('user.ships.destroy', id));
        }
    };

    return (
        <AppLayout>
            <Head title="Data Kapal" />
            <div className="space-y-2 p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Data Kapal</h1>
                        <p className="text-muted-foreground">Kelola data kapal dan informasi terkait</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button asChild>
                            <Link href={route('user.ships.create')}>
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah Kapal
                            </Link>
                        </Button>
                    </div>
                </div>

                <Card className="border-0">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-4 md:flex-row">
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari nama kapal, shipping line, atau negara..."
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
                                            <Filter className="mr-2 h-4 w-4" />
                                            Filter
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="right" className="z-50 w-[400px] p-4 sm:w-[540px]">
                                        <SheetHeader>
                                            <SheetTitle>Filter Lanjutan</SheetTitle>
                                        </SheetHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Shipping Line</label>
                                                <Select value={selectedShippingLine} onValueChange={setSelectedShippingLine}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Semua Shipping Line" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all" disabled>
                                                            Semua Shipping Line
                                                        </SelectItem>
                                                        {shippingLines.map((line) => (
                                                            <SelectItem key={line.id} value={line.id.toString()}>
                                                                {line.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Negara</label>
                                                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Semua Negara" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all" disabled>
                                                            Semua Negara
                                                        </SelectItem>
                                                        {countries.map((country) => (
                                                            <SelectItem key={country.id} value={country.id.toString()}>
                                                                <div className="flex items-center gap-2">
                                                                    <span>{country.flag_emoji}</span>
                                                                    <span>{country.name}</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Kapasitas Min</label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={capacityMin}
                                                        onChange={(e) => setCapacityMin(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Kapasitas Max</label>
                                                    <Input
                                                        type="number"
                                                        placeholder="100000"
                                                        value={capacityMax}
                                                        onChange={(e) => setCapacityMax(e.target.value)}
                                                    />
                                                </div>
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

                {ships.data.length > 0 ? (
                    <Card className="p-2">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Kapal</TableHead>
                                    <TableHead>Shipping Line</TableHead>
                                    <TableHead>Negara</TableHead>
                                    <TableHead>Kapasitas</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ships.data.map((ship) => (
                                    <TableRow key={ship.id} className="h-12 hover:bg-muted-foreground/10">
                                        <TableCell className="font-medium">{ship.name}</TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{ship.shipping_line.name}</div>
                                                {/* <Badge variant="outline" className="mt-1 text-xs">
                                                    {ship.shipping_line.type}
                                                </Badge> */}
                                            </div>
                                        </TableCell>
                                        <TableCell className="flex h-12 items-center gap-2">
                                            <FlagIcon countryCode={ship.country.code} className="mr-2" />
                                            <span>{ship.country.name}</span>
                                        </TableCell>
                                        <TableCell>{ship.capacity ? formatNumber(ship.capacity) + ' ton' : 'Tidak tersedia'}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        ⋮
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={route('user.ships.edit', ship.id)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Ubah
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(ship.id)}>
                                                        <Trash2 className="mr-2 h-4 w-4" />
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
                                links={ships.links}
                                current_page={ships.current_page}
                                last_page={ships.last_page}
                                from={ships.from}
                                to={ships.to}
                                total={ships.total}
                            />
                        </div>
                    </Card>
                ) : (
                    <Card className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="text-lg text-muted-foreground">
                            {filters.search || filters.shipping_line || filters.country || filters.capacity_min || filters.capacity_max
                                ? 'Tidak ada kapal yang sesuai dengan filter'
                                : 'Belum ada data kapal'}
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                            {filters.search || filters.shipping_line || filters.country || filters.capacity_min || filters.capacity_max ? (
                                <Button variant="link" onClick={handleReset} className="h-auto p-0">
                                    Hapus filter untuk melihat semua data
                                </Button>
                            ) : (
                                <Button asChild className="mt-4">
                                    <Link href={route('user.ships.create')}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Tambah kapal pertama
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
