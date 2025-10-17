/**
 * Drizzle ORM データベース接続ヘルパー
 * Cloudflare Workers環境でD1データベースに接続する
 */
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/db/schema';

// Cloudflare Workers D1型定義（Next.jsビルド時のため）
type D1Database = any;

/**
 * D1データベースインスタンスからDrizzle ORMインスタンスを作成
 * @param database - Cloudflare D1 Database instance
 * @returns Drizzle ORM instance with schema
 */
export function getDb(database: D1Database) {
  return drizzle(database, { schema });
}

/**
 * 型定義: Drizzle ORM instance
 */
export type Database = ReturnType<typeof getDb>;
