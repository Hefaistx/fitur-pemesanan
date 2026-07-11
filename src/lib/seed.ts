import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

const SATE_IMG = 'https://images.unsplash.com/photo-1529563021893-cc83c992d75d?w=300&h=200&fit=crop';

async function seed() {
  console.log('🧹 Clearing existing data...');

  await db.execute(sql`TRUNCATE order_items, orders, delivery_slots, delivery_period_groups, menu_items, menu_categories, reservations, stores, users, properties RESTART IDENTITY CASCADE`);

  console.log('🌱 Seeding database...');

  // ── Delivery groups & slots dulu (karena stores butuh FK ke group) ──
  const [groupStandar, groupJastip] = await db
    .insert(schema.deliveryPeriodGroups)
    .values([
      { name: 'Standar 3 Sesi',  description: '3x pengiriman per hari (F&B)' },
      { name: 'Jastip 2 Sesi',   description: '2x pengiriman per hari (Jastip)' },
    ])
    .returning();

  await db.insert(schema.deliverySlots).values([
    { groupId: groupStandar.id, cutoffTime: '11:00', deliveryTime: '13:00', isActive: true, sortOrder: 1 },
    { groupId: groupStandar.id, cutoffTime: '14:00', deliveryTime: '16:00', isActive: true, sortOrder: 2 },
    { groupId: groupStandar.id, cutoffTime: '18:00', deliveryTime: '20:00', isActive: true, sortOrder: 3 },
    { groupId: groupJastip.id,  cutoffTime: '10:00', deliveryTime: '14:00', isActive: true, sortOrder: 1 },
    { groupId: groupJastip.id,  cutoffTime: '16:00', deliveryTime: '19:00', isActive: true, sortOrder: 2 },
  ]);

  console.log('✅ Delivery period groups & slots seeded');

  await db.insert(schema.properties).values([
    { name: "D'Paragon Kemuning",          lat: -7.7592146, lng: 110.4062187 },
    { name: "D'Paragon Seturan 1",         lat: -7.7659175, lng: 110.4117101 },
    { name: "D'Paragon Seturan 2",         lat: -7.7657432, lng: 110.4094303 },
    { name: "D'Paragon Seturan 3",         lat: -7.7653702, lng: 110.4088858 },
    { name: "D'Paragon Karangmalang",      lat: -7.7707896, lng: 110.3865198 },
    { name: "D'Paragon UPN",               lat: -7.7634831, lng: 110.4066965 },
    { name: "D'Paragon Pogung F",          lat: -7.7584543, lng: 110.3786137 },
    { name: "D'Paragon Pogung B",          lat: -7.7608163, lng: 110.3778728 },
    { name: "D'Paragon Perumnas",          lat: -7.7646510, lng: 110.4059800 },
    { name: "D'Paragon Beo",               lat: -7.7746393, lng: 110.3949037 },
    { name: "D'Paragon Malioboro",         lat: -7.7881918, lng: 110.3641867 },
    { name: "D'Paragon Pamela 1",          lat: -7.7522668, lng: 110.4112760 },
    { name: "D'Kraton Villa Mantrijeron",  lat: -7.8172833, lng: 110.3642616 },
    { name: "D'Paragon Pamela 4",          lat: -7.7522575, lng: 110.4112351 },
  ]);

  console.log('✅ Properties seeded');

  const passwordHash = await bcrypt.hash('password123', 10);

  const [budi, andi, sari, rini, dodi, milla] = await db
    .insert(schema.users)
    .values([
      { name: 'Budi Santoso',  phone: '6281234567890', email: 'budi@example.com',  passwordHash },
      { name: 'Andi Wijaya',   phone: '6285555555555', email: 'andi@example.com',  passwordHash },
      { name: 'Sari Dewi',     phone: '6289876543210', email: 'sari@example.com',  passwordHash },
      { name: 'Rini Kusuma',   phone: '6287777777777', email: 'rini@example.com',  passwordHash },
      { name: 'Dodi Pratama',  phone: '6281111111111', email: 'dodi@example.com',  passwordHash },
      { name: 'Milla Putri',     phone: '6282222222222', email: 'milla@example.com',  passwordHash },
    ])
    .returning();

  console.log('✅ Users seeded');

  const now = new Date();
  const checkout = new Date(now);
  checkout.setDate(checkout.getDate() + 5); // 5 malam → bisa test date picker
  checkout.setHours(12, 0, 0, 0);

  const checkout1Day = new Date(now);
  checkout1Day.setDate(checkout1Day.getDate() + 1); // 1 malam → no date picker
  checkout1Day.setHours(12, 0, 0, 0);

  await db.insert(schema.reservations).values([
    {
      // Budi — menginap di Jogja ✅ bisa pesan
      userId: budi.id,
      propertyName: "D'Paragon Kemuning",
      roomNumber: '305',
      checkIn: now,
      checkOut: checkout,
      status: 'active',
    },
    {
      // Andi — menginap di luar Jogja ⚠️ tidak bisa pesan
      userId: andi.id,
      propertyName: 'DParagon Semarang',
      roomNumber: '112',
      checkIn: now,
      checkOut: checkout,
      status: 'active',
    },
    // Sari — tidak punya reservasi sama sekali
    {
      // Rini — menginap di Jogja ✅ 1 malam, date picker muncul (hari ini + hari checkout)
      userId: rini.id,
      propertyName: "D'Paragon Seturan 1",
      roomNumber: '204',
      checkIn: now,
      checkOut: checkout1Day,
      status: 'active',
    },
    {
      // Dodi (Case 6) — 2 kamar di Jogja, room selector muncul
      userId: dodi.id,
      propertyName: "D'Paragon Kemuning",
      roomNumber: '101',
      checkIn: now,
      checkOut: checkout,
      status: 'active',
    },
    {
      userId: dodi.id,
      propertyName: "D'Paragon Seturan 2",
      roomNumber: '202',
      checkIn: now,
      checkOut: checkout,
      status: 'active',
    },
    {
      // Maya (Case 7) — 1 kamar Jogja + 1 kamar non-Jogja
      // isInJogja harus TRUE, room selector hanya tampil kamar Jogja
      userId: milla.id,
      propertyName: "D'Paragon UPN",
      roomNumber: '305',
      checkIn: now,
      checkOut: checkout,
      status: 'active',
    },
    {
      userId: milla.id,
      propertyName: 'DParagon Malang',
      roomNumber: '110',
      checkIn: now,
      checkOut: checkout,
      status: 'active',
    },
  ]);

  console.log('✅ Reservations seeded');

  const [campagna, jede, bakpia, gudeg, wedang] = await db
    .insert(schema.stores)
    .values([
      {
        slug: 'campagna',
        name: 'Campagna Coffee & Eatery',
        type: 'fnb',
        deliveryGroupId: groupStandar.id,
        tagline: 'Cafe & Bakery',
        description: 'Nikmati kopi pilihan dan pastri segar buatan tangan di Campagna.',
        waNumber: '6281125209913',
        imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=400&fit=crop',
        openHours: '07.00 – 22.00',
        rating: '4.8',
      },
      {
        slug: 'jede',
        name: 'Sate Klathak dan Bakmi Jowo Pak Jede',
        type: 'fnb',
        deliveryGroupId: groupStandar.id,
        tagline: 'Sate Klathak & Bakmi Jowo',
        description: 'Sate Klathak dan Bakmi Jowo Pak Jede — kuliner khas Yogyakarta dengan cita rasa autentik.',
        waNumber: '6281125209913',
        imageUrl: 'https://images.unsplash.com/photo-1529563021893-cc83c992d75d?w=400&h=300&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1606850780674-76bc78f8862a?w=800&h=400&fit=crop',
        openHours: '10.00 – 21.00',
        rating: '4.7',
      },
      {
        slug: 'bakpia-asri',
        name: 'Bakpia Jogja Asri',
        type: 'jastip',
        deliveryGroupId: groupJastip.id,
        tagline: 'Oleh-oleh Khas Yogyakarta',
        description: 'Bakpia fresh setiap hari dengan berbagai pilihan isi. Camilan wajib bawa pulang dari Jogja.',
        waNumber: '6281125209913',
        imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=300&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1542010589005-d1eacc3918f2?w=800&h=400&fit=crop',
        openHours: '08.00 – 21.00',
        rating: '4.6',
      },
      {
        slug: 'gudeg-busari',
        name: 'Gudeg Kemasan Bu Sari',
        type: 'jastip',
        deliveryGroupId: groupJastip.id,
        tagline: 'Gudeg Tahan Lama',
        description: 'Gudeg kemasan vakum tahan hingga 7 hari, cocok untuk oleh-oleh jarak jauh.',
        waNumber: '6281125209913',
        imageUrl: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=300&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=400&fit=crop',
        openHours: '07.00 – 20.00',
        rating: '4.5',
      },
      {
        slug: 'wedang-rempah',
        name: 'Wedang Rempah Jogja',
        type: 'jastip',
        deliveryGroupId: groupJastip.id,
        tagline: 'Minuman Tradisional & Kopi Lokal',
        description: 'Minuman rempah tradisional dan kopi lokal lereng Merapi dalam kemasan praktis.',
        waNumber: '6281125209913',
        imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&h=400&fit=crop',
        openHours: '08.00 – 22.00',
        rating: '4.7',
      },
    ])
    .returning();

  console.log('✅ Stores seeded');

  const [catKopi, catMakanan, catPastri] = await db
    .insert(schema.menuCategories)
    .values([
      { storeId: campagna.id, name: 'Kopi & Minuman', sortOrder: 1 },
      { storeId: campagna.id, name: 'Makanan Berat',  sortOrder: 2 },
      { storeId: campagna.id, name: 'Pastri & Snack', sortOrder: 3 },
    ])
    .returning();

  const [catJedeSate, catJedeBakmi, catJedeLainlain, catJedeMinuman] = await db
    .insert(schema.menuCategories)
    .values([
      { storeId: jede.id, name: 'Sate',       sortOrder: 1 },
      { storeId: jede.id, name: 'Bakmi',      sortOrder: 2 },
      { storeId: jede.id, name: 'Lain-Lain',  sortOrder: 3 },
      { storeId: jede.id, name: 'Minuman',    sortOrder: 4 },
    ])
    .returning();

  await db.insert(schema.menuItems).values([
    { storeId: campagna.id, categoryId: catKopi.id,    name: 'Espresso',          description: 'Single origin robusta, bold & smooth',              price: 25000, imageUrl: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=300&h=200&fit=crop',  sortOrder: 1 },
    { storeId: campagna.id, categoryId: catKopi.id,    name: 'Americano',         description: 'Espresso dengan air panas segar',                   price: 28000, imageUrl: 'https://images.unsplash.com/photo-1522992319-0365e5f11656?w=300&h=200&fit=crop',  sortOrder: 2 },
    { storeId: campagna.id, categoryId: catKopi.id,    name: 'Cappuccino',        description: 'Espresso, susu dikukus, busa susu tebal',            price: 32000, imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&h=200&fit=crop', sortOrder: 3 },
    { storeId: campagna.id, categoryId: catKopi.id,    name: 'Latte',             description: 'Espresso lembut dengan susu segar',                  price: 35000, imageUrl: 'https://images.unsplash.com/photo-1561882468-9110d70085af?w=300&h=200&fit=crop',  sortOrder: 4 },
    { storeId: campagna.id, categoryId: catKopi.id,    name: 'Cold Brew',         description: 'Diseduh dingin 12 jam, rasa halus',                  price: 38000, imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=300&h=200&fit=crop', sortOrder: 5 },
    { storeId: campagna.id, categoryId: catKopi.id,    name: 'Matcha Latte',      description: 'Matcha Jepang premium dengan susu oat',              price: 38000, imageUrl: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=300&h=200&fit=crop', sortOrder: 6 },
    { storeId: campagna.id, categoryId: catMakanan.id, name: 'Nasi Goreng Campagna', description: 'Nasi goreng spesial dengan telur mata sapi',      price: 45000, imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300&h=200&fit=crop', sortOrder: 1 },
    { storeId: campagna.id, categoryId: catMakanan.id, name: 'Avocado Toast',     description: 'Roti sourdough, alpukat, telur poached',             price: 52000, imageUrl: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=300&h=200&fit=crop', sortOrder: 2 },
    { storeId: campagna.id, categoryId: catMakanan.id, name: 'Pasta Aglio Olio',  description: 'Spaghetti, bawang putih, cabai, peterseli',          price: 55000, imageUrl: 'https://images.unsplash.com/photo-1473093226555-0b4db2f67cb5?w=300&h=200&fit=crop', sortOrder: 3 },
    { storeId: campagna.id, categoryId: catPastri.id,  name: 'Croissant Butter',  description: 'Croissant renyah berlapis mentega Prancis',          price: 22000, imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&h=200&fit=crop',  sortOrder: 1 },
    { storeId: campagna.id, categoryId: catPastri.id,  name: 'Banana Bread',      description: 'Roti pisang lembut dengan walnut panggang',          price: 28000, imageUrl: 'https://images.unsplash.com/photo-1574085733277-851d9d856a3a?w=300&h=200&fit=crop', sortOrder: 2 },
    { storeId: campagna.id, categoryId: catPastri.id,  name: 'Tiramisu',          description: 'Tiramisu klasik Italia dengan mascarpone',           price: 35000, imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&h=200&fit=crop', sortOrder: 3 },

    // ── Jede: SATE ──
    { storeId: jede.id, categoryId: catJedeSate.id, name: 'Sate Buntel',         description: null,                                                                                                                                                                        price:  40000, imageUrl: SATE_IMG, sortOrder:  1 },
    { storeId: jede.id, categoryId: catJedeSate.id, name: 'Tongseng Original',   description: 'Tongseng kambing muda adalah hidangan berkuah kental khas Indonesia, menggunakan daging kambing muda, dimasak dengan bumbu pedas dan manis.',                              price:  50000, imageUrl: SATE_IMG, sortOrder:  2 },
    { storeId: jede.id, categoryId: catJedeSate.id, name: 'Sate Hotplate',       description: 'Sate hotplate kambing muda adalah hidangan daging kambing muda yang dipanggang, disajikan panas di atas hotplate dengan bumbu khas Sate Pak Jede.',                        price: 110000, imageUrl: SATE_IMG, sortOrder:  3 },
    { storeId: jede.id, categoryId: catJedeSate.id, name: 'Nasi Goreng Kambing', description: 'Nasi goreng kambing adalah kreasi masakan populer yang terdiri dari nasi putih yang digoreng bersama bumbu-bumbu khusus serta daging kambing sebagai pendamping utamanya.', price:  43000, imageUrl: SATE_IMG, sortOrder:  4 },
    { storeId: jede.id, categoryId: catJedeSate.id, name: 'Sate Bakar',          description: 'Sate bakar kambing muda adalah hidangan khas Indonesia, terdiri dari daging kambing muda yang dipanggang, lalu bakar dengan bumbu khas Sate Pak Jede.',                    price:  50000, imageUrl: SATE_IMG, sortOrder:  5 },
    { storeId: jede.id, categoryId: catJedeSate.id, name: 'Gule Daging',         description: 'Gule daging kambing muda adalah hidangan berkuah santan khas Indonesia, menggunakan daging kambing muda, dimasak dengan bumbu rempah khas.',                              price:  50000, imageUrl: SATE_IMG, sortOrder:  6 },
    { storeId: jede.id, categoryId: catJedeSate.id, name: 'Sate Ayam Merah',     description: null,                                                                                                                                                                        price:  43000, imageUrl: SATE_IMG, sortOrder:  7 },
    { storeId: jede.id, categoryId: catJedeSate.id, name: 'Sate Goreng',         description: 'Sate goreng kambing muda adalah hidangan khas Indonesia, terdiri dari daging kambing muda yang dipanggang, lalu digoreng dengan bumbu khas Sate Pak Jede.',                price:  50000, imageUrl: SATE_IMG, sortOrder:  8 },
    { storeId: jede.id, categoryId: catJedeSate.id, name: 'Nasi Putih',          description: null,                                                                                                                                                                        price:   8000, imageUrl: SATE_IMG, sortOrder:  9 },
    { storeId: jede.id, categoryId: catJedeSate.id, name: 'Sate Kulit Merah',    description: null,                                                                                                                                                                        price:  43000, imageUrl: SATE_IMG, sortOrder: 10 },
    { storeId: jede.id, categoryId: catJedeSate.id, name: 'Tongseng Sayur',      description: 'Tongseng kambing muda adalah hidangan berkuah kental dilengkapi dengan sayuran, menggunakan daging kambing muda, dimasak dengan bumbu pedas dan manis.',                   price:  50000, imageUrl: SATE_IMG, sortOrder: 11 },
    { storeId: jede.id, categoryId: catJedeSate.id, name: 'Tengkleng',           description: 'Masakan berbahan dasar daging kambing dengan kuah santan dan berbumbu tajam mirip gule.',                                                                                  price:  50000, imageUrl: SATE_IMG, sortOrder: 12 },
    { storeId: jede.id, categoryId: catJedeSate.id, name: 'Gule Balungan',       description: 'Gule balungan kambing muda adalah hidangan berkuah santan khas Indonesia, menggunakan balungan (tulang) kambing muda, dimasak dengan bumbu rempah khas.',                  price:  50000, imageUrl: SATE_IMG, sortOrder: 13 },
    { storeId: jede.id, categoryId: catJedeSate.id, name: 'Krenyos',             description: 'Krenyos kambing muda adalah hidangan lemak kambing muda dengan bumbu khas, memiliki tekstur renyah dan rasa gurih.',                                                       price:  40000, imageUrl: SATE_IMG, sortOrder: 14 },
    { storeId: jede.id, categoryId: catJedeSate.id, name: 'Sate Klathak',        description: 'Sate klathak kambing muda adalah sate khas Yogyakarta, terbuat dari kambing muda yang dipanggang dengan bumbu sederhana dan dibakar dengan tusuk jeruji sepeda sebanyak 2 tusuk sate.', price: 50000, imageUrl: SATE_IMG, sortOrder: 15 },
    { storeId: jede.id, categoryId: catJedeSate.id, name: 'Kicik',               description: 'Kicik kambing muda adalah hidangan khas Indonesia, berupa daging kambing muda yang direbus hingga empuk, disajikan dengan bumbu rempah.',                                  price:  50000, imageUrl: SATE_IMG, sortOrder: 16 },

    // ── Jede: BAKMI ──
    { storeId: jede.id, categoryId: catJedeBakmi.id, name: 'Bakmi Godhog',            description: 'Bakmie godhog adalah mie telur dimasak dalam kuah kaldu yang gurih, dengan bumbu rempah, sayuran, di tambah ayam dan telur bebek.',                          price: 40000, imageUrl: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=300&h=200&fit=crop', sortOrder:  1 },
    { storeId: jede.id, categoryId: catJedeBakmi.id, name: 'Capcay Godhog',           description: 'Capcay godhog adalah hidangan sup sayuran dengan berbagai sayuran seperti wortel, kembang kol, brokoli, dan sawi, ditambah ayam.',                           price: 40000, imageUrl: null,                                                                                   sortOrder:  2 },
    { storeId: jede.id, categoryId: catJedeBakmi.id, name: 'Bakmi Goreng',            description: 'Bakmie goreng adalah mie telur yang digoreng dengan bumbu kecap, bawang, sayuran, dan biasanya dilengkapi ayam dan telur bebek.',                            price: 40000, imageUrl: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=300&h=200&fit=crop', sortOrder:  3 },
    { storeId: jede.id, categoryId: catJedeBakmi.id, name: 'Bihun Godhog',            description: null,                                                                                                                                                          price: 40000, imageUrl: null,                                                                                   sortOrder:  4 },
    { storeId: jede.id, categoryId: catJedeBakmi.id, name: 'Mie Lethek Godog',        description: 'Mie lethek godog adalah mie khas Yogyakarta dimasak dengan kuah kaldu kental, bumbu rempah, sayuran, dan telur bebek.',                                      price: 40000, imageUrl: null,                                                                                   sortOrder:  5 },
    { storeId: jede.id, categoryId: catJedeBakmi.id, name: 'Bihun Goreng',            description: 'Bihun goreng adalah bihun yang digoreng dengan bumbu kecap, bawang, sayuran, dan seringkali ditambah ayam dan telur bebek.',                                price: 40000, imageUrl: null,                                                                                   sortOrder:  6 },
    { storeId: jede.id, categoryId: catJedeBakmi.id, name: 'Capcay Goreng',           description: 'Capcay goreng adalah hidangan tumis sayuran beragam seperti wortel, kembang kol, brokoli, dan sawi, dengan tambahan ayam.',                                  price: 40000, imageUrl: null,                                                                                   sortOrder:  7 },
    { storeId: jede.id, categoryId: catJedeBakmi.id, name: 'Magelangan',              description: 'Magelangan adalah campuran nasi goreng dan mie goreng, dimasak dengan bumbu khas, dilengkapi ayam, telur, sayuran, dan kecap.',                              price: 40000, imageUrl: null,                                                                                   sortOrder:  8 },
    { storeId: jede.id, categoryId: catJedeBakmi.id, name: 'Nasi Goreng Ayam',        description: 'Nasi goreng ayam adalah kreasi masakan populer yang terdiri dari nasi putih yang digoreng bersama bumbu-bumbu khusus serta daging ayam sebagai pendamping.', price: 40000, imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300&h=200&fit=crop', sortOrder:  9 },
    { storeId: jede.id, categoryId: catJedeBakmi.id, name: 'Rica Rica Ayam',          description: 'Rica-rica ayam adalah hidangan ayam pedas dengan bumbu cabai, bawang merah, bawang putih, tomat, dan rempah khas Indonesia, disajikan hangat.',              price: 26000, imageUrl: null,                                                                                   sortOrder: 10 },
    { storeId: jede.id, categoryId: catJedeBakmi.id, name: 'Mie Lethek Goreng',       description: 'Mie lethek goreng adalah mie tradisional Yogyakarta dengan tekstur kenyal, dimasak dengan bumbu khas, sayuran, dan protein seperti ayam dan telur bebek.',   price: 40000, imageUrl: null,                                                                                   sortOrder: 11 },
    { storeId: jede.id, categoryId: catJedeBakmi.id, name: 'Telur Ceplok/Telur Dadar',description: 'Kondimen telur ceplok.',                                                                                                                                      price:  8000, imageUrl: null,                                                                                   sortOrder: 12 },
    { storeId: jede.id, categoryId: catJedeBakmi.id, name: 'Brutu/Kepala/Sayap/Jeroan',description: 'Kepala Ayam Jawa.',                                                                                                                                          price: 18000, imageUrl: null,                                                                                   sortOrder: 13 },
    { storeId: jede.id, categoryId: catJedeBakmi.id, name: 'Nasi Godhog',             description: 'Nasi godhog adalah hidangan nasi berkuah dengan bumbu rempah, biasanya berisi ayam, sayuran, telur, dan mie, disajikan panas.',                              price: 40000, imageUrl: null,                                                                                   sortOrder: 14 },

    // ── Jede: LAIN-LAIN ──
    { storeId: jede.id, categoryId: catJedeLainlain.id, name: 'Kerupuk', description: null, price: 7000, imageUrl: null, sortOrder: 1 },

    // ── Jede: MINUMAN ──
    { storeId: jede.id, categoryId: catJedeMinuman.id, name: 'Es Batu',               description: null,                                                                                                                   price:  2000, imageUrl: null,                                                                                    sortOrder:  1 },
    { storeId: jede.id, categoryId: catJedeMinuman.id, name: 'Coca Cola',             description: 'Softdrink.',                                                                                                           price: 15000, imageUrl: null,                                                                                    sortOrder:  2 },
    { storeId: jede.id, categoryId: catJedeMinuman.id, name: 'Es Teh Manis',          description: null,                                                                                                                   price:  8000, imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&h=200&fit=crop', sortOrder:  3 },
    { storeId: jede.id, categoryId: catJedeMinuman.id, name: 'Teh Manis Hangat',      description: null,                                                                                                                   price:  8000, imageUrl: null,                                                                                    sortOrder:  4 },
    { storeId: jede.id, categoryId: catJedeMinuman.id, name: 'Air Mineral Botol',     description: null,                                                                                                                   price:  9500, imageUrl: null,                                                                                    sortOrder:  5 },
    { storeId: jede.id, categoryId: catJedeMinuman.id, name: 'Es Beras Kencur',       description: null,                                                                                                                   price: 17000, imageUrl: null,                                                                                    sortOrder:  6 },
    { storeId: jede.id, categoryId: catJedeMinuman.id, name: 'Es Kunir Asem',         description: 'Es kunir asem manis.',                                                                                                 price: 17000, imageUrl: null,                                                                                    sortOrder:  7 },
    { storeId: jede.id, categoryId: catJedeMinuman.id, name: 'Fanta',                 description: 'Softdrink.',                                                                                                           price: 15000, imageUrl: null,                                                                                    sortOrder:  8 },
    { storeId: jede.id, categoryId: catJedeMinuman.id, name: 'Fresh Tea',             description: 'Teh botol.',                                                                                                           price: 15000, imageUrl: null,                                                                                    sortOrder:  9 },
    { storeId: jede.id, categoryId: catJedeMinuman.id, name: 'Soda Gembira',          description: 'Soft drink.',                                                                                                          price: 18000, imageUrl: null,                                                                                    sortOrder: 10 },
    { storeId: jede.id, categoryId: catJedeMinuman.id, name: 'Sprite',                description: 'Softdrink.',                                                                                                           price: 15000, imageUrl: null,                                                                                    sortOrder: 11 },
    { storeId: jede.id, categoryId: catJedeMinuman.id, name: 'Susu Jahe',             description: null,                                                                                                                   price: 16500, imageUrl: null,                                                                                    sortOrder: 12 },
    { storeId: jede.id, categoryId: catJedeMinuman.id, name: 'Saparrela',             description: 'Soft drink.',                                                                                                          price: 26000, imageUrl: null,                                                                                    sortOrder: 13 },
    { storeId: jede.id, categoryId: catJedeMinuman.id, name: 'Wedhang Uwuh Gelas',    description: null,                                                                                                                   price: 16500, imageUrl: null,                                                                                    sortOrder: 14 },
    { storeId: jede.id, categoryId: catJedeMinuman.id, name: 'Jus Nanas',             description: 'Jus nanas adalah minuman segar dari daging nanas, dengan rasa manis dan sedikit asam.',                               price: 22000, imageUrl: null,                                                                                    sortOrder: 15 },
    { storeId: jede.id, categoryId: catJedeMinuman.id, name: 'Jus Semangka',          description: 'Jus semangka adalah minuman segar dari daging semangka, dengan rasa manis dan sedikit berair.',                       price: 22000, imageUrl: null,                                                                                    sortOrder: 16 },
    { storeId: jede.id, categoryId: catJedeMinuman.id, name: 'Jus Alpukat',           description: 'Jus alpukat adalah minuman creamy dari daging alpukat, dengan rasa lembut dan manis.',                                price: 25000, imageUrl: null,                                                                                    sortOrder: 17 },
    { storeId: jede.id, categoryId: catJedeMinuman.id, name: 'Jeruk Nipis Gula Batu', description: null,                                                                                                                   price: 15000, imageUrl: null,                                                                                    sortOrder: 18 },
    { storeId: jede.id, categoryId: catJedeMinuman.id, name: 'Jus Mangga',            description: 'Jus mangga adalah minuman segar dari daging mangga matang, dengan rasa manis dan kental.',                            price: 25000, imageUrl: null,                                                                                    sortOrder: 19 },
    { storeId: jede.id, categoryId: catJedeMinuman.id, name: 'Jus Buah Naga',         description: 'Jus buah naga adalah minuman segar dari daging buah naga, dengan rasa manis dan sedikit asam.',                      price: 22000, imageUrl: null,                                                                                    sortOrder: 20 },
    { storeId: jede.id, categoryId: catJedeMinuman.id, name: 'Teh Panas Gula Batu',   description: null,                                                                                                                   price: 11000, imageUrl: null,                                                                                    sortOrder: 21 },
    { storeId: jede.id, categoryId: catJedeMinuman.id, name: 'Es Jeruk',              description: 'Es jeruk manis.',                                                                                                      price: 14000, imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=300&h=200&fit=crop', sortOrder: 22 },
    { storeId: jede.id, categoryId: catJedeMinuman.id, name: 'Es Teh Tawar',          description: null,                                                                                                                   price:  7000, imageUrl: null,                                                                                    sortOrder: 23 },
    { storeId: jede.id, categoryId: catJedeMinuman.id, name: 'Es Jeruk Nipis',        description: null,                                                                                                                   price: 14000, imageUrl: null,                                                                                    sortOrder: 24 },
    { storeId: jede.id, categoryId: catJedeMinuman.id, name: 'Jeruk Hangat',          description: null,                                                                                                                   price: 12000, imageUrl: null,                                                                                    sortOrder: 25 },
    { storeId: jede.id, categoryId: catJedeMinuman.id, name: 'Jeruk Hangat Gula Batu',description: null,                                                                                                                   price: 15000, imageUrl: null,                                                                                    sortOrder: 26 },
    { storeId: jede.id, categoryId: catJedeMinuman.id, name: 'Jeruk Nipis Hangat',    description: null,                                                                                                                   price: 12000, imageUrl: null,                                                                                    sortOrder: 27 },
    { storeId: jede.id, categoryId: catJedeMinuman.id, name: 'Teh Tawar Hangat',      description: null,                                                                                                                   price:  5000, imageUrl: null,                                                                                    sortOrder: 28 },
  ]);

  // ── Jastip: Bakpia Jogja Asri ──
  const [catBakpia, catPaketBakpia] = await db
    .insert(schema.menuCategories)
    .values([
      { storeId: bakpia.id, name: 'Bakpia',         sortOrder: 1 },
      { storeId: bakpia.id, name: 'Paket Oleh-oleh', sortOrder: 2 },
    ])
    .returning();

  await db.insert(schema.menuItems).values([
    { storeId: bakpia.id, categoryId: catBakpia.id,      name: 'Bakpia Kacang Hijau', description: 'Isi 20 biji. Lembut dengan isian kacang hijau manis khas Jogja.',    price: 25000, imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&h=200&fit=crop', sortOrder: 1 },
    { storeId: bakpia.id, categoryId: catBakpia.id,      name: 'Bakpia Coklat',       description: 'Isi 20 biji. Isian coklat premium dengan kulit tipis renyah.',        price: 27000, imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&h=200&fit=crop', sortOrder: 2 },
    { storeId: bakpia.id, categoryId: catBakpia.id,      name: 'Bakpia Keju',         description: 'Isi 20 biji. Perpaduan keju cheddar dan kulit bakpia yang gurih.',    price: 27000, imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&h=200&fit=crop', sortOrder: 3 },
    { storeId: bakpia.id, categoryId: catBakpia.id,      name: 'Bakpia Durian',       description: 'Isi 20 biji. Isian durian asli Jogja, harum dan legit.',              price: 32000, imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&h=200&fit=crop', sortOrder: 4 },
    { storeId: bakpia.id, categoryId: catBakpia.id,      name: 'Bakpia Strawberry',   description: 'Isi 20 biji. Isian selai strawberry dengan sentuhan asam manis.',     price: 27000, imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&h=200&fit=crop', sortOrder: 5 },
    { storeId: bakpia.id, categoryId: catPaketBakpia.id, name: 'Paket 5 Box',         description: 'Pilih 5 varian bakpia, hemat 10%.',                                  price: 112500,imageUrl: null,                                                                                    sortOrder: 1 },
    { storeId: bakpia.id, categoryId: catPaketBakpia.id, name: 'Paket 10 Box',        description: 'Pilih 10 varian bakpia, hemat 15%.',                                 price: 212500,imageUrl: null,                                                                                    sortOrder: 2 },
  ]);

  // ── Jastip: Gudeg Kemasan Bu Sari ──
  const [catGudeg, catLaukGudeg] = await db
    .insert(schema.menuCategories)
    .values([
      { storeId: gudeg.id, name: 'Gudeg',   sortOrder: 1 },
      { storeId: gudeg.id, name: 'Lauk',    sortOrder: 2 },
    ])
    .returning();

  await db.insert(schema.menuItems).values([
    { storeId: gudeg.id, categoryId: catGudeg.id,     name: 'Gudeg Kaleng Kering',  description: 'Gudeg nangka kering khas Jogja dalam kaleng, tahan 7 hari tanpa kulkas.', price: 45000, imageUrl: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=300&h=200&fit=crop', sortOrder: 1 },
    { storeId: gudeg.id, categoryId: catGudeg.id,     name: 'Gudeg Kaleng Basah',   description: 'Gudeg nangka basah, lebih gurih dan berkuah. Tahan 3 hari di kulkas.',     price: 42000, imageUrl: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=300&h=200&fit=crop', sortOrder: 2 },
    { storeId: gudeg.id, categoryId: catGudeg.id,     name: 'Paket Gudeg Komplit',  description: 'Gudeg kering + ayam opor + krecek + telur. Untuk 2 porsi.',               price: 85000, imageUrl: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=300&h=200&fit=crop', sortOrder: 3 },
    { storeId: gudeg.id, categoryId: catLaukGudeg.id, name: 'Ayam Opor',            description: 'Ayam kampung masak opor kuah santan kaya rempah.',                          price: 35000, imageUrl: null,                                                                                    sortOrder: 1 },
    { storeId: gudeg.id, categoryId: catLaukGudeg.id, name: 'Krecek Pedas',         description: 'Krecek (kulit sapi) masak pedas, pelengkap khas gudeg.',                   price: 20000, imageUrl: null,                                                                                    sortOrder: 2 },
    { storeId: gudeg.id, categoryId: catLaukGudeg.id, name: 'Telur Pindang',        description: 'Telur rebus masak pindang, gurih kecoklatan.',                             price: 8000,  imageUrl: null,                                                                                    sortOrder: 3 },
    { storeId: gudeg.id, categoryId: catLaukGudeg.id, name: 'Tahu & Tempe Bacem',   description: 'Tahu dan tempe masak bacem manis legit khas Jogja.',                       price: 15000, imageUrl: null,                                                                                    sortOrder: 4 },
  ]);

  // ── Jastip: Wedang Rempah Jogja ──
  const [catWedang, catKopiLokal] = await db
    .insert(schema.menuCategories)
    .values([
      { storeId: wedang.id, name: 'Wedang & Rempah', sortOrder: 1 },
      { storeId: wedang.id, name: 'Kopi Lokal',      sortOrder: 2 },
    ])
    .returning();

  await db.insert(schema.menuItems).values([
    { storeId: wedang.id, categoryId: catWedang.id,    name: 'Wedang Uwuh Sachet',     description: 'Isi 10 sachet. Rempah khas Jogja: kayu manis, cengkih, jahe, secang.', price: 35000, imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&h=200&fit=crop', sortOrder: 1 },
    { storeId: wedang.id, categoryId: catWedang.id,    name: 'Beras Kencur Sachet',    description: 'Isi 10 sachet. Minuman tradisional menyegarkan dari beras dan kencur.', price: 30000, imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&h=200&fit=crop', sortOrder: 2 },
    { storeId: wedang.id, categoryId: catWedang.id,    name: 'Jahe Merah Sachet',      description: 'Isi 10 sachet. Jahe merah murni, menghangatkan dan menyehatkan.',       price: 32000, imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&h=200&fit=crop', sortOrder: 3 },
    { storeId: wedang.id, categoryId: catWedang.id,    name: 'Kunir Asem Sachet',      description: 'Isi 10 sachet. Kunyit dan asam jawa, segar dan bermanfaat.',            price: 30000, imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&h=200&fit=crop', sortOrder: 4 },
    { storeId: wedang.id, categoryId: catKopiLokal.id, name: 'Kopi Merapi Arabika',    description: 'Biji kopi arabika dari lereng Gunung Merapi. 250g, sudah digiling.',    price: 65000, imageUrl: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=300&h=200&fit=crop', sortOrder: 1 },
    { storeId: wedang.id, categoryId: catKopiLokal.id, name: 'Kopi Robusta Lereng',    description: 'Robusta petik merah dari petani lokal Sleman. 250g.',                  price: 55000, imageUrl: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=300&h=200&fit=crop', sortOrder: 2 },
    { storeId: wedang.id, categoryId: catKopiLokal.id, name: 'Kopi Blend Merapi',      description: 'Campuran arabika-robusta. Seimbang, cocok untuk semua selera.',         price: 58000, imageUrl: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=300&h=200&fit=crop', sortOrder: 3 },
  ]);

  console.log('✅ Menu items seeded');
  console.log('');
  console.log('🎉 Seed complete!\n');
  console.log('Akun demo:');
  console.log('  ✅ Budi Santoso  | 6281234567890 | password123 | Jogja 5 malam, 1 kamar');
  console.log('  ✅ Rini Kusuma   | 6287777777777 | password123 | Jogja 1 malam, 1 kamar');
  console.log('  ✅ Dodi Pratama  | 6281111111111 | password123 | Jogja 5 malam, 2 kamar → room selector');
  console.log('  ✅ Milla Putri   | 6282222222222 | password123 | Jogja + Malang → hanya kamar Jogja');
  console.log('  ⚠️  Andi Wijaya   | 6285555555555 | password123 | Semarang → hanya lihat');
  console.log('  🚫 Sari Dewi     | 6289876543210 | password123 | Tanpa reservasi → hanya lihat');
}

seed().catch((err) => { console.error('❌ Seed failed:', err); process.exit(1); });
