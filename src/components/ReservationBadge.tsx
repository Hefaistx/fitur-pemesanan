interface ReservationBadgeProps {
  propertyName: string;
  roomNumber?: string | null;
}

export default function ReservationBadge({ propertyName, roomNumber }: ReservationBadgeProps) {
  return (
    <div className="mx-4 mb-3 bg-primary-01 border border-primary-02 rounded-xl px-3 py-2 flex items-center gap-2">
      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-text-secondary leading-tight">Menginap di</p>
        <p className="text-[12px] font-semibold text-text-primary truncate">
          {propertyName}{roomNumber ? ` · Kamar ${roomNumber}` : ''}
        </p>
      </div>
      <span className="text-[10px] font-medium text-primary bg-primary-02 px-2 py-0.5 rounded-full shrink-0">
        Aktif
      </span>
    </div>
  );
}
