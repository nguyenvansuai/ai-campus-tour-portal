import { describe, expect, it } from "vitest";
import { CATALOG } from "@/modules/curriculum/content/catalog";
import { FINAL_RUBRIC, LESSONS, lessonContentFor, MODULES, quizIdFor } from "@/modules/curriculum/content/program";
import { QUIZZES } from "@/modules/curriculum/content/quizzes";
import type { LessonContent, Track } from "@/modules/curriculum/types";

const TRACKS: Track[] = ["A", "B", "C"];
const allContents = LESSONS.flatMap((lesson) => TRACKS.map((track) => ({ lesson, track, content: lessonContentFor(lesson, track) })));

describe("Cấu trúc lộ trình", () => {
  it("6 module, 12 buổi đánh số 1–12, mỗi buổi thuộc đúng 1 module", () => {
    expect(MODULES.map((m) => m.id)).toEqual(["M0", "M1", "M2", "M3", "M4", "M5"]);
    expect(LESSONS.map((l) => l.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(MODULES.flatMap((m) => m.lessonNumbers).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("buổi 7–9 có nội dung riêng cho 3 khối A/B/C, các buổi khác dùng chung", () => {
    for (const lesson of LESSONS) {
      const perTrack = !("goal" in lesson.content);
      expect(perTrack).toBe([7, 8, 9].includes(lesson.number));
    }
  });

  it("slug không trùng", () => {
    expect(new Set(LESSONS.map((l) => l.slug)).size).toBe(LESSONS.length);
  });

  it("module M1–M4 có tiêu chí Đạt cho báo cáo; rubric tổng 100 điểm", () => {
    for (const id of ["M1", "M2", "M3", "M4"]) expect(MODULES.find((m) => m.id === id)?.reportCriteria?.length).toBeGreaterThanOrEqual(4);
    expect(FINAL_RUBRIC.reduce((sum, item) => sum + item.max, 0)).toBe(100);
  });
});

describe("Nội dung đủ để SV tự học", () => {
  it.each(allContents.map((c) => [`buổi ${c.lesson.number} khối ${c.track}`, c.content, c.lesson.number] as const))(
    "%s có đủ các phần",
    (_name, content: LessonContent, number: number) => {
      expect(content.goal.length).toBeGreaterThan(30);
      expect(content.why.length).toBeGreaterThan(30);
      expect(content.keyIdeas.length).toBeGreaterThanOrEqual(2);
      expect(content.steps.length).toBeGreaterThanOrEqual(3);
      expect(content.prompts.length).toBeGreaterThanOrEqual(1);
      expect(content.example.length).toBeGreaterThan(50);
      expect(content.commonMistakes.length).toBeGreaterThanOrEqual(2);
      expect(content.selfCheck.length).toBeGreaterThanOrEqual(2);
      expect(content.evidence.length).toBeGreaterThanOrEqual(1);
      // Đề cương: mỗi kiến thức ít nhất 2 nơi học (buổi 10 là buổi tự chọn đề tài, buổi 12 chỉ có N7).
      if (![10, 12].includes(number)) expect(content.resources.length).toBeGreaterThanOrEqual(2);
    },
  );

  it("mọi mã nguồn học đều có trong danh mục; N1 luôn chỉ rõ chủ đề cần xem", () => {
    const codes = new Set(CATALOG.map((r) => r.code));
    for (const { content } of allContents) {
      for (const ref of content.resources) {
        expect(codes.has(ref.code)).toBe(true);
        if (ref.code === "N1") expect(ref.focus).toBeTruthy();
      }
    }
  });

  it("buổi 4, 5, 6, 9 (khối A/B) có đường làm miễn phí", () => {
    for (const { lesson, track, content } of allContents) {
      if ([4, 5, 6].includes(lesson.number) || (lesson.number === 9 && track !== "C")) expect(content.freePath).toBeTruthy();
    }
  });

  it("khóa evidence không trùng trong một buổi", () => {
    for (const { content } of allContents) {
      const keys = content.evidence.map((e) => e.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});

describe("Trắc nghiệm", () => {
  it.each([
    ["M1", 15],
    ["M2", 10],
    ["M3-AB", 10],
    ["M3-C", 10],
  ])("%s có ít nhất %i câu, đủ để rút đề", (id, min) => {
    const quiz = QUIZZES.find((q) => q.id === id)!;
    expect(quiz.questions.length).toBeGreaterThanOrEqual(min);
    expect(quiz.questions.length).toBeGreaterThanOrEqual(quiz.drawCount);
  });

  it("bài an toàn dữ liệu (cho SV được miễn M1) lấy đúng câu của M1 và làm hết", () => {
    const safe = QUIZZES.find((q) => q.id === "M1-SAFE")!;
    const m1 = QUIZZES.find((q) => q.id === "M1")!;
    expect(safe.questions.length).toBe(safe.drawCount);
    expect(safe.questions.every((q) => m1.questions.includes(q))).toBe(true);
  });

  it("mỗi câu có 4 phương án, đáp án hợp lệ, có giải thích, id không trùng", () => {
    const ids = new Set<string>();
    // M1-SAFE lấy lại câu an toàn dữ liệu của M1 nên không tính trùng.
    for (const quiz of QUIZZES.filter((q) => q.id !== "M1-SAFE")) {
      for (const q of quiz.questions) {
        expect(q.options).toHaveLength(4);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
        expect(new Set(q.options).size).toBe(4);
        expect(q.explanation.length).toBeGreaterThan(10);
        expect(ids.has(q.id)).toBe(false);
        ids.add(q.id);
      }
    }
  });

  it("khối C làm trắc nghiệm M3 riêng", () => {
    expect(quizIdFor("M3", "C")).toBe("M3-C");
    expect(quizIdFor("M3", "A")).toBe("M3-AB");
    expect(quizIdFor("M4", "A")).toBeNull();
  });
});
