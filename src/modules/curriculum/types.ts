export type Track = "A" | "B" | "C";

export const TRACK_LABELS: Record<Track, string> = {
  A: "Văn phòng – Marketing – Kinh doanh",
  B: "Kế toán – Tài chính – Ngân hàng",
  C: "Công nghệ thông tin",
};

export type ModuleId = "M0" | "M1" | "M2" | "M3" | "M4" | "M5";

/** Mức chi phí của nguồn học: free = miễn phí; conditional = xem miễn phí nhưng thực hành cần gói trả phí/tài khoản trường; paid = có phí. */
export type CostTier = "free" | "conditional" | "paid";

export type ResourceKind = "video" | "text" | "course" | "tool" | "dataset" | "jobsite";

export type CatalogResource = {
  code: string;
  title: string;
  provider: string;
  kind: ResourceKind;
  language: "vi" | "en" | "vi-en";
  cost: CostTier;
  /** Điều kiện để thực hành, vd. "Cần gói Claude Pro". */
  requirement?: string;
  url: string;
  /** Ngày kiểm tra link gần nhất (yyyy-mm-dd) và cách kiểm tra. */
  lastChecked: string;
  checkNote?: string;
};

export type LessonResourceRef = {
  code: string;
  /** Cần xem/đọc phần nào (vd. "Chủ đề 7"), giúp SV không phải học cả khóa. */
  focus?: string;
  /** Tóm tắt tiếng Việt 1–3 ý do đội viết. */
  summary?: string;
};

export type EvidenceField =
  | { key: string; label: string; type: "text"; placeholder?: string; minLength?: number }
  | { key: string; label: string; type: "textarea"; placeholder?: string; minLength?: number }
  | { key: string; label: string; type: "link"; placeholder?: string }
  | { key: string; label: string; type: "file"; accept: string }
  | { key: string; label: string; type: "number"; unit: string };

export type LessonContent = {
  goal: string;
  why: string;
  /** Kiến thức cốt lõi, mỗi ý 1–2 câu. */
  keyIdeas: string[];
  /** Các bước tự làm, theo thứ tự. */
  steps: { title: string; detail: string }[];
  /** Prompt mẫu để SV sao chép và sửa. */
  prompts: { title: string; text: string }[];
  /** Mô tả một bài đạt chuẩn. */
  example: string;
  commonMistakes: string[];
  selfCheck: string[];
  /** Đường làm bằng công cụ miễn phí (khi cách chính cần gói trả phí). */
  freePath?: string;
  resources: LessonResourceRef[];
  evidence: EvidenceField[];
};

export type Lesson = {
  /** 1–12 theo đề cương. */
  number: number;
  slug: string;
  moduleId: ModuleId;
  title: string;
  minutes: number;
  /** Nội dung chung, hoặc riêng theo khối ngành (buổi 7–9). */
  content: LessonContent | Record<Track, LessonContent>;
  /** Chủ đề tương ứng trong khóa N1 (tham khảo), theo khối nếu khác nhau. */
  n1Topics?: string;
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  /** Vị trí đáp án đúng trong `options`. */
  answer: number;
  explanation: string;
};

export type QuizBank = {
  id: "M1" | "M1-SAFE" | "M2" | "M3-AB" | "M3-C";
  title: string;
  /** Số câu rút ngẫu nhiên mỗi lần làm. */
  drawCount: number;
  passPercent: number;
  questions: QuizQuestion[];
};

export type ProgramModule = {
  id: ModuleId;
  title: string;
  /** Khung ngày theo đề cương, tính từ ngày đăng ký = ngày 0. */
  startDay: number;
  endDay: number;
  summary: string;
  lessonNumbers: number[];
  /** Tiêu chí Đạt của báo cáo module (M1–M4) để mentor tick. */
  reportCriteria?: string[];
  quiz?: QuizBank["id"] | { AB: QuizBank["id"]; C: QuizBank["id"] };
};
