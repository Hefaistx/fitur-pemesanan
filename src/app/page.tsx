import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { stores, orders, properties } from '@/lib/schema';
import { count, eq } from 'drizzle-orm';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

// Koordinat Campagna & Jede (dari Maps URL)
const STORE_COORDS: Record<string, { lat: number; lng: number }> = {
  campagna: { lat: -7.7739689, lng: 110.4009633 },
  jede:     { lat: -7.7738514, lng: 110.4008255 },
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  const storeList = await db.select({
    id: stores.id,
    slug: stores.slug,
    name: stores.name,
    tagline: stores.tagline,
    description: stores.description,
    imageUrl: stores.imageUrl,
    openHours: stores.openHours,
    rating: stores.rating,
    waNumber: stores.waNumber,
  }).from(stores);

  const orderCounts = await db
    .select({ storeId: orders.storeId, total: count() })
    .from(orders)
    .groupBy(orders.storeId);

  const orderCountMap: Record<number, number> = {};
  for (const row of orderCounts) {
    orderCountMap[row.storeId] = row.total;
  }

  // Hitung jarak hanya kalau user Jogja (propertyName ada di tabel properties)
  let distanceMap: Record<number, number> | null = null;
  const userPropertyName = session?.user?.propertyName;

  if (userPropertyName) {
    const [prop] = await db
      .select()
      .from(properties)
      .where(eq(properties.name, userPropertyName))
      .limit(1);

    if (prop) {
      distanceMap = {};
      for (const store of storeList) {
        const coords = STORE_COORDS[store.slug];
        if (coords) {
          distanceMap[store.id] = haversineKm(prop.lat, prop.lng, coords.lat, coords.lng);
        }
      }
    }
  }

  return (
    <DashboardClient
      session={session}
      stores={storeList}
      orderCountMap={orderCountMap}
      distanceMap={distanceMap}
    />
  );
}
