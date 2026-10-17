# PLAN CUỐI CÙNG - SỬA LỖI CODE DẠY BÙ
Ngày: 14/10/2026
Sau khi review theo yêu cầu của chị Ngọc

---

## 🔍 VẤN ĐỀ CHỊ PHÁT HIỆN (CỰC QUAN TRỌNG!)

### ❌ VẤN ĐỀ LOGIC: Bé chuyển về BAO_BU sẽ BỊ XOÁ khi "Làm mới tuần mới"

**Tình huống:**
1. T4: Bé bị "Quá hạn" → chuyển về BAO_BU (trạng thái trống, ca xếp trống)
2. T7: Backup tự động (chỉ lưu, không xoá)
3. **Đầu tuần sau:** Chị bấm "Làm mới tuần mới"
   - Hàm `lamMoiTuanMoi()` chỉ giữ bé có ghi chú "Tuần sau"
   - Bé vừa chuyển về từ "Quá hạn" **BỊ XOÁ MẤT!** ❌

**NGUYÊN NHÂN:** Logic trong `lamMoiTuanMoi()` quá hẹp, chỉ giữ "Tuần sau" thay vì giữ TẤT CẢ bé chưa xếp.

**GIẢI PHÁP:** 
- Khi "Làm mới tuần mới", GIỮ LẠI tất cả bé trong BAO_BU có:
  - **Cột "Ca xếp" (cột 8) = TRỐNG** → chưa xếp, cần giữ lại
  - KHÔNG quan tâm Ghi chú là gì ("Tuần sau", "Quá hạn", "Xin đổi"...)

---

## 📋 4 YÊU CẦU MỚI CỦA CHỊ NGỌC

### 1. Gộp "Xin đổi" + "Quá hạn" thành 1 nút
✅ **OK** - Sẽ gộp thành nút **"4️⃣ Xử lý case đặc biệt"**

### 2. Trạng thái khi chuyển về BAO_BU để không bị xoá
✅ **ĐÃ GIẢI QUYẾT** - Logic mới:
- Khi chuyển về BAO_BU: để **Ca xếp = trống**
- Khi "Làm mới tuần mới": giữ tất cả bé có **Ca xếp = trống**

### 3. Case "Nghỉ" (❌ Nghỉ) - không bù, không xếp lại
✅ **OK** - Khi PH chọn "❌ Nghỉ":
- Dòng vẫn trong LICH_BU (để backup)
- **Backup sẽ lưu** dòng này (để theo dõi)
- Khi "Làm mới tuần mới" → XOÁ (không chuyển về BAO_BU)

### 4. Check logic và gộp lệnh
✅ **ĐÃ REVIEW** - Kết quả dưới đây

---

## 🎯 WORKFLOW THỰC TẾ (SAU KHI SỬA)

```
T2 SÁNG:
  ├─ Nút 1: Nhắc GV báo bù (có thể tự động hóa bằng trigger sáng T2)

T2 CHIỀU:
  ├─ Nút 2: Gom nhóm
  │    ├─ Đọc BAO_BU (bé chưa xếp: Ca xếp = trống)
  │    ├─ Xếp vào LICH_BU
  │    └─ Tạo tin nhắn PH (ngắn gọn: chỉ có thời gian + tên bé)
  │
  └─ THỦ CÔNG: Copy tin nhắn gửi Zalo cho PH

T3-T4: ĐỢI PH TRẢ LỜI
  ├─ ✅ Đi được → OK, giữ nguyên
  ├─ 🔄 Xin đổi → cần xử lý
  ├─ ❌ Nghỉ → không bù (backup rồi xoá)
  └─ (Không trả lời) → Chờ Ms. Vân Anh → quá hạn

T4 CHIỀU:
  └─ Nút 3: Xử lý case đặc biệt (GỘP "Xin đổi" + "Quá hạn")
       ├─ Tìm bé "🔄 Xin đổi" → chuyển về BAO_BU
       ├─ Tìm bé "Chờ Ms. Vân Anh" → chuyển về BAO_BU
       ├─ Ghi chú: "Xin đổi ca XXX" / "Quá hạn ca XXX"
       ├─ XOÁ khỏi LICH_BU (giải phóng chỗ)
       └─ Gửi Telegram tổng hợp cho Ms. Vân Anh

T5-T6: HỌC BÙ
  ├─ Nút 4: Gửi tin cho GV (chỉ ca ✅ Đi được)
  └─ THỦ CÔNG: Tick "Đã dạy" / "Vắng" sau giờ học

T7 TỐI 22H:
  └─ TRIGGER TỰ ĐỘNG: Backup
       ├─ Lưu tất cả ca có phản hồi (✅ Đi được, ❌ Nghỉ, Vắng...)
       ├─ KHÔNG lưu "Chờ Ms. Vân Anh" (chưa có phản hồi)
       ├─ Chống duplicate (nếu hôm nay đã backup)
       └─ KHÔNG xoá gì

ĐẦU TUẦN SAU (khi Ms. Vân Anh sẵn sàng):
  └─ Nút 5: Làm mới tuần mới
       ├─ Hỏi xác nhận
       ├─ GIỮ LẠI: tất cả bé trong BAO_BU có "Ca xếp" = trống
       │   (bao gồm: bé mới báo, bé "Quá hạn", bé "Xin đổi", bé hết chỗ...)
       ├─ XOÁ LICH_BU (đã backup rồi)
       └─ XOÁ BAO_BU (giữ tiêu đề + dòng mẫu + bé chưa xếp)
```

---

## 🔧 MENU MỚI (GỌN HỠN, LOGIC HƠN)

```
📚 DẠY BÙ
├─ 1️⃣ Gom nhóm (T2 chiều)
├─ 2️⃣ Xử lý case đặc biệt (T4: Xin đổi + Quá hạn)
├─ 3️⃣ Gửi tin cho GV (T5-T6: ca đã ✅)
├─ 4️⃣ Làm mới tuần mới (đầu tuần sau)
├─ ─────────────────
├─ 📊 Làm mới thống kê
├─ 🔔 Nhắc GV báo bù (sáng T2)
├─ 💾 Backup thủ công
├─ ⚙️ Cài trigger tự động
└─ 🔨 Tạo sheet (chạy 1 lần)
```

**Lý do thay đổi:**
- Bỏ nút riêng "Xin đổi" và "Quá hạn" → gộp thành "Xử lý case đặc biệt"
- Đưa 4 nút chính lên đầu (theo thứ tự workflow)
- Các nút phụ (thống kê, trigger...) xuống dưới
- Nút "Tạo sheet" (chỉ chạy 1 lần) xuống cuối

---

## 📝 CHI TIẾT CÁC TASK SỬA CODE

### TASK 1: Sửa tin nhắn PH (giữ nguyên từ plan cũ)
**File:** Code.gs  
**Hàm:** `themBeVaoLich()` dòng 368-386  
**Thay đổi:** Bỏ 2 dòng GV và Lớp

```javascript
var tinPH = 'Dạ em chào chị, em xin thông báo lịch học bù cho bé ' + be.tenBe + ':\n'
    + '• Thời gian: ' + ca.thu + ' ngày ' + ngayHoc + ' lúc ' + ca.gio + '\n'
    + 'Dạ thời gian này chị có sắp xếp đưa bé đến Trung tâm học bù được không ạ?\n'
    + 'Nhờ chị xác nhận giúp em trước ' + CFG.HAN_PH_XAC_NHAN + ' nhé!\nEm cám ơn chị ạ.';
```

---

### TASK 2: Hàm xử lý case đặc biệt (GỘP "Xin đổi" + "Quá hạn")
**File:** Code.gs  
**Hàm mới:** `xuLyCaseDacBiet()`  
**Vị trí:** Sau hàm `toDoCa3TrinhDo()` (sau dòng 422)

```javascript
// ===== XỬ LÝ CASE ĐẶC BIỆT (Xin đổi + Quá hạn) =====
function xuLyCaseDacBiet() {
  var ss = laySS();
  var lich = ss.getSheetByName('LICH_BU');
  var bao = ss.getSheetByName('BAO_BU');
  
  if (!lich || !bao) {
    baoXong('Chưa có sheet LICH_BU hoặc BAO_BU.');
    return;
  }
  
  var data = lich.getDataRange().getValues();
  var chuyen = []; // Các bé cần chuyển về BAO_BU
  
  for (var i = 1; i < data.length; i++) {
    if (!data[i][4]) continue; // không có tên bé
    
    var st = (data[i][8] || '').toString().trim();
    var loai = '';
    
    // Kiểm tra: Xin đổi HOẶC Quá hạn (Chờ Ms. Vân Anh)
    if (st.indexOf('🔄') >= 0 || st.indexOf('Xin đổi') >= 0) {
      loai = 'Xin đổi';
    } else if (st === '' || st.indexOf('Chờ') === 0) {
      loai = 'Quá hạn';
    }
    
    if (loai) {
      chuyen.push({
        dong: i + 1,
        loai: loai,
        tenBe: data[i][4],
        lop: data[i][5],
        trinhDo: data[i][6],
        link: data[i][7],
        maCa: data[i][0],
        thu: data[i][1],
        gio: data[i][2]
      });
    }
  }
  
  if (chuyen.length === 0) {
    baoXong('Không có bé nào cần xử lý (không có "Xin đổi" hay "Quá hạn").');
    return;
  }
  
  // Hỏi xác nhận
  var danhSach = chuyen.map(function(be, idx) {
    return (idx + 1) + '. ' + be.tenBe + ' (' + be.loai + ' ca ' + be.maCa + ')';
  }).join('\n');
  
  if (!xacNhan('Tìm thấy ' + chuyen.length + ' bé cần xử lý:\n\n' + danhSach 
    + '\n\nChuyển về BAO_BU để xếp lại?')) {
    return;
  }
  
  // Chuyển về BAO_BU
  var demXinDoi = 0, demQuaHan = 0;
  chuyen.forEach(function(be) {
    var ghiChu = be.loai + ' ca ' + be.maCa + ' (' + be.thu + ' ' + be.gio + ')';
    bao.appendRow([
      new Date(),           // Ngày báo
      '',                   // GV báo (trống)
      be.tenBe,             // Tên bé
      be.lop,               // Lớp
      be.trinhDo,           // Trình độ
      be.link,              // Link Canva
      '',                   // Trạng thái (trống - chưa xếp)
      '',                   // Ca xếp (trống - ĐÂY LÀ DẤU HIỆU GIỮ LẠI)
      ghiChu                // Ghi chú
    ]);
    
    if (be.loai === 'Xin đổi') demXinDoi++;
    else demQuaHan++;
  });
  
  // Xoá khỏi LICH_BU (xoá từ dưới lên)
  for (var j = chuyen.length - 1; j >= 0; j--) {
    lich.deleteRow(chuyen[j].dong);
  }
  
  // Gửi Telegram tổng hợp
  var tin = '🔔 [XỬ LÝ CASE ĐẶC BIỆT]\n\n';
  if (demXinDoi > 0) {
    tin += '🔄 ' + demXinDoi + ' bé PH xin đổi ca:\n';
    chuyen.filter(function(be) { return be.loai === 'Xin đổi'; })
      .forEach(function(be) {
        tin += '  • ' + be.tenBe + ' (ca ' + be.maCa + ')\n';
      });
    tin += '\n';
  }
  if (demQuaHan > 0) {
    tin += '⏰ ' + demQuaHan + ' bé quá hạn chưa xác nhận:\n';
    chuyen.filter(function(be) { return be.loai === 'Quá hạn'; })
      .forEach(function(be) {
        tin += '  • ' + be.tenBe + ' (ca ' + be.maCa + ')\n';
      });
    tin += '\n';
  }
  tin += '✅ Đã chuyển về BAO_BU để Ms. Vân Anh xếp lại.\n'
    + 'Các ca đã giải phóng chỗ, có thể xếp bé khác vào.';
  
  if (guiTelegram(tin)) {
    baoXong('Đã chuyển ' + chuyen.length + ' bé về BAO_BU và gửi Telegram ✅\n\n'
      + 'Chi tiết:\n• Xin đổi: ' + demXinDoi + '\n• Quá hạn: ' + demQuaHan);
  } else {
    baoXong('Đã chuyển ' + chuyen.length + ' bé về BAO_BU, nhưng gửi Telegram thất bại.\n'
      + 'Xem lỗi ở Nhật ký thực thi.');
  }
}
```

**LƯU Ý QUAN TRỌNG:**
- Khi append về BAO_BU: **Cột "Ca xếp" (cột 8) = TRỐNG**
- Đây là dấu hiệu để hàm `lamMoiTuanMoi()` GIỮ LẠI bé này

---

### TASK 3: Sửa hàm "Làm mới tuần mới" (QUAN TRỌNG!)
**File:** Code.gs  
**Hàm:** `lamMoiTuanMoi()` (hàm mới, thay thế logic cũ)  
**Vị trí:** Sau hàm `backupTuanBu()`

**LOGIC MỚI:**
- GIỮ LẠI tất cả bé trong BAO_BU có **"Ca xếp" = trống**
- KHÔNG chỉ giữ "Tuần sau" (quá hẹp!)

```javascript
// ===== LÀM MỚI TUẦN MỚI =====
function lamMoiTuanMoi() {
  // Hỏi xác nhận (quan trọng!)
  if (!xacNhan('Việc này sẽ XOÁ TRẮNG BAO_BU và LICH_BU.\n\n'
    + '✅ Giữ lại: tất cả bé trong BAO_BU chưa xếp (Ca xếp = trống)\n'
    + '❌ Xoá: LICH_BU (đã backup rồi)\n\n'
    + '⚠️ Chỉ làm khi đã backup xong và sẵn sàng bắt đầu tuần mới.\n\nTiếp tục?')) {
    return;
  }
  
  var ss = laySS();
  var lich = ss.getSheetByName('LICH_BU');
  var bao = ss.getSheetByName('BAO_BU');
  
  if (!lich || !bao) {
    baoXong('Chưa có sheet LICH_BU hoặc BAO_BU.');
    return;
  }
  
  // 1. Lấy các bé CHƯA XẾP từ BAO_BU (Ca xếp = trống)
  var dataBao = bao.getDataRange().getValues();
  var batDau = 2; // Bỏ qua tiêu đề
  if (dataBao.length >= 2 && (dataBao[1][2] || '').toString().toLowerCase().indexOf('ghi chú mẫu') >= 0) {
    batDau = 3; // Bỏ qua dòng mẫu
  }
  
  var giuLai = [];
  for (var i = batDau - 1; i < dataBao.length; i++) {
    var r = dataBao[i];
    if (!r[2]) continue; // không có tên bé
    
    var caXep = (r[7] || '').toString().trim(); // Cột H (index 7) = Ca xếp
    
    // GIỮ LẠI nếu "Ca xếp" = trống (chưa xếp)
    if (caXep === '') {
      giuLai.push([
        r[0] || new Date(),  // Ngày báo
        r[1],                // GV báo
        r[2],                // Tên bé
        r[3],                // Lớp
        r[4],                // Trình độ
        r[5],                // Link Canva
        '',                  // Trạng thái (trống)
        '',                  // Ca xếp (trống)
        r[8] || ''           // Ghi chú (giữ nguyên)
      ]);
    }
  }
  
  // 2. Clear LICH_BU (giữ tiêu đề)
  lich.clear();
  lich.appendRow(['Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'PH xác nhận', 'Tin nhắn PH', 'Tin nhắn GV', 'Đã dạy']);
  lich.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#F6F3EE');
  datDropdown(lich, 9, 200, PH_TRANG_THAI);
  datDropdown(lich, 12, 200, DA_DAY);
  
  // 3. Clear BAO_BU (giữ tiêu đề + dòng mẫu)
  if (dataBao.length >= batDau) {
    bao.getRange(batDau, 1, dataBao.length - batDau + 1, 9).clearContent();
  }
  
  // 4. Đưa bé chưa xếp trở lại BAO_BU
  if (giuLai.length > 0) {
    bao.getRange(batDau, 1, giuLai.length, 9).setValues(giuLai);
  }
  
  baoXong('✅ Đã làm mới BAO_BU + LICH_BU cho tuần mới.\n\n'
    + (giuLai.length > 0 
      ? '📝 Giữ lại ' + giuLai.length + ' bé chưa xếp trong BAO_BU:\n'
        + '   (bao gồm: bé mới báo, Quá hạn, Xin đổi, hết chỗ...)'
      : '✨ Không có bé nào chưa xếp.'));
}
```

**ĐIỂM KHÁC BIỆT VỚI LOGIC CŨ:**
- **CŨ:** Chỉ giữ bé có ghi chú "Tuần sau" → SAI, mất bé "Quá hạn", "Xin đổi"
- **MỚI:** Giữ tất cả bé có "Ca xếp" = trống → ĐÚNG, không mất bé nào

---

### TASK 4: Sửa hàm Backup (lưu cả "Nghỉ")
**File:** Code.gs  
**Hàm:** `backupTuanBu()` (đổi tên từ `backupVaRefreshTuanMoi()`)

**THAY ĐỔI:**
- **TRƯỚC:** Chỉ lưu "✅ Đi được"
- **SAU:** Lưu TẤT CẢ ca có phản hồi (✅ Đi được, ❌ Nghỉ, Vắng...)
- **KHÔNG lưu:** "Chờ Ms. Vân Anh" (chưa có phản hồi → sẽ xử lý bằng nút "Xử lý case đặc biệt")

```javascript
function backupTuanBu() {
  var ss = laySS();
  var lich = ss.getSheetByName('LICH_BU');
  
  if (!lich) {
    baoXong('Chưa có sheet LICH_BU.');
    return;
  }
  
  // 1. Tạo/mở sheet Backup
  var homNay = new Date();
  var thang = Utilities.formatDate(homNay, 'GMT+7', 'MM-yyyy');
  var tenBackup = 'Backup tháng ' + thang;
  var backup = ss.getSheetByName(tenBackup);
  
  if (!backup) {
    backup = ss.insertSheet(tenBackup);
    backup.appendRow(['Ngày', 'Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'PH xác nhận', 'Đã dạy']);
    backup.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#F6F3EE');
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
        baoXong('⚠️ Hôm nay đã backup rồi (' + ngayCuoiStr + '). Không backup nữa.');
        return;
      }
    }
  }
  
  // 2. Lưu TẤT CẢ ca có phản hồi (✅, ❌, Vắng...)
  var dataLich = lich.getDataRange().getValues();
  var ngay = Utilities.formatDate(homNay, 'GMT+7', 'dd/MM/yyyy');
  var dem = 0;
  
  for (var i = 1; i < dataLich.length; i++) {
    if (!dataLich[i][4]) continue; // không có tên bé
    
    var st = (dataLich[i][8] || '').toString().trim();
    
    // LƯU nếu có phản hồi (KHÔNG phải "Chờ Ms. Vân Anh" hay trống)
    if (st !== '' && st.indexOf('Chờ') !== 0) {
      backup.appendRow([
        ngay,               // Ngày
        dataLich[i][0],     // Ca
        dataLich[i][1],     // Thứ
        dataLich[i][2],     // Giờ
        dataLich[i][3],     // GV dạy
        dataLich[i][4],     // Tên bé
        dataLich[i][5],     // Lớp
        st,                 // PH xác nhận (✅/❌/🔄...)
        dataLich[i][11]     // Đã dạy
      ]);
      dem++;
    }
  }
  
  if (dem === 0) {
    baoXong('⚠️ Không có ca nào để backup (tất cả đang "Chờ Ms. Vân Anh").');
    return;
  }
  
  baoXong('✅ Đã backup ' + dem + ' bé vào "' + tenBackup + '".\n\n'
    + '📝 Bao gồm: Đi được, Nghỉ, Vắng (tất cả đã có phản hồi)\n'
    + '⚠️ Backup CHỈ LƯU, không xoá gì.\n\n'
    + 'Khi sẵn sàng tuần mới, bấm "Làm mới tuần mới".');
}
```

**CHÚ THÍCH:** 
- Thêm cột "PH xác nhận" vào Backup để biết bé đi/nghỉ/xin đổi
- Giúp theo dõi tốt hơn

---

### TASK 5: Cập nhật menu (GỌN HƠN, LOGIC HƠN)
**File:** Code.gs  
**Hàm:** `onOpen()` dòng 107-121

```javascript
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('📚 Dạy Bù')
      // ===== WORKFLOW CHÍNH (theo thứ tự thời gian) =====
      .addItem('1️⃣ Gom nhóm (T2 chiều)', 'gomNhom')
      .addItem('2️⃣ Xử lý case đặc biệt (T4)', 'xuLyCaseDacBiet')
      .addItem('3️⃣ Gửi tin cho GV (T5-T6)', 'guiTinChoGV')
      .addItem('4️⃣ Làm mới tuần mới (tuần sau)', 'lamMoiTuanMoi')
      .addSeparator()
      // ===== CÔNG CỤ PHỤ =====
      .addItem('📊 Làm mới thống kê', 'lamMoiThongKe')
      .addItem('🔔 Nhắc GV báo bù (sáng T2)', 'nhacGVBaoBu')
      .addItem('💾 Backup thủ công', 'backupThuCong')
      .addSeparator()
      // ===== CÀI ĐẶT =====
      .addItem('⚙️ Cài trigger tự động', 'setupTriggerTuanBu')
      .addItem('🔨 Tạo sheet (chỉ chạy 1 lần)', 'setupDayBu')
      .addToUi();
  } catch (e) {}
}
```

**THAY ĐỔI:**
- Bỏ nút riêng "Xin đổi" và "Quá hạn"
- Gộp thành nút 2: "Xử lý case đặc biệt"
- Sắp xếp theo workflow thực tế
- Dùng `addSeparator()` để phân nhóm rõ ràng

---

### TASK 6: Bỏ/sửa hàm không dùng
**File:** Code.gs

1. **BỎ hàm:** `dayQuaHanSangTuanSau()` (đã gộp vào `xuLyCaseDacBiet()`)
2. **BỎ hàm:** `xuLyXinDoi()` (đã gộp vào `xuLyCaseDacBiet()`)
3. **ĐỔI TÊN:** `backupVaRefreshTuanMoi()` → `backupTuanBu()`
4. **SỬA hàm:** `setupTriggerTuanBu()` - đổi tên hàm trong trigger
5. **SỬA hàm:** `backupThuCong()` - gọi `backupTuanBu()` thay vì hàm cũ

---

## ✅ CHECKLIST LOGIC (ĐÃ REVIEW)

### ✅ Vấn đề 1: Bé chuyển về BAO_BU bị xoá
**ĐÃ GIẢI QUYẾT:**
- Khi chuyển về BAO_BU: Ca xếp = trống
- Khi "Làm mới tuần mới": giữ tất cả bé có Ca xếp = trống

### ✅ Vấn đề 2: Case "Nghỉ" không xử lý
**ĐÃ GIẢI QUYẾT:**
- Backup sẽ lưu bé "❌ Nghỉ" (để theo dõi)
- "Làm mới tuần mới" sẽ xoá (không chuyển về BAO_BU)

### ✅ Vấn đề 3: Menu lộn xộn
**ĐÃ GIẢI QUYẾT:**
- Gộp 2 nút thành 1: "Xử lý case đặc biệt"
- Sắp xếp theo workflow
- Phân nhóm rõ ràng

### ✅ Vấn đề 4: Backup duplicate
**ĐÃ GIẢI QUYẾT:**
- Kiểm tra dòng cuối trong Backup sheet
- Nếu trùng ngày hôm nay → bỏ qua

### ✅ Vấn đề 5: Hàm `giuLaiDongDaChot()` không dùng nữa
**GHI CHÚ:**
- Hàm này vẫn dùng trong `gomNhom()` để xoá bé chưa chốt khi gom lại
- GIỮ NGUYÊN, không sửa

---

## 📊 SO SÁNH LOGIC CŨ VS MỚI

| Tình huống | Logic CŨ | Logic MỚI |
|------------|----------|-----------|
| Bé "Xin đổi" | Nút riêng → chuyển về BAO_BU | Gộp vào nút "Xử lý case" |
| Bé "Quá hạn" | Nút riêng → chỉ đổi chữ ❌ | Gộp vào nút "Xử lý case" |
| Bé "Nghỉ" | Không xử lý | Backup → xoá (không xếp lại) |
| Làm mới tuần | Chỉ giữ "Tuần sau" ❌ | Giữ tất cả "Ca xếp = trống" ✅ |
| Backup | Chỉ lưu "✅" | Lưu tất cả (✅/❌/Vắng) |
| Backup duplicate | Không check | Chống duplicate ✅ |
| Menu | 10 nút lộn xộn | 9 nút, phân nhóm rõ ràng |

---

## 🎯 KẾT LUẬN

### ĐÃ GIẢI QUYẾT:
✅ Gộp "Xin đổi" + "Quá hạn" thành 1 nút  
✅ Fix logic "Làm mới tuần mới" giữ đúng bé  
✅ Xử lý case "Nghỉ" đúng (backup → xoá)  
✅ Chống duplicate backup  
✅ Menu gọn hơn, logic hơn  
✅ Tất cả case đặc biệt được xử lý đúng  

### SỐ LƯỢNG THAY ĐỔI:
- 6 tasks chính
- 3 hàm mới: `xuLyCaseDacBiet()`, `lamMoiTuanMoi()`, `backupTuanBu()`
- 2 hàm bỏ: `dayQuaHanSangTuanSau()`, `xuLyXinDoi()` (từ plan cũ)
- 1 hàm đổi tên: `backupVaRefreshTuanMoi()` → `backupTuanBu()`
- Menu: 10 nút → 9 nút (gọn hơn)

---

## 🚀 SẴN SÀNG CODE

**CHỜ CHỊ NGỌC XÁC NHẬN:**
- [ ] Logic đã đúng hết chưa?
- [ ] Workflow mới có hợp lý không?
- [ ] Menu mới có OK không?
- [ ] Còn thiếu gì không?

**SAU KHI CHỊ XÁC NHẬN "OK":**
→ Em sẽ code, test, push lên GitHub ngay ạ!
