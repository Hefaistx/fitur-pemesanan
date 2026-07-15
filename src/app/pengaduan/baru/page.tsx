import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { complaints, reservations } from '@/lib/schema';
import { eq, and, gte } from 'drizzle-orm';
import PengaduanBaruClient from './PengaduanBaruClient';

export const dynamic = 'force-dynamic';

const WINDOW_MS = 48 * 60 * 60 * 1000;

export default async function PengaduanBaruPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  const userId = Number(session.user.id);
  const cutoff = new Date(Date.now() - WINDOW_MS);

  const eligibleReservations = await db
    .select()
    .from(reservations)
    .where(and(eq(reservations.userId, userId), gte(reservations.checkOut, cutoff)));

  if (eligibleReservations.length === 0) redirect('/pengaduan');

  // Ambil kategori yang sudah dipakai per reservasi
  const existingComplaints = await db
    .select({ reservationId: complaints.reservationId, jenis: complaints.jenis })
    .from(complaints)
    .where(eq(complaints.userId, userId));

  // Map: reservationId → Set<jenis>
  const usedMap: Record<number, string[]> = {};
  for (const c of existingComplaints) {
    if (!usedMap[c.reservationId]) usedMap[c.reservationId] = [];
    usedMap[c.reservationId].push(c.jenis);
  }

  return (
    <PengaduanBaruClient
      reservations={eligibleReservations}
      usedMap={usedMap}
    />
  );
}
