# TASK — JOY DẠY BÙ

> Trạng thái: **HOÀN THÀNH TẤT CẢ ĐỢT 1–5 — đã test và đẩy GitHub**
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

## Đợt 1B — Khoá an toàn khi làm mới tuần và ca đặc biệt ✅

### TASK 12 — Backup lỗi thì dừng, không xoá lịch ✅

- [x] `backupTuanBu()` trả kết quả rõ: thành công hoặc lỗi.
- [x] `Làm mới tuần mới` dừng ngay nếu backup lỗi; BAO_BU và LICH_BU không bị sửa/xoá.
- [x] Test T33 mô phỏng backup lỗi, xác nhận hai tab vẫn nguyên vẹn.

### TASK 13 — Cảnh báo rõ ca đặc biệt trước khi ghi ✅

- [x] Kiểm tra ca đặc biệt với lịch đang có: trùng giờ cùng GV, ca đang đủ/quá số bé và quá số trình độ.
- [x] Hiện hộp xác nhận trước khi dọn lịch hoặc ghi thêm ca; chọn Không thì dữ liệu giữ nguyên.
- [x] Test T34 xác nhận chọn Không không ghi ca riêng và cảnh báo nêu đủ rủi ro.

## Đợt 1D — SOTW gửi topic riêng ✅

### TASK 15 — Chỉ SOTW sang topic 🏆 SOTW ✅

- [x] Giữ nguyên nhóm/topic Học Bù cho lịch học bù, nhắc GV và case Xin đổi.
- [x] Route riêng SOTW sang Office - Joy, topic 22.
- [x] Có hàm/nút **🧪 Gửi thử topic SOTW** để anh xác nhận trước khi gửi thật.
- [x] Test kiểm đúng `chat_id` Office - Joy và đúng `message_thread_id` 22.

## Đợt 1C — Ghép ảnh SOTW theo MSHS ✅

### TASK 14 — Nhận ảnh tên `HVxxx-Họ tên.png` ✅

- [x] Đọc MSHS từ cột `MSHS` trong file danh sách tháng 10 của anh.
- [x] Thêm cột MSHS ở cuối DS HỌC SINH để không làm đổi những cột đang dùng.
- [x] Khi gắn ảnh, ưu tiên ghép MSHS; tên bé là phương án dự phòng cho ảnh cũ.
- [x] Test mẫu `HV152-Phạm Gia Khải.png` tự điền đúng link ảnh.
- [x] MSHS khớp nhưng tên file sai: vẫn gắn ảnh, popup báo MSHS + tên danh sách + tên file.

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
- [x] `node test_sotw.js`: **250 PASS / 0 FAIL**.

## Đợt 6 — Thống nhất Ca xếp BAO_BU ↔ LICH_BU (đang thực hiện)

> Quy tắc đã duyệt: Sau khi PH `✅ Đi được`, lịch được chốt và **gửi GV thành công**, `LICH_BU` là ca cuối của buổi. Hệ thống phản ánh ca cuối đó về dòng đúng trong `BAO_BU`; `CÀI ĐẶT CA DẠY BÙ` vẫn là danh mục ca chung, không bị sửa theo từng bé.

### TASK 1 — Nhãn ca và Cài đặt ca ✅

- [x] Nhãn chung đổi thành `Mã ca | Thứ | Giờ | GV`, phân biệt ca trùng giờ khác GV.
- [x] Cột `Ca hiển thị` tự cập nhật khi sửa Mã/Thứ/Giờ/GV trong tab Cài đặt.
- [x] Dropdown luôn dựng nhãn từ dữ liệu ca hiện hành, không dùng nhãn cũ lưu lại.
- [x] Gom lần hai giữ ca tạm đã có, không tạo LICH_BU.
- [x] Test đỏ rồi xanh: `node test_sotw.js` = **213 PASS / 0 FAIL**.

### TASK 2 — Chặn sai khi sửa ca tạm BAO_BU ✅

- [x] Chặn chốt nếu ca đã tắt/không tồn tại, quá chỗ, quá số trình độ hoặc GV trùng giờ.
- [x] Không tự dời hoặc ghi đè lựa chọn tay của quản lý; popup nêu ca/dòng cần sửa.

### TASK 3 — Chốt BAO_BU sang LICH_BU an toàn ✅

- [x] Không âm thầm bỏ qua ca sai; không chốt đè lịch đã có PH/GV.
- [x] Thêm `Mã buổi` ở cuối BAO_BU và LICH_BU để liên kết đúng một buổi, kể cả cùng bé học bù nhiều lần.

### TASK 4 — Đổi lịch cuối và gửi GV ✅

- [x] Đổi ca LICH_BU cập nhật đủ ngày, xoá xác nhận/tin/marker cũ và yêu cầu PH xác nhận lại.
- [x] Chỉ bé PH `✅ Đi được` và đã chốt nội dung mới tạo/gửi tin GV.

### TASK 5 — Đồng bộ ngược sau khi gửi GV ✅

- [x] Telegram gửi thành công mới phản ánh ca cuối về đúng dòng BAO_BU và đặt trạng thái `Đã báo GV`.
- [x] Nếu đồng bộ BAO_BU lỗi sau gửi: giữ mốc đã gửi, báo rõ lỗi; không gửi lại tin chỉ để đồng bộ.

### TASK 6 — Hướng dẫn ngay trong Cài đặt kỹ thuật ✅

- [x] Cập nhật popup hướng dẫn + README theo đúng thứ tự làm thực tế, có ví dụ đổi T6-1 → T6-2.
- [x] Đổi thứ tự 7 nút menu để bước xử lý PH xin đổi nằm sau bước hỏi PH.

### TASK 8 — BAO_BU chỉ đến cột L + dropdown ca tự làm mới ✅

- [x] Bỏ Mã buổi khỏi BAO_BU; cột M trở đi không bị tạo, khóa hay dùng cho workflow.
- [x] Mã liên kết được chuyển sang tab `DỮ LIỆU KỸ THUẬT` tự ẩn; vẫn đồng bộ đúng ca cuối sau khi gửi GV thành công.
- [x] Sửa/thêm/bật-tắt ca ở `CÀI ĐẶT CA DẠY BÙ` tự làm mới dropdown Ca xếp ở BAO_BU và LICH_BU.
- [x] Thêm nút dự phòng `🔄 Làm mới danh sách Ca xếp`: chỉ làm mới danh sách chọn, không đổi lịch/không gửi tin.
- [x] Bỏ lỗi nâng cấp vì lịch cũ ở Q không trùng dropdown: lịch cũ được giữ, chỉ kiểm ca đang Dùng trước lúc tạo/gửi tin GV.
- [x] `node test_sotw.js`: **227 PASS / 0 FAIL**.

### TASK 9 — Ca đặc biệt ĐB-01 trong workflow hai giai đoạn ✅

- [x] Chốt form: `ĐB-01 | Thứ 4 | 14h00 - 15h30 | Ms. Vân`; mã luôn `ĐB-01`, chỉ đổi Thứ/Giờ/GV.
- [x] Ca đặc biệt ưu tiên tuyệt đối ở Gom nhóm tạm, tự ghi nhãn chuẩn sang Ca xếp rồi đi trọn BAO_BU → LICH_BU → PH → GV → đồng bộ về BAO_BU.
- [x] Ca ĐB không bị loại vì không thuộc Cài đặt ca chung; cú pháp sai hiện `Cần sửa ca đặc biệt`, không tự xếp sang ca thường.
- [x] Hai dòng mẫu, README và popup hướng dẫn dùng form mới; vẫn đọc form cũ để các dòng đã có không kẹt.
- [x] `node test_sotw.js`: **234 PASS / 0 FAIL**.

### TASK 10 — Đồng bộ DS theo file chính + Ca ĐB mọi GV ✅

- [x] File chính là nguồn chuẩn: đồng bộ tự bỏ bé không còn trong file chính, vẫn giữ ảnh/giới tính/tick của bé còn tồn tại.
- [x] Ca đặc biệt cho phép mọi GV đang hoạt động, gồm `Mr. Ngọc`; không giới hạn chỉ Ms. Vân/Mr. Đức Anh.
- [x] `node test_sotw.js`: **233 PASS / 0 FAIL**.

### TASK 12 — Gỡ validation sai ở dòng mẫu và Ca đặc biệt ✅

- [x] Dòng mẫu 2–3 không còn nhận dropdown tên bé; `Không bù` ở D2 không bị Google Sheets chặn khi Nâng cấp.
- [x] Dropdown Ca xếp chỉ gợi ý ca ON nhưng cho phép nhãn Ca đặc biệt `ĐB-01 | ...` ở cả dòng mẫu và dòng thực.
- [x] Luôn gỡ validation cũ trước khi ghi validation mới để không còn rule cũ gây báo đỏ.
- [x] `node test_sotw.js`: **240 PASS / 0 FAIL**.

### TASK 11 — Đổi trạng thái ca thành ON/OFF + sửa dropdown cũ ✅

- [x] Cột Trạng thái dùng rõ `ON` (mở) / `OFF` (tạm đóng), thay cho chữ Dùng/Dừng dễ đọc nhầm.
- [x] Khi chạy nâng cấp, dữ liệu cũ `Dùng`/`Dừng` tự chuyển sang `ON`/`OFF`; không tự đổi lịch các bé.
- [x] Trước khi ghi danh sách Ca xếp mới, xoá rule dropdown cũ ở BAO_BU và LICH_BU; không còn chuyện danh sách cũ giữ lại.
- [x] Nút làm mới nêu số ca đang ON.
- [x] Test T44 PASS: OFF bị loại, ON hiện ngay trong Ca xếp.

### TASK 13 — Sửa dứt điểm validation Ca xếp ở Sheet thật 🔄

- [x] Tìm đúng nguyên nhân trong code: có **2 hàm cùng tên** `datDropdownBaoBu`; JavaScript chỉ chạy bản cuối nên rất dễ sửa nhầm.
- [x] Gộp còn 1 đường tạo dropdown và xóa rule cũ trước khi ghi rule mới.
- [x] Dòng mẫu (2–3) và bé có **Ca đặc biệt** ở cột K được **miễn dropdown ca thường** ở cột H, nên không thể hiện cảnh báo đỏ do danh sách ca ON.
- [x] Bé dùng ca thường vẫn có dropdown chỉ gồm các ca đang **ON**; ca OFF không xuất hiện.
- [x] Nút **Làm mới danh sách Ca xếp** chỉ thay danh sách chọn, không sửa bất kỳ giá trị/lịch nào trong H hoặc K.
- [x] Cột K được sửa ở bé thật: ca ĐB hợp lệ tự đồng bộ sang H; dòng mẫu không tự sinh lịch.
- [x] Test hồi quy thật: `node test_sotw.js` = **247 PASS / 0 FAIL**; `git diff --check` sạch.
- [ ] Còn cần kiểm trực tiếp trên Google Sheet đang dùng sau khi `clasp push`: H3 không đỏ, H5 không đỏ và nhận đúng từ K5, một dòng ca thường chỉ chọn ca ON.

### TASK 7 — Nghiệm thu, push ⏳

- [x] Rà luồng cũ, chạy toàn bộ test và kiểm tra định dạng diff.
- [x] Review độc lập đã tìm 3 lỗi luồng cao/trung bình: lịch cuối chưa kiểm lại, alias cũ có thể bỏ qua PH, hướng dẫn còn đường dẫn cũ. Đã sửa và bổ sung test hồi quy.
- [x] Đã commit `7537f2f`; push GitHub đang bị chặn vì PAT trên máy trả 401. Sau khi push được, cần dán `Code.gs` vào Apps Script của Sheet thật và chạy `🔧 Nâng cấp sheet sau khi copy code mới`.

## Checklist trước khi đẩy GitHub

- [x] Code test PASS 100%: **225 PASS / 0 FAIL**.
- [x] `git diff --check` sạch.
- [x] README, plan và task.md đã cập nhật.
- [ ] Đã commit/push Đợt 6 và kiểm tra lại commit mới trên nhánh `main`.

## Đợt 7 — Tin Telegram GV đúng theo từng bé ✅

- [x] Mỗi GV nhận một tin, tách rõ từng ca; nếu quá dài, chỉ tách tại ranh giới ca.
- [x] Mỗi bé giữ dòng riêng. Chỉ dùng chung tài liệu khi cùng lớp, Slide và Ghi chú (bỏ khoảng trắng thừa khi đối chiếu).
- [x] Slide/Ghi chú khác vẫn nằm đúng dưới tên bé. Nếu thiếu một trong hai, hiện đúng một cảnh báo: “Học sinh chưa có Link Slide Canva hoặc Ghi chú ôn bài…”; không chặn gửi.
- [x] Lưu kín GV nguồn Slide/Ghi chú trong tab `DỮ LIỆU KỸ THUẬT`; giữ đúng tài liệu khi GV báo B nhưng ca cuối giao A. Dấu nguồn chỉ để kiểm tra nội bộ, không hiện trong Telegram.
- [x] Test T47 + toàn bộ suite: `node test_sotw.js` = **258 PASS / 0 FAIL**; `git diff --check` sạch.
- [ ] Còn cần đẩy GitHub, cập nhật vào Apps Script/Sheet thật và anh xem một tin Telegram thật trước khi đóng nghiệm thu.

## Đợt 8 — SOTW: bảng gọn, tự chia tin Telegram 🔄

- [x] Cập nhật `plan.md` trước khi làm: nhóm `Tên GV - Tên lớp`, ABC theo GV/lớp, chỉ 3 cột Tên bé/Giới tính/Ảnh.
- [x] Link Drive hiện thành chữ bấm `🖼️ Mở ảnh`; bé thiếu link vẫn hiện và phần cuối liệt kê tên bé thiếu ảnh.
- [x] Bỏ cảnh báo do ô `GV đang chọn`; ô này chỉ còn dùng lọc danh sách trong Sheet.
- [x] Tin dài tự chia `Phần X/Y`, không cắt giữa tên/link/dòng bé; gửi lỗi giữa chừng không ghi mốc đã gửi.
- [x] `node test_sotw.js`: **274 PASS / 0 FAIL**; kiểm cú pháp `Code.gs` và `git diff --check` sạch.
- [ ] Đẩy GitHub, dán `Code.gs` vào Apps Script/Sheet thật, sau đó gửi thử danh sách dài để kiểm tra có đủ `Phần 1/Y` đến `Phần Y/Y`.
