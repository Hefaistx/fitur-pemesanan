import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [order] = await db.select().from(orders).where(eq(orders.id, Number(params.id))).limit(1);
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (order.userId !== Number(session.user.id))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (order.deliveryStatus !== 'delivered')
    return NextResponse.json({ error: 'Pesanan belum terkirim' }, { status: 400 });
  if (order.runnerRating)
    return NextResponse.json({ error: 'Sudah dirating' }, { status: 400 });

  const { rating, review } = await req.json();
  if (!rating || rating < 1 || rating > 5)
    return NextResponse.json({ error: 'Rating tidak valid' }, { status: 400 });

  const [updated] = await db
    .update(orders)
    .set({ runnerRating: Number(rating), runnerReview: review ?? null })
    .where(eq(orders.id, order.id))
    .returning();

  return NextResponse.json({ success: true, runnerRating: updated.runnerRating, runnerReview: updated.runnerReview });
}
