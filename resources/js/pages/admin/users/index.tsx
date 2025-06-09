import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Copy, CopyCheck, Edit, Eye, Key, MoreHorizontal, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
    last_login_at?: string;
}

interface PaginatedUsers {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    users: PaginatedUsers;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Manajemen Pengguna',
        href: '/admin/users',
    },
];

export default function UserIndex({ users }: Props) {
    const [isDeleting, setIsDeleting] = useState<number | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [generatePasswordDialogOpen, setGeneratePasswordDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [generatedPassword, setGeneratedPassword] = useState<string>('');
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [isCoppied, setIsCoppied] = useState(false);
    const [openDropdowns, setOpenDropdowns] = useState<Record<number, boolean>>({});

    // Effect untuk cleanup dropdown state ketika modal terbuka
    useEffect(() => {
        if (deleteDialogOpen || generatePasswordDialogOpen || passwordDialogOpen) {
            // Reset semua dropdown state ketika modal terbuka
            setOpenDropdowns({});
        }
    }, [deleteDialogOpen, generatePasswordDialogOpen, passwordDialogOpen]);

    // Reset modal state tanpa side effects
    const resetModalState = useCallback(() => {
        setDeleteDialogOpen(false);
        setGeneratePasswordDialogOpen(false);
        setPasswordDialogOpen(false);
        setSelectedUser(null);
        setGeneratedPassword('');
        setIsCoppied(false);
        // Reset dropdown state juga
        setOpenDropdowns({});
    }, []);

    // Handler untuk dropdown state
    const handleDropdownChange = useCallback((userId: number, open: boolean) => {
        setOpenDropdowns((prev) => ({
            ...prev,
            [userId]: open,
        }));
    }, []);

    // Handler untuk action yang memerlukan modal
    const handleActionWithDropdownClose = useCallback((userId: number, action: () => void) => {
        // Tutup dropdown terlebih dahulu
        setOpenDropdowns((prev) => ({
            ...prev,
            [userId]: false,
        }));

        // Jalankan action setelah dropdown tertutup
        setTimeout(() => {
            action();
        }, 100);
    }, []);

    const handleDeleteClick = useCallback(
        (user: User) => {
            handleActionWithDropdownClose(user.id, () => {
                setSelectedUser(user);
                setDeleteDialogOpen(true);
            });
        },
        [handleActionWithDropdownClose],
    );

    const handleDeleteConfirm = useCallback(() => {
        if (selectedUser) {
            setIsDeleting(selectedUser.id);
            router.delete(route('admin.users.destroy', selectedUser.id), {
                preserveState: true,
                preserveScroll: true,
                onStart: () => {
                    // Modal tetap terbuka saat proses dimulai
                },
                onSuccess: () => {
                    toast.success('Pengguna berhasil dihapus!');
                    // Tutup modal setelah sukses
                    resetModalState();
                },
                onError: (errors: { error?: string }) => {
                    toast.error(errors.error || 'Gagal menghapus pengguna');
                },
                onFinish: () => {
                    setIsDeleting(null);
                    // Tidak perlu reload manual, Inertia sudah handle otomatis
                },
            });
        }
    }, [selectedUser, resetModalState]);

    const handleGeneratePasswordClick = useCallback(
        (user: User) => {
            handleActionWithDropdownClose(user.id, () => {
                setSelectedUser(user);
                setGeneratePasswordDialogOpen(true);
            });
        },
        [handleActionWithDropdownClose],
    );

    const handleGeneratePasswordConfirm = useCallback(() => {
        if (selectedUser) {
            router.post(
                route('admin.users.generate-password', selectedUser.id),
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: (page) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const password = (page as any).props.flash?.success?.password;
                        if (password) {
                            setGeneratedPassword(password);
                            setGeneratePasswordDialogOpen(false);
                            // Gunakan requestAnimationFrame untuk smooth transition
                            requestAnimationFrame(() => {
                                setPasswordDialogOpen(true);
                            });
                            toast.success('Kata sandi baru berhasil dibuat!');
                        }
                    },
                    onError: (errors: { error?: string }) => {
                        toast.error(errors.error || 'Gagal membuat kata sandi');
                        resetModalState();
                    },
                    onFinish: () => {
                        // Inertia akan handle data update otomatis
                    },
                },
            );
        }
    }, [selectedUser, resetModalState]);

    const copyPassword = useCallback(() => {
        setIsCoppied(true);
        setTimeout(() => setIsCoppied(false), 2000);
        navigator.clipboard.writeText(generatedPassword);
        toast.success('Kata sandi disalin ke clipboard!');
    }, [generatedPassword]);

    const canGeneratePassword = useCallback((user: User) => {
        return !user.last_login_at;
    }, []);

    // Handler untuk menutup modal dengan cleanup yang proper
    const handleDeleteDialogClose = useCallback((open: boolean) => {
        if (!open) {
            setDeleteDialogOpen(false);
            // Cleanup dengan delay untuk mencegah race condition
            setTimeout(() => {
                setSelectedUser(null);
                // Reset dropdown state setelah modal tertutup
                setOpenDropdowns({});
            }, 150);
        }
    }, []);

    const handleGeneratePasswordDialogClose = useCallback((open: boolean) => {
        if (!open) {
            setGeneratePasswordDialogOpen(false);
            setTimeout(() => {
                setSelectedUser(null);
                setOpenDropdowns({});
            }, 150);
        }
    }, []);

    const handlePasswordDialogClose = useCallback((open: boolean) => {
        if (!open) {
            setPasswordDialogOpen(false);
            setTimeout(() => {
                setSelectedUser(null);
                setGeneratedPassword('');
                setIsCoppied(false);
                setOpenDropdowns({});
            }, 150);
        }
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Pengguna" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <div className="flex w-full justify-between">
                                <div>
                                    <CardTitle>Pengguna</CardTitle>
                                    <CardDescription>Kelola pengguna sistem dan peran mereka</CardDescription>
                                </div>
                                <Link href={route('admin.users.create')}>
                                    <Button>Tambah Pengguna</Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Peran</TableHead>
                                        <TableHead>Status Akun</TableHead>
                                        <TableHead>Dibuat Pada</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.data.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <div
                                                        className={`h-2 w-2 rounded-full ${user.last_login_at ? 'bg-green-500' : 'bg-yellow-500'}`}
                                                    />
                                                    <span className="text-sm">{user.last_login_at ? 'Aktif' : 'Menunggu'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu
                                                    open={openDropdowns[user.id] || false}
                                                    onOpenChange={(open) => handleDropdownChange(user.id, open)}
                                                >
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={route('admin.users.show', user.id)}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                Lihat
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={route('admin.users.edit', user.id)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Ubah
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleGeneratePasswordClick(user);
                                                            }}
                                                            disabled={!canGeneratePassword(user)}
                                                        >
                                                            <Key className="mr-2 h-4 w-4" />
                                                            Generate Kata Sandi
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleDeleteClick(user);
                                                            }}
                                                            disabled={isDeleting === user.id}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            {isDeleting === user.id ? 'Menghapus...' : 'Hapus'}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {/* Pagination info */}
                            <div className="flex items-center justify-between space-x-2 py-4">
                                <div className="text-sm text-muted-foreground">
                                    Menampilkan {users.data.length} dari {users.total} pengguna
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Halaman {users.current_page} dari {users.last_page}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={handleDeleteDialogClose}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus akun pengguna <strong>{selectedUser?.name}</strong> secara
                            permanen dan menghapus semua data terkait.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
                            Hapus Pengguna
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Generate Password Confirmation Dialog */}
            <AlertDialog open={generatePasswordDialogOpen} onOpenChange={handleGeneratePasswordDialogClose}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Buat Kata Sandi Baru</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ini akan membuat kata sandi acak baru untuk <strong>{selectedUser?.name}</strong>. Kata sandi lama tidak akan berfungsi
                            lagi. Apakah Anda yakin ingin melanjutkan?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleGeneratePasswordConfirm}>Buat Kata Sandi</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Password Display Dialog */}
            <AlertDialog open={passwordDialogOpen} onOpenChange={handlePasswordDialogClose}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Kata Sandi Baru Dibuat</AlertDialogTitle>
                        <AlertDialogDescription>
                            Kata sandi baru telah dibuat untuk <strong>{selectedUser?.name}</strong>. Mohon bagikan kata sandi ini secara aman kepada
                            pengguna.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <Label htmlFor="generated-password">Kata Sandi yang Dibuat</Label>
                            <div className="flex space-x-2">
                                <Input id="generated-password" type="text" value={generatedPassword} readOnly className="font-mono" />
                                <Button type="button" variant="outline" className="h-9 w-fit" onClick={copyPassword}>
                                    {isCoppied ? <CopyCheck className="h-6 w-6 text-green-500" /> : <Copy className="h-6 w-6" />}
                                </Button>
                            </div>
                        </div>
                        <div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-700/35">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-yellow-500">Pemberitahuan Keamanan Penting</h3>
                                    <div className="mt-2 text-sm text-yellow-500">
                                        <p>
                                            Pastikan kata sandi ini dibagikan secara aman kepada pengguna. Pengguna harus mengubah kata sandi ini
                                            setelah login pertama mereka.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => handlePasswordDialogClose(false)}>Saya Sudah Menyimpan Kata Sandi</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
