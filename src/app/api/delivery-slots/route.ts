export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, deliverySlots } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get('storeId');
  if (!storeId) return NextResponse.json([]);

  const [store] = await db
    .select({ deliveryGroupId: stores.deliveryGroupId })
    .from(stores)
    .where(eq(stores.id, Number(storeId)))
    .limit(1);

  if (!store?.deliveryGroupId) return NextResponse.json([]);

  const slots = await db
    .select({ cutoffTime: deliverySlots.cutoffTime, deliveryTime: deliverySlots.deliveryTime })
    .from(deliverySlots)
    .where(and(eq(deliverySlots.groupId, store.deliveryGroupId), eq(deliverySlots.isActive, true)))
    .orderBy(deliverySlots.sortOrder);

  return NextResponse.json(slots);
}
