# 📚 JOY DẠY BÙ — Hướng dẫn đầy đủ

Hệ thống xếp lịch học bù + SOTW (Student of the Week) chạy trên **Google Sheet + Apps Script**.
File này là hướng dẫn DUY NHẤT cần đọc — mọi bản plan/audit cũ đã chuyển vào thư mục [`docs/`](docs/).

---

## 🏗️ CẤU TRÚC

**Các tab làm việc (4 tab):**
| Tab | Ai dùng | Việc gì |
|-----|---------|---------|
| **BAO_BU** | GV (báo bé nghỉ) + quản lý | Nơi báo bù và **lịch tạm**. Quản lý chọn/đổi **Ca xếp** (`Mã ca | Thứ | Giờ | GV`) từ các ca đang bật. Sau khi gửi GV thành công, dòng này tự hiện lại **ca cuối** và trạng thái `Đã báo GV`. |
| **LICH_BU** | quản lý | Lịch dùng để hỏi PH và chốt lịch cuối. Cột **Ca xếp (chọn)** tự cập nhật mã, thứ, giờ, GV, ngày học; đổi ca sau khi hỏi PH sẽ bắt xác nhận lại. Khi PH `✅ Đi được`, lịch được chốt rồi mới gửi GV. |
| **CÀI ĐẶT CA DẠY BÙ** | quản lý | Danh mục ca dùng chung: mã, thứ, giờ, GV, trạng thái và sức chứa. Cột **Ca hiển thị** chỉ để xem; sửa ca chung ở đây, không sửa theo từng bé. |
| **DS HỌC SINH** | GV + quản lý | Danh sách HS + **tick SOTW** ☑; ô **"GV đang chọn" → ẨN hết lớp khác**, chọn thêm **"Lớp cần chọn" → lọc tới bé lớp đó**; xóa 2 ô → hiện lại toàn bộ (dropdown GV/Lớp lấy từ dữ liệu thật, tự chạy lại sau mỗi lần Đồng bộ) |
| **Backup tháng MM-YYYY** | tự động | Lưu lịch sử (không ai sửa tay) |

*Ẩn đi cho gọn:* tab **LOP** (tham khảo — hiện lại: 🗜️ trong Cài đặt). Tab **THỐNG KÊ** tự tạo khi bấm báo cáo.

**Menu ⚙️ Quản lý Dạy Bù: (chỉ dành quản lý — GV không cần vào)**
```
├─ 1️⃣ Cập nhật danh sách HS đầu tuần
├─ 2️⃣ Gom nhóm tạm + gửi SOTW (T2 chiều)
├─ 3️⃣ Chốt BAO_BU → tạo LICH_BU + Tin PH
├─ 4️⃣ Xử lý PH xin đổi / quá hạn (khi có)
├─ 5️⃣ Chốt LICH_BU → tạo tin GV
├─ 6️⃣ Gửi lịch đã chốt cho GV (T5-T6)
├─ 7️⃣ Kết tuần mới — tự backup trước (T7-CN)
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

**Nếu có đổi GV dạy thay:** mở tab **LOP** (🗂️ Cập nhật dữ liệu phụ → 🗜️ Hiện bảng lớp tham khảo), sửa cột **GV chính** của lớp đó. Khi nhập ở BAO_BU, chọn GV mới thì dropdown sẽ hiện đúng lớp và học sinh của lớp đó; không cần sửa từng bé.

### 3. CẢ TUẦN — GV nhập liệu (chỉ click & gõ theo mẫu)
- **Báo bù:** vào BAO_BU → **chọn GV** (ô B) → **chọn Lớp** (ô C) → **chọn Tên bé** (ô D) → gõ trình độ + link Canva. Chọn TÊN BÉ trước cũng được: hệ thống tự điền Lớp + GV báo. Lớp đi đủ → gõ `Không bù` ở cột Tên bé. GV cần dặn dò → ghi ô **Ghi chú** (I).
- **Ca đặc biệt (cột K):** chỉ dùng cho một ca riêng/đổi giờ một lần. Xem luôn 2 dòng mẫu đầu bảng: `T2 08h00-09h30 Ms. Vân` hoặc `CN 09h00-10h30 Mr. Đức Anh`. Không tạo thêm dòng mẫu.
- **GV dạy bù ưu tiên (cột L):** chỉ chọn khi muốn đổi RIÊNG một bé sang Ms. Vân hoặc Mr. Đức Anh. Để trống = dùng ưu tiên của cả lớp trong sheet CÀI ĐẶT CA DẠY BÙ, nên không cần nhập lặp cho từng bé.
- **SOTW:** vào **DS HỌC SINH** → chọn tên mình ở ô "GV đang chọn" → **tick ☑** bé SOTW.

### 4. Khi đổi giờ/GV chung — sửa một chỗ
Vào tab **CÀI ĐẶT CA DẠY BÙ**:
- Bên trái: 6 ca Dạy Bù. Muốn thêm ca, đổi giờ, đổi GV hoặc bật/tắt ca, sửa trực tiếp dòng ca đó; chỉ Ms. Vân và Mr. Đức Anh nhận xếp tự động.
- Khi sửa xong, dropdown **Ca xếp** ở BAO_BU và LICH_BU tự làm mới ngay. Nếu mạng/Sheet đang chậm, bấm **⚙️ Quản lý Dạy Bù → 🗂️ Cập nhật dữ liệu phụ → 🔄 Làm mới danh sách Ca xếp**. Nút này chỉ cập nhật danh sách chọn, **không đổi lịch, không xếp lại bé, không gửi tin**.
- Bên phải: mỗi lớp có một ô **GV dạy bù ưu tiên**. Chỉ chọn Ms. Vân/Mr. Đức Anh cho lớp cần gom về đúng giáo viên dạy thay; để trống nếu không có yêu cầu.
- Đây là cài đặt dùng lâu dài. **Ca đặc biệt** ở BAO_BU chỉ dành cho ngoại lệ một lần.

### 5. T2 CHIỀU — bấm **2️⃣ Gom nhóm tạm + gửi SOTW**
Máy chỉ gán **Ca xếp tạm** trong BAO_BU từ các ca **Dùng** ở tab **CÀI ĐẶT CA DẠY BÙ**. Quản lý có thể chọn lại ca; chưa tạo LICH_BU, tin PH hay tin GV.

### 6. Hỏi PH — bấm **3️⃣ Chốt BAO_BU → tạo LICH_BU + Tin PH**
Hệ thống tạo lịch hỏi PH. Khi chốt, ca bị tắt, quá chỗ, quá số trình độ hoặc trùng giờ GV sẽ bị chặn và nêu rõ để sửa trước. PH trả lời tại cột **PH xác nhận** trong LICH_BU.

### 7. Có đổi lịch — chỉ khi PH xin đổi/quá hạn
Bấm **4️⃣ Xử lý PH xin đổi / quá hạn**, rồi bấm **2️⃣ Gom nhóm tạm** lại cho các bé đó và hỏi PH lại. Nếu đổi trực tiếp **Ca xếp (chọn)** ở LICH_BU, hệ thống tự đổi mã/thứ/giờ/GV/ngày học, xoá xác nhận cũ và yêu cầu PH xác nhận lại.

### 8. PH xác nhận ✅ — bấm **5️⃣ Chốt LICH_BU → tạo tin GV**, rồi **6️⃣ Gửi lịch đã chốt cho GV**
Chỉ bé `✅ Đi được` mới được tạo/gửi tin GV. Telegram gửi thành công thì BAO_BU tự cập nhật **ca cuối** và trạng thái `Đã báo GV`. Nếu gửi lỗi, chưa được xem là đã báo GV; không bấm Gửi lại chỉ để đồng bộ.

### 9. CUỐI TUẦN — bấm **7️⃣ Kết tuần mới** (1 nút làm 4 việc)
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
2. Về Sheet → **⚙️ Quản lý Dạy Bù → 🛠️ Cài đặt kỹ thuật → 🔧 Nâng cấp sheet sau khi copy code mới**
   - Tự tạo DS HỌC SINH, cột SOTW, 2 dòng mẫu (không mất data), ẩn tab LOP
   - Hỏi 1 lần: cài backup tự động tối T7 → trả lời **Có**
3. **Nhập danh sách học sinh** vào DS HỌC SINH từ ô **A3**: copy từ Excel **Tên | Lớp | GV** → paste
   - Giới tính + Link ảnh: **để trống cũng được** (tin SOTW tự bỏ phần thiếu)
4. Bấm lại **🔧 Nâng cấp sheet sau khi copy code mới** (điền GV chính cho danh sách mới)

> ⚠️ **KHÔNG** bấm "🔨 Tạo sheet mới" khi sheet đã có dữ liệu — nó xoá hết.

**Tin Dạy Bù không gửi?** Apps Script → Cài đặt dự án → Thuộc tính tập lệnh → kiểm tra `DAY_BU_BOT_TOKEN`. Thử: **📨 Gửi tin / Nhắc việc → 🧪 Gửi thử Topic Dạy Bù**.

---

## 📸 KHO ẢNH CHO SOTW (làm 1 lần — Mr. Khôi khỏi tìm ảnh)

1. Tạo folder Drive **`ẢNH HỌC SINH SOTW`** → thả ảnh vô — đặt tên theo **`MSHS-Họ tên.png`** (VD: `HV152-Phạm Gia Khải.png`). Hệ thống ưu tiên khớp MSHS nên không lẫn bé trùng tên; ảnh cũ chỉ có họ tên (vd `Nguyen Van A.jpg`) vẫn ghép được nhờ tự bỏ dấu khi so.
2. Chuột phải folder → **Chia sẻ** → "Bất kỳ ai có đường liên kết" → Người xem → Xong *(share 1 lần)*
3. Copy **link folder** (dạng `https://drive.google.com/drive/folders/xxxx`) → dán vào **ô H1 tab DS HỌC SINH**
4. Bấm **⚙️ Quản lý Dạy Bù → 🗂️ Cập nhật dữ liệu phụ → 🖼️ Gắn ảnh SOTW từ folder** → cột Link ảnh tự điền hết (tin SOTW kèm sẵn link 🔗 cho Mr. Khôi)
   - Ưu tiên khớp **MSHS**; nếu file ảnh cũ không có MSHS thì khớp theo **họ tên**.
   - Nếu MSHS khớp nhưng tên trong file khác tên danh sách, ảnh vẫn được gắn theo MSHS và popup sẽ báo rõ từng trường hợp để anh kiểm tra lại tên file.
   - Bé chưa có file ảnh → báo tên bé thiếu, thêm ảnh vào folder rồi bấm lại.
   - Thêm/đổi ảnh sau này → bấm lại nút 🖼️ là cập nhật.
   - *Cách cũ (copy từng link dán tay) vẫn dùng được*

---

## 🔁 ĐỒNG BỘ TỪ FILE CHÍNH (chỉ đọc — KHÔNG bao giờ ghi vào file gốc)

Danh sách HS trong **DS HỌC SINH** lấy tự động từ file chính của anh:
- **Nút:** ⚙️ Quản lý Dạy Bù → **1️⃣ Cập nhật danh sách HS đầu tuần**
- **Tự chạy** khi bấm **2️⃣ Gom nhóm tạm** và khi **🔧 Nâng cấp sheet sau khi copy code mới**
- **Lần đầu Google xin quyền đọc** → hiện trang cảnh báo → bấm *Advanced → Go to ... → Allow (Cho phép)* → chạy lại
- Cách lấy: A:B:C (Tên/Lớp/GV) ← file chính; **D:E:F (Giới tính/Link ảnh/Tick SOTW) giữ nguyên theo tên bé**
- Bé có trong DS nhưng **không có trong file chính** → giữ lại cuối bảng + báo anh quyết (không tự xoá)
- File chính **chỉ bị ĐỌC** (test tự kiểm: 0 lượt ghi)

---

## 🔍 KIỂM TRA THỨ TỰ CỘT BAO_BU (khi nghi dữ liệu bị ngược)

Nếu anh thấy cột Lớp/Tên bé có dòng bị ngược (vd 2 dòng mẫu trước đây): **⚙️ Cài đặt → 🔍 Kiểm tra / sửa thứ tự cột BAO_BU** → nó dò TỪNG DÒNG (C chứa lớp? D chứa tên?), dòng nào ngược tự sửa, dòng nào mơ hồ (2 cột đều giống tên) báo để anh xem tay. Chạy bao nhiêu lần cũng an toàn.

## 📊 THỐNG KÊ (menu 📊 → Làm mới thống kê)

- **Cần data gì?** Tab `Backup tháng MM-YYYY` — tự tạo khi anh bấm **💾 Lưu backup ngay** hoặc **7️⃣ Kết tuần mới** (tự backup trước khi xoá). Tháng nào chưa backup lần nào → báo "Chưa có sheet Backup tháng …".
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

- **Gửi tin cho GV** chỉ gửi ca chốt `✅` chưa có mốc **Đã gửi GV lúc**. Telegram gửi lỗi thì không ghi mốc. Cần gửi lại: **⚙️ Quản lý Dạy Bù → 📨 Gửi tin / Nhắc việc → 📨 Gửi lại lịch đã chốt cho GV**, rồi xác nhận.
- **📌 Hôm nay cần làm gì?** trong menu Báo cáo cho biết bé chờ, xin đổi, ca chưa gửi GV và bé chưa chấm kết quả.
- Khi **Gom nhóm**, hệ thống cảnh báo thiếu tên/lớp/trình độ hoặc link Canva trước khi ghi lịch; quản lý có thể dừng để sửa hoặc xác nhận tiếp tục. Cảnh báo ca quá 4 bé, quá 2 trình độ và cùng GV trùng giờ được hỗ trợ bởi kiểm tra nghiệp vụ.
- **Báo cáo**: chọn “Làm mới thống kê tháng này” hoặc “Chọn tháng để xem thống kê” (dạng `MM-yyyy`, ví dụ `11-2026`). Chỉ **Đã học** được tính ca/giờ; **Vắng** và **Nghỉ** được liệt kê riêng, không tính giờ dạy.

## 🧪 KIỂM THỬ CODE
`node test_sotw.js` — kiểm thử đầy đủ (gồm workflow BAO_BU tạm → LICH_BU/Tin PH → LICH_BU chốt/Tin GV) (gom nhóm, SOTW, cascade BAO_BU, gửi GV chống trùng/gửi lại, dashboard, validation, báo cáo tháng, Vắng/Nghỉ không tính giờ, backup chống trùng, làm mới tuần dừng an toàn khi backup lỗi, menu, ca đặc biệt T2–CN và cảnh báo trùng giờ/quá tải). Phải PASS toàn bộ trước khi push.
