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
├─ 1️⃣ Cập nhật danh sách HS đầu tuần
├─ 2️⃣ Gom lịch + gửi SOTW (T2 chiều)
├─ 3️⃣ Xử lý PH xin đổi / quá hạn (T4)
├─ 4️⃣ Gửi lịch đã chốt cho GV (T5-T6)
├─ 5️⃣ Kết tuần mới — tự backup trước (T7-CN)
├─ 📨 Gửi tin / Nhắc việc               ▸ Nhắc GV · Gửi lại lịch/SOTW · Gửi thử bot
├─ 📦 Backup / Thống kê / Chốt tháng     ▸ Backup · Thống kê · Việc cần làm
├─ 🗂️ Cập nhật dữ liệu phụ               ▸ Ảnh SOTW · Sửa cột · Bảng lớp
└─ 🛠️ Cài đặt kỹ thuật                   ▸ Hướng dẫn quy trình/chốt tháng · test SOTW
                                        ▸ Nâng cấp sheet · Tạo lại sheet trống (⚠️ xoá data)
```

**6 ca cố định mỗi tuần:**

| Ca | Giờ | GV |
|----|-----|-----|
| T4-1 | T4 17h30-19h00 | Mr. Đức Anh (ưu tiên mầm non) |
| T5-1 | T5 17h30-19h00 | Ms. Vân |
| T6-1 | T6 13h30-15h00 | Ms. Vân |
| T6-2 | T6 15h00-16h30 | Ms. Vân |
| T6-3 | T6 13h30-15h00 | Mr. Đức Anh |
| T6-4 | T6 15h00-16h30 | Mr. Đức Anh |

*Luật: mỗi ca tối đa 4 bé, ≤2 trình độ/ca (ghép 3 trình độ máy tô đỏ). Quá 24 bé → "Tuần sau". Bé "Nghỉ" không chiếm chỗ.*

---

## 📅 QUY TRÌNH MỖI TUẦN

### 1. T2 SÁNG — Nhắc GV báo bù
Menu **📨 Gửi tin / Nhắc việc** → **🔔 Nhắc GV báo Dạy Bù** → tin vào Topic Dạy Bù.

### 2. ĐẦU TUẦN — bấm **1️⃣ Cập nhật danh sách HS đầu tuần**
Hệ thống chỉ đọc danh sách gốc, cập nhật HS mới/lớp mới vào DS HỌC SINH và giữ nguyên link ảnh/tick SOTW cũ.

### 3. CẢ TUẦN — GV nhập liệu (chỉ click & gõ theo mẫu)
- **Báo bù:** vào BAO_BU → **chọn GV** (ô B) → **chọn Lớp** (ô C, chỉ hiện lớp của GV đó) → **chọn Tên bé** (ô D, chỉ hiện bé lớp đó) → gõ trình độ + link Canva. **Đảo chiều cũng được:** chọn TÊN BÉ trước → tự điền Lớp + GV báo, 2 ô còn lại tự lọc (tên bé chỉ ở 1 lớp; trùng tên 2 lớp → tự hiện 2 lớp cho anh chọn). Lớp đi đủ → gõ `Không bù` ở cột Tên bé. GV cần dặn dò → ghi thêm ô **Ghi chú** (ô I). *Xem 2 dòng mẫu đầu sheet.*
- **Ca đặc biệt (cột K):** dùng khi xếp ca riêng vào bất kỳ ngày nào, theo đúng mẫu: `T2 08h00-09h30 Ms. Vân` hoặc `T4 14h00-15h30 Mr. Ngọc`. Dùng `T2` đến `T7` hoặc `CN`, sau đó là giờ bắt đầu-kết thúc và tên GV. Hệ thống ưu tiên xếp đúng ngày/giờ này, không đưa vào 4 ca cố định.
- **SOTW:** vào **DS HỌC SINH** → chọn tên mình ở ô "GV đang chọn" → **tick ☑** bé SOTW (1-2 phút/tuần).

### 4. T2 CHIỀU — bấm **2️⃣ Gom lịch + gửi SOTW** (1 nút làm 2 việc)
- Xếp bé vào 4 ca
- Tạo sẵn **Tin nhắn PH** → copy cột J gửi Zalo cho PH
- **Gửi SOTW** vào Topic SOTW_3 (kèm link ảnh nếu có)
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

## 📦 CUỐI THÁNG — CHỐT VÀ LƯU GÌ?

1. Vào **📦 Backup / Thống kê / Chốt tháng → 📅 Chọn tháng để xem thống kê** → nhập `MM-yyyy` (ví dụ `11-2026`).
2. Đọc tab **THỐNG KÊ**: chỉ ca có kết quả **Đã học** mới tính giờ; **Vắng/Nghỉ** được tách riêng để đối chiếu.
3. **Giữ nguyên tab `Backup tháng MM-yyyy`**. Đây là hồ sơ gốc của tháng; không xóa, không sửa tay, không cần nhân bản BAO_BU hoặc LICH_BU.
4. Tab **THỐNG KÊ** là màn hình xem lại: khi xem tháng khác, nội dung tab này thay đổi; dữ liệu lịch sử vẫn nằm an toàn ở từng tab **Backup tháng**.
5. Nếu cần một bản lưu ngoài hệ thống: Google Sheet → **Tệp → Tạo bản sao** → đặt tên `Dạy Bù - chốt MM-yyyy`. Không cần tạo bản sao mỗi tuần.

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

**Tin Dạy Bù không gửi?** Apps Script → Cài đặt dự án → Thuộc tính tập lệnh → kiểm tra `DAY_BU_BOT_TOKEN`. Thử: **📨 Gửi tin / Nhắc việc → 🧪 Gửi thử Topic Dạy Bù**.

---

## 📸 KHO ẢNH CHO SOTW (làm 1 lần — Mr. Khôi khỏi tìm ảnh)

1. Tạo folder Drive **`ẢNH HỌC SINH SOTW`** → thả ảnh vô — đặt tên theo **`MSHS-Họ tên.png`** (VD: `HV152-Phạm Gia Khải.png`). Hệ thống ưu tiên khớp MSHS nên không lẫn bé trùng tên; ảnh cũ chỉ có họ tên (vd `Nguyen Van A.jpg`) vẫn ghép được nhờ tự bỏ dấu khi so.
2. Chuột phải folder → **Chia sẻ** → "Bất kỳ ai có đường liên kết" → Người xem → Xong *(share 1 lần)*
3. Copy **link folder** (dạng `https://drive.google.com/drive/folders/xxxx`) → dán vào **ô H1 tab DS HỌC SINH**
4. Bấm **⚙️ Cài đặt → 🖼️ Gắn link ảnh SOTW (theo tên file)** → cột Link ảnh tự điền hết (tin SOTW kèm sẵn link 🔗 cho Mr. Khôi)
   - Ưu tiên khớp **MSHS**; nếu file ảnh cũ không có MSHS thì khớp theo **họ tên**.
   - Nếu MSHS khớp nhưng tên trong file khác tên danh sách, ảnh vẫn được gắn theo MSHS và popup sẽ báo rõ từng trường hợp để anh kiểm tra lại tên file.
   - Bé chưa có file ảnh → báo tên bé thiếu, thêm ảnh vào folder rồi bấm lại.
   - Thêm/đổi ảnh sau này → bấm lại nút 🖼️ là cập nhật.
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
| Tin Dạy Bù không gửi | Kiểm tra `DAY_BU_BOT_TOKEN`; vào 📨 Gửi tin / Nhắc việc → 🧪 Gửi thử Topic Dạy Bù |
| SOTW không gửi | Kiểm tra `SOTW_BOT_TOKEN`, `SOTW_CHAT_ID`, `SOTW_THREAD_ID`; thử trong 🛠️ Cài đặt kỹ thuật |
| Gửi lại SOTW | 📨 Gửi tin / Nhắc việc → 🏆 Gửi lại SOTW (hỏi trước) |
| Xem bảng lớp LOP | 🗂️ Cập nhật dữ liệu phụ → 🗜️ Ẩn / hiện bảng lớp tham khảo |
| Cột Lớp/Tên bé bị ngược | 🗂️ Cập nhật dữ liệu phụ → 🔍 Kiểm tra và sửa cột Lớp / Tên bé |
| Không nhớ lệnh nào dùng lúc nào | 🛠️ Cài đặt kỹ thuật → 📖 Hướng dẫn quy trình tuần + chốt tháng |
| Thống kê báo "Chưa có sheet Backup" | 📦 Backup / Thống kê / Chốt tháng → 💾 Lưu backup ngay (hoặc Kết tuần mới sẽ tự backup) |

---

## 📊 THỐNG KÊ VÀ KIỂM SOÁT GỬI TIN

- **Gửi tin cho GV** chỉ gửi ca chốt `✅` chưa có mốc **Đã gửi GV lúc**. Telegram gửi lỗi thì không ghi mốc. Cần gửi lại: menu **🔁 Gửi / Nhắc lẻ → 📨 Gửi lại tin GV đã chốt**, rồi xác nhận.
- **📌 Hôm nay cần làm gì?** trong menu Báo cáo cho biết bé chờ, xin đổi, ca chưa gửi GV và bé chưa chấm kết quả.
- Khi **Gom nhóm**, hệ thống cảnh báo thiếu tên/lớp/trình độ hoặc link Canva trước khi ghi lịch; quản lý có thể dừng để sửa hoặc xác nhận tiếp tục. Cảnh báo ca quá 4 bé, quá 2 trình độ và cùng GV trùng giờ được hỗ trợ bởi kiểm tra nghiệp vụ.
- **Báo cáo**: chọn “Làm mới thống kê tháng này” hoặc “Chọn tháng để xem thống kê” (dạng `MM-yyyy`, ví dụ `11-2026`). Chỉ **Đã học** được tính ca/giờ; **Vắng** và **Nghỉ** được liệt kê riêng, không tính giờ dạy.

## 🧪 KIỂM THỬ CODE
`node test_sotw.js` — **245 PASS / 0 FAIL** (gom nhóm, SOTW, cascade BAO_BU, gửi GV chống trùng/gửi lại, dashboard, validation, báo cáo tháng, Vắng/Nghỉ không tính giờ, backup chống trùng, làm mới tuần dừng an toàn khi backup lỗi, menu, ca đặc biệt T2–CN và cảnh báo trùng giờ/quá tải). Phải PASS toàn bộ trước khi push.
