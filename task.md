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

## Đợt 2 — Không gửi tin trùng

### TASK 4 — Đánh dấu tin đã gửi cho GV

- [ ] Thêm cột quản lý an toàn trong `LICH_BU`: “Đã gửi GV lúc”.
- [ ] Nâng cấp sheet cũ mà không làm mất lịch đang có.
- [ ] Viết test migration cột và test chạy nâng cấp lần 2 không thêm cột trùng.

### TASK 5 — Chỉ gửi tin mới, có gửi lại khi cần

- [ ] Viết test lần bấm đầu gửi đúng các ca đã chốt.
- [ ] Viết test lần bấm sau không gửi lặp.
- [ ] Thêm nút/luồng gửi lại có xác nhận rõ ràng.
- [ ] Nếu Telegram lỗi: không đánh dấu là đã gửi.
- [ ] Chạy toàn bộ test.

**Kết quả mong đợi:** không spam nhóm, nhưng vẫn có cách gửi lại khi cần.

## Đợt 3 — Biết ngay việc còn lại

### TASK 6 — Khối “Hôm nay cần làm gì?”

- [ ] Thiết kế khối tóm tắt ở đầu `LICH_BU`.
- [ ] Hiện số bé chờ, xin đổi, quá hạn, ca chưa gửi GV, bé chưa chấm sau giờ học.
- [ ] Không tạo thêm tab.
- [ ] Bấm nâng cấp nhiều lần không nhân đôi khối.
- [ ] Viết test số liệu và test chạy lại an toàn.

### TASK 7 — Cảnh báo trước khi gom nhóm

- [ ] Kiểm tra thiếu lớp/tên/trình độ/link Canva.
- [ ] Hiện tóm tắt trước khi ghi lịch khi có dữ liệu thiếu hoặc ca không phù hợp.
- [ ] Cho phép anh xác nhận vẫn xếp tiếp.
- [ ] Viết test cho từng dạng cảnh báo.

## Đợt 4 — Báo cáo đúng thực tế

### TASK 8 — Chốt quy tắc tính giờ

- [ ] Ghi quy tắc đã duyệt vào README.
- [ ] Phân loại rõ Đã học / Vắng / Nghỉ / chưa chốt trong backup.
- [ ] Viết test mỗi loại.

**Cần anh duyệt:** “Vắng” và “Nghỉ” có được tính giờ dạy/GV hay không?

### TASK 9 — Sửa báo cáo tháng

- [ ] Tổng giờ chỉ tính theo quy tắc TASK 8.
- [ ] Tách số bé đã học, vắng, nghỉ.
- [ ] Cho xem tháng đã có backup (không chỉ tháng hiện tại).
- [ ] Viết test parse giờ thường và ca đặc biệt.

## Đợt 5 — Dọn và tối ưu không đổi cách dùng

### TASK 10 — Tối ưu ghi dữ liệu hàng loạt

- [ ] Đo các đoạn chạm Sheet nhiều lần.
- [ ] Đổi phần an toàn sang ghi theo nhóm thay vì từng dòng.
- [ ] Không thay đổi tên menu/cách dùng.
- [ ] Chạy regression test toàn bộ.

### TASK 11 — Dọn tài liệu

- [ ] `README.md` là hướng dẫn duy nhất cho người dùng.
- [ ] Sửa số test thật: hiện có **209 PASS / 0 FAIL**, không để dòng cũ “197/197”.
- [ ] Đánh dấu tài liệu cũ trong `docs/` là lịch sử để tránh đọc nhầm.
- [ ] Cập nhật `task.md` theo kết quả thật.

## Checklist trước khi đẩy GitHub

- [ ] Code test PASS 100%.
- [ ] Không còn thay đổi chưa kiểm tra.
- [ ] README có hướng dẫn dán/deploy bản mới.
- [ ] Đã cập nhật `plan.md`/`task.md` trạng thái hoàn thành.
- [ ] Đã commit và push GitHub.
- [ ] Đã kiểm tra lại commit trên nhánh `main`.

## Chốt từ anh trước khi em làm

Anh chỉ cần trả lời 3 ý:

1. Ca đặc biệt trùng giờ cùng GV: **chỉ cảnh báo** hay **chặn xếp**?
2. “Vắng” / “Nghỉ”: có tính giờ dạy cho GV không?
3. Duyệt làm **Đợt 1 trước** chứ?
