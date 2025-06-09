/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { CargoTypeCombobox, ShipCombobox } from '@/components/combobox-with-width';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { CargoType, Country, Ship, ShippingLine } from '@/types/ship-operations';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface CreateShipOperationProps {
    countries: Country[];
    shippingLines: ShippingLine[];
    cargoTypes: CargoType[];
    ships: Ship[];
}

interface ShipOperationFormData {
    ship_id: string;
    cargo_type_id: string;
    operation_date: string;
    unloading_tonnage: string | number;
    loading_tonnage: string | number;
    remarks: string;
    [key: string]: string | number | undefined;
}

const formatNumberDisplay = (value: string | number): string => {
    if (!value && value !== 0) return ''; // Perbaikan untuk handle nilai 0

    const numStr = value.toString().trim();
    if (numStr === '') return '';

    // Jika input masih dalam proses (mengandung koma di akhir)
    if (numStr.endsWith(',')) {
        const wholeNumber = numStr.replace(/\./g, '').replace(',', '');
        return addThousandSeparators(wholeNumber) + ',';
    }

    // Jika sudah ada koma (desimal)
    if (numStr.includes(',')) {
        const parts = numStr.split(',');
        if (parts.length === 2) {
            const wholeNumber = parts[0].replace(/\./g, '');
            const formattedWhole = addThousandSeparators(wholeNumber);
            const decimal = parts[1].slice(0, 3);
            return formattedWhole + ',' + decimal;
        }
    }

    // Format angka biasa (tanpa desimal)
    const wholeNumber = numStr.replace(/\./g, '');
    return addThousandSeparators(wholeNumber);
};

// Helper function to add thousand separators
const addThousandSeparators = (numStr: string): string => {
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseNumberForSubmit = (value: string | number): number => {
    if (!value && value !== 0) return 0;

    const valueStr = value.toString();

    // Hapus semua pemisah ribuan (titik)
    let cleanValue = valueStr.replace(/\./g, '');

    // Ganti koma desimal dengan titik
    cleanValue = cleanValue.replace(',', '.');

    // Konversi ke number
    const number = parseFloat(cleanValue);

    return isNaN(number) ? 0 : number;
};

const handleNumberInput = (field: 'unloading_tonnage' | 'loading_tonnage', value: string, setData: (field: string, value: string) => void) => {
    // Hanya izinkan angka, titik, dan koma
    let cleanValue = value.replace(/[^0-9.,]/g, '');

    // Jika user mengetik koma pertama kali
    if (cleanValue === ',') {
        setData(field, '0,');
        return;
    }

    // Pisahkan bagian desimal jika ada
    const [integerPart, decimalPart] = cleanValue.split(',');

    let formattedValue = '';

    // Format bagian integer
    if (integerPart) {
        // Hapus semua titik yang ada
        const cleanInteger = integerPart.replace(/\./g, '');
        // Tambahkan pemisah ribuan
        formattedValue = addThousandSeparators(cleanInteger);
    }

    // Tambahkan bagian desimal jika ada
    if (decimalPart !== undefined) {
        formattedValue += ',' + decimalPart.slice(0, 3);
    }

    setData(field, formattedValue);
};

export default function CreateShipOperation({ countries, shippingLines, cargoTypes, ships }: CreateShipOperationProps) {
    const { data, setData, post, processing, errors } = useForm<ShipOperationFormData>({
        ship_id: '',
        cargo_type_id: '',
        operation_date: '',
        unloading_tonnage: '',
        loading_tonnage: '',
        remarks: '',
    });

    const [operationDate, setOperationDate] = useState<Date>();

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        const submitData = {
            ...data,
            unloading_tonnage: parseNumberForSubmit(data.unloading_tonnage),
            loading_tonnage: parseNumberForSubmit(data.loading_tonnage),
        };

        console.log('Submitting:', submitData);

        router.post(route('user.ship-operations.store'), submitData);
    };

    const handleDateSelect = (date: Date | undefined) => {
        setOperationDate(date);
        if (date) {
            setData('operation_date', format(date, 'yyyy-MM-dd'));
        } else {
            setData('operation_date', '');
        }
    };

    return (
        <AppLayout>
            <Head title="Add Ship Operation" />
            <div className="p-6">
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-2xl font-semibold">Tambah Data Produksi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* Ship Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="ship_id" className="text-sm font-medium">
                                        Kapal <span className="text-red-500">*</span>
                                    </Label>
                                    <ShipCombobox
                                        ships={ships}
                                        value={data.ship_id}
                                        onChange={(value) => setData('ship_id', value)}
                                        placeholder="Pilih kapal"
                                        error={errors.ship_id}
                                    />
                                </div>

                                {/* Cargo Type Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="cargo_type_id" className="text-sm font-medium">
                                        Jenis Muatan <span className="text-red-500">*</span>
                                    </Label>
                                    <CargoTypeCombobox
                                        cargoTypes={cargoTypes}
                                        value={data.cargo_type_id}
                                        onChange={(value) => setData('cargo_type_id', value)}
                                        placeholder="Pilih jenis muatan"
                                        error={errors.cargo_type_id}
                                    />
                                </div>

                                {/* Operation Date */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                        Tanggal Operasi <span className="text-red-500">*</span>
                                    </Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={'outline'}
                                                className={cn(
                                                    'w-full justify-start text-left font-normal',
                                                    !data.operation_date && 'text-muted-foreground',
                                                    errors.operation_date && 'border-red-500',
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {data.operation_date ? (
                                                    format(new Date(data.operation_date), 'PPP', { locale: id })
                                                ) : (
                                                    <span>Pilih tanggal operasi</span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={operationDate} onSelect={handleDateSelect} initialFocus locale={id} />
                                        </PopoverContent>
                                    </Popover>
                                    {errors.operation_date && <p className="mt-1 text-sm text-red-600">{errors.operation_date}</p>}
                                </div>

                                {/* Unloading Tonnage */}
                                <div className="space-y-2">
                                    <Label htmlFor="unloading_tonnage" className="text-sm font-medium">
                                        Tonase Bongkar (Ton) <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="unloading_tonnage"
                                            type="text"
                                            placeholder="Contoh: 1.234,567"
                                            value={formatNumberDisplay(data.unloading_tonnage)}
                                            onChange={(e) => handleNumberInput('unloading_tonnage', e.target.value, setData)}
                                            className={cn('pr-12', errors.unloading_tonnage && 'border-red-500 focus:border-red-500')}
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                            <span className="text-sm text-gray-500">ton</span>
                                        </div>
                                    </div>
                                    {errors.unloading_tonnage && <p className="mt-1 text-sm text-red-600">{errors.unloading_tonnage}</p>}
                                    <p className="text-xs text-gray-500">Gunakan koma untuk desimal, contoh: 1.234,567</p>
                                </div>

                                {/* Loading Tonnage */}
                                <div className="space-y-2">
                                    <Label htmlFor="loading_tonnage" className="text-sm font-medium">
                                        Tonase Muat (Ton) <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="loading_tonnage"
                                            type="text"
                                            placeholder="Contoh: 1.234,567"
                                            value={formatNumberDisplay(data.loading_tonnage)}
                                            onChange={(e) => handleNumberInput('loading_tonnage', e.target.value, setData)}
                                            className={cn('pr-12', errors.loading_tonnage && 'border-red-500 focus:border-red-500')}
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                            <span className="text-sm text-gray-500">ton</span>
                                        </div>
                                    </div>
                                    {errors.loading_tonnage && <p className="mt-1 text-sm text-red-600">{errors.loading_tonnage}</p>}
                                    <p className="text-xs text-gray-500">Gunakan koma untuk desimal, contoh: 1.234,567</p>
                                </div>
                            </div>

                            {/* Remarks */}
                            <div className="space-y-2">
                                <Label htmlFor="remarks" className="text-sm font-medium">
                                    Catatan
                                </Label>
                                <Textarea
                                    id="remarks"
                                    value={data.remarks}
                                    onChange={(e) => setData('remarks', e.target.value)}
                                    rows={3}
                                    placeholder="Tambahkan catatan (opsional)"
                                    className={cn(errors.remarks && 'border-red-500 focus:border-red-500')}
                                />
                                {errors.remarks && <p className="mt-1 text-sm text-red-600">{errors.remarks}</p>}
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" asChild>
                                    <Link href={route('user.ship-operations.index')}>Batal</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? (
                                        <>
                                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                            Menyimpan...
                                        </>
                                    ) : (
                                        'Simpan Data'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
