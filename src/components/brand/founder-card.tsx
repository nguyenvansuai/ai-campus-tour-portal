import Image from "next/image";

export function FounderCard() {
  return (
    <section aria-labelledby="founder-heading" className="flex flex-col gap-4 rounded-xl border border-border p-5">
      <h2 id="founder-heading" className="text-lg font-semibold">
        Người sáng lập
      </h2>
      <div className="flex items-center gap-4">
        <Image
          src="/brand/nguyen-van-su.webp"
          alt="Nguyễn Văn Sự (Sự AI)"
          width={400}
          height={400}
          unoptimized
          className="size-20 shrink-0 rounded-full object-cover"
        />
        <div className="flex flex-col gap-1">
          <p className="font-semibold">Nguyễn Văn Sự (Sự AI)</p>
          <p className="text-sm text-muted-foreground">
            Người khởi xướng AI Campus Tour, sáng lập Sự AI – đào tạo AI ứng dụng cho người đi làm và doanh nghiệp, hơn 100.000 người theo dõi.
          </p>
          <a href="https://www.suai.vn" target="_blank" rel="noopener" className="text-sm font-medium text-primary">
            suai.vn
          </a>
        </div>
      </div>
    </section>
  );
}
