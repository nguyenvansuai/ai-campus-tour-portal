import { AppShell } from "@/components/shell/app-shell";

export default function StudentLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
