const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw1K2D8a27-m4AjHEA9FSQjhxpkwSspuKpZ4HJa2NYtti4kwbOhjQgmpoIy_0XhElW0/exec";
const THAI_ADDRESS_DB_URL = "https://raw.githubusercontent.com/earthchie/jquery.Thailand.js/master/jquery.Thailand.js/database/raw_database/raw_database.json";

let current = null;
let modalPad;
let activeType = '';
let savedSigs = { user: null, studentSig: null, parentSig: null };
let thaiAddressData = [];

document.addEventListener("DOMContentLoaded", async () => {
  await initThaiAddress();
});

function switchTab(tabName) {
  const sections = {
    pdpa: document.getElementById('pdpaSection'),
    contract: document.getElementById('contractSection'),
    trans: document.getElementById('transSection')
  };
  const buttons = {
    pdpa: document.getElementById('tabPdpaBtn'),
    contract: document.getElementById('tabContractBtn'),
    trans: document.getElementById('tabTransBtn')
  };

  Object.keys(sections).forEach(key => {
    if (key === tabName) {
      sections[key].classList.remove('hidden');
      buttons[key].className = "flex-1 py-3 px-1 md:py-4 text-center font-bold text-blue-900 border-b-4 border-blue-900 transition bg-blue-50 text-xs md:text-base";
    } else {
      sections[key].classList.add('hidden');
      buttons[key].className = "flex-1 py-3 px-1 md:py-4 text-center font-bold text-gray-400 border-b-4 border-transparent transition hover:text-blue-900 text-xs md:text-base";
    }
  });
}

async function initThaiAddress() {
  const provSelect = document.getElementById('provinceSelect');
  const amphoeSelect = document.getElementById('amphoeSelect');
  const tambonSelect = document.getElementById('tambonSelect');
  const zipInput = document.getElementById('zipcodeInput');

  try {
    const res = await fetch(THAI_ADDRESS_DB_URL);
    thaiAddressData = await res.json();

    const provinces = [...new Set(thaiAddressData.map(item => item.province))].sort((a, b) => a.localeCompare(b, 'th'));
    provSelect.innerHTML = '<option value="">-- เลือกจังหวัด --</option>';
    provinces.forEach(p => {
      provSelect.innerHTML += `<option value="${p}">${p}</option>`;
    });

    provSelect.addEventListener('change', () => {
      const selectedProv = provSelect.value;
      amphoeSelect.innerHTML = '<option value="">-- เลือกเขต/อำเภอ --</option>';
      tambonSelect.innerHTML = '<option value="">-- เลือกตำบล/แขวง --</option>';
      zipInput.value = '';
      tambonSelect.disabled = true;
      tambonSelect.classList.add('bg-gray-100');

      if (!selectedProv) {
        amphoeSelect.disabled = true;
        amphoeSelect.classList.add('bg-gray-100');
        return;
      }

      const amphoes = [...new Set(thaiAddressData.filter(item => item.province === selectedProv).map(item => item.amphoe))].sort((a, b) => a.localeCompare(b, 'th'));
      amphoes.forEach(a => {
        amphoeSelect.innerHTML += `<option value="${a}">${a}</option>`;
      });
      amphoeSelect.disabled = false;
      amphoeSelect.classList.remove('bg-gray-100');
    });

    amphoeSelect.addEventListener('change', () => {
      const selectedProv = provSelect.value;
      const selectedAmphoe = amphoeSelect.value;
      tambonSelect.innerHTML = '<option value="">-- เลือกตำบล/แขวง --</option>';
      zipInput.value = '';

      if (!selectedAmphoe) {
        tambonSelect.disabled = true;
        tambonSelect.classList.add('bg-gray-100');
        return;
      }

      const tambons = thaiAddressData.filter(item => item.province === selectedProv && item.amphoe === selectedAmphoe);
      tambons.sort((a, b) => a.district.localeCompare(b.district, 'th'));
      tambons.forEach(t => {
        tambonSelect.innerHTML += `<option value="${t.district}" data-zip="${t.zipcode}">${t.district}</option>`;
      });
      tambonSelect.disabled = false;
      tambonSelect.classList.remove('bg-gray-100');
    });

    tambonSelect.addEventListener('change', () => {
      const selectedOption = tambonSelect.options[tambonSelect.selectedIndex];
      zipInput.value = selectedOption ? (selectedOption.getAttribute('data-zip') || '') : '';
    });

  } catch (err) {
    console.error("โหลดฐานข้อมูลที่อยู่ไม่สำเร็จ:", err);
    provSelect.innerHTML = '<option value="">โหลดข้อมูลไม่สำเร็จ กรุณารีเฟรช</option>';
  }
}

async function callApi(action, payload = {}) {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ action, ...payload }),
      headers: { "Content-Type": "text/plain;charset=utf-8" }
    });
    const result = await response.json();
    if (result.status === 'error') throw new Error(result.message);
    return result.data;
  } catch (err) {
    Swal.fire('เกิดข้อผิดพลาด', err.message, 'error');
    throw err;
  }
}

async function search() {
  const id = document.getElementById('idSearch').value;
  if (id.length !== 13) return Swal.fire('แจ้งเตือน', 'กรุณากรอกเลขบัตร 13 หลัก', 'warning');
  
  // --- [เพิ่มเข้ามา] ล้างข้อมูลและรูปลายเซ็นของคนก่อนหน้าทันทีเพื่อความปลอดภัย ---
  current = null;
  savedSigs = { user: null, studentSig: null, parentSig: null };
  
  // ล้างภาพตัวอย่างลายเซ็นบนหน้าจอ
  const userPrev = document.getElementById('userPreview');
  if (userPrev) userPrev.innerHTML = '<span class="text-gray-400 text-xs italic">คลิกเพื่อเซ็นชื่อ</span>';
  
  const studentSigPrev = document.getElementById('studentSigPreview');
  if (studentSigPrev) studentSigPrev.innerHTML = '<span class="text-gray-400 text-xs italic">คลิกเพื่อเซ็นชื่อ</span>';
  
  const parentSigPrev = document.getElementById('parentSigPreview');
  if (parentSigPrev) parentSigPrev.innerHTML = '<span class="text-gray-400 text-xs italic">คลิกเพื่อเซ็นชื่อ</span>';
  
  // รีเซ็ตชื่อผู้ปกครองและพยาน (ถ้ามี)
  const parentNameInput = document.getElementById('parentName');
  if (parentNameInput) parentNameInput.value = '';
  const parentNamePrev = document.getElementById('parentNamePreview');
  if (parentNamePrev) parentNamePrev.innerText = 'ผู้ปกครอง';
  
  const w1NameInput = document.getElementById('w1Name');
  if (w1NameInput) w1NameInput.value = '';
  const w2NameInput = document.getElementById('w2Name');
  if (w2NameInput) w2NameInput.value = '';
  // -------------------------------------------------------------

  Swal.fire({ title: 'กำลังค้นหา...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  
  const data = await callApi('searchStudent', { idCard: id });
  Swal.close();
  
  if (!data) return Swal.fire('ไม่พบข้อมูล', 'ไม่พบข้อมูลนักศึกษาในระบบ', 'error');
  current = data;
  showResult(data);
}

// ฟังก์ชันจัดการข้อความและสีของสถานะทั้ง 3 ส่วน
function getStatusDisplay(rawStatus) {
  const status = (rawStatus || "").toString().trim();
  
  if (status === "เรียบร้อย" || status === "ผ่าน") {
    return { text: "เรียบร้อย", colorClass: "status-green" };
  }
  if (status === "รอตรวจสอบ") {
    return { text: "รอตรวจสอบ", colorClass: "status-purple" };
  }
  if (status === "-") {
    return { text: "-", colorClass: "status-gray" };
  }
  // กรณีว่าง, "ยังไม่ส่ง", "รอแนบเอกสาร", "รอแนบเเอกสาร", "แก้ไข" หรืออื่นๆ ให้แสดงเป็น "รอดำเนินการ" สีเหลือง
  return { text: "รอดำเนินการ", colorClass: "status-yellow" };
}

function showResult(data) {
  document.getElementById('resultArea').classList.remove('hidden');
  document.getElementById('resName').innerText = data.name;
  document.getElementById('resName2').innerText = data.name;
  document.getElementById('resName3').innerText = data.name;
  document.getElementById('resId').innerText = data.studentId;
  document.getElementById('resCourse').innerText = data.course || "-";
  
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localToday = new Date(now.getTime() - (offset * 60 * 1000));
  const todayStr = localToday.toISOString().split('T')[0];
  
  ['dateInput', 'contractDate'].forEach(id => {
    const el = document.getElementById(id);
    if(el) { el.value = todayStr; el.max = todayStr; }
  });

  // 1. PDPA
  const pdpaInfo = getStatusDisplay(data.pdpaStatus);
  document.getElementById('pdpaBadge').innerText = "PDPA: " + pdpaInfo.text;
  document.getElementById('pdpaBadge').className = "px-3 py-2 rounded-full text-white text-xs font-bold truncate shadow-sm " + pdpaInfo.colorClass;
  if(data.pdpaPdfUrl) {
    document.getElementById('pdpaForm').classList.add('hidden');
    document.getElementById('pdpaViewArea').classList.remove('hidden');
    document.getElementById('viewPdpaBtn').href = data.pdpaPdfUrl;
  } else {
    document.getElementById('pdpaForm').classList.remove('hidden');
    document.getElementById('pdpaViewArea').classList.add('hidden');
  }

  // 2. Contract
  const contractInfo = getStatusDisplay(data.contractStatus);
  document.getElementById('contractBadge').innerText = "Contract: " + contractInfo.text;
  document.getElementById('contractBadge').className = "px-3 py-2 rounded-full text-white text-xs font-bold truncate shadow-sm " + contractInfo.colorClass;
  if(data.contractPdfUrl) {
    document.getElementById('contractForm').classList.add('hidden');
    document.getElementById('contractViewArea').classList.remove('hidden');
    document.getElementById('viewContractBtn').href = data.contractPdfUrl;
  } else {
    document.getElementById('contractForm').classList.remove('hidden');
    document.getElementById('contractViewArea').classList.add('hidden');
  }

  // 3. Transcript
  const transInfo = getStatusDisplay(data.transcriptStatus);
  document.getElementById('transBadge').innerText = "Transcript: " + transInfo.text;
  document.getElementById('transBadge').className = "px-3 py-2 rounded-full text-white text-xs font-bold truncate shadow-sm " + transInfo.colorClass;
  
  const uz = document.getElementById('uploadZone');
  const transView = document.getElementById('transViewArea');
  
  if (data.transcriptFileUrl && (data.transcriptStatus || "").trim() !== "แก้ไข") {
    uz.classList.add('hidden');
    transView.classList.remove('hidden');
    document.getElementById('viewTransBtn').href = data.transcriptFileUrl;
  } else {
    uz.classList.remove('hidden');
    transView.classList.add('hidden');
  }
}

function showProgressLoading(titleText) {
  let timerInterval;
  let progress = 0;
  Swal.fire({
    title: titleText,
    html: `
      <div class="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
        <div id="progressBar" class="bg-blue-600 h-4 rounded-full transition-all duration-300" style="width: 0%"></div>
      </div>
      <b id="progressText" class="text-blue-900 text-lg">0%</b>
    `,
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => {
      const b = Swal.getHtmlContainer();
      const progressB = b.querySelector('#progressBar');
      const progressT = b.querySelector('#progressText');
      
      timerInterval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 10;
        if (progress > 90) progress = 90;
        progressB.style.width = progress + '%';
        progressT.innerText = progress + '%';
      }, 250);
    },
    willClose: () => {
      clearInterval(timerInterval);
    }
  });
}

async function submitPdpa() {
  const dateVal = document.getElementById('dateInput').value;
  if (!dateVal) return Swal.fire('แจ้งเตือน', 'กรุณาเลือกวันที่', 'warning');
  if (!savedSigs.user) return Swal.fire('แจ้งเตือน', 'กรุณาลายมือชื่อนักศึกษา', 'warning');

  showProgressLoading('กำลังสร้างเอกสาร PDF PDPA...');

  const formData = {
    row: current.row, name: current.name, idCard: current.idCard, studentId: current.studentId,
    date: dateVal, writtenAt: document.getElementById('writtenAt').value,
    q1: document.querySelector('input[name="q1"]:checked').value,
    q2: document.querySelector('input[name="q2"]:checked').value,
    q3: document.querySelector('input[name="q3"]:checked').value,
    q4: document.querySelector('input[name="q4"]:checked').value,
    q5: document.querySelector('input[name="q5"]:checked').value,
    userSig: savedSigs.user
  };

  try {
    await callApi('savePdpa', { formData });
    document.getElementById('progressBar').style.width = '100%';
    document.getElementById('progressText').innerText = '100% สำเร็จ!';
    setTimeout(() => {
      Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'บันทึก PDPA เรียบร้อยแล้ว', timer: 1500, showConfirmButton: false }).then(() => search());
    }, 400);
  } catch (e) {
    Swal.close();
  }
}

async function submitContract() {
  const contractDate = document.getElementById('contractDate').value;
  const birthDate = document.getElementById('birthDate').value;
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();
  
  const addrNo = document.getElementById('addrNo').value.trim();
  const addrMoo = document.getElementById('addrMoo').value.trim();
  const addrSoi = document.getElementById('addrSoi').value.trim();
  const addrRoad = document.getElementById('addrRoad').value.trim();
  const province = document.getElementById('provinceSelect').value;
  const amphoe = document.getElementById('amphoeSelect').value;
  const tambon = document.getElementById('tambonSelect').value;
  const zipcode = document.getElementById('zipcodeInput').value.trim();

  const parentName = document.getElementById('parentName').value.trim();
  const parentPhone = document.getElementById('parentPhone').value.trim();

  if (!contractDate || !birthDate) return Swal.fire('แจ้งเตือน', 'กรุณาเลือกวันที่ทำสัญญาและวันเกิดให้ครบถ้วน', 'warning');
  
  const phoneRegex = /^0[0-9]{9}$/;
  if (!phoneRegex.test(phone)) {
    return Swal.fire('รูปแบบไม่ถูกต้อง', 'กรุณากรอกเบอร์โทรศัพท์นักศึกษาเป็นตัวเลข 10 หลัก (ขึ้นต้นด้วย 0)', 'warning');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return Swal.fire('รูปแบบไม่ถูกต้อง', 'กรุณากรอกรูปแบบอีเมลให้ถูกต้อง (เช่น example@email.com)', 'warning');
  }

  if (!addrNo || !province || !amphoe || !tambon || !zipcode) {
    return Swal.fire('แจ้งเตือน', 'กรุณากรอกบ้านเลขที่ และเลือกจังหวัด เขต/อำเภอ ตำบล/แขวง ให้ครบถ้วน', 'warning');
  }

  if (!parentName) return Swal.fire('แจ้งเตือน', 'กรุณากรอกชื่อ-นามสกุลผู้ปกครอง', 'warning');
  if (!phoneRegex.test(parentPhone)) {
    return Swal.fire('รูปแบบไม่ถูกต้อง', 'กรุณากรอกเบอร์โทรศัพท์ผู้ปกครองเป็นตัวเลข 10 หลัก (ขึ้นต้นด้วย 0)', 'warning');
  }

  if (!savedSigs.studentSig) return Swal.fire('แจ้งเตือน', 'กรุณาลายมือชื่อนักศึกษา', 'warning');
  if (!savedSigs.parentSig) return Swal.fire('แจ้งเตือน', 'กรุณาลายมือชื่อผู้ปกครอง', 'warning');

  const isBkk = province === 'กรุงเทพมหานคร';
  const subdistrictPrefix = isBkk ? 'แขวง' : 'ตำบล';
  const districtPrefix = isBkk ? 'เขต' : 'อำเภอ';

  let fullAddressParts = [`บ้านเลขที่ ${addrNo}`];
  if (addrMoo && addrMoo !== '-') fullAddressParts.push(`หมู่ ${addrMoo}`);
  if (addrSoi && addrSoi !== '-') fullAddressParts.push(`ซอย${addrSoi}`);
  if (addrRoad && addrRoad !== '-') fullAddressParts.push(`ถนน${addrRoad}`);
  fullAddressParts.push(`${subdistrictPrefix}${tambon}`);
  fullAddressParts.push(`${districtPrefix}${amphoe}`);
  fullAddressParts.push(isBkk ? province : `จังหวัด${province}`);
  fullAddressParts.push(zipcode);

  const address = fullAddressParts.join(' ');

  showProgressLoading('กำลังสร้างเอกสาร PDF สัญญาการศึกษา...');

  const formData = {
    row: current.row, name: current.name, idCard: current.idCard, studentId: current.studentId,
    course: current.course,
    contractDate, birthDate, address, phone, email, parentName, parentPhone,
    studentSig: savedSigs.studentSig, parentSig: savedSigs.parentSig
  };

  try {
    await callApi('saveContract', { formData });
    document.getElementById('progressBar').style.width = '100%';
    document.getElementById('progressText').innerText = '100% สำเร็จ!';
    setTimeout(() => {
      Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'บันทึกสัญญาการศึกษาเรียบร้อยแล้ว', timer: 1500, showConfirmButton: false }).then(() => search());
    }, 400);
  } catch (e) {
    Swal.close();
  }
}

async function uploadFile() {
  const file = document.getElementById('fileIn').files[0];
  if (!file) return Swal.fire('แจ้งเตือน', 'กรุณาเลือกไฟล์ PDF', 'info');

  showProgressLoading('กำลังอัปโหลดเอกสาร Transcript...');

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      await callApi('uploadTranscript', { base64: e.target.result, fileName: file.name, row: current.row });
      document.getElementById('progressBar').style.width = '100%';
      document.getElementById('progressText').innerText = '100% สำเร็จ!';
      setTimeout(() => {
        Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'อัปโหลดไฟล์เรียบร้อยแล้ว', timer: 1500, showConfirmButton: false }).then(() => search());
      }, 400);
    } catch (err) {
      Swal.close();
    }
  };
  reader.readAsDataURL(file);
}

function openModal(type) {
  activeType = type;
  document.getElementById('sigModal').style.display = 'block';
  const canvas = document.getElementById('modalCanvas');
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width = canvas.offsetWidth * ratio; 
  canvas.height = canvas.offsetHeight * ratio;
  canvas.getContext("2d").scale(ratio, ratio);
  modalPad = new SignaturePad(canvas, { backgroundColor: 'white', penColor: 'navy' });
}

function closeModal() { document.getElementById('sigModal').style.display = 'none'; }
function clearModalSig() { modalPad.clear(); }
function saveModalSig() {
  if (modalPad.isEmpty()) return;
  const dataUrl = modalPad.toDataURL();
  savedSigs[activeType] = dataUrl;
  
  let previewId = activeType + 'Preview';
  if(activeType === 'user') previewId = 'userPreview';
  
  document.getElementById(previewId).innerHTML = `<img src="${dataUrl}" class="h-full">`;
  closeModal();
}

document.getElementById('parentName')?.addEventListener('input', (e) => {
  const val = e.target.value.trim();
  document.getElementById('parentNamePreview').innerText = val || "ผู้ปกครอง";
});
