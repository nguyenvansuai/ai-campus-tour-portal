import type { Metadata } from "next";
import { env } from "@/lib/env";
import { getSecretSetting } from "@/lib/settings";
import { DRIVE_ACCOUNT_SETTING } from "@/lib/storage";
import { driveRedirectUri } from "@/lib/storage/drive-oauth";
import { requirePermission } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Lưu trữ file · AI Campus Tour" };

export default async function StoragePage({ searchParams }: PageProps<"/admin/luu-tru">) {
  await requirePermission("system.configure", { kind: "system" });
  const params = await searchParams;
  const config = env();
  const account = config.STORAGE_DRIVER === "drive" ? await getSecretSetting(DRIVE_ACCOUNT_SETTING) : null;

  return (
    <main className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-bold">Lưu trữ file minh chứng</h1>
      {params.ok ? <p role="status" className="text-green-700">Đã kết nối Google Drive.</p> : null}
      {params.loi ? (
        <p role="alert" className="text-destructive">
          Kết nối thất bại: {String(params.loi)}
        </p>
      ) : null}

      {config.STORAGE_DRIVER === "local" ? (
        <p>
          Đang lưu file trên ổ đĩa máy chủ (<code>{config.UPLOAD_DIR}</code>), chỉ dùng khi chạy thử. Trên VPS chính thức đặt{" "}
          <code>STORAGE_DRIVER=drive</code>.
        </p>
      ) : (
        <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <p>
            Trạng thái: {account ? <strong>Đã kết nối với {account}</strong> : <strong className="text-destructive">Chưa kết nối</strong>}
          </p>
          <p className="text-sm text-muted-foreground">
            Đăng nhập bằng tài khoản Gmail chứa dung lượng lưu trữ (200 GB). Portal chỉ được quyền với file do chính portal tạo (quyền
            drive.file), không đọc được các file khác trong Drive. File được lưu trong thư mục &quot;{config.GOOGLE_DRIVE_ROOT_FOLDER}&quot;.
          </p>
          <a href="/api/admin/drive/connect" className="inline-flex h-12 w-fit items-center rounded-lg bg-primary px-5 font-medium text-primary-foreground">
            {account ? "Kết nối lại Google Drive" : "Kết nối Google Drive"}
          </a>
          <p className="text-xs text-muted-foreground">
            Cần thêm Redirect URI này vào OAuth client trên Google Cloud: <code className="break-all">{driveRedirectUri()}</code>
          </p>
        </section>
      )}
    </main>
  );
}
