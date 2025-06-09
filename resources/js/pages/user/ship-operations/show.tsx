import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FlagIcon } from '@/components/ui/flag-icon';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { formatDate, formatNumber } from '@/lib/utils';

interface Operation {
    operation_date: string;
    ship: {
        name: string;
        shipping_line: {
            name: string;
        };
        country: {
            flag_emoji: string;
            name: string;
            code: string;
        };
    };
    cargo_type: {
        name: string;
        category: string;
    };
    unloading_tonnage: string;
    loading_tonnage: string;
    remarks: string | null;
    user: {
        name: string;
    };
}

export default function ShowShipOperation({ operation }: { operation: Operation }) {
    return (
        <div className="container mx-auto space-y-4 py-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Detail Operasi Kapal</h1>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <a href={route('user.ship-operations.index')}>Kembali</a>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Informasi Operasi</span>
                        <Badge variant="secondary">{formatDate(operation.operation_date)}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">Nama Kapal</TableCell>
                                <TableCell>{operation.ship.name}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Shipping Line</TableCell>
                                <TableCell>{operation.ship.shipping_line.name}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Bendera</TableCell>
                                <TableCell className="flex items-center gap-2">
                                    <FlagIcon countryCode={operation.ship.country.code} /> {operation.ship.country.name}{' '}
                                    {/* <Badge className="ml-2" variant="secondary">
                                        {operation.ship.country.flag_emoji}
                                    </Badge> */}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Jenis Muatan</TableCell>
                                <TableCell>
                                    {operation.cargo_type.name} ({operation.cargo_type.category})
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Tonase Bongkar</TableCell>
                                <TableCell>{formatNumber(operation.unloading_tonnage)} ton</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Tonase Muat</TableCell>
                                <TableCell>{formatNumber(operation.loading_tonnage)} ton</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Total Tonase</TableCell>
                                <TableCell>
                                   {formatNumber(parseFloat(operation.unloading_tonnage.toString()) + parseFloat(operation.loading_tonnage.toString()))} ton
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Catatan</TableCell>
                                <TableCell>{operation.remarks || '-'}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Dibuat Oleh</TableCell>
                                <TableCell>{operation.user.name}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
