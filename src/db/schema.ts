// Tập hợp schema của mọi module. Mỗi module khai báo bảng trong src/modules/<module-id>/schema.ts
// rồi export lại ở đây để Drizzle và drizzle-kit nhìn thấy.
export * from "@/modules/identity/schema";
