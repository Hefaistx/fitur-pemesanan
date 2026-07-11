import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { deliveryPeriodGroups, deliverySlots, stores } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// GET — semua groups + slots + stores yang pakai
export async function GET() {
  const groups = await db.select().from(deliveryPeriodGroups).orderBy(deliveryPeriodGroups.id);
  const slots  = await db.select().from(deliverySlots).orderBy(deliverySlots.sortOrder);
  const storeList = await db.select({
    id: stores.id,
    name: stores.name,
    slug: stores.slug,
    deliveryGroupId: stores.deliveryGroupId,
  }).from(stores);

  return NextResponse.json({ groups, slots, stores: storeList });
}

// POST — tambah slot baru ke group
export async function POST(req: NextRequest) {
  const { groupId, cutoffTime, deliveryTime } = await req.json();
  if (!groupId || !cutoffTime || !deliveryTime) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const existing = await db.select({ sortOrder: deliverySlots.sortOrder })
    .from(deliverySlots).where(eq(deliverySlots.groupId, groupId));
  const maxOrder = existing.reduce((m, r) => Math.max(m, r.sortOrder ?? 0), 0);

  const [slot] = await db.insert(deliverySlots).values({
    groupId, cutoffTime, deliveryTime, isActive: true, sortOrder: maxOrder + 1,
  }).returning();
  return NextResponse.json(slot);
}

// PATCH — toggle isActive slot
export async function PATCH(req: NextRequest) {
  const { slotId, isActive, cutoffTime, deliveryTime } = await req.json();
  const updates: Record<string, unknown> = {};
  if (isActive !== undefined) updates.isActive = isActive;
  if (cutoffTime) updates.cutoffTime = cutoffTime;
  if (deliveryTime) updates.deliveryTime = deliveryTime;
  const [slot] = await db.update(deliverySlots).set(updates).where(eq(deliverySlots.id, slotId)).returning();
  return NextResponse.json(slot);
}

// DELETE — hapus slot
export async function DELETE(req: NextRequest) {
  const { slotId } = await req.json();
  await db.delete(deliverySlots).where(eq(deliverySlots.id, slotId));
  return NextResponse.json({ ok: true });
}
