# Sửa lỗi Ca đặc biệt + rút gọn tin Telegram GV — Implementation Plan

> **For Hermes:** Implement one task at a time, preserving live Sheet data and sending no production Telegram message without the manager's deliberate action.

**Goal:** Hết lỗi `Exception: Hàng bắt đầu của dải ô quá nhỏ` khi tạo nhiều Ca đặc biệt; sau khi chốt, mỗi giáo viên chỉ nhận đúng lịch của mình; tin vẫn có ngày, giờ, học sinh và Link Canva từng bé nhưng không đổ toàn bộ nội dung Ghi chú vào Telegram.

**Architecture:** Giữ `BAO_BU → LICH_BU → chốt → gửi GV` và không đổi lịch đã chốt. Bổ sung một lớp bảo vệ cho mọi lệnh tạo dải ô để không gọi Google Sheets với dòng/số dòng không hợp lệ; tách dữ liệu tin Telegram thành phần bắt buộc theo bé và phần tham chiếu Ghi chú trong Sheet. Link Sheet được đưa một lần trong mỗi tin của GV, không lặp dưới từng bé.

**Tech stack:** Google Apps Script (`Code.gs`), Node mock tests (`test_sotw.js`), Google Sheets, Telegram Bot API.

---

## Hiện trạng cần xác minh ở Sheet thật

- Ảnh báo lỗi chỉ cho biết Google Sheets nhận một dải ô bắt đầu từ dòng nhỏ hơn 1; chưa có dòng lỗi trong Nhật ký thực thi nên không được khẳng định bừa vị trí.
- Code hiện có nhiều lệnh `getRange(...)`; các nhánh liên quan trực tiếp là làm mới dropdown Ca xếp, gom lịch tạm, chốt BAO_BU và tạo LICH_BU.
- Tin hiện tại đã chia theo GV cuối ở cột D của `LICH_BU`, nên về nguyên tắc mỗi GV có tin riêng. Cần test với dữ liệu thực để bảo đảm không có GV rỗng/tên sai khiến gửi nhầm nhóm.

## Quy tắc đã chốt

1. Tạo 3 Ca đặc biệt hợp lệ cho `Mr. Ngọc` phải không báo Exception.
2. Ca đặc biệt hợp lệ vẫn đi toàn bộ luồng: BAO_BU → LICH_BU → PH xác nhận → chốt → gửi cho đúng GV dạy.
3. Một GV chỉ nhận ca có đúng tên GV đó tại cột **GV dạy** của `LICH_BU`.
4. Mỗi tin vẫn có: ngày/thứ, giờ, tên học sinh, lớp và Link Canva đúng từng bé.
5. Không chép nội dung đầy đủ cột **Ghi chú** vào Telegram. Tin có một dòng gọn, ví dụ: `📌 Ghi chú ôn bài: xem cột M “Ghi chú” trong LICH_BU: <link Sheet>`.
6. Không gửi link Sheet nhiều lần trong cùng một tin; đặt ở cuối tin của mỗi GV.
7. Không đổi dữ liệu Ghi chú, Link Canva, lịch cũ hoặc mốc đã gửi chỉ vì đổi cách hiển thị tin.

---

### Task 1: Lấy đúng dấu vết lỗi Sheet thật

**Objective:** Xác định chính xác hàm và dòng gây lỗi trước khi sửa.

**Files:**
- Verify: `Code.gs`
- Verify: Apps Script → **Tệp thực thi**

**Steps:**
1. Sau khi lỗi tái hiện, mở **Tệp thực thi** trong Apps Script.
2. Mở dòng lỗi gần nhất, ghi lại tên hàm và số dòng Code.gs.
3. Đối chiếu với các lệnh `getRange` trong nhánh đó.
4. Nếu lỗi nằm ở nhánh dropdown, kiểm số dòng thực tế của BAO_BU/LICH_BU trước khi tính range.

**Acceptance:** Có tên hàm + số dòng thật, không sửa theo suy đoán từ ảnh.

### Task 2: Chặn mọi dải ô không hợp lệ ở luồng Ca đặc biệt

**Objective:** Dù Sheet trống, chỉ có header hoặc có nhiều Ca đặc biệt, không lệnh nào tạo range bắt đầu từ dòng 0/âm.

**Files:**
- Modify: `Code.gs` — các hàm dựng dropdown và/hoặc nhánh được chứng minh ở Task 1
- Modify: `test_sotw.js`

**Steps:**
1. Viết test tái hiện đúng trạng thái Sheet gây lỗi (ít dòng, ba Ca đặc biệt).
2. Thêm helper kiểm tra `row >= 1`, `numRows >= 1`, `numColumns >= 1` trước `getRange` dạng nhiều ô; khi không có vùng hợp lệ thì bỏ qua an toàn.
3. Không dùng `try/catch` để nuốt lỗi rồi báo thành công; popup phải nói rõ nếu có dữ liệu Ca đặc biệt sai cú pháp.
4. Chạy test với 3 Ca đặc biệt đều giao `Mr. Ngọc`.

**Acceptance:** Không có Exception; mỗi dòng Ca đặc biệt vẫn giữ nhãn ĐB trong H và không bị dropdown ca thường ghi đè.

### Task 3: Siết dữ liệu người nhận Telegram theo GV cuối

**Objective:** Không thể gửi ca của GV A vào tin tổng hợp của GV B.

**Files:**
- Modify: `Code.gs:guiTinChoGV()` và hàm dựng nhóm tin
- Modify: `test_sotw.js`

**Steps:**
1. Viết fixture gồm ca của Mr. Ngọc và ít nhất một GV khác.
2. Kiểm nhóm được tạo đúng theo cột D `GV dạy` của `LICH_BU` sau chốt, không dùng GV báo ban đầu.
3. Bỏ qua và báo rõ dòng có tên GV dạy trống; không gửi tin với tên người nhận rỗng.
4. Đảm bảo chỉ các dòng có PH `✅ Đi được` và mốc `GV:` đã chốt mới được đưa vào tin.
5. Giữ quy tắc chỉ đánh dấu `Đã gửi GV lúc` sau Telegram trả thành công cho toàn bộ phần của chính GV đó.

**Acceptance:** Test chứng minh Mr. Ngọc chỉ nhận các ca của Mr. Ngọc; GV khác nhận tin tách riêng.

### Task 4: Rút gọn phần Ghi chú trong tin GV

**Objective:** Tin Telegram gọn mà giáo viên vẫn biết nơi xem hướng dẫn ôn bài chính xác.

**Files:**
- Modify: `Code.gs:taoNoiDungTinGV()`
- Modify: `test_sotw.js`
- Modify: `README.md`

**Steps:**
1. Giữ từng dòng học sinh, lớp và `Slide: <Link Canva>` như hiện có.
2. Bỏ `Ghi chú: <toàn bộ nội dung>` dưới từng bé.
3. Thêm cuối tin một chỉ dẫn cố định: tên tab `LICH_BU`, cột M `Ghi chú`, cùng link Sheet do anh cung cấp.
4. Nếu một bé thiếu Link Canva, vẫn cảnh báo đúng bé. Việc Ghi chú trống không còn làm tin dài hoặc lộ nội dung; giáo viên xem trực tiếp trong Sheet.
5. Nếu cần phân biệt note theo bé, tin ghi tên bé/lớp; Sheet là nguồn đầy đủ duy nhất cho phần Ghi chú.

**Acceptance:** Tin có ngày/giờ/bé/Canva đầy đủ, không chứa đoạn Ghi chú dài, link Sheet xuất hiện đúng một lần.

### Task 5: Kiểm thử, cập nhật và nghiệm thu thật

**Files:**
- Modify: `test_sotw.js`, `README.md`, `task.md`
- Verify: Apps Script / Sheet / Telegram Topic Dạy Bù

**Steps:**
1. Chạy `node test_sotw.js`.
2. Kiểm cú pháp: `cp Code.gs /tmp/joy_day_bu_Code.js && node --check /tmp/joy_day_bu_Code.js`.
3. Chạy `git diff --check`.
4. Đẩy GitHub; dùng file **CAP_NHAT_DAY_BU.cmd** trên máy Windows để đưa Code mới vào Apps Script.
5. Trong Sheet thật, tạo 3 Ca đặc biệt giao Mr. Ngọc và chạy đúng thao tác từng gây lỗi.
6. Chỉ sau khi có một ca test đã chốt, bấm gửi và kiểm Topic Dạy Bù: Mr. Ngọc nhận đúng tin, GV khác không nhận ca đó, tin có link Canva và link Sheet/Ghi chú gọn.

**Acceptance:** Ảnh/chụp thực tế hoặc bản tin Telegram xác nhận cả 3 điều: không Exception, đúng người nhận, Ghi chú rút gọn.

## Rủi ro và an toàn

- Không chạy “Tạo sheet mới”; thao tác này có thể xóa dữ liệu đang dùng.
- Không dùng dữ liệu thật chưa chốt để thử gửi vì có thể làm giáo viên nhận thông báo không cần thiết.
- Khi Code.gs thay đổi, GitHub push chưa làm Sheet đổi ngay: phải chạy file cập nhật trên Windows, sau đó tải lại Google Sheet bằng `Ctrl + Shift + R`.
- Không kết luận lỗi đã hết trước khi tái hiện ba Ca đặc biệt trên Sheet thật.
