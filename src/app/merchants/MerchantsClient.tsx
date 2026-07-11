'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Session } from 'next-auth';
import Header from '@/components/Header';

interface Store {
  id: number;
  slug: string;
  name: string;
  tagline: string | null;
  imageUrl: string | null;
  openHours: string | null;
  rating: string | null;
  waNumber: string;
}

interface Props {
  stores: Store[];
  orderCountMap: Record<number, number>;
  distanceMap: Record<number, number> | null;
  session: Session | null;
}

type Category = 'Semua' | 'Cafe & Minuman' | 'Kuliner' | 'Oleh-oleh';

const STORE_CATEGORIES: Record<string, Category> = {
  campagna:      'Cafe & Minuman',
  'wedang-rempah': 'Cafe & Minuman',
  jede:          'Kuliner',
  'bakpia-asri': 'Oleh-oleh',
  'gudeg-busari': 'Oleh-oleh',
};

const TABS: Category[] = ['Semua', 'Cafe & Minuman', 'Kuliner', 'Oleh-oleh'];

export default function MerchantsClient({ stores, orderCountMap, distanceMap }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Category>('Semua');

  useEffect(() => {
    const tab = searchParams.get('tab') as Category | null;
    if (tab && TABS.includes(tab)) setActiveTab(tab);
  }, [searchParams]);

  const filtered = activeTab === 'Semua'
    ? stores
    : stores.filter((s) => STORE_CATEGORIES[s.slug] === activeTab);

  return (
    <div className="min-h-screen bg-background pb-10">
      <Header title="Semua Merchant" showBack />

      {/* Tab kategori */}
      <div className="flex gap-2 px-4 mt-4 overflow-x-auto scrollbar-none pb-1 items-center">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${
              activeTab === tab
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-text-secondary border-grey'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Riwayat pesanan */}
      <div className="flex justify-end px-4 mt-3">
        <button
          onClick={() => router.push('/orders')}
          className="text-text-primary active:opacity-60 transition-opacity"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="1"/>
            <path d="M9 12h6M9 16h4"/>
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 mt-3">
        {filtered.map((store) => {
          const orderCount = orderCountMap[store.id] ?? 0;
          const distKm = distanceMap?.[store.id] ?? null;
          const distLabel = distKm != null
            ? distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`
            : null;

          return (
            <button
              key={store.id}
              onClick={() => router.push(`/menu/${store.slug}`)}
              className="bg-white rounded-2xl shadow-sm overflow-hidden text-left active:scale-95 transition-transform"
            >
              <div className="relative w-full h-28 bg-grey">
                {store.imageUrl && (
                  <Image src={store.imageUrl} alt={store.name} fill className="object-cover" />
                )}
                {orderCount > 0 && (
                  <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                    {orderCount}x dipesan
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="font-semibold text-[13px] text-text-primary leading-tight">{store.name}</p>
                {store.tagline && (
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-tight">{store.tagline}</p>
                )}
                <p className="flex items-center gap-2 mt-1.5 text-[11px] text-text-secondary">
                  {store.openHours && <span className="text-[10px] text-text-secondary/60">Buka {store.openHours}</span>}
                  {distLabel && (
                    <>
                      {store.openHours && <span className="text-grey">·</span>}
                      <span className="text-primary font-medium">{distLabel}</span>
                    </>
                  )}
                </p>
                <div className="mt-2 w-full py-1.5 rounded-lg text-center text-[11px] font-semibold bg-primary-01 text-primary border border-primary-02">
                  Lihat Menu
                </div>
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-2 py-16 text-center text-text-secondary text-[13px]">
            Belum ada merchant di kategori ini
          </div>
        )}
      </div>
    </div>
  );
}
