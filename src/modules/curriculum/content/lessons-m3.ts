import type { Lesson } from "../types";

// Module 3 – Workflow AI theo khối ngành (ngày 15–21). Bám Đề cương: buổi 7, 8, 9; 3 nhánh A/B/C.
// Một nhiệm vụ duy nhất xuyên suốt 3 buổi.

const SAFETY_DATA = "Chỉ dùng dữ liệu mẫu công khai (Kaggle) hoặc dữ liệu tự tạo; không dùng dữ liệu thật của nơi thực tập.";

export const LESSONS_M3: Lesson[] = [
  {
    number: 7,
    slug: "nhan-nhiem-vu-va-chuan-bi",
    moduleId: "M3",
    title: "Nhận nhiệm vụ và chuẩn bị đầu vào cho quy trình",
    minutes: 60,
    n1Topics: "Khối A/B: chủ đề 16, 20. Khối C: chủ đề 16 (tham khảo)",
    content: {
      A: {
        goal: "Nhận 1 nhiệm vụ thực tế của dân văn phòng/marketing/kinh doanh, dùng AI nghiên cứu và viết bản nháp.",
        why: "Workshop đã demo quy trình Nhận việc → Giao các AI agent → Kiểm tra → Hoàn thiện → Bàn giao. Tuần này bạn tự làm lại với một nhiệm vụ của mình.",
        keyIdeas: [
          "Chia nhiệm vụ lớn thành các bước nhỏ, mỗi bước giao cho một \"AI agent\" (một cuộc chat có vai trò riêng): nghiên cứu, viết nháp, kiểm tra.",
          "Ghi lại thời gian bạn mất cho từng bước, để buổi 9 so sánh có AI và không có AI.",
          SAFETY_DATA,
        ],
        steps: [
          { title: "Chọn nhiệm vụ", detail: "Ví dụ: kế hoạch ra mắt một sản phẩm cho cửa hàng người quen; kế hoạch truyền thông 2 tuần cho sự kiện CLB; báo cáo đối thủ cạnh tranh của một thương hiệu." },
          { title: "Viết đề bài nhiệm vụ 5 dòng", detail: "Mục tiêu, người nhận kết quả, hạn, đầu ra cần có, giới hạn (ngân sách, kênh)." },
          { title: "Agent 1 – Nghiên cứu", detail: "Mở 1 cuộc chat mới, dùng prompt mẫu 1. Yêu cầu có nguồn để kiểm chứng." },
          { title: "Agent 2 – Viết bản nháp", detail: "Mở cuộc chat khác, dán đề bài + kết quả nghiên cứu, dùng prompt mẫu 2." },
          { title: "Ghi thời gian", detail: "Ghi số phút cho từng bước vào ghi chú." },
        ],
        prompts: [
          { title: "Prompt 1 – Agent nghiên cứu", text: "Bạn là chuyên viên nghiên cứu thị trường. Nhiệm vụ: [DÁN ĐỀ BÀI]. Hãy tổng hợp: khách hàng mục tiêu, 3 đối thủ và điểm khác biệt, 3 kênh truyền thông phù hợp, kèm nguồn cho mỗi dữ kiện. Chỗ nào là giả định thì ghi rõ [GIẢ ĐỊNH]." },
          { title: "Prompt 2 – Agent viết nháp", text: "Bạn là chuyên viên marketing. Dựa trên đề bài và kết quả nghiên cứu dưới đây, viết bản nháp [kế hoạch/báo cáo] gồm: mục tiêu đo được, thông điệp chính, lịch triển khai theo ngày, ngân sách dự kiến, chỉ số đo hiệu quả. [DÁN]" },
        ],
        example: "Nhiệm vụ: kế hoạch ra mắt món mới cho quán cà phê gần trường trong 2 tuần, ngân sách 3 triệu. Bản nháp có 4 mục tiêu đo được (vd. 300 lượt check-in), lịch đăng bài 14 ngày, 3 ý tưởng minigame.",
        commonMistakes: ["Chọn nhiệm vụ quá lớn (\"chiến lược marketing cho Vinamilk\").", "Dồn mọi bước vào 1 cuộc chat dài.", "Không ghi thời gian từng bước."],
        selfCheck: ["Đề bài có đủ 5 dòng.", "Kết quả nghiên cứu có nguồn hoặc ghi rõ giả định.", "Có bản nháp hoàn chỉnh để buổi 8 làm tiếp."],
        resources: [
          { code: "N1", focus: "Chủ đề 16, 20", summary: "Kiểm soát quy trình làm việc với AI; vì sao tách nhỏ thành từng agent." },
          { code: "N8", summary: "Dữ liệu mẫu công khai nếu nhiệm vụ cần số liệu." },
          { code: "N11", summary: "Bài về prompt và ứng dụng AI tạo sinh (có bản tiếng Việt)." },
        ],
        evidence: [
          { key: "brief", label: "Đề bài nhiệm vụ (5 dòng)", type: "textarea", minLength: 120 },
          { key: "draft", label: "Link bản nháp (Google Docs, chế độ xem)", type: "link" },
          { key: "minutes", label: "Tổng thời gian buổi này", type: "number", unit: "phút" },
        ],
      },
      B: {
        goal: "Từ một file dữ liệu mẫu, dùng AI làm sạch và đối chiếu dữ liệu.",
        why: "Workshop đã demo quy trình Raw Data → Cleaning → Reconciliation → Analysis → Insight → Report → Automation. Tuần này bạn tự làm lại các bước đầu với một bộ dữ liệu.",
        keyIdeas: [
          "Làm sạch dữ liệu: xử lý ô trống, trùng dòng, định dạng ngày và số (dấu chấm/phẩy), đơn vị tiền tệ.",
          "Đối chiếu (reconciliation): so 2 nguồn (vd. sổ bán hàng và sao kê) để tìm chênh lệch.",
          "AI có thể viết công thức hoặc tự chạy phân tích nếu bạn tải file lên (Claude, ChatGPT đều có tính năng phân tích file). Luôn kiểm tra kết quả trên vài dòng.",
          SAFETY_DATA,
        ],
        steps: [
          { title: "Lấy dữ liệu mẫu", detail: "Trên Kaggle, tìm bộ dữ liệu bán hàng/doanh thu nhỏ (dưới 5.000 dòng), vd. từ khóa \"sales dataset\", \"retail transactions\". Hoặc nhờ AI tạo bộ dữ liệu giả có lỗi cố ý." },
          { title: "Nhờ AI kiểm tra chất lượng dữ liệu", detail: "Tải file lên AI, dùng prompt mẫu 1." },
          { title: "Làm sạch", detail: "Làm theo đề xuất của AI (trên Google Sheets/Excel hoặc nhờ AI xuất file đã làm sạch). Ghi lại mỗi bước đã làm." },
          { title: "Đối chiếu", detail: "Tạo nguồn thứ hai (vd. bảng tổng hợp theo tháng do AI tính) và đối chiếu với tổng bạn tự tính bằng công thức. Ghi chênh lệch nếu có." },
          { title: "Ghi thời gian", detail: "Ghi số phút để so sánh ở buổi 9." },
        ],
        prompts: [
          { title: "Prompt 1 – Kiểm tra chất lượng dữ liệu", text: "Bạn là kế toán viên kiểm tra dữ liệu. Với file đính kèm, hãy: (1) mô tả cấu trúc (cột, kiểu dữ liệu, số dòng), (2) liệt kê lỗi: ô trống, trùng lặp, sai định dạng ngày/số, giá trị bất thường, (3) đề xuất cách xử lý từng lỗi. Trình bày dạng bảng. Không tự sửa dữ liệu khi chưa được tôi đồng ý." },
          { title: "Prompt 2 – Đối chiếu", text: "So sánh tổng doanh thu theo tháng bạn tính được với bảng tôi tự tính bằng SUMIFS dưới đây. Liệt kê tháng chênh lệch và nguyên nhân có thể. [DÁN BẢNG]" },
        ],
        example: "Bộ dữ liệu 2.300 dòng: AI phát hiện 41 dòng trùng, 120 ô ngày ghi dạng văn bản, 3 dòng giá âm. Sau làm sạch còn 2.259 dòng; tổng doanh thu tháng 3 lệch 1,2 triệu do 1 đơn ghi sai đơn vị.",
        commonMistakes: ["Để AI tự sửa mà không ghi lại đã sửa gì.", "Không tự kiểm tra lại tổng bằng công thức.", "Dùng file dữ liệu khách hàng thật."],
        selfCheck: ["Có danh sách lỗi và cách xử lý.", "Tổng sau làm sạch được đối chiếu bằng công thức của bạn.", "Có file dữ liệu sạch để buổi 8 phân tích."],
        resources: [
          { code: "N1", focus: "Chủ đề 16, 20", summary: "Kiểm soát quy trình làm việc với AI; tách nhỏ thành từng agent." },
          { code: "N8", summary: "Nơi lấy dữ liệu mẫu công khai." },
          { code: "N11", summary: "Kiến thức nền về ứng dụng AI tạo sinh." },
        ],
        evidence: [
          { key: "dataset", label: "Link bộ dữ liệu gốc (Kaggle hoặc file tự tạo)", type: "link" },
          { key: "cleanLog", label: "Các lỗi tìm được và cách đã xử lý", type: "textarea", minLength: 120 },
          { key: "cleanFile", label: "Link file dữ liệu đã làm sạch (chế độ xem)", type: "link" },
          { key: "minutes", label: "Tổng thời gian buổi này", type: "number", unit: "phút" },
        ],
      },
      C: {
        goal: "Từ 1 yêu cầu nhỏ, dùng AI viết đặc tả (specification) và thiết kế kiến trúc cho một tính năng.",
        why: "Workshop đã demo quy trình Requirement → Specification → Architecture → Coding → Testing → Debugging → Deploy. Viết đặc tả trước giúp AI viết code đúng ý ngay từ đầu.",
        keyIdeas: [
          "Đặc tả tốt có: mục tiêu, người dùng, user story, tiêu chí nghiệm thu đo được, ngoài phạm vi.",
          "Kiến trúc đơn giản: chọn công nghệ quen thuộc, vẽ luồng dữ liệu, liệt kê file/thành phần cần có.",
          "Bắt AI hỏi lại khi yêu cầu chưa rõ thay vì tự đoán.",
        ],
        steps: [
          { title: "Chọn yêu cầu nhỏ", detail: "Ví dụ: trang đăng ký sự kiện CLB lưu vào Google Sheets; công cụ chia tiền nhóm; trang tra cứu điểm danh. Làm được trong 3 buổi." },
          { title: "Nhờ AI phỏng vấn bạn", detail: "Dùng prompt mẫu 1 để AI hỏi cho rõ yêu cầu." },
          { title: "Viết đặc tả", detail: "Dùng prompt mẫu 2, sau đó tự sửa phần AI hiểu sai." },
          { title: "Thiết kế kiến trúc", detail: "Yêu cầu AI đề xuất 2 phương án công nghệ (ưu tiên miễn phí, dễ deploy), chọn 1 và ghi lý do." },
        ],
        prompts: [
          { title: "Prompt 1 – AI phỏng vấn yêu cầu", text: "Tôi muốn làm [MÔ TẢ 1 CÂU]. Trước khi viết đặc tả, hãy hỏi tôi tối đa 8 câu để làm rõ người dùng, chức năng bắt buộc, dữ liệu, giới hạn. Hỏi từng câu một." },
          { title: "Prompt 2 – Viết đặc tả", text: "Dựa trên câu trả lời của tôi, viết đặc tả gồm: mục tiêu, người dùng, user story (dạng \"Là…, tôi muốn…, để…\"), tiêu chí nghiệm thu kiểm tra được, ngoài phạm vi. Sau đó đề xuất 2 phương án kiến trúc miễn phí, dễ deploy cho người mới, so sánh ưu nhược." },
        ],
        example: "Yêu cầu: trang chia tiền đi chơi nhóm. Đặc tả 5 user story, 7 tiêu chí nghiệm thu (vd. \"nhập 5 người và 8 khoản chi thì hiện số tiền mỗi người phải trả, sai số 0đ\"). Kiến trúc: HTML + JavaScript thuần, deploy GitHub Pages.",
        commonMistakes: ["Chọn dự án quá lớn (mạng xã hội, sàn thương mại điện tử).", "Tiêu chí nghiệm thu không kiểm tra được (\"giao diện đẹp\").", "Bỏ qua bước AI hỏi lại."],
        selfCheck: ["Có ít nhất 5 tiêu chí nghiệm thu kiểm tra được.", "Có mục ngoài phạm vi.", "Có lý do chọn kiến trúc."],
        resources: [
          { code: "N11", summary: "Khóa mã nguồn mở của Microsoft, có bản tiếng Việt: xây ứng dụng AI bằng code." },
          { code: "N8", summary: "Dữ liệu mẫu nếu tính năng cần dữ liệu." },
          { code: "N1", focus: "Chủ đề 16 (tham khảo)", summary: "Tổng quan kiểm soát quy trình với AI; khóa không dạy lập trình." },
        ],
        evidence: [
          { key: "spec", label: "Link đặc tả (Google Docs/GitHub, chế độ xem)", type: "link" },
          { key: "architecture", label: "Phương án kiến trúc đã chọn và lý do", type: "textarea", minLength: 100 },
          { key: "minutes", label: "Tổng thời gian buổi này", type: "number", unit: "phút" },
        ],
      },
    },
  },
  {
    number: 8,
    slug: "ra-san-pham",
    moduleId: "M3",
    title: "Ra sản phẩm và kiểm tra",
    minutes: 60,
    n1Topics: "Khối A/B: chủ đề 17",
    content: {
      A: {
        goal: "Biến bản nháp buổi 7 thành sản phẩm hoàn chỉnh (báo cáo hoặc slide) bằng Artifact, và kiểm tra số liệu.",
        why: "Sản phẩm bàn giao được mới là thứ ghi vào CV. Artifact (Claude) hoặc Canvas (ChatGPT) giúp dựng báo cáo/trang trình bày có bố cục ngay trong chat.",
        keyIdeas: [
          "Artifact/Canvas: AI tạo tài liệu hoặc trang web nhỏ hiển thị bên cạnh chat, sửa trực tiếp bằng lời.",
          "Agent kiểm tra: một cuộc chat riêng đóng vai sếp/khách hàng soi lỗi trước khi bàn giao.",
        ],
        steps: [
          { title: "Dựng sản phẩm", detail: "Dán bản nháp vào Claude, dùng prompt mẫu 1 để tạo Artifact (hoặc Canvas trong ChatGPT)." },
          { title: "Agent kiểm tra", detail: "Mở cuộc chat mới, dùng prompt mẫu 2 để soi lỗi logic, số liệu, chính tả." },
          { title: "Kiểm chứng số liệu", detail: "Tự mở nguồn cho ít nhất 3 số liệu quan trọng nhất." },
          { title: "Hoàn thiện và chia sẻ link", detail: "Sửa theo góp ý hợp lý, xuất bản/chia sẻ link xem." },
        ],
        prompts: [
          { title: "Prompt 1 – Dựng sản phẩm", text: "Biến bản nháp dưới đây thành [báo cáo 1 trang / slide 6 trang] dạng Artifact: có tiêu đề, phần tóm tắt cho sếp đọc trong 30 giây, bảng lịch triển khai, ngân sách, chỉ số đo. Trình bày rõ ràng, dễ in. [DÁN]" },
          { title: "Prompt 2 – Agent kiểm tra", text: "Bạn là trưởng phòng khó tính. Soi [báo cáo] dưới đây và liệt kê: lỗi logic, số liệu thiếu nguồn hoặc phi thực tế, chỗ mơ hồ, lỗi chính tả. Xếp theo mức nghiêm trọng." },
        ],
        example: "Báo cáo 1 trang dạng Artifact; agent kiểm tra phát hiện ngân sách in ấn vượt tổng ngân sách và mục tiêu 300 check-in thiếu căn cứ → sửa còn 200 dựa trên số khách trung bình.",
        commonMistakes: ["Không có agent kiểm tra riêng.", "Không tự mở nguồn số liệu."],
        selfCheck: ["Sản phẩm có link xem được.", "Ít nhất 3 số liệu đã tự kiểm chứng.", "Đã sửa theo góp ý của agent kiểm tra."],
        resources: [
          { code: "N1", focus: "Chủ đề 17", summary: "Thực hành làm báo cáo với Artifact." },
          { code: "N8", summary: "Dữ liệu mẫu nếu báo cáo cần số liệu." },
          { code: "N11", summary: "Kiến thức nền về AI tạo sinh." },
        ],
        evidence: [
          { key: "product", label: "Link sản phẩm (Artifact/Canvas/Google Docs, chế độ xem)", type: "link" },
          { key: "review", label: "Các lỗi agent kiểm tra tìm ra và bạn đã sửa gì", type: "textarea", minLength: 100 },
          { key: "minutes", label: "Tổng thời gian buổi này", type: "number", unit: "phút" },
        ],
      },
      B: {
        goal: "Phân tích dữ liệu đã làm sạch, rút ra insight và làm báo cáo quản trị bằng Artifact.",
        why: "Sếp không cần bảng số liệu thô mà cần 3–5 kết luận để ra quyết định. Đây là phần giá trị nhất của quy trình.",
        keyIdeas: [
          "Insight = phát hiện + nguyên nhân có thể + đề xuất hành động.",
          "Báo cáo quản trị: tóm tắt điều hành, 3–5 biểu đồ chính, bảng chỉ số, đề xuất.",
          "Kiểm tra mọi con số trong báo cáo với dữ liệu sạch bằng công thức của bạn.",
        ],
        steps: [
          { title: "Phân tích", detail: "Tải file đã làm sạch lên AI, dùng prompt mẫu 1." },
          { title: "Chọn 3–5 insight", detail: "Giữ insight có số liệu và đề xuất được hành động." },
          { title: "Dựng báo cáo Artifact", detail: "Dùng prompt mẫu 2 để tạo báo cáo có biểu đồ." },
          { title: "Đối chiếu số liệu", detail: "Kiểm tra lại các con số chính bằng SUMIFS/Pivot." },
        ],
        prompts: [
          { title: "Prompt 1 – Phân tích", text: "Với dữ liệu bán hàng đã làm sạch đính kèm, hãy phân tích: xu hướng theo tháng, top 5 sản phẩm/khu vực, biến động bất thường. Với mỗi phát hiện, nêu nguyên nhân có thể và đề xuất hành động. Ghi rõ phép tính đã dùng." },
          { title: "Prompt 2 – Báo cáo quản trị", text: "Tạo báo cáo quản trị dạng Artifact cho giám đốc: tóm tắt 5 dòng, 3 biểu đồ (doanh thu theo tháng, top sản phẩm, tỉ trọng theo khu vực), bảng chỉ số, 3 đề xuất. Dùng đúng số liệu ở trên." },
        ],
        example: "Insight: \"Doanh thu tháng 7 giảm 18% so với tháng 6, chủ yếu do khu vực miền Trung (−35%); đề xuất kiểm tra tồn kho và chương trình khuyến mãi khu vực này.\"",
        commonMistakes: ["Báo cáo liệt kê số liệu mà không có kết luận.", "Biểu đồ dùng số khác với bảng."],
        selfCheck: ["Mỗi insight có số liệu, nguyên nhân và đề xuất.", "Các con số chính đã đối chiếu bằng công thức.", "Báo cáo có link xem được."],
        resources: [
          { code: "N1", focus: "Chủ đề 17", summary: "Thực hành làm báo cáo với Artifact." },
          { code: "N8", summary: "Dữ liệu mẫu." },
          { code: "N11", summary: "Kiến thức nền về AI tạo sinh." },
        ],
        evidence: [
          { key: "report", label: "Link báo cáo quản trị (Artifact/Google Docs, chế độ xem)", type: "link" },
          { key: "insights", label: "3–5 insight chính", type: "textarea", minLength: 150 },
          { key: "minutes", label: "Tổng thời gian buổi này", type: "number", unit: "phút" },
        ],
      },
      C: {
        goal: "Dùng AI viết code, viết test và sửa lỗi để tính năng chạy đúng theo đặc tả.",
        why: "AI viết code nhanh, nhưng chỉ có test mới chứng minh code đúng. Biết đọc lỗi và hỏi AI đúng cách là kỹ năng nhà tuyển dụng IT cần.",
        keyIdeas: [
          "Đưa đặc tả + tiêu chí nghiệm thu cho AI, yêu cầu viết từng phần nhỏ.",
          "Viết test (hoặc danh sách ca kiểm thử thủ công) dựa trên tiêu chí nghiệm thu, chạy với dữ liệu khác nhau.",
          "Khi lỗi: dán nguyên thông báo lỗi + đoạn code liên quan, mô tả đã thử gì.",
          "Không dán API key, mật khẩu vào chat hay vào code đẩy lên GitHub.",
        ],
        steps: [
          { title: "Tạo repo GitHub", detail: "Tạo repo công khai, có file README ghi mục tiêu dự án." },
          { title: "Viết code từng phần", detail: "Dùng prompt mẫu 1, mỗi lần 1 user story." },
          { title: "Viết test/ca kiểm thử", detail: "Dùng prompt mẫu 2. Chạy và ghi kết quả." },
          { title: "Debug", detail: "Dùng prompt mẫu 3 khi gặp lỗi. Ghi lại 1 lỗi khó nhất và cách sửa." },
        ],
        prompts: [
          { title: "Prompt 1 – Viết code theo user story", text: "Dựa trên đặc tả dưới đây, hãy viết code cho user story số [x] bằng [công nghệ]. Code đơn giản, có chú thích tiếng Việt, chỉ dùng thư viện miễn phí. Giải thích cách chạy thử. [DÁN ĐẶC TẢ]" },
          { title: "Prompt 2 – Ca kiểm thử", text: "Từ các tiêu chí nghiệm thu trên, viết danh sách ca kiểm thử (đầu vào – kết quả mong đợi), gồm cả trường hợp biên và dữ liệu sai. Nếu dự án có thể viết test tự động, viết test bằng [framework]." },
          { title: "Prompt 3 – Debug", text: "Tôi gặp lỗi khi [thao tác]. Thông báo lỗi: [DÁN]. Đoạn code liên quan: [DÁN]. Tôi đã thử: [..]. Hãy giải thích nguyên nhân trước, rồi mới đưa cách sửa." },
        ],
        example: "Repo chia tiền nhóm: 4/5 user story chạy; 12 ca kiểm thử, pass 11; lỗi khó nhất: làm tròn số tiền gây lệch 1đ, sửa bằng cách dồn phần dư cho người trả cuối.",
        commonMistakes: ["Dán cả dự án vào chat một lần.", "Không chạy thử với dữ liệu khác nhau.", "Đẩy API key lên GitHub."],
        selfCheck: ["Repo có README và code chạy được.", "Có danh sách ca kiểm thử với kết quả.", "Ghi được 1 lỗi đã debug."],
        resources: [
          { code: "N11", summary: "Xây ứng dụng AI bằng code, có bản tiếng Việt." },
          { code: "N8", summary: "Dữ liệu mẫu để kiểm thử." },
          { code: "N1", focus: "Chủ đề 17 (tham khảo)", summary: "Artifact: dựng nhanh giao diện thử nghiệm." },
        ],
        evidence: [
          { key: "repo", label: "Link repo GitHub", type: "link" },
          { key: "tests", label: "Danh sách ca kiểm thử và kết quả", type: "textarea", minLength: 120 },
          { key: "bug", label: "Lỗi khó nhất và cách sửa", type: "textarea", minLength: 60 },
          { key: "minutes", label: "Tổng thời gian buổi này", type: "number", unit: "phút" },
        ],
      },
    },
  },
  {
    number: 9,
    slug: "tu-dong-hoa",
    moduleId: "M3",
    title: "Tự động hóa 1 bước lặp lại; đo thời gian có và không có AI",
    minutes: 60,
    n1Topics: "Khối A/B: chủ đề 18, 19, 21–25",
    content: {
      A: {
        goal: "Tự động hóa 1 bước lặp lại trong quy trình (vd. AI tự tổng hợp tin mỗi sáng, tự soạn email báo cáo), và đo thời gian tiết kiệm được.",
        why: "Tự động hóa là thứ biến \"biết dùng AI\" thành \"tiết kiệm được giờ làm\" – con số nhà tuyển dụng thích nghe.",
        keyIdeas: [
          "Hẹn giờ cho AI tự chạy: ChatGPT Tasks (bản miễn phí: tối đa 3 tác vụ, lặp 1 lần/ngày); Claude scheduled tasks (gói trả phí).",
          "Kết nối Gmail/Drive: Claude bản miễn phí soạn nháp email từ dữ liệu Drive (không tự gửi).",
          "Tách agent: mỗi agent 1 việc (thu thập → tóm tắt → soạn email) dễ kiểm soát hơn 1 agent làm tất cả.",
          "Đo hiệu quả: so thời gian làm thủ công và làm có AI cho cùng 1 việc.",
        ],
        steps: [
          { title: "Chọn bước lặp lại", detail: "Ví dụ: mỗi sáng tổng hợp tin về đối thủ; mỗi tuần soạn email báo cáo tiến độ từ file Google Sheets." },
          { title: "Làm thủ công 1 lần, bấm giờ", detail: "Ghi số phút." },
          { title: "Cài tự động hóa", detail: "Cách miễn phí: tạo ChatGPT Task chạy hằng ngày với prompt mẫu 1; hoặc kết nối Claude với Drive và dùng prompt mẫu 2 để soạn nháp email." },
          { title: "Chạy thử và bấm giờ", detail: "Tính thời gian cài đặt + thời gian kiểm tra kết quả." },
          { title: "Chụp ảnh cấu hình và kết quả", detail: "Che thông tin cá nhân trước khi nộp." },
        ],
        prompts: [
          { title: "Prompt 1 – Tác vụ hằng ngày", text: "Mỗi ngày lúc 7 giờ sáng: tìm 5 tin mới nhất trong 24 giờ qua về [chủ đề/thương hiệu], tóm tắt mỗi tin 2 dòng, kèm link nguồn, đánh dấu tin quan trọng nhất cho bộ phận marketing." },
          { title: "Prompt 2 – Soạn email báo cáo từ Drive", text: "Đọc file Google Sheets [TÊN FILE] trong Drive của tôi, soạn nháp email báo cáo tiến độ tuần gửi trưởng nhóm: 3 việc đã xong, 2 việc đang làm, 1 vướng mắc. Không gửi, chỉ tạo bản nháp." },
        ],
        example: "Tổng hợp tin đối thủ: thủ công 35 phút/ngày → có AI 6 phút/ngày (đọc và chỉnh bản tóm tắt). Cài đặt mất 20 phút một lần.",
        commonMistakes: ["Không làm thủ công để có mốc so sánh.", "Tự động hóa nhưng không kiểm tra kết quả."],
        selfCheck: ["Có ảnh cấu hình tự động hóa.", "Có 2 con số: phút thủ công và phút có AI.", "Biết giới hạn của gói miễn phí đang dùng."],
        freePath: "Dùng ChatGPT Tasks bản miễn phí (3 tác vụ, 1 lần/ngày) hoặc Claude kết nối Gmail/Drive bản miễn phí (soạn nháp). Muốn làm sâu hơn: Google Apps Script (cần viết ít code).",
        resources: [
          { code: "N1", focus: "Chủ đề 18, 19, 21–25", summary: "Kết nối Gmail/Drive, Schedule, vận hành nhiều nhân viên AI và bài tập." },
          { code: "N9", summary: "Tách việc thành agent và đóng gói Skill (miễn phí, tiếng Anh)." },
          { code: "S5", summary: "Hướng dẫn hẹn giờ tác vụ trong ChatGPT." },
          { code: "S6", summary: "Kết nối Claude với Gmail/Drive." },
          { code: "S7", summary: "Google Apps Script: tự động gửi email từ Google Sheets." },
        ],
        evidence: [
          { key: "automation", label: "Ảnh chụp cấu hình tự động hóa và kết quả (che thông tin cá nhân)", type: "file", accept: "image/*" },
          { key: "manualMinutes", label: "Thời gian làm thủ công", type: "number", unit: "phút" },
          { key: "aiMinutes", label: "Thời gian làm có AI", type: "number", unit: "phút" },
        ],
      },
      B: {
        goal: "Tự động hóa báo cáo định kỳ (vd. AI tự tổng hợp số liệu tuần và soạn email gửi sếp), và đo thời gian tiết kiệm được.",
        why: "Báo cáo định kỳ là việc lặp lại nhiều nhất của dân kế toán – tài chính; tự động hóa được là điểm cộng lớn trong CV.",
        keyIdeas: [
          "Cùng công cụ như khối A: ChatGPT Tasks (miễn phí, 1 lần/ngày), Claude kết nối Drive (soạn nháp), Google Apps Script (cần code).",
          "Báo cáo tự động vẫn phải có bước con người kiểm tra trước khi gửi.",
        ],
        steps: [
          { title: "Chọn báo cáo định kỳ", detail: "Ví dụ: tổng hợp doanh thu tuần từ file Google Sheets và soạn email tóm tắt." },
          { title: "Làm thủ công 1 lần, bấm giờ", detail: "Ghi số phút." },
          { title: "Cài tự động hóa", detail: "Dùng prompt mẫu 1 với Claude kết nối Drive, hoặc tạo ChatGPT Task nhắc chạy hằng tuần." },
          { title: "Chạy thử, kiểm tra số liệu, bấm giờ", detail: "So con số trong email với Pivot/SUMIFS của bạn." },
        ],
        prompts: [
          { title: "Prompt 1 – Báo cáo tuần", text: "Đọc file Google Sheets [TÊN FILE] trong Drive, tổng hợp doanh thu 7 ngày gần nhất theo sản phẩm, so với tuần trước (%), soạn nháp email gửi giám đốc: 3 dòng tóm tắt, bảng số liệu, 1 cảnh báo nếu có sản phẩm giảm trên 20%. Không gửi, chỉ tạo bản nháp." },
        ],
        example: "Báo cáo tuần: thủ công 50 phút → có AI 12 phút (gồm kiểm tra số liệu).",
        commonMistakes: ["Gửi báo cáo mà không đối chiếu số liệu.", "Không ghi thời gian thủ công."],
        selfCheck: ["Số liệu trong email khớp với công thức của bạn.", "Có 2 con số thời gian."],
        freePath: "Dùng Claude kết nối Drive bản miễn phí để soạn nháp, hoặc ChatGPT Tasks bản miễn phí để nhắc/chạy hằng ngày.",
        resources: [
          { code: "N1", focus: "Chủ đề 18, 19, 21–25", summary: "Kết nối Gmail/Drive, Schedule, vận hành nhân viên AI." },
          { code: "N9", summary: "Tách việc thành agent và đóng gói Skill." },
          { code: "S5", summary: "Hẹn giờ tác vụ trong ChatGPT." },
          { code: "S6", summary: "Kết nối Claude với Gmail/Drive." },
          { code: "S7", summary: "Google Apps Script cho báo cáo tự động." },
        ],
        evidence: [
          { key: "automation", label: "Ảnh chụp cấu hình tự động hóa và kết quả (che thông tin cá nhân)", type: "file", accept: "image/*" },
          { key: "manualMinutes", label: "Thời gian làm thủ công", type: "number", unit: "phút" },
          { key: "aiMinutes", label: "Thời gian làm có AI", type: "number", unit: "phút" },
        ],
      },
      C: {
        goal: "Deploy tính năng lên dịch vụ miễn phí để người khác dùng được qua link, và đo thời gian làm có AI.",
        why: "Sản phẩm có link chạy thật là bằng chứng mạnh nhất trong CV của SV IT.",
        keyIdeas: [
          "Dịch vụ miễn phí phù hợp người mới: GitHub Pages (web tĩnh), Vercel/Netlify (web có build), Google Apps Script (web app nhỏ).",
          "Biến môi trường (env) để giữ bí mật, không ghi thẳng vào code.",
          "Đo hiệu quả: ước lượng thời gian tự code không có AI so với thời gian thực tế có AI.",
        ],
        steps: [
          { title: "Chọn dịch vụ deploy", detail: "Hỏi AI dịch vụ phù hợp với kiến trúc đã chọn ở buổi 7." },
          { title: "Deploy theo hướng dẫn", detail: "Dùng prompt mẫu 1, làm từng bước, chụp màn hình khi xong." },
          { title: "Kiểm thử trên link thật", detail: "Chạy lại các ca kiểm thử của buổi 8 trên bản đã deploy." },
          { title: "Ghi thời gian", detail: "Tổng thời gian 3 buổi có AI và ước lượng nếu tự làm không có AI." },
        ],
        prompts: [
          { title: "Prompt 1 – Hướng dẫn deploy", text: "Repo của tôi là [MÔ TẢ/LINK], dùng [công nghệ]. Hướng dẫn tôi deploy miễn phí lên [dịch vụ] từng bước một cho người mới, gồm cách đặt biến môi trường an toàn. Sau mỗi bước, chờ tôi xác nhận rồi mới sang bước tiếp." },
        ],
        example: "Deploy GitHub Pages; link chạy trên điện thoại; 11/12 ca kiểm thử pass trên bản thật. Có AI: 3 giờ; ước lượng tự làm: 10 giờ.",
        commonMistakes: ["Đẩy file .env lên GitHub.", "Không kiểm thử lại trên bản đã deploy."],
        selfCheck: ["Link deploy mở được trên điện thoại.", "Không có secret trong repo.", "Có 2 con số thời gian."],
        resources: [
          { code: "N11", summary: "Có bài về đưa ứng dụng lên môi trường thật." },
          { code: "N9", summary: "Tách việc thành agent và đóng gói Skill." },
          { code: "S7", summary: "Google Apps Script: lựa chọn deploy web app nhỏ miễn phí." },
        ],
        evidence: [
          { key: "deployUrl", label: "Link sản phẩm đã deploy", type: "link" },
          { key: "manualMinutes", label: "Ước lượng thời gian tự làm không có AI", type: "number", unit: "phút" },
          { key: "aiMinutes", label: "Thời gian thực tế làm có AI", type: "number", unit: "phút" },
        ],
      },
    },
  },
];
