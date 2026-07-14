'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { formatRupiah } from '@/lib/utils';

type DeliveryStatus = null | 'confirmed' | 'delivering' | 'delivered';

interface OrderDetail {
  id: number;
  storeName: string;
  storeSlug: string;
  totalAmount: number;
  notes: string | null;
  paymentStatus: string;
  deliveryStatus: DeliveryStatus;
  deliveryProofUrl: string | null;
  propertyName: string | null;
  roomNumber: string | null;
  deliveryDate: string | null;
  deliveryTime: string | null;
  vaNumber: string | null;
  createdAt: string;
  items: { id: number; itemName: string; quantity: number; priceAtOrder: number }[];
}

const STEPS = [
  { key: '__paid__',    label: 'Dibayar',          icon: '💳' },
  { key: 'confirmed',  label: 'Dikonfirmasi',      icon: '✅' },
  { key: 'delivering', label: 'Dalam Perjalanan',  icon: '🛵' },
  { key: 'delivered',  label: 'Terkirim',          icon: '🏠' },
] as const;

function getActiveStep(status: DeliveryStatus): number {
  if (status === 'delivered')  return 3;
  if (status === 'delivering') return 2;
  if (status === 'confirmed')  return 1;
  return 0;
}

function Timeline({ status }: { status: DeliveryStatus }) {
  const active = getActiveStep(status);
  return (
    <div className="flex items-start">
      {STEPS.map((step, i) => (
        <div key={i} className="flex-1 flex flex-col items-center relative">
          {i > 0 && (
            <div className={`absolute top-[14px] right-1/2 w-full h-[2px] ${i <= active ? 'bg-primary' : 'bg-grey'}`} />
          )}
          <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-[14px]
            ${i <= active ? 'bg-primary' : 'bg-grey/40'}`}>
            {i <= active
              ? <svg width="13" height="13" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              : <span className="text-[11px]">{step.icon}</span>
            }
          </div>
          <p className={`text-[9px] mt-1.5 text-center leading-tight font-medium ${
            i === active ? 'text-primary' : i < active ? 'text-text-primary' : 'text-text-secondary'
          }`}>{step.label}</p>
        </div>
      ))}
    </div>
  );
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    + ', ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function formatDelivery(date: string | null, time: string | null) {
  if (!date) return '-';
  const d = new Date(`${date}T00:00:00+07:00`);
  const label = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return time ? `${label} pukul ${time}` : label;
}

const SERVICE_FEE = 2000;

export default function OrderDetailClient({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProof, setShowProof] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then(r => r.json())
      .then(setOrder)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Rincian Pesanan" showBack />
        <div className="flex justify-center py-20 text-text-secondary text-[13px]">Memuat...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Rincian Pesanan" showBack />
        <div className="flex justify-center py-20 text-text-secondary text-[13px]">Pesanan tidak ditemukan</div>
      </div>
    );
  }

  const subtotal = order.items.reduce((s, i) => s + i.priceAtOrder * i.quantity, 0);
  const discount = subtotal + SERVICE_FEE - order.totalAmount;
  const isActive = order.deliveryStatus !== 'delivered';
  const statusLabel = isActive ? 'Dalam Proses' : 'Selesai';

  return (
    <div className="min-h-screen bg-background pb-10">
      <Header title="Rincian Pesanan" showBack />

      {/* Status banner */}
      <div className={`px-4 py-5 flex items-center gap-4 ${isActive ? 'bg-primary' : 'bg-green-600'}`}>
        <div className="text-4xl">{isActive ? '🛵' : '✅'}</div>
        <div>
          <p className="text-white font-bold text-[20px]">{statusLabel}</p>
          <p className="text-white/80 text-[12px] mt-0.5">
            {isActive
              ? 'Pesananmu sedang dalam proses pengiriman'
              : 'Pesananmu sudah berhasil diterima'}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm px-5 py-4">
        <Timeline status={order.deliveryStatus} />
      </div>

      {/* Store + items */}
      <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-grey flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-01 flex items-center justify-center text-xl shrink-0">🍽️</div>
          <p className="font-semibold text-[14px] text-text-primary">{order.storeName}</p>
        </div>

        <div className="px-4 py-3 space-y-2.5">
          {order.items.map(item => (
            <div key={item.id} className="flex items-start gap-3">
              <span className="text-[13px] text-text-secondary w-6 shrink-0 pt-0.5">{item.quantity}×</span>
              <span className="text-[13px] text-text-primary flex-1">{item.itemName}</span>
              <span className="text-[13px] text-text-primary shrink-0">{formatRupiah(item.priceAtOrder * item.quantity)}</span>
            </div>
          ))}
        </div>

        {/* Price breakdown */}
        <div className="border-t border-grey mx-4" />
        <div className="px-4 py-3 space-y-2">
          <div className="flex justify-between text-[13px]">
            <span className="text-text-secondary">Subtotal ({order.items.length} menu)</span>
            <span className="text-text-primary">{formatRupiah(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-[13px]">
              <span className="text-text-secondary">Voucher Diskon</span>
              <span className="text-green-600">−{formatRupiah(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-[13px]">
            <span className="text-text-secondary">Biaya Layanan</span>
            <span className="text-text-primary">{formatRupiah(SERVICE_FEE)}</span>
          </div>
        </div>

        <div className="border-t border-grey mx-4" />
        <div className="px-4 py-3 flex justify-between items-center">
          <span className="text-[14px] font-bold text-text-primary">Total</span>
          <span className="text-[16px] font-bold text-primary">{formatRupiah(order.totalAmount)}</span>
        </div>
      </div>

      {/* Order info */}
      <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm px-4 py-4">
        <p className="text-[13px] font-semibold text-text-primary mb-3">Informasi Pesanan</p>
        <div className="space-y-2.5">
          {[
            { label: 'Catatan', value: order.notes || 'Tidak ada' },
            { label: 'No. Pesanan', value: `#ORD-${String(order.id).padStart(4, '0')}` },
            { label: 'Waktu Pemesanan', value: formatDateTime(order.createdAt) },
            { label: 'Jadwal Pengiriman', value: formatDelivery(order.deliveryDate, order.deliveryTime) },
            { label: 'Pembayaran', value: 'Virtual Account BCA' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-4">
              <span className="text-[12px] text-text-secondary shrink-0">{label}</span>
              <span className="text-[12px] text-text-primary text-right">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alamat pengiriman */}
      <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm px-4 py-4 space-y-3">
        <p className="text-[13px] font-semibold text-text-primary">Info Pengiriman</p>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-text-secondary">Dari</p>
            <p className="text-[12px] font-medium text-text-primary">{order.storeName}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-text-secondary">Ke</p>
            <p className="text-[12px] font-medium text-text-primary">
              {order.propertyName ?? 'D\'Paragon'}
              {order.roomNumber && <span className="text-text-secondary font-normal"> · Kamar {order.roomNumber}</span>}
            </p>
          </div>
        </div>

        {/* Bukti pengiriman */}
        {order.deliveryProofUrl && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowProof(true)}
              className="flex items-center gap-1.5 text-primary active:opacity-70"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span className="text-[12px] font-semibold">Bukti Pengiriman</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
            {order.deliveryDate && (
              <p className="text-[11px] text-text-secondary">
                {new Date(`${order.deliveryDate}T00:00:00+07:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                {order.deliveryTime && <span> · {order.deliveryTime}</span>}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Pesan lagi */}
      <div className="mx-4 mt-4">
        <button
          onClick={() => router.push(`/menu/${order.storeSlug}`)}
          className="w-full bg-primary text-white font-bold text-[14px] py-4 rounded-2xl active:opacity-80"
        >
          Pesan Lagi
        </button>
      </div>

      {/* Lightbox bukti pengiriman */}
      {showProof && order.deliveryProofUrl && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowProof(false)}
        >
          <button
            onClick={() => setShowProof(false)}
            className="absolute top-12 right-4 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-lg"
          >
            ✕
          </button>
          <img
            src={order.deliveryProofUrl}
            alt="Bukti pengiriman"
            className="max-w-full max-h-[80vh] rounded-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
