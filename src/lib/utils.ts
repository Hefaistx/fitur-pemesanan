export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function generateWaMessage(params: {
  storeName: string;
  userName: string;
  hasReservation: boolean;
  propertyName?: string | null;
  roomNumber?: string | null;
  items?: { name: string; qty: number; price: number; categoryName?: string | null }[];
  deliverySlot?: { deliveryTime: string; isToday: boolean } | null;
}): string {
  const { storeName, userName, hasReservation, propertyName, roomNumber, items, deliverySlot } = params;

  if (!hasReservation) {
    return [
      `Halo ${storeName}!`,
      ``,
      `Saya ${userName}, pengguna aplikasi D'Paragon.`,
      `Saya ingin membuat reservasi di *${storeName}*.`,
      ``,
      `Terima kasih!`,
    ].join('\n');
  }

  // Group items by category
  const categoryOrder: string[] = [];
  const categoryMap: Record<string, { name: string; qty: number; price: number }[]> = {};
  for (const item of items ?? []) {
    const cat = item.categoryName ?? 'Menu';
    if (!categoryMap[cat]) {
      categoryOrder.push(cat);
      categoryMap[cat] = [];
    }
    categoryMap[cat].push(item);
  }

  const itemLines: string[] = [];
  for (const cat of categoryOrder) {
    itemLines.push(`*${cat}:*`);
    for (const i of categoryMap[cat]) {
      itemLines.push(`- ${i.name} x${i.qty} = ${formatRupiah(i.price * i.qty)}`);
    }
    itemLines.push('');
  }

  const total = (items ?? []).reduce((sum, i) => sum + i.price * i.qty, 0);

  return [
    `Halo ${storeName}!`,
    ``,
    `Saya ingin memesan:`,
    ``,
    ...itemLines,
    `*Total: ${formatRupiah(total)}*`,
    ``,
    `Nama: ${userName}`,
    `Properti: ${propertyName ?? '-'}`,
    `Kamar: ${roomNumber ?? '-'}`,
    ...(deliverySlot ? [
      ``,
      `Estimasi pengiriman: pukul ${deliverySlot.deliveryTime} hari ini`,
    ] : []),
    ``,
    `Terima kasih!`,
  ].join('\n');
}

export interface DeliverySlotInfo {
  cutoffTime: string;
  deliveryTime: string;
}

export function getWibMinutes(now?: Date): number {
  const d = now ?? new Date();
  return ((d.getUTCHours() + 7) % 24) * 60 + d.getUTCMinutes();
}

export function getNextDeliverySlot(slots: DeliverySlotInfo[], now?: Date): {
  deliveryTime: string;
  isToday: boolean;
} | null {
  if (!slots.length) return null;
  const sorted = [...slots].sort((a, b) => a.cutoffTime.localeCompare(b.cutoffTime));
  const wibMinutes = getWibMinutes(now);

  for (const slot of sorted) {
    const [h, m] = slot.cutoffTime.split(':').map(Number);
    if (wibMinutes < h * 60 + m) {
      return { deliveryTime: slot.deliveryTime, isToday: true };
    }
  }
  return null;
}

export function buildWaLink(waNumber: string, message: string): string {
  const cleaned = waNumber.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}
