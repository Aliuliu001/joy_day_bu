# SOTW — Gom danh sách theo giáo viên Implementation Plan

> **For Hermes:** Implement one task at a time. Không gửi Telegram thật trong lúc kiểm thử; chỉ gửi bằng nút gửi thử hoặc thao tác chủ động của quản lý.

**Goal:** Mỗi giáo viên chỉ có một khối SOTW. Trong khối đó, các bé cùng lớp nằm liên tiếp; khi chuyển sang lớp khác chỉ chèn một dòng tên lớp để phân biệt, không lặp lại tiêu đề/cột lớp cho từng bé.

**Architecture:** Giữ nguyên nguồn dữ liệu tab `DS HỌC SINH` và các quy tắc hiện có: đọc bé được tick, sắp xếp ABC, bấm được link Drive, tự chia tin khi dài, cảnh báo bé thiếu ảnh và chống gửi trùng. Chỉ thay hàm dựng nội dung Telegram `taoCacPhanSotw()` để nhóm theo **GV trước**, sau đó theo **Lớp** bên trong mỗi GV.

**Tech stack:** Google Apps Script (`Code.gs`), Node mock tests (`test_sotw.js`), Telegram Bot API.

---

## Mẫu hiển thị cần đạt

```text
🏆 [Tuần dd/MM - dd/MM]
📩 Phần 1/1 — SOTW (1–3/3 bé)

Ms. Vân
C2.002 - Chestnut
Tên bé | Giới tính | Ảnh
23. Nguyễn Võ Như Ý | Nữ | 🖼️ Mở ảnh
24. Trương Tuấn Kiệt | Nam | 🖼️ Mở ảnh

C3.001 - Peanut
26. Nguyễn Thiên Long | Nam | 🖼️ Mở ảnh
```

## Quy tắc đã chốt

1. Một giáo viên chỉ có **một tiêu đề tên giáo viên**, dù có học sinh từ nhiều lớp.
2. Lớp đầu tiên xuất hiện ngay dưới tên giáo viên; đổi sang lớp khác thì chỉ chèn một dòng `Mã lớp - Tên lớp` trước nhóm bé của lớp đó.
3. Tiêu đề `Tên bé | Giới tính | Ảnh` xuất hiện **một lần cho mỗi giáo viên**, không lặp lại khi đổi lớp.
4. Mỗi bé chỉ hiển thị tên, giới tính và ảnh. Tên lớp không lặp ở từng dòng bé vì dòng phân nhóm lớp đã đủ phân biệt.
5. Vẫn đánh số liên tục toàn danh sách như hiện nay, không reset số khi đổi GV/lớp/phần tin.
6. Link ảnh vẫn là chữ bấm `🖼️ Mở ảnh`; bé chưa có ảnh vẫn hiện `Chưa có ảnh` và vẫn được liệt kê ở cảnh báo cuối.
7. Tin vượt giới hạn Telegram vẫn tự tách `Phần X/Y`, nhưng không được cắt giữa tên giáo viên, dòng lớp, tiêu đề cột và dòng của một bé.
8. Không đổi tick SOTW, dữ liệu DS HỌC SINH, nơi nhận topic, hoặc mốc chống gửi trùng.

---

### Task 1: Viết test đỏ cho cách gom mới

**Objective:** Khóa đúng cách hiển thị trước khi sửa hàm dựng tin.

**Files:**
- Modify: `test_sotw.js`
- Verify: `Code.gs:taoCacPhanSotw()`

**Steps:**
1. Bổ sung dữ liệu mẫu gồm ít nhất:
   - 2 bé cùng `Ms. Vân` / `C2.002 - Chestnut`;
   - 1 bé cùng `Ms. Vân` / `C3.001 - Peanut`;
   - 1 bé của giáo viên khác để chứng minh giáo viên tách khối.
2. Viết kiểm tra rằng tin chỉ có một lần `Ms. Vân` và một lần tiêu đề `Tên bé | Giới tính | Ảnh` trong khối của cô.
3. Kiểm tra tên hai lớp xuất hiện theo từng nhóm, nhưng `C2.002 - Chestnut` và `C3.001 - Peanut` không bị lặp vào mỗi dòng bé.
4. Kiểm tra thứ tự vẫn là giáo viên ABC → lớp ABC → tên bé ABC.
5. Chạy `node test_sotw.js` để xác nhận test mới FAIL với format cũ (format cũ lặp `GV - Lớp` và tiêu đề cột cho từng lớp).

**Acceptance:** Test chứng minh chính xác lỗi hiển thị cần sửa, không chỉ kiểm nội dung có xuất hiện.

### Task 2: Đổi bộ dựng tin thành GV → lớp → bé

**Objective:** Tạo đúng một khối cho mỗi giáo viên và các ngăn lớp ở bên trong.

**Files:**
- Modify: `Code.gs:taoCacPhanSotw()`
- Test: `test_sotw.js`

**Steps:**
1. Giữ cấu trúc gom dữ liệu `GV → Lớp → danh sách bé` hiện có; không thay đổi `docTickSotw()` và không thêm cột Sheet.
2. Khi bắt đầu một GV mới, ghi lần lượt: tên GV, tiêu đề cột `Tên bé | Giới tính | Ảnh`, rồi lớp đầu tiên.
3. Khi vẫn cùng GV nhưng sang lớp mới, chỉ ghi dòng lớp mới; không in lại tên GV hoặc tiêu đề cột.
4. Mỗi dòng bé chỉ gồm số thứ tự, tên bé, giới tính, link ảnh/`Chưa có ảnh`.
5. Giữ thoát HTML cho tên/lớp/giới tính/link như hiện tại để dữ liệu Sheet không làm hỏng định dạng Telegram.

**Acceptance:** Nội dung xem trước đúng mẫu đã chốt: gọn theo từng GV, đổi lớp có nhãn rõ, không lặp header.

### Task 3: Bảo toàn cách tự chia phần Telegram

**Objective:** Danh sách dài không bị cắt dở một cụm hiển thị và vẫn gửi được theo nhiều phần.

**Files:**
- Modify: `Code.gs:taoCacPhanSotw()` nếu cần
- Modify: `test_sotw.js`

**Steps:**
1. Thêm fixture dài buộc tin tách ít nhất hai phần.
2. Đảm bảo phần mới luôn tự mở lại đủ ngữ cảnh: tên GV hiện tại, tiêu đề cột và lớp hiện tại trước dòng bé đầu tiên trong phần đó.
3. Không để cuối phần là tên GV/lớp/tiêu đề mà chưa có bé nào theo sau.
4. Kiểm numbering đầu/cuối phần và tổng số bé giữ đúng.
5. Giữ nguyên quy tắc: Telegram lỗi giữa chừng không ghi mốc `SOTW đã gửi`.

**Acceptance:** Mọi phần đều đọc được độc lập, có đủ ngữ cảnh và không mất/nhân đôi bé.

### Task 4: Cập nhật tài liệu và kiểm thử toàn bộ

**Files:**
- Modify: `README.md` — mục **8A. Gửi SOTW**
- Modify: `task.md` — cập nhật trạng thái Đợt 8 sau khi có kết quả thật
- Verify: `Code.gs`, `test_sotw.js`

**Steps:**
1. Cập nhật README bằng mô tả dễ hiểu: một khối/GV, lớp chèn khi chuyển lớp, ba cột bé/giới tính/ảnh chỉ hiện một lần trong khối GV.
2. Chạy `node test_sotw.js` và xác nhận toàn bộ test PASS.
3. Kiểm cú pháp Apps Script:
   ```bash
   cp Code.gs /home/ubuntu/.hermes/cache/scratch/joy_day_bu_Code.js && node --check /home/ubuntu/.hermes/cache/scratch/joy_day_bu_Code.js
   ```
4. Chạy `git diff --check`.
5. Push GitHub sau khi các kiểm tra đều sạch.
6. Trên máy Windows của anh, chạy file `CAP_NHAT_DAY_BU.cmd`, tải lại Google Sheet bằng `Ctrl + Shift + R`, rồi dùng nút gửi thử SOTW để kiểm bản tin thật.

**Acceptance:** Tin thử thật có đúng một khối `Ms. Vân`; lớp C2.002 và C3.001 được phân cách rõ; không có header lặp; link ảnh mở được.

---

## Rủi ro và giới hạn

- Tên GV/lớp phải được lặp lại ở đầu **phần Telegram mới** nếu danh sách dài bị cắt; đây là ngữ cảnh cần thiết, không phải lỗi lặp header.
- Không gửi danh sách SOTW thật chỉ để kiểm format; dùng nút gửi thử trước.
- GitHub push không tự cập nhật Apps Script. Sau khi đẩy, phải chạy `CAP_NHAT_DAY_BU.cmd` trên Windows rồi tải lại Google Sheet.
- Không bấm `🔨 Tạo lại sheet trống` vì có thể xoá dữ liệu đang dùng.
