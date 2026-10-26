import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOpenEnrollment } from "@/modules/enrollment/service";
import { OnboardingForm } from "@/modules/enrollment/ui/onboarding-form";
import { getCurrentSession } from "@/modules/identity/session";
import { listSchoolsForPicker, peekActivationCode } from "@/modules/org/service";

export const metadata: Metadata = { title: "Bắt đầu lộ trình · AI Campus Tour" };

export default async function StartPage({ searchParams }: PageProps<"/bat-dau">) {
  const params = await searchParams;
  const rawCode = typeof params.ma === "string" ? params.ma : "";
  const current = await getCurrentSession();
  if (!current) {
    const next = rawCode ? `/bat-dau?ma=${encodeURIComponent(rawCode)}` : "/bat-dau";
    redirect(`/dang-nhap?next=${encodeURIComponent(next)}`);
  }
  if (await getOpenEnrollment(current.user.id)) redirect("/hoc");

  const [schools, code] = await Promise.all([listSchoolsForPicker(), rawCode ? peekActivationCode(rawCode) : Promise.resolve(null)]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Bắt đầu lộ trình 30 ngày</h1>
        <p className="text-sm text-muted-foreground">Mất khoảng 3 phút. Ngày bạn hoàn tất bước này là ngày 0 của lộ trình.</p>
      </div>
      <OnboardingForm
        defaultName={current.user.name}
        schools={schools.map((s) => ({ id: s.id, name: s.name, faculties: s.faculties.map((f) => ({ id: f.id, name: f.name })) }))}
        code={code ? { code: code.code, schoolId: code.schoolId, eventName: code.eventName } : null}
        codeInvalid={Boolean(rawCode) && !code}
      />
    </main>
  );
}
