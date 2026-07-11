'use client';
import { useState, useEffect, useCallback, useRef } from 'react';


interface Slot {
  id: number;
  groupId: number;
  cutoffTime: string;
  deliveryTime: string;
  isActive: boolean;
  sortOrder: number | null;
}

interface Group {
  id: number;
  name: string;
  description: string | null;
}

interface StoreItem {
  id: number;
  name: string;
  slug: string;
  deliveryGroupId: number | null;
}

export default function DeliveryAdminPanel() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newSlot, setNewSlot] = useState<{ groupId: number; cutoff: string; delivery: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/delivery-groups');
    const data = await res.json();
    setGroups(data.groups);
    setSlots(data.slots);
    setStores(data.stores);
    setLoading(false);
  }, []);

  useEffect(() => setMounted(true), []);
  useEffect(() => { if (open) load(); }, [open, load]);

  if (!mounted) return null;

  const toggleSlot = async (slot: Slot) => {
    await fetch('/api/admin/delivery-groups', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId: slot.id, isActive: !slot.isActive }),
    });
    load();
  };

  const deleteSlot = async (slotId: number) => {
    await fetch('/api/admin/delivery-groups', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId }),
    });
    load();
  };

  const addSlot = async () => {
    if (!newSlot) return;
    await fetch('/api/admin/delivery-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId: newSlot.groupId, cutoffTime: newSlot.cutoff, deliveryTime: newSlot.delivery }),
    });
    setNewSlot(null);
    load();
  };

  const assignGroup = async (storeId: number, groupId: number | null) => {
    await fetch('/api/admin/assign-group', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId, groupId }),
    });
    load();
  };

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-36 right-4 z-[200] w-10 h-10 rounded-full bg-white border-2 border-grey shadow-lg flex items-center justify-center text-[15px]"
        title="Manage Delivery Periods"
      >
        📦
      </button>

      {open && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative w-full max-w-[430px] bg-white rounded-t-3xl pt-5 pb-10 shadow-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-grey mx-auto mb-4" />
            <p className="font-bold text-[15px] text-text-primary px-5 mb-1">Manage Periode Pengiriman</p>
            <p className="text-[12px] text-text-secondary px-5 mb-4">Kelola cutoff & estimasi kirim per group.</p>

            <div className="overflow-y-auto flex-1 px-5 space-y-5">
              {loading ? (
                <p className="text-[13px] text-text-secondary text-center py-8">Memuat...</p>
              ) : (
                <>
                  {/* Groups & Slots */}
                  {groups.map((group) => {
                    const groupSlots = slots.filter((s) => s.groupId === group.id)
                      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
                    return (
                      <div key={group.id} className="bg-background rounded-2xl p-4">
                        <p className="font-semibold text-[13px] text-text-primary mb-3">{group.name}</p>

                        <div className="space-y-2">
                          {groupSlots.map((slot) => (
                            <div key={slot.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 shadow-sm">
                              <div className="flex-1">
                                <p className={`text-[12px] font-medium ${slot.isActive ? 'text-text-primary' : 'text-text-secondary line-through'}`}>
                                  Cutoff {slot.cutoffTime} → Kirim {slot.deliveryTime}
                                </p>
                              </div>
                              <button
                                onClick={() => toggleSlot(slot)}
                                className={`text-[10px] font-semibold px-2 py-1 rounded-lg ${slot.isActive ? 'bg-success/10 text-success' : 'bg-grey text-text-secondary'}`}
                              >
                                {slot.isActive ? 'Aktif' : 'Off'}
                              </button>
                              <button
                                onClick={() => deleteSlot(slot.id)}
                                className="text-danger text-[13px] w-6 h-6 flex items-center justify-center"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Tambah slot */}
                        {newSlot?.groupId === group.id ? (
                          <div className="mt-3 flex gap-2">
                            <div className="flex-1 space-y-1.5">
                              <input
                                type="time"
                                value={newSlot.cutoff}
                                onChange={(e) => setNewSlot({ ...newSlot, cutoff: e.target.value })}
                                placeholder="Cutoff"
                                className="w-full text-[12px] border border-grey rounded-lg px-2 py-1.5 outline-none focus:border-primary"
                              />
                              <input
                                type="time"
                                value={newSlot.delivery}
                                onChange={(e) => setNewSlot({ ...newSlot, delivery: e.target.value })}
                                placeholder="Kirim"
                                className="w-full text-[12px] border border-grey rounded-lg px-2 py-1.5 outline-none focus:border-primary"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <button onClick={addSlot} className="bg-primary text-white text-[12px] font-semibold px-3 py-1.5 rounded-lg">Simpan</button>
                              <button onClick={() => setNewSlot(null)} className="bg-grey text-text-secondary text-[12px] px-3 py-1.5 rounded-lg">Batal</button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setNewSlot({ groupId: group.id, cutoff: '09:00', delivery: '11:00' })}
                            className="mt-3 w-full py-2 rounded-xl border border-dashed border-primary/40 text-primary text-[12px] font-medium"
                          >
                            + Tambah Slot
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Store ↔ Group assignment */}
                  <div className="bg-background rounded-2xl p-4">
                    <p className="font-semibold text-[13px] text-text-primary mb-3">Assign Group ke Store</p>
                    <div className="space-y-2">
                      {stores.map((store) => (
                        <div key={store.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 shadow-sm">
                          <p className="flex-1 text-[12px] font-medium text-text-primary truncate">{store.name}</p>
                          <select
                            value={store.deliveryGroupId ?? ''}
                            onChange={(e) => assignGroup(store.id, e.target.value ? Number(e.target.value) : null)}
                            className="text-[11px] border border-grey rounded-lg px-1.5 py-1 outline-none bg-white focus:border-primary"
                          >
                            <option value="">— Tidak ada —</option>
                            {groups.map((g) => (
                              <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
