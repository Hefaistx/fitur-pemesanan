export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { stores, menuItems, menuCategories, deliverySlots, orders } from '@/lib/schema';
import { eq, and, count } from 'drizzle-orm';
import MenuClient from './MenuClient';

interface Props {
  params: { store: string };
}

export default async function MenuPage({ params }: Props) {
  const session = await getServerSession(authOptions);

  const [store] = await db
    .select()
    .from(stores)
    .where(eq(stores.slug, params.store))
    .limit(1);

  if (!store) notFound();

  const [categories, items, orderCountRow] = await Promise.all([
    db.select().from(menuCategories).where(eq(menuCategories.storeId, store.id)).orderBy(menuCategories.sortOrder),
    db.select().from(menuItems).where(eq(menuItems.storeId, store.id)).orderBy(menuItems.sortOrder),
    db.select({ value: count() }).from(orders).where(eq(orders.storeId, store.id)),
  ]);

  const orderCount = Number(orderCountRow[0]?.value ?? 0);

  const slots = store.deliveryGroupId
    ? await db
        .select({ cutoffTime: deliverySlots.cutoffTime, deliveryTime: deliverySlots.deliveryTime })
        .from(deliverySlots)
        .where(and(eq(deliverySlots.groupId, store.deliveryGroupId), eq(deliverySlots.isActive, true)))
        .orderBy(deliverySlots.sortOrder)
    : [];

  return (
    <MenuClient
      store={store}
      categories={categories}
      items={items}
      session={session}
      deliverySlots={slots}
      orderCount={orderCount}
    />
  );
}
