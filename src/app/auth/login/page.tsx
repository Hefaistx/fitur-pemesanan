'use client';
import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await signIn('credentials', {
      phone,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError('Nomor HP atau password salah.');
    } else {
      router.push(callbackUrl);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header dekoratif */}
      <div className="bg-[#2E353D] pt-16 pb-10 px-6 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/5" />
        <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-primary/20" />
        <button onClick={() => router.back()} className="text-white/60 text-[12px] mb-6 flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Kembali
        </button>
        <h1 className="text-white font-bold text-[24px]">Masuk</h1>
        <p className="text-white/60 text-[13px] mt-1">ke akun DParagon kamu</p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 pt-8">
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Phone */}
          <div>
            <label className="text-[12px] font-semibold text-text-primary block mb-1.5">
              Nomor HP
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="6281234567890"
              required
              className="w-full bg-white border border-grey rounded-xl px-4 py-3 text-[14px] text-text-primary outline-none focus:border-primary transition-colors placeholder:text-text-secondary"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-[12px] font-semibold text-text-primary block mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-white border border-grey rounded-xl px-4 py-3 text-[14px] text-text-primary outline-none focus:border-primary transition-colors placeholder:text-text-secondary"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3">
              <p className="text-[12px] text-danger font-medium">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-bold text-[15px] py-4 rounded-2xl mt-2 active:opacity-80 disabled:opacity-60 transition-opacity"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        {/* Demo accounts info */}
        <div className="mt-8 bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[12px] font-semibold text-text-primary mb-3">🧪 Akun Demo</p>
          <div className="space-y-3">
            <DemoAccount
              label="Budi Santoso"
              phone="6281234567890"
              badge="✅ Jogja · 5 malam"
              badgeColor="bg-success/10 text-success"
              onFill={() => { setPhone('6281234567890'); setPassword('password123'); }}
            />
            <DemoAccount
              label="Rini Kusuma"
              phone="6287777777777"
              badge="✅ Jogja · 1 malam"
              badgeColor="bg-success/10 text-success"
              onFill={() => { setPhone('6287777777777'); setPassword('password123'); }}
            />
            <DemoAccount
              label="Dodi Pratama"
              phone="6281111111111"
              badge="✅ Jogja · 2 kamar"
              badgeColor="bg-success/10 text-success"
              onFill={() => { setPhone('6281111111111'); setPassword('password123'); }}
            />
            <DemoAccount
              label="Milla Putri"
              phone="6282222222222"
              badge="✅ Jogja + Malang"
              badgeColor="bg-success/10 text-success"
              onFill={() => { setPhone('6282222222222'); setPassword('password123'); }}
            />
            <DemoAccount
              label="Andi Wijaya"
              phone="6285555555555"
              badge="⚠️ Reservasi Semarang"
              badgeColor="bg-warning/10 text-yellow-700"
              onFill={() => { setPhone('6285555555555'); setPassword('password123'); }}
            />
            <DemoAccount
              label="Sari Dewi"
              phone="6289876543210"
              badge="🚫 Tanpa Reservasi"
              badgeColor="bg-grey text-text-secondary"
              onFill={() => { setPhone('6289876543210'); setPassword('password123'); }}
            />
          </div>
          <p className="text-[10px] text-text-secondary mt-3 text-center">Password: <span className="font-mono">password123</span></p>
        </div>
      </div>
    </div>
  );
}

function DemoAccount({
  label,
  phone,
  badge,
  badgeColor,
  onFill,
}: {
  label: string;
  phone: string;
  badge: string;
  badgeColor: string;
  onFill: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onFill}
      className="w-full flex items-center justify-between bg-background rounded-xl px-3 py-2.5 text-left active:bg-grey transition-colors"
    >
      <div>
        <p className="text-[12px] font-semibold text-text-primary">{label}</p>
        <p className="text-[11px] text-text-secondary font-mono">{phone}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>{badge}</span>
        <span className="text-primary text-[11px] font-semibold">Isi →</span>
      </div>
    </button>
  );
}
