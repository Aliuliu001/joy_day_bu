# HƯỚNG DẪN CẬP NHẬT CODE MỚI
Ngày: 14/10/2026

## ✅ CODE ĐÃ PUSH LÊN GITHUB THÀNH CÔNG!

Link GitHub: https://github.com/Aliuliu001/joy_day_bu/blob/main/Code.gs

---

## 📝 CHẠY LIỆT ĐỂ CẬP NHẬT (3 BƯỚC)

### BƯỚC 1: Mở Apps Script
1. Mở Google Sheet **DẠY BÙ** của chị
2. Bấm menu **Tiện ích mở rộng** (Extensions) → **Apps Script**

### BƯỚC 2: Copy code mới từ GitHub
1. Mở link: https://github.com/Aliuliu001/joy_day_bu/blob/main/Code.gs
2. Bấm nút **Copy raw file** (góc phải, biểu tượng 2 tờ giấy chồng lên nhau)
3. Quay về Apps Script
4. Chọn tất cả code cũ (Ctrl+A)
5. Dán code mới đè lên (Ctrl+V)
6. Bấm **💾 Lưu** (Ctrl+S)

### BƯỚC 3: Deploy phiên bản mới (QUAN TRỌNG!)
1. **KHÔNG** vào "Triển khai" → "Quản lý các tùy chọn triển khai"
2. **CHỈ CẦN** bấm **💾 Lưu** là xong!
3. Code mới đã chạy rồi ạ

---

## 🎯 THAY ĐỔI MỚI

### 1️⃣ Tin nhắn PH ngắn gọn hơn
**TRƯỚC:**
```
Dạ em chào chị, em xin thông báo lịch học bù cho bé [Tên]:
• Thời gian: Thứ 5 ngày 17/10/2026 lúc 17h00 - 18h30
• GV: Ms. Vân          ← BỎ dòng này
• Lớp: S1.005 - Peach  ← BỎ dòng này
Dạ thời gian này chị có sắp xếp...
```

**SAU:**
```
Dạ em chào chị, em xin thông báo lịch học bù cho bé [Tên]:
• Thời gian: Thứ 5 ngày 17/10/2026 lúc 17h00 - 18h30
Dạ thời gian này chị có sắp xếp...
```

### 2️⃣ Menu mới - GỌN HƠN
**TRƯỚC:** 10 nút lộn xộn

**SAU:** 9 nút, phân nhóm rõ ràng
```
📚 DẠY BÙ
├─ 1️⃣ Gom nhóm (T2 chiều)
├─ 2️⃣ Xử lý case đặc biệt (T4)      ← MỚI (gộp Xin đổi + Quá hạn)
├─ 3️⃣ Gửi tin cho GV (T5-T6)
├─ 4️⃣ Làm mới tuần mới (tuần sau)   ← MỚI
├─ ─────────────────
├─ 📊 Làm mới thống kê
├─ 🔔 Nhắc GV báo bù (sáng T2)
├─ 💾 Backup thủ công
├─ ─────────────────
├─ ⚙️ Cài trigger tự động
└─ 🔨 Tạo sheet (chỉ chạy 1 lần)
```

### 3️⃣ Nút "Xử lý case đặc biệt" (GỘP 2 NÚT CŨ)
**Chức năng:**
- Tìm tất cả bé "🔄 Xin đổi" + bé "Chờ Ms. Vân Anh" (quá hạn)
- Hỏi xác nhận trước khi chuyển
- Chuyển về BAO_BU với **Ca xếp = trống** (để xếp lại)
- Xoá khỏi LICH_BU (giải phóng chỗ)
- Gửi Telegram tổng hợp cho chị

**Khi nào dùng:** Thứ 4 sau khi hết hạn PH trả lời

### 4️⃣ Backup T7 an toàn hơn
**TRƯỚC:**
- Backup → xoá sạch BAO_BU + LICH_BU luôn (nguy hiểm!)

**SAU:**
- Backup → **CHỈ LƯU**, không xoá gì
- Chống duplicate: nếu hôm nay đã backup rồi → bỏ qua
- Chị tự bấm "Làm mới tuần mới" khi sẵn sàng

### 5️⃣ Nút "Làm mới tuần mới" - FIX LỖI NGHIÊM TRỌNG
**LỖI CŨ:**
- Chỉ giữ bé có ghi chú "Tuần sau"
- Bé "Quá hạn", "Xin đổi" → **BỊ XOÁ MẤT!** ❌

**FIX MỚI:**
- GIỮ tất cả bé trong BAO_BU có **"Ca xếp" = trống**
- Bao gồm: bé mới báo, Quá hạn, Xin đổi, hết chỗ...
- Không mất bé nào nữa ✅

**Khi nào dùng:** Đầu tuần mới khi chị sẵn sàng làm mới

---

## 🔄 WORKFLOW MỚI (THỰC TẾ)

### T2 SÁNG
- Nút: **🔔 Nhắc GV báo bù**
- Hoặc tự động (nếu đã cài trigger)

### T2 CHIỀU
- Nút: **1️⃣ Gom nhóm**
- Tạo tin nhắn PH (ngắn gọn hơn!)
- Copy gửi Zalo cho PH

### T3-T4: ĐỢI PH TRẢ LỜI
- ✅ Đi được → OK
- 🔄 Xin đổi → chờ xử lý
- ❌ Nghỉ → backup rồi xoá
- (Không trả lời) → chờ xử lý

### T4 CHIỀU
- Nút: **2️⃣ Xử lý case đặc biệt**
- Tự động chuyển "Xin đổi" + "Quá hạn" về BAO_BU
- Gửi Telegram báo chị

### T5-T6: HỌC BÙ
- Nút: **3️⃣ Gửi tin cho GV** (chỉ ca ✅)
- Sau giờ học: tick "Đã dạy" / "Vắng"

### T7 TỐI 22H
- **Trigger tự động:** Backup (CHỈ lưu, không xoá)
- Chạy mỗi T7, có chống duplicate

### ĐẦU TUẦN SAU (khi chị sẵn sàng)
- Nút: **4️⃣ Làm mới tuần mới**
- Hỏi xác nhận
- Giữ đúng bé chưa xếp (Ca xếp = trống)
- Xoá LICH_BU + BAO_BU đã xếp

---

## 🚨 LƯU Ý QUAN TRỌNG

### ✅ AN TOÀN
1. Backup T7 **không xoá gì** nữa → an toàn hơn
2. "Làm mới tuần mới" **có hỏi trước** → chị chủ động
3. Bé chuyển về BAO_BU **không bị mất** nữa

### ⚠️ KHÁC BIỆT LỚN
- **Không còn nút** "Đẩy quá hạn" riêng
- **Không còn nút** "Xin đổi" riêng
- → **GỘP THÀNH** "Xử lý case đặc biệt"

### 📋 DẤU HIỆU BÉ CHƯA XẾP
- **Cột "Ca xếp"** (cột H trong BAO_BU) = **TRỐNG**
- Đây là dấu hiệu để hàm "Làm mới tuần mới" giữ lại bé
- KHÔNG dựa vào ghi chú nữa

---

## 🧪 TEST SAU KHI CẬP NHẬT

### Test 1: Menu hiện đúng chưa?
1. Đóng Apps Script
2. Mở lại Sheet DẠY BÙ
3. Xem menu **📚 Dạy Bù** có 9 nút như trên không

### Test 2: Backup có chống duplicate không?
1. Bấm nút **💾 Backup thủ công**
2. Xem có báo "Hôm nay đã backup rồi" không
3. Kiểm tra sheet "Backup tháng 10-2026" có dòng cuối cùng hôm nay không

### Test 3: "Xử lý case đặc biệt" chạy không?
1. Thử bấm nút **2️⃣ Xử lý case đặc biệt**
2. Nếu không có bé nào → báo "Không có bé nào cần xử lý"
3. Nếu có bé → hỏi xác nhận trước khi chuyển

---

## 📞 NẾU GẶP VẤN ĐỀ

1. **Menu không hiện nút mới:**
   - Đóng Sheet → Mở lại
   - Hoặc F5 refresh

2. **Code không chạy:**
   - Kiểm tra có **Lưu** (Ctrl+S) chưa
   - Thử chạy hàm `testGuiTelegram` để test

3. **Telegram không gửi:**
   - Kiểm tra TELEGRAM_BOT_TOKEN trong Script Properties
   - Xem Nhật ký thực thi (View → Logs)

---

## 📊 THỐNG KÊ THAY ĐỔI

- **File Code.gs:** 669 dòng → 638 dòng (gọn hơn 31 dòng)
- **Số hàm:** 25 hàm (bỏ 2 hàm cũ, thêm 2 hàm mới)
- **Menu:** 10 nút → 9 nút (gọn hơn 1 nút)
- **Lỗi nghiêm trọng đã fix:** 3 lỗi

---

Chị làm theo 3 bước trên là xong ạ! Có gì không hiểu hoặc gặp lỗi thì chị báo em nhé! 🚀
