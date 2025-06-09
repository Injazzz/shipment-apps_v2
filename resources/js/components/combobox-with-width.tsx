import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import React, { useState } from 'react';

interface Ship {
    id: number;
    name: string;
    shipping_line: {
        name: string;
    };
}

interface ShipComboboxProps {
    ships: Ship[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    error?: string;
}

interface CargoType {
    id: number;
    name: string;
    category: string;
}

interface CargoTypeComboboxProps {
    cargoTypes: CargoType[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    error?: string;
}

export const ShipCombobox: React.FC<ShipComboboxProps> = ({ ships, value, onChange, placeholder = 'Pilih kapal...', className = '', error }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const selectedShip = ships.find((ship) => ship.id.toString() === value);

    const filteredShips = ships.filter(
        (ship) => ship.name.toLowerCase().includes(search.toLowerCase()) || ship.shipping_line.name.toLowerCase().includes(search.toLowerCase()),
    );

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
                        {selectedShip ? (
                            <div className="flex items-center gap-2 truncate">
                                <span className="truncate">{selectedShip.name}</span>
                                <span className="truncate text-xs text-muted-foreground">({selectedShip.shipping_line.name})</span>
                            </div>
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                    <Command>
                        <CommandInput placeholder="Cari kapal..." value={search} onValueChange={setSearch} />
                        <CommandEmpty>Kapal tidak ditemukan</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-y-auto">
                            {filteredShips.map((ship) => (
                                <CommandItem
                                    key={ship.id}
                                    value={`${ship.name} ${ship.shipping_line.name}`}
                                    onSelect={() => {
                                        onChange(ship.id.toString());
                                        setOpen(false);
                                        setSearch('');
                                    }}
                                >
                                    <Check className={cn('mr-2 h-4 w-4 shrink-0', value === ship.id.toString() ? 'opacity-100' : 'opacity-0')} />
                                    <div className="flex min-w-0 items-center gap-2">
                                        <span className="truncate">{ship.name}</span>
                                        <span className="truncate text-xs text-muted-foreground">({ship.shipping_line.name})</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
};

export const CargoTypeCombobox: React.FC<CargoTypeComboboxProps> = ({
    cargoTypes,
    value,
    onChange,
    placeholder = 'Pilih jenis muatan...',
    className = '',
    error,
}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const selectedCargoType = cargoTypes.find((cargo) => cargo.id.toString() === value);

    const filteredCargoTypes = cargoTypes.filter(
        (cargo) => cargo.name.toLowerCase().includes(search.toLowerCase()) || cargo.category.toLowerCase().includes(search.toLowerCase()),
    );

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
                        {selectedCargoType ? (
                            <div className="flex items-center gap-2 truncate">
                                <span className="truncate">{selectedCargoType.name}</span>
                                <span className="truncate text-xs text-muted-foreground">({selectedCargoType.category})</span>
                            </div>
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                    <Command>
                        <CommandInput placeholder="Cari jenis muatan..." value={search} onValueChange={setSearch} />
                        <CommandEmpty>Jenis muatan tidak ditemukan</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-y-auto">
                            {filteredCargoTypes.map((cargo) => (
                                <CommandItem
                                    key={cargo.id}
                                    value={`${cargo.name} ${cargo.category}`}
                                    onSelect={() => {
                                        onChange(cargo.id.toString());
                                        setOpen(false);
                                        setSearch('');
                                    }}
                                >
                                    <Check className={cn('mr-2 h-4 w-4 shrink-0', value === cargo.id.toString() ? 'opacity-100' : 'opacity-0')} />
                                    <div className="flex min-w-0 items-center gap-2">
                                        <span className="truncate">{cargo.name}</span>
                                        <span className="truncate text-xs text-muted-foreground">({cargo.category})</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
};
