// Node entry point: Express serves the shared API (server/api.ts) plus the Vite frontend
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { Database } from './server/db';
import { createApi } from './server/api';
import { FileStorage, FileImageStore } from './server/fileStorage';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--production');
const port = Number(process.env.PORT) || 3000;

// DATA_DIR lets hosting mount a persistent disk (and tests use a temp folder)
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'));
const UPLOADS_DIR = path.resolve(__dirname, 'public', 'uploads');

const db = new Database(new FileStorage(DATA_DIR), {
  adminPin: process.env.ADMIN_PIN?.trim(),
  includeSampleOrder: !isProduction,
});

const handleApi = createApi(db, new FileImageStore(UPLOADS_DIR), {
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL,
  adminPinOverride: process.env.ADMIN_PIN,
  maxUploadBytes: 5 * 1024 * 1024,
});

const app = express();
app.set('trust proxy', 1); // correct client IP behind Render/Railway/Nginx for rate limiting

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use('/api', express.json({ limit: '10mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

app.use('/api', async (req, res) => {
  const result = await handleApi({
    method: req.method,
    path: req.originalUrl.split('?')[0],
    query: new URLSearchParams(req.originalUrl.split('?')[1] || ''),
    body: req.body,
    header: (name) => req.get(name),
    ip: req.ip || 'unknown',
  });
  if (result.headers) res.set(result.headers);
  res.status(result.status).json(result.body);
});

// Malformed JSON / oversized body from express.json
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error('Unhandled error:', err);
  const message =
    err.type === 'entity.too.large' ? 'Dữ liệu gửi lên quá lớn' : status < 500 ? 'Yêu cầu không hợp lệ' : 'Lỗi máy chủ';
  res.status(status).json({ success: false, error: message });
});

async function startServer() {
  if ((process.env.ADMIN_PIN?.trim() || db.getSettings().adminPin) === '123456') {
    console.warn('[LƯU Ý] Mã PIN quản trị đang là 123456. Có thể đổi trong Quản trị > Cài Đặt Tiệm.');
  }

  if (isProduction) {
    const distDir = path.resolve(__dirname, 'dist');
    if (!fs.existsSync(path.join(distDir, 'index.html'))) {
      throw new Error('Chưa có thư mục dist. Hãy chạy "npm run build" trước khi "npm start".');
    }
    app.use(express.static(distDir));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[TIỆM NHỎ AN YÊN] Server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
