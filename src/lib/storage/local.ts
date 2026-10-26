import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageProvider, StoredObject } from "./index";

/** Lưu file trên đĩa (dev/test). Production dùng Google Drive. */
export class LocalStorage implements StorageProvider {
  readonly driver = "local" as const;
  constructor(private readonly dir: string) {}

  async put(file: { name: string; bytes: Uint8Array }): Promise<StoredObject> {
    const root = path.resolve(this.dir);
    await mkdir(root, { recursive: true });
    const externalId = `${randomUUID()}${path.extname(file.name).slice(0, 10)}`;
    await writeFile(path.join(root, externalId), file.bytes);
    return { driver: "local", externalId };
  }

  async get(externalId: string): Promise<Uint8Array> {
    if (!/^[0-9a-f-]{36}(\.[a-z0-9]{1,9})?$/i.test(externalId)) throw new Error("Mã file không hợp lệ.");
    return new Uint8Array(await readFile(path.join(path.resolve(this.dir), externalId)));
  }
}
