import type { QuizBank } from "../types";

// Ngân hàng trắc nghiệm kiến thức module. Chấm tự động theo đáp án cố định (không dùng AI).
// `answer` là vị trí đáp án đúng (bắt đầu từ 0). Thứ tự phương án được xáo khi hiển thị.

export const QUIZZES: QuizBank[] = [
  {
    id: "M1",
    title: "Trắc nghiệm Module 1 – Nền tảng và an toàn dữ liệu",
    drawCount: 15,
    passPercent: 80,
    questions: [
      { id: "m1-01", question: "Vì sao AI tạo sinh đôi khi đưa ra số liệu hoặc trích dẫn không có thật?", options: ["Vì AI dự đoán chữ tiếp theo dựa trên mẫu đã học, không tra cứu sự thật", "Vì AI cố tình nói dối người dùng", "Vì người dùng dùng bản miễn phí", "Vì mạng Internet chậm"], answer: 0, explanation: "AI tạo sinh sinh ra văn bản có xác suất cao, nên có thể \"ảo giác\" ra thông tin nghe hợp lý nhưng sai." },
      { id: "m1-02", question: "Việc nào sau đây AI thường làm tốt nhất?", options: ["Viết bản nháp email theo bối cảnh rõ ràng", "Quyết định tăng lương cho nhân viên", "Cung cấp số liệu thị trường của sáng nay mà không cần nguồn", "Ký hợp đồng thay giám đốc"], answer: 0, explanation: "Viết nháp, tóm tắt, đổi giọng văn là thế mạnh của AI; quyết định có trách nhiệm pháp lý vẫn cần con người." },
      { id: "m1-03", question: "Một yêu cầu tốt gửi cho AI nên có những thành phần nào?", options: ["Vai trò, bối cảnh, nhiệm vụ, định dạng, tiêu chí", "Chỉ cần nhiệm vụ thật ngắn", "Càng nhiều từ khóa tiếng Anh càng tốt", "Tên của AI và lời cảm ơn"], answer: 0, explanation: "5 thành phần giúp AI hiểu đúng việc và trả kết quả dùng được." },
      { id: "m1-04", question: "AI trả lời \"Theo Bộ luật Lao động, người lao động được nghỉ phép 14 ngày/năm\". Bạn nên làm gì?", options: ["Mở văn bản luật hoặc trang chính thức để đối chiếu trước khi dùng", "Tin ngay vì AI rất thông minh", "Hỏi lại AI y hệt câu cũ cho chắc", "Bỏ qua vì số liệu không quan trọng"], answer: 0, explanation: "Số liệu, quy định pháp luật phải được đối chiếu với nguồn chính thức." },
      { id: "m1-05", question: "Câu nào sau đây giúp AI tự phản biện câu trả lời của nó?", options: ["\"Hãy liệt kê các khẳng định cần kiểm chứng và trường hợp câu trả lời có thể sai\"", "\"Trả lời nhanh hơn\"", "\"Viết dài hơn\"", "\"Dùng nhiều biểu tượng cảm xúc\""], answer: 0, explanation: "Yêu cầu AI chỉ ra điểm yếu giúp bạn biết chỗ cần kiểm tra." },
      { id: "m1-06", question: "Global Instruction (hướng dẫn chung) dùng để làm gì?", options: ["Cho AI biết bạn là ai và cách bạn muốn AI trả lời trong mọi cuộc trò chuyện", "Tăng tốc độ mạng", "Nâng cấp lên bản trả phí", "Xóa lịch sử trò chuyện"], answer: 0, explanation: "Instruction áp dụng cho mọi cuộc chat, giúp câu trả lời sát nhu cầu của bạn." },
      { id: "m1-07", question: "Tính năng Memory của AI cần lưu ý điều gì?", options: ["Kiểm tra định kỳ AI đang nhớ gì và xóa thông tin nhạy cảm", "Không bao giờ xóa được", "Chỉ có ở máy tính của công ty", "Memory tự gửi thông tin cho nhà tuyển dụng"], answer: 0, explanation: "Memory xem và xóa được trong cài đặt; không để AI nhớ dữ liệu nhạy cảm." },
      { id: "m1-08", question: "Thông tin nào KHÔNG được đưa vào AI?", options: ["Danh sách khách hàng thật kèm số điện thoại của nơi thực tập", "Một đoạn văn bạn tự viết để nhờ sửa lỗi chính tả", "Câu hỏi về cách dùng hàm VLOOKUP", "Dàn ý bài thuyết trình của bạn"], answer: 0, explanation: "Dữ liệu cá nhân của người khác và dữ liệu nội bộ công ty không được đưa vào AI." },
      { id: "m1-09", question: "Bạn dùng AI bản trả phí. Điều nào đúng?", options: ["Vẫn không đưa dữ liệu nội bộ công ty khi chưa được công ty cho phép", "Đưa mọi dữ liệu công ty vì đã trả tiền", "Bản trả phí không bao giờ sai", "Không cần kiểm chứng kết quả"], answer: 0, explanation: "Quy định bảo mật của nơi làm việc vẫn áp dụng, dù bạn dùng gói nào." },
      { id: "m1-10", question: "Cách dùng AI nào KHÔNG bị coi là đạo văn?", options: ["Nhờ AI góp ý bài, rồi tự viết lại bằng lời của mình và ghi rõ có dùng AI nếu được yêu cầu", "Nộp nguyên văn bài AI viết dưới tên mình", "Đổi vài từ trong bài AI viết rồi nộp", "Nhờ AI viết rồi xóa dấu vết AI"], answer: 0, explanation: "AI là công cụ hỗ trợ; bài nộp phải là sản phẩm và lời văn của bạn." },
      { id: "m1-11", question: "Khi chụp màn hình để nộp minh chứng, bạn nên làm gì?", options: ["Che email, số điện thoại và thông tin cá nhân trước khi nộp", "Nộp nguyên ảnh cho nhanh", "Chụp cả mật khẩu để mentor kiểm tra", "Đăng ảnh lên mạng xã hội trước"], answer: 0, explanation: "Che thông tin cá nhân trong mọi minh chứng." },
      { id: "m1-12", question: "Việc nào dễ bị AI thay thế nhất?", options: ["Việc lặp lại, có khuôn mẫu, kết quả kiểm tra được nhanh", "Việc đàm phán với đối tác mới", "Việc chịu trách nhiệm pháp lý cho quyết định", "Việc xây dựng quan hệ với khách hàng"], answer: 0, explanation: "Việc lặp lại, có quy tắc rõ ràng dễ được tự động hóa." },
      { id: "m1-13", question: "Nguồn nào phù hợp nhất để kiểm chứng một quy định pháp luật?", options: ["Văn bản gốc trên cổng thông tin chính thức của cơ quan nhà nước", "Một bình luận trên mạng xã hội", "Câu trả lời của AI khác", "Trí nhớ của bạn bè"], answer: 0, explanation: "Ưu tiên nguồn gốc, chính thức." },
      { id: "m1-14", question: "Khi yêu cầu chưa rõ, cách nào giúp AI làm đúng hơn?", options: ["Dặn AI hỏi lại bạn trước khi làm nếu thiếu thông tin", "Để AI tự đoán", "Gửi lại yêu cầu nhiều lần", "Viết toàn bộ bằng chữ in hoa"], answer: 0, explanation: "Cho phép AI hỏi lại giúp tránh làm sai do thiếu bối cảnh." },
      { id: "m1-15", question: "Theo lộ trình, hoàn thành một buổi học trên portal nghĩa là gì?", options: ["Nộp minh chứng sản phẩm tự luyện của buổi đó", "Chỉ cần mở trang bài học", "Xem hết video của khóa Sự AI", "Làm xong trắc nghiệm của buổi"], answer: 0, explanation: "Học từ nguồn nào cũng được; hoàn thành buổi được tính bằng sản phẩm bạn nộp." },
      { id: "m1-16", question: "Model AI \"mạnh\" nên dùng khi nào?", options: ["Khi việc phức tạp như phân tích nhiều bước hoặc viết dài", "Cho mọi câu hỏi kể cả chào hỏi", "Không bao giờ dùng", "Chỉ khi mạng yếu"], answer: 0, explanation: "Dùng model mạnh cho việc phức tạp, model nhanh cho việc đơn giản để tiết kiệm lượt." },
    ],
  },
  {
    id: "M2",
    title: "Trắc nghiệm Module 2 – Dùng AI để xin việc",
    drawCount: 10,
    passPercent: 80,
    questions: [
      { id: "m2-01", question: "Cách chắc chắn nhất để AI đọc được một tin tuyển dụng khi dùng bản miễn phí?", options: ["Chép nội dung tin và dán vào chat", "Chỉ gửi tên công ty", "Gửi ảnh logo công ty", "Nhờ AI tự đoán nội dung tin"], answer: 0, explanation: "Dán nội dung trực tiếp không phụ thuộc tính năng duyệt web." },
      { id: "m2-02", question: "Khi AI tách kỹ năng từ tin tuyển dụng, bạn nên dặn điều gì?", options: ["Chỉ dùng thông tin có trong tin, không tự thêm", "Thêm càng nhiều kỹ năng càng tốt", "Dịch sang tiếng Anh", "Bỏ qua kỹ năng mềm"], answer: 0, explanation: "Tránh AI \"bịa\" yêu cầu không có trong tin." },
      { id: "m2-03", question: "Dòng CV nào tốt nhất?", options: ["\"Viết 24 bài cho fanpage CLB, tăng lượt theo dõi từ 1.200 lên 3.500\"", "\"Có kinh nghiệm viết content\"", "\"Năng động, nhiệt tình\"", "\"Từng tham gia CLB\""], answer: 0, explanation: "Thành tích cụ thể, có số liệu thuyết phục hơn mô tả chung." },
      { id: "m2-04", question: "AI tự thêm vào CV một thành tích bạn chưa từng làm. Bạn nên làm gì?", options: ["Xóa ngay, chỉ giữ thông tin thật", "Giữ lại vì nghe hay", "Đổi số liệu cho nhỏ hơn", "Hỏi bạn bè có ai làm vậy chưa"], answer: 0, explanation: "Mọi dòng trong CV phải đúng sự thật và bạn giải thích được khi phỏng vấn." },
      { id: "m2-05", question: "Vì sao nên cho AI đóng vai nhà tuyển dụng chấm CV?", options: ["Để tìm điểm yếu và sửa trước khi nộp", "Để AI nộp CV giúp bạn", "Để AI quyết định bạn có được nhận không", "Để có CV dài hơn"], answer: 0, explanation: "Góp ý từ góc nhìn nhà tuyển dụng giúp CV khớp tin hơn." },
      { id: "m2-06", question: "Không có add-in AI trong Excel (cần gói trả phí), bạn vẫn làm bảng kỹ năng được bằng cách nào?", options: ["Nhờ AI bản miễn phí xuất bảng hoặc file .xlsx rồi mở bằng Excel Online/Google Sheets", "Không thể làm được", "Phải mua máy tính mới", "Chỉ làm được trên điện thoại"], answer: 0, explanation: "Đường miễn phí: AI soạn bảng/file, bạn chỉnh trong công cụ bảng tính miễn phí." },
      { id: "m2-07", question: "Trước khi áp một công thức Excel do AI viết cho cả bảng, bạn nên làm gì?", options: ["Thử trên vài dòng và tự đếm/tính tay để đối chiếu", "Áp ngay cho cả bảng", "Hỏi AI xem công thức có đúng không, nếu AI nói đúng thì dùng", "Xóa dữ liệu cũ trước"], answer: 0, explanation: "Kiểm tra trên mẫu nhỏ giúp phát hiện công thức sai." },
      { id: "m2-08", question: "Thư xin việc tốt nên làm gì?", options: ["Nhắc đúng tên vị trí, công ty và 2 yêu cầu quan trọng của tin", "Dùng 1 mẫu cho mọi công ty", "Dài ít nhất 2 trang", "Chép nguyên văn AI viết"], answer: 0, explanation: "Thư nhắm đúng tin cho thấy bạn đã tìm hiểu kỹ." },
      { id: "m2-09", question: "Khi luyện phỏng vấn bằng giọng nói với AI, bạn nên dặn AI điều gì?", options: ["Mỗi lần chỉ hỏi 1 câu và chờ bạn trả lời, nhận xét khi kết thúc", "Hỏi tất cả câu cùng lúc", "Tự trả lời mẫu luôn", "Không cần đặt bối cảnh"], answer: 0, explanation: "Giống phỏng vấn thật, có nhận xét ở cuối." },
      { id: "m2-10", question: "Slide giới thiệu bản thân 5 trang nên có gì?", options: ["Bạn là ai, học vấn và kỹ năng, 1 dự án có số liệu, vì sao phù hợp, mục tiêu 1 năm", "Toàn bộ nội dung CV dạng chữ", "Ảnh cá nhân ở mọi trang", "Danh sách mọi môn đã học"], answer: 0, explanation: "Ngắn gọn, mỗi trang một ý, có số liệu." },
      { id: "m2-11", question: "Vì sao nên lập bảng kỹ năng \"có/chưa có\" từ 3 tin tuyển dụng?", options: ["Biết mình thiếu gì để ưu tiên học và biết điểm mạnh để đưa vào CV", "Để gửi bảng cho nhà tuyển dụng", "Để chứng minh mình biết Excel", "Không có tác dụng gì"], answer: 0, explanation: "Bảng kỹ năng là nguyên liệu để học và để viết CV nhắm đúng tin." },
    ],
  },
  {
    id: "M3-AB",
    title: "Trắc nghiệm Module 3 – Workflow AI (khối A và B)",
    drawCount: 10,
    passPercent: 80,
    questions: [
      { id: "m3ab-01", question: "Vì sao nên tách một nhiệm vụ thành nhiều AI agent (mỗi agent một việc)?", options: ["Dễ kiểm soát chất lượng từng bước và sửa đúng chỗ sai", "Để tốn nhiều lượt chat hơn", "Vì AI chỉ trả lời được 1 câu", "Không có lợi ích gì"], answer: 0, explanation: "Mỗi agent một vai giúp kết quả rõ ràng và dễ kiểm tra." },
      { id: "m3ab-02", question: "Agent \"kiểm tra\" trong quy trình có nhiệm vụ gì?", options: ["Soi lỗi logic, số liệu, chính tả trước khi bàn giao", "Viết lại toàn bộ sản phẩm", "Gửi sản phẩm cho khách hàng", "Xóa dữ liệu nháp"], answer: 0, explanation: "Đóng vai người nhận kết quả khó tính để tìm lỗi." },
      { id: "m3ab-03", question: "Bước \"làm sạch dữ liệu\" thường gồm việc gì?", options: ["Xử lý ô trống, dòng trùng, sai định dạng ngày/số", "Xóa toàn bộ cột không hiểu", "Đổi tên file", "Tô màu bảng"], answer: 0, explanation: "Làm sạch giúp phân tích không bị sai." },
      { id: "m3ab-04", question: "\"Đối chiếu\" (reconciliation) là gì?", options: ["So hai nguồn dữ liệu để tìm và giải thích chênh lệch", "Vẽ biểu đồ", "Viết email cho sếp", "Nén file dữ liệu"], answer: 0, explanation: "Ví dụ: so sổ bán hàng với sao kê ngân hàng." },
      { id: "m3ab-05", question: "Một insight tốt trong báo cáo quản trị gồm gì?", options: ["Phát hiện có số liệu, nguyên nhân có thể và đề xuất hành động", "Một bảng số liệu dài", "Một câu khen doanh nghiệp", "Một biểu đồ không có chú thích"], answer: 0, explanation: "Insight phải giúp người đọc ra quyết định." },
      { id: "m3ab-06", question: "Với ChatGPT bản miễn phí, tính năng hẹn giờ (Tasks) có giới hạn gì?", options: ["Tối đa 3 tác vụ đang chạy, lặp tối đa 1 lần mỗi ngày", "Không giới hạn", "Chỉ chạy được 1 lần duy nhất", "Không có trên bản miễn phí"], answer: 0, explanation: "Theo trang hỗ trợ của OpenAI (kiểm tra 10/2026)." },
      { id: "m3ab-07", question: "Khi tự động hóa báo cáo gửi sếp, bước nào KHÔNG được bỏ?", options: ["Con người kiểm tra số liệu trước khi gửi", "Đặt tên file đẹp", "Thêm biểu tượng cảm xúc", "Gửi cho cả công ty"], answer: 0, explanation: "AI có thể sai; người gửi chịu trách nhiệm nội dung." },
      { id: "m3ab-08", question: "Để đo hiệu quả của quy trình AI, bạn cần ghi lại gì?", options: ["Thời gian làm thủ công và thời gian làm có AI cho cùng một việc", "Số lần mở AI", "Số chữ AI viết", "Tên model AI"], answer: 0, explanation: "Số đo trước/sau là bằng chứng cho CV và rubric." },
      { id: "m3ab-09", question: "Dữ liệu nào phù hợp để luyện quy trình trong lộ trình?", options: ["Dữ liệu mẫu công khai (Kaggle) hoặc dữ liệu tự tạo", "Dữ liệu khách hàng thật nơi thực tập", "Bảng lương của công ty", "Sao kê tài khoản của người thân"], answer: 0, explanation: "Không dùng dữ liệu thật có thông tin cá nhân hoặc nội bộ." },
      { id: "m3ab-10", question: "Khi AI phân tích file và đưa ra tổng doanh thu, bạn nên làm gì?", options: ["Tự tính lại bằng công thức (SUMIFS/Pivot) để đối chiếu", "Tin ngay", "Làm tròn số cho đẹp", "Hỏi AI \"có chắc không\" là đủ"], answer: 0, explanation: "Đối chiếu bằng công cụ độc lập với AI." },
      { id: "m3ab-11", question: "Artifact (Claude) hoặc Canvas (ChatGPT) giúp gì?", options: ["Dựng tài liệu/báo cáo có bố cục ngay cạnh cuộc chat và sửa bằng lời", "Tăng tốc độ Internet", "Tự gửi email", "Thay thế Excel hoàn toàn"], answer: 0, explanation: "Giúp ra sản phẩm trình bày được nhanh." },
    ],
  },
  {
    id: "M3-C",
    title: "Trắc nghiệm Module 3 – Workflow AI (khối C – CNTT)",
    drawCount: 10,
    passPercent: 80,
    questions: [
      { id: "m3c-01", question: "Tiêu chí nghiệm thu nào kiểm tra được?", options: ["\"Nhập 5 người và 8 khoản chi thì hiện số tiền mỗi người trả, sai số 0đ\"", "\"Giao diện đẹp\"", "\"Chạy nhanh\"", "\"Người dùng thích\""], answer: 0, explanation: "Tiêu chí kiểm tra được có đầu vào và kết quả cụ thể." },
      { id: "m3c-02", question: "Vì sao nên viết đặc tả trước khi nhờ AI viết code?", options: ["AI viết code đúng ý hơn và bạn có căn cứ để kiểm thử", "Để dự án dài hơn", "Vì AI không viết code nếu thiếu đặc tả", "Không cần thiết"], answer: 0, explanation: "Đặc tả là hợp đồng giữa bạn và AI." },
      { id: "m3c-03", question: "Khi gặp lỗi, thông tin nào nên gửi cho AI?", options: ["Nguyên văn thông báo lỗi, đoạn code liên quan và những gì đã thử", "Chỉ ghi \"code bị lỗi\"", "Toàn bộ dự án mọi lúc", "Ảnh chụp màn hình mờ"], answer: 0, explanation: "Thông tin đủ giúp AI tìm đúng nguyên nhân." },
      { id: "m3c-04", question: "API key nên được lưu ở đâu?", options: ["Biến môi trường (env), không commit lên GitHub", "Ngay trong code cho tiện", "Trong file README", "Gửi vào chat AI để nhờ kiểm tra"], answer: 0, explanation: "Secret lộ lên GitHub có thể bị lạm dụng ngay." },
      { id: "m3c-05", question: "Ca kiểm thử tốt nên có gì?", options: ["Trường hợp bình thường, trường hợp biên và dữ liệu sai", "Chỉ trường hợp bình thường", "Chỉ dữ liệu đẹp", "Không cần kết quả mong đợi"], answer: 0, explanation: "Kiểm thử đa dạng giúp phát hiện lỗi sớm." },
      { id: "m3c-06", question: "Dịch vụ nào phù hợp để deploy miễn phí một trang web tĩnh?", options: ["GitHub Pages", "Máy chủ ở nhà chạy 24/7", "Gửi file HTML qua email", "Lưu trên USB"], answer: 0, explanation: "GitHub Pages miễn phí cho web tĩnh." },
      { id: "m3c-07", question: "Nhờ AI viết code thế nào cho hiệu quả?", options: ["Chia nhỏ theo từng user story, kiểm tra từng phần", "Dán cả dự án và yêu cầu viết hết một lần", "Không đọc code AI viết", "Đổi ngôn ngữ lập trình liên tục"], answer: 0, explanation: "Làm từng phần nhỏ dễ kiểm tra và debug." },
      { id: "m3c-08", question: "Khi AI đưa cách sửa lỗi, bạn nên yêu cầu thêm gì?", options: ["Giải thích nguyên nhân trước khi sửa", "Viết lại toàn bộ dự án", "Bỏ test đi cho nhanh", "Không cần gì thêm"], answer: 0, explanation: "Hiểu nguyên nhân giúp bạn học và tránh lỗi lặp lại." },
      { id: "m3c-09", question: "Sau khi deploy, việc nào cần làm?", options: ["Chạy lại các ca kiểm thử trên bản đã deploy", "Xóa repo", "Tắt bản deploy", "Không cần làm gì"], answer: 0, explanation: "Môi trường thật có thể khác máy của bạn." },
      { id: "m3c-10", question: "Mục \"ngoài phạm vi\" trong đặc tả để làm gì?", options: ["Ghi rõ những gì không làm, tránh dự án phình to", "Ghi tên người không tham gia", "Liệt kê lỗi chưa sửa", "Không có tác dụng"], answer: 0, explanation: "Giữ dự án vừa sức trong thời gian cho phép." },
      { id: "m3c-11", question: "Vì sao nên để AI hỏi lại bạn trước khi viết đặc tả?", options: ["Làm rõ yêu cầu, tránh AI tự đoán sai", "Để tốn thời gian", "Vì AI không biết viết", "Để AI ghi nhớ tên bạn"], answer: 0, explanation: "Yêu cầu mơ hồ dẫn tới code sai." },
    ],
  },
];

export function findQuiz(id: QuizBank["id"]) {
  return QUIZZES.find((quiz) => quiz.id === id);
}
