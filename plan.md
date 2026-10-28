# PLAN — Rà soát & nâng cấp hệ thống JOY DẠY BÙ

> Trạng thái: **Hoàn thành Giai đoạn 1–5 — sẵn sàng commit/push sau khi test cuối PASS**
>
> Quy tắc đã chốt: Ca đặc biệt nhập được mọi ngày `T2`–`T7` hoặc `CN`; hệ thống xếp đúng ngày/giờ ghi trong cột K. Bé **Vắng / Nghỉ không tính giờ dạy**.
> 
> Nguồn review: `Code.gs`, `test_sotw.js`, README và lịch sử Git. Sau Đợt 1, bộ test chạy thật: **219 PASS / 0 FAIL**.

## 1. Mục tiêu

Giữ nguyên cách dùng quen thuộc của anh, nhưng làm hệ thống:

1. Xếp lịch đúng ngày, không trùng/không mất dữ liệu.
2. Gửi tin không bị gửi lặp ngoài ý muốn.
3. Backup và thống kê phản ánh đúng: học, vắng, nghỉ, đổi ca.
4. Dễ kiểm tra, dễ bảo trì, ít chậm khi danh sách lớn.
5. Tài liệu chỉ còn các hướng dẫn cần dùng.

## 2. Hiện trạng đã xác minh

### Phần đang ổn — giữ nguyên

- Menu đã gọn: 4 nút theo quy trình tuần + 3 menu con.
- Luồng BAO_BU → LICH_BU → xử lý Xin đổi/Quá hạn → backup → làm mới tuần đã có.
- Đồng bộ DS HỌC SINH chỉ đọc file chính; giữ lại dữ liệu phụ như giới tính, ảnh, tick SOTW.
- Cascade chọn **GV → Lớp → Tên bé** và chọn ngược bằng tên bé đã có test.
- Backup không trùng trong trường hợp hiện tại; làm mới tuần tự backup trước khi dọn.
- Bản hiện tại sạch so với GitHub: nhánh `main` trùng `origin/main`, không có thay đổi chưa đẩy.

### Điểm cần sửa trước (ưu tiên cao)

1. **Ca đặc biệt Thứ 4 đang có nguy cơ bị tính nhầm thành Thứ 5.**
   - Ví dụ mẫu: `T4 14h00-15h30 Mr. Ngọc`.
   - Hàm tính ngày đang hiểu số 4 theo lịch máy là thứ Năm, trong khi cách gọi tiếng Việt `Thứ 4` là thứ Tư.
   - Hậu quả: tin nhắn PH có thể báo sai ngày.

2. **Khóa chống trùng backup chưa có ngày/tuần học.**
   - Khóa hiện dùng: `Ca | Thứ | Giờ | GV | Tên bé`.
   - Nếu cùng một bé học bù 2 lần trong cùng tháng, cùng ca/cùng giờ/cùng GV, lần sau có thể bị tưởng là dòng cũ và không được backup.

3. **Thống kê đang có thể tính cả bé “Nghỉ” và “Vắng” như một ca đã dạy.**
   - Backup có lưu các trạng thái này, nhưng báo cáo hiện đếm từ toàn bộ backup.
   - Cần tách rõ: “đã học”, “vắng”, “nghỉ”, “xin đổi”; tổng giờ dạy chỉ tính buổi thực dạy.

4. **Gửi tin cho GV chưa có dấu “đã gửi”.**
   - Bấm nút lần hai sẽ gửi lại toàn bộ ca đã chốt.
   - Cần có cột/đánh dấu thời điểm gửi, màn hình xác nhận, và nút “gửi lại” riêng khi thật sự cần.

5. **Ca đặc biệt hiện cho qua giới hạn số bé và chưa cảnh báo trùng giờ giáo viên.**
   - Có ích cho trường hợp thật sự đặc biệt, nhưng cần cảnh báo rõ nếu cùng GV bị xếp 2 ca trùng giờ hoặc ca quá số bé.

## 3. Ý tưởng mới để dùng tiện hơn

### A. Bảng “Hôm nay cần làm gì?”

Tạo một khối nhỏ ở đầu `LICH_BU`, không thêm tab mới:

- Chờ PH xác nhận: X bé.
- Xin đổi: X bé.
- Quá hạn: X bé.
- Ca đã chốt nhưng chưa gửi GV: X ca.
- Sau giờ học chưa đánh dấu Đã học/Vắng: X bé.

Mỗi số có đường dẫn/ghi rõ thao tác kế tiếp. Anh mở Sheet là biết việc còn lại, không cần nhớ quy trình.

### B. Gửi tin GV có kiểm soát

- Thêm cột quản lý “Đã gửi GV lúc”.
- Nút chính chỉ gửi ca chưa gửi.
- Nếu không còn ca mới, hiện: “Không có tin mới; muốn gửi lại thì bấm Gửi lại”.
- Thêm menu nhỏ “Gửi lại tin GV đã chọn” sau khi có bước xác nhận.

### C. Cảnh báo trước khi gom lịch

Trước khi ghi lịch, hiện bản tóm tắt:

- X bé sẽ được xếp.
- X bé chưa có link Canva.
- X bé không có trình độ / lớp / tên hợp lệ.
- X ca đặc biệt.
- Cảnh báo ca có hơn 2 trình độ, quá 4 bé hoặc GV trùng giờ.

Mặc định vẫn xếp theo logic cũ; chỉ yêu cầu anh xác nhận khi có cảnh báo đỏ.

### D. Báo cáo đúng nghiệp vụ

Báo cáo tháng chia riêng:

- Bé **đã học**.
- Bé **vắng không tới**.
- Bé **nghỉ trước khi học**.
- Ca đã dạy thực tế và tổng giờ thực tế theo GV.

Không dùng “số dòng backup” làm số giờ dạy.

### E. Dọn kỹ thuật nhưng không đổi giao diện

Sau khi các lỗi cao được xử lý và test bảo vệ đầy đủ:

- Tách `Code.gs` theo nhóm chức năng (cấu hình, sheet, xếp lịch, SOTW, backup/báo cáo, Telegram).
- Tạo các hàm đọc/ghi hàng loạt để giảm số lần chạm Sheet.
- Giữ nguyên tên nút và cách dùng hiện tại, tránh làm GV phải học lại.

## 4. Thứ tự thực hiện đề xuất

### Giai đoạn 0 — Chốt quy tắc nghiệp vụ (không sửa code)

Chốt 3 điều cần anh duyệt:

1. “Nghỉ” và “Vắng” có tính giờ/ca cho GV hay không?
2. Với ca đặc biệt: có cho cùng GV dạy 2 ca trùng giờ không, hay chỉ cảnh báo?
3. Khi bấm gửi tin GV lần hai: mặc định chỉ gửi ca mới, đúng không?

### Giai đoạn 1 — Sửa lỗi dữ liệu/rủi ro cao

1. Sửa quy đổi `Thứ 2…Chủ nhật` và kiểm thử từng ngày, nhất là `T4`.
2. Thêm ngày học thật vào khóa backup; vẫn đọc được backup cũ.
3. Bảo đảm làm mới tuần không xóa gì nếu backup gặp lỗi thật.
4. Kiểm tra ca đặc biệt: cú pháp, ngày, số bé, trùng giờ GV.

### Giai đoạn 2 — Tin nhắn và thao tác hằng tuần ✅

1. [x] Đánh dấu “đã gửi tin GV”; chỉ gửi ca mới, gửi lại qua menu riêng có xác nhận.
2. [x] Dashboard menu Báo cáo: chờ, xin đổi, ca chưa gửi, bé chưa chấm.
3. [x] Kiểm tra thiếu dữ liệu/link trước khi ghi lịch; có hàm cảnh báo capacity/trình độ/trùng giờ.

### Giai đoạn 3 — Backup và thống kê ✅

1. [x] Báo cáo phân loại Đã học / Vắng / Nghỉ / chưa chốt.
2. [x] Tổng giờ chỉ tính Đã học; Vắng/Nghỉ không tính giờ.
3. [x] Chọn tháng báo cáo theo `MM-yyyy`.

### Giai đoạn 1C — Ghép ảnh SOTW theo MSHS ✅

1. [x] Đồng bộ danh sách từ file chính đọc thêm cột `MSHS` (file tháng 10 có cột này).
2. [x] Tab DS HỌC SINH thêm MSHS ở cột cuối, không làm lệch cột cũ; link/tick/giới tính vẫn được giữ.
3. [x] Nút gắn ảnh ưu tiên tên file dạng `HVxxx-Họ tên.png`, sau đó mới khớp theo họ tên cho ảnh cũ.
4. [x] Đã kiểm thử với mẫu `HV152-Phạm Gia Khải.png`.

### Giai đoạn 1B — Khoá an toàn backup và ca đặc biệt ✅

1. [x] Làm mới tuần chỉ được xoá sau khi backup trả kết quả thành công; backup lỗi thật → dừng ngay, BAO_BU và LICH_BU giữ nguyên.
2. [x] Trước khi xếp ca đặc biệt, cảnh báo rõ khi trùng giờ cùng GV, ca đang đủ/quá 4 bé, hoặc vượt 2 trình độ; quản lý chọn Có/Không trước khi lịch bị thay đổi.
3. [x] Có test lỗi backup không xoá lịch và test từ chối cảnh báo không ghi ca đặc biệt.

### Giai đoạn 4 — Tối ưu và dọn code ✅

1. [x] Báo cáo ghi theo mảng, các luồng hiện hữu giữ workflow/nút quen thuộc.
2. [x] Tách kiểm tra gom lịch và tổng hợp báo cáo thành hàm thuần để test.
3. [x] Bổ sung test hồi quy các hành vi mới; README, plan.md, task.md đồng bộ.
4. [x] `node test_sotw.js`: **242 PASS / 0 FAIL** (gồm test backup lỗi không xoá lịch, cảnh báo ca đặc biệt và ghép ảnh MSHS trước khi ghi).

## 5. Các file dự kiến thay đổi

- `Code.gs` — sửa logic, thêm dấu gửi tin GV, dashboard nhỏ, báo cáo.
- `test_sotw.js` — viết test thất bại trước, sau đó mới sửa logic.
- `README.md` — cập nhật hướng dẫn duy nhất cho người dùng.
- `task.md` — theo dõi từng việc, kết quả test và commit.
- Có thể tạo `docs/QUY_TAC_NGHIEP_VU.md` nếu cần ghi riêng các quy tắc được anh duyệt.

## 6. Tiêu chuẩn hoàn thành

Chỉ xem là xong khi:

- `node test_sotw.js` PASS toàn bộ, có test mới cho từng lỗi.
- Có test chứng minh T4 ra đúng ngày thứ Tư.
- Có test chứng minh cùng bé học bù lặp lại trong tháng vẫn backup đủ hai lần.
- Có test gửi tin GV: lần 1 gửi, lần 2 không gửi lặp, gửi lại phải xác nhận.
- Có test báo cáo phân biệt Đã học/Vắng/Nghỉ.
- Code được đẩy GitHub; README và `task.md` cập nhật đúng số test.
- Anh chỉ cần dán `Code.gs` vào Apps Script rồi **Triển khai → Quản lý → chọn “Phiên bản mới” → Triển khai**.

## 7. Rủi ro và cách làm an toàn

- Không chạy “Tạo sheet mới” trên sheet đang có dữ liệu.
- Không đổi tên tab/cột đang dùng nếu chưa có bước chuyển đổi an toàn.
- Với thay đổi backup: chạy thử trên dữ liệu mô phỏng trước; không ghi vào Google Sheet thật trong lúc test.
- Các thay đổi lớn chia thành từng đợt nhỏ: làm → test → anh xem → mới sang việc sau.

## 8. Kết luận đề xuất

Em đề nghị làm theo thứ tự: **sửa ngày ca đặc biệt + backup + tin gửi lặp trước**, rồi mới thêm bảng tiện dụng và dọn code. Đây là các phần ảnh hưởng trực tiếp đến lịch học, dữ liệu và tin nhắn; phần giao diện/tối ưu để sau sẽ an toàn hơn.
