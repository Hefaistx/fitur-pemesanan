'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { formatRupiah } from '@/lib/utils';

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
  propertyName: string | null;
}

type Category = 'Kuliner' | 'Cafe & Minuman' | 'Oleh-oleh';

const STORE_CATEGORIES: Record<string, Category> = {
  campagna:        'Cafe & Minuman',
  'wedang-rempah': 'Cafe & Minuman',
  jede:            'Kuliner',
  'bakpia-asri':   'Oleh-oleh',
  'gudeg-busari':  'Oleh-oleh',
};

const SECTIONS: { category: Category; icon: string; label: string; desc: string }[] = [
  { category: 'Kuliner',        icon: '🍽️', label: 'Kuliner',    desc: 'Makanan khas Jogja' },
  { category: 'Cafe & Minuman', icon: '☕',  label: 'Cafe',       desc: 'Kopi & minuman segar' },
  { category: 'Oleh-oleh',      icon: '🎁',  label: 'Oleh-oleh', desc: 'Bawa pulang khas Jogja' },
];

function StoreCard({ store, orderCount, distKm, onPress }: {
  store: Store;
  orderCount: number;
  distKm: number | null;
  onPress: () => void;
}) {
  const distLabel = distKm != null
    ? distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`
    : null;

  return (
    <button
      onClick={onPress}
      className="bg-white rounded-2xl shadow-sm overflow-hidden text-left active:scale-95 transition-transform shrink-0 w-40"
    >
      <div className="relative w-full h-24 bg-grey">
        {store.imageUrl && <Image src={store.imageUrl} alt={store.name} fill className="object-cover" />}
        {orderCount > 0 && (
          <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            {orderCount}x dipesan
          </div>
        )}
      </div>
      <div className="p-2.5">
        <p className="font-semibold text-[12px] text-text-primary leading-tight line-clamp-2">{store.name}</p>
        {store.tagline && (
          <p className="text-[10px] text-text-secondary mt-0.5 leading-tight line-clamp-1">{store.tagline}</p>
        )}
        <div className="flex items-center gap-1.5 mt-1.5">
          {store.openHours && (
            <span className="text-[9px] text-text-secondary/60">Buka {store.openHours}</span>
          )}
          {distLabel && (
            <span className="text-[10px] text-primary font-medium ml-auto">{distLabel}</span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function BelanjaClient({ stores, orderCountMap, distanceMap, propertyName }: Props) {
  const router = useRouter();
  const { totalItems, totalAmount, state } = useCart();

  return (
    <div className={`min-h-screen bg-background ${totalItems > 0 ? 'pb-36' : 'pb-20'}`}>

      {/* ── Header ── */}
      <div className="bg-[#2E353D] px-4 pt-6 pb-3">
        <div className="flex items-center justify-between">
          {/* Kiri: back + lokasi */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/')}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20 shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
            <div>
              <p className="text-white/60 text-[11px]">Lokasi pengiriman</p>
              <div className="flex items-center gap-1 mt-0.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <p className="text-white font-semibold text-[14px]">{propertyName ?? "D'Paragon"}</p>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            </div>
          </div>
          {/* Kanan: cart */}
          <button
            onClick={() => router.push('/checkout')}
            className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/>
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>

        {/* Search bar */}
        <div className="mt-3 bg-white rounded-xl px-3 py-2.5 flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#BFBFBF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <span className="text-[13px] text-text-secondary">Cari makanan atau toko...</span>
        </div>
      </div>

      {/* ── Quick Icons ── */}
      <div className="bg-white px-4 pt-4 pb-4 shadow-sm">
        <div className="flex justify-around">
          {SECTIONS.map((s) => (
            <button
              key={s.category}
              onClick={() => router.push(`/merchants?tab=${encodeURIComponent(s.category)}`)}
              className="flex flex-col items-center gap-1.5 active:opacity-70 transition-opacity"
            >
              <div className="w-14 h-14 rounded-2xl bg-background flex items-center justify-center text-2xl">
                {s.icon}
              </div>
              <p className="text-[11px] font-medium text-text-primary">{s.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Sections ── */}
      <div className="mt-4 space-y-6">
        {SECTIONS.map((s) => {
          const sectionStores = stores.filter(st => STORE_CATEGORIES[st.slug] === s.category);
          if (sectionStores.length === 0) return null;

          return (
            <div key={s.category} className="bg-white py-4 rounded-3xl mx-3">
              {/* Section header */}
              <div className="flex items-center justify-between px-4 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{s.icon}</span>
                    <p className="text-[14px] font-bold text-text-primary">{s.category}</p>
                  </div>
                  <p className="text-[11px] text-text-secondary mt-0.5 pl-7">{s.desc}</p>
                </div>
                <button
                  onClick={() => router.push(`/merchants?tab=${encodeURIComponent(s.category)}`)}
                  className="text-[12px] font-semibold text-primary"
                >
                  Lihat Semua
                </button>
              </div>

              {/* Horizontal scroll cards */}
              <div className="flex gap-3 px-4 overflow-x-auto scrollbar-none pb-1">
                {sectionStores.map(store => (
                  <StoreCard
                    key={store.id}
                    store={store}
                    orderCount={orderCountMap[store.id] ?? 0}
                    distKm={distanceMap?.[store.id] ?? null}
                    onPress={() => router.push(`/menu/${store.slug}`)}
                  />
                ))}
                <div className="shrink-0 w-2" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Floating Cart Bar ── */}
      {totalItems > 0 && (
        <div className="fixed bottom-[60px] left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
          <button
            onClick={() => router.push('/checkout')}
            className="w-full max-w-[430px] bg-primary rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-xl shadow-primary/30 pointer-events-auto active:opacity-90"
          >
            {/* Badge + icon */}
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/>
                </svg>
              </div>
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-primary text-[10px] font-bold flex items-center justify-center">
                {totalItems}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 text-left">
              <p className="text-white font-semibold text-[13px]">{state.storeName}</p>
              <p className="text-white/70 text-[11px]">{totalItems} item</p>
            </div>

            {/* Total + arrow */}
            <div className="flex items-center gap-2 shrink-0">
              <p className="text-white font-bold text-[14px]">{formatRupiah(totalAmount)}</p>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          </button>
        </div>
      )}

      {/* ── Mini Bottom Nav ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <div className="w-full max-w-[430px] bg-white border-t border-grey pointer-events-auto">
          <div className="flex">
            {[
              { label: 'Beranda', href: '/belanja', icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              )},
              { label: 'Pesanan', href: '/orders', icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                  <rect x="9" y="3" width="6" height="4" rx="1"/>
                  <path d="M9 12h6M9 16h4"/>
                </svg>
              )},
              { label: 'Profil', href: null, icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              )},
            ].map((tab) => {
              const active = typeof window !== 'undefined' && tab.href && window.location.pathname === tab.href;
              return (
                <button
                  key={tab.label}
                  onClick={() => tab.href && router.push(tab.href)}
                  className="flex-1 flex flex-col items-center gap-1 py-3"
                >
                  <span className={active ? 'text-primary' : 'text-text-secondary'}>{tab.icon}</span>
                  <span className={`text-[10px] font-medium ${active ? 'text-primary' : 'text-text-secondary'}`}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
