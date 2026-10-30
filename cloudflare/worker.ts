// Cloudflare entry point.
// - Static frontend (dist/) is served by Workers Static Assets.
// - /api/* and /uploads/* go to ONE Durable Object ("main") that owns all shop data in its
//   private SQLite database. A single instance processes requests one at a time, so stock
//   checks and decrements can never race, exactly like the single Node process.
import { DurableObject } from 'cloudflare:workers';
import { Database, StorageAdapter, StoreChange, StoreData } from '../server/db';
import { createApi, ApiHandler, ImageStore } from '../server/api';

interface Env {
  ASSETS: Fetcher;
  STORE: DurableObjectNamespace<ShopStore>;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  ADMIN_PIN?: string;
}

// SQLite-backed DO storage caps a single value at 2MB
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 - 1024;
const MAX_BODY_BYTES = 10 * 1024 * 1024;

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { ...SECURITY_HEADERS, ...headers } });

class SqliteStore implements StorageAdapter, ImageStore {
  private sql: SqlStorage;

  constructor(private storage: DurableObjectStorage) {
    this.sql = storage.sql;
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS docs (key TEXT PRIMARY KEY, json TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, pos INTEGER NOT NULL, json TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, pos INTEGER NOT NULL, json TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS images (name TEXT PRIMARY KEY, mime TEXT NOT NULL, data BLOB NOT NULL);
    `);
  }

  load(): StoreData | null {
    const docs = new Map(
      this.sql.exec<{ key: string; json: string }>('SELECT key, json FROM docs').toArray().map((r) => [r.key, r.json])
    );
    if (!docs.has('settings')) return null;
    // Arrays are kept newest-first in memory; pos grows with insertion order
    const rows = (table: string) =>
      this.sql.exec<{ json: string }>(`SELECT json FROM ${table} ORDER BY pos DESC`).toArray().map((r) => JSON.parse(r.json));
    return {
      settings: JSON.parse(docs.get('settings')!),
      categories: JSON.parse(docs.get('categories') || '[]'),
      articles: JSON.parse(docs.get('articles') || '[]'),
      products: rows('products'),
      orders: rows('orders'),
    };
  }

  save(data: StoreData, change: StoreChange): void {
    this.storage.transactionSync(() => {
      const putDoc = (key: string, value: unknown) =>
        this.sql.exec('INSERT OR REPLACE INTO docs (key, json) VALUES (?, ?)', key, JSON.stringify(value));

      if (change.all) {
        putDoc('settings', data.settings);
        putDoc('categories', data.categories);
        putDoc('articles', data.articles);
        for (const table of ['products', 'orders'] as const) {
          this.sql.exec(`DELETE FROM ${table}`);
          const list = data[table];
          list.forEach((item, i) =>
            this.sql.exec(`INSERT INTO ${table} (id, pos, json) VALUES (?, ?, ?)`, item.id, list.length - i, JSON.stringify(item))
          );
        }
        return;
      }

      if (change.settings) putDoc('settings', data.settings);
      if (change.articles) putDoc('articles', data.articles);

      const upsert = (table: 'products' | 'orders', ids: string[] = []) => {
        for (const id of new Set(ids)) {
          const item = (data[table] as { id: string }[]).find((x) => x.id === id);
          if (!item) continue;
          // New rows go on top (max pos + 1); existing rows keep their position
          this.sql.exec(
            `INSERT INTO ${table} (id, pos, json)
             VALUES (?, (SELECT COALESCE(MAX(pos), 0) + 1 FROM ${table}), ?)
             ON CONFLICT(id) DO UPDATE SET json = excluded.json`,
            id,
            JSON.stringify(item)
          );
        }
      };
      upsert('products', change.products);
      upsert('orders', change.orders);
      for (const id of change.deletedProducts || []) this.sql.exec('DELETE FROM products WHERE id = ?', id);
    });
  }

  put(name: string, mimeType: string, bytes: Uint8Array): void {
    this.sql.exec('INSERT OR REPLACE INTO images (name, mime, data) VALUES (?, ?, ?)', name, mimeType, bytes);
  }

  getImage(name: string): { mime: string; data: ArrayBuffer } | null {
    const rows = this.sql.exec<{ mime: string; data: ArrayBuffer }>('SELECT mime, data FROM images WHERE name = ?', name).toArray();
    return rows[0] || null;
  }
}

export class ShopStore extends DurableObject<Env> {
  private store: SqliteStore;
  private handleApi: ApiHandler;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.store = new SqliteStore(ctx.storage);
    const db = new Database(this.store, { adminPin: env.ADMIN_PIN?.trim(), includeSampleOrder: false });
    this.handleApi = createApi(db, this.store, {
      geminiApiKey: env.GEMINI_API_KEY,
      geminiModel: env.GEMINI_MODEL,
      adminPinOverride: env.ADMIN_PIN,
      maxUploadBytes: MAX_UPLOAD_BYTES,
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/uploads/')) {
      const image = this.store.getImage(decodeURIComponent(url.pathname.slice('/uploads/'.length)));
      if (!image) return new Response('Not found', { status: 404 });
      return new Response(image.data, {
        headers: {
          ...SECURITY_HEADERS,
          'Content-Type': image.mime,
          // File names are unique per upload, so they can be cached forever
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    let body: unknown = undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      if (Number(request.headers.get('content-length') || 0) > MAX_BODY_BYTES) {
        return json({ success: false, error: 'Dữ liệu gửi lên quá lớn' }, 413);
      }
      const text = await request.text();
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          return json({ success: false, error: 'Yêu cầu không hợp lệ' }, 400);
        }
      }
    }

    const result = await this.handleApi({
      method: request.method,
      path: url.pathname,
      query: url.searchParams,
      body,
      header: (name) => request.headers.get(name) ?? undefined,
      ip: request.headers.get('cf-connecting-ip') || 'unknown',
    });
    return json(result.body, result.status, result.headers);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith('/api/') || pathname.startsWith('/uploads/')) {
      return env.STORE.get(env.STORE.idFromName('main')).fetch(request);
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
