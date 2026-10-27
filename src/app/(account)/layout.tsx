import { AppShell } from "@/components/shell/app-shell";

export default function AccountLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
