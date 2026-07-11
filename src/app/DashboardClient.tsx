'use client';
import { useState, useEffect, useRef } from 'react';
import { Session } from 'next-auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import BannerCarousel from '@/components/BannerCarousel';

interface Store {
  id: number;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  imageUrl: string | null;
  openHours: string | null;
  rating: string | null;
  waNumber: string;
}

interface Props {
  session: Session | null;
  stores: Store[];
  orderCountMap: Record<number, number>;
  distanceMap: Record<number, number> | null;
}

export default function DashboardClient({ session, stores, orderCountMap, distanceMap }: Props) {
  const router = useRouter();
  const user = session?.user;
  const [activeCity, setActiveCity] = useState('Yogyakarta');
  const [searchStuck, setSearchStuck] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const storeScrollRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ dragging: false, startX: 0, scrollLeft: 0 });
  const SEARCH_H = 68; // tinggi search bar + padding

  function onDragStart(e: React.MouseEvent) {
    const el = storeScrollRef.current;
    if (!el) return;
    dragState.current = { dragging: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
    el.style.cursor = 'grabbing';
  }
  function onDragEnd() {
    if (!storeScrollRef.current) return;
    dragState.current.dragging = false;
    storeScrollRef.current.style.cursor = 'grab';
  }
  function onDragMove(e: React.MouseEvent) {
    if (!dragState.current.dragging || !storeScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - storeScrollRef.current.offsetLeft;
    storeScrollRef.current.scrollLeft = dragState.current.scrollLeft - (x - dragState.current.startX);
  }

  useEffect(() => {
    const onScroll = () => {
      const bottom = carouselRef.current?.getBoundingClientRect().bottom ?? 999;
      setSearchStuck(bottom < SEARCH_H);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-28">

      {/* ── Promo Carousel (full width, top) ── */}
      <div className="relative" ref={carouselRef}>
        <BannerCarousel images={PROMO_BANNERS} alt="Promo DParagon" height={220} dotBottom={12} showGradient={false} />

        {/* Tombol login/keluar overlay pojok kanan atas */}
        <div className="absolute top-10 right-4 z-20">
          {user ? (
            <button
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
              className="text-white text-[11px] bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full"
            >
              Keluar
            </button>
          ) : (
            <button
              onClick={() => router.push('/auth/login')}
              className="text-white text-[11px] font-semibold bg-primary px-3 py-1.5 rounded-full shadow"
            >
              Masuk
            </button>
          )}
        </div>
      </div>

      {/* ── Search bar — overlap carousel, fixed saat scroll ── */}
      {/* Placeholder agar konten tidak loncat saat search bar jadi fixed */}
      {searchStuck && <div style={{ height: SEARCH_H }} />}

      <div
        className={`z-30 px-4 py-2 bg-background transition-shadow ${
          searchStuck
            ? 'fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] shadow-md'
            : 'relative -mt-8'
        }`}
      >
        <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-md">
          <div className="flex-1">
            <p className="font-semibold text-text-primary text-[13px]">Kota Yogyakarta</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-text-secondary text-[11px]">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                6 Juli 2026
              </span>
              <span className="flex items-center gap-1 text-text-secondary text-[11px]">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                1 Kamar
              </span>
              <span className="flex items-center gap-1 text-text-secondary text-[11px]">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                1 Hari
              </span>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ══ QUICK ACCESS GRID ══ */}
      <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm p-4">
        <p className="text-[13px] font-semibold text-text-primary">Produk & Layanan</p>
        <p className="text-[11px] text-text-secondary mb-3">Pesan makanan & oleh-oleh khas Jogja</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: '🍽️', label: 'Kuliner',    onClick: () => router.push('/belanja') },
            { icon: '🎁', label: 'Oleh-oleh',  onClick: () => router.push('/belanja') },
            { icon: '☕', label: 'Cafe',        onClick: () => router.push('/belanja') },
            { icon: '🏪', label: 'Semua',       onClick: () => router.push('/layanan') },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
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

      {/* Divider */}
      <div className="mx-auto mt-4 w-12 h-1 rounded-full bg-primary" />

      {/* ══ SECTION PROPERTI ══ */}
      <div className="mt-4">
        <div className="px-4 mb-3">
          <p className="text-[13px] font-semibold text-text-primary">Lokasi Kami di Indonesia</p>
          <p className="text-[11px] text-text-secondary">Menginap di D'Paragon yuk! Cari disini!</p>
        </div>

        <div className="flex gap-2 px-4 overflow-x-auto scrollbar-none mb-3">
          {CITIES.map((city) => (
            <button
              key={city}
              onClick={() => setActiveCity(city)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${
                activeCity === city
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-primary border-primary/30'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-none pb-1">
          {PROPERTIES.filter((p) => p.city === activeCity).map((prop) => (
            <div key={prop.name} className="shrink-0 w-44 rounded-2xl overflow-hidden bg-white shadow-sm">
              <div className="relative w-full h-28 bg-grey">
                <Image src={prop.image} alt={prop.name} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white text-[10px]">{prop.city}, Di {prop.city}</p>
                  <p className="text-white font-bold text-[11px] leading-tight">{prop.name}</p>
                </div>
                {prop.discount && (
                  <div className="absolute top-2 right-2 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    ⚡ {prop.discount}%
                  </div>
                )}
              </div>
              <div className="px-3 py-2">
                <p className="text-text-secondary text-[10px]">Mulai dari</p>
                <p className="text-text-primary font-bold text-[12px]">Rp {prop.price.toLocaleString('id-ID')} / Malam</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-auto mt-5 w-12 h-1 rounded-full bg-primary" />

      {/* ══ SECTION PESAN ══ */}
      <div className="mt-5">
        <div className="px-4 mb-2 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-text-primary">Pesan Makanan & Minuman</p>
          <button
            onClick={() => router.push('/belanja')}
            className="text-[12px] font-medium text-primary"
          >
            Jelajahi Menu
          </button>
        </div>

<div
          ref={storeScrollRef}
          onMouseDown={onDragStart}
          onMouseLeave={onDragEnd}
          onMouseUp={onDragEnd}
          onMouseMove={onDragMove}
          className="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-none cursor-grab select-none"
        >
          {stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              orderCount={orderCountMap[store.id] ?? 0}
              distanceKm={distanceMap ? distanceMap[store.id] ?? null : null}
              onPress={() => router.push(`/menu/${store.slug}`)}
            />
          ))}
          {/* Tap hint */}
          <div className="shrink-0 w-4" />
        </div>
      </div>

      {/* ══ SECTION JELAJAHI KEINDAHAN ALAM ══ */}
      <div className="mt-5">
        <div className="mx-4 flex items-center justify-between pb-2">
          <div>
            <p className="text-[13px] font-semibold text-text-primary">Jelajahi Keindahan Alam</p>
            <p className="text-[11px] text-text-secondary">Nikmati wisata seru bersama D'Paragon</p>
          </div>
          <button className="text-[12px] font-medium text-primary">Lihat Semua</button>
        </div>

        <div className="flex gap-2 px-4 overflow-x-auto scrollbar-none mb-3">
          {TOUR_CITIES.map((city) => (
            <button key={city} className="shrink-0 px-3 py-1 rounded-full text-[11px] font-medium border border-primary/30 text-primary bg-white">
              {city}
            </button>
          ))}
        </div>

        <div className="flex gap-3 px-4 overflow-x-auto pb-1 scrollbar-none">
          {TOUR_DESTINATIONS.map((dest) => (
            <div key={dest.name} className="shrink-0 w-44 h-32 rounded-2xl overflow-hidden relative bg-grey">
              <Image src={dest.image} alt={dest.name} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3">
                <p className="text-white font-semibold text-[12px]">{dest.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

// ── Bottom Nav ──
function BottomNav() {
  const router = useRouter();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';

  const tabs = [
    { label: 'Dashboard', href: '/',        icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
    { label: 'Reservasi', href: null,       icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
    { label: 'Belanja',   href: '/belanja', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> },
    { label: 'Profile',   href: null,       icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-[430px] pointer-events-auto">
        <div className="mx-3 mb-4 bg-white rounded-3xl shadow-2xl shadow-black/20 px-2 py-2 flex items-end">
          {tabs.slice(0, 2).map((tab) => {
            const active = tab.href ? pathname === tab.href : false;
            return (
              <button key={tab.label} onClick={() => tab.href && router.push(tab.href)} className="flex-1 flex flex-col items-center gap-1 py-1">
                <span className={active ? 'text-primary' : 'text-text-secondary'}>{tab.icon}</span>
                <span className={`text-[10px] font-medium ${active ? 'text-primary' : 'text-text-secondary'}`}>{tab.label}</span>
              </button>
            );
          })}

          {/* Tombol tengah */}
          <div className="flex-1 flex justify-center">
            <button className="w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/40 border-4 border-white -translate-y-4 flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2"/>
                <circle cx="12" cy="14" r="2"/>
                <line x1="12" y1="7" x2="12" y2="10"/>
                <line x1="9" y1="7" x2="15" y2="7"/>
              </svg>
            </button>
          </div>

          {tabs.slice(2).map((tab) => {
            const active = tab.href ? pathname === tab.href : false;
            return (
              <button key={tab.label} onClick={() => tab.href && router.push(tab.href)} className="flex-1 flex flex-col items-center gap-1 py-1">
                <span className={active ? 'text-primary' : 'text-text-secondary'}>{tab.icon}</span>
                <span className={`text-[10px] font-medium ${active ? 'text-primary' : 'text-text-secondary'}`}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Store address map (update dengan alamat asli) ──
const STORE_ADDRESSES: Record<string, { text: string; mapsUrl: string }> = {
  campagna: {
    text: 'Nologaten, Caturtunggal, Depok, Sleman',
    mapsUrl: 'https://www.google.com/maps/place/Campagna/@-7.7740483,110.4009445,17z/data=!4m15!1m8!3m7!1s0x2e7a59ccae99a619:0xd66ccb23d37ef82b!2sCampagna!8m2!3d-7.7739689!4d110.4009633!10e5!16s%2Fg%2F11ywp221yx!3m5!1s0x2e7a59ccae99a619:0xd66ccb23d37ef82b!8m2!3d-7.7739689!4d110.4009633!16s%2Fg%2F11ywp221yx?entry=ttu&g_ep=EgoyMDI2MDYyOS4wIKXMDSoASAFQAw%3D%3D',
  },
  jede: {
    text: 'Nologaten, Caturtunggal, Depok, Sleman',
    mapsUrl: 'https://www.google.com/maps/place/Sate+Klathak+dan+Bakmi+Jowo+Pak+Jede,+Nologaten/@-7.7738461,110.3982506,17z/data=!3m1!4b1!4m6!3m5!1s0x2e7a59c00b414079:0xa77b3974175617bd!8m2!3d-7.7738514!4d110.4008255!16s%2Fg%2F11b6lg1d_5?entry=ttu&g_ep=EgoyMDI2MDYyOS4wIKXMDSoASAFQAw%3D%3D',
  },
};

// ── Store Card ──
function StoreCard({ store, orderCount, distanceKm, onPress }: {
  store: Store;
  orderCount: number;
  distanceKm: number | null;
  onPress: () => void;
}) {
  const addr = STORE_ADDRESSES[store.slug];
  const distLabel = distanceKm != null
    ? distanceKm < 1
      ? `${Math.round(distanceKm * 1000)} m`
      : `${distanceKm.toFixed(1)} km`
    : null;

  return (
    <button
      onClick={onPress}
      className="shrink-0 w-52 bg-white rounded-2xl shadow-sm overflow-hidden text-left active:scale-95 transition-transform"
    >
      {/* Foto + badge pesanan */}
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

      {/* Info */}
      <div className="p-3">
        <p className="font-semibold text-[13px] text-text-primary leading-tight">{store.name}</p>
        {addr && (
          <p className="mt-1 text-[11px] text-text-secondary leading-tight">{addr.text}</p>
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
        <div className="mt-2.5 w-full py-1.5 rounded-lg text-center text-[11px] font-semibold bg-primary-01 text-primary border border-primary-02">
          Lihat Menu
        </div>
      </div>
    </button>
  );
}

// ── Static data ──
const PROMO_BANNERS = [
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=440&fit=crop',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=440&fit=crop',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=440&fit=crop',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=440&fit=crop',
];

const CITIES = ['Yogyakarta', 'Solo', 'Surabaya', 'Semarang', 'Palembang'];

const PROPERTIES = [
  { name: "D'JURAGAN KAMAR PONDOK TAMSIS", city: 'Yogyakarta', image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300&h=200&fit=crop', price: 150000, discount: null },
  { name: "D'PARAGON KEMUNING",            city: 'Yogyakarta', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=200&fit=crop', price: 225000, discount: 10 },
  { name: "D'PARAGON POGUNG F",            city: 'Yogyakarta', image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=300&h=200&fit=crop', price: 180000, discount: null },
  { name: "D'PARAGON SOLO BARU",           city: 'Solo',       image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=300&h=200&fit=crop', price: 160000, discount: 5 },
  { name: "D'PARAGON DARMO",               city: 'Surabaya',   image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=300&h=200&fit=crop', price: 200000, discount: null },
  { name: "D'PARAGON SIMPANG LIMA",        city: 'Semarang',   image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=300&h=200&fit=crop', price: 175000, discount: 8 },
  { name: "D'PARAGON PALEMBANG",           city: 'Palembang',  image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=300&h=200&fit=crop', price: 155000, discount: null },
];

const TOUR_CITIES = ['Kota Yogyakarta', 'Kabupaten Sleman', 'Kabupaten Magelang'];

const TOUR_DESTINATIONS = [
  { name: 'Malioboro',         image: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=300&h=200&fit=crop' },
  { name: 'Gunung Merapi',     image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=300&h=200&fit=crop' },
  { name: 'Candi Borobudur',   image: 'https://images.unsplash.com/photo-1584810359583-96fc3448beaa?w=300&h=200&fit=crop' },
  { name: 'Pantai Parangtritis', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&h=200&fit=crop' },
];
