# Tách bot Dạy Bù khỏi SOTW

## Kết quả sau khi hoàn tất

- **SOTW:** giữ nguyên bot và cấu hình đang chạy trong Topic `SOTW_3`. Không sửa các ô bắt đầu bằng `SOTW_`.
- **Dạy Bù:** dùng bot mới, chỉ gửi các tin nhắc giáo viên, lịch Dạy Bù và xử lý Xin đổi vào Topic Dạy Bù.
- **Lịch Làm:** không nằm trong dự án này, không thay đổi gì.

## A. Tạo bot Dạy Bù mới

1. Mở Telegram, tìm `@BotFather` (bot chính thức có dấu xác minh).
2. Gửi `/newbot`.
3. Khi BotFather hỏi tên hiển thị, nhập: `Joy Dạy Bù`.
4. Khi hỏi tên có dấu `@`, nhập: `joy_daybu_bot`.
   - Nếu Telegram báo tên đã có người dùng, thêm vài số, ví dụ `joy_daybu_joy_bot`.
5. BotFather gửi một dòng token dài. Nhấn giữ và **Sao chép** token. Không gửi token vào group hay chat này.
6. Trong BotFather, gửi `/mybots` → chọn bot mới → **Bot Settings** → **Group Privacy** → **Turn off**.

## B. Thêm bot mới vào Topic Dạy Bù

1. Mở group **Office - Joy**.
2. Mở thông tin group → **Thêm thành viên** → tìm đúng bot Dạy Bù mới tạo → thêm vào group.
3. Vào **Quản trị viên** → chọn bot mới → **Thăng làm quản trị viên**.
4. Bật quyền **Gửi tin nhắn**. Các quyền khác không cần bật.
5. Không xoá bot SOTW đang hoạt động.

## C. Dán token vào Apps Script

1. Mở Google Sheet **Dạy Bù** → **Tiện ích mở rộng** → **Apps Script**.
2. Bấm bánh răng **Cài đặt dự án** ở cạnh trái.
3. Kéo xuống **Thuộc tính tập lệnh** → **Thêm thuộc tính tập lệnh**.
4. Điền:
   - Thuộc tính: `DAY_BU_BOT_TOKEN`
   - Giá trị: dán token vừa sao chép của bot Dạy Bù mới.
5. Bấm **Lưu thuộc tính tập lệnh**.
6. Không sửa `SOTW_BOT_TOKEN`, `SOTW_CHAT_ID`, `SOTW_THREAD_ID`.
7. Không cần sửa `TELEGRAM_BOT_TOKEN`; code mới không dùng ô này cho Dạy Bù nữa.

## D. Cập nhật code và thử Dạy Bù

1. Mở https://github.com/Aliuliu001/joy_day_bu/blob/main/Code.gs
2. Bấm biểu tượng sao chép nội dung file.
3. Quay lại Apps Script → bấm vào `Code.gs` → Ctrl+A → Ctrl+V → Ctrl+S để lưu.
4. Đóng Apps Script, quay lại Google Sheet và tải lại trang.
5. Trong menu **⚙️ Quản lý Dạy Bù**, bấm **🔁 Gửi / Nhắc lẻ** → **🧪 Gửi thử Topic Dạy Bù**.
6. Tin phải xuất hiện ở Topic Dạy Bù, với tên bot Dạy Bù mới.

## Nếu báo lỗi

- `Chưa có DAY_BU_BOT_TOKEN`: chưa thêm hoặc chưa lưu token ở phần C.
- `Forbidden: bot was kicked`: bot mới chưa có trong group hoặc đã bị xoá; thêm lại từ phần B.
- `message thread not found`: Topic Dạy Bù hiện tại đã bị xoá/đổi; chụp màn hình hoặc gửi link của một tin trong đúng Topic Dạy Bù để cập nhật mã Topic.

## Chỉ sau khi Dạy Bù gửi thành công

Có thể vào BotFather để thu hồi token bot cũ không dùng nữa. Không xoá bot SOTW hoặc sửa các ô `SOTW_`.
