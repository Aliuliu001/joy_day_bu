# HƯỚNG DẪN DÙNG SOTW (bản 14/10/2026)
Việc của chị sau khi copy code mới vào Apps Script

---

## 🔧 BƯỚC NÂNG CẤP (chạy 1 lần)

1. Copy code mới từ GitHub vào Apps Script → Lưu
   https://github.com/Aliuliu001/joy_day_bu/blob/main/Code.gs
2. Mở menu **📚 Dạy Bù** → bấm **🔧 Nâng cấp sheet SOTW**
   → Tự tạo tab **DS HỌC SINH**, thêm cột **SOTW** vào BAO_BU (cột J),
     thêm 2 dòng mẫu (bảo vệ) — **không mất dữ liệu cũ**
3. Dán danh sách học sinh vào tab **DS HỌC SINH** từ ô **A3**:
   - Excel của chị: copy cột **Tên | Lớp | Giới tính | Link ảnh** → paste vào A3
   - Cột **GV chính** tự điền theo lớp (không cần gõ)
4. Bấm lại **🔧 Nâng cấp sheet SOTW** 1 lần nữa → điền GV chính cho danh sách mới

---

## 📅 QUY TRÌNH MỖI TUẦN

### Cả tuần — GV tick (chỉ click, không gõ)
1. Vào tab **DS HỌC SINH**
2. Chọn tên mình ở ô **"GV đang chọn"** → chỉ lớp của mình **SÁNG lên**
3. Tick ☑ các bạn SOTW

### Thứ 2 chiều — bấm "1️⃣ Gom nhóm" (1 nút làm 2 việc)
- Xếp lịch học bù như cũ
- Gửi SOTW cho Mr. Khôi vào topic Học Bù:
  ```
  🏆 [Tuần 13/10 - 19/10]
  👨‍🏫 Mr. Ngọc:
  • S1.001 - Cashew:
    - Ngô Bảo Hân (Nam) 🔗 link ảnh
  ⚠️ Chưa nộp SOTW: Ms. Trâm, ...
  ```
- **Tick giữ nguyên cả tuần** để check lại
- Gom lại lần nữa trong tuần → **không gửi trùng** (có mốc "đã gửi")

### Cần gửi lại → bấm "4️⃣ 🏆 Gửi SOTW" (hỏi xác nhận trước)

### Cuối tuần — bấm "5️⃣ Làm mới tuần mới"
- Clear BAO_BU + LICH_BU (như cũ)
- **Xoá tick SOTW + mốc đã gửi** (đúng thời điểm chị chỉ đạo)
- Danh sách HS / link ảnh / giới tính: **giữ nguyên**

---

## 🍀 CÁC NÚT MENU MỚI

| Nút | Việc |
|-----|------|
| 1️⃣ Gom nhóm | Xếp lịch + gửi SOTW (gộp) |
| 2️⃣ Xử lý case đặc biệt | Xin đổi + Quá hạn → về BAO_BU + báo Telegram |
| 3️⃣ Gửi tin cho GV | Như cũ (ca ✅) |
| 4️⃣ 🏆 Gửi SOTW | Gửi lại khi cần (hỏi trước) |
| 5️⃣ Làm mới tuần mới | Clear tuần mới + xoá tick SOTW |
| 🔧 Nâng cấp sheet SOTW | Chạy 1 lần khi mới cập nhật |

---

## 📸 CHUẨN BỊ KHO ẢNH (chị làm tay — theo idea bạn chị)
1. Tạo folder Drive **"ẢNH HỌC SINH SOTW"** → thả toàn bộ ảnh vô
   (tên file ảnh = họ tên bé)
2. Chuột phải folder → **Chia sẻ** → "Bất kỳ ai có đường liên kết" → Người xem → Xong
   (share 1 lần cho cả folder)
3. Copy link từng file → dán vào cột **Link ảnh** trong DS HỌC SINH
   → tin SOTW gửi cho Mr. Khôi sẽ kèm link ảnh sẵn

---

## ⚠️ LƯU Ý
- **KHÔNG bấm "🔨 Tạo sheet"** khi sheet đã có dữ liệu (nó xoá hết) — dùng "🔧 Nâng cấp"
- 2 dòng mẫu trong BAO_BU: chỉ 3 quản lý sửa được; gom nhóm tự bỏ qua
- SOTW chưa ai tick → bấm Gom nhóm vẫn chạy bình thường, chỉ báo "chưa bé nào tick"
