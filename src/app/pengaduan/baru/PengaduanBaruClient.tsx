'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

const KATEGORI = [
  'Kebersihan',
  'Kerusakan Fasilitas',
  'Kerusakan Gedung',
  'Pelayanan',
  'Keamanan & Kenyamanan',
  'Token Listrik',
  'Harga',
  'Administrasi',
  'Breakfast',
  'Lainnya',
];

type Reservation = {
  id: number;
  propertyName: string;
  roomNumber: string | null;
  checkIn: string | Date;
  checkOut: string | Date;
};

interface Props {
  reservations: Reservation[];
  usedMap: Record<number, string[]>;
}

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PengaduanBaruClient({ reservations, usedMap }: Props) {
  const router = useRouter();

  const [resId, setResId] = useState<string>(reservations.length === 1 ? String(reservations[0].id) : '');
  const [jenis, setJenis] = useState('');
  const [kronologi, setKronologi] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usedKat = resId ? (usedMap[Number(resId)] ?? []) : [];
  const isDuplicat = jenis && usedKat.includes(jenis);
  const canSubmit = resId && jenis && !isDuplicat && kronologi.trim().length >= 10 && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pengaduan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId: Number(resId), jenis, kronologi }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Gagal mengirim pengaduan'); return; }
      router.push(`/pengaduan/${data.id}?baru=1`);
    } catch {
      setError('Terjadi kesalahan jaringan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <Header title="Ajukan Pengaduan" showBack />

      <form onSubmit={handleSubmit} className="px-4 mt-5 flex flex-col gap-4">

        {/* ── Properti ── */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <label className="block text-[12px] font-bold text-text-secondary uppercase tracking-wide mb-2">
            Properti <span className="text-red-400">*</span>
          </label>
          <select
            value={resId}
            onChange={e => { setResId(e.target.value); setJenis(''); }}
            className="w-full text-[13px] text-text-primary bg-background rounded-xl px-3 py-2.5 border-0 focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
          >
            <option value="">Pilih properti...</option>
            {reservations.map(r => (
              <option key={r.id} value={r.id}>
                {r.propertyName} — Kamar {r.roomNumber} (CI: {fmtDate(r.checkIn)})
              </option>
            ))}
          </select>
        </div>

        {/* ── Jenis ── */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <label className="block text-[12px] font-bold text-text-secondary uppercase tracking-wide mb-2">
            Jenis Pengaduan <span className="text-red-400">*</span>
          </label>
          <select
            value={jenis}
            onChange={e => setJenis(e.target.value)}
            disabled={!resId}
            className="w-full text-[13px] text-text-primary bg-background rounded-xl px-3 py-2.5 border-0 focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none disabled:opacity-50"
          >
            <option value="">Pilih jenis...</option>
            {KATEGORI.map(k => {
              const used = usedKat.includes(k);
              return (
                <option key={k} value={k} disabled={used}>
                  {k}{used ? ' (sudah dilaporkan)' : ''}
                </option>
              );
            })}
          </select>
          {isDuplicat && (
            <p className="mt-2 text-[11px] text-red-500">
              Kategori ini sudah pernah dilaporkan untuk stay ini.
            </p>
          )}
        </div>

        {/* ── Kronologi ── */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <label className="block text-[12px] font-bold text-text-secondary uppercase tracking-wide mb-2">
            Kronologi <span className="text-red-400">*</span>
          </label>
          <textarea
            value={kronologi}
            onChange={e => setKronologi(e.target.value)}
            maxLength={500}
            rows={6}
            placeholder="Ceritakan detail masalah yang kamu alami..."
            className="w-full text-[13px] text-text-primary bg-background rounded-xl px-3 py-2.5 border-0 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-text-secondary/50"
          />
          <div className="flex justify-between mt-1.5">
            {kronologi.trim().length > 0 && kronologi.trim().length < 10 && (
              <p className="text-[11px] text-red-400">Minimal 10 karakter</p>
            )}
            <p className="text-[11px] text-text-secondary ml-auto">{kronologi.length}/500</p>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[12px] text-red-600">
            {error}
          </div>
        )}

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-3.5 rounded-2xl bg-primary text-white text-[14px] font-bold disabled:opacity-40 active:opacity-80 transition-opacity shadow-lg shadow-primary/20"
        >
          {loading ? 'Mengirim...' : 'Kirim Pengaduan'}
        </button>

      </form>
    </div>
  );
}
