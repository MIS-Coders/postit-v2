import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import 'dotenv/config'; // Pastikan dotenv ter-load jika menggunakan .env

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is missing');
}

// Gunakan koneksi tunggal (max: 1) untuk migrasi
const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql);

async function runMigrate() {
  console.log('⏳ Memulai migrasi database...');
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Migrasi berhasil diselesaikan!');
  } catch (error) {
    console.error('❌ Gagal melakukan migrasi:', error);
  } finally {
    await sql.end(); // Menutup koneksi database agar tidak hang
    process.exit(0);
  }
}

runMigrate();