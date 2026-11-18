# Sửa lỗi Exception khi chốt Ca đặc biệt — Implementation Plan

> **For Hermes:** Implement one task at a time. Không xóa/sửa lịch đã chốt, không gửi Telegram thật khi chưa có thao tác gửi chủ động của quản lý.

**Goal:** Sửa dứt điểm lỗi `Exception: Hàng bắt đầu của dải ô quá nhỏ` khi anh dùng **Ca đặc biệt** để đổi lịch riêng sau Gom nhóm.

**Architecture:** Giữ nguyên cách dùng hiện tại: ca thường chọn từ `CÀI ĐẶT CA DẠY BÙ`; khi cần đổi lịch riêng, anh vẫn dùng cột **Ca đặc biệt**. Không thêm cột nào vào `BAO_BU`, không đổi quy trình quen dùng. Sửa đúng chỗ tạo dải ô động để Google Sheets không bao giờ nhận dòng bắt đầu/số dòng không hợp lệ.

**Tech stack:** Google Apps Script (`Code.gs`), Node mock test (`test_sotw.js`), Google Sheets.

---

## Quy tắc đã chốt

1. **Không thêm 3 cột** Thứ đổi / Giờ đổi / GV đổi; giữ bảng BAO_BU gọn như hiện nay.
2. Ca thường vẫn chỉ chọn các ca **ON** trong `CÀI ĐẶT CA DẠY BÙ`.
3. Khi cần đổi lịch riêng, anh vẫn nhập cột **Ca đặc biệt** theo mẫu hiện có; máy tự đưa đúng ca đó qua luồng Gom nhóm → Chốt → LICH_BU.
4. Tạo/chốt đồng thời 3 Ca đặc biệt hợp lệ không được báo lỗi Exception.
5. Không sửa dữ liệu lịch cũ, không thêm/xóa ca trong Cài đặt, không tự gửi Telegram để thử.

---

## Task 1 — Lấy chính xác dòng lỗi trên Sheet thật

**Objective:** Biết đúng hàm và số dòng gây lỗi trước khi sửa.

**Files:**
- Verify: Apps Script → **Tệp thực thi**
- Verify: `Code.gs`

**Steps:**
1. Sau khi lỗi hiện lại, mở Apps Script của Sheet.
2. Bấm biểu tượng **Tệp thực thi** ở thanh bên trái.
3. Mở dòng lỗi mới nhất có chữ `Hàng bắt đầu của dải ô quá nhỏ`.
4. Chụp hoặc ghi đúng **tên hàm** và **số dòng Code.gs**.
5. Đối chiếu lệnh `getRange(...)` tại dòng đó; không suy đoán chỉ từ ảnh popup.

**Acceptance:** Có đúng vị trí lỗi thật để sửa, không sửa lan sang các luồng không liên quan.

## Task 2 — Chặn range không hợp lệ tại đúng nhánh lỗi

**Objective:** Dù BAO_BU/LICH_BU chỉ có header, có dòng mẫu, hoặc có ba Ca đặc biệt, code không gọi Google Sheets bằng dải ô bắt đầu từ dòng 0/âm hay có số dòng 0/âm.

**Files:**
- Modify: `Code.gs` — đúng hàm được Task 1 xác nhận
- Modify: `test_sotw.js`

**Steps:**
1. Viết test tái hiện đúng trạng thái gây lỗi: Gom nhóm và chốt tối thiểu 3 dòng có Ca đặc biệt.
2. Trước mỗi `getRange` tính động trong nhánh lỗi, kiểm tra:
   - dòng bắt đầu từ 1 trở lên;
   - số dòng ít nhất là 1;
   - số cột ít nhất là 1.
3. Nếu thực sự không có vùng để ghi/đọc, bỏ qua an toàn hoặc báo rõ dữ liệu dòng nào thiếu; không nuốt lỗi bằng `try/catch` rồi báo thành công.
4. Bảo đảm việc gỡ/tạo dropdown ca thường không ghi đè nhãn Ca đặc biệt ở cột H.

**Acceptance:** Test tự động chứng minh ba Ca đặc biệt không phát sinh Exception; cú pháp sai vẫn báo rõ dòng cần sửa.

## Task 3 — Kiểm luồng chốt Ca đặc biệt đến LICH_BU

**Objective:** Sau khi đã hết Exception, ca riêng vẫn mang đúng Thứ, Giờ, GV và Ngày học cuối cùng.

**Files:**
- Modify: `Code.gs` nếu test phát hiện sai
- Modify: `test_sotw.js`

**Steps:**
1. Test ba dòng Ca đặc biệt có thể khác giờ/GV.
2. Chạy Gom nhóm → Chốt BAO_BU.
3. Kiểm đúng các cột Ca, Thứ, Giờ, GV dạy, Ngày học và Ca xếp trong `LICH_BU`.
4. Kiểm ca đặc biệt hợp lệ được miễn validation ca thường, nhưng ca thường vẫn chỉ nhìn thấy ca ON.
5. Giữ cảnh báo trùng giờ/quá tải hiện có trước khi chốt.

**Acceptance:** Cả ba dòng chốt đúng vào LICH_BU, không mất/nhầm lịch và không ảnh hưởng ca thường.

## Task 4 — Kiểm thật trên Sheet trước khi đóng việc

**Steps:**
1. Chạy toàn bộ `node test_sotw.js`.
2. Kiểm cú pháp `Code.gs` và `git diff --check`.
3. Push GitHub.
4. Trên Windows, chạy `CAP_NHAT_DAY_BU.cmd` để đưa code mới vào Apps Script.
5. Refresh Google Sheet bằng `Ctrl + Shift + R`.
6. Anh tạo lại 3 Ca đặc biệt đúng cú pháp từng gây lỗi, bấm Gom nhóm và Chốt BAO_BU.
7. Kiểm không còn popup Exception, đồng thời 3 dòng xuất hiện đúng trong LICH_BU.

**Acceptance:** Chỉ báo hoàn thành khi Sheet thật chạy qua ba ca mà không lỗi.

---

## Không làm trong đợt này

- Không thêm cột mới vào BAO_BU.
- Không thay đổi cách anh đang nhập Ca đặc biệt.
- Không biến Ca đặc biệt thành ca chuẩn trong tab Cài đặt.
- Không gửi Telegram thật để test lỗi này.
