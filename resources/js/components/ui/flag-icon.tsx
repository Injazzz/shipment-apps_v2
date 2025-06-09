// components/ui/FlagIcon.tsx
import React from 'react';

interface FlagIconProps {
    countryCode: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const FlagIcon: React.FC<FlagIconProps> = ({
    countryCode,
    className = '',
    size = 'md'
}) => {
    const sizeClasses = {
        sm: 'w-4 h-3',
        md: 'w-6 h-4',
        lg: 'w-8 h-6'
    };

    // Menggunakan flagcdn.com untuk mendapatkan gambar bendera
    const flagUrl = `https://flagcdn.com/${countryCode.toLowerCase()}.svg`;

    return (
        <img
            src={flagUrl}
            alt={`Flag of ${countryCode}`}
            className={`${sizeClasses[size]} object-cover rounded shadow-md ${className}`}
            onError={(e) => {
                // Fallback jika gambar tidak ditemukan
                e.currentTarget.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="%23ddd"/><text x="12" y="10" text-anchor="middle" font-size="8" fill="%23666">?</text></svg>`;
            }}
        />
    );
};
