import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, orderItems, stores, reservations } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [row] = await db
    .select({
      order: orders,
      storeName: stores.name,
      storeSlug: stores.slug,
      propertyName: reservations.propertyName,
      roomNumber: reservations.roomNumber,
    })
    .from(orders)
    .innerJoin(stores, eq(orders.storeId, stores.id))
    .leftJoin(reservations, eq(orders.reservationId, reservations.id))
    .where(eq(orders.id, Number(params.id)))
    .limit(1);

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (row.order.userId !== Number(session.user.id))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, row.order.id));

  return NextResponse.json({
    ...row.order,
    storeName: row.storeName,
    storeSlug: row.storeSlug,
    propertyName: row.propertyName,
    roomNumber: row.roomNumber,
    items,
  });
}

// Simulasi konfirmasi bayar
export async function PATCH(_: NextRequest, { params }: { params: { id: string } }) {
  const [order] = await db
    .update(orders)
    .set({ paymentStatus: 'paid' })
    .where(eq(orders.id, Number(params.id)))
    .returning();
  return NextResponse.json({ success: true, order });
}
