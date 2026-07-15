export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { complaints, reservations } from '@/lib/schema';
import { eq, desc, and, gte } from 'drizzle-orm';

const WINDOW_MS = 48 * 60 * 60 * 1000; // 48 jam

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db
    .select()
    .from(complaints)
    .where(eq(complaints.userId, Number(session.user.id)))
    .orderBy(desc(complaints.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { reservationId, jenis, kronologi } = await req.json();

  if (!reservationId || !jenis || !kronologi?.trim()) {
    return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
  }
  if (kronologi.trim().length < 10) {
    return NextResponse.json({ error: 'Kronologi terlalu singkat (min. 10 karakter)' }, { status: 400 });
  }

  // Validasi reservasi milik user dan masih dalam window
  const cutoff = new Date(Date.now() - WINDOW_MS);
  const [reservation] = await db
    .select()
    .from(reservations)
    .where(
      and(
        eq(reservations.id, Number(reservationId)),
        eq(reservations.userId, Number(session.user.id)),
        gte(reservations.checkOut, cutoff)
      )
    )
    .limit(1);

  if (!reservation) {
    return NextResponse.json({ error: 'Reservasi tidak ditemukan atau sudah melewati batas waktu pengaduan' }, { status: 403 });
  }

  // Cek duplikat per (reservationId, jenis)
  const [existing] = await db
    .select({ id: complaints.id })
    .from(complaints)
    .where(
      and(
        eq(complaints.reservationId, Number(reservationId)),
        eq(complaints.jenis, jenis)
      )
    )
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: `Pengaduan kategori "${jenis}" sudah pernah diajukan untuk stay ini` }, { status: 409 });
  }

  const [created] = await db
    .insert(complaints)
    .values({
      userId: Number(session.user.id),
      reservationId: Number(reservationId),
      jenis,
      kronologi: kronologi.trim(),
      status: 'baru',
      propertyName: reservation.propertyName,
      roomNumber: reservation.roomNumber,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
