# Gửi SOTW vào Topic `SOTW_3` — Office - Joy

## Mục tiêu

Bot `@joy_lichlam_sotw_daybu_bot` chỉ gửi **Student of the Week** vào đúng Topic `SOTW_3` trong group **Office - Joy**.

Tin Dạy Bù thông thường vẫn giữ nguyên nơi gửi cũ.

## Phần đã có trong code

SOTW dùng ba mục riêng trong **Thuộc tính tập lệnh**:

- `TELEGRAM_BOT_TOKEN` — token của bot `@joy_lichlam_sotw_daybu_bot`
- `SOTW_CHAT_ID` — mã group Office - Joy
- `SOTW_THREAD_ID` — mã Topic SOTW_3

Không ghi token hoặc mã topic cũ trực tiếp trong code. Nhờ vậy khi đổi Topic chỉ cần đổi đúng một ô cài đặt, không làm ảnh hưởng các tin Dạy Bù khác.

## Thiết lập lần đầu

1. Mở Google Sheet **Dạy Bù** → **Tiện ích mở rộng** → **Apps Script**.
2. Mở **Cài đặt dự án** (hình bánh răng ở thanh bên trái).
3. Kéo xuống **Thuộc tính tập lệnh** → bấm **Thêm thuộc tính tập lệnh**.
4. Nhập lần lượt ba dòng sau:
   - `TELEGRAM_BOT_TOKEN` → dán token của bot `@joy_lichlam_sotw_daybu_bot`.
   - `SOTW_CHAT_ID` → mã group Office - Joy.
   - `SOTW_THREAD_ID` → mã Topic SOTW_3.
5. Bấm **Lưu thuộc tính tập lệnh**.
6. Quay lại Google Sheet và tải lại trang.
7. Mở menu **⚙️ Quản lý Dạy Bù** → **⚙️ Cài đặt** → **🧪 Gửi thử topic SOTW**.
8. Chỉ khi tin thử hiện đúng trong Topic SOTW_3 mới dùng nút gửi SOTW thật.

## Nếu chưa biết mã Topic SOTW_3

1. Đảm bảo bot là thành viên group Office - Joy và được phép gửi tin.
2. Trong đúng Topic **SOTW_3**, gửi một tin có nội dung chính xác: `test SOTW`.
3. Trong Apps Script, chọn hàm `layMaTopicSOTW` ở danh sách hàm phía trên → bấm **Chạy**.
4. Popup sẽ hiện mã Topic. Lấy số đó điền vào `SOTW_THREAD_ID` rồi bấm Lưu.
5. Chạy lại **🧪 Gửi thử topic SOTW**.

> Lưu ý: Google Apps Script chỉ đọc được tin nhắn Telegram mà **chính bot** nhận được. Nếu không tìm thấy `test SOTW`, hãy kiểm tra bot còn trong group và gửi lại đúng câu ở đúng Topic.

## Khi Telegram báo lỗi

- `message thread not found`: mã `SOTW_THREAD_ID` chưa đúng. Làm lại phần “Nếu chưa biết mã Topic SOTW_3”.
- `Forbidden`: bot chưa ở group, không có quyền gửi tin, hoặc token không thuộc bot mới.
- Không có popup nào: kiểm tra đã lưu code mới trong Apps Script và tải lại Google Sheet.

## Kiểm tra sau cùng

- Tin thử phải hiển thị tên bot `@joy_lichlam_sotw_daybu_bot`.
- Tin thử phải nằm trong Topic **SOTW_3**, không lẫn vào topic Lịch làm việc / Dạy Bù.
- Sau đó tick một học sinh SOTW và dùng luồng gửi bình thường để xác nhận tin SOTW thật.
