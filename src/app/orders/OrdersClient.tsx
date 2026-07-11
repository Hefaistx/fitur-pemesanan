'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { formatRupiah } from '@/lib/utils';

type DeliveryStatus = null | 'confirmed' | 'delivering' | 'delivered';

interface OrderItem {
  id: number;
  itemName: string;
  quantity: number;
  priceAtOrder: number;
}

interface Order {
  id: number;
  storeName: string;
  storeSlug: string;
  totalAmount: number;
  deliveryStatus: DeliveryStatus;
  deliveryDate: string | null;
  deliveryTime: string | null;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  delivered:  { label: 'Terkirim',         cls: 'bg-green-100 text-green-700' },
  delivering: { label: 'Dalam Perjalanan', cls: 'bg-blue-100 text-blue-700' },
  confirmed:  { label: 'Dikonfirmasi',     cls: 'bg-yellow-100 text-yellow-700' },
};
function statusInfo(s: DeliveryStatus) {
  return s ? STATUS_MAP[s] : { label: 'Dibayar', cls: 'bg-primary-01 text-primary' };
}

function OrderCode({ id }: { id: number }) {
  return `#ORD-${String(id).padStart(4, '0')}`;
}

function ShoppingCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const { label, cls } = statusInfo(order.deliveryStatus);
  const itemSummary = order.items.slice(0, 2).map(i => `${i.quantity}× ${i.itemName}`).join(', ');
  const more = order.items.length > 2 ? ` +${order.items.length - 2} lainnya` : '';

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl shadow-sm overflow-hidden text-left active:opacity-90 transition-opacity"
    >
      {/* Top row */}
      <div className="flex gap-3 px-4 pt-4 pb-3">
        {/* Logo */}
        <div className="w-14 h-14 rounded-xl bg-primary-01 flex items-center justify-center shrink-0 text-3xl">
          🍽️
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Code + badge */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#748194" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
              <span className="text-[11px] text-text-secondary font-mono">{OrderCode({ id: order.id })}</span>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${cls}`}>{label}</span>
          </div>
          {/* Category */}
          <p className="text-[11px] text-text-secondary mb-0.5">Makanan & Minuman</p>
          {/* Store name */}
          <p className="text-[13px] font-semibold text-text-primary leading-tight truncate">{order.storeName}</p>
          {/* Items */}
          <p className="text-[11px] text-text-secondary mt-0.5 truncate">{itemSummary}{more}</p>
        </div>
      </div>

      {/* Divider + bottom */}
      <div className="border-t border-grey mx-4" />
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-[14px] font-bold text-text-primary">{formatRupiah(order.totalAmount)}</p>
        <div className="flex items-center gap-1 text-primary">
          <span className="text-[12px] font-semibold">Lihat Detail</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </div>
    </button>
  );
}

const CHIPS = [{ label: 'Makanan & Minuman', value: 'fnb' }];

export default function OrdersClient() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'done'>('active');

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeOrders = orders.filter(o => o.deliveryStatus !== 'delivered');
  const doneOrders   = orders.filter(o => o.deliveryStatus === 'delivered');
  const displayed    = tab === 'active' ? activeOrders : doneOrders;

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header + Tabs + Chips */}
      <div className="bg-white shadow-sm">
        <Header title="Belanja" showBack />

        <div className="flex px-4 border-b border-grey">
          {(['active', 'done'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-[13px] font-medium border-b-2 transition-colors ${
                tab === t ? 'border-primary text-primary' : 'border-transparent text-text-secondary'
              }`}
            >
              {t === 'active' ? 'Aktif' : 'Selesai'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0 bg-primary px-2.5 py-1 rounded-full">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/>
            </svg>
            <span className="text-[11px] text-white font-medium">Filter</span>
          </div>
          {CHIPS.map(c => (
            <div key={c.value} className="shrink-0 px-3 py-1 rounded-full text-[11px] font-medium bg-primary text-white">
              {c.label}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 mt-3 space-y-3">
        {loading && (
          <div className="flex justify-center py-16 text-text-secondary text-[13px]">Memuat...</div>
        )}

        {!loading && displayed.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3 text-center">
            <span className="text-5xl">{tab === 'active' ? '🛍️' : '✅'}</span>
            <p className="font-semibold text-text-primary">
              {tab === 'active' ? 'Tidak ada pesanan aktif' : 'Belum ada pesanan selesai'}
            </p>
            <p className="text-[12px] text-text-secondary">
              {tab === 'active'
                ? 'Pesanan yang sedang diproses akan muncul di sini'
                : 'Pesanan yang sudah terkirim akan muncul di sini'}
            </p>
          </div>
        )}

        {displayed.map(order => (
          <ShoppingCard
            key={order.id}
            order={order}
            onClick={() => router.push(`/orders/${order.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
