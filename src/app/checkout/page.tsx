'use client';
import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { formatRupiah, type DeliverySlotInfo } from '@/lib/utils';
import { useDevTime } from '@/hooks/useDevTime';
import Header from '@/components/Header';

// ── Helpers ──────────────────────────────────────────
function toWibDateStr(date: Date): string {
  // Return "YYYY-MM-DD" in WIB (UTC+7)
  const wib = new Date(date.getTime() + 7 * 3600000);
  return wib.toISOString().slice(0, 10);
}

function wibMinutesOf(date: Date): number {
  return ((date.getUTCHours() + 7) % 24) * 60 + date.getUTCMinutes();
}

function formatDateLabel(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return 'Hari ini';
  const d = new Date(dateStr + 'T00:00:00+07:00');
  return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
}

function getDatesInRange(checkIn: string, checkOut: string, todayStr: string): string[] {
  const dates: string[] = [];
  const start = new Date(Math.max(new Date(checkIn).getTime(), new Date(todayStr).getTime()));
  const end = new Date(checkOut);
  end.setHours(0, 0, 0, 0); // sampai hari check-out (tidak termasuk hari setelah)
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  while (cur <= end) {
    dates.push(toWibDateStr(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates.slice(0, 7); // max 7 hari
}

// ─────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { state, dispatch, totalAmount } = useCart();
  const SERVICE_FEE = 2000;
  const [notes, setNotes] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [voucherMsg, setVoucherMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [tataCaraOpen, setTataCaraOpen] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [slots, setSlots] = useState<DeliverySlotInfo[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>(''); // deliveryTime
  const { now: devNow } = useDevTime();

  const user = session?.user;
  const items = state.items;
  const todayStr = toWibDateStr(devNow);
  const wibNow = wibMinutesOf(devNow);

  // Tanggal yang bisa dipilih (sesuai durasi menginap)
  const availableDates = useMemo(() => {
    if (!user?.checkIn || !user?.checkOut) return [todayStr];
    return getDatesInRange(user.checkIn, user.checkOut, todayStr);
  }, [user?.checkIn, user?.checkOut, todayStr]);

  useEffect(() => {
    if (!state.storeId) return;
    fetch(`/api/delivery-slots?storeId=${state.storeId}`)
      .then((r) => r.json())
      .then(setSlots)
      .catch(() => {});
  }, [state.storeId]);

  // Init date ke hari ini
  useEffect(() => {
    if (availableDates.length && !selectedDate) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  // Init room ke reservasi utama
  useEffect(() => {
    if (user?.reservationId && !selectedRoomId) {
      setSelectedRoomId(user.reservationId);
    }
  }, [user?.reservationId, selectedRoomId]);

  // Slot yang tersedia untuk tanggal terpilih
  const slotsForDate = useMemo(() => {
    const isToday = selectedDate === todayStr;
    const checkOutStr = user?.checkOut ? toWibDateStr(new Date(user.checkOut)) : null;
    const isCheckOutDay = !!checkOutStr && selectedDate === checkOutStr;
    const CO_MINUTES = 12 * 60; // checkout maks 12:00

    return slots.map((s) => {
      const [ch, cm] = s.cutoffTime.split(':').map(Number);
      const [dh, dm] = s.deliveryTime.split(':').map(Number);
      const cutoffPast = isToday && wibNow > ch * 60 + cm;
      const afterCheckout = isCheckOutDay && dh * 60 + dm >= CO_MINUTES;
      return { ...s, isPast: cutoffPast || afterCheckout };
    });
  }, [slots, selectedDate, todayStr, wibNow, user?.checkOut]);

  // Auto-select slot pertama yang tersedia
  useEffect(() => {
    if (!slotsForDate.length) return;
    const first = slotsForDate.find((s) => !s.isPast);
    if (first && !selectedSlot) setSelectedSlot(first.deliveryTime);
    // Jika slot yang dipilih sudah jadi past (karena ganti tanggal/waktu), reset
    if (selectedSlot) {
      const cur = slotsForDate.find((s) => s.deliveryTime === selectedSlot);
      if (cur?.isPast) {
        const next = slotsForDate.find((s) => !s.isPast);
        setSelectedSlot(next?.deliveryTime ?? '');
      }
    }
  }, [slotsForDate, selectedSlot]);

  // Info bisa pesan lagi
  const allPastToday = slotsForDate.length > 0 && slotsForDate.every((s) => s.isPast) && selectedDate === todayStr;
  const firstSlotCutoff = slots.length > 0
    ? slots.sort((a, b) => a.cutoffTime.localeCompare(b.cutoffTime))[0].cutoffTime
    : null;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header title="Pesanan Saya" showBack />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
          <span className="text-6xl">🛒</span>
          <p className="font-semibold text-text-primary">Keranjang masih kosong</p>
          <p className="text-text-secondary text-[13px]">Tambahkan menu dari toko dulu ya!</p>
          <button onClick={() => router.push('/')} className="bg-primary text-white px-6 py-3 rounded-xl font-semibold text-[14px]">
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  const grandTotal = Math.max(0, totalAmount + SERVICE_FEE - discount);

  const handleBuatPesanan = async () => {
    if (!user || !selectedSlot) return;
    setSaving(true);
    try {
      const reservationId = selectedRoomId || user.reservationId;
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: state.storeId,
          reservationId: reservationId ? Number(reservationId) : null,
          totalAmount: grandTotal,
          notes,
          deliveryDate: selectedDate,
          deliveryTime: selectedSlot,
          items: items.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.qty,
            priceAtOrder: i.price,
            itemName: i.name,
          })),
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      dispatch({ type: 'CLEAR' });
      router.push(`/payment/${data.orderId}`);
    } catch {
      alert('Terjadi kesalahan. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-40">
      <Header title="Konfirmasi Pesanan" showBack />

      {/* Info toko */}
      <div className="mx-4 mt-4 bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-primary-02 flex items-center justify-center shrink-0">
          <span className="text-xl">🍽️</span>
        </div>
        <p className="font-semibold text-text-primary">{state.storeName}</p>
      </div>

      {/* ── Pilih Kamar (hanya jika multi-kamar) ── */}
      {(user?.rooms?.length ?? 0) > 1 && (
        <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm p-4">
          <p className="font-semibold text-[13px] text-text-primary mb-3">Antar ke Kamar</p>
          <div className="flex gap-2 flex-wrap">
            {user!.rooms.map((room) => (
              <button
                key={room.reservationId}
                onClick={() => setSelectedRoomId(room.reservationId)}
                className={`px-4 py-2 rounded-xl text-[12px] font-medium border transition-colors ${
                  selectedRoomId === room.reservationId
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-text-secondary border-grey'
                }`}
              >
                {room.roomNumber ? `Kamar ${room.roomNumber}` : room.propertyName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Pilih Pengiriman ── */}
      {slots.length > 0 && (
        <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm p-4">
          <p className="font-semibold text-[13px] text-text-primary mb-3">Jadwal Pengiriman</p>

          {/* Tanggal — hanya tampil kalau lebih dari 1 hari */}
          {availableDates.length > 1 && (
            <div className="mb-3">
              <p className="text-[11px] text-text-secondary mb-2">Tanggal</p>
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                {availableDates.map((d) => (
                  <button
                    key={d}
                    onClick={() => { setSelectedDate(d); setSelectedSlot(''); }}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-[12px] font-medium border transition-colors ${
                      selectedDate === d
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-text-secondary border-grey'
                    }`}
                  >
                    {formatDateLabel(d, todayStr)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Slot waktu */}
          <div>
            <p className="text-[11px] text-text-secondary mb-2">Periode pengiriman</p>
            <div className="flex gap-2 flex-wrap">
              {slotsForDate.map((slot) => (
                <button
                  key={slot.deliveryTime}
                  disabled={slot.isPast}
                  onClick={() => setSelectedSlot(slot.deliveryTime)}
                  className={`px-4 py-2 rounded-xl text-[12px] font-medium border transition-colors ${
                    slot.isPast
                      ? 'bg-grey text-text-secondary border-grey line-through cursor-not-allowed opacity-50'
                      : selectedSlot === slot.deliveryTime
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-text-secondary border-grey'
                  }`}
                >
                  {slot.deliveryTime}
                  {slot.isPast && <span className="ml-1 text-[10px]">(lewat)</span>}
                </button>
              ))}
            </div>

            {/* Info bisa pesan lagi */}
            {allPastToday && firstSlotCutoff && (
              <div className="mt-3 flex items-start gap-2 bg-[#FFF8E1] border border-warning/40 rounded-xl px-3 py-2.5">
                <span className="text-base shrink-0">🕐</span>
                <p className="text-[11px] text-[#7A5C00] leading-relaxed">
                  Periode pengiriman hari ini sudah tutup.
                  {availableDates.length > 1
                    ? <> Pilih tanggal besok untuk memesan.</>
                    : <> Kamu bisa memesan lagi besok mulai pukul <span className="font-semibold">{firstSlotCutoff} WIB</span>.</>
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* List item */}
      <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-grey">
          <p className="font-semibold text-[13px] text-text-primary">Daftar Pesanan</p>
        </div>
        <div className="divide-y divide-grey">
          {items.map((item) => (
            <div key={item.menuItemId} className="flex items-center gap-3 px-4 py-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-grey shrink-0">
                {item.imageUrl && <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-text-primary truncate">{item.name}</p>
                <p className="text-[12px] text-primary font-semibold">{formatRupiah(item.price)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => dispatch({ type: 'SET_QTY', menuItemId: item.menuItemId, qty: item.qty - 1 })} className="w-7 h-7 rounded-full border-2 border-primary text-primary font-bold flex items-center justify-center text-[16px]">−</button>
                <span className="font-bold text-[14px] w-4 text-center">{item.qty}</span>
                <button onClick={() => dispatch({ type: 'SET_QTY', menuItemId: item.menuItemId, qty: item.qty + 1 })} className="w-7 h-7 rounded-full bg-primary text-white font-bold flex items-center justify-center text-[16px]">+</button>
              </div>
              <p className="text-[12px] font-semibold text-text-primary w-16 text-right shrink-0">
                {formatRupiah(item.price * item.qty)}
              </p>
            </div>
          ))}
        </div>
        <div className="px-4 py-2.5 border-t border-grey flex justify-between items-center">
          <span className="text-[12px] text-text-secondary">Subtotal</span>
          <span className="text-[13px] text-text-primary">{formatRupiah(totalAmount)}</span>
        </div>
        <div className="px-4 py-2.5 border-t border-grey flex justify-between items-center">
          <span className="text-[12px] text-text-secondary">Biaya Layanan</span>
          <span className="text-[13px] text-text-primary">{formatRupiah(SERVICE_FEE)}</span>
        </div>
        {discount > 0 && (
          <div className="px-4 py-2.5 border-t border-grey flex justify-between items-center">
            <span className="text-[12px] text-text-secondary">Diskon</span>
            <span className="text-[13px] text-green-600">−{formatRupiah(discount)}</span>
          </div>
        )}
        <div className="px-4 py-3 bg-grey/30 border-t border-grey flex justify-between items-center">
          <span className="text-[13px] font-semibold text-text-primary">Total</span>
          <span className="text-[16px] font-bold text-primary">{formatRupiah(grandTotal)}</span>
        </div>
      </div>

      {/* Voucher */}
      <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm p-4">
        <p className="text-[13px] font-semibold text-text-primary mb-2">Kode Voucher (opsional)</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={voucherCode}
            onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setVoucherMsg(null); setDiscount(0); }}
            placeholder="Masukkan kode voucher"
            className="flex-1 text-[13px] text-text-primary bg-background rounded-xl px-3 py-3 outline-none border border-grey focus:border-primary transition-colors"
          />
          <button
            onClick={() => {
              // Placeholder — validasi voucher akan diimplementasi dengan tabel voucher
              if (!voucherCode.trim()) return;
              setVoucherMsg({ text: 'Kode tidak valid atau sudah kadaluwarsa', ok: false });
              setDiscount(0);
            }}
            className="shrink-0 bg-primary text-white text-[13px] font-semibold px-4 rounded-xl active:opacity-80"
          >
            Terapkan
          </button>
        </div>
        {voucherMsg && (
          <p className={`text-[11px] mt-1.5 ${voucherMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
            {voucherMsg.text}
          </p>
        )}
      </div>

      {/* Catatan */}
      <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm p-4">
        <p className="text-[13px] font-semibold text-text-primary mb-2">Catatan (opsional)</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Contoh: tidak pakai bawang, extra saus, dll."
          rows={3}
          className="w-full text-[13px] text-text-primary bg-background rounded-xl p-3 resize-none outline-none placeholder:text-text-secondary border border-grey focus:border-primary transition-colors"
        />
      </div>

      {/* Tata Cara */}
      <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
        <button
          onClick={() => setTataCaraOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-4 active:bg-grey/30 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-[18px]">📋</span>
            <p className="text-[14px] font-semibold text-text-primary">Tata Cara Pemesanan</p>
          </div>
          <div className={`w-7 h-7 rounded-full bg-grey/50 flex items-center justify-center transition-transform duration-200 ${tataCaraOpen ? 'rotate-180' : ''}`}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary" />
            </svg>
          </div>
        </button>

        {tataCaraOpen && (
          <div className="px-4 pb-4">
            <div className="space-y-3 mb-4">
              {[
                'Pastikan daftar pesanan dan jadwal pengiriman sudah benar',
                'Tekan "Buat Pesanan & Bayar" di bawah',
                'Lakukan transfer ke nomor Virtual Account BCA yang ditampilkan untuk menyelesaikan pembayaran',
                'Pembayaran akan terdeteksi otomatis setelah transfer berhasil',
                'Staff akan memproses dan mengirim pesananmu sesuai periode pengiriman yang dipilih',
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-[13px] font-medium text-text-primary leading-relaxed">{text}</p>
                </div>
              ))}
            </div>

            {/* Info periode */}
            <div className="bg-background rounded-xl p-3 border border-grey">
              <p className="text-[13px] font-semibold text-text-primary mb-1.5">Tentang Periode Pengiriman</p>
              <p className="text-[12px] text-text-primary leading-relaxed">
                Setiap hari ada beberapa sesi pengiriman dengan batas waktu pemesanan masing-masing. Jika semua sesi hari ini sudah lewat, kamu tetap bisa pesan untuk esok selama masih dalam periode menginap.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <div className="w-full max-w-[430px] bg-white border-t border-grey p-4 pt-3 pointer-events-auto">
          {selectedSlot && (
            <p className="text-[11px] text-text-secondary text-center mb-2">
              Kirim {selectedDate === todayStr ? 'hari ini' : formatDateLabel(selectedDate, todayStr)} pukul <span className="font-semibold text-primary">{selectedSlot}</span>
            </p>
          )}
          <div className="flex justify-between items-center mb-3">
            <span className="text-[12px] text-text-secondary">Total Pembayaran</span>
            <span className="text-[16px] font-bold text-primary">{formatRupiah(grandTotal)}</span>
          </div>
          <button
            onClick={handleBuatPesanan}
            disabled={saving || !selectedSlot}
            className="w-full bg-primary text-white font-bold text-[14px] py-4 rounded-2xl flex items-center justify-center gap-2 active:opacity-80 disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : 'Buat Pesanan & Bayar'}
          </button>
        </div>
      </div>
    </div>
  );
}
