'use client';
import { useState, useEffect } from 'react';
import { useDevTime } from '@/hooks/useDevTime';

export default function DevTimePanel() {
  const { devTime, setDevTime, isActive } = useDevTime();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('12:00');
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const apply = () => {
    setDevTime(input);
    setOpen(false);
  };

  const reset = () => {
    setDevTime(null);
    setOpen(false);
  };

  const openPanel = () => {
    setInput(devTime ?? '12:00');
    setOpen(true);
  };

  if (!mounted) return null;

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={openPanel}
        className={`fixed bottom-24 right-4 z-[200] h-10 rounded-full shadow-lg flex items-center justify-center font-bold border-2 transition-all ${
          isActive
            ? 'bg-warning text-white border-warning px-3 text-[11px] gap-1'
            : 'bg-white text-text-secondary border-grey w-10 text-[15px]'
        }`}
        title="Dev Time Override"
      >
        {isActive ? (
          <>⏱ {devTime}</>
        ) : '⏱'}
      </button>

      {open && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative w-full max-w-[430px] bg-white rounded-t-3xl px-6 pt-5 pb-10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-grey mx-auto mb-5" />
            <p className="font-bold text-[15px] text-text-primary mb-1">Simulasi Jam (Dev)</p>
            <p className="text-[12px] text-text-secondary mb-4">
              Set jam WIB untuk testing cutoff periode. Berlaku di semua halaman sampai di-reset.
            </p>

            {isActive && (
              <div className="mb-4 bg-[#FFF8E1] border border-warning/40 rounded-xl px-3 py-2 text-[12px] text-[#7A5C00] flex items-center gap-2">
                <span>⏱</span>
                <span>Aktif: simulasi jam <strong>{devTime} WIB</strong></span>
              </div>
            )}

            <label className="text-[12px] font-semibold text-text-primary block mb-1.5">Set Jam WIB</label>
            <input
              type="time"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full bg-white border border-grey rounded-xl px-4 py-3 text-[15px] text-text-primary outline-none focus:border-primary transition-colors mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={apply}
                className="flex-1 bg-primary text-white font-bold text-[14px] py-3.5 rounded-2xl active:opacity-80"
              >
                Terapkan
              </button>
              {isActive && (
                <button
                  onClick={reset}
                  className="flex-1 bg-background text-text-secondary font-medium text-[14px] py-3.5 rounded-2xl border border-grey active:bg-grey"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
