// Tập hợp schema của mọi module. Mỗi module khai báo bảng trong src/modules/<module-id>/schema.ts
// rồi export lại ở đây để Drizzle và drizzle-kit nhìn thấy.
export * from "@/modules/identity/schema";
export * from "@/lib/rate-limit-schema";
export * from "@/lib/audit-schema";
export * from "@/modules/org/schema";
export * from "@/modules/enrollment/schema";
export * from "@/modules/learning/schema";
export * from "@/lib/settings-schema";
export * from "@/modules/review/schema";
export * from "@/modules/notifications/schema";
