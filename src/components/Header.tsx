'use client';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  transparent?: boolean;
}

export default function Header({ title, showBack = false, rightElement, transparent = false }: HeaderProps) {
  const router = useRouter();

  return (
    <header
      className={`flex items-center justify-between px-4 h-14 sticky top-0 z-40 ${
        transparent ? 'bg-transparent' : 'bg-[#2E353D]'
      }`}
    >
      <div className="flex items-center gap-3 flex-1">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center text-white rounded-full active:bg-white/10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
        )}
        {title && (
          <span className="text-white font-semibold text-[15px] leading-tight">{title}</span>
        )}
      </div>
      {rightElement && <div>{rightElement}</div>}
    </header>
  );
}
