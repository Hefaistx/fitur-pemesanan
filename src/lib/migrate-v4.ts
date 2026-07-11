import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log('🔧 Applying payment columns...');
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status varchar(20) DEFAULT 'pending' NOT NULL`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS va_number varchar(20)`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_deadline timestamp`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date varchar(10)`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_time varchar(5)`;
  await sql`ALTER TABLE orders DROP COLUMN IF EXISTS wa_message_sent`;
  console.log('✅ Done! Run npm run db:seed to refresh data.');
}

migrate().catch((err) => { console.error('❌', err); process.exit(1); });
