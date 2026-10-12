# Joy Dạy Bù

Hệ thống xếp lịch học bù tự động cho trung tâm.

## Có gì trong này

- `Code.gs` — code chạy trong Google Apps Script: tạo sheet, gom nhóm, soạn tin nhắn, gửi Telegram

## Dựng 1 lần (khoảng 15 phút)

### Bước 1: Tạo Google Sheet mới

1. Vào Google Drive → Mới → Google Trang tính
2. Đặt tên là `DẠY BÙ`

### Bước 2: Gắn code vào Sheet

1. Trong Sheet DẠY BÙ, bấm `Tiện ích mở rộng` → `Apps Script`
2. Xoá hết chữ cũ trong khung code
3. Mở file `Code.gs` trong repo này, copy toàn bộ, dán vào
4. Bấm Lưu (hình đĩa mềm)
5. Chạy hàm `setupDayBu` 1 lần (chọn tên hàm trên thanh công cụ → bấm ▶ Chạy)
6. Lần đầu nó hỏi quyền → bấm Cho phép hết
7. Quay lại Sheet, tải lại trang (F5) → thấy menu `📚 Dạy Bù` là được

### Bước 3: Cho bot vào nhóm (đã xong)

- Nhóm Học Bù đã có bot `@joy_chamcong_bot` làm quản trị viên ✅

### Bước 4: Gắn chìa khoá bot vào code

1. Trong Apps Script, bấm `Cài đặt dự án` (bánh răng bên trái)
2. Kéo xuống `Thuộc tính tập lệnh` → bấm `Thêm thuộc tính`
3. Tên: `TELEGRAM_BOT_TOKEN`, giá trị: token của `@joy_chamcong_bot` (hỏi Ngọc lấy)
4. Bấm Lưu

### Bước 5: Tạo Form Báo bù cho giáo viên

1. Vào Google Drive → Mới → Google Biểu mẫu, đặt tên `Báo bù`
2. Tạo 5 câu hỏi:
   - Tên GV báo (trả lời ngắn, bắt buộc)
   - Tên bé (trả lời ngắn, bắt buộc)
   - Lớp (trắc nghiệm, 25 lớp trong tab LOP của Sheet)
   - Trình độ (trắc nghiệm: Kids, SP0, SP1, SP2, SP3, SP4)
   - Link Canva slide (trả lời ngắn)
3. Bấm `Câu trả lời` → `Liên kết với trang tính` → chọn Sheet DẠY BÙ → tab `BAO_BU`
4. Gửi link Form cho các GV

### Bước 6: Thử bot

Trong Apps Script, chạy hàm `testGuiTelegram` → vào topic Học Bù thấy tin là được.

## Việc làm mỗi tuần

- **Sáng T2:** GV điền Form Báo bù
- **Chiều T2:** bạn mở Sheet → menu `📚 Dạy Bù` → `Gom nhóm`
- **T2 tối → 12h trưa T4:** Ms. Vân Anh copy cột `Tin nhắn PH` gửi Zalo, PH trả lời thì tick cột `PH xác nhận` (✅ Đi được / 🔄 Xin đổi / ❌ Nghỉ)
- **Chiều T4:** menu `📚 Dạy Bù` → `Gửi tin cho GV` → tin tự chạy vào nhóm Telegram
- Quá 12h trưa T4 ai chưa trả lời → menu `Đẩy quá hạn sang tuần sau`

## 4 ca cố định

| Ca | Giờ | GV |
|----|-----|-----|
| T5-1 | T5 17h00-18h30 | Ms. Vân / Ms. Hồng Anh (Hồng Anh hết T10/2026) |
| T6-1 | T6 15h00-16h30 | Ms. Vân / Ms. Hồng Anh |
| T6-2 | T6 17h00-18h30 | Ms. Vân / Ms. Hồng Anh |
| T6-3 | T6 18h00-19h30 | Mr. Đức Anh (ưu tiên mầm non) |

Luật: mỗi ca tối đa 4 bé, tối đa 2 trình độ chung 1 ca. Ca ghép 3 trình độ máy tô đỏ. Quá 16 bé tự đẩy sang tuần sau.
