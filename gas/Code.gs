/**
 * ABSENSI QR CODE - FAKULTAS TEKNIK INFORMATIKA
 * UNIVERSITAS JABAL GHAFUR - RUANG 5.5
 * ------------------------------------------------------
 * Cara pakai:
 * 1. Buat Google Sheet baru, import "Database_Absensi_TIF_UJG.xlsx"
 *    (Ekstensi > Apps Script) lalu tempel semua file di folder /gas ini.
 * 2. Jalankan fungsi setupSheets() sekali (Run > setupSheets) untuk
 *    memastikan struktur sheet benar & mengisi data mahasiswa jika kosong.
 * 3. Deploy > New deployment > Web app.
 *    - Execute as: Me
 *    - Who has access: Anyone (atau Anyone with Google account)
 * 4. Buka URL web app yang diberikan. Selesai, tanpa hosting terpisah.
 */

const SHEET_MHS = "Mahasiswa";
const SHEET_ABSEN = "Absensi";
const SHEET_REKAP = "Rekap";
const SHEET_SETTING = "Pengaturan";

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Absensi QR - TIF Universitas Jabal Ghafur')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function sheet_(name) {
  const ss = ss_();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

/** Jalankan sekali secara manual dari editor Apps Script */
function setupSheets() {
  const mhs = sheet_(SHEET_MHS);
  if (mhs.getLastRow() === 0) {
    mhs.appendRow(["NO", "NIM", "NAMA", "STATUS", "QR_PAYLOAD", "KETERANGAN"]);
  }
  const absen = sheet_(SHEET_ABSEN);
  if (absen.getLastRow() === 0) {
    absen.appendRow(["TANGGAL", "NIM", "NAMA", "JAM_MASUK", "JAM_PULANG", "STATUS", "RUANG"]);
  }
  const rekap = sheet_(SHEET_REKAP);
  if (rekap.getLastRow() === 0) {
    rekap.appendRow(["NIM", "NAMA", "TOTAL_HADIR", "TOTAL_IZIN", "TOTAL_SAKIT", "TOTAL_ALPA"]);
  }
  const setting = sheet_(SHEET_SETTING);
  if (setting.getLastRow() === 0) {
    setting.appendRow(["FIELD", "NILAI"]);
    setting.appendRow(["Nama Institusi", "Universitas Jabal Ghafur"]);
    setting.appendRow(["Fakultas / Prodi", "Fakultas Teknik Informatika"]);
    setting.appendRow(["Ruang Kelas", "5.5"]);
    setting.appendRow(["Alamat", "Sigli, Kabupaten Pidie, Aceh"]);
    setting.appendRow(["Logo (URL)", ""]);
    setting.appendRow(["Penanggung Jawab", ""]);
    setting.appendRow(["NIP/NIDN Penanggung Jawab", ""]);
    setting.appendRow(["Tempat/Kota TTD", "Sigli"]);
  }
  SpreadsheetApp.flush();
}

/* ---------------- SETTINGS ---------------- */

function getSettings() {
  const sh = sheet_(SHEET_SETTING);
  const data = sh.getDataRange().getValues();
  const obj = {};
  for (let i = 1; i < data.length; i++) {
    obj[data[i][0]] = data[i][1];
  }
  return obj;
}

function saveSettings(settingsObj) {
  const sh = sheet_(SHEET_SETTING);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const key = data[i][0];
    if (settingsObj.hasOwnProperty(key)) {
      sh.getRange(i + 1, 2).setValue(settingsObj[key]);
    }
  }
  return true;
}

/* ---------------- MAHASISWA (CRUD) ---------------- */

function getMahasiswaList() {
  const sh = sheet_(SHEET_MHS);
  const data = sh.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][1]) continue;
    list.push({
      no: data[i][0],
      nim: String(data[i][1]),
      nama: data[i][2],
      status: data[i][3],
      payload: data[i][4],
      keterangan: data[i][5]
    });
  }
  return list;
}

function addMahasiswa(nim, nama) {
  const sh = sheet_(SHEET_MHS);
  const lastRow = sh.getLastRow();
  const no = lastRow; // header is row1
  const payload = `TIF-UJG|${nim}|${nama}`;
  sh.appendRow([no, nim, nama, "AKTIF", payload, ""]);
  return true;
}

function deleteMahasiswa(nim) {
  const sh = sheet_(SHEET_MHS);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(nim)) {
      sh.getRange(i + 1, 4).setValue("NONAKTIF");
      return true;
    }
  }
  return false;
}

/* ---------------- SCAN / ABSENSI ---------------- */

function findMahasiswaByNim_(nim) {
  const list = getMahasiswaList();
  return list.find(m => String(m.nim) === String(nim));
}

/**
 * Dipanggil dari halaman Scan QR. payload = isi teks hasil scan kamera,
 * format: TIF-UJG|<NIM>|<NAMA>
 */
function recordScan(payload) {
  const parts = String(payload).split("|");
  if (parts.length < 2 || parts[0] !== "TIF-UJG") {
    return { ok: false, message: "QR tidak dikenali." };
  }
  const nim = parts[1];
  const mhs = findMahasiswaByNim_(nim);
  if (!mhs) return { ok: false, message: "NIM tidak terdaftar: " + nim };
  if (mhs.status !== "AKTIF") return { ok: false, message: mhs.nama + " berstatus nonaktif." };

  const settings = getSettings();
  const ruang = settings["Ruang Kelas"] || "5.5";
  const tz = Session.getScriptTimeZone();
  const now = new Date();
  const tanggal = Utilities.formatDate(now, tz, "yyyy-MM-dd");
  const jam = Utilities.formatDate(now, tz, "HH:mm:ss");

  const sh = sheet_(SHEET_ABSEN);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const rowTanggal = Utilities.formatDate(new Date(data[i][0]), tz, "yyyy-MM-dd");
    if (rowTanggal === tanggal && String(data[i][1]) === String(nim)) {
      if (!data[i][4]) {
        sh.getRange(i + 1, 5).setValue(jam);
        return { ok: true, message: mhs.nama + " - Jam Pulang dicatat (" + jam + ")", nama: mhs.nama, nim: nim, tipe: "pulang", jam: jam };
      }
      return { ok: false, message: mhs.nama + " sudah absen masuk & pulang hari ini." };
    }
  }
  sh.appendRow([tanggal, nim, mhs.nama, jam, "", "Hadir", ruang]);
  return { ok: true, message: mhs.nama + " - Jam Masuk dicatat (" + jam + ")", nama: mhs.nama, nim: nim, tipe: "masuk", jam: jam };
}

/* ---------------- ABSEN MANUAL ---------------- */

function manualAbsen(nim, tanggal, status) {
  const mhs = findMahasiswaByNim_(nim);
  if (!mhs) return { ok: false, message: "NIM tidak ditemukan" };
  const settings = getSettings();
  const ruang = settings["Ruang Kelas"] || "5.5";
  const sh = sheet_(SHEET_ABSEN);
  sh.appendRow([tanggal, nim, mhs.nama, "", "", status, ruang]);
  return { ok: true, message: "Absensi manual tersimpan untuk " + mhs.nama };
}

/* ---------------- LAPORAN ---------------- */

function getLaporan(tipe, nim, bulanOrTanggal) {
  const sh = sheet_(SHEET_ABSEN);
  const data = sh.getDataRange().getValues();
  const tz = Session.getScriptTimeZone();
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    if (!r[0]) continue;
    const d = new Date(r[0]);
    const tanggalStr = Utilities.formatDate(d, tz, "yyyy-MM-dd");
    const bulanStr = Utilities.formatDate(d, tz, "yyyy-MM");

    if (nim && String(r[1]) !== String(nim)) continue;
    if (tipe === "harian" && bulanOrTanggal && tanggalStr !== bulanOrTanggal) continue;
    if (tipe === "bulanan" && bulanOrTanggal && bulanStr !== bulanOrTanggal) continue;

    rows.push({
      tanggal: tanggalStr,
      nim: r[1],
      nama: r[2],
      masuk: r[3],
      pulang: r[4],
      status: r[5],
      ruang: r[6]
    });
  }
  return rows;
}

/* ---------------- DASHBOARD ---------------- */

function getDashboardStats() {
  const tz = Session.getScriptTimeZone();
  const today = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
  const totalMhs = getMahasiswaList().filter(m => m.status === "AKTIF").length;
  const todayRows = getLaporan("harian", null, today);
  const hadir = todayRows.filter(r => r.status === "Hadir").length;
  return {
    totalMahasiswa: totalMhs,
    hadirHariIni: hadir,
    belumHadir: Math.max(totalMhs - hadir, 0),
    tanggal: today
  };
}

function doPost(e) {
  // Mengaktifkan CORS agar bisa diakses dari domain GitHub Pages
  var output = ContentService.createTextOutput();
  
  try {
    // Membaca data yang dikirim oleh website GitHub
    var requestData = JSON.parse(e.postData.contents);
    var functionName = requestData.functionName;
    var args = requestData.arguments || [];
    
    // Menjalankan fungsi yang diminta secara otomatis (seperti google.script.run)
    if (typeof this[functionName] === 'function') {
      var result = this[functionName].apply(null, args);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        data: result
      })).setMimeType(ContentService.MimeType.JSON);
      
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Fungsi '" + functionName + "' tidak ditemukan di Code.gs."
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
