import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export function formatNumber(value: number | string | null): string {
    if (!value && value !== 0) return '0';

    const num = parseFloat(value.toString());

    // Format dengan locale Indonesia: titik untuk ribuan, koma untuk desimal
    return num.toLocaleString('id-ID');
}
