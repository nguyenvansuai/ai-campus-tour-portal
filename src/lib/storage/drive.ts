import type { StorageProvider, StoredObject } from "./index";

type DriveConfig = {
  clientId: string;
  clientSecret: string;
  /** Lấy refresh token (lưu mã hóa trong database, do Super Admin kết nối qua giao diện). */
  refreshToken: () => Promise<string | null>;
  rootFolder: string;
};

const FOLDER_MIME = "application/vnd.google-apps.folder";

/**
 * Lưu file vào Google Drive của tài khoản dự án qua REST API (OAuth refresh token, scope drive.file:
 * portal chỉ thấy file/thư mục do chính portal tạo). File không được chia sẻ công khai.
 */
export class DriveStorage implements StorageProvider {
  readonly driver = "drive" as const;
  private accessToken: { value: string; expiresAt: number } | null = null;
  private readonly folderCache = new Map<string, string>();

  constructor(
    private readonly config: DriveConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async token(): Promise<string> {
    if (this.accessToken && this.accessToken.expiresAt > Date.now() + 60_000) return this.accessToken.value;
    const refreshToken = await this.config.refreshToken();
    if (!refreshToken) throw new Error("Chưa kết nối Google Drive. Super Admin vào Quản trị → Lưu trữ để kết nối.");
    const response = await this.fetchImpl("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!response.ok) throw new Error(`Không lấy được quyền truy cập Google Drive (HTTP ${response.status}). Kiểm tra refresh token.`);
    const body = (await response.json()) as { access_token: string; expires_in: number };
    this.accessToken = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
    return body.access_token;
  }

  private async api<T>(url: string, init: RequestInit = {}): Promise<T> {
    const response = await this.fetchImpl(url, { ...init, headers: { ...init.headers, authorization: `Bearer ${await this.token()}` } });
    if (!response.ok) throw new Error(`Google Drive từ chối yêu cầu (HTTP ${response.status}).`);
    return (await response.json()) as T;
  }

  private async ensureFolder(name: string, parentId: string | null): Promise<string> {
    const key = `${parentId ?? "root"}/${name}`;
    const cached = this.folderCache.get(key);
    if (cached) return cached;
    const escaped = name.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const q = `name = '${escaped}' and mimeType = '${FOLDER_MIME}' and trashed = false and '${parentId ?? "root"}' in parents`;
    const found = await this.api<{ files: { id: string }[] }>(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`);
    let id = found.files[0]?.id;
    if (!id) {
      const created = await this.api<{ id: string }>("https://www.googleapis.com/drive/v3/files?fields=id", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: parentId ? [parentId] : undefined }),
      });
      id = created.id;
    }
    this.folderCache.set(key, id);
    return id;
  }

  async put(file: { name: string; type: string; bytes: Uint8Array }, folderPath: string[]): Promise<StoredObject> {
    let parent = await this.ensureFolder(this.config.rootFolder, null);
    for (const segment of folderPath) parent = await this.ensureFolder(segment, parent);

    const boundary = `aict-${crypto.randomUUID()}`;
    const metadata = JSON.stringify({ name: file.name, parents: [parent] });
    const head = new TextEncoder().encode(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${file.type}\r\n\r\n`,
    );
    const tail = new TextEncoder().encode(`\r\n--${boundary}--`);
    const body = new Uint8Array(head.length + file.bytes.length + tail.length);
    body.set(head, 0);
    body.set(file.bytes, head.length);
    body.set(tail, head.length + file.bytes.length);

    const created = await this.api<{ id: string }>("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", {
      method: "POST",
      headers: { "content-type": `multipart/related; boundary=${boundary}` },
      body,
    });
    return { driver: "drive", externalId: created.id };
  }

  async get(externalId: string): Promise<Uint8Array> {
    const response = await this.fetchImpl(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(externalId)}?alt=media`, {
      headers: { authorization: `Bearer ${await this.token()}` },
    });
    if (!response.ok) throw new Error(`Không tải được file từ Google Drive (HTTP ${response.status}).`);
    return new Uint8Array(await response.arrayBuffer());
  }
}
