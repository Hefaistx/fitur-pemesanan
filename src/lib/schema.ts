import { pgTable, serial, text, integer, boolean, timestamp, numeric, varchar, doublePrecision } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const deliveryPeriodGroups = pgTable('delivery_period_groups', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
});

export const deliverySlots = pgTable('delivery_slots', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id').notNull().references(() => deliveryPeriodGroups.id),
  cutoffTime: varchar('cutoff_time', { length: 5 }).notNull(),   // "11:00" — batas pesan
  deliveryTime: varchar('delivery_time', { length: 5 }).notNull(), // "13:00" — estimasi kirim
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0),
});

export const properties = pgTable('properties', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  email: varchar('email', { length: 255 }).unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reservations = pgTable('reservations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  propertyName: text('property_name').notNull(),
  roomNumber: varchar('room_number', { length: 20 }),
  checkIn: timestamp('check_in').notNull(),
  checkOut: timestamp('check_out').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const stores = pgTable('stores', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  name: text('name').notNull(),
  tagline: text('tagline'),
  description: text('description'),
  waNumber: varchar('wa_number', { length: 20 }).notNull(),
  imageUrl: text('image_url'),
  bannerUrl: text('banner_url'),
  openHours: varchar('open_hours', { length: 50 }),
  rating: numeric('rating', { precision: 2, scale: 1 }),
  deliveryGroupId: integer('delivery_group_id').references(() => deliveryPeriodGroups.id),
  type: varchar('type', { length: 20 }).default('fnb').notNull(), // 'fnb' | 'jastip'
});

export const menuCategories = pgTable('menu_categories', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull().references(() => stores.id),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').default(0),
});

export const menuItems = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull().references(() => stores.id),
  categoryId: integer('category_id').references(() => menuCategories.id),
  name: text('name').notNull(),
  description: text('description'),
  price: integer('price').notNull(),
  imageUrl: text('image_url'),
  isAvailable: boolean('is_available').default(true).notNull(),
  sortOrder: integer('sort_order').default(0),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  storeId: integer('store_id').notNull().references(() => stores.id),
  reservationId: integer('reservation_id').references(() => reservations.id),
  totalAmount: integer('total_amount').notNull(),
  notes: text('notes'),
  paymentStatus: varchar('payment_status', { length: 20 }).default('pending').notNull(), // pending | paid | expired
  deliveryStatus: varchar('delivery_status', { length: 20 }),  // null | confirmed | delivering | delivered
  deliveryProofUrl: text('delivery_proof_url'),
  vaNumber: varchar('va_number', { length: 20 }),
  paymentDeadline: timestamp('payment_deadline'),
  deliveryDate: varchar('delivery_date', { length: 10 }),   // "2026-07-08"
  deliveryTime: varchar('delivery_time', { length: 5 }),    // "13:00"
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id),
  menuItemId: integer('menu_item_id').notNull().references(() => menuItems.id),
  quantity: integer('quantity').notNull(),
  priceAtOrder: integer('price_at_order').notNull(),
  itemName: text('item_name').notNull(),
});

// --- Relations ---
export const deliveryPeriodGroupsRelations = relations(deliveryPeriodGroups, ({ many }) => ({
  slots: many(deliverySlots),
  stores: many(stores),
}));

export const deliverySlotsRelations = relations(deliverySlots, ({ one }) => ({
  group: one(deliveryPeriodGroups, { fields: [deliverySlots.groupId], references: [deliveryPeriodGroups.id] }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  reservations: many(reservations),
  orders: many(orders),
}));

export const reservationsRelations = relations(reservations, ({ one }) => ({
  user: one(users, { fields: [reservations.userId], references: [users.id] }),
}));

export const storesRelations = relations(stores, ({ many, one }) => ({
  categories: many(menuCategories),
  menuItems: many(menuItems),
  orders: many(orders),
  deliveryGroup: one(deliveryPeriodGroups, { fields: [stores.deliveryGroupId], references: [deliveryPeriodGroups.id] }),
}));

export const menuCategoriesRelations = relations(menuCategories, ({ one, many }) => ({
  store: one(stores, { fields: [menuCategories.storeId], references: [stores.id] }),
  items: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  store: one(stores, { fields: [menuItems.storeId], references: [stores.id] }),
  category: one(menuCategories, { fields: [menuItems.categoryId], references: [menuCategories.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  store: one(stores, { fields: [orders.storeId], references: [stores.id] }),
  reservation: one(reservations, { fields: [orders.reservationId], references: [reservations.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  menuItem: one(menuItems, { fields: [orderItems.menuItemId], references: [menuItems.id] }),
}));

// --- Types ---
export type User = typeof users.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
export type Store = typeof stores.$inferSelect;
export type MenuCategory = typeof menuCategories.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderStatus = 'pending' | 'paid' | 'expired';
export type OrderItem = typeof orderItems.$inferSelect;
export type DeliveryPeriodGroup = typeof deliveryPeriodGroups.$inferSelect;
export type DeliverySlot = typeof deliverySlots.$inferSelect;
