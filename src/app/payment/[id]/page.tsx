'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { formatRupiah } from '@/lib/utils';
import Header from '@/components/Header';

interface Order {
  id: number;
  totalAmount: number;
  vaNumber: string | null;
  paymentDeadline: string | null;
  paymentStatus: string;
  deliveryDate: string | null;
  deliveryTime: string | null;
}

function formatVA(va: string) {
  return va.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function formatDeadline(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'long' });
}

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((d) => { setOrder(d.id ? d : null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const copyVA = () => {
    if (!order?.vaNumber) return;
    navigator.clipboard.writeText(order.vaNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confirmPayment = async () => {
    setConfirming(true);
    await fetch(`/api/orders/${id}`, { method: 'PATCH' });
    const res = await fetch(`/api/orders/${id}`);
    const d = await res.json();
    setOrder(d.id ? d : null);
    setConfirming(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-text-secondary text-[13px]">Memuat...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-text-secondary text-[13px]">Pesanan tidak ditemukan.</p>
      </div>
    );
  }

  if (order.paymentStatus === 'paid') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header title="Pembayaran" showBack />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <p className="font-bold text-[20px] text-text-primary">Pembayaran Berhasil!</p>
            <p className="text-text-secondary text-[13px] mt-1">Pesananmu sedang diproses oleh staff.</p>
          </div>
          {(order.deliveryDate || order.deliveryTime) && (
            <div className="bg-[#FFF8E1] border border-warning/40 rounded-2xl px-5 py-4 w-full">
              <p className="text-[12px] text-[#7A5C00] text-center">
                Estimasi pengiriman
                {order.deliveryDate && <span className="font-semibold block text-[14px]">{order.deliveryDate}</span>}
                {order.deliveryTime && <span className="font-semibold text-[14px]"> pukul {order.deliveryTime}</span>}
              </p>
            </div>
          )}
          <button
            onClick={() => router.push('/orders')}
            className="w-full bg-primary text-white font-bold text-[14px] py-4 rounded-2xl mt-2"
          >
            Lihat Status Pesanan
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full text-text-secondary font-medium text-[13px] py-3"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header title="Pembayaran" showBack />

      {/* Timer info */}
      {order.paymentDeadline && (
        <div className="mx-4 mt-4 bg-danger/10 border border-danger/30 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-lg">⏳</span>
          <p className="text-[12px] text-danger font-medium">
            Selesaikan pembayaran sebelum {formatDeadline(order.paymentDeadline)}
          </p>
        </div>
      )}

      {/* VA Card */}
      <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Header BCA */}
        <div className="bg-[#005CA9] px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
            <span className="text-[#005CA9] font-black text-[12px]">BCA</span>
          </div>
          <div>
            <p className="text-white/70 text-[11px]">Bank Central Asia</p>
            <p className="text-white font-semibold text-[13px]">Virtual Account</p>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Nomor VA */}
          <div>
            <p className="text-[11px] text-text-secondary mb-1">Nomor Virtual Account</p>
            <div className="flex items-center justify-between">
              <p className="text-[22px] font-bold text-text-primary tracking-widest">
                {order.vaNumber ? formatVA(order.vaNumber) : '—'}
              </p>
              <button
                onClick={copyVA}
                className="text-[12px] font-semibold text-primary bg-primary-01 border border-primary-02 px-3 py-1.5 rounded-lg"
              >
                {copied ? '✓ Disalin' : 'Salin'}
              </button>
            </div>
          </div>

          <div className="h-px bg-grey" />

          {/* Total */}
          <div className="flex justify-between items-center">
            <p className="text-[13px] text-text-secondary">Total Pembayaran</p>
            <p className="text-[18px] font-bold text-text-primary">{formatRupiah(order.totalAmount)}</p>
          </div>

          {order.deliveryTime && (
            <>
              <div className="h-px bg-grey" />
              <div className="flex justify-between items-center">
                <p className="text-[13px] text-text-secondary">Estimasi Pengiriman</p>
                <p className="text-[13px] font-semibold text-primary">
                  {order.deliveryDate ? `${order.deliveryDate} · ` : ''}{order.deliveryTime}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cara bayar */}
      <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm p-4">
        <p className="font-semibold text-[13px] text-text-primary mb-3">Cara Bayar via m-BCA</p>
        <div className="space-y-2.5">
          {[
            'Buka aplikasi BCA mobile',
            'Pilih m-Transfer → BCA Virtual Account',
            'Masukkan nomor VA di atas',
            'Pastikan nama & nominal sudah sesuai',
            'Masukkan PIN m-BCA',
            'Simpan bukti transfer',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#005CA9] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-[12px] text-text-secondary leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <div className="w-full max-w-[430px] bg-white border-t border-grey p-4 pt-3 pointer-events-auto">
          <button
            onClick={confirmPayment}
            disabled={confirming}
            className="w-full bg-success text-white font-bold text-[14px] py-4 rounded-2xl flex items-center justify-center gap-2 active:opacity-80 disabled:opacity-60"
          >
            {confirming ? 'Memproses...' : '✓ Saya Sudah Transfer'}
          </button>
          <p className="text-[10px] text-text-secondary text-center mt-2">
            Konfirmasi pembayaran akan diverifikasi oleh sistem
          </p>
        </div>
      </div>
    </div>
  );
}
