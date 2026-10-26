import type { Lesson } from "../types";

// Module 1 – Nền tảng (ngày 1–7). Bám Đề cương: buổi 1, 2, 3.

export const LESSONS_M1: Lesson[] = [
  {
    number: 1,
    slug: "ai-lam-duoc-gi",
    moduleId: "M1",
    title: "AI làm được gì, chưa làm được gì, việc nào dễ bị thay thế",
    minutes: 50,
    n1Topics: "Chủ đề 1–6",
    content: {
      goal: "Nhìn vào một vị trí việc làm cụ thể và chỉ ra việc nào AI làm tốt, việc nào AI làm kém, việc nào vẫn cần con người.",
      why: "Nhà tuyển dụng không cần người \"biết hỏi AI\" chung chung, mà cần người biết giao đúng việc cho AI và giữ phần việc AI làm kém. Muốn vậy phải hiểu giới hạn của AI trước.",
      keyIdeas: [
        "AI tạo sinh (ChatGPT, Claude, Gemini…) dự đoán chữ tiếp theo dựa trên dữ liệu đã học. Vì vậy nó viết trôi chảy nhưng có thể bịa ra số liệu, tên người, trích dẫn (gọi là \"ảo giác\").",
        "AI làm tốt: viết nháp, tóm tắt, dịch, đổi giọng văn, gợi ý ý tưởng, viết công thức Excel, viết code mẫu, phân loại văn bản.",
        "AI làm kém hoặc rủi ro: số liệu mới nhất, tính toán dài nhiều bước không kiểm tra, kiến thức đặc thù nội bộ công ty, quyết định cần trách nhiệm pháp lý, việc cần quan hệ con người.",
        "Việc dễ bị thay thế là việc lặp lại, có khuôn mẫu, kết quả kiểm tra được nhanh. Người đi làm không mất việc vì AI, mà vì người khác làm cùng việc đó nhanh hơn nhờ AI.",
      ],
      steps: [
        { title: "Chọn vị trí muốn ứng tuyển", detail: "Chọn 1 vị trí cụ thể sau khi ra trường, vd. \"Nhân viên kế toán tổng hợp\", \"Chuyên viên marketing nội dung\", \"Lập trình viên web junior\"." },
        { title: "Liệt kê 5 việc hằng ngày của vị trí đó", detail: "Mở 2–3 tin tuyển dụng của vị trí trên TopCV/VietnamWorks, đọc mục \"Mô tả công việc\" và chép ra 5 việc cụ thể (động từ + đối tượng), vd. \"Lập báo cáo công nợ hằng tuần\"." },
        { title: "Hỏi AI đánh giá từng việc", detail: "Dùng prompt mẫu 1 bên dưới. Yêu cầu AI chấm mức AI hỗ trợ được (Cao/Vừa/Thấp) và giải thích lý do." },
        { title: "Phản biện lại AI", detail: "Với từng việc, tự hỏi: AI có thể sai ở đâu? Ai chịu trách nhiệm nếu sai? Sửa lại đánh giá nếu bạn không đồng ý với AI, ghi rõ lý do." },
        { title: "Điền bảng minh chứng", detail: "Điền bảng 5 việc vào portal, mỗi việc có: mức AI hỗ trợ, phần việc bạn vẫn phải tự làm." },
      ],
      prompts: [
        {
          title: "Prompt 1 – Đánh giá 5 việc",
          text: "Tôi là sinh viên năm cuối, muốn ứng tuyển vị trí [TÊN VỊ TRÍ] tại doanh nghiệp Việt Nam. Dưới đây là 5 việc hằng ngày của vị trí này:\n1. ...\n2. ...\n3. ...\n4. ...\n5. ...\nVới từng việc, hãy cho biết: (a) AI hiện nay hỗ trợ được ở mức Cao/Vừa/Thấp, (b) phần nào AI làm được, (c) phần nào con người vẫn phải làm, (d) rủi ro nếu tin hoàn toàn vào AI. Trình bày dạng bảng. Nếu không chắc, hãy nói rõ là không chắc.",
        },
        {
          title: "Prompt 2 – Hỏi về giới hạn",
          text: "Hãy nêu 5 tình huống trong công việc [TÊN VỊ TRÍ] mà AI dễ đưa ra câu trả lời sai nhưng nghe rất thuyết phục. Với mỗi tình huống, gợi ý cách tôi kiểm tra lại.",
        },
      ],
      example:
        "Vị trí: Nhân viên kế toán. Việc 3: \"Đối chiếu sao kê ngân hàng với sổ quỹ\". AI hỗ trợ: Vừa – AI giúp viết công thức Excel đối chiếu và gợi ý các dòng lệch; con người vẫn phải kiểm tra chứng từ gốc và giải trình chênh lệch; rủi ro: AI đọc sai định dạng số (dấu chấm/phẩy) dẫn tới lệch tiền.",
      commonMistakes: [
        "Liệt kê việc quá chung chung (\"làm báo cáo\") nên AI trả lời chung chung.",
        "Chép nguyên đánh giá của AI mà không phản biện.",
        "Đưa tên công ty thật, số liệu thật của nơi thực tập vào prompt.",
      ],
      selfCheck: [
        "Mỗi việc trong bảng đều có động từ và đối tượng cụ thể.",
        "Có ít nhất 1 việc bạn đánh giá khác với AI và ghi lý do.",
        "Bạn giải thích được cho người khác vì sao AI có thể \"bịa\".",
      ],
      resources: [
        { code: "N1", focus: "Chủ đề 1–6", summary: "Bối cảnh cắt giảm nhân sự vì AI, ai dễ bị thay thế, AI làm được và chưa làm được gì." },
        { code: "N2", summary: "Khóa miễn phí về cách sinh viên dùng AI trong học tập và công việc." },
        { code: "N3", summary: "Giải thích AI làm được gì và hay sai ở đâu." },
      ],
      evidence: [
        { key: "position", label: "Vị trí bạn muốn ứng tuyển", type: "text", placeholder: "vd. Nhân viên kế toán tổng hợp" },
        { key: "tasks", label: "Bảng 5 việc: mỗi dòng gồm việc – mức AI hỗ trợ (Cao/Vừa/Thấp) – phần bạn vẫn phải làm", type: "textarea", minLength: 150 },
        { key: "disagree", label: "Một điểm bạn không đồng ý với AI và lý do", type: "textarea", minLength: 40 },
      ],
    },
  },
  {
    number: 2,
    slug: "giao-viec-cho-ai",
    moduleId: "M1",
    title: "Giao việc cho AI, kiểm chứng và phản biện kết quả",
    minutes: 60,
    n1Topics: "Chủ đề 7",
    content: {
      goal: "Viết được yêu cầu cho AI có đủ 5 thành phần, và tìm ra lỗi trong câu trả lời của AI bằng cách kiểm chứng.",
      why: "Cùng một AI, người viết yêu cầu tốt nhận kết quả dùng được ngay; người viết yêu cầu sơ sài nhận kết quả phải làm lại. Kiểm chứng giúp bạn không nộp thông tin sai cho sếp.",
      keyIdeas: [
        "Yêu cầu tốt có 5 thành phần: **Vai trò** (AI đóng vai ai), **Bối cảnh** (tình huống, người đọc), **Nhiệm vụ** (làm gì cụ thể), **Định dạng** (bảng, gạch đầu dòng, độ dài), **Tiêu chí** (thế nào là đạt).",
        "Giao việc như giao cho một nhân viên mới rất giỏi nhưng chưa biết gì về bạn: càng rõ bối cảnh càng tốt.",
        "Kiểm chứng: đối chiếu số liệu và trích dẫn với nguồn gốc (trang chính thức, văn bản pháp luật, báo cáo); yêu cầu AI ghi nguồn; hỏi lại theo cách khác xem câu trả lời có nhất quán không.",
        "Phản biện: hỏi AI \"Điểm yếu của câu trả lời trên là gì?\", \"Trường hợp nào kết luận này sai?\".",
      ],
      steps: [
        { title: "Tìm 3 yêu cầu cũ bạn từng gõ cho AI", detail: "Mở lịch sử chat, chọn 3 câu hỏi bạn từng hỏi (bài tập, viết email, tìm hiểu kiến thức). Nếu chưa có, tự viết 3 yêu cầu ngắn như bình thường." },
        { title: "Viết lại từng yêu cầu theo 5 thành phần", detail: "Dùng khung ở prompt mẫu 1. Gửi cả bản cũ và bản mới cho AI, so sánh kết quả." },
        { title: "Chọn 1 câu trả lời có số liệu hoặc dữ kiện", detail: "Ví dụ: hỏi AI về mức lương trung bình một ngành, quy định nghỉ phép theo Bộ luật Lao động, số liệu dân số…" },
        { title: "Kiểm chứng và tìm 3 lỗi", detail: "Dùng NotebookLM/Perplexity hoặc tìm trang chính thức để đối chiếu. Ghi lại 3 chỗ sai, thiếu hoặc không có nguồn, kèm nguồn đúng." },
        { title: "Nộp minh chứng", detail: "Điền 3 cặp Trước/Sau và 3 lỗi tìm được." },
      ],
      prompts: [
        {
          title: "Prompt 1 – Khung 5 thành phần",
          text: "Vai trò: Bạn là [chuyên gia/vị trí phù hợp].\nBối cảnh: Tôi là [ai], đang [làm gì], người đọc kết quả là [ai].\nNhiệm vụ: Hãy [việc cụ thể].\nĐịnh dạng: Trình bày dạng [bảng/gạch đầu dòng], tối đa [số] chữ, bằng tiếng Việt.\nTiêu chí: Kết quả đạt khi [điều kiện]. Nếu thiếu thông tin, hãy hỏi lại tôi trước khi làm.",
        },
        {
          title: "Prompt 2 – Yêu cầu AI tự phản biện",
          text: "Hãy rà lại câu trả lời trên: (1) liệt kê các khẳng định cần kiểm chứng, (2) với mỗi khẳng định, cho biết nguồn chính thức nên đối chiếu, (3) chỉ ra điểm yếu hoặc trường hợp câu trả lời có thể sai.",
        },
      ],
      example:
        "Trước: \"Viết email xin nghỉ phép.\" Sau: \"Vai trò: chuyên viên nhân sự. Bối cảnh: tôi là thực tập sinh phòng marketing, cần xin nghỉ 2 ngày (12–13/11) để thi cuối kỳ, người đọc là trưởng phòng. Nhiệm vụ: viết email xin nghỉ. Định dạng: dưới 120 chữ, có tiêu đề. Tiêu chí: lịch sự, nêu rõ người bàn giao việc.\" Lỗi tìm được: AI nói \"theo luật được nghỉ phép 14 ngày/năm\" – sai, Bộ luật Lao động 2019 quy định 12 ngày với điều kiện làm việc bình thường (nguồn: Điều 113).",
      commonMistakes: [
        "Chỉ thêm chữ \"chi tiết hơn\" mà không thêm bối cảnh.",
        "Tin số liệu AI đưa ra mà không mở nguồn gốc.",
        "Coi trang tổng hợp không rõ tác giả là nguồn kiểm chứng.",
      ],
      selfCheck: [
        "Cả 3 bản \"Sau\" đều có đủ 5 thành phần.",
        "Mỗi lỗi tìm được đều kèm nguồn đúng (link hoặc tên văn bản).",
        "Bạn thấy rõ kết quả bản \"Sau\" tốt hơn ở điểm nào.",
      ],
      resources: [
        { code: "N1", focus: "Chủ đề 7", summary: "Nguyên tắc giao việc cho AI." },
        { code: "N4", summary: "Khung giao việc, kiểm tra kết quả và dùng AI có trách nhiệm." },
        { code: "N10", summary: "Dùng NotebookLM/Perplexity để đối chiếu nguồn và số liệu." },
      ],
      evidence: [
        { key: "pairs", label: "3 cặp yêu cầu Trước / Sau (ghi rõ Trước: … Sau: …)", type: "textarea", minLength: 300 },
        { key: "errors", label: "3 lỗi tìm được trong câu trả lời của AI, mỗi lỗi kèm nguồn đúng", type: "textarea", minLength: 150 },
      ],
    },
  },
  {
    number: 3,
    slug: "thiet-lap-ai-cua-ban",
    moduleId: "M1",
    title: "Thiết lập AI cho riêng mình; bảo mật dữ liệu và đạo văn",
    minutes: 60,
    n1Topics: "Chủ đề 8–11",
    content: {
      goal: "Cài Global Instruction và Memory để AI hiểu bạn là ai; nắm 5 điều không bao giờ đưa vào AI.",
      why: "Thiết lập một lần giúp mọi câu trả lời sau đều sát với ngành, mục tiêu và văn phong của bạn. Biết giới hạn bảo mật giúp bạn không làm lộ dữ liệu khi đi làm.",
      keyIdeas: [
        "**Global Instruction** (ChatGPT: Customize ChatGPT; Claude: Profile/Personal preferences; Gemini: Saved info): đoạn hướng dẫn AI áp dụng cho mọi cuộc trò chuyện.",
        "**Memory**: AI ghi nhớ thông tin bạn cho phép giữa các cuộc chat. Kiểm tra và xóa được trong phần cài đặt.",
        "Chọn model: model mạnh cho việc phức tạp (phân tích, viết dài); model nhanh cho việc đơn giản. Bản miễn phí thường giới hạn số lượt dùng model mạnh.",
        "Bảo mật: không đưa dữ liệu cá nhân của người khác, dữ liệu nội bộ công ty/trường, mật khẩu, số CCCD, tài khoản ngân hàng. Bản miễn phí có thể dùng dữ liệu để cải thiện model – kiểm tra phần cài đặt quyền riêng tư.",
        "Đạo văn: không nộp nguyên văn bài AI viết. Dùng AI để gợi ý, góp ý, sau đó tự viết bằng lời của mình và ghi rõ có dùng AI nếu trường yêu cầu.",
      ],
      steps: [
        { title: "Chọn 1 AI chính để học 30 ngày", detail: "ChatGPT, Claude hoặc Gemini đều được, bản miễn phí là đủ cho phần lớn lộ trình." },
        { title: "Viết Global Instruction", detail: "Dùng prompt mẫu 1 để AI giúp bạn soạn, rồi tự chỉnh. Gồm: bạn là ai, ngành học, mục tiêu nghề, cách bạn muốn AI trả lời." },
        { title: "Cài Instruction và kiểm tra", detail: "Dán vào phần cài đặt của AI. Mở chat mới hỏi \"Bạn biết gì về tôi?\" để kiểm tra AI đã nhận." },
        { title: "Bật/kiểm tra Memory và quyền riêng tư", detail: "Vào cài đặt, xem AI đang nhớ gì, tắt chia sẻ dữ liệu để huấn luyện nếu có tùy chọn." },
        { title: "Viết checklist 5 điều không đưa cho AI", detail: "Viết theo ngành của bạn, vd. SV kế toán: \"không dán sổ sách khách hàng thật\"." },
        { title: "Làm trắc nghiệm an toàn dữ liệu", detail: "Phần trắc nghiệm Module 1 trên portal có các câu về bảo mật và đạo văn." },
      ],
      prompts: [
        {
          title: "Prompt 1 – Soạn Global Instruction",
          text: "Hãy giúp tôi viết đoạn Global Instruction (dưới 150 chữ) để cài cho AI. Thông tin về tôi: sinh viên năm [x] ngành [ngành] tại [trường]; mục tiêu: [vị trí muốn ứng tuyển]; tôi muốn AI trả lời bằng tiếng Việt, ngắn gọn, nêu kết luận trước, dùng bảng khi so sánh, luôn nói rõ khi không chắc chắn và gợi ý nguồn để kiểm chứng.",
        },
      ],
      example:
        "Instruction: \"Tôi là SV năm 4 ngành Marketing, ĐH Công Thương, muốn làm Content Marketing. Trả lời bằng tiếng Việt, kết luận trước, tối đa 200 chữ trừ khi tôi yêu cầu dài hơn. Khi đưa số liệu phải ghi nguồn; không chắc thì nói không chắc.\" Checklist: 1) Không dán số điện thoại/email khách hàng; 2) Không dán báo cáo nội bộ nơi thực tập; 3) Không dán mật khẩu; 4) Không dán ảnh CCCD; 5) Không nộp nguyên văn bài AI viết.",
      commonMistakes: [
        "Instruction quá dài, nhiều yêu cầu mâu thuẫn.",
        "Chụp màn hình Instruction có lộ email/số điện thoại cá nhân – hãy che trước khi nộp.",
        "Nghĩ rằng bản trả phí thì dán dữ liệu công ty thoải mái.",
      ],
      selfCheck: [
        "Mở chat mới, AI trả lời đúng văn phong bạn đã cài.",
        "Checklist có ít nhất 1 điều riêng cho ngành của bạn.",
        "Bạn biết chỗ xem và xóa Memory trong AI của mình.",
      ],
      resources: [
        { code: "N1", focus: "Chủ đề 8–11", summary: "Chọn AI, Global Instruction, Memory & Chat History, chọn model và effort." },
        { code: "N5", summary: "Claude 101: thiết lập Instruction, Memory, chọn model (miễn phí, tiếng Anh)." },
      ],
      evidence: [
        { key: "instruction", label: "Ảnh chụp phần Global Instruction đã cài (che thông tin cá nhân)", type: "file", accept: "image/*" },
        { key: "checklist", label: "Checklist 5 điều không đưa cho AI", type: "textarea", minLength: 100 },
      ],
    },
  },
];
