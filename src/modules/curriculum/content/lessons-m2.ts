import type { Lesson } from "../types";

// Module 2 – Dùng AI để xin việc (ngày 8–14). Bám Đề cương: buổi 4, 5, 6.
// Add-in AI trong Excel/Word/PowerPoint cần gói trả phí, nên mỗi buổi có đường miễn phí (docs/NGUON_HOC_BO_SUNG.md).

export const LESSONS_M2: Lesson[] = [
  {
    number: 4,
    slug: "ai-doc-tin-tuyen-dung",
    moduleId: "M2",
    title: "AI đọc tin tuyển dụng, tách kỹ năng; AI trong Excel",
    minutes: 60,
    n1Topics: "Chủ đề 12–13",
    content: {
      goal: "Từ 3 tin tuyển dụng thật, lập bảng Excel so sánh kỹ năng nhà tuyển dụng cần với kỹ năng bạn đang có.",
      why: "Bảng này cho biết bạn thiếu gì để học trong 3 tuần tới, và là nguyên liệu để viết CV ở buổi 5.",
      keyIdeas: [
        "AI tách thông tin có cấu trúc rất tốt: đưa vào một đoạn tin tuyển dụng, yêu cầu trả ra bảng kỹ năng – mức độ – bằng chứng.",
        "Có 2 cách đưa tin tuyển dụng cho AI: dán nội dung vào chat (miễn phí, chắc chắn nhất), hoặc cho AI tự mở trang web (cần tính năng duyệt web/Claude in Chrome, thường là gói trả phí).",
        "AI viết được công thức Excel (COUNTIF, VLOOKUP/XLOOKUP, IF) và giải thích công thức. Luôn thử công thức trên vài dòng trước khi áp cho cả bảng.",
      ],
      steps: [
        { title: "Chọn 3 tin tuyển dụng thật", detail: "Trên TopCV, VietnamWorks hoặc LinkedIn, chọn 3 tin cho đúng vị trí bạn chọn ở buổi 1, còn hạn nộp. Lưu lại 3 đường link." },
        { title: "Dán từng tin cho AI tách kỹ năng", detail: "Chép phần \"Yêu cầu\" và \"Mô tả công việc\" vào prompt mẫu 1. Không cần dán thông tin liên hệ của công ty." },
        { title: "Gộp 3 bảng thành 1", detail: "Dùng prompt mẫu 2 để AI gộp kỹ năng trùng nhau và đếm số tin yêu cầu mỗi kỹ năng." },
        { title: "Đưa vào Excel/Google Sheets", detail: "Cách miễn phí: yêu cầu AI xuất file .xlsx (Claude, ChatGPT làm được) hoặc dán bảng vào Google Sheets. Thêm cột \"Tôi đã có?\" (Có/Chưa) và \"Bằng chứng\"." },
        { title: "Nhờ AI viết công thức đếm", detail: "Dùng prompt mẫu 3 để có công thức đếm số kỹ năng còn thiếu; kiểm tra lại bằng mắt vài dòng." },
      ],
      prompts: [
        {
          title: "Prompt 1 – Tách kỹ năng từ 1 tin",
          text: "Dưới đây là một tin tuyển dụng vị trí [VỊ TRÍ]. Hãy tách thành bảng gồm các cột: Kỹ năng/kiến thức | Loại (chuyên môn / công cụ / kỹ năng mềm / ngoại ngữ) | Mức độ yêu cầu (bắt buộc / ưu tiên) | Câu trích trong tin. Chỉ dùng thông tin có trong tin, không tự thêm.\n\n[DÁN NỘI DUNG TIN]",
        },
        {
          title: "Prompt 2 – Gộp 3 bảng",
          text: "Gộp 3 bảng kỹ năng trên thành 1 bảng duy nhất, gộp các kỹ năng giống nhau (vd. \"Excel\" và \"thành thạo MS Excel\"), thêm cột \"Số tin yêu cầu\" (1–3). Sắp xếp kỹ năng được yêu cầu nhiều nhất lên đầu.",
        },
        {
          title: "Prompt 3 – Công thức Excel",
          text: "Trong Google Sheets, cột C là \"Tôi đã có?\" với giá trị \"Có\" hoặc \"Chưa\" từ dòng 2 đến dòng 30. Viết công thức đếm số kỹ năng \"Chưa\" và công thức tính % kỹ năng đã có. Giải thích từng phần của công thức.",
        },
      ],
      example:
        "Bảng 18 kỹ năng, 3 tin. \"Excel nâng cao (Pivot)\" – 3/3 tin – Tôi đã có: Chưa. \"Viết content SEO\" – 2/3 tin – Có, bằng chứng: 5 bài viết cho fanpage CLB. Ô tổng kết: thiếu 7/18 kỹ năng, ưu tiên học Pivot Table và Google Analytics.",
      commonMistakes: [
        "Chọn tin tuyển dụng đã hết hạn hoặc sai vị trí.",
        "Để AI \"tự thêm\" kỹ năng không có trong tin.",
        "Đánh \"Có\" cho mọi kỹ năng mà không có bằng chứng.",
      ],
      selfCheck: [
        "Bảng có cột số tin yêu cầu và cột bằng chứng.",
        "Công thức đếm cho ra đúng kết quả khi bạn tự đếm tay.",
        "Bạn biết 3 kỹ năng cần ưu tiên bổ sung.",
      ],
      freePath:
        "Không cần add-in trả phí: dán tin tuyển dụng vào ChatGPT/Claude/Gemini bản miễn phí → yêu cầu xuất bảng hoặc file .xlsx → mở bằng Excel Online (miễn phí với tài khoản Microsoft) hoặc Google Sheets để chỉnh.",
      resources: [
        { code: "N1", focus: "Chủ đề 12–13", summary: "Cho AI đọc trang web trong cửa sổ chat; cài đặt AI trong Excel." },
        { code: "N7", summary: "Nơi tìm tin tuyển dụng thật." },
        { code: "S1", summary: "Claude bản miễn phí tạo được file Excel/Word/PowerPoint ngay trong chat." },
        { code: "S2", summary: "Bài tiếng Việt: các cách dùng ChatGPT để làm việc với Excel." },
        { code: "S3", summary: "Lộ trình miễn phí của Microsoft về làm việc với AI." },
      ],
      evidence: [
        { key: "jobLinks", label: "3 link tin tuyển dụng (mỗi link một dòng)", type: "textarea", minLength: 30 },
        { key: "sheet", label: "Link Google Sheets (chế độ xem) hoặc file Excel bảng kỹ năng", type: "link", placeholder: "https://docs.google.com/spreadsheets/..." },
        { key: "priorities", label: "3 kỹ năng bạn sẽ ưu tiên bổ sung", type: "textarea", minLength: 30 },
      ],
    },
  },
  {
    number: 5,
    slug: "cv-va-thu-xin-viec",
    moduleId: "M2",
    title: "Viết CV và thư xin việc với AI; AI đóng vai nhà tuyển dụng chấm CV",
    minutes: 60,
    n1Topics: "Chủ đề 14",
    content: {
      goal: "Có 1 CV và 1 thư xin việc nhắm đúng 1 tin tuyển dụng ưu tiên, đã được AI đóng vai nhà tuyển dụng chấm và bạn sửa theo góp ý.",
      why: "CV nhắm đúng tin tuyển dụng có tỉ lệ được gọi phỏng vấn cao hơn CV dùng chung. AI giúp bạn viết nhanh, nhưng chỉ được dùng thông tin thật của bạn.",
      keyIdeas: [
        "Kể thành tích bằng số: \"Viết 12 bài cho fanpage CLB, tăng tương tác 30% trong 2 tháng\" tốt hơn \"Có kinh nghiệm viết content\".",
        "Không bịa: AI có xu hướng thêm thành tích nghe hay. Mọi dòng trong CV phải đúng và bạn giải thích được khi phỏng vấn.",
        "Cho AI đóng vai nhà tuyển dụng để tìm điểm yếu trước khi nộp.",
      ],
      steps: [
        { title: "Chọn 1 tin ưu tiên trong 3 tin ở buổi 4", detail: "Chọn tin bạn thật sự muốn nộp." },
        { title: "Liệt kê nguyên liệu thật", detail: "Ghi ra học vấn, dự án môn học, CLB, việc làm thêm, chứng chỉ, kèm số liệu nếu có. Đây là nguồn duy nhất AI được dùng." },
        { title: "Nhờ AI viết bản nháp CV", detail: "Dùng prompt mẫu 1. Yêu cầu AI đánh dấu chỗ thiếu số liệu thay vì tự bịa." },
        { title: "Viết thư xin việc", detail: "Dùng prompt mẫu 2, dưới 250 chữ, nhắc đúng tên vị trí và 2 yêu cầu quan trọng của tin." },
        { title: "Cho AI chấm như nhà tuyển dụng rồi sửa", detail: "Dùng prompt mẫu 3, sửa CV theo các góp ý hợp lý, ghi lại bạn đã sửa gì." },
        { title: "Xuất file", detail: "Cách miễn phí: AI xuất .docx hoặc bạn dán vào Word Online/Google Docs/Canva để trình bày. Lưu PDF để nộp." },
      ],
      prompts: [
        {
          title: "Prompt 1 – Bản nháp CV",
          text: "Đóng vai chuyên viên tuyển dụng ngành [NGÀNH]. Dựa trên tin tuyển dụng và thông tin thật về tôi dưới đây, viết CV 1 trang bằng tiếng Việt, gồm: mục tiêu nghề nghiệp (2 câu), học vấn, kinh nghiệm/dự án (mỗi mục 2–3 gạch đầu dòng bắt đầu bằng động từ, có số liệu), kỹ năng. QUAN TRỌNG: chỉ dùng thông tin tôi cung cấp; chỗ nào thiếu số liệu thì ghi [CẦN BỔ SUNG] thay vì tự đặt ra.\n\nTin tuyển dụng: [DÁN]\nThông tin về tôi: [DÁN]",
        },
        {
          title: "Prompt 2 – Thư xin việc",
          text: "Viết thư xin việc dưới 250 chữ cho vị trí [VỊ TRÍ] tại [CÔNG TY], nhấn mạnh 2 kinh nghiệm phù hợp nhất trong CV trên với 2 yêu cầu quan trọng nhất của tin. Giọng văn chuyên nghiệp, tự tin, không sáo rỗng.",
        },
        {
          title: "Prompt 3 – AI chấm CV",
          text: "Bây giờ bạn là trưởng phòng tuyển dụng, có 30 giây đọc CV này. Chấm CV trên thang 10 theo: mức độ khớp với tin, thành tích có số liệu, trình bày, lỗi chính tả. Nêu 5 điểm cần sửa cụ thể, xếp theo mức độ quan trọng.",
        },
      ],
      example:
        "Dòng CV trước: \"Tham gia CLB Marketing.\" Sau: \"Trưởng ban Truyền thông CLB Marketing (2025–2026): lên kế hoạch và viết 24 bài đăng, fanpage tăng từ 1.200 lên 3.500 lượt theo dõi.\" AI chấm 6,5/10 → sau khi sửa 3 điểm (thêm số liệu, rút gọn mục tiêu, đưa kỹ năng Excel lên trên) chấm lại 8/10.",
      commonMistakes: [
        "Để nguyên thành tích AI tự bịa ra.",
        "Dùng 1 CV cho mọi tin tuyển dụng.",
        "Nộp thư xin việc nguyên văn AI viết, nghe giống mọi ứng viên khác.",
      ],
      selfCheck: [
        "Có ít nhất 3 thành tích nêu bằng số, đều là thật.",
        "Thư xin việc nhắc đúng tên vị trí và công ty.",
        "Bạn ghi lại được ít nhất 3 điểm đã sửa theo góp ý.",
      ],
      freePath:
        "Không cần Claude/Copilot trong Word: dùng AI bản miễn phí soạn nội dung (hoặc yêu cầu Claude xuất file .docx) → trình bày trong Word Online, Google Docs hoặc Canva → xuất PDF.",
      resources: [
        { code: "N1", focus: "Chủ đề 14", summary: "Cài đặt và dùng AI trên Word." },
        { code: "N7", summary: "Tin tuyển dụng để nhắm CV; LinkedIn để tham khảo hồ sơ người cùng ngành." },
        { code: "S1", summary: "Claude bản miễn phí xuất file Word (.docx)." },
        { code: "S3", summary: "Lộ trình miễn phí của Microsoft về soạn thảo với AI." },
      ],
      evidence: [
        { key: "targetJob", label: "Link tin tuyển dụng ưu tiên", type: "link" },
        { key: "cv", label: "File CV (PDF)", type: "file", accept: "application/pdf" },
        { key: "coverLetter", label: "Thư xin việc (dán nội dung)", type: "textarea", minLength: 300 },
        { key: "fixes", label: "AI chấm mấy điểm? Bạn đã sửa những gì?", type: "textarea", minLength: 60 },
      ],
    },
  },
  {
    number: 6,
    slug: "slide-va-phong-van-thu",
    moduleId: "M2",
    title: "Slide giới thiệu bản thân; luyện phỏng vấn bằng giọng nói",
    minutes: 60,
    n1Topics: "Chủ đề 15",
    content: {
      goal: "Có slide 5 trang giới thiệu bản thân và hoàn thành 1 buổi phỏng vấn thử 15 phút với AI, rút ra 3 điểm cần cải thiện.",
      why: "Nhiều vòng phỏng vấn yêu cầu giới thiệu bản thân 3–5 phút. Luyện với AI giúp bạn bớt run và biết mình hay vấp ở đâu.",
      keyIdeas: [
        "Slide giới thiệu bản thân 5 trang: (1) Tôi là ai, (2) Học vấn và kỹ năng nổi bật, (3) Một dự án tiêu biểu có số liệu, (4) Vì sao phù hợp vị trí này, (5) Mục tiêu 1 năm tới.",
        "Chế độ giọng nói (voice) của ChatGPT/Gemini cho phép nói chuyện như phỏng vấn thật. Đặt bối cảnh trước bằng chữ rồi mới bật giọng nói.",
        "Xin AI nhận xét sau buổi phỏng vấn: nội dung trả lời, độ dài, từ thừa, độ tự tin.",
      ],
      steps: [
        { title: "Nhờ AI dựng dàn ý 5 slide", detail: "Dùng prompt mẫu 1, dựa trên CV đã sửa ở buổi 5." },
        { title: "Tạo file slide", detail: "Cách miễn phí: yêu cầu Claude xuất .pptx hoặc dán dàn ý vào Google Slides/Canva. Mỗi slide tối đa 5 dòng, có 1 hình hoặc số liệu." },
        { title: "Chuẩn bị buổi phỏng vấn thử", detail: "Gõ prompt mẫu 2 vào ChatGPT hoặc Gemini, sau đó bật chế độ giọng nói." },
        { title: "Phỏng vấn 15 phút", detail: "Trả lời bằng giọng nói như thật. Nếu không dùng được giọng nói, trả lời bằng chữ nhưng tự giới hạn 1 phút mỗi câu." },
        { title: "Xin nhận xét và ghi 3 điểm cần sửa", detail: "Dùng prompt mẫu 3." },
      ],
      prompts: [
        {
          title: "Prompt 1 – Dàn ý 5 slide",
          text: "Dựa trên CV dưới đây, dựng dàn ý 5 slide giới thiệu bản thân cho vị trí [VỊ TRÍ]: tiêu đề mỗi slide, tối đa 5 dòng nội dung, gợi ý 1 hình minh họa hoặc 1 con số nổi bật cho mỗi slide. [DÁN CV]",
        },
        {
          title: "Prompt 2 – Phỏng vấn thử",
          text: "Bạn là trưởng phòng tuyển dụng của [CÔNG TY/NGÀNH], đang phỏng vấn tôi cho vị trí [VỊ TRÍ] dựa trên CV tôi gửi. Hỏi tôi lần lượt 6 câu (2 câu về bản thân, 2 câu chuyên môn, 1 câu tình huống, 1 câu \"bạn có câu hỏi gì cho chúng tôi\"). Mỗi lần chỉ hỏi 1 câu, chờ tôi trả lời rồi mới hỏi tiếp. Không nhận xét cho đến khi tôi nói \"kết thúc\".",
        },
        {
          title: "Prompt 3 – Nhận xét",
          text: "Kết thúc. Hãy nhận xét buổi phỏng vấn: câu trả lời tốt nhất và vì sao, 3 điểm tôi cần cải thiện nhất (nội dung, độ dài, cách diễn đạt), và gợi ý câu trả lời mẫu cho câu tôi trả lời kém nhất.",
        },
      ],
      example:
        "Slide 3: \"Dự án: Kế hoạch ra mắt sản phẩm trà sữa cho CLB khởi nghiệp – khảo sát 120 SV, doanh thu tuần đầu 4,2 triệu.\" 3 điểm rút ra: trả lời câu điểm yếu quá dài (2 phút); chưa nêu số liệu khi kể dự án; nói \"kiểu như\" nhiều lần.",
      commonMistakes: [
        "Slide nhồi chữ, đọc lại nguyên CV.",
        "Để AI hỏi rồi tự trả lời luôn: nhớ dặn AI chỉ hỏi từng câu.",
        "Bỏ qua bước xin nhận xét.",
      ],
      selfCheck: [
        "Slide đủ 5 trang, mỗi trang tối đa 5 dòng.",
        "Bạn đã trả lời đủ 6 câu hỏi của AI.",
        "3 điểm cần sửa đều cụ thể (không ghi chung chung \"cần tự tin hơn\").",
      ],
      freePath:
        "Không cần Copilot trong PowerPoint: Claude bản miễn phí xuất file .pptx, hoặc dán dàn ý vào Google Slides/Canva. Chế độ giọng nói có trong ChatGPT và Gemini bản miễn phí (có giới hạn thời lượng).",
      resources: [
        { code: "N1", focus: "Chủ đề 15", summary: "Cài đặt và dùng AI trên PowerPoint." },
        { code: "N6", summary: "Chế độ giọng nói để phỏng vấn thử." },
        { code: "S4", summary: "Video ~1 phút: tạo bài thuyết trình bằng prompt (Copilot)." },
        { code: "S8", summary: "Video hướng dẫn dùng Copilot trong PowerPoint (tiếng Anh)." },
        { code: "S1", summary: "Claude bản miễn phí xuất file PowerPoint (.pptx)." },
      ],
      evidence: [
        { key: "slides", label: "Link slide (Google Slides/Canva, chế độ xem) hoặc file PDF", type: "link" },
        { key: "interviewLessons", label: "3 điểm cần cải thiện rút ra từ buổi phỏng vấn thử", type: "textarea", minLength: 80 },
      ],
    },
  },
];
