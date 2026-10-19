# 📚 JOY DẠY BÙ — Hướng dẫn đầy đủ

Hệ thống xếp lịch học bù + SOTW (Student of the Week) chạy trên **Google Sheet + Apps Script**.
File này là hướng dẫn DUY NHẤT cần đọc — mọi bản plan/audit cũ đã chuyển vào thư mục [`docs/`](docs/).

---

## 🏗️ CẤU TRÚC

**Các tab làm việc (4 tab):**
| Tab | Ai dùng | Việc gì |
|-----|---------|---------|
| **BAO_BU** | GV (báo bé nghỉ) + quản lý | GV báo bé nghỉ (mỗi bé 1 dòng); **cột C = Lớp ngay sau GV** → chọn GV → Lớp → Tên bé đều bằng dropdown (lấy từ DS HỌC SINH); cột G/H khóa (GV sửa ô **Ghi chú** được); cột J = link mở DS HỌC SINH |
| **LICH_BU** | quản lý | Lịch sau khi gom nhóm: PH xác nhận, tin nhắn PH/GV, Đã dạy |
| **DS HỌC SINH** | GV + quản lý | Danh sách HS + **tick SOTW** ☑; ô **"GV đang chọn" → ẨN hết lớp khác**, chọn thêm **"Lớp cần chọn" → lọc tới bé lớp đó**; xóa 2 ô → hiện lại toàn bộ (dropdown GV/Lớp lấy từ dữ liệu thật, tự chạy lại sau mỗi lần Đồng bộ) |
| **Backup tháng MM-YYYY** | tự động | Lưu lịch sử (không ai sửa tay) |

*Ẩn đi cho gọn:* tab **LOP** (tham khảo — hiện lại: 🗜️ trong Cài đặt). Tab **THỐNG KÊ** tự tạo khi bấm báo cáo.

**Menu ⚙️ Quản lý Dạy Bù: (chỉ dành quản lý — GV không cần vào)**
```
├─ 1️⃣ Gom nhóm + gửi SOTW (T2 chiều)     ← nút chính
├─ 2️⃣ Xử lý Xin đổi / Quá hạn (T4)
├─ 3️⃣ Gửi tin cho GV (T5-T6)
├─ 4️⃣ Làm mới tuần mới (cuối tuần)       ← TỰ backup trước khi xoá
├─ 🔁 Gửi / Nhắc lẻ      ▸ Gửi lại SOTW · Nhắc GV · Backup thủ công
├─ 📊 Báo cáo            ▸ Làm mới thống kê
└─ ⚙️ Cài đặt           ▸ 📖 Hướng dẫn · 🔧 Nâng cấp sheet · 🔍 Kiểm tra/sửa cột BAO_BU
                        ▸ 🔄 Đồng bộ DS · 🖼️ Gắn link ảnh · 🗜️ Ẩn/hiện LOP · 🔨 Tạo sheet mới (⚠️ xoá data)
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
- **Báo bù:** vào BAO_BU → **chọn GV** (ô B) → **chọn Lớp** (ô C, chỉ hiện lớp của GV đó) → **chọn Tên bé** (ô D, chỉ hiện bé lớp đó) → gõ trình độ + link Canva. **Đảo chiều cũng được:** chọn TÊN BÉ trước → tự điền Lớp + GV báo, 2 ô còn lại tự lọc (tên bé chỉ ở 1 lớp; trùng tên 2 lớp → tự hiện 2 lớp cho anh chọn). Lớp đi đủ → gõ `Không bù` ở cột Tên bé. GV cần dặn dò → ghi thêm ô **Ghi chú** (ô I). *Xem 2 dòng mẫu đầu sheet.*
- **SOTW:** vào **DS HỌC SINH** → chọn tên mình ở ô "GV đang chọn" → **tick ☑** bé SOTW (1-2 phút/tuần).

### 3. T2 CHIỀU — bấm **1️⃣ Gom nhóm + gửi SOTW** (1 nút làm 2 việc)
- Xếp bé vào 4 ca
- Tạo sẵn **Tin nhắn PH** → copy cột J gửi Zalo cho PH
- **Gửi SOTW cho Mr. Khôi** vào topic Học Bù (kèm link ảnh nếu có)
- *Gom lại bao nhiêu lần trong tuần cũng được — không mất bé, không gửi trùng SOTW (có mốc theo tuần)*

**Ghi chú đi đâu?** Ô Ghi chú GV viết ở BAO_BU được mang theo bé vào LICH_BU (cột Ghi chú) và **đính kèm tin nhắn cho GV** (dòng 📌). Nếu 2 bé cùng lớp cùng ghi chú → **tin nhắn gộp 1 dòng ghi chú chung** (không lặp). Ghi chú này cũng được backup + làm mới tuần mới giữ nguyên.

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

1. Tạo folder Drive **`ẢNH HỌC SINH SOTW`** → thả ảnh vô — **tên file ảnh = họ tên bé** (VD: `Nguyen Van A.jpg` khớp bé `Nguyễn Văn A` — chương trình tự bỏ dấu khi so)
2. Chuột phải folder → **Chia sẻ** → "Bất kỳ ai có đường liên kết" → Người xem → Xong *(share 1 lần)*
3. Copy **link folder** (dạng `https://drive.google.com/drive/folders/xxxx`) → dán vào **ô H1 tab DS HỌC SINH**
4. Bấm **⚙️ Cài đặt → 🖼️ Gắn link ảnh SOTW (theo tên file)** → cột Link ảnh tự điền hết (tin SOTW kèm sẵn link 🔗 cho Mr. Khôi)
   - Bé chưa có file ảnh → báo tên bé thiếu, thêm ảnh vào folder rồi bấm lại
   - Thêm/đổi ảnh sau này → bấm lại nút 🖼️ là cập nhật
   - *Cách cũ (copy từng link dán tay) vẫn dùng được*

---

## 🔁 ĐỒNG BỘ TỪ FILE CHÍNH (chỉ đọc — KHÔNG bao giờ ghi vào file gốc)

Danh sách HS trong **DS HỌC SINH** lấy tự động từ file chính của anh:
- **Nút:** ⚙️ Cài đặt → **🔄 Đồng bộ DS học sinh (chỉ đọc file chính)**
- **Tự chạy** khi bấm **1️⃣ Gom nhóm** và khi **🔧 Nâng cấp sheet**
- **Lần đầu Google xin quyền đọc** → hiện trang cảnh báo → bấm *Advanced → Go to ... → Allow (Cho phép)* → chạy lại
- Cách lấy: A:B:C (Tên/Lớp/GV) ← file chính; **D:E:F (Giới tính/Link ảnh/Tick SOTW) giữ nguyên theo tên bé**
- Bé có trong DS nhưng **không có trong file chính** → giữ lại cuối bảng + báo anh quyết (không tự xoá)
- File chính **chỉ bị ĐỌC** (test tự kiểm: 0 lượt ghi)

---

## 🔍 KIỂM TRA THỨ TỰ CỘT BAO_BU (khi nghi dữ liệu bị ngược)

Nếu anh thấy cột Lớp/Tên bé có dòng bị ngược (vd 2 dòng mẫu trước đây): **⚙️ Cài đặt → 🔍 Kiểm tra / sửa thứ tự cột BAO_BU** → nó dò TỪNG DÒNG (C chứa lớp? D chứa tên?), dòng nào ngược tự sửa, dòng nào mơ hồ (2 cột đều giống tên) báo để anh xem tay. Chạy bao nhiêu lần cũng an toàn.

## 📊 THỐNG KÊ (menu 📊 → Làm mới thống kê)

- **Cần data gì?** Tab `Backup tháng MM-YYYY` — tự tạo khi anh bấm Backup thủ công (🔁) hoặc **4️⃣ Làm mới tuần mới** (tự backup trước khi xoá). Tháng nào chưa backup lần nào → báo "Chưa có sheet Backup tháng …".
- Nội dung: số ca dạy + tổng giờ (1.5h/ca) từng GV (**lấy GV từ data backup thật** — GV mới tự có dòng), tổng bé, tổng ca, tổng giờ cả tháng.
- Bấm lại Làm mới thống kê bất cứ lúc nào — công thức tự cập nhật khi backup thêm dòng.

## ❗ LỖI THƯỜNG GẶP

| Tình trạng | Cách xử lý |
|------------|-----------|
| Không hiện menu 📚 Dạy Bù | F5 / Ctrl+Shift+R refresh Sheet |
| Gom nhóm báo "Chưa có sheet" | Bấm 🔧 Nâng cấp sheet SOTW |
| SOTW báo "chưa bé nào tick" | Bình thường nếu GV chưa tick |
| Gửi Telegram lỗi | Kiểm tra `TELEGRAM_BOT_TOKEN` trong Thuộc tính tập lệnh |
| Gửi lại SOTW | 🔁 → 🏆 Gửi lại SOTW (hỏi trước) |
| Xem tab LOP | ⚙️ Cài đặt → 🗜️ Ẩn / hiện tab LOP |
| Cột Lớp/Tên bé bị ngược | ⚙️ Cài đặt → 🔍 Kiểm tra / sửa thứ tự cột BAO_BU |
| Không nhớ lệnh nào dùng lúc nào | ⚙️ Cài đặt → 📖 Hướng dẫn (đọc trước 1 lần) |
| Thống kê báo "Chưa có sheet Backup" | 🔁 → 💾 Backup thủ công (hoặc Làm mới tuần mới sẽ tự backup) |

---

## 🧪 KIỂM THỬ CODE
`node test_sotw.js` — **209 assertion** (gom nhóm, SOTW, cascade BAO_BU, ghi chú + gộp ghi chú, folder ảnh, backup chống trùng, làm mới tuần, menu...). Phải **PASS 197/197** trước khi push.
