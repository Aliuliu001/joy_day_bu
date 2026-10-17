# PLAN SOTW v2 — "CLICK & TICK THUẦN" + GỘP VÀO GOM NHÓM
Chốt thảo luận 14/10/2026

---

## 📌 Ý TƯỞNG MỚI CỦA CHỊ (tổng hợp)

1. Chị cung cấp: **link từng file ảnh** + **danh sách tổng HS đang học**
2. **Cột 10 (J) của BAO_BU = SOTW** → trỏ tới file danh sách
3. GV: **lọc lớp mình → tick bé SOTW → chọn giới tính** — chỉ click & tick, không gõ gì
4. **Bấm "Gom nhóm" chạy luôn bước SOTW** (1 nút làm 2 việc)

**→ ĐÁNH GIÁ: KHẢ QUAN ✅** — với 5 điểm chốt em bổ sung cho chắc (dưới đây)

---

## 🎯 HÌNH DUNG TOÀN BỘ UX (fresh idea)

### Bước 1 — Chị cung cấp 1 lần (nhập liệu gốc):
File danh sách tổng, mỗi dòng gồm:
**Tên bé | Lớp | Giới tính | Link ảnh**
→ Em nhập vào tab **"DS HỌC SINH"** (1 lần, xong là chạy mãi)

### Bước 2 — GV mỗi tuần (chỉ click & tick):
```
1. Mở tab BAO_BU → thấy ô SOTW (cột J) của dòng mình
   → bấm vào là mở sẵn tab DS HỌC SINH  (trỏ tới sẵn, khỏi tìm)

2. Trong DS HỌC SINH:
   → Chọn lớp mình ở ô dropdown "Lớp cần chọn" (1 click)
      → các dòng lớp mình SÁNG lên, lớp khác mờ đi (không phải lọc tay)

   → Tick ☑ các bạn SOTW (click)
   → (Những bé thiếu giới tính → bấm chọn Nam/Nữ ở dropdown — click, không gõ)
```

### Bước 3 — T2 bấm "1️⃣ Gom nhóm" → chạy GỘP:
```
PHẦN A — Xếp lịch (như hiện tại)
PHẦN B — SOTW chạy kèm:
   1. Đọc tick → gom theo GV chính
   2. Gửi topic Học Bù:
      🏆 [SOTW TUẦN ...]
      👨‍🏫 Mr. Ngọc:
      • Cashew: Ngô Bảo Hân (link ảnh) , Lê Quốc Thiên Bảo (link ảnh)
      ⚠️ Chưa nộp: Ms. Trâm...
   3. Tự xoá tick + đóng mốc "ĐÃ GỬI TUẦN NÀY"
```

---

## 🔧 5 ĐIỂM CHỐT EM BỔ SUNG (để ý tưởng chắc chắn)

### ✅ CHỐT 1: Danh sách nằm CÙNG file Sheet, không phải file riêng
Chị nói "trỏ tới 1 file danh sách" → em đề xuất: đặt trong **cùng Sheet DẠY BÙ** (tab DS HỌC SINH), cột J trỏ tới tab đó.
**Lý do:** file riêng → link dễ vỡ, GV cần quyền mở, code đọc tick bên kia file phức tạp + hay lỗi. Cùng file → 1 click là nhảy tới, không lỗi quyền.

### ✅ CHỐT 2: Giới tính = nhập 1 LẦN khi tạo danh sách, không phải GV chọn mỗi tuần
Giới tính là cố định của bé → nhập sẵn trong danh sách gốc (chị có sẵn thì nhập luôn).
GV **chỉ tick SOTW**, không đụng tới giới tính (trừ bé thiếu → chọn bằng dropdown, vẫn click).
→ Ít thao tác hơn ý gốc của chị, mà dữ liệu vẫn đủ cho viền khung Canva.

### ✅ CHỐT 3: "Lọc lớp" = chọn lớp ở dropdown → tự SÁNG màu (không cần kỹ năng lọc)
Thay vì GV phải biết bấm Data → Filter → chọn lớp (dễ sai với người không rành):
- Ô dropdown "Lớp cần chọn" trên cùng → GV chọn lớp mình (1 click)
- Conditional formatting: dòng lớp mình **sáng**, lớp khác **mờ**
- GV chỉ việc tick dòng sáng → không tick nhầm lớp khác (giảm hẳn cảnh báo nhầm)

### ✅ CHỐT 4: CHỐNG GỬI TRÙNG khi Gom nhóm chạy lại
Gom nhóm có thể bấm lại nhiều lần trong tuần (sửa lịch → gom lại).
Nếu mỗi lần chạy đều gửi + xoá tick → **tick mất trước khi kịp gửi lần 2? hoặc gửi trùng**.
**Giải pháp:** đóng mốc trong 1 ô: "SOTW đã gửi: 14/10"
- Lần chạy đầu tuần → gửi SOTW + xoá tick + ghi mốc
- Các lần gom lại sau → **bỏ qua phần SOTW** (đã gửi rồi), chỉ chạy xếp lịch
- Chị muốn gửi lại → bấm nút riêng "🏆 Gửi SOTW" (giữ nút riêng làm dự phòng, hỏi trước khi gửi lại)

### ✅ CHỐT 5: Link ảnh lấy từ danh sách chị cung cấp (GĐ 2 làm luôn, không cần đặt tên file)
Vì chị có **link từng file ảnh** → code ghép tên tick với danh sách → **tin nhắn gửi kèm link ảnh từng bé**.
→ Không cần cách "tên file = tên bé" trong Drive nữa (bỏ qua ý cũ, đơn giản hơn).
- Nếu link ảnh publicly mở được → nâng cấp sau: **đính kèm ảnh thật vào tin** (không chỉ link)

---

## 📋 CÔNG VIỆC CODE (GĐ 1)

| # | Việc | Ghi chú |
|---|------|---------|
| 1 | Hàm "Nâng cấp sheet SOTW" | Tạo tab DS HỌC SINH (Tên/Lớp/GV chính/Giới tính/Link ảnh/Tick); ô dropdown chọn lớp + tô sáng; **nhập data chị cung cấp**; không xoá gì |
| 2 | Cột J BAO_BU "SOTW" | Tạo tiêu đề + hyperlink nhảy tới tab DS HỌC SINH |
| 3 | 2 dòng mẫu BAO_BU | case "Không bù" + case "vắng" — bảo vệ + bỏ qua khi gom nhóm |
| 4 | Gộp nút "1️⃣ Gom nhóm" | + phần SOTW: gửi → xoá tick → đóng mốc "đã gửi tuần này" |
| 5 | Nút "🏆 Gửi SOTW" (dự phòng) | Gửi lại có hỏi xác nhận (khi chị quên/lỗi) |
| 6 | Sửa tin nhắc GV | "Vào DS HỌC SINH, chọn lớp, tick bé SOTW" |

---

## 📎 CẦN CHỊ CUNG CẤP (1 lần)
1. **Danh sách tổng HS:** Tên | Lớp | Giới tính (nếu có) | Link ảnh
   → dán text / Excel / Sheet link đều được
2. Xác nhận 5 chốt trên (hoặc điều chỉnh)

## 🗓️ SAU GĐ 1
- **GĐ 2:** link ảnh mở được → code đính kèm ảnh thật vào tin Telegram
- **GĐ 3:** nhắc riêng GV chưa tick (nút riêng)
