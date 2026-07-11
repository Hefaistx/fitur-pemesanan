'use client';
import { useState, useRef, useEffect } from 'react';
import { Session } from 'next-auth';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { formatRupiah, generateWaMessage, buildWaLink, getNextDeliverySlot, getWibMinutes, type DeliverySlotInfo } from '@/lib/utils';
import { useDevTime } from '@/hooks/useDevTime';
import type { Store, MenuCategory, MenuItem } from '@/lib/schema';
import BannerCarousel from '@/components/BannerCarousel';

const SHOW_HOURS_SLUGS = ['campagna', 'jede'];

const STORE_BANNERS: Record<string, string[]> = {
  campagna: [
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=440&fit=crop',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=440&fit=crop',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=440&fit=crop',
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&h=440&fit=crop',
    'https://images.unsplash.com/photo-1520080816484-a4a3f57e851e?w=800&h=440&fit=crop',
  ],
  jede: [
    'https://images.unsplash.com/photo-1606850780674-76bc78f8862a?w=800&h=440&fit=crop',
    'https://images.unsplash.com/photo-1529563021893-cc83c992d75d?w=800&h=440&fit=crop',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=440&fit=crop',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=440&fit=crop',
  ],
};

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

function parseStoreStatus(openHours: string | null, now?: Date): 'open' | 'belum_buka' | 'tutup' {
  if (!openHours) return 'open';
  const match = openHours.match(/(\d+)[.\:](\d+)\s*[–\-]\s*(\d+)[.\:](\d+)/);
  if (!match) return 'open';
  const [, oh, om, ch, cm] = match.map(Number);
  const d = now ?? new Date();
  const wibMinutes = ((d.getUTCHours() + 7) % 24) * 60 + d.getUTCMinutes();
  if (wibMinutes < oh * 60 + om) return 'belum_buka';
  if (wibMinutes >= ch * 60 + cm) return 'tutup';
  return 'open';
}

interface Props {
  store: Store;
  categories: MenuCategory[];
  items: MenuItem[];
  session: Session | null;
  deliverySlots: DeliverySlotInfo[];
  orderCount: number;
}

export default function MenuClient({ store, categories, items, session, deliverySlots, orderCount }: Props) {
  const router = useRouter();
  const { state, dispatch, totalItems, totalAmount } = useCart();
  const [activeCategory, setActiveCategory] = useState<number | null>(categories[0]?.id ?? null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showRestrictionPopup, setShowRestrictionPopup] = useState(false);
  const categoryRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const user = session?.user;
  const isLoggedIn = !!user;
  const hasReservation = user?.hasActiveReservation ?? false;
  const isInJogja = user?.isInJogja ?? false;
  const canOrder = isLoggedIn && hasReservation && isInJogja;

  const { now: devNow, devTime } = useDevTime();
  const nextSlot = getNextDeliverySlot(deliverySlots, devNow);
  const isOrderingOpen = deliverySlots.length === 0 || nextSlot !== null;
  const canActuallyOrder = canOrder && isOrderingOpen;

  const storeAddress = STORE_ADDRESSES[store.slug];

  useEffect(() => {
    if (!canOrder) setShowRestrictionPopup(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getQty = (menuItemId: number) =>
    state.items.find((i) => i.menuItemId === menuItemId)?.qty ?? 0;

  const handleAdd = (item: MenuItem) => {
    if (!isLoggedIn) { setShowLoginPrompt(true); return; }
    if (!canActuallyOrder) return;
    const category = categories.find((c) => c.id === item.categoryId);
    dispatch({
      type: 'ADD',
      payload: {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
        categoryName: category?.name ?? null,
        storeId: store.id,
        storeSlug: store.slug,
        storeName: store.name,
        waNumber: store.waNumber,
      },
    });
  };

  const handleDecrease = (item: MenuItem) => {
    const qty = getQty(item.id);
    dispatch({ type: 'SET_QTY', menuItemId: item.id, qty: qty - 1 });
  };

  const scrollToCategory = (catId: number) => {
    setActiveCategory(catId);
    categoryRefs.current[catId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const waMessage = generateWaMessage({
    storeName: store.name,
    userName: user?.name ?? '',
    hasReservation: false,
  });
  const waLink = buildWaLink(store.waNumber, waMessage);

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* ── Store Banner Carousel ── */}
      <div className="relative">
        <BannerCarousel
          images={STORE_BANNERS[store.slug] ?? (store.bannerUrl ? [store.bannerUrl] : [])}
          alt={store.name}
          height={240}
        />

        <button
          onClick={() => router.back()}
          className="absolute top-12 left-4 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-white backdrop-blur-sm z-10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>

        <div className="absolute bottom-4 left-4 right-12 z-10 pointer-events-none">
          <h1 className="text-white font-bold text-[22px] drop-shadow">{store.name}</h1>
          {orderCount > 0 && (
            <span className="text-white/80 text-[11px] mt-0.5 block">{orderCount}x dipesan</span>
          )}
          {storeAddress && (
            <a
              href={storeAddress.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 mt-1 text-white/80 text-[11px] pointer-events-auto"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {storeAddress.text}
            </a>
          )}
          {SHOW_HOURS_SLUGS.includes(store.slug) && store.openHours && (
            <span className="text-white/75 text-[11px] mt-1 block">🕐 Buka {store.openHours}</span>
          )}
        </div>
      </div>

      {/* ── Info periode pengiriman ── */}
      {deliverySlots.length > 0 && (
        <div className="mx-4 mt-3 flex items-center gap-3 bg-primary-01 border border-primary-02 rounded-xl px-3 py-2.5">
          <span className="text-base shrink-0">🚚</span>
          <div>
            <p className="text-[11px] font-semibold text-primary">Periode Pengiriman</p>
            <p className="text-[11px] text-primary/80 mt-0.5">
              {deliverySlots.map(s => s.deliveryTime).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* ── Category Tab Pills ── */}
      <div className="sticky top-0 z-30 bg-background pt-2 pb-1">
        <div className="flex gap-2 px-4 overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-primary text-white'
                  : 'bg-white text-text-secondary border border-grey'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Menu List per Kategori ── */}
      <div className="mt-2 space-y-6 px-4">
        {categories.map((cat) => {
          const catItems = items.filter((i) => i.categoryId === cat.id && i.isAvailable);
          if (catItems.length === 0) return null;
          return (
            <div
              key={cat.id}
              ref={(el) => { categoryRefs.current[cat.id] = el; }}
            >
              <h2 className="text-[13px] font-semibold text-text-primary mb-3 pt-1">{cat.name}</h2>
              <div className="space-y-3">
                {catItems.map((item) => {
                  const qty = getQty(item.id);
                  return (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      qty={qty}
                      canActuallyOrder={canActuallyOrder}
                      blockLabel={
                        !isLoggedIn ? null
                        : !canOrder ? null
                        : !isOrderingOpen ? 'Pemesanan Tutup'
                        : null
                      }
                      isLoggedIn={isLoggedIn}
                      onAdd={() => handleAdd(item)}
                      onDecrease={() => handleDecrease(item)}
                      onIncrease={() => handleAdd(item)}
                      onLoginPrompt={() => setShowLoginPrompt(true)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Sticky Cart Bar ── */}
      {canActuallyOrder && totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className="w-full max-w-[430px] p-4 pointer-events-auto">
            <button
              onClick={() => router.push('/checkout')}
              className="w-full bg-primary rounded-2xl px-5 py-4 flex items-center justify-between shadow-lg shadow-primary/30 active:opacity-90"
            >
              <div className="flex items-center gap-3">
                <span className="bg-white text-primary text-[12px] font-bold w-6 h-6 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
                <span className="text-white font-semibold text-[14px]">Lihat Pesanan</span>
              </div>
              <span className="text-white font-bold text-[14px]">{formatRupiah(totalAmount)}</span>
            </button>
          </div>
        </div>
      )}

      {/* Pemesanan tutup */}
      {canOrder && !isOrderingOpen && totalItems === 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className="w-full max-w-[430px] p-4 pointer-events-auto">
            <div className="w-full bg-white border border-grey rounded-2xl px-4 py-3 flex items-start gap-3 shadow-sm">
              <span className="text-lg mt-0.5">🕐</span>
              <div>
                <p className="text-[13px] font-semibold text-text-primary">Pemesanan ditutup hari ini</p>
                {(() => {
                  const firstCutoff = [...deliverySlots].sort((a, b) => a.cutoffTime.localeCompare(b.cutoffTime))[0]?.cutoffTime;
                  return firstCutoff ? (
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      Bisa pesan lagi besok mulai pukul <span className="font-semibold">{firstCutoff} WIB</span>
                    </p>
                  ) : null;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <LoginPromptModal
          onClose={() => setShowLoginPrompt(false)}
          onLogin={() => router.push('/auth/login')}
        />
      )}

      {/* Restriction Popup — non-eligible user */}
      {showRestrictionPopup && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={() => setShowRestrictionPopup(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
          <div
            className="relative w-full max-w-[430px] bg-white rounded-t-3xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Colored header band */}
            <div className="bg-primary px-6 pt-6 pb-8 flex flex-col items-center text-center">
              <div className="w-10 h-1 rounded-full bg-white/40 mx-auto mb-5" />
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3 text-4xl">
                🏨
              </div>
              <h2 className="text-[18px] font-bold text-white">
                {!isLoggedIn ? 'Masuk untuk memesan' : 'Pemesanan Tidak Tersedia'}
              </h2>
              <p className="text-[13px] text-white/80 mt-2 leading-relaxed">
                {!isLoggedIn
                  ? 'Layanan pemesanan khusus untuk tamu D\'Paragon yang sedang menginap di wilayah Yogyakarta.'
                  : 'Hanya pelanggan dengan reservasi aktif di properti D\'Paragon wilayah Yogyakarta yang dapat memesan.'}
              </p>
            </div>

            <div className="px-6 py-5 space-y-3">
              {!isLoggedIn && (
                <button
                  onClick={() => router.push('/auth/login')}
                  className="w-full bg-primary text-white font-bold text-[14px] py-4 rounded-2xl active:opacity-80"
                >
                  Masuk
                </button>
              )}
              {isLoggedIn && !user?.hasActiveReservation && (
                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-primary text-white font-bold text-[14px] py-4 rounded-2xl active:opacity-80"
                >
                  Reservasi di D'Paragon
                </button>
              )}
              <button
                onClick={() => setShowRestrictionPopup(false)}
                className="w-full bg-background text-text-secondary font-medium text-[14px] py-3.5 rounded-2xl active:bg-grey"
              >
                Lihat Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Login Prompt Modal ──
function LoginPromptModal({ onClose, onLogin }: { onClose: () => void; onLogin: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Sheet */}
      <div
        className="relative w-full max-w-[430px] bg-white rounded-t-3xl px-6 pt-5 pb-10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 rounded-full bg-grey mx-auto mb-5" />

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-primary-01 flex items-center justify-center mb-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h2 className="text-[17px] font-bold text-text-primary">Masuk dulu yuk!</h2>
          <p className="text-[13px] text-text-secondary mt-1.5 leading-relaxed">
            Kamu perlu login untuk memesan<br />atau menghubungi toko via WhatsApp.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onLogin}
            className="w-full bg-primary text-white font-bold text-[14px] py-4 rounded-2xl active:opacity-80"
          >
            Masuk
          </button>
          <button
            onClick={onClose}
            className="w-full bg-background text-text-secondary font-medium text-[14px] py-3.5 rounded-2xl active:bg-grey"
          >
            Nanti saja
          </button>
        </div>
      </div>
    </div>
  );
}

// ── WhatsApp Icon ──
function WaIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

// ── Menu Item Card ──
function MenuItemCard({
  item,
  qty,
  canActuallyOrder,
  blockLabel,
  isLoggedIn,
  onAdd,
  onDecrease,
  onIncrease,
  onLoginPrompt,
}: {
  item: MenuItem;
  qty: number;
  canActuallyOrder: boolean;
  blockLabel: string | null;
  isLoggedIn: boolean;
  onAdd: () => void;
  onDecrease: () => void;
  onIncrease: () => void;
  onLoginPrompt: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl flex gap-3 p-3 shadow-sm">
      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-grey shrink-0">
        {item.imageUrl && (
          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[13px] text-text-primary leading-tight">{item.name}</p>
        {item.description && (
          <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-primary font-bold text-[13px]">{formatRupiah(item.price)}</span>

          {!isLoggedIn ? (
            <button onClick={onLoginPrompt} className="bg-primary text-white text-[12px] font-semibold px-4 py-1.5 rounded-xl active:opacity-80">
              + Tambah
            </button>
          ) : canActuallyOrder ? (
            qty === 0 ? (
              <button onClick={onAdd} className="bg-primary text-white text-[12px] font-semibold px-4 py-1.5 rounded-xl active:opacity-80">
                + Tambah
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={onDecrease} className="w-7 h-7 rounded-full border-2 border-primary text-primary font-bold text-[16px] flex items-center justify-center active:bg-primary-02">−</button>
                <span className="text-text-primary font-bold text-[14px] w-4 text-center">{qty}</span>
                <button onClick={onIncrease} className="w-7 h-7 rounded-full bg-primary text-white font-bold text-[16px] flex items-center justify-center active:opacity-80">+</button>
              </div>
            )
          ) : blockLabel ? (
            <span className="text-[11px] font-semibold text-text-secondary bg-grey px-3 py-1.5 rounded-xl">
              {blockLabel}
            </span>
          ) : (
            /* Logged in tapi bukan area Jogja / tanpa reservasi */
            <div className="w-7 h-7 rounded-full bg-grey flex items-center justify-center" title="Tidak tersedia di lokasimu">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#BFBFBF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
