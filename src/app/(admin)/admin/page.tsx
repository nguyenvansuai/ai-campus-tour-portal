import type { Metadata } from "next";
import Link from "next/link";
import { Icon, type IconName } from "@/components/shell/icons";
import { adminOverview } from "@/modules/school-dashboard/overview";

export const metadata: Metadata = { title: "Quản trị · AI Campus Tour" };

type Stat = { label: string; value: number; href: string; icon: IconName; tone?: "warn" };

export default async function AdminHomePage() {
  const o = await adminOverview();
  const stats: Stat[] = [
    { label: "SV đang học", value: o.active, href: "/truong", icon: "users" },
    { label: "SV tạm dừng (21 ngày không học)", value: o.inactive, href: "/truong", icon: "users", tone: o.inactive ? "warn" : undefined },
    { label: "Đã hoàn thành", value: o.completed, href: "/truong", icon: "trophy" },
    { label: "Báo cáo chờ chấm", value: o.waitingReports, href: "/nhan-su?tat_ca=1", icon: "check" },
    { label: "Báo cáo quá hạn phản hồi", value: o.overdueReports, href: "/nhan-su?tat_ca=1", icon: "check", tone: o.overdueReports ? "warn" : undefined },
    { label: "Dự án cuối chờ chấm", value: o.waitingProjects, href: "/nhan-su/du-an", icon: "clipboard" },
    { label: "Dự án Đạt, chưa cấp chứng nhận", value: o.awaitingCertificate, href: "/truong/chung-nhan", icon: "badge" },
    { label: "Chứng nhận đã cấp", value: o.issued, href: "/admin/chung-nhan", icon: "badge" },
    { label: "Trường chờ xác minh", value: o.pendingSchools, href: "/admin/truong", icon: "building", tone: o.pendingSchools ? "warn" : undefined },
  ];
  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Tổng quan</h1>
        <p className="text-sm text-muted-foreground">Số liệu toàn hệ thống. Bấm vào thẻ để xem chi tiết.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="flex items-center gap-4 rounded-xl border border-border p-4 shadow-sm transition-colors hover:border-primary/50 hover:bg-primary/5">
            <span className={s.tone === "warn" ? "rounded-lg bg-destructive/10 p-3 text-destructive" : "rounded-lg bg-primary/10 p-3 text-primary"}>
              <Icon name={s.icon} className="size-6" />
            </span>
            <span className="flex flex-col">
              <span className="text-2xl font-bold">{s.value.toLocaleString("vi-VN")}</span>
              <span className="text-sm text-muted-foreground">{s.label}</span>
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
