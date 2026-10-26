import type { Lesson, ProgramModule, Track } from "../types";
import { LESSONS_M1 } from "./lessons-m1";
import { LESSONS_M2 } from "./lessons-m2";
import { LESSONS_M3 } from "./lessons-m3";
import { LESSONS_M4 } from "./lessons-m4";

/** Phiên bản nội dung. Đổi khi sửa nội dung đáng kể; SV giữ phiên bản lúc đăng ký. */
export const PROGRAM_VERSION = "2026.1";
export const PROGRAM_TITLE = "Lộ trình Ứng dụng AI 30 ngày";
/** SV phải học ít nhất số ngày này mới được nộp dự án cuối (tránh làm ẩu cho xong). */
export const MIN_DAYS_BEFORE_FINAL = 14;

export const LESSONS: Lesson[] = [...LESSONS_M1, ...LESSONS_M2, ...LESSONS_M3, ...LESSONS_M4];

export const MODULES: ProgramModule[] = [
  {
    id: "M0",
    title: "Khởi động",
    startDay: 0,
    endDay: 0,
    summary: "Chọn mục tiêu nghề, khối ngành, khai báo công cụ AI đang có và tự đánh giá đầu vào (để cuối khóa so sánh trước/sau).",
    lessonNumbers: [],
  },
  {
    id: "M1",
    title: "Nền tảng AI",
    startDay: 1,
    endDay: 7,
    summary: "Hiểu AI làm được gì, giao việc và kiểm chứng kết quả, thiết lập AI cho riêng mình, an toàn dữ liệu.",
    lessonNumbers: [1, 2, 3],
    quiz: "M1",
    reportCriteria: [
      "Bảng 5 việc có đánh giá hợp lý và ít nhất 1 điểm phản biện lại AI",
      "3 cặp yêu cầu Trước/Sau, bản Sau thể hiện đủ vai trò – bối cảnh – nhiệm vụ – định dạng – tiêu chí",
      "Chỉ ra ít nhất 1 lỗi thật của AI kèm nguồn đúng",
      "Global Instruction có thông tin bản thân; ảnh đã che thông tin cá nhân",
      "Checklist 5 điều không đưa cho AI phù hợp với ngành",
    ],
  },
  {
    id: "M2",
    title: "Dùng AI để xin việc",
    startDay: 8,
    endDay: 14,
    summary: "Bảng kỹ năng từ tin tuyển dụng thật, CV và thư xin việc nhắm đúng tin, slide giới thiệu và phỏng vấn thử.",
    lessonNumbers: [4, 5, 6],
    quiz: "M2",
    reportCriteria: [
      "Bảng kỹ năng từ 3 tin tuyển dụng thật, có cột bằng chứng",
      "CV có ít nhất 3 thành tích nêu bằng số, không bịa",
      "Thư xin việc nhắm đúng tin đã chọn",
      "Slide đủ 5 trang",
      "Có 3 điểm cụ thể rút ra từ phỏng vấn thử",
    ],
  },
  {
    id: "M3",
    title: "Workflow AI theo khối ngành",
    startDay: 15,
    endDay: 21,
    summary: "Làm lại workflow đã xem demo trong workshop với 1 nhiệm vụ duy nhất xuyên suốt 3 buổi, có 1 bước tự động và số đo trước/sau.",
    lessonNumbers: [7, 8, 9],
    quiz: { AB: "M3-AB", C: "M3-C" },
    reportCriteria: [
      "Quy trình mô tả đủ các bước",
      "Có sản phẩm đầu ra dùng được (link xem được)",
      "Có 1 bước tự động (hoặc bản deploy với khối C)",
      "Có số phút trước/sau",
    ],
  },
  {
    id: "M4",
    title: "Dự án và hồ sơ năng lực",
    startDay: 22,
    endDay: 28,
    summary: "Nâng quy trình tuần 3 thành dự án giải 1 vấn đề thật, đóng gói portfolio và CV bản cuối.",
    lessonNumbers: [10, 11, 12],
    reportCriteria: [
      "Đề bài nêu rõ vấn đề thật và người dùng",
      "Bản dự án chạy được, có kết quả kiểm thử",
      "Portfolio truy cập được khi chưa đăng nhập",
      "CV có dòng mô tả dự án có số liệu trước/sau",
    ],
  },
  {
    id: "M5",
    title: "Tốt nghiệp",
    startDay: 29,
    endDay: 30,
    summary: "Nộp dự án cuối, đăng bài chia sẻ công khai và nộp 1 đơn ứng tuyển thật bằng CV mới.",
    lessonNumbers: [],
  },
];

/** Rubric dự án cuối (Đề cương mục 6). */
export const FINAL_RUBRIC = [
  { key: "realProblem", label: "Giải 1 việc thật của ngành, nêu rõ ai dùng", max: 30 },
  { key: "working", label: "Chạy được, có kết quả kiểm thử với dữ liệu khác nhau", max: 30 },
  { key: "verification", label: "Kiểm chứng kết quả và an toàn dữ liệu", max: 20 },
  { key: "presentation", label: "Trình bày: trang mô tả, số liệu trước/sau", max: 20 },
] as const;
export const PASS_SCORE = 70;
export const EXCELLENT_SCORE = 90;

/** 5 trường của báo cáo tuần (Đề cương mục 5). */
export const REPORT_FIELDS = [
  { key: "learned", label: "Bài đã học tuần này (và học từ nguồn nào)" },
  { key: "products", label: "Sản phẩm: file, link hoặc ảnh chụp" },
  { key: "aiMistakes", label: "AI đã sai ở đâu và bạn sửa thế nào" },
  { key: "hours", label: "Tổng thời gian đã học (giờ)" },
  { key: "difficulties", label: "Khó khăn cần hỗ trợ" },
] as const;

/** Tự đánh giá đầu vào ở M0 (thang 1–5), làm lại ở M5 để so sánh. */
export const SELF_ASSESSMENT = [
  { key: "delegate", label: "Tôi biết cách giao việc rõ ràng cho AI" },
  { key: "verify", label: "Tôi biết kiểm chứng kết quả AI trước khi dùng" },
  { key: "office", label: "Tôi dùng AI để làm việc với Excel/Word/PowerPoint" },
  { key: "jobHunt", label: "Tôi dùng AI để chuẩn bị hồ sơ xin việc" },
  { key: "automation", label: "Tôi tự động hóa được ít nhất 1 việc lặp lại" },
] as const;

/** Công cụ AI SV đang có (để portal ưu tiên đường học phù hợp). */
export const TOOL_OPTIONS = [
  { key: "free_chat", label: "ChatGPT / Claude / Gemini bản miễn phí" },
  { key: "paid_chat", label: "ChatGPT / Claude / Gemini bản trả phí" },
  { key: "school_microsoft", label: "Tài khoản Microsoft 365 của trường" },
  { key: "school_google", label: "Tài khoản Google Workspace của trường" },
] as const;

export function lessonByNumber(number: number) {
  return LESSONS.find((lesson) => lesson.number === number);
}

export function moduleOf(lessonNumber: number) {
  return MODULES.find((m) => m.lessonNumbers.includes(lessonNumber));
}

/** Nội dung buổi học theo khối ngành của SV (buổi 7–9 có 3 nhánh). */
export function lessonContentFor(lesson: Lesson, track: Track) {
  return "goal" in lesson.content ? lesson.content : lesson.content[track];
}

export function quizIdFor(moduleId: ProgramModule["id"], track: Track) {
  const quiz = MODULES.find((m) => m.id === moduleId)?.quiz;
  if (!quiz) return null;
  return typeof quiz === "string" ? quiz : track === "C" ? quiz.C : quiz.AB;
}
