// Node persistence: whole store in data/store.json, uploaded images in public/uploads
import fs from 'node:fs';
import path from 'node:path';
import { StorageAdapter, StoreData } from './db';
import { ImageStore } from './api';

export class FileStorage implements StorageAdapter {
  private file: string;

  constructor(private dir: string) {
    this.file = path.join(dir, 'store.json');
  }

  load(): StoreData | null {
    if (!fs.existsSync(this.file)) return null;
    // Let a corrupt file throw instead of silently re-seeding over real orders
    return JSON.parse(fs.readFileSync(this.file, 'utf-8'));
  }

  save(data: StoreData): void {
    fs.mkdirSync(this.dir, { recursive: true });
    // Write to a temp file then rename, so a crash mid-write never leaves a truncated store.json
    const tmpFile = `${this.file}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, this.file);
  }
}

export class FileImageStore implements ImageStore {
  constructor(private dir: string) {
    fs.mkdirSync(dir, { recursive: true });
  }

  put(name: string, _mimeType: string, bytes: Uint8Array): void {
    fs.writeFileSync(path.join(this.dir, path.basename(name)), bytes);
  }
}
