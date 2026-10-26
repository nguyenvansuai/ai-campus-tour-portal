import type { Metadata } from "next";
import { CURRENT_TERMS_VERSION } from "@/modules/identity/consent";

export const metadata: Metadata = { title: "Điều khoản xử lý dữ liệu · AI Campus Tour" };

// Nội dung theo docs/DIEU_KHOAN_DU_LIEU.md (bản nháp, chờ tư vấn pháp lý duyệt).

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 leading-7">
      <h1 className="text-2xl font-bold">Điều khoản xử lý dữ liệu cá nhân</h1>
      <p className="text-sm text-muted-foreground">Phiên bản {CURRENT_TERMS_VERSION}</p>

      <Section title="1. Ai xử lý dữ liệu của bạn">
        <p>Chương trình AI Campus Tour (sáng lập bởi Sự AI) vận hành portal aicampustour.suai.vn. Liên hệ: qua trang suai.vn.</p>
      </Section>
      <Section title="2. Dữ liệu chúng tôi thu thập">
        <ul className="list-disc pl-5">
          <li>Thông tin tài khoản: họ tên, email, số điện thoại, mã số sinh viên, trường, khoa, lớp.</li>
          <li>Dữ liệu học tập: tiến độ, kết quả trắc nghiệm, báo cáo, nhận xét của mentor, điểm dự án, chứng nhận.</li>
          <li>Bài nộp và minh chứng: file, ảnh chụp, đường link bạn nộp. Một số bài (CV, thư xin việc) có thể chứa thông tin cá nhân do bạn tự đưa vào.</li>
          <li>Dữ liệu kỹ thuật: thời điểm đăng nhập, thiết bị/trình duyệt, để bảo mật và xử lý lỗi.</li>
        </ul>
      </Section>
      <Section title="3. Mục đích sử dụng">
        <ul className="list-disc pl-5">
          <li>Quản lý việc học, chấm bài, hỗ trợ và nhắc nhở bạn trong lộ trình 30 ngày.</li>
          <li>Cấp và xác thực chứng nhận hoàn thành.</li>
          <li>Báo cáo tiến độ cho trường của bạn (nếu trường đã kết nối với chương trình) và Viện Đào tạo Bách Khoa.</li>
          <li>Thống kê tổng hợp, ẩn danh, để cải thiện chương trình.</li>
        </ul>
      </Section>
      <Section title="4. Nơi lưu trữ, bao gồm lưu trữ ở nước ngoài">
        <ul className="list-disc pl-5">
          <li>Dữ liệu tài khoản và học tập lưu trên máy chủ của chương trình.</li>
          <li>File và minh chứng bạn tải lên được lưu trên Google Drive (máy chủ có thể đặt ngoài lãnh thổ Việt Nam), không chia sẻ công khai; chỉ mentor, trợ giảng và giáo viên có thẩm quyền xem được, thông qua portal.</li>
          <li>Email thông báo được gửi qua dịch vụ Brevo (máy chủ có thể ở nước ngoài); Brevo chỉ nhận email và họ tên của bạn.</li>
          <li>Nếu bạn nộp bài dạng đường link (Google Docs, Canva, GitHub…), bạn tự quản lý quyền chia sẻ của link đó.</li>
        </ul>
      </Section>
      <Section title="5. Ai được xem dữ liệu của bạn">
        <ul className="list-disc pl-5">
          <li>Mentor, trợ giảng: bài nộp, tiến độ, kết quả của sinh viên được phân công.</li>
          <li>Giáo viên/quản lý trường bạn (nếu trường đã kết nối): tiến độ và kết quả của sinh viên trường mình.</li>
          <li>Viện Đào tạo Bách Khoa: tiến độ, kết quả, phục vụ cấp chứng nhận.</li>
          <li>Nhà tuyển dụng quét QR chứng nhận: họ tên, trường, ngày cấp, xếp loại, tên dự án; không hiện email/số điện thoại.</li>
          <li>Doanh nghiệp tài trợ: không được xem, trừ khi bạn đồng ý riêng.</li>
        </ul>
      </Section>
      <Section title="6. Quyền của bạn">
        <p>
          Bạn có quyền xem, tải về, yêu cầu sửa, yêu cầu xóa dữ liệu, hoặc rút lại sự đồng ý với các mục không bắt buộc bất kỳ lúc nào. Rút đồng ý
          ở mục bắt buộc nghĩa là bạn dừng tham gia lộ trình.
        </p>
      </Section>
      <Section title="7. Lưu ý an toàn khi nộp bài">
        <p>Không đưa vào bài nộp: số CCCD, thông tin tài khoản ngân hàng, dữ liệu nội bộ của công ty/trường, hay thông tin cá nhân của người khác khi chưa được đồng ý.</p>
      </Section>
    </main>
  );
}
