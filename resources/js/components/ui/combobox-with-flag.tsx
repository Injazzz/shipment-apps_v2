import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FlagIcon } from './flag-icon';

// FlagIcon fallback component jika tidak ada
// const FlagIcon: React.FC<{ countryCode: string; size?: string }> = ({ countryCode }) => {
//     return <span className="text-sm opacity-50">{countryCode}</span>;
// };

interface Country {
    id: number;
    name: string;
    code: string;
    alpha3: string;
    flag_emoji?: string;
}

interface CountryComboboxProps {
    countries: Country[];
    value: string;
    onChange: (value: string) => void;
    onNewCountry?: (country: { name: string; code: string; alpha3: string; flag_emoji: string }) => Promise<void>;
    placeholder?: string;
    className?: string;
    error?: string;
}

interface ShippingLine {
    id: number;
    name: string;
}

interface ShippingLineComboboxProps {
    shippingLines: ShippingLine[];
    value: string;
    onChange: (value: string) => void;
    onNewShippingLine?: (name: string) => Promise<void>;
    placeholder?: string;
    className?: string;
    error?: string;
}

export const CountryCombobox: React.FC<CountryComboboxProps> = ({
    countries,
    value,
    onChange,
    onNewCountry,
    placeholder = "Pilih negara...",
    className = "",
    error
}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [showNewCountryDialog, setShowNewCountryDialog] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newCountry, setNewCountry] = useState({
        name: '',
        code: '',
        alpha3: '',
        flag_emoji: '🏳️'
    });

    const selectedCountry = countries.find(country => country.id.toString() === value);

    const handleNewCountry = async () => {
        if (newCountry.name.trim() && newCountry.code.trim() && newCountry.alpha3.trim()) {
            setIsSubmitting(true);
            try {
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                const response = await fetch(route('user.ships.countries.store'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken || '',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        name: newCountry.name,
                        code: newCountry.code.toUpperCase(),
                        alpha3: newCountry.alpha3.toUpperCase(),
                        flag_emoji: newCountry.flag_emoji
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Terjadi kesalahan saat menambahkan negara');
                }

                toast.success('Negara berhasil ditambahkan');
                onChange(data.data.id.toString());
                setNewCountry({ name: '', code: '',alpha3: '', flag_emoji: '🏳️' });
                setShowNewCountryDialog(false);
                setOpen(false);
                setSearch('');

                // Tidak perlu reload halaman, cukup update parent component
                if (onNewCountry) {
                    onNewCountry(data.data);
                }
            } catch (error) {
                console.error('Error creating country:', error);
                toast.error(error instanceof Error ? error.message : 'Gagal menambahkan negara');
            } finally {
                setIsSubmitting(false);
                window.location.reload();
            }
        }
    };

    const filteredCountries = countries.filter(country =>
        country.name.toLowerCase().includes(search.toLowerCase()) ||
        country.code.toLowerCase().includes(search.toLowerCase()) ||
        country.alpha3.toLowerCase().includes(search.toLowerCase())
    );

    const shouldUseGrid = filteredCountries.length > 10;

    return (
        <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={`w-full justify-between ${className} ${error ? 'border-red-500' : ''}`}
                    >
                        {selectedCountry ? (
                            <div className="flex items-center gap-2">
                                {selectedCountry.code ? (
                                    <FlagIcon countryCode={selectedCountry.code} size="sm" />
                                ) : (
                                    <span className="text-lg">{selectedCountry.flag_emoji}</span>
                                )}
                                <span className="truncate">{selectedCountry.name}</span>
                            </div>
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                    <Command>
                        <CommandInput
                            placeholder="Cari negara..."
                            value={search}
                            onValueChange={setSearch}
                        />
                        <CommandEmpty>
                            <div className="p-4 text-center">
                                <p className="text-sm text-muted-foreground mb-3">
                                    Negara "{search}" tidak ditemukan.
                                </p>
                                <Dialog open={showNewCountryDialog} onOpenChange={setShowNewCountryDialog}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" className="w-full">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Tambah Negara Baru
                                        </Button>
                                    </DialogTrigger>
                                </Dialog>
                            </div>
                        </CommandEmpty>
                        <CommandGroup className={shouldUseGrid ? "max-h-[300px] overflow-y-auto" : ""}>
                            <div className={shouldUseGrid ? "flex flex-col md:grid md:grid-cols-2 gap-1" : ""}>
                                {filteredCountries.map((country) => (
                                    <CommandItem
                                        key={country.id}
                                        value={`${country.name} ${country.code}`}
                                        onSelect={() => {
                                            onChange(country.id.toString());
                                            setOpen(false);
                                            setSearch('');
                                        }}
                                        className={shouldUseGrid ? "px-2 py-1.5 text-sm" : ""}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4 shrink-0",
                                                value === country.id.toString()
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
                                        <div className="flex items-center gap-2 min-w-0">
                                            {country.code ? (
                                                 <FlagIcon countryCode={country.code} size="sm" />
                                            ) : (
                                                <span className="text-lg shrink-0">{country.flag_emoji}</span>
                                            )}
                                            <span className="truncate">{country.name}</span>
                                            <span className="text-xs text-muted-foreground shrink-0">({country.code})</span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </div>
                        </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>
            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* Dialog untuk menambah negara baru */}
            <Dialog open={showNewCountryDialog} onOpenChange={setShowNewCountryDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tambah Negara Baru</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nama Negara</Label>
                            <Input
                                id="name"
                                value={newCountry.name}
                                onChange={(e) => setNewCountry({
                                    ...newCountry,
                                    name: e.target.value,
                                    code: newCountry.code || e.target.value.substring(0, 2).toUpperCase()
                                })}
                                placeholder="Contoh: Indonesia"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="code">Kode Negara (2 huruf)</Label>
                            <Input
                                id="code"
                                value={newCountry.code}
                                onChange={(e) => setNewCountry({
                                    ...newCountry,
                                    code: e.target.value.toUpperCase().substring(0, 2)
                                })}
                                placeholder="Contoh: ID"
                                maxLength={2}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="alpha3">Kode Negara (3 huruf)</Label>
                            <Input
                                id="alpha3"
                                value={newCountry.alpha3}
                                onChange={(e) => setNewCountry({
                                    ...newCountry,
                                    alpha3: e.target.value.toUpperCase().substring(0, 2)
                                })}
                                placeholder="Contoh: IDN"
                                maxLength={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="flag_emoji">Emoji Bendera</Label>
                            <Input
                                id="flag_emoji"
                                value={newCountry.flag_emoji}
                                onChange={(e) => setNewCountry({
                                    ...newCountry,
                                    flag_emoji: e.target.value
                                })}
                                placeholder="🇮🇩"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowNewCountryDialog(false);
                                    setNewCountry({ name: '', code: '', alpha3: '', flag_emoji: '🏳️' });
                                }}
                                disabled={isSubmitting}
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={handleNewCountry}
                                disabled={isSubmitting || !newCountry.name.trim() || !newCountry.code.trim() || !newCountry.alpha3.trim()}
                            >
                                {isSubmitting ? 'Menyimpan...' : 'Tambah'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export const ShippingLineCombobox: React.FC<ShippingLineComboboxProps> = ({
    shippingLines,
    value,
    onChange,
    onNewShippingLine,
    placeholder = "Pilih shipping line...",
    className = "",
    error
}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [showNewDialog, setShowNewDialog] = useState(false);
    const [newShippingLineName, setNewShippingLineName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedShippingLine = shippingLines.find(line => line.id.toString() === value);

    const handleNewShippingLine = async () => {
        if (newShippingLineName.trim()) {
            setIsSubmitting(true);
            try {
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

                const response = await fetch(route('user.ships.shipping-lines.store'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken || '',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        name: newShippingLineName,
                        type: newShippingLineName,
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    // Handle validation errors
                    if (data.errors) {
                        const errorMessages = Object.values(data.errors).flat().join(', ');
                        throw new Error(errorMessages);
                    }
                    throw new Error(data.message || 'Failed to create shipping line');
                }

                toast.success('Shipping line created successfully');
                onChange(data.data.id.toString());
                setNewShippingLineName('');
                setShowNewDialog(false);

                // Update parent component if callback exists
                if (onNewShippingLine) {
                    onNewShippingLine(data.data);
                }

            } catch (error) {
                console.error('Error creating shipping line:', error);
                toast.error(error instanceof Error ? error.message : 'Failed to create shipping line');
                // Keep dialog open to allow user to fix the input
                return;
            } finally {
                setIsSubmitting(false);
                window.location.reload();
            }
        }
    };

    const filteredShippingLines = shippingLines.filter(line =>
        line.name.toLowerCase().includes(search.toLowerCase())
    );

    const shouldUseGrid = filteredShippingLines.length > 10;

    return (
        <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={`w-full justify-between ${className} ${error ? 'border-red-500' : ''}`}
                    >
                        <span className={`truncate ${selectedShippingLine ? '' : 'text-muted-foreground'}`}>
                            {selectedShippingLine ? selectedShippingLine.name : placeholder}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                    <Command>
                        <CommandInput
                            placeholder="Cari shipping line..."
                            value={search}
                            onValueChange={setSearch}
                        />
                        <CommandEmpty>
                            <div className="p-4 text-center">
                                <p className="text-sm text-muted-foreground mb-3">
                                    Shipping line "{search}" tidak ditemukan.
                                </p>
                                <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" className="w-full">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Tambah "{search || 'Shipping Line Baru'}"
                                        </Button>
                                    </DialogTrigger>
                                </Dialog>
                            </div>
                        </CommandEmpty>
                        <CommandGroup className={shouldUseGrid ? "max-h-[300px] overflow-y-auto" : ""}>
                            <div className={shouldUseGrid ? "grid grid-cols-2 gap-1" : ""}>
                                {filteredShippingLines.map((line) => (
                                    <CommandItem
                                        key={line.id}
                                        value={line.name}
                                        onSelect={() => {
                                            onChange(line.id.toString());
                                            setOpen(false);
                                            setSearch('');
                                        }}
                                        className={shouldUseGrid ? "px-2 py-1.5 text-sm" : ""}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4 shrink-0",
                                                value === line.id.toString()
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
                                        <span className="truncate">{line.name}</span>
                                    </CommandItem>
                                ))}
                            </div>
                        </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>
            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* Dialog untuk menambah shipping line baru */}
            <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tambah Shipping Line Baru</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="shipping_line_name">Nama Shipping Line*</Label>
                            <Input
                                id="shipping_line_name"
                                value={newShippingLineName}
                                onChange={(e) => setNewShippingLineName(e.target.value)}
                                placeholder="Contoh: Maersk Line"
                                minLength={2}
                                maxLength={100}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Minimal 2 karakter, maksimal 100 karakter. Nama harus unik.
                            </p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowNewDialog(false)}
                                disabled={isSubmitting}
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={handleNewShippingLine}
                                disabled={isSubmitting || newShippingLineName.length < 2}
                            >
                                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
