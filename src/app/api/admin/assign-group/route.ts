import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(req: NextRequest) {
  const { storeId, groupId } = await req.json();
  const [store] = await db
    .update(stores)
    .set({ deliveryGroupId: groupId })
    .where(eq(stores.id, storeId))
    .returning({ id: stores.id, name: stores.name, deliveryGroupId: stores.deliveryGroupId });
  return NextResponse.json(store);
}
