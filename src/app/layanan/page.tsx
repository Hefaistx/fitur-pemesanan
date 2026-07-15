'use client';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

const KULINER = [
  { icon: '🍽️', label: 'Kuliner',    href: '/belanja' },
  { icon: '🎁', label: 'Oleh-oleh',  href: '/belanja' },
  { icon: '☕', label: 'Cafe',        href: '/belanja' },
];

const LAYANAN = [
  { icon: '📅', label: 'Perpanjang\nKamar',  href: null },
  { icon: '🛎️', label: 'Layanan\nKamar',    href: null },
  { icon: '🚨', label: 'Pengaduan',           href: '/pengaduan' },
];

export default function LayananPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background pb-10">
      <Header title="Semua Layanan" showBack />

      {/* ── Section Kuliner ── */}
      <div className="mx-4 mt-5">
        <p className="text-[14px] font-bold text-text-primary mb-3">🍽️ Kuliner</p>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="grid grid-cols-4 gap-3">
            {KULINER.map((item) => (
              <button
                key={item.label}
                onClick={() => item.href && router.push(item.href)}
                className="flex flex-col items-center gap-1.5 active:opacity-70 transition-opacity"
              >
                <div className="w-14 h-14 rounded-2xl bg-background flex items-center justify-center text-2xl">
                  {item.icon}
                </div>
                <p className="text-[11px] font-medium text-text-primary text-center leading-tight">{item.label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section Layanan ── */}
      <div className="mx-4 mt-5">
        <p className="text-[14px] font-bold text-text-primary mb-3">🏨 Layanan</p>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="grid grid-cols-4 gap-3">
            {LAYANAN.map((item) => (
              <button
                key={item.label}
                onClick={() => item.href && router.push(item.href)}
                className="flex flex-col items-center gap-1.5 active:opacity-70 transition-opacity"
              >
                <div className="w-14 h-14 rounded-2xl bg-background flex items-center justify-center text-2xl">
                  {item.icon}
                </div>
                <p className="text-[11px] font-medium text-text-primary text-center leading-tight whitespace-pre-line">{item.label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
