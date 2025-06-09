import type { SVGAttributes } from "react"

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
  return (
    <svg {...props} viewBox="0 0 40 42" xmlns="http://www.w3.org/2000/svg">
      {/* Badan Kapal */}
      <path d="M6 28 L34 28 L32 32 L8 32 Z" fill="currentColor" />

      {/* Dek Kapal */}
      <rect x="8" y="26" width="24" height="2" fill="currentColor" />

      {/* Tiang Utama */}
      <rect x="19" y="8" width="2" height="18" fill="currentColor" />

      {/* Tiang Depan */}
      <rect x="12" y="12" width="1.5" height="14" fill="currentColor" />

      {/* Layar Utama */}
      <path d="M14 10 L14 22 L19 20 L19 8 Z" fill="currentColor" opacity="0.8" />

      {/* Layar Depan */}
      <path d="M8 14 L8 24 L12 22 L12 12 Z" fill="currentColor" opacity="0.7" />

      {/* Layar Belakang */}
      <path d="M21 9 L21 21 L28 19 L28 11 Z" fill="currentColor" opacity="0.8" />

      {/* Bendera */}
      <path d="M19 8 L19 4 L25 6 L19 8" fill="currentColor" />

      {/* Tali Layar */}
      <line x1="12" y1="12" x2="19" y2="8" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
      <line x1="19" y1="8" x2="28" y2="11" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />

      {/* Jangkar */}
      <path
        d="M30 24 L30 28 M28 26 L32 26 M30 28 L28 30 M30 28 L32 30"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />

      {/* Detail Kapal - Jendela */}
      <circle cx="15" cy="28" r="1" fill="currentColor" opacity="0.3" />
      <circle cx="20" cy="28" r="1" fill="currentColor" opacity="0.3" />
      <circle cx="25" cy="28" r="1" fill="currentColor" opacity="0.3" />

      {/* Gelombang di bawah kapal */}
      <path d="M0 34 Q10 32 20 34 T40 34 L40 36 Q30 38 20 36 T0 36 Z" fill="currentColor" opacity="0.3" />
      <path d="M0 38 Q10 36 20 38 T40 38 L40 40 Q30 42 20 40 T0 40 Z" fill="currentColor" opacity="0.2" />
    </svg>
  )
}
