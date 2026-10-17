# TASKS - SỬA LỖI CODE DẠY BÙ
Ngày: 14/10/2026

## ✅ ĐÃ DUYỆT BỞI CHỊ NGỌC

---

## 📋 TASK 1: Sửa tin nhắn PH (bỏ GV và Lớp)
**File:** Code.gs  
**Hàm:** `themBeVaoLich()` dòng 368-386  
**Thay đổi:**
```javascript
// TRƯỚC:
var tinPH = 'Dạ em chào chị, em xin thông báo lịch học bù cho bé ' + be.tenBe + ':\n'
    + '• Thời gian: ' + ca.thu + ' ngày ' + ngayHoc + ' lúc ' + ca.gio + '\n'
    + '• GV: ' + ca.gv + '\n'           // ← BỎ
    + '• Lớp: ' + be.lop + '\n'        // ← BỎ
    + 'Dạ thời gian này chị có sắp xếp đưa bé đến Trung tâm học bù được không ạ?\n'
    + 'Nhờ chị xác nhận giúp em trước ' + CFG.HAN_PH_XAC_NHAN + ' nhé!\nEm cám ơn chị ạ.';

// SAU:
var tinPH = 'Dạ em chào chị, em xin thông báo lịch học bù cho bé ' + be.tenBe + ':\n'
    + '• Thời gian: ' + ca.thu + ' ngày ' + ngayHoc + ' lúc ' + ca.gio + '\n'
    + 'Dạ thời gian này chị có sắp xếp đưa bé đến Trung tâm học bù được không ạ?\n'
    + 'Nhờ chị xác nhận giúp em trước ' + CFG.HAN_PH_XAC_NHAN + ' nhé!\nEm cám ơn chị ạ.';
```
**Kết quả:** Tin nhắn ngắn gọn hơn, chỉ có thời gian + tên bé

---

## 📋 TASK 2: Thêm hàm xử lý "Xin đổi"
**File:** Code.gs  
**Thêm hàm mới:** `xuLyXinDoi()`  
**Vị trí:** Sau hàm `dayQuaHanSangTuanSau()` (sau dòng 440)

**Logic:**
1. Đọc tab LICH_BU
2. Tìm tất cả dòng có cột "PH xác nhận" = "🔄 Xin đổi"
3. Với mỗi bé tìm được:
   - Lấy thông tin: tên bé, lớp, trình độ, link Canva, mã ca
   - Append về BAO_BU với: 
     * Ngày báo = hôm nay
     * GV báo = (trống)
     * Tên bé, Lớp, Trình độ, Link Canva = giữ nguyên
     * Trạng thái = (trống - để xếp lại)
     * Ca xếp = (trống)
     * Ghi chú = "PH xin đổi ca [mã ca cũ]"
   - Gửi Telegram: "🔄 PH của bé [tên] xin đổi ca [mã ca]. Ms. Vân Anh vui lòng liên hệ để sắp xếp lại ạ."
   - XOÁ dòng khỏi LICH_BU
4. Báo kết quả: "Đã chuyển X bé 'Xin đổi' về BAO_BU và thông báo Telegram."

**Thêm vào menu:**
```javascript
.addItem('4️⃣ Xử lý bé "Xin đổi"', 'xuLyXinDoi')
.addItem('5️⃣ Đẩy quá hạn sang tuần sau', 'dayQuaHanSangTuanSau')
```
(Đánh số lại từ 4 → 5, các nút sau dịch xuống)

---

## 📋 TASK 3: Fix hàm "Đẩy quá hạn"
**File:** Code.gs  
**Hàm:** `dayQuaHanSangTuanSau()` dòng 426-440  
**Thay đổi:**

**TRƯỚC (chỉ đổi text, không chuyển bé):**
```javascript
function dayQuaHanSangTuanSau() {
  var ss = laySS();
  var lich = ss.getSheetByName('LICH_BU');
  var data = lich.getDataRange().getValues();
  var dem = 0;
  for (var i = 1; i < data.length; i++) {
    if (!data[i][4]) continue;
    var st = (data[i][8] || '').toString().trim();
    if (st === '' || st.indexOf('Chờ') === 0) {
      lich.getRange(i + 1, 9).setValue('Tuần sau (quá hạn)'); // ← Chỉ đổi chữ
      dem++;
    }
  }
  baoXong('Đã đẩy ' + dem + ' bé chưa xác nhận sang tuần sau.');
}
```

**SAU (chuyển về BAO_BU thật sự):**
```javascript
function dayQuaHanSangTuanSau() {
  var ss = laySS();
  var lich = ss.getSheetByName('LICH_BU');
  var bao = ss.getSheetByName('BAO_BU');
  var data = lich.getDataRange().getValues();
  
  var chuyen = []; // Các bé cần chuyển về BAO_BU
  for (var i = 1; i < data.length; i++) {
    if (!data[i][4]) continue; // không có tên bé
    var st = (data[i][8] || '').toString().trim();
    if (st === '' || st.indexOf('Chờ') === 0) {
      // Lưu thông tin bé + chỉ số dòng để xoá sau
      chuyen.push({
        dong: i + 1,
        tenBe: data[i][4],
        lop: data[i][5],
        trinhDo: data[i][6],
        link: data[i][7],
        maCa: data[i][0]
      });
    }
  }
  
  if (chuyen.length === 0) {
    baoXong('Không có bé nào quá hạn chưa xác nhận.');
    return;
  }
  
  // Append về BAO_BU
  chuyen.forEach(function(be) {
    bao.appendRow([
      new Date(),           // Ngày báo
      '',                   // GV báo (trống)
      be.tenBe,             // Tên bé
      be.lop,               // Lớp
      be.trinhDo,           // Trình độ
      be.link,              // Link Canva
      '',                   // Trạng thái (trống - để xếp lại)
      '',                   // Ca xếp (trống)
      'Quá hạn ca ' + be.maCa + ', chuyển từ tuần trước'  // Ghi chú
    ]);
  });
  
  // Xoá từ LICH_BU (xoá từ dưới lên để chỉ số không đổi)
  for (var j = chuyen.length - 1; j >= 0; j--) {
    lich.deleteRow(chuyen[j].dong);
  }
  
  baoXong('Đã chuyển ' + chuyen.length + ' bé quá hạn về BAO_BU (giải phóng chỗ trong ca).');
}
```

**Kết quả:** 
- Bé thật sự về BAO_BU (không mất)
- Chỗ trong ca được giải phóng
- Có thể xếp lại tuần sau

---

## 📋 TASK 4: Tách Backup thành 2 hàm
**File:** Code.gs  
**Thay đổi lớn:**

### 4A. Đổi tên + sửa hàm backup tự động
**Hàm cũ:** `backupVaRefreshTuanMoi()` dòng 510-569  
**→ Đổi tên:** `backupTuanBu()`  
**Thay đổi:**
- **BỎ** toàn bộ phần xoá BAO_BU và LICH_BU (dòng 540-565)
- **GIỮ** phần append vào Backup sheet (dòng 515-538)
- **THÊM** logic chống duplicate:

```javascript
function backupTuanBu() {
  var ss = laySS();
  var lich = ss.getSheetByName('LICH_BU');
  
  // 1. Append LICH_BU vào sheet "Backup tháng MM-YYYY"
  var homNay = new Date();
  var thang = Utilities.formatDate(homNay, 'GMT+7', 'MM-yyyy');
  var tenBackup = 'Backup tháng ' + thang;
  var backup = ss.getSheetByName(tenBackup);
  
  if (!backup) {
    backup = ss.insertSheet(tenBackup);
    backup.appendRow(['Ngày', 'Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'Đã dạy']);
    backup.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#F6F3EE');
  }
  
  // ===== CHỐNG DUPLICATE =====
  var dataBackup = backup.getDataRange().getValues();
  if (dataBackup.length > 1) {
    var dongCuoi = dataBackup[dataBackup.length - 1];
    var ngayCuoi = dongCuoi[0];
    if (ngayCuoi) {
      var ngayCuoiStr = Utilities.formatDate(new Date(ngayCuoi), 'GMT+7', 'dd/MM/yyyy');
      var homNayStr = Utilities.formatDate(homNay, 'GMT+7', 'dd/MM/yyyy');
      if (ngayCuoiStr === homNayStr) {
        baoXong('⚠️ Hôm nay đã backup rồi (dòng cuối: ' + ngayCuoiStr + '). Không backup nữa để tránh trùng.');
        return;
      }
    }
  }
  
  // Chỉ append dòng đã ✅ Đi được
  var dataLich = lich.getDataRange().getValues();
  var ngay = Utilities.formatDate(homNay, 'GMT+7', 'dd/MM/yyyy');
  var dem = 0;
  for (var i = 1; i < dataLich.length; i++) {
    var st = (dataLich[i][8] || '').toString();
    if (st.indexOf('✅') >= 0 || st.indexOf('Đi được') >= 0) {
      backup.appendRow([
        ngay, 
        dataLich[i][0],  // Ca
        dataLich[i][1],  // Thứ
        dataLich[i][2],  // Giờ
        dataLich[i][3],  // GV dạy
        dataLich[i][4],  // Tên bé
        dataLich[i][5],  // Lớp
        dataLich[i][11]  // Đã dạy
      ]);
      dem++;
    }
  }
  
  baoXong('✅ Đã backup ' + dem + ' bé vào sheet "' + tenBackup + '".\n\n'
    + '⚠️ LƯU Ý: Backup chỉ LƯU dữ liệu, KHÔNG xoá gì.\n'
    + 'Khi sẵn sàng làm mới tuần mới, bấm nút "9️⃣ Làm mới tuần mới".');
}
```

### 4B. Tạo hàm mới "Làm mới tuần mới"
**Hàm mới:** `lamMoiTuanMoi()`  
**Vị trí:** Sau hàm `backupTuanBu()`

```javascript
function lamMoiTuanMoi() {
  // Hỏi xác nhận (quan trọng!)
  if (!xacNhan('Việc này sẽ XOÁ TRẮNG BAO_BU và LICH_BU (giữ lại bé "Tuần sau").\n\n'
    + '⚠️ Chỉ làm khi chị đã backup xong và sẵn sàng bắt đầu tuần mới.\n\nTiếp tục?')) {
    return;
  }
  
  var ss = laySS();
  var lich = ss.getSheetByName('LICH_BU');
  var bao = ss.getSheetByName('BAO_BU');
  
  // 1. Lấy các bé "Tuần sau" từ LICH_BU
  var dataLich = lich.getDataRange().getValues();
  var chuyenTuanSau = [];
  for (var i = 1; i < dataLich.length; i++) {
    var st = (dataLich[i][8] || '').toString();
    if (st.indexOf('Tuần sau') === 0 && dataLich[i][4]) {
      chuyenTuanSau.push([
        new Date(),         // Ngày báo
        '',                 // GV báo
        dataLich[i][4],     // Tên bé
        dataLich[i][5],     // Lớp
        dataLich[i][6],     // Trình độ
        dataLich[i][7],     // Link Canva
        '',                 // Trạng thái
        '',                 // Ca xếp
        'Chuyển từ tuần trước'  // Ghi chú
      ]);
    }
  }
  
  // 2. Clear LICH_BU (giữ tiêu đề)
  lich.clear();
  lich.appendRow(['Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'PH xác nhận', 'Tin nhắn PH', 'Tin nhắn GV', 'Đã dạy']);
  lich.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#F6F3EE');
  datDropdown(lich, 9, 200, PH_TRANG_THAI);
  datDropdown(lich, 12, 200, DA_DAY);
  
  // 3. Làm mới BAO_BU: xoá nội dung (giữ tiêu đề + dòng mẫu)
  var dataBao = bao.getDataRange().getValues();
  var batDau = 2;
  if (dataBao.length >= 2 && (dataBao[1][2] || '').toString().toLowerCase().indexOf('ghi chú mẫu') >= 0) {
    batDau = 3;
  }
  
  // Lấy các bé "Tuần sau" từ BAO_BU (nếu có)
  for (var j = batDau - 1; j < dataBao.length; j++) {
    var r = dataBao[j];
    if (!r[2]) continue;
    if ((r[6] || '').toString().indexOf('Tuần sau') === 0) {
      chuyenTuanSau.push([
        r[0] || new Date(), 
        r[1], 
        r[2], 
        r[3], 
        r[4], 
        r[5], 
        '',  // Trạng thái trống
        '', 
        'Chuyển từ tuần trước'
      ]);
    }
  }
  
  // Xoá nội dung từ dòng batDau trở đi
  if (dataBao.length >= batDau) {
    bao.getRange(batDau, 1, dataBao.length - batDau + 1, 9).clearContent();
  }
  
  // 4. Đưa bé "Tuần sau" về BAO_BU
  if (chuyenTuanSau.length > 0) {
    bao.getRange(batDau, 1, chuyenTuanSau.length, 9).setValues(chuyenTuanSau);
  }
  
  baoXong('✅ Đã làm mới BAO_BU + LICH_BU cho tuần mới.\n'
    + (chuyenTuanSau.length > 0 ? 'Giữ lại ' + chuyenTuanSau.length + ' bé "Tuần sau" trong BAO_BU.' : 'Không có bé nào chuyển tuần sau.'));
}
```

### 4C. Sửa hàm "Backup thủ công"
**Hàm:** `backupThuCong()` dòng 503-507  
**Thay đổi:**
```javascript
// TRƯỚC:
function backupThuCong() {
  if (!xacNhan('Backup sẽ lưu các ca ✅ rồi LÀM MỚI BAO_BU + LICH_BU...')) return;
  backupVaRefreshTuanMoi();  // ← Gọi hàm cũ (đã đổi tên)
}

// SAU:
function backupThuCong() {
  // Chỉ backup, không xoá gì
  backupTuanBu();
}
```

### 4D. Sửa trigger tự động T7
**Hàm:** `setupTriggerTuanBu()` dòng 572-587  
**Thay đổi:**
```javascript
// Dòng 576: Đổi tên hàm trigger
if (triggers[i].getHandlerFunction() === 'backupTuanBu') {  // ← Trước đây: 'backupVaRefreshTuanMoi'
  ScriptApp.deleteTrigger(triggers[i]);
}

// Dòng 581: Đổi tên hàm gọi
ScriptApp.newTrigger('backupTuanBu')  // ← Trước đây: 'backupVaRefreshTuanMoi'
  .timeBased()
  .onWeekDay(ScriptApp.WeekDay.SATURDAY)
  .atHour(22)
  .create();

// Dòng 586: Đổi thông báo
baoXong('Đã cài trigger tự động: mỗi tối T7 22h tự BACKUP (không xoá gì) ✅');
```

### 4E. Cập nhật menu
**Hàm:** `onOpen()` dòng 107-121  
**Thay đổi:**
```javascript
SpreadsheetApp.getUi()
  .createMenu('📚 Dạy Bù')
  .addItem('1️⃣ Tạo sheet (chạy 1 lần)', 'setupDayBu')
  .addItem('2️⃣ Gom nhóm (bấm chiều T2)', 'gomNhom')
  .addItem('3️⃣ Gửi tin cho GV (ca đã chốt ✅)', 'guiTinChoGV')
  .addItem('4️⃣ Xử lý bé "Xin đổi"', 'xuLyXinDoi')           // ← MỚI
  .addItem('5️⃣ Đẩy quá hạn sang tuần sau', 'dayQuaHanSangTuanSau')
  .addItem('6️⃣ Nhắc GV báo bù (sáng T2)', 'nhacGVBaoBu')
  .addItem('7️⃣ Backup thủ công', 'backupThuCong')
  .addItem('8️⃣ Làm mới thống kê', 'lamMoiThongKe')
  .addItem('9️⃣ Làm mới tuần mới', 'lamMoiTuanMoi')          // ← MỚI
  .addItem('🔧 Cài backup tự động T7', 'setupTriggerTuanBu')
  .addToUi();
```

---

## 🎯 TÓM TẮT THAY ĐỔI

| Task | File | Hàm | Thay đổi |
|------|------|-----|----------|
| 1 | Code.gs | `themBeVaoLich()` | Bỏ 2 dòng GV và Lớp trong tin nhắn PH |
| 2 | Code.gs | `xuLyXinDoi()` (MỚI) | Tự động chuyển bé "Xin đổi" về BAO_BU + gửi Telegram |
| 3 | Code.gs | `dayQuaHanSangTuanSau()` | Chuyển bé về BAO_BU thật sự (không chỉ đổi chữ) |
| 4A | Code.gs | `backupVaRefreshTuanMoi()` → `backupTuanBu()` | CHỈ backup, KHÔNG xoá gì + chống duplicate |
| 4B | Code.gs | `lamMoiTuanMoi()` (MỚI) | Xoá BAO_BU + LICH_BU (có hỏi trước) |
| 4C | Code.gs | `backupThuCong()` | Gọi `backupTuanBu()` thay vì hàm cũ |
| 4D | Code.gs | `setupTriggerTuanBu()` | Đổi tên hàm trigger + thông báo |
| 4E | Code.gs | `onOpen()` | Thêm 2 nút mới vào menu |

---

## ✅ CHECKLIST TRƯỚC KHI CODE

- [x] Chị đã đọc và hiểu tất cả thay đổi
- [ ] Chị xác nhận: "OK, làm đi"
- [ ] Em sẽ code, test, push lên GitHub
- [ ] Chị copy vào Apps Script + Deploy phiên bản mới

---

## 📝 GHI CHÚ QUAN TRỌNG

1. **Chống duplicate backup:** Nếu backup hôm nay đã chạy rồi (kiểm tra dòng cuối trong sheet Backup), sẽ BỎ QUA và báo "Hôm nay đã backup".

2. **Workflow mới:**
   - **T7 tối 22h:** Trigger tự động chạy `backupTuanBu()` → CHỈ lưu backup, KHÔNG xoá gì
   - **Đầu tuần mới (khi chị sẵn sàng):** Bấm nút "9️⃣ Làm mới tuần mới" → Có popup hỏi → Xoá BAO_BU + LICH_BU

3. **An toàn:** Chị có thể backup nhiều lần (nếu quên) mà không lo duplicate. Chỉ xoá khi chị chủ động bấm nút.

4. **Xử lý "Xin đổi":** Chạy bất cứ khi nào cần (không cần đợi T4). Tìm bé "Xin đổi" → chuyển về BAO_BU → gửi Telegram báo chị.
