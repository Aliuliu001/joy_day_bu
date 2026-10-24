# TASK — JOY DẠY BÙ

> Trạng thái: **ĐỢT 1 HOÀN THÀNH CỤC BỘ — đã test, chưa push GitHub**
>
> Quy tắc anh đã duyệt: cột **Ca đặc biệt** nhận `T2` đến `T7` hoặc `CN`, xếp đúng ngày/giờ/GV ghi trong ô. Bé **Vắng / Nghỉ không tính giờ dạy**.

## Đợt 1 — An toàn dữ liệu và lịch học ✅

### TASK 1 — Ca đặc biệt mọi ngày ✅

- [x] Viết và chạy test `T2`, `T3`, `T4`, `T5`, `T6`, `T7`, `CN`.
- [x] Sửa lỗi `T4` bị hiểu thành Thứ 5; nay `T4` = Thứ 4.
- [x] Hỗ trợ cấu trúc chung: `T2 08h00-09h30 Ms. Vân` đến `T7 ...`, hoặc `CN ...`.
- [x] Ghi mẫu trực tiếp vào 2 dòng mẫu BAO_BU và README.
- [x] Thêm cột **Ngày học** trong LICH_BU để giữ đúng ngày buổi học.

**Đã kiểm:** T28 PASS, mọi ngày T2–CN.

### TASK 2 — Backup không bỏ sót buổi lặp ✅

- [x] Viết test: cùng bé/cùng ca/cùng GV nhưng hai ngày học khác nhau trong tháng.
- [x] Khóa chống trùng đổi thành `Ngày học + Ca + Thứ + Giờ + GV + Tên bé`.
- [x] Backup cũ tự thêm cột `Ngày học` **ở cuối** nên các cột báo cáo cũ không bị lệch.
- [x] Test chứng minh hai buổi đều được lưu.

**Đã kiểm:** T29 PASS.

### TASK 3 — Chốt phạm vi ca đặc biệt ✅

- [x] Ca riêng được ưu tiên xếp theo đúng ngày/giờ/GV nhập ở cột K.
- [x] Không giới hạn sẵn ngày T4; dùng được T2–T7 và CN.
- [x] Giữ cách xếp hiện tại: ca đặc biệt không bị đưa vào 4 ca cố định.
- [x] Chưa thêm cơ chế chặn/cảnh báo trùng giờ để không làm thay đổi cách anh đang xếp; nội dung này chuyển sang Đợt 3 nếu anh cần.

**Kết quả Đợt 1:** `node test_sotw.js` = **219 PASS / 0 FAIL**.

## Đợt 2 — Không gửi tin trùng ✅

### TASK 4 — Đánh dấu tin đã gửi cho GV ✅

- [x] Thêm cột quản lý an toàn trong `LICH_BU`: “Đã gửi GV lúc”.
- [x] Nâng cấp sheet cũ không làm mất lịch; chạy lại không thêm cột trùng.
- [x] Test lần nâng cấp/gửi đầu và lần chạy lại an toàn.

### TASK 5 — Chỉ gửi tin mới, có gửi lại khi cần ✅

- [x] Lần đầu chỉ gửi các ca chốt chưa có mốc.
- [x] Lần sau không gửi lặp; Telegram lỗi không đánh dấu đã gửi.
- [x] Có menu gửi lại riêng, bắt buộc xác nhận.

## Đợt 3 — Biết ngay việc còn lại ✅

### TASK 6 — “Hôm nay cần làm gì?” ✅

- [x] Không tạo tab mới; menu Báo cáo có bảng tóm tắt chờ/xin đổi/ca chưa gửi/bé chưa chấm.
- [x] Có test đếm số liệu.

### TASK 7 — Cảnh báo trước khi gom nhóm ✅

- [x] Kiểm tra thiếu tên/lớp/trình độ/link Canva trước khi ghi lịch, quản lý quyết định tiếp tục hay dừng.
- [x] Hàm nghiệp vụ kiểm tra cảnh báo quá 4 bé, quá 2 trình độ và cùng GV trùng giờ có test bảo vệ.

## Đợt 4 — Báo cáo đúng thực tế ✅

### TASK 8–9 — Quy tắc và báo cáo tháng ✅

- [x] **Vắng / Nghỉ không tính giờ dạy**; chỉ “Đã học” tính ca/giờ.
- [x] Báo cáo tách Đã học, Vắng, Nghỉ, chưa chốt.
- [x] Có chọn tháng `MM-yyyy`; test giờ thường/ca riêng qua parser chung.

## Đợt 5 — Dọn và tối ưu không đổi cách dùng ✅

### TASK 10–11 — An toàn thao tác và tài liệu ✅

- [x] Giữ ghi dữ liệu theo mảng ở báo cáo/dashboard; không đổi 4 nút workflow.
- [x] README là hướng dẫn chính, plan/task đánh dấu hoàn thành.
- [x] `node test_sotw.js`: **235 PASS / 0 FAIL**.

## Checklist trước khi đẩy GitHub

- [x] Code test PASS 100%: **235 PASS / 0 FAIL**.
- [x] Không còn thay đổi chưa kiểm tra.
- [x] README, `plan.md`, `task.md` đã cập nhật.
- [ ] Đã commit và push GitHub.
- [ ] Đã kiểm tra lại commit trên nhánh `main`.
