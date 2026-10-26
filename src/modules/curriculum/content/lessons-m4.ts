import type { Lesson } from "../types";

// Module 4 – Xây hồ sơ năng lực (ngày 22–28). Bám Đề cương: buổi 10, 11, 12.

export const LESSONS_M4: Lesson[] = [
  {
    number: 10,
    slug: "chon-de-tai",
    moduleId: "M4",
    title: "Chọn đề tài: nâng quy trình tuần 3 thành dự án giải 1 vấn đề thật",
    minutes: 45,
    content: {
      goal: "Viết đề bài dự án 1 trang: vấn đề thật, người dùng thật, kết quả mong muốn đo được.",
      why: "Rubric dự án cuối chấm 30/100 điểm cho tiêu chí \"giải 1 việc thật của ngành, nêu rõ ai dùng\". Đề bài tốt quyết định phần lớn điểm.",
      keyIdeas: [
        "Vấn đề thật: có người đang gặp và đang tốn thời gian/tiền vì nó (CLB, cửa hàng người quen, nhóm học, môn học).",
        "Người dùng thật: tên vai trò cụ thể, tốt nhất là hỏi được ý kiến của họ.",
        "Kết quả đo được: thời gian giảm từ X xuống Y, số lỗi giảm, số người dùng.",
        "Phạm vi vừa sức: làm xong trong khoảng 6 giờ (buổi 11–12 và ngày 29–30).",
      ],
      steps: [
        { title: "Liệt kê 3 vấn đề ứng viên", detail: "Dựa trên quy trình đã làm ở tuần 3, nghĩ xem ai ngoài bạn có cùng việc lặp lại đó." },
        { title: "Nhờ AI phản biện", detail: "Dùng prompt mẫu 1 để chấm 3 ý tưởng theo tiêu chí rubric." },
        { title: "Hỏi người dùng", detail: "Nhắn hỏi 1–2 người dùng thật: việc này mất bao lâu, họ muốn kết quả ra sao." },
        { title: "Viết đề bài 1 trang", detail: "Theo khung ở prompt mẫu 2." },
      ],
      prompts: [
        {
          title: "Prompt 1 – Chấm ý tưởng",
          text: "Tôi có 3 ý tưởng dự án AI cuối khóa: [1], [2], [3]. Hãy chấm mỗi ý tưởng theo: (a) giải việc thật, rõ người dùng; (b) làm xong trong 6 giờ; (c) đo được kết quả trước/sau; (d) an toàn dữ liệu. Gợi ý cách thu hẹp phạm vi ý tưởng tốt nhất.",
        },
        {
          title: "Prompt 2 – Khung đề bài",
          text: "Giúp tôi viết đề bài dự án 1 trang gồm: Vấn đề (ai gặp, mất bao lâu/bao nhiêu tiền), Người dùng, Giải pháp dự kiến (quy trình AI), Kết quả mong muốn (số đo trước/sau), Dữ liệu sẽ dùng và cách bảo vệ, Ngoài phạm vi. Dựa trên ghi chú: [DÁN]",
        },
      ],
      example:
        "Vấn đề: thủ quỹ CLB mất 3 giờ/tháng tổng hợp thu chi từ tin nhắn chuyển khoản. Người dùng: thủ quỹ và ban chủ nhiệm CLB. Kết quả mong muốn: còn dưới 30 phút/tháng, sai lệch 0đ. Dữ liệu: ảnh chụp sao kê đã che số tài khoản.",
      commonMistakes: ["Vấn đề do mình tưởng tượng, không ai thật sự gặp.", "Không có số đo trước/sau.", "Phạm vi quá lớn."],
      selfCheck: ["Gọi tên được người dùng cụ thể.", "Có con số \"trước\" (đã đo hoặc hỏi được).", "Có mục ngoài phạm vi."],
      resources: [],
      evidence: [
        { key: "problem", label: "Vấn đề: ai gặp, mất bao lâu/bao nhiêu tiền", type: "textarea", minLength: 80 },
        { key: "users", label: "Người dùng", type: "text" },
        { key: "outcome", label: "Kết quả mong muốn (số đo trước → sau)", type: "textarea", minLength: 40 },
        { key: "brief", label: "Link đề bài 1 trang (Google Docs, chế độ xem)", type: "link" },
      ],
    },
  },
  {
    number: 11,
    slug: "hoan-thien-du-an",
    moduleId: "M4",
    title: "Hoàn thiện dự án; nâng cao (tùy chọn): Skill/Plugin, dashboard",
    minutes: 60,
    n1Topics: "Chủ đề 26–35 (nâng cao, tùy chọn)",
    content: {
      goal: "Có bản dự án chạy được, kiểm thử với ít nhất 2 bộ dữ liệu khác nhau, có ảnh trước/sau.",
      why: "Rubric chấm 30 điểm cho \"chạy được, có kết quả kiểm thử với dữ liệu khác nhau\" và 20 điểm cho \"kiểm chứng kết quả và an toàn dữ liệu\".",
      keyIdeas: [
        "Kiểm thử với dữ liệu khác nhau: dữ liệu bình thường, dữ liệu thiếu/sai, dữ liệu nhiều hơn bình thường.",
        "Ghi lại AI sai ở đâu trong quá trình làm và bạn đã kiểm chứng/sửa thế nào – đây là phần mentor đánh giá cao.",
        "Nâng cao (không bắt buộc): đóng gói quy trình thành Skill/Plugin để dùng lại, hoặc dựng dashboard theo dõi.",
      ],
      steps: [
        { title: "Làm phiên bản chạy được đầu tiên", detail: "Dựa trên quy trình tuần 3, điều chỉnh theo đề bài buổi 10." },
        { title: "Kiểm thử với 2–3 bộ dữ liệu", detail: "Ghi kết quả từng lần: đúng/sai, AI sai ở đâu." },
        { title: "Đo kết quả sau", detail: "Làm lại việc với dự án, bấm giờ, so với số \"trước\"." },
        { title: "Chụp ảnh trước/sau", detail: "Ảnh cách làm cũ và cách làm mới." },
        { title: "(Tùy chọn) Đóng gói Skill/Plugin hoặc dashboard", detail: "Xem nguồn N1 chủ đề 26–35 hoặc N9." },
      ],
      prompts: [
        {
          title: "Prompt 1 – Kế hoạch kiểm thử",
          text: "Dự án của tôi: [MÔ TẢ]. Hãy đề xuất 3 bộ dữ liệu kiểm thử (bình thường, thiếu/sai, lớn hơn bình thường), kết quả mong đợi của mỗi bộ, và cách tôi tự kiểm chứng kết quả mà không phụ thuộc AI.",
        },
      ],
      example:
        "Kiểm thử 3 bộ: tháng 9 (đủ dữ liệu) đúng 100%; tháng 10 thiếu 2 tin nhắn → AI tự đoán số tiền, đã sửa prompt bắt AI báo thiếu thay vì đoán; dữ liệu 3 tháng → chạy đúng. Thời gian: 3 giờ → 25 phút.",
      commonMistakes: ["Chỉ thử với 1 bộ dữ liệu đẹp.", "Không ghi lại chỗ AI sai.", "Dùng dữ liệu thật chưa che thông tin cá nhân."],
      selfCheck: ["Có kết quả kiểm thử của ít nhất 2 bộ dữ liệu.", "Có số đo sau để so với số trước.", "Đã che mọi thông tin cá nhân trong ảnh."],
      resources: [
        { code: "N1", focus: "Chủ đề 26–35 (tùy chọn)", summary: "Skill, Plugin, Skill Creator, dashboard báo cáo kinh doanh." },
        { code: "N9", summary: "Đóng gói Skill, tách agent (miễn phí, tiếng Anh)." },
        { code: "N11", summary: "Khối C: xây ứng dụng AI bằng code." },
      ],
      evidence: [
        { key: "project", label: "Link dự án (chạy được)", type: "link" },
        { key: "tests", label: "Kết quả kiểm thử với các bộ dữ liệu, AI sai ở đâu, bạn đã sửa thế nào", type: "textarea", minLength: 150 },
        { key: "beforeAfter", label: "Ảnh trước/sau (ghép thành 1 ảnh)", type: "file", accept: "image/*" },
      ],
    },
  },
  {
    number: 12,
    slug: "dong-goi-ho-so",
    moduleId: "M4",
    title: "Đóng gói hồ sơ: portfolio, dòng CV, câu trả lời phỏng vấn về dự án",
    minutes: 60,
    content: {
      goal: "Có trang portfolio giới thiệu dự án, CV bản cuối có dòng mô tả dự án, và câu trả lời phỏng vấn 1 phút về dự án.",
      why: "Dự án chỉ có giá trị khi nhà tuyển dụng nhìn thấy và hiểu được trong 30 giây.",
      keyIdeas: [
        "Trang portfolio (Google Sites, Notion hoặc GitHub): vấn đề – giải pháp – số liệu trước/sau – ảnh – bài học.",
        "Dòng CV theo mẫu: \"Xây dựng [quy trình/Skill] AI cho [công việc], rút thời gian từ [X] xuống [Y]; link: [portfolio].\"",
        "Câu trả lời phỏng vấn theo STAR: Tình huống – Nhiệm vụ – Hành động – Kết quả.",
      ],
      steps: [
        { title: "Tạo trang portfolio", detail: "Dùng prompt mẫu 1 để AI viết nội dung, rồi dán vào Google Sites/Notion/GitHub README." },
        { title: "Cập nhật CV", detail: "Thêm dòng mô tả dự án theo mẫu, cập nhật CV ở buổi 5." },
        { title: "Chuẩn bị câu trả lời phỏng vấn", detail: "Dùng prompt mẫu 2, luyện nói to 3 lần, mỗi lần dưới 1 phút." },
      ],
      prompts: [
        {
          title: "Prompt 1 – Nội dung portfolio",
          text: "Viết nội dung trang portfolio cho dự án dưới đây, gồm: tiêu đề hấp dẫn, vấn đề (2 câu), giải pháp (3 gạch đầu dòng), kết quả có số liệu trước/sau, công cụ đã dùng, điều tôi học được (đặc biệt về kiểm chứng kết quả AI). Văn phong chuyên nghiệp, ngắn gọn. [DÁN THÔNG TIN DỰ ÁN]",
        },
        {
          title: "Prompt 2 – Trả lời phỏng vấn theo STAR",
          text: "Giúp tôi chuẩn bị câu trả lời dưới 1 phút cho câu hỏi \"Hãy kể về một dự án bạn tự hào\" theo cấu trúc STAR, dựa trên dự án: [DÁN]. Sau đó đóng vai nhà tuyển dụng hỏi vặn 2 câu về dự án.",
        },
      ],
      example:
        "Dòng CV: \"Xây dựng quy trình AI tổng hợp thu chi cho CLB Kế toán (40 thành viên), rút thời gian từ 3 giờ xuống 25 phút/tháng; link: sites.google.com/view/...\"",
      commonMistakes: ["Portfolio dài, không có số liệu.", "Link portfolio không mở được khi chưa đăng nhập."],
      selfCheck: ["Mở link portfolio ở cửa sổ ẩn danh vẫn xem được.", "Dòng CV có số liệu trước/sau và link.", "Nói câu trả lời STAR dưới 1 phút."],
      resources: [{ code: "N7", summary: "Cập nhật hồ sơ LinkedIn, tham khảo hồ sơ người cùng ngành." }],
      evidence: [
        { key: "portfolio", label: "Link trang portfolio", type: "link" },
        { key: "cv", label: "CV bản cuối (PDF)", type: "file", accept: "application/pdf" },
        { key: "cvLine", label: "Dòng mô tả dự án trong CV", type: "textarea", minLength: 60 },
      ],
    },
  },
];
