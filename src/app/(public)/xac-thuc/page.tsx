import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = { title: "Xác thực chứng nhận · AI Campus Tour" };

export default async function VerifySearchPage({ searchParams }: PageProps<"/xac-thuc">) {
  const code = (await searchParams).ma;
  if (typeof code === "string" && code.trim()) redirect(`/xac-thuc/${encodeURIComponent(code.trim().toUpperCase())}`);
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-12">
      <h1 className="text-2xl font-bold">Xác thực chứng nhận</h1>
      <p className="text-sm text-muted-foreground">Nhập mã 10 ký tự in trên chứng nhận AI Campus Tour.</p>
      <form className="flex flex-col gap-3">
        <Label htmlFor="ma">Mã chứng nhận</Label>
        <Input id="ma" name="ma" required maxLength={10} autoCapitalize="characters" />
        <Button type="submit">Xác thực</Button>
      </form>
    </main>
  );
}
