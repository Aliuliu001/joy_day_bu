# 📚 JOY DẠY BÙ — Hướng dẫn đầy đủ

Hệ thống xếp lịch học bù + SOTW (Student of the Week) chạy trên **Google Sheet + Apps Script**.
File này là hướng dẫn DUY NHẤT cần đọc — mọi bản plan/audit cũ đã chuyển vào thư mục [`docs/`](docs/).

---

## 🏗️ CẤU TRÚC

**Các tab làm việc (4 tab):**
| Tab | Ai dùng | Việc gì |
|-----|---------|---------|
| **BAO_BU** | GV + quản lý | GV báo bé nghỉ (mỗi bé 1 dòng); 2 dòng mẫu hướng dẫn (bảo vệ); cột J = link mở DS HỌC SINH |
| **LICH_BU** | quản lý | Lịch sau khi gom nhóm: PH xác nhận, tin nhắn PH/GV, Đã dạy |
| **DS HỌC SINH** | GV + quản lý | Danh sách HS + **tick SOTW** ☑; ô "GV đang chọn" → chỉ lớp mình sáng |
| **Backup tháng MM-YYYY** | tự động | Lưu lịch sử (không ai sửa tay) |

*Ẩn đi cho gọn:* tab **LOP** (tham khảo — hiện lại: 🗜️ trong Cài đặt). Tab **THỐNG KÊ** tự tạo khi bấm báo cáo.

**Menu 📚 Dạy Bù:**
```
├─ 1️⃣ Gom nhóm + gửi SOTW (T2 chiều)     ← nút chính
├─ 2️⃣ Xử lý Xin đổi / Quá hạn (T4)
├─ 3️⃣ Gửi tin cho GV (T5-T6)
├─ 4️⃣ Làm mới tuần mới (cuối tuần)       ← TỰ backup trước khi xoá
├─ 🔁 Gửi / Nhắc lẻ      ▸ Gửi lại SOTW · Nhắc GV · Backup thủ công
├─ 📊 Báo cáo            ▸ Làm mới thống kê
└─ ⚙️ Cài đặt (1 lần)    ▸ Nâng cấp sheet · Tạo sheet mới · Ẩn/hiện LOP
```

**4 ca cố định mỗi tuần:**

| Ca | Giờ | GV |
|----|-----|-----|
| T5-1 | T5 17h00-18h30 | Ms. Vân (Hồng Anh hết T10/2026) |
| T6-1 | T6 15h00-16h30 | Ms. Vân |
| T6-2 | T6 17h00-18h30 | Ms. Vân |
| T6-3 | T6 18h00-19h30 | Mr. Đức Anh (ưu tiên mầm non) |

*Luật: mỗi ca tối đa 4 bé, ≤2 trình độ/ca (ghép 3 trình độ máy tô đỏ). Quá 16 bé → "Tuần sau". Bé "Nghỉ" không chiếm chỗ.*

---

## 📅 QUY TRÌNH MỖI TUẦN

### 1. T2 SÁNG — Nhắc GV báo bù
Menu 🔁 → **🔔 Nhắc GV báo bù** → tin vào nhóm Học Bù (kèm hướng dẫn tick SOTW).

### 2. CẢ TUẦN — GV nhập liệu (chỉ click & gõ theo mẫu)
- **Báo bù:** vào BAO_BU → gõ tên bé + lớp + trình độ (+link Canva). Lớp đi đủ → gõ `Không bù` ở cột Tên bé. *Xem 2 dòng mẫu đầu sheet.*
- **SOTW:** vào **DS HỌC SINH** → chọn tên mình ở ô "GV đang chọn" → **tick ☑** bé SOTW (1-2 phút/tuần).

### 3. T2 CHIỀU — bấm **1️⃣ Gom nhóm + gửi SOTW** (1 nút làm 2 việc)
- Xếp bé vào 4 ca
- Tạo sẵn **Tin nhắn PH** → copy cột J gửi Zalo cho PH
- **Gửi SOTW cho Mr. Khôi** vào topic Học Bù (kèm link ảnh nếu có)
- *Gom lại bao nhiêu lần trong tuần cũng được — không mất bé, không gửi trùng SOTW (có mốc theo tuần)*

### 4. T3–T4 — tick "PH xác nhận" trong LICH_BU
- ✅ Đi được → giữ nguyên
- 🔄 Xin đổi / không trả lời → bấm **2️⃣ Xử lý Xin đổi / Quá hạn**: chuyển về BAO_BU xếp lại + báo Telegram

### 5. T5–T6 — bấm **3️⃣ Gửi tin cho GV** (chỉ ca chốt ✅) → sau giờ học tick "Đã dạy"/"Vắng"

### 6. CUỐI TUẦN — bấm **4️⃣ Làm mới tuần mới** (1 nút làm 4 việc)
1. **TỰ backup** (đã backup rồi tự bỏ qua — không trùng; chống trùng theo từng dòng nên chạy bao nhiêu lần cũng an toàn)
2. Chuyển bé **chưa chốt** (Chờ/Xin đổi) về BAO_BU → **giữ lại** tuần sau
3. Xoá BAO_BU + LICH_BU (giữ dòng mẫu + bé chưa xếp)
4. Xoá tick SOTW + mốc

*(Cùng có backup tự động tối T7 22h — chỉ LƯU, không xoá — được cài lúc "Nâng cấp sheet".)*

---

## 🚀 LẮP ĐẶT / CẬP NHẬT (chạy 1 lần)

1. Mở Sheet → **Tiện ích mở rộng → Apps Script** → xoá hết code cũ → dán toàn bộ [Code.gs](Code.gs) → **Lưu** (Ctrl+S)
2. Về Sheet → **📚 Dạy Bù → ⚙️ Cài đặt → 🔧 Nâng cấp sheet SOTW**
   - Tự tạo DS HỌC SINH, cột SOTW, 2 dòng mẫu (không mất data), ẩn tab LOP
   - Hỏi 1 lần: cài backup tự động tối T7 → trả lời **Có**
3. **Nhập danh sách học sinh** vào DS HỌC SINH từ ô **A3**: copy từ Excel **Tên | Lớp | GV** → paste
   - Giới tính + Link ảnh: **để trống cũng được** (tin SOTW tự bỏ phần thiếu)
4. Bấm lại 🔧 Nâng cấp sheet SOTW (điền GV chính cho danh sách mới)

> ⚠️ **KHÔNG** bấm "🔨 Tạo sheet mới" khi sheet đã có dữ liệu — nó xoá hết.

**Chưa có token Telegram?** (tin gửi thất bại mới cần) Apps Script → Cài đặt dự án → Thuộc tính tập lệnh → thêm `TELEGRAM_BOT_TOKEN`. Thử: chạy hàm `testGuiTelegram`.

---

## 📸 KHO ẢNH CHO SOTW (làm 1 lần — Mr. Khôi khỏi tìm ảnh)

1. Tạo folder Drive **`ẢNH HỌC SINH SOTW`** → thả ảnh vô — **tên file ảnh = họ tên bé**
2. Chuột phải folder → **Chia sẻ** → "Bất kỳ ai có đường liên kết" → Người xem → Xong *(share 1 lần)*
3. Copy link từng file → dán cột **Link ảnh** trong DS HỌC SINH
   → tin SOTW kèm sẵn link ảnh 🔗 cho Mr. Khôi

---

## 🔁 DANH SÁCH ĐỘNG (đang lên plan)
HS tăng/giảm hằng tuần → phương án: **đọc 1 chiều từ "file chính"** (anh gửi link) — tự đối chiếu theo **tên** mỗi khi mở sheet/bấm Gom nhóm: thêm bé mới, đánh dấu bé nghỉ, **không ghi ngược về file chính**. *Chờ link file chính + tên cột.*

---

## ❗ LỖI THƯỜNG GẶP

| Tình trạng | Cách xử lý |
|------------|-----------|
| Không hiện menu 📚 Dạy Bù | F5 / Ctrl+Shift+R refresh Sheet |
| Gom nhóm báo "Chưa có sheet" | Bấm 🔧 Nâng cấp sheet SOTW |
| SOTW báo "chưa bé nào tick" | Bình thường nếu GV chưa tick |
| Gửi Telegram lỗi | Kiểm tra `TELEGRAM_BOT_TOKEN` trong Thuộc tính tập lệnh |
| Gửi lại SOTW | 🔁 → 🏆 Gửi lại SOTW (hỏi trước) |
| Xem tab LOP | ⚙️ Cài đặt → 🗜️ Ẩn / hiện tab LOP |

---

## 🧪 KIỂM THỬ CODE
`node test_sotw.js` — **115 assertion** (gom nhóm, SOTW, backup chống trùng, làm mới tuần, menu...). Phải **PASS 115/115** trước khi push.
