# PLAN HỆ THỐNG HOÁ — JOY DẠY BÙ
17/10/2026 — Review hiện trạng + đề xuất (chờ anh duyệt rồi mới code)

---

## 1️⃣ TRẢ LỜI CÂU GIỚI TÍNH

**Anh không cần chia sẵn nam/nữ trong danh sách!** ✅

- Code đã thiết kế: cột **Giới tính để TRỐNG được** — tin SOTW chỉ hiện "(Nam)/(Nữ)" khi có dữ liệu, **tự bỏ qua khi trống**
- Danh sách anh có sẵn (HS + lớp + GV) → **dán thẳng vào là chạy**, không thiếu gì
- Nếu sau này muốn viền khung Canva theo giới tính → chỉ cần điền giới tính sau cho **vài bé được SOTW** (mỗi tuần chỉ 1-2 bé), không cần cả danh sách

**→ Kết luận: bỏ yêu cầu giới tính khỏi bước chuẩn bị. Không việc gì phải làm thêm.**

---

## 2️⃣ REVIEW HIỆN TRẠNG — VÌ SAO "RỜI RẠC, NHIỀU THAO TÁC"

### Thực tế sau 2 ngày (anh đi về thấy ngay):
| Thứ | Hiện tại | Vấn đề |
|-----|----------|--------|
| **Menu** | **11 nút** phẳng 1 hàng | Nút 1 lần dùng (Tạo sheet, Cài trigger, Nâng cấp) chen giữa nút dùng hàng tuần → loạn |
| **Tab** | 6 tab: BAO_BU, LICH_BU, LOP, DS HỌC SINH, Backup tháng, THỐNG KÊ | Tab LOP chỉ để tham khảo (code tự có bảng GV), không cần hiện |
| **Thao tác tuần** | Rải ra: Nhắc GV (1 nút) → Gom (1 nút) → Xử lý case (1 nút) → Gửi tin GV (1 nút) → Backup (1 nút) → Làm mới (1 nút) | 6 nút cho 1 chu kỳ tuần, trong đó backup + làm mới lẽ ra là **1 bước** |
| **Docs repo** | 12 file md (AUDIT, TASKS, 4 bản PLAN, 3 file phân tích...) | Đúng là "vá đi vá lại" — anh mở ra không biết đọc file nào |
| **Code** | 42 hàm, đã test 85 assertion PASS | Logic ổn — **KHÔNG nên viết lại từ đầu** (mất công đã test) |

### Đánh giá: phần logic OK, phần **giao diện + quy trình thao tác** mới cần hệ thống.

---

## 3️⃣ ĐỀ XUẤT HỆ THỐNG LẠI

### A. MENU: 11 nút phẳng → 4 nút chính + 3 menu con

```
📚 Dạy Bù
├─ 1️⃣ Gom nhóm + gửi SOTW (T2 chiều)      ← nút chính
├─ 2️⃣ Xử lý Xin đổi / Quá hạn (T4)        ← nút chính
├─ 3️⃣ Gửi tin cho GV (T5-T6)              ← nút chính
├─ 4️⃣ Làm mới tuần mới (cuối tuần)        ← nút chính
├─ ────────────────
├─ 🔁 Gửi / Nhắc lẻ          ▸ submenu
│    ├─ 🏆 Gửi lại SOTW (hỏi trước)
│    ├─ 🔔 Nhắc GV báo bù (T2 sáng)
│    └─ 💾 Backup thủ công (nếu cần xem trước)
├─ 📊 Báo cáo                 ▸ submenu
│    └─ 📊 Làm mới thống kê
└─ ⚙️ Cài đặt (chạy 1 lần)    ▸ submenu
     ├─ 🔨 Tạo sheet mới (xoá data!)
     ├─ 🔧 Nâng cấp sheet SOTW (+ tự cài backup T7)
     └─ 🗜️ Ẩn/ hiện tab LOP (tuỳ chọn)
```
→ Mở menu ra: **4 nút đúng workflow tuần** — nhìn là biết bấm gì, ở đâu cũng gom hết vào menu con.

### B. GỘP BƯỚC CUỐI TUẦN: Backup + Làm mới = 1 nút
- Bấm **"4️⃣ Làm mới tuần mới"** → hỏi xác nhận →
  1. **Tự backup trước** (nếu tuần này chưa backup — nếu đã backup rồi thì bỏ qua, không trùng)
  2. Rồi mới clear BAO_BU + LICH_BU + tick SOTW
- → Bỏ được 1 thao tác rời, mà **an toàn hơn**: không còn cảnh "clear mà quên backup"
- Nút 💾 Backup thủ công chỉ còn trong menu con (dùng khi muốn xem backup giữa tuần)

### C. GỘP CÀI ĐẶT: "Nâng cấp sheet" tự cài backup tự động
- Chạy **🔧 Nâng cấp sheet SOTW** → hỏi 1 lần "Cài luôn backup tự động tối T7?" → cài luôn
- → Bỏ nút ⚙️ Cài trigger ra khỏi luồng chính (nút chỉ chạy 1 lần trong đời)

### D. DOCS: 12 file → 1 file README.md
- **Gộp hết** hướng dẫn vào README.md duy nhất (tiếng Việt, cho người không rành):
  Workflow tuần 5 bước → hướng dẫn từng nút → cách nhập danh sách HS → xử lý lỗi thường gặp
- 11 file plan/audit cũ → chuyển vào thư mục `docs/` (lưu vết, không xoá — git vẫn giữ)

### E. TAB: ẩn tab LOP
- Tab LOP chỉ là bảng tham khảo (code đã có sẵn bảng GV trong file) → **Ẩn đi** (hiện lại được khi cần)
- → GV mở sheet ra thấy đúng 4 tab làm việc: **BAO_BU · LICH_BU · DS HỌC SINH · (Backup)**

### F. GIỮ NGUYÊN (đừng đụng)
- Logic đã test 85/85: gom nhóm, SOTW tick-gửi-giữ, case đặc biệt, backup chống trùng, làm mới tuần
- Cách nhập của GV: gõ vào BAO_BU + tick vào DS HỌC SINH (đã duyệt)
- Trigger backup T7 (chỉ lái qua menu con)

---

## 4️⃣ PLAN THỰC HIỆN (5 task, làm 1 lần, test sau mỗi task)

| # | Task | Thay đổi | Test |
|---|------|----------|------|
| 1 | **Thu gọn menu** → 4 nút chính + 3 submenu | `onOpen()` | Test menu không lỗi; đủ tên hàm |
| 2 | **Gộp backup vào "Làm mới tuần mới"** (auto-backup nếu chưa) | `lamMoiTuanMoi()` | Test: chưa backup → tự backup rồi clear; đã backup → không trùng; chưa backup mà lỗi → KHÔNG clear (an toàn) |
| 3 | **Nâng cấp sheet tự cài trigger T7** (hỏi 1 lần) | `nangCapSheetSotw()` | Test: trigger được tạo |
| 4 | **Ẩn tab LOP** + sắp lại thứ tự tab | `nangCapSheetSotw()` | Test: LOP bị ẩn |
| 5 | **Dọn docs** → README.md gộp + chuyển plan cũ vào docs/ | README | — |

- Sau 5 task → chạy lại bộ test cũ (85) + test mới → **push GitHub 1 lần cuối**
- Ước lượng: mỗi task nhỏ, làm xong test → anh chỉ cần copy 1 lần cuối vào Apps Script

---

## ❓ ANH DUYỆT

- [ ] **A.** Menu 11 nút → 4 nút chính + 3 menu con (như mẫu trên)?
- [ ] **B.** Gộp backup vào "Làm mới tuần mới" (tự backup trước khi xoá)?
- [ ] **C, D, E.** Nâng cấp tự cài trigger / gộp docs vào README / ẩn tab LOP?
- [ ] **F.** Phần logic giữ nguyên, không viết lại?

**→ Anh gõ "OK làm hết" (hoặc bỏ mục nào) là em tiến hành.**
