import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CountryCombobox, ShippingLineCombobox } from '@/components/ui/combobox-with-flag';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Country, Ship, ShippingLine } from '@/types/ship-operations';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface EditShipProps {
    ship: Ship;
    countries: Country[];
    shippingLines: ShippingLine[];
}

interface ShipFormData {
    name: string;
    shipping_line_id: string;
    country_id: string;
    capacity: string | number;
    [key: string]: string | number | null | undefined;
}

export default function EditShip({ ship, countries, shippingLines }: EditShipProps) {
    const { data, setData, put, processing, errors } = useForm<ShipFormData>({
        name: ship.name,
        shipping_line_id: ship.shipping_line.id.toString(),
        country_id: ship.country.id.toString(),
        capacity: ship.capacity || '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(route('user.ships.update', ship.id), {
            onSuccess: () => {
                router.visit(route('user.ships.index'), {
                    only: ['ships'],
                });
            },
        });
    };

    const handleNewShippingLine = async (name: string) => {
        try {
            const response = await fetch(route('user.ships.shipping-lines.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ name }),
            });

            if (response.ok) {
                const newShippingLine = await response.json();
                setData('shipping_line_id', newShippingLine.id.toString());
                // Refresh page to get updated shipping lines list
                router.reload({ only: ['shippingLines'] });
            } else {
                throw new Error('Gagal menambah shipping line');
            }
        } catch (error) {
            console.error('Error creating shipping line:', error);
            alert('Gagal menambah shipping line baru');
        }
    };

    const handleNewCountry = async (country: { name: string; code: string; alpha3: string; flag_emoji: string }) => {
        try {
            const response = await fetch(route('user.ships.countries.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(country),
            });

            if (response.ok) {
                const newCountry = await response.json();
                setData('country_id', newCountry.id.toString());
                // Refresh page to get updated countries list
                router.reload({ only: ['countries'] });
            } else {
                throw new Error('Gagal menambah negara');
            }
        } catch (error) {
            console.error('Error creating country:', error);
            alert('Gagal menambah negara baru');
        }
    };

    return (
        <AppLayout>
            <Head title="Edit Kapal" />
            <div className="p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Kapal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Kapal</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Masukkan nama kapal"
                                        className={errors.name ? 'border-red-500' : ''}
                                    />
                                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Shipping Line</Label>
                                    <ShippingLineCombobox
                                        shippingLines={shippingLines}
                                        value={data.shipping_line_id}
                                        onChange={(value) => setData('shipping_line_id', value)}
                                        onNewShippingLine={handleNewShippingLine}
                                        placeholder="Pilih Shipping Line..."
                                        error={errors.shipping_line_id}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Bendera</Label>
                                    <CountryCombobox
                                        countries={countries}
                                        value={data.country_id}
                                        onChange={(value) => setData('country_id', value)}
                                        onNewCountry={handleNewCountry}
                                        placeholder="Pilih Negara..."
                                        error={errors.country_id}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="capacity">Kapasitas (ton)</Label>
                                    <Input
                                        id="capacity"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.capacity}
                                        onChange={(e) => setData('capacity', e.target.value)}
                                        placeholder="Masukkan kapasitas kapal"
                                        className={errors.capacity ? 'border-red-500' : ''}
                                    />
                                    {errors.capacity && <p className="text-sm text-red-500">{errors.capacity}</p>}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" asChild>
                                    <Link href={route('user.ships.index')}>Batal</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
