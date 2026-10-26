import { describe, expect, it, vi } from "vitest";
import { DriveStorage } from "@/lib/storage/drive";

function fakeDrive() {
  const calls: { url: string; method: string; body?: unknown }[] = [];
  let nextId = 1;
  const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, method: init?.method ?? "GET", body: init?.body });
    const json = (value: unknown) => new Response(JSON.stringify(value), { status: 200 });
    if (url.startsWith("https://oauth2.googleapis.com/token")) return json({ access_token: "tok", expires_in: 3600 });
    if (url.includes("/drive/v3/files?q=")) return json({ files: [] });
    if (url.includes("/upload/drive/v3/files")) return json({ id: "file-xyz" });
    if (url.includes("/drive/v3/files?fields=id")) return json({ id: `folder-${nextId++}` });
    if (url.includes("alt=media")) return new Response(new Uint8Array([1, 2, 3]), { status: 200 });
    return new Response("not found", { status: 404 });
  });
  return { calls, fetchImpl };
}

describe("DriveStorage", () => {
  it("tạo cây thư mục, tải file lên đúng thư mục cha, dùng lại access token và thư mục đã tạo", async () => {
    const { calls, fetchImpl } = fakeDrive();
    const drive = new DriveStorage({ clientId: "c", clientSecret: "s", refreshToken: async () => "r", rootFolder: "AI Campus Tour" }, fetchImpl as never);

    const first = await drive.put({ name: "cv.pdf", type: "application/pdf", bytes: new Uint8Array([9]) }, ["ĐH A", "SV 1", "M1"]);
    expect(first).toEqual({ driver: "drive", externalId: "file-xyz" });
    expect(calls.filter((c) => c.url.includes("fields=id") && !c.url.includes("upload"))).toHaveLength(4);
    const upload = calls.find((c) => c.url.includes("/upload/"))!;
    expect(new TextDecoder().decode(upload.body as Uint8Array)).toContain('"parents":["folder-4"]');

    await drive.put({ name: "anh.png", type: "image/png", bytes: new Uint8Array([1]) }, ["ĐH A", "SV 1", "M1"]);
    expect(calls.filter((c) => c.url.startsWith("https://oauth2"))).toHaveLength(1);
    expect(calls.filter((c) => c.url.includes("fields=id") && !c.url.includes("upload"))).toHaveLength(4);
  });

  it("tải file về", async () => {
    const { fetchImpl } = fakeDrive();
    const drive = new DriveStorage({ clientId: "c", clientSecret: "s", refreshToken: async () => "r", rootFolder: "R" }, fetchImpl as never);
    expect(Array.from(await drive.get("file-xyz"))).toEqual([1, 2, 3]);
  });
});
