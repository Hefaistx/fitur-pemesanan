import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log('🔧 Creating complaints table...');
  await sql`
    CREATE TABLE IF NOT EXISTS complaints (
      id            serial PRIMARY KEY,
      user_id       integer NOT NULL REFERENCES users(id),
      reservation_id integer NOT NULL REFERENCES reservations(id),
      jenis         varchar(50) NOT NULL,
      kronologi     text NOT NULL,
      status        varchar(30) NOT NULL DEFAULT 'baru',
      property_name text NOT NULL,
      room_number   varchar(20),
      created_at    timestamp NOT NULL DEFAULT now(),
      updated_at    timestamp NOT NULL DEFAULT now()
    )
  `;
  console.log('✅ Done — tabel complaints siap.');
}

migrate().catch((err) => { console.error('❌', err); process.exit(1); });
