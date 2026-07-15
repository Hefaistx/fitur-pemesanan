import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { complaints, reservations } from '@/lib/schema';
import { eq, desc, gte, and } from 'drizzle-orm';
import PengaduanClient from './PengaduanClient';

export const dynamic = 'force-dynamic';

const WINDOW_MS = 48 * 60 * 60 * 1000;

export default async function PengaduanPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  const userId = Number(session.user.id);
  const cutoff = new Date(Date.now() - WINDOW_MS);

  const [eligibleReservations, userComplaints] = await Promise.all([
    db
      .select()
      .from(reservations)
      .where(and(eq(reservations.userId, userId), gte(reservations.checkOut, cutoff)))
      .orderBy(desc(reservations.checkOut)),
    db
      .select()
      .from(complaints)
      .where(eq(complaints.userId, userId))
      .orderBy(desc(complaints.createdAt)),
  ]);

  return (
    <PengaduanClient
      eligibleReservations={eligibleReservations}
      complaints={userComplaints}
    />
  );
}
