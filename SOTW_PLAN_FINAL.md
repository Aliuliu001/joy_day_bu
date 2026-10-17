# PLAN SOTW CUỐI CÙNG — "TICK → GỬI → TỰ XOÁ"
Chốt 14/10/2026 — Sẵn sàng code sau khi chị OK

---

## ✅ QUYẾT ĐỊNH (đã chốt)

1. **Nhập SOTW = Tick checkbox** (không phải gõ text — thay cách đã duyệt trước)
2. Gửi topic **Học Bù hiện tại**
3. "Form mẫu" = 2 dòng mẫu BAO_BU (case đi đủ/vắng) — GV trực tiếp trong Sheet
4. Khung Canva SOTW (GĐ 0, làm tay): viền theo giới tính + danh sách HS ở top
5. Kho ảnh: folder Drive, tên file = tên bé → GĐ 2 code tự đính kèm ảnh

---

## 🏗️ CẤU TRÚC MỚI

### Tab mới: "DS HỌC SINH" (nguồn sự thật của học sinh)
| Tên bé | Lớp | GV chính | Giới tính | ☑ SOTW tuần này |
|--------|-----|----------|-----------|------------------|
| Ngô Bảo Hân | S1.001 - Cashew | Mr. Ngọc | Nam | ☑ |
| Lê Quốc Thiên Bảo | S1.001 - Cashew | Mr. Ngọc | Nam | ☑ |
| Cao Nguyễn Bảo Nghi | S2.001 - Pumpkin Seed | Mr. Ngọc | Nữ | ☐ |

- **Cột "Giới tính"** → dùng cho viền khung Canva (ý tưởng bạn chị) + soạn tin
- **Cột "☑ SOTW tuần này"** = checkbox GV tick
- GV chính lấy từ LOP_LIST (code tự điền, không cần chị gõ)
- ⚠️ **Cần chị cung cấp danh sách học sinh** (tên + lớp + giới tính) — dạng Excel/Sheet均可

### Tab BAO_BU: GIỮ NGUYÊN 9 cột cũ (KHÔNG thêm cột SOTW nữa)
- Tick nằm ở DS HỌC SINH nên BAO_BU không đổi cấu trúc
- **2 dòng mẫu** (dòng 2-3): case "Không bù" + case "vắng bạn Iphone"
  - Bảo vệ: chỉ quản lý sửa được
  - Dấu hiệu "(DÒNG MẪU)" → gom nhóm bỏ qua, không xếp lịch
  - onEdit không tự gõ ngày vào dòng mẫu

---

## 🔄 WORKFLOW "TICK → GỬI → TỰ XOÁ"

```
CẢ TUẦN: GV vào tab DS HỌC SINH → tick ☑ bé được SOTW
   (tick nhầm bé lớp khác → code cảnh báo khi gửi, không mất)

T2 (sau gom nhóm): bấm "4️⃣ 🏆 Gửi SOTW cho Mr. Khôi"
   1. Đọc toàn bộ tick
   2. Gom theo GV chính của lớp:
      🏆 [SOTW TUẦN 13/10 - 19/10]
      👨‍🏫 Mr. Ngọc:
      • Cashew: Ngô Bảo Hân, Lê Quốc Thiên Bảo
      • Pumpkin Seed: Cao Nguyễn Bảo Nghi, Trần Kiên
   3. Cảnh báo:
      ⚠️ Tick nhầm: Ms. Ngọc tick bé lớp Ms. Trâm: ... (kiểm tra lại)
      ⚠️ Chưa nộp SOTW: Ms. Trâm, Ms. Nhung
   4. Gửi topic Học Bù
   5. TỰ XOÁ toàn bộ tick → sẵn sàng tuần mới
   (tick = 0 → báo "Chưa ai tick SOTW tuần này")
```

**Chống control (3 chốt):**
- Tick tự xoá sau gửi → không có tick lạc tuần sau
- Cảnh báo tick nhầm GV → soát được
- Liệt kê ai chưa nộp → không trốn được

---

## 📋 CÔNG VIỆC CODE (GĐ 1)

| # | Việc | Chi tiết |
|---|------|----------|
| 1 | Hàm "Nâng cấp sheet SOTW" | Tạo tab DS HỌC SINH (nếu thiếu) + cột tick; thêm 2 dòng mẫu BAO_BU nếu thiếu; bảo vệ dòng mẫu; **KHÔNG xoá data** |
| 2 | Nút "4️⃣ 🏆 Gửi SOTW cho Mr. Khôi" | Đọc tick → gom theo GV → cảnh báo → gửi topic → tự xoá tick |
| 3 | Sửa tin nhắc GV | Thêm: "Vào tab DS HỌC SINH tick bé SOTW tuần này" |
| 4 | Sửa gom nhóm | Skip dòng "(DÒNG MẪU)"; onEdit bỏ qua dòng mẫu |
| 5 | Menu mới | 1 Gom nhóm · 2 Xử lý case · 3 Gửi tin GV · 4 🏆 Gửi SOTW · 5 Làm mới tuần mới · (phụ) |

**Sau khi code:** chạy hàm "Nâng cấp sheet SOTW" 1 lần → copy 3 dòng mẫu GV vào tab DS HỌC SINH cho em chạy test → push GitHub.

---

## 📎 PHỤ THUỘC CẦN CHỊ CUNG CẤP
1. **Danh sách học sinh:** tên + lớp + giới tính (Excel/Sheet/dán text đều được)
   → em nhập vào tab DS HỌC SINH
2. (GĐ 0 chị làm tay): khung Canva + folder kho ảnh

## 🗓️ GIAI ĐOẠN SAU
- **GĐ 2:** đọc tên tick + folder Drive kho ảnh → đính kèm ảnh vào tin Telegram
- **GĐ 3 (tuỳ chọn):** nhắc riêng GV chưa tick
