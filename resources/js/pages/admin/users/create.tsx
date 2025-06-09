import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { CheckCircle, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PageProps extends SharedData {
    flash: {
        success?: {
            message: string;
            password?: string;
            user?: {
                id: number;
                name: string;
                email: string;
                role: string;
            };
        };
        error?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Daftarkan Pengguna',
        href: '/admin/users/create',
    },
];

export default function CreateUser() {
    const { flash } = usePage<PageProps>().props;

    const [copied, setCopied] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        role: 'user' as 'user' | 'admin',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.users.store'));
    };

    const copyPassword = async (password: string) => {
        try {
            await navigator.clipboard.writeText(password);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy password:', err);
        }
    };

    // Reset form when success and handle flash messaging
    useEffect(() => {
        if (flash?.success) {
            reset();
        }
    }, [flash?.success, reset]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create User" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    {/* Success Alert with Password */}
                    {flash.success && flash.success.password && (
                        <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-500/50 dark:bg-green-900/35">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <AlertDescription>
                                <div className="w-full space-y-3">
                                    <div className="font-medium text-green-500">{flash.success.message}</div>
                                    <div className="w-full space-y-4">
                                        <Label className="text-sm font-medium text-zinc-600">
                                            Generated Password (copy and bagikan kepada user):
                                        </Label>
                                        <div className="mt-1 flex items-center space-x-2">
                                            <code className="flex-1 rounded bg-green-950/35 px-3 py-2 font-mono text-sm">
                                                {flash.success.password}
                                            </code>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => flash.success?.password && copyPassword(flash.success.password)}
                                                className={copied ? 'h-10 text-green-500' : 'h-10'}
                                            >
                                                <Copy className="h-4 w-4" />
                                                {copied ? 'Copied!' : 'Copy'}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="text-sm text-green-500">
                                        User: <strong>{flash.success.user?.name}</strong> ({flash.success.user?.email})
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>User Information</CardTitle>
                            <CardDescription>Masukan detail user. Random password akan digenerate otomatis.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Enter full name"
                                        className={errors.name ? 'border-red-500' : ''}
                                    />
                                    {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="Enter email address"
                                        className={errors.email ? 'border-red-500' : ''}
                                    />
                                    {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Select value={data.role} onValueChange={(value: 'user' | 'admin') => setData('role', value)}>
                                        <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select user role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">User</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.role && <p className="text-sm text-red-600">{errors.role}</p>}
                                </div>

                                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/35">
                                    <p className="text-sm text-blue-800">
                                        <strong>Note:</strong> Kata sandi acak yang aman akan dihasilkan secara otomatis dan ditampilkan setelah
                                        membuat pengguna. Pastikan untuk menyalin dan membagikannya kepada pengguna.
                                    </p>
                                </div>

                                <div className="flex justify-end space-x-4">
                                    <Link href={route('admin.users.index')}>
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Creating...' : 'Create User'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
