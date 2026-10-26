// Các ô đồng ý theo docs/DIEU_KHOAN_DU_LIEU.md (mục B).
export const CONSENT_KEYS = [
  "data_processing",
  "share_with_school",
  "sponsor_referral",
  "anonymized_samples",
  "zalo_notifications",
] as const;
export type ConsentKey = (typeof CONSENT_KEYS)[number];

export const REQUIRED_CONSENTS: readonly ConsentKey[] = ["data_processing", "share_with_school"];
