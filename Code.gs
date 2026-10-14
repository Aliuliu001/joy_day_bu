/****************************************************
 * JOY DẠY BÙ — Code.gs (bản mới 14/10/2026)
 * Chạy trong Google Apps Script (gắn với Google Sheet DẠY BÙ)
 * Cách dùng: copy toàn bộ file này vào Apps Script → chạy setupDayBu() 1 lần
 * 
 * THAY ĐỔI MỚI:
 * - Tin nhắn PH ngắn gọn hơn (bỏ GV và Lớp)
 * - Gộp "Xin đổi" + "Quá hạn" thành 1 nút "Xử lý case đặc biệt"
 * - Backup T7 chỉ lưu, không xoá (chống duplicate)
 * - "Làm mới tuần mới" giữ đúng bé chưa xếp (Ca xếp = trống)
 * - Menu gọn hơn, logic hơn
 ****************************************************/

// ===== CẤU HÌNH — bạn chỉ cần sửa chỗ này =====
var CFG = {
  GROUP_ID: '-1004378772858',    // nhóm Học Bù
  TOPIC_ID: 2,                   // topic Học Bù
  HAN_TRA_LOI: '12h trưa Thứ 4', // quá hạn không trả lời = đẩy tuần sau (chỉ để tham khảo)
  HAN_PH_XAC_NHAN: '11h trưa Thứ 3', // hạn ghi trong tin nhắn gửi PH
  TOI_DA_CA: 4,                  // mỗi ca tối đa 4 bé
  TOI_DA_TRINH_DO: 2,            // mỗi ca tối đa 2 trình độ chung
  HONG_ANH_DEN_HT: '2026-10-31', // Ms. Hồng Anh làm hết tháng 10
};

// ID file Sheet DẠY BÙ (để chạy được cả khi script đứng riêng)
var SHEET_ID = '1O_RUUL9P4YggLI2Vp1AcFraZuUHcF8CXULtZ9jPZGsg';

function laySS() {
  var ss = null;
  try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) {}
  if (!ss) ss = SpreadsheetApp.openById(SHEET_ID);
  return ss;
}

function baoXong(msg) {
  Logger.log(msg);
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) {}
}

function xacNhan(cauHoi) {
  try {
    var ui = SpreadsheetApp.getUi();
    return ui.alert(cauHoi, ui.ButtonSet.YES_NO) === ui.Button.YES;
  } catch (e) {
    return true;
  }
}

var TRINH_DO = ['Kids', 'SP0', 'SP1', 'SP2', 'SP3', 'SP4'];

var GV_LIST = ['Mr. Đức Anh', 'Mr. Ngọc', 'Ms. Hồng Anh', 'Ms. Nhung', 'Ms. Trâm', 'Ms. Uyên Vi', 'Ms. Vân'];
var PH_TRANG_THAI = ['Chờ Ms. Vân Anh', '✅ Đi được', '🔄 Xin đổi', '❌ Nghỉ', 'Tuần sau (quá hạn)'];
var DA_DAY = ['✅ Đã học', '❌ Vắng (không tới)'];

var EMAIL_QUAN_LY = ['tuanngoctruong2710@gmail.com', 'nguyenthiuyenvi@gmail.com', 'vananhhthuy@gmail.com'];

var LOP_LIST = [
  'S1.006 - Lychee', 'S2.004 - Cherry', 'C2.004 - Kiwi', 'T1.001 - Apple', 'W2.001 - Cookie',
  'S1.005 - Peach', 'S2.003 - Peanut', 'C2.002 - Chestnut', 'W1.002 - Ice-cream', 'T2.004 - Pea',
  'S1.004 - Watermelon', 'S2.002 - Blueberry', 'C2.003 - Tomato', 'T2.002 - Carrot',
  'S1.001 - Cashew', 'S2.001 - Pumpkin Seed', 'C2.005 - Pineapple', 'W1.003 - Tiramisu',
  'S1.003 - Hazelnut', 'S2.005 - Acorn', 'C2.006 - Broccoli', 'T2.003 - Potato',
  'S1.002 - Almond', 'C2.001 - Strawberry',
  'S2.006 - Avocado'
];

var LOP_DUC_ANH = ['S1.006 - Lychee', 'S2.004 - Cherry', 'C2.004 - Kiwi', 'T1.001 - Apple', 'W2.001 - Cookie'];

function layDanhSachCa() {
  var gvVan = 'Ms. Vân';
  return [
    { ma: 'T5-1', thu: 'Thứ 5', gio: '17h00 - 18h30', gv: gvVan },
    { ma: 'T6-1', thu: 'Thứ 6', gio: '15h00 - 16h30', gv: gvVan },
    { ma: 'T6-2', thu: 'Thứ 6', gio: '17h00 - 18h30', gv: gvVan },
    { ma: 'T6-3', thu: 'Thứ 6', gio: '18h00 - 19h30', gv: 'Mr. Đức Anh' },
  ];
}

function layNgayThu(thu) {
  var homNay = new Date();
  var thuHienTai = parseInt(Utilities.formatDate(homNay, 'GMT+7', 'u'), 10) % 7;
  var thuMuon = thu === 'Thứ 6' ? 5 : 4;
  var ngayCach = thuMuon - thuHienTai;
  if (ngayCach <= 0) ngayCach += 7;
  var ngayHoc = new Date(homNay.getTime() + ngayCach * 24 * 60 * 60 * 1000);
  return Utilities.formatDate(ngayHoc, 'GMT+7', 'dd/MM/yyyy');
}

function hongAnhConLam() {
  var homNay = new Date();
  var han = new Date(CFG.HONG_ANH_DEN_HT + 'T23:59:59+07:00');
  return homNay <= han;
}

function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('📚 Dạy Bù')
      .addItem('1️⃣ Gom nhóm (T2 chiều)', 'gomNhom')
      .addItem('2️⃣ Xử lý case đặc biệt (T4)', 'xuLyCaseDacBiet')
      .addItem('3️⃣ Gửi tin cho GV (T5-T6)', 'guiTinChoGV')
      .addItem('4️⃣ Làm mới tuần mới (tuần sau)', 'lamMoiTuanMoi')
      .addSeparator()
      .addItem('📊 Làm mới thống kê', 'lamMoiThongKe')
      .addItem('🔔 Nhắc GV báo bù (sáng T2)', 'nhacGVBaoBu')
      .addItem('💾 Backup thủ công', 'backupThuCong')
      .addSeparator()
      .addItem('⚙️ Cài trigger tự động', 'setupTriggerTuanBu')
      .addItem('🔨 Tạo sheet (chỉ chạy 1 lần)', 'setupDayBu')
      .addToUi();
  } catch (e) {}
}

function setupDayBu() {
  if (!xacNhan('Việc này sẽ XOÁ HẾT dữ liệu 3 tab BAO_BU, LICH_BU, LOP và tạo lại. Tiếp tục?')) return;
  var ss = laySS();
  var sh1 = layHoacTaoSheet(ss, 'BAO_BU');
  sh1.clear();
  sh1.appendRow(['Ngày báo', 'GV báo', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'Trạng thái', 'Ca xếp', 'Ghi chú']);
  sh1.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#F6F3EE');
  sh1.appendRow(['', '', '(ghi chú mẫu: nếu lớp không ai nghỉ, GV gõ "Không bù" ở đây)', '', '', '', '', '', '']);
  sh1.getRange(2, 3).setFontStyle('italic').setFontColor('#888888');
  datDropdown(sh1, 2, 100, GV_LIST);
  datDropdown(sh1, 4, 100, LOP_LIST);
  datDropdown(sh1, 5, 100, TRINH_DO);
  var sh2 = layHoacTaoSheet(ss, 'LICH_BU');
  sh2.clear();
  sh2.appendRow(['Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'PH xác nhận', 'Tin nhắn PH', 'Tin nhắn GV', 'Đã dạy']);
  sh2.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#F6F3EE');
  datDropdown(sh2, 9, 200, PH_TRANG_THAI);
  datDropdown(sh2, 12, 200, DA_DAY);
  var sh3 = layHoacTaoSheet(ss, 'LOP');
  sh3.clear();
  sh3.appendRow(['Lớp', 'GV chính']);
  var gvMap = {
    'S1.006 - Lychee': 'Mr. Đức Anh', 'S2.004 - Cherry': 'Mr. Đức Anh', 'C2.004 - Kiwi': 'Mr. Đức Anh',
    'T1.001 - Apple': 'Mr. Đức Anh', 'W2.001 - Cookie': 'Mr. Đức Anh',
    'S1.005 - Peach': 'Ms. Vân', 'S2.003 - Peanut': 'Ms. Vân', 'C2.002 - Chestnut': 'Ms. Vân',
    'W1.002 - Ice-cream': 'Ms. Vân', 'T2.004 - Pea': 'Ms. Vân',
    'S1.004 - Watermelon': 'Ms. Hồng Anh', 'S2.002 - Blueberry': 'Ms. Hồng Anh',
    'C2.003 - Tomato': 'Ms. Hồng Anh', 'T2.002 - Carrot': 'Ms. Hồng Anh',
    'S1.001 - Cashew': 'Mr. Ngọc', 'S2.001 - Pumpkin Seed': 'Mr. Ngọc',
    'C2.005 - Pineapple': 'Mr. Ngọc', 'W1.003 - Tiramisu': 'Mr. Ngọc',
    'S1.003 - Hazelnut': 'Ms. Trâm', 'S2.005 - Acorn': 'Ms. Trâm',
    'C2.006 - Broccoli': 'Ms. Trâm', 'T2.003 - Potato': 'Ms. Trâm',
    'S1.002 - Almond': 'Ms. Uyên Vi', 'C2.001 - Strawberry': 'Ms. Uyên Vi',
    'S2.006 - Avocado': 'Ms. Nhung'
  };
  LOP_LIST.forEach(function (lop) {
    sh3.appendRow([lop, gvMap[lop] || '']);
  });
  baoXong('Xong! Đã tạo 3 tab: BAO_BU, LICH_BU, LOP.');
}

function setupNhe() {
  var ss = laySS();
  var sh1 = layHoacTaoSheet(ss, 'BAO_BU');
  if (!sh1.getRange(1, 1).getValue()) {
    sh1.getRange(1, 1, 1, 9).setValues([['Ngày báo', 'GV báo', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'Trạng thái', 'Ca xếp', 'Ghi chú']]);
    sh1.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#F6F3EE');
  }
  datDropdown(sh1, 2, 100, GV_LIST);
  datDropdown(sh1, 4, 100, LOP_LIST);
  datDropdown(sh1, 5, 100, TRINH_DO);
  var sh2n = layHoacTaoSheet(ss, 'LICH_BU');
  if (!sh2n.getRange(1, 1).getValue()) {
    sh2n.getRange(1, 1, 1, 12).setValues([['Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'PH xác nhận', 'Tin nhắn PH', 'Tin nhắn GV', 'Đã dạy']]);
    sh2n.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#F6F3EE');
  }
  datDropdown(sh2n, 9, 200, PH_TRANG_THAI);
  datDropdown(sh2n, 12, 200, DA_DAY);
  layHoacTaoSheet(ss, 'LOP');
  baoXong('Xong bản nhẹ! Không mất dữ liệu cũ.');
}

function layHoacTaoSheet(ss, ten) {
  var sh = ss.getSheetByName(ten);
  if (!sh) sh = ss.insertSheet(ten);
  return sh;
}

function datDropdown(sh, cot, toiDong, danhSach) {
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(danhSach, true)
    .setAllowInvalid(false)
    .build();
  sh.getRange(2, cot, toiDong - 1, 1).setDataValidation(rule);
}

function khoaCotQuanLy() {
  var ss = laySS();
  var sh = ss.getSheetByName('BAO_BU');
  if (!sh) return;
  var range = sh.getRange(1, 7, 500, 3);
  var prot = range.protect().setDescription('Chỉ quản lý sửa');
  prot.addEditors(EMAIL_QUAN_LY);
  if (prot.canDomainEdit()) prot.setDomainEdit(false);
}

function onEdit(e) {
  try {
    var sh = e.range.getSheet();
    if (sh.getName() !== 'BAO_BU') return;
    var dong = e.range.getRow();
    if (dong < 2) return;
    var cot = e.range.getColumn();
    if (cot < 2 || cot > 6) return;
    var oNgay = sh.getRange(dong, 1);
    if (!oNgay.getValue()) oNgay.setValue(new Date());
  } catch (err) { }
}

function laySheetBaoBu(ss) {
  return ss.getSheetByName('BAO_BU');
}

function gomNhom() {
  var ss = laySS();
  var bao = laySheetBaoBu(ss);
  var lich = ss.getSheetByName('LICH_BU');
  if (!bao || !lich) {
    baoXong('Chưa có sheet. Bấm menu "Tạo sheet" trước.');
    return;
  }
  var data = bao.getDataRange().getValues();
  if (data.length < 2) {
    baoXong('Chưa có bé nào báo bù.');
    return;
  }
  var chuaXep = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    var trangThai = (r[6] || '').toString().trim();
    var tenBe = (r[2] || '').toString().trim().toLowerCase();
    if (!tenBe) continue;
    if (tenBe.indexOf('ghi chú mẫu') >= 0 || tenBe.indexOf('không bù') === 0) continue;
    if (trangThai === '' || trangThai === 'Chờ') {
      chuaXep.push({ dong: i + 1, gvBao: r[1], tenBe: r[2], lop: r[3], trinhDo: r[4], link: r[5] });
    }
  }
  if (chuaXep.length === 0) {
    baoXong('Không còn bé nào chờ xếp.');
    return;
  }
  chuaXep.sort(function (a, b) {
    var au = LOP_DUC_ANH.indexOf(a.lop) >= 0 ? 0 : 1;
    var bu = LOP_DUC_ANH.indexOf(b.lop) >= 0 ? 0 : 1;
    if (au !== bu) return au - bu;
    if (a.trinhDo < b.trinhDo) return -1;
    if (a.trinhDo > b.trinhDo) return 1;
    return 0;
  });
  var caList = layDanhSachCa();
  giuLaiDongDaChot(lich);
  var daCo = Math.max(lich.getLastRow() - 1, 0);
  var conCho = caList.length * CFG.TOI_DA_CA - daCo;
  var beDu = [];
  var stt = 0;
  chuaXep.forEach(function (be) {
    var ca = conCho > 0 ? chonCaChoBe(be, caList, lich) : null;
    if (ca) {
      themBeVaoLich(lich, bao, be, ca);
      stt++;
      conCho--;
    } else {
      beDu.push(be);
    }
  });
  beDu.forEach(function (be) {
    bao.getRange(be.dong, 7).setValue('Tuần sau');
    bao.getRange(be.dong, 9).setValue('Hết chỗ các ca, tự đẩy sang tuần sau');
  });
  toDoCa3TrinhDo(lich);
  var msg = 'Đã xếp ' + stt + ' bé vào ' + caList.length + ' ca.'
    + (beDu.length ? '\nDư ' + beDu.length + ' bé → đẩy sang tuần sau.' : '')
    + '\n\nBước tiếp theo: mở tab LICH_BU, copy cột "Tin nhắn PH" gửi Zalo cho PH.';
  baoXong(msg);
}

function chonCaChoBe(be, caList, lich) {
  var rows = lich.getDataRange().getValues();
  function beTrongCa(maCa) {
    var list = [];
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === maCa) list.push({ trinhDo: rows[i][6], tenBe: rows[i][4] });
    }
    return list;
  }
  if (LOP_DUC_ANH.indexOf(be.lop) >= 0) {
    var caDA = caList[caList.length - 1];
    if (beTrongCa(caDA.ma).length < CFG.TOI_DA_CA) return caDA;
  }
  for (var k = 0; k < caList.length; k++) {
    var trong = beTrongCa(caList[k].ma);
    if (trong.length >= CFG.TOI_DA_CA) continue;
    var trinhDos = {};
    trong.forEach(function (x) { trinhDos[x.trinhDo] = 1; });
    var ds = Object.keys(trinhDos);
    if (ds.length === 0) continue;
    if (ds.indexOf(be.trinhDo) >= 0) return caList[k];
    if (ds.length < CFG.TOI_DA_TRINH_DO) return caList[k];
  }
  for (var j = 0; j < caList.length; j++) {
    if (beTrongCa(caList[j].ma).length === 0) return caList[j];
  }
  for (var m = 0; m < caList.length; m++) {
    if (beTrongCa(caList[m].ma).length < CFG.TOI_DA_CA) return caList[m];
  }
  return null;
}

function themBeVaoLich(lich, bao, be, ca) {
  var ngayHoc = layNgayThu(ca.thu);
  var tinPH = 'Dạ em chào chị, em xin thông báo lịch học bù cho bé ' + be.tenBe + ':\n'
    + '• Thời gian: ' + ca.thu + ' ngày ' + ngayHoc + ' lúc ' + ca.gio + '\n'
    + 'Dạ thời gian này chị có sắp xếp đưa bé đến Trung tâm học bù được không ạ?\n'
    + 'Nhờ chị xác nhận giúp em trước ' + CFG.HAN_PH_XAC_NHAN + ' nhé!\nEm cám ơn chị ạ.';
  var tinGV = '📚 [' + ca.thu + ' ' + ca.gio + '] ' + ca.gv + ' dạy bù: bé ' + be.tenBe
    + ' (' + be.lop + ' - ' + be.trinhDo + '). Slide: ' + (be.link || '(chưa có link)');
  lich.appendRow([ca.ma, ca.thu, ca.gio, ca.gv, be.tenBe, be.lop, be.trinhDo, be.link, 'Chờ Ms. Vân Anh', tinPH, tinGV, '']);
  if (!be.link || !be.link.toString().trim()) {
    var dongMoi = lich.getLastRow();
    lich.getRange(dongMoi, 8).setBackground('#FFF3CD');
  }
  bao.getRange(be.dong, 7).setValue('Đã xếp');
  bao.getRange(be.dong, 8).setValue(ca.ma + ' ' + ca.thu + ' ' + ca.gio);
}

function giuLaiDongDaChot(lich) {
  var data = lich.getDataRange().getValues();
  var giu = [data[0]];
  if (giu[0].length < 12) giu[0].push('Đã dạy');
  for (var i = 1; i < data.length; i++) {
    var st = (data[i][8] || '').toString();
    if (st.indexOf('✅') >= 0 || st.indexOf('Đi được') >= 0) giu.push(data[i]);
  }
  lich.clear();
  giu.forEach(function (r) { lich.appendRow(r); });
  lich.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#F6F3EE');
  datDropdown(lich, 9, 200, PH_TRANG_THAI);
  datDropdown(lich, 12, 200, DA_DAY);
}

function toDoCa3TrinhDo(lich) {
  var data = lich.getDataRange().getValues();
  var theoCa = {};
  for (var i = 1; i < data.length; i++) {
    var ma = data[i][0];
    if (!theoCa[ma]) theoCa[ma] = {};
    theoCa[ma][data[i][6]] = 1;
  }
  for (var j = 1; j < data.length; j++) {
    var ma2 = data[j][0];
    if (theoCa[ma2] && Object.keys(theoCa[ma2]).length > CFG.TOI_DA_TRINH_DO) {
      lich.getRange(j + 1, 1, 1, 12).setBackground('#FCE4E4');
    }
  }
}

function xuLyCaseDacBiet() {
  var ss = laySS();
  var lich = ss.getSheetByName('LICH_BU');
  var bao = ss.getSheetByName('BAO_BU');
  if (!lich || !bao) {
    baoXong('Chưa có sheet LICH_BU hoặc BAO_BU.');
    return;
  }
  var data = lich.getDataRange().getValues();
  var chuyen = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][4]) continue;
    var st = (data[i][8] || '').toString().trim();
    var loai = '';
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
  var danhSach = chuyen.map(function(be, idx) {
    return (idx + 1) + '. ' + be.tenBe + ' (' + be.loai + ' ca ' + be.maCa + ')';
  }).join('\n');
  if (!xacNhan('Tìm thấy ' + chuyen.length + ' bé cần xử lý:\n\n' + danhSach 
    + '\n\nChuyển về BAO_BU để xếp lại?')) {
    return;
  }
  var demXinDoi = 0, demQuaHan = 0;
  chuyen.forEach(function(be) {
    var ghiChu = be.loai + ' ca ' + be.maCa + ' (' + be.thu + ' ' + be.gio + ')';
    bao.appendRow([new Date(), '', be.tenBe, be.lop, be.trinhDo, be.link, '', '', ghiChu]);
    if (be.loai === 'Xin đổi') demXinDoi++;
    else demQuaHan++;
  });
  for (var j = chuyen.length - 1; j >= 0; j--) {
    lich.deleteRow(chuyen[j].dong);
  }
  var tin = '🔔 [XỬ LÝ CASE ĐẶC BIỆT]\n\n';
  if (demXinDoi > 0) {
    tin += '🔄 ' + demXinDoi + ' bé PH xin đổi ca:\n';
    chuyen.filter(function(be) { return be.loai === 'Xin đổi'; })
      .forEach(function(be) { tin += '  • ' + be.tenBe + ' (ca ' + be.maCa + ')\n'; });
    tin += '\n';
  }
  if (demQuaHan > 0) {
    tin += '⏰ ' + demQuaHan + ' bé quá hạn chưa xác nhận:\n';
    chuyen.filter(function(be) { return be.loai === 'Quá hạn'; })
      .forEach(function(be) { tin += '  • ' + be.tenBe + ' (ca ' + be.maCa + ')\n'; });
    tin += '\n';
  }
  tin += '✅ Đã chuyển về BAO_BU để Ms. Vân Anh xếp lại.\nCác ca đã giải phóng chỗ, có thể xếp bé khác vào.';
  if (guiTelegram(tin)) {
    baoXong('Đã chuyển ' + chuyen.length + ' bé về BAO_BU và gửi Telegram ✅\n\nChi tiết:\n• Xin đổi: ' + demXinDoi + '\n• Quá hạn: ' + demQuaHan);
  } else {
    baoXong('Đã chuyển ' + chuyen.length + ' bé về BAO_BU, nhưng gửi Telegram thất bại.\nXem lỗi ở Nhật ký thực thi.');
  }
}

function guiTinChoGV() {
  var ss = laySS();
  var lich = ss.getSheetByName('LICH_BU');
  var data = lich.getDataRange().getValues();
  var theoCa = {};
  for (var i = 1; i < data.length; i++) {
    var st = (data[i][8] || '').toString();
    if (st.indexOf('✅') < 0 && st.indexOf('Đi được') < 0) continue;
    var ma = data[i][0];
    if (!theoCa[ma]) theoCa[ma] = { thu: data[i][1], gio: data[i][2], gv: data[i][3], bes: [] };
    theoCa[ma].bes.push({ ten: data[i][4], lop: data[i][5], td: data[i][6], link: data[i][7] });
  }
  var keys = Object.keys(theoCa);
  if (!keys.length) {
    baoXong('Chưa có ca nào được chốt ✅.');
    return;
  }
  var daGui = 0;
  keys.forEach(function (ma) {
    var c = theoCa[ma];
    var tin = '📚 [HỌC BÙ ' + c.thu + ' ' + c.gio + '] ' + c.gv + ' dạy:\n';
    c.bes.forEach(function (b, idx) {
      tin += (idx + 1) + '. ' + b.ten + ' (' + b.lop + ' - ' + b.td + ')\n   Slide: ' + (b.link || '(chưa có)') + '\n';
    });
    if (guiTelegram(tin)) daGui++;
  });
  if (daGui === keys.length) baoXong('Đã gửi ' + daGui + ' tin vào nhóm Học Bù.');
  else if (daGui > 0) baoXong('Chỉ gửi được ' + daGui + '/' + keys.length + ' tin. Xem lỗi ở Nhật ký thực thi.');
}

function nhacGVBaoBu() {
  var ss = laySS();
  var bao = ss.getSheetByName('BAO_BU');
  var data = bao.getDataRange().getValues();
  var daBao = {};
  for (var i = 1; i < data.length; i++) {
    var gv = (data[i][1] || '').toString().trim();
    var tenBe = (data[i][2] || '').toString().trim().toLowerCase();
    if (gv && tenBe) daBao[gv] = 1;
  }
  var gvCanBao = GV_LIST.filter(function (g) { return g !== 'Ms. Hồng Anh' || hongAnhConLam(); });
  var chuaBao = gvCanBao.filter(function (g) { return !daBao[g]; });
  var tin = '📢 [SÁNG T2] Nhắc báo bù:\n';
  if (!chuaBao.length) {
    tin += 'Cả ' + gvCanBao.length + ' GV đều đã báo ✅ Cảm ơn thầy cô!';
  } else {
    tin += 'GV chưa báo: ' + chuaBao.join(', ') + '\nThầy cô vào tab BAO_BU:\n• Nếu có bé nghỉ: ghi tên bé + lớp + trình độ + link Canva\n• Nếu lớp đi đủ: gõ "Không bù" vào cột Tên bé';
  }
  if (guiTelegram(tin)) baoXong('Đã gửi tin nhắc vào nhóm Học Bù.');
}

function backupThuCong() {
  backupTuanBu();
}

function backupTuanBu() {
  var ss = laySS();
  var lich = ss.getSheetByName('LICH_BU');
  if (!lich) {
    baoXong('Chưa có sheet LICH_BU.');
    return;
  }
  var homNay = new Date();
  var thang = Utilities.formatDate(homNay, 'GMT+7', 'MM-yyyy');
  var tenBackup = 'Backup tháng ' + thang;
  var backup = ss.getSheetByName(tenBackup);
  if (!backup) {
    backup = ss.insertSheet(tenBackup);
    backup.appendRow(['Ngày', 'Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'PH xác nhận', 'Đã dạy']);
    backup.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#F6F3EE');
  }
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
  var dataLich = lich.getDataRange().getValues();
  var ngay = Utilities.formatDate(homNay, 'GMT+7', 'dd/MM/yyyy');
  var dem = 0;
  for (var i = 1; i < dataLich.length; i++) {
    if (!dataLich[i][4]) continue;
    var st = (dataLich[i][8] || '').toString().trim();
    if (st !== '' && st.indexOf('Chờ') !== 0) {
      backup.appendRow([ngay, dataLich[i][0], dataLich[i][1], dataLich[i][2], dataLich[i][3], dataLich[i][4], dataLich[i][5], st, dataLich[i][11]]);
      dem++;
    }
  }
  if (dem === 0) {
    baoXong('⚠️ Không có ca nào để backup (tất cả đang "Chờ Ms. Vân Anh").');
    return;
  }
  baoXong('✅ Đã backup ' + dem + ' bé vào "' + tenBackup + '".\n\n📝 Bao gồm: Đi được, Nghỉ, Vắng (tất cả đã có phản hồi)\n⚠️ Backup CHỈ LƯU, không xoá gì.\n\nKhi sẵn sàng tuần mới, bấm "Làm mới tuần mới".');
}

function lamMoiTuanMoi() {
  if (!xacNhan('Việc này sẽ XOÁ TRẮNG BAO_BU và LICH_BU.\n\n✅ Giữ lại: tất cả bé trong BAO_BU chưa xếp (Ca xếp = trống)\n❌ Xoá: LICH_BU (đã backup rồi)\n\n⚠️ Chỉ làm khi đã backup xong và sẵn sàng bắt đầu tuần mới.\n\nTiếp tục?')) {
    return;
  }
  var ss = laySS();
  var lich = ss.getSheetByName('LICH_BU');
  var bao = ss.getSheetByName('BAO_BU');
  if (!lich || !bao) {
    baoXong('Chưa có sheet LICH_BU hoặc BAO_BU.');
    return;
  }
  var dataBao = bao.getDataRange().getValues();
  var batDau = 2;
  if (dataBao.length >= 2 && (dataBao[1][2] || '').toString().toLowerCase().indexOf('ghi chú mẫu') >= 0) {
    batDau = 3;
  }
  var giuLai = [];
  for (var i = batDau - 1; i < dataBao.length; i++) {
    var r = dataBao[i];
    if (!r[2]) continue;
    var caXep = (r[7] || '').toString().trim();
    if (caXep === '') {
      giuLai.push([r[0] || new Date(), r[1], r[2], r[3], r[4], r[5], '', '', r[8] || '']);
    }
  }
  lich.clear();
  lich.appendRow(['Ca', 'Thứ', 'Giờ', 'GV dạy', 'Tên bé', 'Lớp', 'Trình độ', 'Link Canva', 'PH xác nhận', 'Tin nhắn PH', 'Tin nhắn GV', 'Đã dạy']);
  lich.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#F6F3EE');
  datDropdown(lich, 9, 200, PH_TRANG_THAI);
  datDropdown(lich, 12, 200, DA_DAY);
  if (dataBao.length >= batDau) {
    bao.getRange(batDau, 1, dataBao.length - batDau + 1, 9).clearContent();
  }
  if (giuLai.length > 0) {
    bao.getRange(batDau, 1, giuLai.length, 9).setValues(giuLai);
  }
  baoXong('✅ Đã làm mới BAO_BU + LICH_BU cho tuần mới.\n\n' + (giuLai.length > 0 ? '📝 Giữ lại ' + giuLai.length + ' bé chưa xếp trong BAO_BU:\n   (bao gồm: bé mới báo, Quá hạn, Xin đổi, hết chỗ...)' : '✨ Không có bé nào chưa xếp.'));
}

function setupTriggerTuanBu() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'backupTuanBu') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('backupTuanBu')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SATURDAY)
    .atHour(22)
    .create();
  baoXong('Đã cài trigger tự động: mỗi tối T7 22h tự BACKUP (không xoá gì) ✅');
}

function lamMoiThongKe() {
  var ss = laySS();
  var homNay = new Date();
  var thang = Utilities.formatDate(homNay, 'GMT+7', 'MM-yyyy');
  var tenBackup = 'Backup tháng ' + thang;
  if (!ss.getSheetByName(tenBackup)) {
    baoXong('Chưa có sheet "' + tenBackup + '" (tháng này chưa backup lần nào).');
    return;
  }
  var tk = ss.getSheetByName('THỐNG KÊ');
  if (!tk) tk = ss.insertSheet('THỐNG KÊ');
  tk.clear();
  var b = '\'' + tenBackup + '\'';
  tk.getRange(1, 1).setValue('THỐNG KÊ DẠY BÙ THÁNG ' + thang).setFontSize(14).setFontWeight('bold');
  tk.getRange(3, 1, 1, 3).setValues([['GV dạy', 'Số ca dạy', 'Tổng giờ']]).setFontWeight('bold').setBackground('#F6F3EE');
  var dongBatDau = 4;
  var dongCuoi = dongBatDau + GV_LIST.length - 1;
  GV_LIST.forEach(function (gv, idx) {
    var dong = dongBatDau + idx;
    tk.getRange(dong, 1).setValue(gv);
    tk.getRange(dong, 2).setFormula('=IFERROR(COUNTA(UNIQUE(FILTER(ARRAYFORMULA(' + b + '!A2:A&' + b + '!B2:B),' + b + '!E2:E=A' + dong + '))),0)');
    tk.getRange(dong, 3).setFormula('=B' + dong + '*1.5');
  });
  var dongTong = dongCuoi + 2;
  tk.getRange(dongTong, 1).setValue('Tổng cả tháng').setFontWeight('bold');
  tk.getRange(dongTong + 1, 1, 3, 2).setValues([
    ['Tổng số bé học bù', '=COUNTA(' + b + '!F2:F)'],
    ['Tổng số ca dạy', '=SUM(B' + dongBatDau + ':B' + dongCuoi + ')'],
    ['Tổng số giờ', '=SUM(C' + dongBatDau + ':C' + dongCuoi + ')']
  ]);
  baoXong('Đã làm mới tab THỐNG KÊ với công thức tự động ✅\nNếu sửa lỗi công thức, bấm lại nút này để ghi đè.');
}

function guiTelegram(text) {
  var token = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN');
  if (!token) {
    baoXong('Chưa có token bot. Vào Cài đặt dự án → Thuộc tính tập lệnh → thêm TELEGRAM_BOT_TOKEN.');
    return false;
  }
  if (text.length > 4000) text = text.substring(0, 4000) + '…';
  var url = 'https://api.telegram.org/bot' + token + '/sendMessage';
  try {
    var res = UrlFetchApp.fetch(url, {
      method: 'post',
      muteHttpExceptions: true,
      payload: { chat_id: CFG.GROUP_ID, message_thread_id: CFG.TOPIC_ID, text: text }
    });
    if (res.getResponseCode() !== 200) {
      baoXong('Telegram báo lỗi ' + res.getResponseCode() + ': ' + res.getContentText());
      return false;
    }
    return true;
  } catch (err) {
    baoXong('Không gửi được Telegram: ' + err);
    return false;
  }
}

function testGuiTelegram() {
  if (guiTelegram('✅ Bot Dạy Bù đã vào nhóm thành công!')) baoXong('Gửi thử thành công ✅');
}
