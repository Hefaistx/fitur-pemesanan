import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log('🔧 Applying schema changes...');

  await sql`
    CREATE TABLE IF NOT EXISTS "delivery_period_groups" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" text NOT NULL,
      "description" text
    )
  `;

  await sql`DROP TABLE IF EXISTS "delivery_slots" CASCADE`;

  await sql`
    CREATE TABLE "delivery_slots" (
      "id" serial PRIMARY KEY NOT NULL,
      "group_id" integer NOT NULL REFERENCES "delivery_period_groups"("id"),
      "cutoff_time" varchar(5) NOT NULL,
      "delivery_time" varchar(5) NOT NULL,
      "is_active" boolean DEFAULT true NOT NULL,
      "sort_order" integer DEFAULT 0
    )
  `;

  await sql`ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "delivery_group_id" integer REFERENCES "delivery_period_groups"("id")`;
  await sql`ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "type" varchar(20) DEFAULT 'fnb' NOT NULL`;

  console.log('✅ Schema updated!');
  console.log('👉 Now run: npm run db:seed');
}

migrate().catch((err) => { console.error('❌ Migration failed:', err); process.exit(1); });
