# PLAN — Sửa thuật toán 6: Gửi lịch đã chốt cho GV

> Trạng thái: **Đã thực hiện trong Code.gs, README và test; chưa gửi Telegram thật.**

**Mục tiêu:** Khi bấm **6️⃣ Gửi lịch đã chốt cho GV**, mỗi giáo viên nhận tin rõ theo từng ca; mỗi học sinh có slide và ghi chú đúng của mình. Các bé cùng lớp học cùng giáo viên chỉ hiện **một lần** phần tài liệu hoàn toàn giống nhau; nếu ghi chú khác nhau thì giữ đúng ghi chú theo từng bé.

**Phạm vi:** Sửa nội dung/cách gom tin ở bước 6, đồng thời rà đường đi của **GV báo ban đầu → slide/ghi chú → GV dạy thay cuối cùng** để không thể gửi nhầm tài liệu của giáo viên B cho ca đã xếp giáo viên A. Không đổi lịch, không tạo/gửi thêm tin PH và không đụng dữ liệu đã backup.

---

## 1. Hiện trạng và lỗi logic đã xác nhận

Hiện `guiTinChoGV()` trong `Code.gs` đang:

1. Gom danh sách theo **mã ca**.
2. In slide cho từng bé.
3. Gom ghi chú theo **nội dung ghi chú**, nên nhiều bé khác nhau có thể bị dồn vào một ghi chú chung.

Ví dụ lỗi: Bé A và Bé B khác lớp nhưng vô tình cùng chữ ghi chú sẽ bị gộp; ngược lại hai bé cùng lớp/cùng giáo viên bị lặp slide và ghi chú dù giáo viên chỉ cần xem một lần.

Nguồn dữ liệu giữ nguyên trong `LICH_BU`:

- Tên bé: cột E
- Mã lớp: cột F
- Slide Canva: cột H
- Ghi chú: cột M
- Giáo viên dạy thay: cột D
- Ca/ngày/giờ: cột A–C và cột Q

---

## 2. Quy tắc mới đề xuất

### A. Mỗi bé luôn có dòng tên riêng

Trong đúng một ca, vẫn liệt kê tất cả bé để giáo viên biết mình dạy ai.

Ví dụ:

```text
1. Bé An — Lớp S1.001
2. Bé Bình — Lớp S1.001
3. Bé Chi — Lớp S2.003
```

### B. Slide + Ghi chú đi theo đúng từng bé, chỉ gộp khi hoàn toàn giống nhau

Khóa để so sánh là: **Giáo viên dạy thay cuối cùng + ca + mã lớp + slide + ghi chú**.

- Hai hay nhiều bé cùng lớp, cùng ca, cùng giáo viên dạy thay, **cùng slide và cùng ghi chú**: hiện một lần phần tài liệu chung.
- Nếu ghi chú khác nhau: **không gộp**. Mỗi bé có ghi chú riêng ngay dưới tên bé đó, đúng như giáo viên của bé đã ghi.
- Nếu slide khác nhau: mỗi bé nhận đúng slide của mình; không tự chọn một slide thay cả lớp.
- Cùng mã lớp nhưng học với hai giáo viên dạy thay khác nhau: mỗi giáo viên nhận đúng phần danh sách, slide và ghi chú của ca mình; tuyệt đối không dùng dữ liệu của nhóm giáo viên kia.

Việc này **không phức tạp và không gây lẫn code** nếu gom theo khóa đầy đủ ở trên. Ngược lại, cách cũ chỉ gom theo chữ ghi chú mới là nguyên nhân gây lẫn.

### C. Thiếu slide hoặc ghi chú vẫn gửi, nhưng cảnh báo đúng người

- Vẫn gửi lịch để giáo viên không lỡ ca đã chốt.
- Ngay dưới bé thiếu Link Slide Canva **hoặc** thiếu Ghi chú, hiện đúng một câu:
  - `⚠️ Học sinh chưa có Link Slide Canva hoặc Ghi chú ôn bài. Nhờ thầy cô dạy bù báo lại để Văn Phòng kiểm tra trước giờ nhé.`
- Bé đã đủ cả Link Slide Canva và Ghi chú không hiện cảnh báo. Không coi ô trống là thông tin dùng chung của lớp; cảnh báo gắn đúng tên bé và lớp.

### D. Kiểm tra nhầm giáo viên A/B trước khi gửi

Khi lịch cuối xếp **GV A** nhưng slide/ghi chú lại xuất phát từ **GV B**, đây là lỗi nguồn dữ liệu cần phát hiện trước khi gửi.

1. Rà toàn bộ đường ghi dữ liệu từ `BAO_BU` sang `LICH_BU`: GV báo ban đầu (cột B), GV dạy thay cuối (cột D), link slide (H) và ghi chú (M).
2. Xác định rõ dữ liệu slide/ghi chú thuộc **giáo viên nào đã báo bé**; không suy từ lớp hoặc từ ca mới.
3. Nếu hàng lịch có dấu nguồn GV B nhưng ca cuối giao GV A, tin gửi GV A phải mang đúng slide/ghi chú của bé đó và kèm nhãn nguồn rõ ràng trong dữ liệu nội bộ để rà lỗi; không tự thay nội dung bằng dữ liệu của GV A.
4. Nếu không thể xác định nguồn giáo viên của slide/ghi chú từ dữ liệu hiện tại, bổ sung một trường kỹ thuật ẩn (không thêm cột người dùng nhìn thấy) để lưu nguồn lúc tạo `LICH_BU`; lịch sử cũ không có nguồn vẫn gửi, nhưng hiện cảnh báo cần kiểm tra.

### E. Phân cách rõ ràng trong tin

1. Giữa hai bé trong cùng ca: một đường phân cách `──────────`.
2. Giữa hai ca khác nhau của cùng giáo viên: một khối tiêu đề ca mới và đường phân cách đậm `══════════════════`.
3. Tin bắt đầu bằng tên giáo viên để khi ở chung topic vẫn biết tin dành cho ai.

---

## 3. Mẫu tin sau khi sửa

```text
📚 LỊCH HỌC BÙ — Ms. Vân

══════════════════
🕒 CA T6-2 | Thứ 6 | 15h00–16h30

1. Bé An — Lớp S1.001
   Slide: https://...
   Ghi chú: Ôn Unit 4, ưu tiên phần đọc.
──────────
2. Bé Bình — Lớp S1.001
   ↳ Dùng chung Slide + Ghi chú với Bé An.
──────────
3. Bé Chi — Lớp S2.003
   Ghi chú: Luyện nghe trang 12.
   ⚠️ Học sinh chưa có Link Slide Canva hoặc Ghi chú ôn bài.
   Nhờ thầy cô dạy bù báo lại để Văn Phòng kiểm tra trước giờ nhé.

══════════════════
🕒 CA T7-1 | Thứ 7 | 08h00–09h30
...
```

Nếu Ms. Vân và Mr. Đức Anh cùng dạy bé thuộc lớp `S1.001` ở hai ca khác nhau, hai người nhận hai khối tin riêng; mỗi khối có Slide/Ghi chú của đúng phần lịch đang dạy.

---

## 4. Các việc sẽ làm

### Task 1 — Lập test lỗi trước khi sửa

**Files:** `test_sotw.js`

1. Tạo dữ liệu mẫu: 2 bé cùng lớp/cùng GV/cùng ca/cùng tài liệu; 1 bé cùng lớp nhưng ghi chú khác; 1 bé lớp khác bị thiếu slide; 1 bé cùng lớp nhưng GV dạy thay khác.
2. Tạo thêm mẫu lỗi A/B: GV báo ban đầu là B, nhưng ca cuối xếp GV A; kiểm toàn bộ đường mang slide/ghi chú sang `LICH_BU`.
3. Chạy test hiện tại để chứng minh ghi chú đang bị gom sai theo chữ ghi chú.
4. Viết test mới kiểm tra:
   - Tên từng bé vẫn xuất hiện.
   - Chỉ dữ liệu **slide + ghi chú hoàn toàn giống nhau** mới gộp một lần.
   - Ghi chú/slide khác nhau đi đúng dưới tên từng bé, không bị gộp hay mất.
   - Thiếu slide hoặc ghi chú vẫn gửi và hiện cảnh báo đúng tên bé.
   - Hai GV khác nhau nhận hai phần tài liệu riêng, không lẫn nguồn A/B.
   - Có đủ hai loại đường phân cách: giữa bé và giữa ca.

### Task 2 — Tạo bộ gom dữ liệu gửi GV

**Files:** `Code.gs`

1. Tách một hàm thuần để lấy các dòng đã chốt và gom theo khóa đầy đủ:
   `Giáo viên dạy thay cuối + mã ca/ca hiển thị + thứ + giờ`.
2. Trong từng ca, so tài liệu theo khóa:
   `Giáo viên dạy thay cuối + mã lớp + slide + ghi chú`.
3. Dòng tên bé luôn giữ riêng; chỉ những bé có khóa tài liệu giống hệt mới hiển thị Slide + Ghi chú một lần và có dòng “dùng chung”.
4. Không dùng cách gom cũ theo riêng chữ ghi chú.
5. Chuẩn hóa khoảng trắng khi so mã lớp/slide/ghi chú, nhưng giữ nguyên chữ anh nhập khi hiển thị.

### Task 3 — Giữ tài liệu khác nhau đúng theo từng bé

**Files:** `Code.gs`, `test_sotw.js`

1. Không chặn gửi chỉ vì cùng lớp có slide hoặc ghi chú khác nhau.
2. Nếu khác: in slide/ghi chú ngay dưới đúng tên bé; không gộp với bạn khác.
3. Nếu giống: in một lần ở bé đầu tiên và hiện “dùng chung” ở bé tiếp theo.
4. Nếu thiếu slide hoặc ghi chú: vẫn gửi; in cảnh báo đầy đủ theo đúng tên bé/lớp.
5. Các ca/giáo viên không có lỗi vẫn gửi bình thường; chỉ đánh dấu **Đã gửi GV lúc** cho những dòng Telegram gửi thành công.

### Task 4 — Rà và khóa đúng nguồn GV A/B

**Files:** `Code.gs`, `test_sotw.js`, `README.md`

1. Lập bản đồ dữ liệu: cột B `BAO_BU` là GV báo ban đầu; cột D `LICH_BU` là GV dạy thay cuối; cột H/M `LICH_BU` là Slide/Ghi chú theo bé.
2. Rà các hàm tạo/chốt `LICH_BU` và các nhánh đổi ca để xác định chỗ nào có thể vô tình lấy ghi chú/slide của GV khác.
3. Thêm dấu nguồn kỹ thuật cho mỗi buổi khi tạo từ `BAO_BU` (không thêm cột người dùng phải nhập) để biết slide/ghi chú đi cùng GV báo nào.
4. Khi ca cuối đổi từ GV B sang GV A, giữ đúng slide/ghi chú của bé do GV B cung cấp; tin gửi GV A phải ghi nhận đúng dữ liệu ấy, không thay bằng dữ liệu/lớp của GV A.
5. Với lịch cũ chưa có dấu nguồn, vẫn gửi để không kẹt việc. Dấu nguồn chỉ dùng để kiểm tra nội bộ, không hiện cảnh báo này trong Telegram.
6. Test cả ba tình huống: A=B; A≠B nhưng dữ liệu bé giữ đúng; lịch cũ thiếu nguồn vẫn gửi nhưng không lộ cảnh báo kỹ thuật.

### Task 5 — Soạn tin dễ đọc

**Files:** `Code.gs`, `test_sotw.js`

1. Viết một hàm dựng nội dung tin theo thứ tự: tên GV → ca → tên từng bé → tài liệu theo lớp.
2. Chèn phân cách mảnh giữa bé; chèn phân cách đậm và tiêu đề mới giữa ca.
3. Không gửi Telegram trong test dựng nội dung; test kiểm chính xác từng khối text.
4. Kiểm giới hạn độ dài Telegram. Nếu một tin của một GV quá dài, tự tách **theo ranh giới ca**, không cắt giữa tên bé/slide/ghi chú.

### Task 6 — Giữ an toàn luồng gửi hiện tại

**Files:** `Code.gs`, `test_sotw.js`

1. Giữ nguyên nút 6, nút gửi lại có xác nhận, route bot/topic hiện hành và quy tắc không gửi trùng.
2. Sau Telegram trả thành công mới ghi mốc `Đã gửi GV lúc` và đồng bộ `BAO_BU`.
3. Tin lỗi hoặc dữ liệu mâu thuẫn không được ghi mốc gửi để anh sửa xong có thể bấm gửi lại đúng phần còn thiếu.
4. Không sửa slide/ghi chú/dòng lịch trong `LICH_BU` khi đang gửi.

### Task 7 — Tài liệu và nghiệm thu

**Files:** `README.md`, `task.md`, `plan.md`

1. Cập nhật README: Slide/Ghi chú gắn theo từng bé; chỉ gộp khi cả hai nội dung giống hệt trong cùng ca/GV.
2. Ghi rõ cảnh báo khi một bé thiếu Slide hoặc Ghi chú và cách Văn phòng/GV xử lý.
3. Ghi rõ cách hệ thống bảo vệ trường hợp ca giao GV A nhưng nội dung do GV B gửi.
4. Chạy toàn bộ `node test_sotw.js` và `git diff --check`.
5. Commit, đẩy GitHub, cập nhật Apps Script đúng Sheet, rồi gửi thử bằng dữ liệu thật cho một ca chưa gửi/ca test được anh cho phép.
6. Chỉ đánh dấu hoàn thành sau khi anh nhìn thấy tin Telegram đúng bố cục và xác nhận slide/ghi chú đúng từng GV.

---

## 5. Quy tắc anh đã chốt + đề xuất còn lại

### Đã chốt

1. **Cùng lớp nhưng slide/ghi chú khác nhau:** vẫn gửi; nội dung nào thuộc bé nào thì gắn đúng dưới bé đó. Chỉ gộp khi slide **và** ghi chú hoàn toàn giống nhau.
2. **Thiếu slide/ghi chú:** vẫn gửi; gắn cảnh báo rõ để người nhận báo Văn phòng hoặc liên hệ trực tiếp giáo viên của bé.
3. **Nhầm GV A/B:** phải rà và sửa cả đường dữ liệu; ca giao GV A không được lẫn slide/ghi chú của bé khác hoặc nhóm GV B.

### Em đề xuất giữ như sau

4. **Thứ tự bé trong ca:** giữ thứ tự hiện đang có trong `LICH_BU`, để không làm đảo danh sách anh đã xếp.
5. **Cùng giáo viên có nhiều ca:** một tin Telegram cho một giáo viên, chia thành các khối ca rõ ràng; quá dài thì tách đúng ở ranh giới ca, không cắt giữa nội dung một bé.
6. **Gửi lại:** nút gửi lại giữ nguyên nguyên tắc gửi đủ danh sách của ca cho giáo viên, không gửi lẻ từng bé để tránh thiếu bối cảnh.
7. **Tên lớp khi so sánh:** bỏ khoảng trắng thừa khi máy đối chiếu (`S1.001` và ` S1.001 ` tính là một), nhưng hiển thị nguyên văn tên lớp trong Sheet.

---

## 6. Tiêu chuẩn hoàn thành

Chỉ báo xong khi có đủ các điểm sau:

- Hai bé cùng lớp/cùng GV có Slide + Ghi chú giống hệt: tên còn đủ 2 bé, tài liệu chỉ hiện một lần.
- Cùng lớp nhưng ghi chú/slide khác: mỗi bé hiện đúng phần của mình, không mất và không gộp nhầm.
- Thiếu Slide/Ghi chú: lịch vẫn gửi, cảnh báo đúng tên bé và lớp.
- Cùng lớp nhưng khác GV: mỗi GV nhận đúng phần lịch/tài liệu của ca mình.
- Ca giao GV A nhưng dữ liệu do GV B báo: không lẫn với bé/nhóm khác; có test truy vết nguồn dữ liệu.
- Hai ca của cùng GV có tiêu đề và phân cách rõ, không lẫn bé/tài liệu.
- `node test_sotw.js` PASS toàn bộ; `git diff --check` sạch.
- Tin Telegram thật được anh xem và xác nhận đúng trước khi đóng việc.
