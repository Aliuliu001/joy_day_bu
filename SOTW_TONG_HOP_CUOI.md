# TỔNG HỢP CUỐI — PLAN SOTW (check trước khi code)
14/10/2026 — Bản chốt, chờ chị tick duyệt rồi code

---

## 1️⃣ QUYỀN RIÊNG TỪNG GV (bổ sung của chị)

**Ý:** GV chọn tên mình → danh sách **chỉ sáng các lớp của GV đó**

**Cách triển khai (em làm):**
- Tab DS HỌC SINH có ô dropdown trên cùng: **"GV đang chọn: [chọn tên]"**
- Conditional formatting: dòng nào GV chính = GV đang chọn → **SÁNG**, còn lại **MỜ**
- Các lớp của GV 1 người hiển thị bright → tick nhanh, không tick nhầm lớp GV khác
- Chọn tên = 1 click, không gõ
- (GV có thể bấm thêm "Chọn lớp" để thu nhỏ tiếp — tuỳ chọn, không bắt buộc)

---

## 2️⃣ DRIVE KHO ẢNH — GỢI Ý CÁCH LÀM (trả lời câu của chị)

### 📁 Gom hết 1 folder hay tách folder từng lớp?
**→ Khuyên: GOM HẾT VÀO 1 FOLDER DUY NHẤT**

| | 1 folder tổng (khuyên) | Tách folder từng lớp |
|---|---|---|
| Share permission | **Share 1 lần duy nhất** | Share mỗi folder 1 lần (25 lớp = 25 lần) |
| Thêm bé mới | Bỏ vô folder là xong | Phải nhớ đúng folder lớp |
| Tìm tay | Gõ tên vào ô tìm kiếm Drive → ra ngay | Phải vào đúng folder trước |
| Code đọc | Không phụ thuộc cấu trúc | Phải đi nhiều folder |

→ 1 folder + **tên file = họ tên bé** (`Ngô Bảo Hân.jpg`) là tối ưu nhất.

### 🔗 Cách tạo link (tối ưu — share 1 lần cho tất cả):

**Bước 1 — Tạo folder:**
1. Vào drive.google.com → nút **+ Mới** → **Thư mục**
2. Tên: `ẢNH HỌC SINH SOTW` → Tạo

**Bước 2 — Bỏ toàn bộ ảnh vô (kéo thả):**
- Đặt tên file ảnh = họ tên bé trước khi thả vào (sửa tên: chuột phải → Đổi tên)

**Bước 3 — Share CẢ folder 1 lần (không share từng bé):**
1. Quay ra giao diện chính → chuột phải folder `ẢNH HỌC SINH SOTW` → **Chia sẻ**
2. Ở "Quyền truy cập chung" → đổi thành: **Bất kỳ ai có đường liên kết**
3. Vai trò: **Người xem** → **Xong**
→ Xong! Toàn bộ ảnh trong folder ai bấm link cũng mở được (không cần tài khoản)

**Bước 4 — Lấy link từng bé dán vô Sheet:**
1. Vào folder → chuột phải file ảnh → **Chia sẻ** → **Sao chép liên kết**
2. Dán vào cột "Link ảnh" của bé trong danh sách

💡 **Mẹo:** nếu lười copy 25-130 link tay → **em có thể code cho ôm nguyên folder**
(code đọc folder tự ghép "tên file → link", chị chỉ cần upload ảnh + share folder 1 lần.
Chị có link sẵn rồi thì nhập thẳng cũng được — 2 đường đều chạy.)

### ⚠️ Lưu ý nhỏ:
- Ảnh trẻ em để "ai có link" = link bí mật, ai có URL mới mở được (không hiện tìm kiếm công khai)
- Nếu muốn chặt hơn: chia sẻ cho đúng email GV (Mr. Khôi...) thay vì "bất kỳ ai" — nhưng khi gửi Zalo/Telegram thì người bấm link phải đăng nhập Google → **"Bất kỳ ai có link" tiện hơn** cho cách dùng của mình
- Tên file trùng tên bé khác (hiếm) → thêm mã lớp đầu tên: `S1.001 Ngô Bảo Hân.jpg`

---

## 🏗️ TOÀN BỘ HỆ THỐNG SAU KHI GOM (bản check cuối)

### A. Cấu trúc Sheet
```
Tab BAO_BU (giữ nguyên 9 cột + thêm cột 10):
A Ngày báo | B GV báo | C Tên bé | D Lớp | E Trình độ | F Link Canva
| G Trạng thái | H Ca xếp | I Ghi chú | J SOTW (link mở DS HỌC SINH)
• Dòng 2-3: 2 dòng mẫu ("Không bù" + "vắng bạn Iphone") — bảo vệ, gom nhóm bỏ qua
• Cột G,H,I: chỉ quản lý sửa (đã có từ trước)

Tab DS HỌC SINH (mới):
Tên bé | Lớp | GV chính | Giới tính | Link ảnh | ☑ SOTW tuần này
• Ô dropdown trên cùng: "GV đang chọn" → chỉ lớp GV đó SÁNG
• Ô dropdown phụ: "Lớp cần chọn" (tuỳ chọn, thu nhỏ thêm)
• GV chính: code tự điền từ LOP_LIST
• Dữ liệu: chị cung cấp danh sách tổng (Tên | Lớp | Giới tính | Link ảnh)

Tab LICH_BU, LOP, Backup tháng, THỐNG KÊ: giữ nguyên
```

### B. Workflow 1 nút "Gom nhóm" chạy gộp
```
GV cả tuần: vào DS HỌC SINH → chọn tên mình → tick bé SOTW (click & tick, không gõ)

T2 bấm "1️⃣ Gom nhóm":
  PHẦN A — Xếp lịch (như hiện tại, skip dòng mẫu)
  PHẦN B — SOTW:
    1. Chưa gửi tuần này → đọc tick → gom theo GV → gửi topic Học Bù
       🏆 [SOTW TUẦN ...]
       👨‍🏫 Mr. Ngọc:
       • Cashew: Ngô Bảo Hân 🔗(link ảnh), Lê Quốc Thiên Bảo 🔗
       ⚠️ Tick nhầm GV khác: ... (nếu có)
       ⚠️ Chưa nộp: Ms. Trâm, ...
    2. Tự xoá tick + ghi mốc "SOTW đã gửi: ngày"
    3. Đã gửi tuần này → lần gom lại BỎ QUA phần SOTW (chống trùng)

Nút phụ "🏆 Gửi SOTW" — gửi lại khi cần (hỏi xác nhận trước)
Nút phụ "🔔 Nhắc GV" — tin nhắc thêm hướng dẫn tick SOTW
```

### C. Menu mới
```
1️⃣ Gom nhóm (T2 chiều)          ← gộp phần SOTW
2️⃣ Xử lý case đặc biệt (T4)
3️⃣ Gửi tin cho GV (T5-T6)
4️⃣ 🏆 Gửi SOTW (gửi lại - hỏi trước)
5️⃣ Làm mới tuần mới
─── phụ ───
📊 Làm mới thống kê · 🔔 Nhắc GV báo bù · 💾 Backup thủ công
─── cài đặt ───
⚙️ Cài trigger · 🔨 Tạo sheet · 🔧 Nâng cấp sheet SOTW
```

---

## 📋 CÔNG VIỆC CODE (GĐ 1)

| # | Việc | Ghi chú |
|---|------|---------|
| 1 | Hàm "🔧 Nâng cấp sheet SOTW" | Tạo tab DS HỌC SINH + dropdown GV + tô sáng + nhập data; thêm cột J BAO_BU; thêm 2 dòng mẫu + bảo vệ. **Không xoá data cũ** |
| 2 | Nâng cấp nút "1️⃣ Gom nhóm" | Gộp phần SOTW: gửi → xoá tick → mốc tuần; skip dòng mẫu |
| 3 | Nút "4️⃣ 🏆 Gửi SOTW" | Gửi lại có hỏi xác nhận |
| 4 | Sửa tin nhắc GV | Hướng dẫn: chọn tên → tick bé SOTW |
| 5 | Sửa onEdit | Không tự gõ ngày vào dòng mẫu |

**GĐ 2 (sau):** link ảnh mở được → code đính kèm ảnh THẬT vào tin Telegram
**GĐ 3 (tuỳ chọn):** nút nhắc riêng GV chưa tick

---

## ✅ CHECKLIST CHỊ DUYỆT TRƯỚC KHI CODE

- [ ] Quyền GV: dropdown "GV đang chọn" → chỉ lớp GV đó sáng
- [ ] Cột 10 BAO_BU = SOTW trỏ tới tab DS HỌC SINH (cùng file, không tách file)
- [ ] DS HỌC SINH: Tên | Lớp | GV chính | Giới tính | Link ảnh | Tick
- [ ] Giới tính nhập 1 lần trong danh sách gốc (GV không chọn mỗi tuần)
- [ ] Gom nhóm chạy gộp phần SOTW + chống gửi trùng (mốc tuần)
- [ ] Giữ nút 🏆 Gửi SOTW dự phòng (hỏi trước)
- [ ] 2 dòng mẫu BAO_BU: bảo vệ + không xếp lịch
- [ ] Drive: 1 folder tổng "ẢNH HỌC SINH SOTW", share "ai có link" 1 lần, tên file = tên bé

**Đồ cần chị chuẩn bị (1 lần):**
- [ ] Danh sách tổng: Tên | Lớp | Giới tính | Link ảnh (dán/Excel/link Sheet đều được)

---

## 📌 BỔ SUNG CUỐI (chỉ đạo của chị 14/10) — THAY ĐỔI QUY TRÌNH XOÁ TICK

**Trước đây (trong plan):** gửi SOTW xong → tự xoá tick luôn.
**Bổ sung mới:**
- ❌ KHÔNG xoá tick sau khi gửi — **giữ tick cả tuần để check lại khi cần**
- ✅ Thời điểm xoá = cùng lúc **"Làm mới tuần mới"** (khi clear BAO_BU) → xoá luôn tick SOTW + mốc "đã gửi"
- Chống gửi trùng vẫn giữ bằng **mốc "SOTW đã gửi: Tuần ... "**

**Workflow sau bổ sung:**
```
Cả tuần: GV tick ☑ (giữ nguyên sau khi gửi để check)
T2 Gom nhóm: xếp lịch + gửi SOTW + ghi mốc (không xoá tick)
   → gom lại lần nữa: thấy mốc tuần này → bỏ qua phần SOTW (chống trùng)
Cuối tuần, chị bấm "5️⃣ Làm mới tuần mới":
   → clear BAO_BU + LICH_BU + XOÁ TICK SOTW + XOÁ MỐC
   → danh sách HS, link ảnh, giới tính: GIỮ NGUYÊN
```
