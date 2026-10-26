import type { CatalogResource, LessonResourceRef } from "@/modules/curriculum/types";

const KIND_LABEL: Record<CatalogResource["kind"], string> = {
  video: "Video",
  text: "Bài viết",
  course: "Khóa học",
  tool: "Công cụ",
  dataset: "Dữ liệu",
  jobsite: "Tuyển dụng",
};
const LANG_LABEL = { vi: "Tiếng Việt", en: "Tiếng Anh", "vi-en": "Việt/Anh" } as const;
const COST: Record<CatalogResource["cost"], { label: string; className: string }> = {
  free: { label: "Miễn phí", className: "bg-green-700/10 text-green-800 dark:text-green-300" },
  conditional: { label: "Xem miễn phí, thực hành cần gói trả phí", className: "bg-amber-500/15 text-amber-800 dark:text-amber-300" },
  paid: { label: "Có phí", className: "bg-foreground/10" },
};

export function ResourceCard({ resource, reference }: { resource: CatalogResource; reference: LessonResourceRef }) {
  const cost = COST[resource.cost];
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded bg-foreground/10 px-2 py-0.5 font-semibold">{resource.code}</span>
        <span>{KIND_LABEL[resource.kind]}</span>
        <span>· {LANG_LABEL[resource.language]}</span>
        <span className={`rounded px-2 py-0.5 ${cost.className}`}>{cost.label}</span>
        {resource.code === "N1" ? <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">Tham khảo</span> : null}
      </div>
      <a href={resource.url} target="_blank" rel="noopener" className="font-medium text-primary underline-offset-4 hover:underline">
        {resource.title}
      </a>
      <span className="text-xs text-muted-foreground">{resource.provider}</span>
      {reference.focus ? <span className="text-sm">Xem: {reference.focus}</span> : null}
      {reference.summary ? <span className="text-sm text-muted-foreground">{reference.summary}</span> : null}
      {resource.requirement ? <span className="text-xs text-muted-foreground">Lưu ý: {resource.requirement}</span> : null}
    </li>
  );
}
