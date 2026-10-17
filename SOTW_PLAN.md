# PLAN SOTW — BẢN ĐÃ CHẠP (14/10/2026)
Đã incorporates quyết định của chị Ngọc

---

## ✅ QUYẾT ĐỊNH CỦA CHỊ

1. **SOTW nhập ngay trong BAO_BU** — thêm cột "SOTW" sau cột "Ghi chú" (cột J)
   - GV báo bù bao nhiêu dòng tuỳ, nhưng SOTW chỉ cần điền vào **1 trong các dòng của GV đó**
2. **BAO_BU luôn có sẵn 2 dòng mẫu** — GV nhìn là hiểu cách điền
3. **Tin SOTW gửi topic Học Bù hiện tại** (gửi chung, gọn)

---

## 📋 PHẦN 1: CỘT SOTW + 2 DÒNG MẪU

### 1.1 Cột mới trong BAO_BU
```
A: Ngày báo | B: GV báo | C: Tên bé | D: Lớp | E: Trình độ | F: Link Canva 
| G: Trạng thái | H: Ca xếp | I: Ghi chú | J: SOTW  ← MỚI
```
- GV gõ gộp cả tuần vào ô J (1 trong các dòng của mình), Enter xuống dòng được
- Cùng 1 GV có nhiều dòng → chỉ cần điền 1 lần

### 1.2 Hai dòng mẫu LUÔN CÓ SẴN (dòng 2 & 3)
**Dòng mẫu 1 — case "không vắng":**
| Ngày báo | GV báo | Tên bé | Lớp | ... | Ghi chú |
|----------|--------|--------|-----|-----|---------|
| (trống) | Mr. Ngọc | Không bù | Lenovo | | (DÒNG MẪU) Lớp đi đủ → gõ "Không bù" ở cột Tên bé |

**Dòng mẫu 2 — case "có vắng":**
| Ngày báo | GV báo | Tên bé | Lớp | Trình độ | ... | Ghi chú |
|----------|--------|--------|-----|----------|-----|---------|
| (trống) | Mr. Ngọc | Iphone | Galaxy | SP1 | | (DÒNG MẪU) Vắng bạn Iphone → ghi tên bé nghỉ, cột SOTW gõ gộp cả tuần vào ô này |

→ GV nhìn 2 dòng là hiểu ngay: đi đủ gõ "Không bù", vắng ghi tên bé.

### 1.3 Bảo vệ 2 dòng mẫu (KHÔNG cho GV sửa)
- Dùng **protect range** cho dòng 2-3 → chỉ quản lý (3 email EMAIL_QUAN_LY) sửa được
- Hàng mẫu tô màu xám nhạt + chữ italic để一眼 nhận ra

### 1.4 Không xếp lịch cho dòng mẫu
- Đánh dấu nhận diện bằng cột Ghi chú chứa **"(DÒNG MẪU)"**
- `gomNhom()` skip mọi dòng có "(DÒNG MẪU)" (thay vì check "ghi chú mẫu" như cũ — chắc chắn hơn)
- `onEdit` không tự gõ ngày vào dòng mẫu

### 1.5 Cập nhật nút "Nhắc GV báo bù"
Thêm hướng dẫn vào tin nhắc:
```
📌 Và điền SOTW tuần này vào cột SOTW (gộp hết các lớp, 1 ô là được)
```

---

## 📤 PHẦN 2: NÚT "🏆 GỬI SOTW CHO MR. KHOI"

1. Đọc cột SOTW trong BAO_BU — gom theo GV (GV điền ở dòng nào cũng được, lấy dòng có nội dung)
2. Format gửi topic Học Bù:
```
🏆 [SOTW TUẦN 13/10 - 19/10]

👨‍🏫 Mr. Ngọc:
• Cashew: Ngô Bảo Hân, Lê Quốc Thiên Bảo
• Pumpkin Seed: Cao Nguyễn Bảo Nghi, Trần Kiên

⚠️ Chưa nộp SOTW: Ms. Trâm, Ms. Nhung
```
3. GV chưa nộp → hiện trong tin nhắc cuối

**Thứ tự menu mới:**
```
1️⃣ Gom nhóm (T2 chiều)
2️⃣ Xử lý case đặc biệt (T4)
3️⃣ Gửi tin cho GV (T5-T6)
4️⃣ 🏆 Gửi SOTW cho Mr. Khôi    ← MỚI
5️⃣ Làm mới tuần mới (tuần sau)
... (phụ)
```

---

## 📸 PHẦN 3: TỐI ƯU VIỆC TÌM ẢNH CỦA MR. KHOI (fresh ideas)

### Hiện tại (thủ công):
Mr. Khôi mở slide nguồn trong Canva → dò tên từng bé → tìm ảnh → copy vào frame báo SOTW.
→ Nhớ nhiều, dễ sai, mất thời gian.

### ⭐ Ý TƯỞNG A (em khuyên): "ẢNH TỰ BAY VÀO TIN NHẮN"
**Cách làm:**
1. Chị tạo **1 folder Drive** tên: `ẢNH HỌC SINH SOTW`
2. Mỗi bé 1 file ảnh, **tên file = họ tên bé**: `Ngô Bảo Hân.jpg`, `Trần Kiên.png`...
   (Ảnh lấy 1 lần từ slide Canva hiện tại — làm 1 lần là xong)
3. Khi bấm nút "🏆 Gửi SOTW", code:
   - Đọc danh sách tên từ cột SOTW
   - So tên với file trong Drive (**so linh hoạt**: bỏ dấu, viết thường → "Noi Bao Han" vẫn khớp "Ngô Bảo Hân")
   - **Đính kèm ảnh ngay vào tin Telegram** gửi topic Học Bù
4. Mr. Khôi nhận tin **đã kèm ảnh sẵn** → bấm giữ ảnh → lưu → dán vào frame Canva.
   **KHÔNG CÒN MỞ CANVA TÌM SLIDE!**

**Bé chưa có ảnh** → hiện trong tin:
```
⚠️ Chưa có ảnh: Trần Kiên (chị bổ sung vào folder Drive nhé)
```

**Ưu điểm:** Hết hẳn công đoạn tìm ảnh; bé mới = bỏ ảnh vào folder là xong.

### 💡 Ý TƯỞNG B (phương án phụ): "BẢNG LINK NHẢY ĐÚN CHỖ"
- Tab mới "ẢNH SOTW": Tên bé | Link ảnh (Drive hoặc Canva)
- Code ghép tên → gửi kèm **link ảnh từng bé**
- Mr. Khôi bấm link → mở thẳng ảnh, không dò tìm
- Nhược: vẫn phải tải về tay, nhiều thao tác hơn A

### 💡 Ý TƯỞNG C (không khuyến nghị): Giữ Canva, mỗi bé 1 trang riêng
- Tách slide nguồn → mỗi bé 1 trang riêng để link tới trang đó
- Nhược: Canva không ổn định khi link tới đúng 1 trang → dễ trỏ sai

### 🎯 GÓP Ý CUỐI:
- **Nguồn ảnh gốc** = Folder Drive (Ý tưởng A) — máy tự tìm, tự đính kèm
- **Khung báo cáo SOTW cuối** = vẫn giữ Canva như hiện tại (Mr. Khôi ghép vào frame)

---

## 🗓️ TRIỂN KHAI

### Giai đoạn 1 — Làm ngay (tuần này dùng được)
1. Thêm cột SOTW vào BAO_BU (không xoá data — dùng hàm "Nâng cấp sheet")
2. Thêm 2 dòng mẫu + bảo vệ dòng mẫu
3. Sửa logic gom nhóm: skip dòng mẫu (dấu hiệu "(DÒNG MẪU)")
4. Nút "🏆 Gửi SOTW cho Mr. Khôi" (gửi text vào topic Học Bù)
5. Sửa tin nhắc GV báo bù (thêm hướng dẫn SOTW)

### Giai đoạn 2 — Ảnh tự động (khi chị gom ảnh xong)
6. Chị tạo folder Drive + đặt tên file = tên bé
7. Code tự tìm ảnh + đính kèm vào tin SOTW
8. List "chưa có ảnh" để chị bổ sung

### Giai đoạn 3 — Tuỳ chọn
9. Nút nhắc riêng "GV chưa nộp SOTW"
10. Bảng link ảnh dự phòng

---

## ⚙️ LƯU Ý KỸ THUẬT (em tự lo)
- **KHÔNG chạy setupDayBu** (vì nó xoá sheet) → viết hàm "Nâng cấp sheet SOTW": thêm cột J, thêm dòng mẫu nếu thiếu, gắn bảo vệ
- Tự kiểm: nếu cột J đã có rồi → bỏ qua, không chạy lại
- Bảo vệ dòng mẫu chỉ thay range 2 dòng, không đè bảo vệ cũ
