export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, orderItems, stores } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

function generateVA(orderId: number): string {
  // Format BCA VA: 8808 + 12 digit (4 digit order id padded + 8 digit random)
  const orderPart = String(orderId).padStart(4, '0');
  const randomPart = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
  return `8808${orderPart}${randomPart}`;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const userOrders = await db
      .select({
        id: orders.id,
        totalAmount: orders.totalAmount,
        paymentStatus: orders.paymentStatus,
        deliveryStatus: orders.deliveryStatus,
        deliveryDate: orders.deliveryDate,
        deliveryTime: orders.deliveryTime,
        notes: orders.notes,
        createdAt: orders.createdAt,
        storeName: stores.name,
        storeSlug: stores.slug,
      })
      .from(orders)
      .innerJoin(stores, eq(orders.storeId, stores.id))
      .where(eq(orders.userId, Number(session.user.id)))
      .orderBy(desc(orders.createdAt));

    // Ambil items per order
    const orderIds = userOrders.map(o => o.id);
    const allItems = orderIds.length
      ? await db.select().from(orderItems).where(
          orderIds.length === 1
            ? eq(orderItems.orderId, orderIds[0])
            : require('drizzle-orm').inArray(orderItems.orderId, orderIds)
        )
      : [];

    const result = userOrders
      .filter(o => o.paymentStatus === 'paid')
      .map(o => ({
        ...o,
        items: allItems.filter(i => i.orderId === o.id),
      }));

    return NextResponse.json(result);
  } catch (err) {
    console.error('[GET /api/orders]', err);
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { storeId, reservationId, totalAmount, notes, items, deliveryDate, deliveryTime } = await req.json();
  if (!storeId || !totalAmount || !items?.length) {
    return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
  }

  try {
    // Buat order dulu untuk dapat ID
    const [order] = await db
      .insert(orders)
      .values({
        userId: Number(session.user.id),
        storeId: Number(storeId),
        reservationId: reservationId ? Number(reservationId) : null,
        totalAmount: Number(totalAmount),
        notes: notes ?? null,
        paymentStatus: 'pending',
        deliveryDate: deliveryDate ?? null,
        deliveryTime: deliveryTime ?? null,
      })
      .returning();

    // Generate VA pakai order ID
    const vaNumber = generateVA(order.id);
    const paymentDeadline = new Date(Date.now() + 60 * 60 * 1000); // 1 jam dari sekarang

    await db.update(orders)
      .set({ vaNumber, paymentDeadline })
      .where(require('drizzle-orm').eq(orders.id, order.id));

    await db.insert(orderItems).values(
      items.map((item: { menuItemId: number; quantity: number; priceAtOrder: number; itemName: string }) => ({
        orderId: order.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        priceAtOrder: item.priceAtOrder,
        itemName: item.itemName,
      }))
    );

    return NextResponse.json({ success: true, orderId: order.id, vaNumber, paymentDeadline });
  } catch (err) {
    console.error('[POST /api/orders]', err);
    return NextResponse.json({ error: 'Gagal menyimpan pesanan' }, { status: 500 });
  }
}
