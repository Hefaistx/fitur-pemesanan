'use client';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { KAT_META } from '../PengaduanClient';
import type { Complaint } from '@/lib/schema';

const STATUS_STEPS = [
  { key: 'baru',    label: 'Diterima',   icon: '📨', desc: 'Pengaduan berhasil dikirim dan sedang menunggu tindak lanjut.' },
  { key: 'proses',  label: 'Diproses',   icon: '🔄', desc: 'Tim kami sedang menangani pengaduanmu.' },
  { key: 'selesai', label: 'Selesai',    icon: '✅', desc: 'Pengaduan telah ditangani.' },
] as const;

const STATUS_META: Record<string, { label: string; cls: string }> = {
  baru:    { label: 'Baru',    cls: 'bg-blue-100 text-blue-700' },
  proses:  { label: 'Proses',  cls: 'bg-yellow-100 text-yellow-700' },
  selesai: { label: 'Selesai', cls: 'bg-green-100 text-green-700' },
  ditolak: { label: 'Ditolak', cls: 'bg-red-100 text-red-700' },
};

function activeStepIdx(status: string) {
  if (status === 'ditolak') return -1;
  return STATUS_STEPS.findIndex(s => s.key === status);
}

function fmtDateTime(d: string | Date) {
  return new Date(d).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function ComplaintCode(id: number) {
  return `#ADU-${String(id).padStart(4, '0')}`;
}

interface Props {
  complaint: Complaint;
  isNew: boolean;
}

export default function PengaduanDetailClient({ complaint, isNew }: Props) {
  const router = useRouter();
  const meta = KAT_META[complaint.jenis] ?? { icon: '📝', color: 'bg-gray-50' };
  const statusMeta = STATUS_META[complaint.status] ?? { label: complaint.status, cls: 'bg-gray-100 text-gray-600' };
  const activeIdx = activeStepIdx(complaint.status);
  const isDitolak = complaint.status === 'ditolak';

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header title="Detail Pengaduan" showBack />

      {/* ── Sukses banner (hanya saat baru submit) ── */}
      {isNew && (
        <div className="mx-4 mt-4 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="text-[13px] font-bold text-green-800">Pengaduan Terkirim!</p>
            <p className="text-[12px] text-green-700 mt-0.5 leading-relaxed">
              Pengaduanmu sudah kami terima. Tim terkait akan segera menindaklanjuti.
            </p>
          </div>
        </div>
      )}

      {/* ── Header card ── */}
      <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${meta.color} flex items-center justify-center text-2xl shrink-0`}>
              {meta.icon}
            </div>
            <div>
              <p className="text-[14px] font-bold text-text-primary">{complaint.jenis}</p>
              <p className="text-[11px] text-text-secondary mt-0.5">{ComplaintCode(complaint.id)}</p>
            </div>
          </div>
          <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold ${statusMeta.cls}`}>
            {statusMeta.label}
          </span>
        </div>
        <div className="mt-3 pt-3 border-t border-background space-y-1.5">
          <Row label="Properti" value={complaint.propertyName} />
          <Row label="Kamar" value={complaint.roomNumber ?? '-'} />
          <Row label="Dilaporkan" value={fmtDateTime(complaint.createdAt)} />
          <Row label="Diperbarui" value={fmtDateTime(complaint.updatedAt)} />
        </div>
      </div>

      {/* ── Timeline ── */}
      {!isDitolak ? (
        <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm p-4">
          <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wide mb-4">Progress</p>
          <div className="flex flex-col gap-0">
            {STATUS_STEPS.map((step, i) => {
              const done = i <= activeIdx;
              const isActive = i === activeIdx;
              return (
                <div key={step.key} className="flex gap-3">
                  {/* Line + dot */}
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 ${done ? 'bg-primary' : 'bg-gray-100'}`}>
                      {done ? <span>{step.icon}</span> : <span className="w-2 h-2 rounded-full bg-gray-300 block" />}
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`w-0.5 flex-1 min-h-[24px] ${done ? 'bg-primary/40' : 'bg-gray-100'}`} />
                    )}
                  </div>
                  {/* Text */}
                  <div className="pb-5 min-w-0">
                    <p className={`text-[12px] font-semibold ${done ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {step.label}
                      {isActive && <span className="ml-2 text-[10px] text-primary font-normal">● Saat ini</span>}
                    </p>
                    <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mx-4 mt-3 bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-[13px] font-bold text-red-700 mb-1">Pengaduan Ditolak</p>
          <p className="text-[12px] text-red-600 leading-relaxed">
            Pengaduanmu tidak dapat diproses. Untuk informasi lebih lanjut, hubungi tim FO kami.
          </p>
        </div>
      )}

      {/* ── Kronologi ── */}
      <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm p-4">
        <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wide mb-2">Kronologi</p>
        <p className="text-[13px] text-text-primary leading-relaxed">{complaint.kronologi}</p>
      </div>

      {/* ── Actions ── */}
      <div className="mx-4 mt-4">
        <button
          onClick={() => router.push('/pengaduan')}
          className="w-full py-3 rounded-2xl border border-gray-200 text-[13px] text-text-secondary font-medium active:opacity-80"
        >
          Kembali ke Riwayat
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <p className="text-[12px] text-text-secondary shrink-0">{label}</p>
      <p className="text-[12px] font-medium text-text-primary text-right">{value}</p>
    </div>
  );
}
