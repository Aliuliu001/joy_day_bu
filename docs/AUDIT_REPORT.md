# BÁO CÁO AUDIT CODE DẠY BÙ
Ngày: 14/10/2026

## 🔍 CÁC VẤN ĐỀ PHÁT HIỆN

### ❌ VẤN ĐỀ 1: Tin nhắn PH dài dòng
**Vị trí:** Hàm `themBeVaoLich()` dòng 370-375  
**Hiện trạng:**
```javascript
var tinPH = 'Dạ em chào chị, em xin thông báo lịch học bù cho bé ' + be.tenBe + ':\n'
    + '• Thời gian: ' + ca.thu + ' ngày ' + ngayHoc + ' lúc ' + ca.gio + '\n'
    + '• GV: ' + ca.gv + '\n'           // ← BỎ dòng này
    + '• Lớp: ' + be.lop + '\n'        // ← BỎ dòng này
    + 'Dạ thời gian này chị có sắp xếp đưa bé đến Trung tâm học bù được không ạ?\n'
    + 'Nhờ chị xác nhận giúp em trước ' + CFG.HAN_PH_XAC_NHAN + ' nhé!\nEm cám ơn chị ạ.';
```
**Lý do:** PH không quan tâm GV nào dạy, lớp nào (vì đây là lịch BÙ, không phải lớp chính)

---

### ⚠️ VẤN ĐỀ 2: Option "🔄 Xin đổi" không có xử lý
**Vị trí:** 
- Khai báo `PH_TRANG_THAI` dòng 48 có '🔄 Xin đổi'
- Nhưng KHÔNG có code nào xử lý khi PH chọn option này

**Hiện trạng:**
- PH chọn "Xin đổi" → cột "PH xác nhận" = "🔄 Xin đổi"
- Nhưng hệ thống không làm gì: không thông báo, không đổi ca, bé vẫn nằm trong LICH_BU

**Workflow cần có:**
```
PH chọn "Xin đổi" 
→ Ms. Vân Anh cần biết để liên hệ PH hỏi lý do
→ Xoá bé khỏi LICH_BU (giải phóng chỗ)
→ Chuyển bé về BAO_BU với ghi chú "PH xin đổi ca"
→ Ms. Vân Anh sẽ xếp lại ca mới sau khi trao đổi với PH
```

---

### ❌ VẤN ĐỀ 3: Lệnh 4 "Đẩy quá hạn" không hiệu quả
**Vị trí:** Hàm `dayQuaHanSangTuanSau()` dòng 426-440

**Logic hiện tại:**
```javascript
// Chỉ đổi cột "PH xác nhận" = "Tuần sau (quá hạn)"
lich.getRange(i + 1, 9).setValue('Tuần sau (quá hạn)');
```

**Vấn đề:**
1. Bé vẫn **nằm trong LICH_BU** với status "Tuần sau (quá hạn)"
2. Chỗ của ca **không được giải phóng** → không xếp bé khác vào được
3. Khi chạy lệnh 2 "Gom nhóm" lần 2, hàm `giuLaiDongDaChot()` chỉ giữ dòng "✅ Đi được", 
   nên bé "Tuần sau (quá hạn)" **BỊ XOÁ MẤT** thay vì chuyển về BAO_BU

**Fix cần làm:**
```
Đẩy quá hạn = XOÁ bé khỏi LICH_BU + CHUYỂN về BAO_BU
- Giải phóng chỗ trong ca
- Bé về BAO_BU với trạng thái trống (để xếp lại tuần sau)
```

---

### ⚠️ VẤN ĐỀ 4: Backup tự động T7 xoá sạch không hỏi
**Vị trí:** 
- Hàm `backupVaRefreshTuanMoi()` dòng 510-569 (backup tự động T7)
- Hàm `backupThuCong()` dòng 503-507 (backup thủ công có xác nhận)

**Hiện trạng:**
- **Backup thủ công:** có popup hỏi trước (dòng 505) ✅
- **Backup tự động T7:** KHÔNG hỏi, chạy thẳng lúc 22h T7

**Vấn đề:**
1. Sau khi backup, BAO_BU và LICH_BU bị xoá sạch (chỉ giữ bé "Tuần sau")
2. Không thể xem lại được bé nào đã xếp, bé nào chưa xác nhận
3. Nếu Ms. Vân Anh đang làm dở việc T7 tối → mất hết data

**Chị đề xuất:**
- Popup hỏi trước khi xoá
- HOẶC cho option: xoá tự động / xoá thủ công

**Nhận xét:** Trigger tự động không thể popup (chạy background). Giải pháp:
1. **Option A:** Backup tự động KHÔNG xoá, chỉ lưu vào sheet Backup. Ms. Vân Anh tự bấm nút "Làm mới tuần mới" khi sẵn sàng
2. **Option B:** Thêm cờ CFG: `TU_DONG_XOA_SAU_BACKUP` (true/false). Nếu false, backup chỉ lưu, không xoá

---

### 🐛 VẤN ĐỀ PHỤ 5: Hàm `giuLaiDongDaChot()` quá hẹp
**Vị trí:** Dòng 389-405

**Logic hiện tại:**
```javascript
// Chỉ giữ dòng có "✅" hoặc "Đi được"
if (st.indexOf('✅') >= 0 || st.indexOf('Đi được') >= 0) giu.push(data[i]);
```

**Vấn đề:** 
- Bé "🔄 Xin đổi" bị XOÁ khi gom nhóm lần 2
- Bé "❌ Nghỉ" cũng bị XOÁ
- Bé "Tuần sau (quá hạn)" cũng bị XOÁ

**Hợp lý hơn:** Chỉ xoá bé "Chờ Ms. Vân Anh" (chưa có phản hồi). Các bé đã có phản hồi nên giữ lại để theo dõi.

---

## 📋 PLAN SỬA CHỮA

### BƯỚC 1: Sửa tin nhắn PH (dễ)
- Bỏ 2 dòng GV và Lớp trong hàm `themBeVaoLich()`

### BƯỚC 2: Xử lý "Xin đổi" (trung bình)
- Thêm hàm `xuLyXinDoi()` 
- Chạy định kỳ (hoặc nút menu): tìm bé "🔄 Xin đổi" → chuyển về BAO_BU
- Gửi tin Telegram thông báo Ms. Vân Anh

### BƯỚC 3: Fix lệnh "Đẩy quá hạn" (khó)
- Thay vì chỉ đổi status, phải:
  1. Lấy thông tin bé từ LICH_BU
  2. Append về BAO_BU với trạng thái trống
  3. XOÁ dòng khỏi LICH_BU

### BƯỚC 4: Cải thiện Backup tự động (khó)
**Option A (khuyến nghị):** Tách backup và refresh
- Backup tự động T7: chỉ APPEND vào sheet Backup, KHÔNG xoá gì
- Thêm nút mới trong menu: "🔄 Làm mới tuần mới" (có xác nhận) → xoá BAO_BU + LICH_BU
- Ms. Vân Anh tự quyết định khi nào làm mới

**Option B:** Thêm cờ bật/tắt tự động xoá
- Thêm `CFG.TU_DONG_XOA_SAU_BACKUP = false` (mặc định)
- Nếu false: backup chỉ lưu, không xoá
- Ms. Vân Anh tự bấm nút xoá khi cần

### BƯỚC 5: Cải thiện `giuLaiDongDaChot()`
- Giữ tất cả bé có phản hồi (✅/🔄/❌/Tuần sau)
- Chỉ xoá bé "Chờ Ms. Vân Anh"

---

## 🎯 ĐỀ XUẤT WORKFLOW MỚI

### Workflow hiện tại (có vấn đề):
```
T2 sáng: Nhắc GV báo bù
T2 chiều: Gom nhóm → copy tin nhắn gửi PH
T3: Đợi PH trả lời
T4: Đẩy quá hạn (nhưng bé vẫn trong LICH_BU - LỖI)
T5-T6: Học bù
T7: Backup tự động + xoá sạch (không hỏi - RỦI RO)
```

### Workflow mới (đề xuất):
```
T2 sáng: Nhắc GV báo bù
T2 chiều: Gom nhóm → tin nhắn PH (ngắn gọn hơn)
T3: Đợi PH trả lời
        ├─ ✅ Đi được → giữ nguyên
        ├─ 🔄 Xin đổi → tự động chuyển về BAO_BU + thông báo Vân Anh
        ├─ ❌ Nghỉ → giữ để theo dõi
        └─ Không trả lời → ...
T4: Đẩy quá hạn → XOÁ khỏi LICH_BU + chuyển về BAO_BU (FIX)
T5-T6: Học bù
        ├─ Gửi tin cho GV (ca đã ✅)
        ├─ Tick "Đã dạy"/"Vắng" sau giờ học
T7 tối: Backup tự động (CHỈ LƯU, không xoá)
Đầu tuần sau: Ms. Vân Anh bấm "Làm mới tuần mới" (CÓ XÁC NHẬN)
```

---

## ✅ CHECKLIST TRƯỚC KHI CODE

- [ ] Chị xác nhận workflow mới
- [ ] Chị chọn Option A hay B cho Backup
- [ ] Chị OK với logic xử lý "Xin đổi" tự động
- [ ] Chị OK với thêm nút "Làm mới tuần mới" vào menu
