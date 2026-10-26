import { env } from "@/lib/env";
import { getSecretSetting } from "@/lib/settings";
import { DriveStorage } from "./drive";
import { LocalStorage } from "./local";

export type StoredObject = { driver: "local" | "drive"; externalId: string };

export interface StorageProvider {
  readonly driver: "local" | "drive";
  /** Lưu file vào thư mục lồng nhau `folderPath` (vd. ["ĐH Công Thương", "2001234 – Nguyễn Văn A", "M1"]). */
  put(file: { name: string; type: string; bytes: Uint8Array }, folderPath: string[]): Promise<StoredObject>;
  get(externalId: string): Promise<Uint8Array>;
}

let provider: StorageProvider | undefined;

export function storage(): StorageProvider {
  if (!provider) {
    const config = env();
    provider =
      config.STORAGE_DRIVER === "drive"
        ? new DriveStorage({
            clientId: config.GOOGLE_CLIENT_ID!,
            clientSecret: config.GOOGLE_CLIENT_SECRET!,
            refreshToken: () => getSecretSetting(DRIVE_TOKEN_SETTING),
            rootFolder: config.GOOGLE_DRIVE_ROOT_FOLDER,
          })
        : new LocalStorage(config.UPLOAD_DIR);
  }
  return provider;
}

export const DRIVE_TOKEN_SETTING = "google_drive_refresh_token";
export const DRIVE_ACCOUNT_SETTING = "google_drive_account";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ALLOWED_UPLOAD_TYPES = /^(image\/(png|jpe?g|webp|gif|heic)|application\/pdf)$/;
