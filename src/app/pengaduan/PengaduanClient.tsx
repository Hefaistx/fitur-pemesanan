'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Complaint } from '@/lib/schema';

type Reservation = {
  id: number;
  propertyName: string;
  roomNumber: string | null;
  checkIn: string | Date;
  checkOut: string | Date;
};

interface Props {
  eligibleReservations: Reservation[];
  complaints: Complaint[];
}

export const KAT_META: Record<string, { icon: string }> = {
  'Kebersihan':              { icon: '🧹' },
  'Kerusakan Fasilitas':     { icon: '🔧' },
  'Kerusakan Gedung':        { icon: '🏢' },
  'Pelayanan':               { icon: '👤' },
  'Keamanan & Kenyamanan':   { icon: '🛡️' },
  'Token Listrik':           { icon: '⚡' },
  'Harga':                   { icon: '🏷️' },
  'Administrasi':            { icon: '📄' },
  'Breakfast':               { icon: '☕' },
  'Lainnya':                 { icon: '📝' },
};

const STATUS_MAP: Record<string, { label: string; cls: string; dot: string }> = {
  baru:    { label: 'Baru',    cls: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500' },
  proses:  { label: 'Proses',  cls: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  selesai: { label: 'Selesai', cls: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  ditolak: { label: 'Ditolak', cls: 'bg-red-100 text-red-700',      dot: 'bg-red-500' },
};

const FILTERS = ['Semua', 'Baru', 'Proses', 'Selesai', 'Ditolak'];

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ComplaintCode(id: number) {
  return `#ADU-${String(id).padStart(4, '0')}`;
}

export default function PengaduanClient({ eligibleReservations, complaints }: Props) {
  const router = useRouter();
  const canSubmit = eligibleReservations.length > 0;
  const [filter, setFilter] = useState('Semua');

  const filtered = filter === 'Semua'
    ? complaints
    : complaints.filter(c => c.status === filter.toLowerCase());

  return (
    <div className="min-h-screen bg-background pb-28">

      {/* ── Header ── */}
      <div className="bg-[#2E353D] px-4 relative">
        <div className="h-14 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center text-white rounded-full active:bg-white/10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <span className="text-white font-semibold text-[15px]">Bantuan & Pengaduan</span>
        </div>
        <p className="text-white/60 text-[12px] pb-1">D'Paragon siap membantu</p>
        <p className="text-white text-[20px] font-bold leading-snug pb-5">
          Ada yang bisa<br />kami bantu?
        </p>
      </div>

      {/* ── Accordion: Cara & Ketentuan ── */}
      <Accordion />

      {/* ── Tidak eligible info ── */}
      {!canSubmit && (
        <div className="mx-4 mt-4 bg-white rounded-2xl p-4 flex items-start gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl shrink-0">📅</div>
          <div>
            <p className="text-[13px] font-semibold text-text-primary">Tidak Ada Stay Aktif</p>
            <p className="text-[12px] text-text-secondary mt-0.5 leading-relaxed">
              Pengaduan hanya bisa diajukan saat menginap atau maks. 2×24 jam setelah check-out.
            </p>
          </div>
        </div>
      )}

      {/* ── Riwayat section ── */}
      {complaints.length > 0 && (
        <div className="mt-5">
          <p className="px-4 text-[13px] font-bold text-text-primary mb-3">Riwayat Pengaduan</p>

          {/* Filter pills */}
          <div className="flex gap-2 px-4 overflow-x-auto scrollbar-none mb-3">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${
                  filter === f
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-text-secondary border-gray-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {filtered.length > 0 ? (
            <div className="flex flex-col gap-2 px-4">
              {filtered.map(c => (
                <ComplaintCard key={c.id} c={c} onClick={() => router.push(`/pengaduan/${c.id}`)} />
              ))}
            </div>
          ) : (
            <p className="text-center text-[12px] text-text-secondary py-6">
              Tidak ada pengaduan dengan status ini.
            </p>
          )}
        </div>
      )}

      {/* ── Empty state (belum pernah pengaduan sama sekali) ── */}
      {complaints.length === 0 && (
        <div className="mx-4 mt-5 bg-white rounded-2xl p-8 text-center shadow-sm">
          <p className="text-4xl mb-3">🗒️</p>
          <p className="text-[13px] font-semibold text-text-primary">Belum Ada Pengaduan</p>
          <p className="text-[12px] text-text-secondary mt-1 leading-relaxed">
            Semua pengaduanmu akan tercatat dan bisa dipantau di sini.
          </p>
        </div>
      )}

      {/* ── Sticky bottom CTA ── */}
      {canSubmit && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pb-6 pt-3 bg-background/90 backdrop-blur-sm">
          <button
            onClick={() => router.push('/pengaduan/baru')}
            className="w-full py-3.5 rounded-2xl bg-primary text-white text-[14px] font-bold shadow-lg shadow-primary/25 active:opacity-80 transition-opacity"
          >
            + Laporkan Masalah
          </button>
        </div>
      )}
    </div>
  );
}

function Accordion() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">ℹ️</span>
          <span className="text-[13px] font-semibold text-text-primary">Cara & Ketentuan Pengaduan</span>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`text-text-secondary transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-background">
          <InfoRow
            icon="🕐"
            title="Kapan bisa melapor?"
            desc="Selama kamu menginap, atau maksimal 2×24 jam setelah check-out. Lewat dari itu, form pengaduan akan otomatis ditutup."
          />
          <InfoRow
            icon="📋"
            title="Batasan pengaduan"
            desc="Setiap kategori hanya bisa dilaporkan 1 kali per reservasi. Misal, kamu sudah lapor 'Kebersihan' untuk stay ini, maka kategori tersebut tidak bisa dipilih lagi."
          />
          <InfoRow
            icon="🔄"
            title="Alur penanganan"
            desc="Pengaduanmu akan langsung diterima dan diproses oleh tim D'Paragon. Pantau statusnya di halaman ini."
          />
          <InfoRow
            icon="✅"
            title="Status pengaduan"
            desc="Baru → Proses → Selesai. Jika pengaduan tidak dapat diproses, statusnya akan berubah menjadi Ditolak."
          />
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex gap-3 pt-3">
      <span className="text-base shrink-0 mt-0.5">{icon}</span>
      <div>
        <p className="text-[12px] font-semibold text-text-primary">{title}</p>
        <p className="text-[12px] text-text-secondary mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function ComplaintCard({ c, onClick }: { c: Complaint; onClick: () => void }) {
  const s = STATUS_MAP[c.status] ?? { label: c.status, cls: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
  const icon = KAT_META[c.jenis]?.icon ?? '📝';

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl shadow-sm p-4 text-left active:opacity-80 transition-opacity"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-xl shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-semibold text-text-primary truncate">{c.jenis}</p>
            <span className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${s.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
          </div>
          <p className="text-[10px] text-text-secondary mt-0.5">{ComplaintCode(c.id)}</p>
          <p className="mt-1.5 text-[12px] text-text-secondary line-clamp-2 leading-relaxed">{c.kronologi}</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[11px] text-text-secondary truncate">{c.propertyName} · Kamar {c.roomNumber}</p>
            <p className="text-[10px] text-text-secondary shrink-0 ml-2">
              {new Date(c.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}
