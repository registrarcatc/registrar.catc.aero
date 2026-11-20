// *** URL Web App ของ Google Apps Script ***
const API_URL = "https://script.google.com/macros/s/AKfycbw1K2D8a27-m4AjHEA9FSQjhxpkwSspuKpZ4HJa2NYtti4kwbOhjQgmpoIy_0XhElW0/exec";
const ADMIN_ID = "1032355109000";
const THAI_ADDRESS_CACHE_KEY = "CATC_THAI_ADDRESS_V1";

const ALL_77_PROVINCES = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น",
  "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย",
  "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา",
  "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์",
  "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา",
  "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต",
  "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง",
  "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร",
  "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี",
  "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย",
  "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี",
  "อุบลราชธานี"
];

let currentStudent = null;
let adminStudentsList = [];
let currentAdminTab = 'pdpa';
let thaiAddressData = [];
let modalProgressTimer = null;

// ==========================================
// ฟังก์ชันล้างฟอร์มทั้งหมด (ป้องกันข้อมูลค้างข้ามผู้ใช้)
// ==========================================
function resetAllForms() {
  const today = new Date().toISOString().split('T')[0];

  // 1. ล้างฟอร์ม PDPA
  const writtenAtEl = document.getElementById('writtenAt');
  const dateInputEl = document.getElementById('dateInput');
  if (writtenAtEl) writtenAtEl.value = 'สถาบันการบินพลเรือน';
  if (dateInputEl) dateInputEl.value = today;

  ['q1', 'q2', 'q3', 'q4', 'q5'].forEach(qName => {
    const agreeRadio = document.querySelector(`input[name="${qName}"][value="ยินยอม"]`);
    if (agreeRadio) agreeRadio.checked = true;
  });

  // 2. ล้างฟอร์ม Contract
  const contractDateEl = document.getElementById('contractDate');
  const birthDateEl = document.getElementById('birthDate');
  if (contractDateEl) contractDateEl.value = today;
  if (birthDateEl) birthDateEl.value = '';

  ['phone', 'email', 'addrNo', 'addrMoo', 'addrSoi', 'addrRoad', 'parentName', 'parentPhone', 'zipcodeInput']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

  const parentPreviewEl = document.getElementById('parentNamePreview');
  if (parentPreviewEl) parentPreviewEl.innerText = 'ผู้ปกครอง';

  const provSearchEl = document.getElementById('provinceSearchInput');
  const clearProvBtn = document.getElementById('clearProvinceSearchBtn');
  const provDropdown = document.getElementById('provinceFilterDropdown');
  if (provSearchEl) provSearchEl.value = '';
  if (clearProvBtn) clearProvBtn.classList.add('hidden');
  if (provDropdown) {
    provDropdown.innerHTML = '';
    provDropdown.classList.add('hidden');
  }

  const provSelect = document.getElementById('provinceSelect');
  const amphoeSelect = document.getElementById('amphoeSelect');
  const tambonSelect = document.getElementById('tambonSelect');
  if (provSelect) {
    populateProvinceDropdown(provSelect, false);
    provSelect.value = '';
  }
  if (amphoeSelect) {
    amphoeSelect.innerHTML = '<option value="">-- เลือกเขต/อำเภอ --</option>';
    amphoeSelect.disabled = true;
    amphoeSelect.className = "w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-[#128F8B] bg-gray-100 text-sm";
  }
  if (tambonSelect) {
    tambonSelect.innerHTML = '<option value="">-- เลือกตำบล/แขวง --</option>';
    tambonSelect.disabled = true;
    tambonSelect.className = "w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-[#128F8B] bg-gray-100 text-sm";
  }

  // 3. ล้างลายมือชื่อทั้งหมด
  savedSignatures = { user: null, studentSig: null, parentSig: null };
  if (modalSignaturePad) modalSignaturePad.clear();

  const userPrev = document.getElementById('userPreview');
  const stuPrev = document.getElementById('studentSigPreview');
  const parPrev = document.getElementById('parentSigPreview');
  if (userPrev) userPrev.innerHTML = '<span class="text-gray-400 text-xs italic">คลิกเพื่อเซ็นชื่อ</span>';
  if (stuPrev) stuPrev.innerHTML = '<span class="text-gray-400 text-xs italic">คลิกเพื่อเซ็นชื่อ</span>';
  if (parPrev) parPrev.innerHTML = '<span class="text-gray-400 text-xs italic">คลิกเพื่อเซ็นชื่อ</span>';

  // 4. ล้างไฟล์ Transcript ที่เลือกไว้
  const fileIn = document.getElementById('fileIn');
  const fileNameEl = document.getElementById('fileName');
  if (fileIn) fileIn.value = '';
  if (fileNameEl) fileNameEl.innerText = 'ขนาดไม่เกิน 5MB';
}

// ==========================================
// 1. ระบบค้นหาหลัก (รองรับทั้ง Admin และนักศึกษา)
// ==========================================
async function search() {
  const idCard = document.getElementById('idSearch').value.trim();
  if (idCard.length !== 13) {
    Swal.fire({ icon: 'warning', title: 'กรุณากรอกเลขบัตรประชาชน 13 หลักให้ครบถ้วน' });
    return;
  }

  resetAllForms();
  Swal.fire({ title: 'กำลังค้นหาข้อมูล...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  // กรณีที่ 1: กรอกเลข Admin
  if (idCard === ADMIN_ID) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        redirect: 'follow',
        body: JSON.stringify({ action: 'getAdminList' })
      });
      const res = await response.json();
      Swal.close();

      if (res.status === 'success') {
        adminStudentsList = res.data || [];
        document.getElementById('resultArea').classList.add('hidden');
        document.getElementById('adminArea').classList.remove('hidden');
        renderAdminDashboard();
        Swal.fire({ icon: 'success', title: 'เข้าสู่ระบบ Admin สำเร็จ', timer: 1200, showConfirmButton: false });
      } else {
        Swal.fire({ icon: 'error', title: 'ไม่สามารถโหลดข้อมูล Admin ได้', text: res.message });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', text: err.message });
    }
    return;
  }

  // กรณีที่ 2: กรอกเลขบัตรประชาชนนักศึกษา
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify({ action: 'searchStudent', idCard: idCard })
    });
    const res = await response.json();
    Swal.close();

    if (res.status === 'success' && res.data) {
      currentStudent = res.data;
      document.getElementById('adminArea').classList.add('hidden');
      document.getElementById('resultArea').classList.remove('hidden');
      renderStudentUI();
    } else {
      Swal.fire({ icon: 'error', title: 'ไม่พบข้อมูลนักศึกษา', text: 'กรุณาตรวจสอบเลขบัตรประชาชน 13 หลักอีกครั้ง' });
      document.getElementById('resultArea').classList.add('hidden');
      document.getElementById('adminArea').classList.add('hidden');
    }
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาดในการเชื่อมต่อ', text: err.message });
  }
}

// ==========================================
// 2. ระบบแสดงผลและการส่งข้อมูลฝั่งนักศึกษา
// ==========================================
function renderStudentUI() {
  document.getElementById('resName').innerText = currentStudent.name;
  document.getElementById('resName2').innerText = currentStudent.name;
  document.getElementById('resName3').innerText = currentStudent.name;
  document.getElementById('resId').innerText = currentStudent.studentId;
  document.getElementById('resCourse').innerText = currentStudent.course;

  setBadge('pdpaBadge', 'PDPA', currentStudent.pdpaStatus);
  setBadge('contractBadge', 'Contract', currentStudent.contractStatus);
  setBadge('transBadge', 'Transcript', currentStudent.transcriptStatus);

  // จัดการแสดงผลฟอร์ม PDPA
  if (currentStudent.pdpaPdfUrl && currentStudent.pdpaStatus) {
    document.getElementById('pdpaForm').classList.add('hidden');
    document.getElementById('pdpaViewArea').classList.remove('hidden');
    document.getElementById('viewPdpaBtn').href = currentStudent.pdpaPdfUrl;
    document.getElementById('viewPdpaBtn').innerText = `ดูเอกสาร PDPA (${currentStudent.pdpaStatus})`;
  } else {
    document.getElementById('pdpaForm').classList.remove('hidden');
    document.getElementById('pdpaViewArea').classList.add('hidden');
  }

  // จัดการแสดงผลฟอร์ม Contract
  if (currentStudent.contractPdfUrl && currentStudent.contractStatus) {
    document.getElementById('contractForm').classList.add('hidden');
    document.getElementById('contractViewArea').classList.remove('hidden');
    document.getElementById('viewContractBtn').href = currentStudent.contractPdfUrl;
    document.getElementById('viewContractBtn').innerText = `ดูเอกสารสัญญา (${currentStudent.contractStatus})`;
  } else {
    document.getElementById('contractForm').classList.remove('hidden');
    document.getElementById('contractViewArea').classList.add('hidden');
  }

  // จัดการแสดงผล Transcript
  if (currentStudent.transcriptFileUrl && currentStudent.transcriptStatus) {
    document.getElementById('uploadZone').classList.add('hidden');
    document.getElementById('transViewArea').classList.remove('hidden');
    document.getElementById('viewTransBtn').href = currentStudent.transcriptFileUrl;
    document.getElementById('viewTransBtn').innerText = `ดู Transcript (${currentStudent.transcriptStatus})`;
  } else {
    document.getElementById('uploadZone').classList.remove('hidden');
    document.getElementById('transViewArea').classList.add('hidden');
  }

  // ปุ่มเข้าสู่ระบบบริหารการศึกษา (เปลี่ยนเป็นสีส้มเมื่อสถานะเป็น "เรียบร้อย" ครบทั้ง 3 รายการ)
  const isAllPassed = (
    currentStudent.pdpaStatus === 'เรียบร้อย' &&
    currentStudent.contractStatus === 'เรียบร้อย' &&
    currentStudent.transcriptStatus === 'เรียบร้อย'
  );
  const eduBtn = document.getElementById('eduSystemBtn');
  if (isAllPassed) {
    eduBtn.className = "w-full py-3.5 rounded-2xl font-bold text-white text-base shadow-md transition status-orange cursor-pointer";
  } else {
    eduBtn.className = "w-full py-3.5 rounded-2xl font-bold text-white text-base shadow-md transition status-gray cursor-not-allowed";
  }
}

// ควบคุม Modal แถบบาร์แสดง % ความคืบหน้าขณะรอสร้าง/อัปโหลด
function openProgressModal(titleText, labelText, percent = 10) {
  const modal = document.getElementById('progressModal');
  const titleEl = document.getElementById('progressModalTitle');
  const labelEl = document.getElementById('progressModalLabel');
  if (!modal) return;

  if (titleText) titleEl.innerText = titleText;
  if (labelText) labelEl.innerText = labelText;
  updateProgressModalValue(percent);
  modal.style.display = 'block';
}

function updateProgressModalValue(percent, labelText) {
  const labelEl = document.getElementById('progressModalLabel');
  const pctEl = document.getElementById('progressModalPercent');
  const barEl = document.getElementById('progressModalBar');
  const safePercent = Math.max(0, Math.min(100, percent));

  if (labelText && labelEl) labelEl.innerText = labelText;
  if (pctEl) pctEl.innerText = `${safePercent}%`;
  if (barEl) barEl.style.width = `${safePercent}%`;
}

function startModalSmoothProgress(startPercent, maxPercent, labelText) {
  stopModalSmoothProgress();
  let current = startPercent;
  updateProgressModalValue(current, labelText);

  modalProgressTimer = setInterval(() => {
    if (current < maxPercent) {
      current += 3;
      if (current > maxPercent) current = maxPercent;
      updateProgressModalValue(current, labelText);
    }
  }, 180);
}

function stopModalSmoothProgress() {
  if (modalProgressTimer) {
    clearInterval(modalProgressTimer);
    modalProgressTimer = null;
  }
}

function closeProgressModal() {
  stopModalSmoothProgress();
  const modal = document.getElementById('progressModal');
  if (modal) modal.style.display = 'none';
  updateProgressModalValue(0, '');
}

function setBadge(id, title, status) {
  const el = document.getElementById(id);
  const tabMap = {
    pdpaBadge: 'pdpa',
    contractBadge: 'contract',
    transBadge: 'trans'
  };
  const targetTab = tabMap[id];

  if (targetTab) {
    el.onclick = function() {
      switchTab(targetTab, true);
    };
    el.title = `คลิกเพื่อไปยังแท็บ${title}`;
  }

  const cursorClass = targetTab ? "cursor-pointer hover:opacity-90 transition" : "";

  if (status === 'เรียบร้อย') {
    el.innerHTML = `${title}: ✅`;
    el.className = `px-3 py-2 rounded-full text-white text-xs font-bold truncate shadow-sm status-green ${cursorClass}`;
  } else if (status === 'รอตรวจสอบ') {
    el.innerHTML = `${title}: <i class="fa-solid fa-clock mr-1"></i>รอตรวจสอบ`;
    el.className = `px-3 py-2 rounded-full text-white text-xs font-bold truncate shadow-sm status-yellow ${cursorClass}`;
  } else {
    el.innerHTML = `${title}: <i class="fa-solid fa-hourglass-half mr-1"></i>รอดำเนินการ`;
    el.className = `px-3 py-2 rounded-full text-white text-xs font-bold truncate shadow-sm status-gray ${cursorClass}`;
  }
}

function handleEduSystemClick() {
  if (!currentStudent) return;
  const isAllPassed = (
    currentStudent.pdpaStatus === 'เรียบร้อย' &&
    currentStudent.contractStatus === 'เรียบร้อย' &&
    currentStudent.transcriptStatus === 'เรียบร้อย'
  );

  if (!isAllPassed) {
    Swal.fire({
      icon: 'warning',
      title: 'ยังไม่สามารถเข้าสู่ระบบได้',
      text: 'เอกสารทั้ง 3 รายการต้องได้รับการตรวจสอบและมีสถานะ "เรียบร้อย" ครบทั้งหมดก่อน'
    });
    return;
  }

  const cleanIdCard = String(currentStudent.idCard || '').trim();
  const last5Digits = cleanIdCard.length >= 5 ? cleanIdCard.slice(-5) : cleanIdCard;

  const eduUrl = currentStudent.eduUrl || 'https://reg.catc.or.th';
  const username = currentStudent.eduUsername || currentStudent.username || currentStudent.studentId || '-';
  const password = last5Digits || '-';

  document.getElementById('eduUrlText').innerText = eduUrl;
  document.getElementById('eduUrlText').href = eduUrl;
  document.getElementById('eduGoLink').href = eduUrl;
  document.getElementById('eduUsernameText').innerText = username;
  document.getElementById('eduPasswordText').innerText = password;

  document.getElementById('eduModal').style.display = 'block';
}

function closeEduModal() {
  document.getElementById('eduModal').style.display = 'none';
}

function copyEduValue(elementId) {
  const text = document.getElementById(elementId).innerText;
  if (!text || text === '-') return;
  navigator.clipboard.writeText(text).then(() => {
    Swal.fire({
      icon: 'success',
      title: 'คัดลอกแล้ว',
      text: text,
      timer: 1000,
      showConfirmButton: false
    });
  });
}

// บันทึก PDPA พร้อมแถบบาร์ใน Modal และล้างฟอร์มหลังสร้าง PDF เสร็จ
async function submitPdpa() {
  const writtenAt = document.getElementById('writtenAt').value.trim();
  const date = document.getElementById('dateInput').value;
  if (!writtenAt || !date) {
    Swal.fire({ icon: 'warning', title: 'กรุณากรอกสถานที่เขียนและวันที่' });
    return;
  }
  if (!savedSignatures.user) {
    Swal.fire({ icon: 'warning', title: 'กรุณาลงลายมือชื่อนักศึกษาก่อนบันทึก' });
    return;
  }

  const formData = {
    row: currentStudent.row,
    studentId: currentStudent.studentId,
    name: currentStudent.name,
    idCard: currentStudent.idCard,
    writtenAt: writtenAt,
    date: date,
    q1: document.querySelector('input[name="q1"]:checked').value,
    q2: document.querySelector('input[name="q2"]:checked').value,
    q3: document.querySelector('input[name="q3"]:checked').value,
    q4: document.querySelector('input[name="q4"]:checked').value,
    q5: document.querySelector('input[name="q5"]:checked').value,
    userSig: savedSignatures.user
  };

  openProgressModal('กำลังสร้างเอกสาร PDF PDPA', 'กำลังเตรียมข้อมูลและสร้างไฟล์ PDF...', 15);
  startModalSmoothProgress(15, 90, 'กำลังสร้างไฟล์ PDF PDPA และบันทึกข้อมูล...');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify({ action: 'savePdpa', formData: formData })
    });
    const res = await response.json();
    stopModalSmoothProgress();

    if (res.status === 'success') {
      updateProgressModalValue(100, 'สร้างไฟล์ PDF PDPA สำเร็จ (100%)');
      currentStudent.pdpaPdfUrl = res.data;
      currentStudent.pdpaStatus = 'รอตรวจสอบ';
      resetAllForms();
      renderStudentUI();
      setTimeout(() => {
        closeProgressModal();
        Swal.fire({ icon: 'success', title: 'บันทึกและสร้าง PDF PDPA สำเร็จ' });
      }, 600);
    } else {
      closeProgressModal();
      Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: res.message });
    }
  } catch (err) {
    closeProgressModal();
    Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message });
  }
}

// บันทึก Contract พร้อมแถบบาร์ใน Modal และล้างฟอร์มหลังสร้าง PDF เสร็จ
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
  const zipcode = document.getElementById('zipcodeInput').value;
  const parentName = document.getElementById('parentName').value.trim();
  const parentPhone = document.getElementById('parentPhone').value.trim();

  if (!contractDate || !birthDate || phone.length !== 10 || !email || !addrNo || !province || !amphoe || !tambon || !parentName || parentPhone.length !== 10) {
    Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วนและถูกต้อง' });
    return;
  }
  if (!savedSignatures.studentSig || !savedSignatures.parentSig) {
    Swal.fire({ icon: 'warning', title: 'กรุณาลงลายมือชื่อทั้งนักศึกษาและผู้ปกครอง' });
    return;
  }

  const fullAddress = `บ้านเลขที่ ${addrNo} ${addrMoo ? 'หมู่ ' + addrMoo : ''} ${addrSoi ? 'ซอย' + addrSoi : ''} ${addrRoad ? 'ถนน' + addrRoad : ''} ตำบล/แขวง${tambon} อำเภอ/เขต${amphoe} จังหวัด${province} ${zipcode}`.replace(/\s+/g, ' ').trim();

  const formData = {
    row: currentStudent.row,
    course: currentStudent.course,
    contractDate: contractDate,
    name: currentStudent.name,
    studentId: currentStudent.studentId,
    idCard: currentStudent.idCard,
    birthDate: birthDate,
    address: fullAddress,
    phone: phone,
    email: email,
    parentName: parentName,
    parentPhone: parentPhone,
    studentSig: savedSignatures.studentSig,
    parentSig: savedSignatures.parentSig
  };

  openProgressModal('กำลังสร้างเอกสาร PDF สัญญาการศึกษา', 'กำลังเตรียมข้อมูลและสร้างไฟล์ PDF...', 15);
  startModalSmoothProgress(15, 90, 'กำลังสร้างไฟล์ PDF สัญญาการศึกษาและบันทึกข้อมูล...');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify({ action: 'saveContract', formData: formData })
    });
    const res = await response.json();
    stopModalSmoothProgress();

    if (res.status === 'success') {
      updateProgressModalValue(100, 'สร้างไฟล์ PDF สัญญาการศึกษาสำเร็จ (100%)');
      currentStudent.contractPdfUrl = res.data;
      currentStudent.contractStatus = 'รอตรวจสอบ';
      resetAllForms();
      renderStudentUI();
      setTimeout(() => {
        closeProgressModal();
        Swal.fire({ icon: 'success', title: 'บันทึกและสร้าง PDF สัญญาสำเร็จ' });
      }, 600);
    } else {
      closeProgressModal();
      Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: res.message });
    }
  } catch (err) {
    closeProgressModal();
    Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message });
  }
}

// อัปโหลด Transcript พร้อมแถบบาร์ใน Modal และล้างฟอร์มหลังเสร็จ
async function uploadFile() {
  const fileInput = document.getElementById('fileIn');
  if (!fileInput.files || fileInput.files.length === 0) {
    Swal.fire({ icon: 'warning', title: 'กรุณาเลือกไฟล์ PDF ก่อนอัปโหลด' });
    return;
  }
  const file = fileInput.files[0];
  if (file.size > 5 * 1024 * 1024) {
    Swal.fire({ icon: 'warning', title: 'ขนาดไฟล์เกิน 5MB' });
    return;
  }

  openProgressModal('กำลังอัปโหลดไฟล์ Transcript', 'กำลังอ่านไฟล์ PDF...', 10);

  const reader = new FileReader();
  reader.onload = async function() {
    startModalSmoothProgress(25, 90, 'กำลังอัปโหลดไฟล์ Transcript...');
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        redirect: 'follow',
        body: JSON.stringify({
          action: 'uploadTranscript',
          base64: reader.result,
          fileName: `Transcript_${currentStudent.studentId}_${currentStudent.name}.pdf`,
          row: currentStudent.row
        })
      });
      const res = await response.json();
      stopModalSmoothProgress();

      if (res.status === 'success') {
        updateProgressModalValue(100, 'อัปโหลดไฟล์ Transcript สำเร็จ (100%)');
        currentStudent.transcriptFileUrl = res.data;
        currentStudent.transcriptStatus = 'รอตรวจสอบ';
        resetAllForms();
        renderStudentUI();
        setTimeout(() => {
          closeProgressModal();
          Swal.fire({ icon: 'success', title: 'อัปโหลด Transcript สำเร็จ' });
        }, 600);
      } else {
        closeProgressModal();
        Swal.fire({ icon: 'error', title: 'อัปโหลดไม่สำเร็จ', text: res.message });
      }
    } catch (err) {
      closeProgressModal();
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message });
    }
  };
  reader.onerror = function() {
    closeProgressModal();
    Swal.fire({ icon: 'error', title: 'อ่านไฟล์ไม่สำเร็จ' });
  };
  reader.readAsDataURL(file);
}

// ==========================================
// 3. ระบบผู้ดูแลระบบ (ADMIN DASHBOARD)
// ==========================================
function logoutAdmin() {
  document.getElementById('adminArea').classList.add('hidden');
  document.getElementById('idSearch').value = '';
  Swal.fire({ icon: 'info', title: 'ออกจากระบบ Admin แล้ว', timer: 1200, showConfirmButton: false });
}

function renderAdminDashboard() {
  const totalCount = adminStudentsList.length;
  const completedCount = adminStudentsList.filter(s =>
    s.pdpaStatus === "เรียบร้อย" &&
    s.contractStatus === "เรียบร้อย" &&
    s.transcriptStatus === "เรียบร้อย"
  ).length;
  const pendingCount = totalCount - completedCount;

  document.getElementById('dashTotal').innerText = totalCount;
  document.getElementById('dashCompleted').innerText = completedCount;
  document.getElementById('dashPending').innerText = pendingCount;

  const countPdpa = adminStudentsList.filter(s => s.pdpaPdfUrl !== "" && s.pdpaStatus === "รอตรวจสอบ").length;
  const countContract = adminStudentsList.filter(s => s.contractPdfUrl !== "" && s.contractStatus === "รอตรวจสอบ").length;
  const countTrans = adminStudentsList.filter(s => s.transcriptFileUrl !== "" && s.transcriptStatus === "รอตรวจสอบ").length;

  document.getElementById('countPdpa').innerText = countPdpa;
  document.getElementById('countContract').innerText = countContract;
  document.getElementById('countTrans').innerText = countTrans;

  renderAdminTable();
}

function switchAdminTab(tab) {
  currentAdminTab = tab;
  document.getElementById('adminTabPdpa').className = tab === 'pdpa'
    ? "flex-1 py-2.5 px-1 md:py-3 text-center text-theme-green border-b-4 border-theme-green transition bg-emerald-50"
    : "flex-1 py-2.5 px-1 md:py-3 text-center text-gray-400 border-b-4 border-transparent transition hover:text-theme-green";
  document.getElementById('adminTabContract').className = tab === 'contract'
    ? "flex-1 py-2.5 px-1 md:py-3 text-center text-theme-green border-b-4 border-theme-green transition bg-emerald-50"
    : "flex-1 py-2.5 px-1 md:py-3 text-center text-gray-400 border-b-4 border-transparent transition hover:text-theme-green";
  document.getElementById('adminTabTrans').className = tab === 'trans'
    ? "flex-1 py-2.5 px-1 md:py-3 text-center text-theme-green border-b-4 border-theme-green transition bg-emerald-50"
    : "flex-1 py-2.5 px-1 md:py-3 text-center text-gray-400 border-b-4 border-transparent transition hover:text-theme-green";
  renderAdminTable();
}

function renderAdminTable() {
  const tbody = document.getElementById('adminTableBody');
  const cardList = document.getElementById('adminCardList');
  tbody.innerHTML = '';
  cardList.innerHTML = '';

  const filtered = adminStudentsList.filter(s => {
    if (currentAdminTab === 'pdpa') return s.pdpaPdfUrl !== "" && s.pdpaStatus === "รอตรวจสอบ";
    if (currentAdminTab === 'contract') return s.contractPdfUrl !== "" && s.contractStatus === "รอตรวจสอบ";
    if (currentAdminTab === 'trans') return s.transcriptFileUrl !== "" && s.transcriptStatus === "รอตรวจสอบ";
    return false;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-gray-400 italic">ไม่มีเอกสารที่อยู่ในสถานะรอตรวจสอบ</td></tr>`;
    cardList.innerHTML = `<div class="p-6 text-center text-gray-400 italic bg-gray-50 rounded-2xl border text-sm">ไม่มีเอกสารที่อยู่ในสถานะรอตรวจสอบ</div>`;
    return;
  }

  filtered.forEach(s => {
    const fileUrl = currentAdminTab === 'pdpa' ? s.pdpaPdfUrl : (currentAdminTab === 'contract' ? s.contractPdfUrl : s.transcriptFileUrl);

    tbody.innerHTML += `
      <tr class="hover:bg-gray-50 border-b">
        <td class="p-4 font-mono font-bold">${s.studentId}</td>
        <td class="p-4 font-medium">${s.name}</td>
        <td class="p-4 text-xs text-gray-600">${s.course}</td>
        <td class="p-4 text-center">
          <a href="${fileUrl}" target="_blank" class="inline-block px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-xs font-bold hover:bg-blue-200 transition"><i class="fa-solid fa-eye mr-1"></i> ดูเอกสาร</a>
        </td>
        <td class="p-4 text-center">
          <div class="inline-flex items-center gap-2">
            <button onclick="adminSetStatus(${s.row}, '${currentAdminTab}', 'เรียบร้อย')" class="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-sm transition active:scale-95">
              ✅ เรียบร้อย
            </button>
            <button onclick="adminSetStatus(${s.row}, '${currentAdminTab}', 'ไม่ผ่าน')" class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-sm transition active:scale-95">
              ❌ ไม่ผ่าน
            </button>
          </div>
        </td>
      </tr>
    `;

    cardList.innerHTML += `
      <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div class="flex justify-between items-start gap-2 border-b pb-2.5">
          <div>
            <span class="text-xs font-mono font-bold text-theme-green bg-emerald-50 px-2.5 py-0.5 rounded-md">${s.studentId}</span>
            <h3 class="text-base font-bold text-gray-800 mt-1">${s.name}</h3>
            <p class="text-xs text-gray-500 mt-0.5">${s.course || '-'}</p>
          </div>
          <a href="${fileUrl}" target="_blank" class="shrink-0 px-3 py-2 bg-blue-100 text-blue-800 rounded-xl text-xs font-bold hover:bg-blue-200 transition flex items-center gap-1">
            <i class="fa-solid fa-eye"></i> ดูเอกสาร
          </a>
        </div>
        <div class="flex items-center justify-between gap-2 pt-1">
          <span class="text-xs font-bold text-gray-600 shrink-0">พิจารณาผล:</span>
          <div class="flex items-center gap-2 flex-1 justify-end">
            <button onclick="adminSetStatus(${s.row}, '${currentAdminTab}', 'เรียบร้อย')" class="flex-1 max-w-[120px] py-2 px-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95">
              ✅ เรียบร้อย
            </button>
            <button onclick="adminSetStatus(${s.row}, '${currentAdminTab}', 'ไม่ผ่าน')" class="flex-1 max-w-[120px] py-2 px-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95">
              ❌ ไม่ผ่าน
            </button>
          </div>
        </div>
      </div>
    `;
  });
}

async function adminSetStatus(row, docType, decision) {
  Swal.fire({ title: 'กำลังอัปเดตสถานะใน Google Sheet...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify({
        action: 'updateAdminStatus',
        row: row,
        docType: docType,
        decision: decision
      })
    });
    const res = await response.json();

    if (res.status === 'success') {
      const target = adminStudentsList.find(s => s.row === row);
      if (target) {
        if (docType === 'pdpa') {
          target.pdpaStatus = decision === 'เรียบร้อย' ? 'เรียบร้อย' : '';
          if (decision === 'ไม่ผ่าน') target.pdpaPdfUrl = '';
        } else if (docType === 'contract') {
          target.contractStatus = decision === 'เรียบร้อย' ? 'เรียบร้อย' : '';
          if (decision === 'ไม่ผ่าน') target.contractPdfUrl = '';
        } else if (docType === 'trans') {
          target.transcriptStatus = decision === 'เรียบร้อย' ? 'เรียบร้อย' : '';
          if (decision === 'ไม่ผ่าน') target.transcriptFileUrl = '';
        }
      }

      Swal.fire({
        icon: decision === 'เรียบร้อย' ? 'success' : 'warning',
        title: decision === 'เรียบร้อย' ? 'บันทึกสถานะ "เรียบร้อย" ลงใน Sheet แล้ว' : 'บันทึก "ไม่ผ่าน" และล้างข้อมูลเรียบร้อย',
        text: decision === 'ไม่ผ่าน' ? 'ล้างช่องสถานะและลิงก์ใน Google Sheet แล้ว เพื่อให้นักศึกษากรอกใหม่' : '',
        timer: 1800,
        showConfirmButton: false
      });

      renderAdminDashboard();
    } else {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: res.message });
    }
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ', text: err.message });
  }
}

// ==========================================
// 4. ระบบ UI, Tab, ลายมือชื่อ และข้อมูลที่อยู่ประเทศไทย (ดึงจาก API ภายนอก)
// ==========================================
function switchTab(tab, shouldScroll = false) {
  ['pdpaSection', 'contractSection', 'transSection'].forEach(id => document.getElementById(id).classList.add('hidden'));
  ['tabPdpaBtn', 'tabContractBtn', 'tabTransBtn'].forEach(id => {
    document.getElementById(id).className = "flex-1 py-3 px-1 md:py-4 text-center font-bold text-gray-400 border-b-4 border-transparent transition hover:text-theme-green";
  });

  if (tab === 'pdpa') {
    document.getElementById('pdpaSection').classList.remove('hidden');
    document.getElementById('tabPdpaBtn').className = "flex-1 py-3 px-1 md:py-4 text-center font-bold text-theme-green border-b-4 border-theme-green transition bg-emerald-50";
  } else if (tab === 'contract') {
    document.getElementById('contractSection').classList.remove('hidden');
    document.getElementById('tabContractBtn').className = "flex-1 py-3 px-1 md:py-4 text-center font-bold text-theme-green border-b-4 border-theme-green transition bg-emerald-50";
  } else if (tab === 'trans') {
    document.getElementById('transSection').classList.remove('hidden');
    document.getElementById('tabTransBtn').className = "flex-1 py-3 px-1 md:py-4 text-center font-bold text-theme-green border-b-4 border-theme-green transition bg-emerald-50";
  }

  if (shouldScroll) {
    const tabBar = document.getElementById('tabPdpaBtn')?.parentElement;
    if (tabBar) {
      tabBar.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

let modalSignaturePad = null;
let currentSigField = null;
let savedSignatures = { user: null, studentSig: null, parentSig: null };

function openModal(field) {
  currentSigField = field;
  document.getElementById('sigModal').style.display = 'block';
  const canvas = document.getElementById('modalCanvas');
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width = canvas.offsetWidth * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  canvas.getContext("2d").scale(ratio, ratio);
  modalSignaturePad = new SignaturePad(canvas, {
    penColor: '#1d4ed8',
    backgroundColor: 'rgba(255,255,255,0)'
  });
}

function closeModal() {
  document.getElementById('sigModal').style.display = 'none';
}

function clearModalSig() {
  if (modalSignaturePad) modalSignaturePad.clear();
}

function saveModalSig() {
  if (!modalSignaturePad || modalSignaturePad.isEmpty()) {
    Swal.fire({ icon: 'warning', title: 'กรุณาเซ็นชื่อก่อนกดตกลง' });
    return;
  }
  const dataUrl = modalSignaturePad.toDataURL('image/png');
  savedSignatures[currentSigField] = dataUrl;
  const previewId = currentSigField === 'user' ? 'userPreview' : (currentSigField === 'studentSig' ? 'studentSigPreview' : 'parentSigPreview');
  document.getElementById(previewId).innerHTML = `<img src="${dataUrl}" alt="signature">`;
  closeModal();
}

function closeDocViewer() {
  document.getElementById('docViewerModal').style.display = 'none';
}

function buildBase77AddressList() {
  return ALL_77_PROVINCES
    .map(name => ({
      name_th: name,
      amphure: []
    }))
    .sort((a, b) => a.name_th.localeCompare(b.name_th, 'th'));
}

function formatThaiDisplayName(item, fallbackPrefix = "") {
  if (!item) return "";
  if (typeof item === "string") return item.trim();

  if (item.name && typeof item.name === "object") {
    const pTh = item.prefix && typeof item.prefix === "object" ? (item.prefix.th || "") : "";
    const nTh = item.name.th || "";
    const combined = `${pTh}${nTh}`.trim();
    if (combined) return combined;
  }

  const rawName = String(item.name_th || item.nameInThai || item.name || "").trim();
  if (!rawName) return "";
  if (fallbackPrefix && !rawName.startsWith(fallbackPrefix)) {
    return `${fallbackPrefix}${rawName}`;
  }
  return rawName;
}

function normalizeAddressData(rawData) {
  if (!Array.isArray(rawData) || rawData.length === 0) return [];

  const mapByProvince = new Map();
  buildBase77AddressList().forEach(p => mapByProvince.set(p.name_th, p));

  rawData.forEach(p => {
    const provName = formatThaiDisplayName(p, "");
    if (!provName) return;

    const isBangkok = provName === "กรุงเทพมหานคร";
    const ampPrefix = isBangkok ? "เขต" : "อำเภอ";
    const tamPrefix = isBangkok ? "แขวง" : "ตำบล";

    const ampsRaw = p.amphure || p.amphures || p.districts || [];
    const amphures = ampsRaw
      .map(a => {
        const ampName = formatThaiDisplayName(a, ampPrefix);
        const ampZip = String(a.zip_code || a.zipCode || a.postal_code || "").trim();
        const tamsRaw = a.tambon || a.tambons || a.sub_districts || a.subdistricts || [];

        const tambons = tamsRaw
          .map(t => ({
            name_th: formatThaiDisplayName(t, tamPrefix),
            zip_code: String(t.zip_code || t.zipCode || t.postal_code || ampZip || "").trim()
          }))
          .filter(t => t.name_th);

        const inferredZip = ampZip || (tambons.find(t => t.zip_code)?.zip_code || "");
        return {
          name_th: ampName,
          zip_code: inferredZip,
          tambon: tambons
        };
      })
      .filter(a => a.name_th);

    if (mapByProvince.has(provName)) {
      const existing = mapByProvince.get(provName);
      if (amphures.length > existing.amphure.length) {
        existing.amphure = amphures;
      }
    } else {
      mapByProvince.set(provName, {
        name_th: provName,
        amphure: amphures
      });
    }
  });

  return Array.from(mapByProvince.values()).sort((a, b) =>
    a.name_th.localeCompare(b.name_th, 'th')
  );
}

function buildFromSplitAddressTables(provs, amps, tams) {
  if (!Array.isArray(provs) || !Array.isArray(amps) || !Array.isArray(tams)) return [];

  const tambonByAmphoe = new Map();
  tams.forEach(t => {
    const ampId = t.amphure_id ?? t.amphureId;
    const nameTh = String(t.name_th || t.nameInThai || '').trim();
    const zipCode = String(t.zip_code || t.zipCode || '').trim();
    if (!ampId || !nameTh) return;
    if (!tambonByAmphoe.has(ampId)) tambonByAmphoe.set(ampId, []);
    tambonByAmphoe.get(ampId).push({ name_th: nameTh, zip_code: zipCode });
  });

  const amphoeByProvince = new Map();
  amps.forEach(a => {
    const ampId = a.id;
    const provId = a.province_id ?? a.provinceId;
    const nameTh = String(a.name_th || a.nameInThai || '').trim();
    const ampZip = String(a.zip_code || a.zipCode || '').trim();
    if (!ampId || !provId || !nameTh) return;
    if (!amphoeByProvince.has(provId)) amphoeByProvince.set(provId, []);
    const tList = tambonByAmphoe.get(ampId) || [];
    amphoeByProvince.get(provId).push({
      name_th: nameTh,
      zip_code: ampZip || (tList.find(x => x.zip_code)?.zip_code || ''),
      tambon: tList
    });
  });

  const combined = provs.map(p => ({
    name_th: String(p.name_th || p.nameInThai || '').trim(),
    amphure: amphoeByProvince.get(p.id) || []
  }));

  return normalizeAddressData(combined);
}

// เลือกจังหวัดจากรายการ dropdown ที่กรองแล้วทันที
function selectFilteredProvince(provinceName) {
  const provSelect = document.getElementById('provinceSelect');
  const searchInput = document.getElementById('provinceSearchInput');
  const dropdown = document.getElementById('provinceFilterDropdown');

  if (!provSelect) return;

  if (!Array.from(provSelect.options).some(o => o.value === provinceName)) {
    populateProvinceDropdown(provSelect, false);
  }

  provSelect.value = provinceName;
  if (searchInput) {
    searchInput.value = provinceName;
  }
  const clearBtn = document.getElementById('clearProvinceSearchBtn');
  if (clearBtn) {
    clearBtn.classList.toggle('hidden', !provinceName);
  }

  if (dropdown) {
    dropdown.classList.add('hidden');
  }

  if (typeof provSelect.onchange === 'function') {
    provSelect.onchange();
  }
}

function renderFilteredProvinceDropdown(filteredProvinces, showDropdown = true) {
  const dropdown = document.getElementById('provinceFilterDropdown');
  if (!dropdown) return;

  if (!showDropdown) {
    dropdown.classList.add('hidden');
    return;
  }

  if (filteredProvinces.length === 0) {
    dropdown.innerHTML = `<div class="px-3.5 py-2.5 text-gray-400 italic text-xs md:text-sm">ไม่พบจังหวัดที่ค้นหา</div>`;
    dropdown.classList.remove('hidden');
    return;
  }

  dropdown.innerHTML = filteredProvinces
    .map(p => {
      const safeName = p.name_th.replace(/'/g, "\\'");
      return `<button type="button" onclick="selectFilteredProvince('${safeName}')" class="w-full text-left px-3.5 py-2 hover:bg-emerald-50 hover:text-theme-green font-medium text-gray-800 transition flex items-center justify-between">
        <span>${p.name_th}</span>
        <i class="fa-solid fa-chevron-right text-xs text-gray-300"></i>
      </button>`;
    })
    .join('');
  dropdown.classList.remove('hidden');
}

function populateProvinceDropdown(provSelect, shouldShowDropdown = false) {
  const searchInput = document.getElementById('provinceSearchInput');
  const clearBtn = document.getElementById('clearProvinceSearchBtn');
  const filterText = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const previousValue = provSelect.value;

  if (clearBtn) {
    if (filterText) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
  }

  const filteredProvinces = filterText
    ? thaiAddressData.filter(p => p.name_th.toLowerCase().includes(filterText))
    : thaiAddressData;

  provSelect.innerHTML = '';

  if (filteredProvinces.length === 0) {
    const emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.textContent = '-- ไม่พบจังหวัดที่ค้นหา --';
    provSelect.appendChild(emptyOpt);
  } else {
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = filterText
      ? `-- เลือกจังหวัด (${filteredProvinces.length} รายการ) --`
      : '-- เลือกจังหวัด --';
    provSelect.appendChild(defaultOpt);

    filteredProvinces.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.name_th;
      opt.textContent = p.name_th;
      provSelect.appendChild(opt);
    });
  }

  if (previousValue && filteredProvinces.some(p => p.name_th === previousValue)) {
    provSelect.value = previousValue;
  } else if (previousValue && previousValue !== provSelect.value) {
    provSelect.value = '';
    if (typeof provSelect.onchange === 'function') {
      provSelect.onchange();
    }
  }

  if (shouldShowDropdown && filterText) {
    renderFilteredProvinceDropdown(filteredProvinces, true);
  } else {
    renderFilteredProvinceDropdown([], false);
  }
}

function clearProvinceFilter() {
  const searchInput = document.getElementById('provinceSearchInput');
  const provSelect = document.getElementById('provinceSelect');
  if (searchInput) {
    searchInput.value = '';
    searchInput.focus();
  }
  if (provSelect) {
    populateProvinceDropdown(provSelect, false);
  }
}

function bindProvinceFilter(provSelect) {
  const searchInput = document.getElementById('provinceSearchInput');
  const dropdown = document.getElementById('provinceFilterDropdown');
  if (!searchInput || searchInput.dataset.filterBound === 'true') return;
  searchInput.dataset.filterBound = 'true';

  searchInput.addEventListener('input', function() {
    populateProvinceDropdown(provSelect, true);
  });

  searchInput.addEventListener('focus', function() {
    if (this.value.trim()) {
      populateProvinceDropdown(provSelect, true);
    }
  });

  document.addEventListener('click', function(e) {
    if (!dropdown) return;
    const isClickInsideSearch = searchInput.contains(e.target);
    const isClickInsideDropdown = dropdown.contains(e.target);
    const clearBtn = document.getElementById('clearProvinceSearchBtn');
    const isClickClear = clearBtn && clearBtn.contains(e.target);
    if (!isClickInsideSearch && !isClickInsideDropdown && !isClickClear) {
      dropdown.classList.add('hidden');
    }
  });
}

async function fetchFullThaiAddressRemote() {
  const externalApiUrls = [
    "https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/province_with_district_and_sub_district.json",
    "https://cdn.jsdelivr.net/gh/kongvut/thai-province-data@master/api/latest/province_with_district_and_sub_district.json",
    "https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province_with_amphure_tambon.json",
    "https://cdn.jsdelivr.net/gh/kongvut/thai-province-data@master/api_province_with_amphure_tambon.json"
  ];

  for (const url of externalApiUrls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      const normalized = normalizeAddressData(json);
      const totalAmphures = normalized.reduce((sum, p) => sum + p.amphure.length, 0);
      if (normalized.length >= 77 && totalAmphures >= 800) {
        return normalized;
      }
    } catch (err) {
      console.warn("ดึงข้อมูลที่อยู่จาก API ภายนอกไม่สำเร็จ:", url, err);
    }
  }

  const splitApiSources = [
    {
      prov: "https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province.json",
      amp: "https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_amphure.json",
      tam: "https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_tambon.json"
    },
    {
      prov: "https://cdn.jsdelivr.net/gh/kongvut/thai-province-data@master/api_province.json",
      amp: "https://cdn.jsdelivr.net/gh/kongvut/thai-province-data@master/api_amphure.json",
      tam: "https://cdn.jsdelivr.net/gh/kongvut/thai-province-data@master/api_tambon.json"
    }
  ];

  for (const set of splitApiSources) {
    try {
      const [pRes, aRes, tRes] = await Promise.all([
        fetch(set.prov),
        fetch(set.amp),
        fetch(set.tam)
      ]);
      if (!pRes.ok || !aRes.ok || !tRes.ok) continue;
      const [pJson, aJson, tJson] = await Promise.all([
        pRes.json(),
        aRes.json(),
        tRes.json()
      ]);
      const built = buildFromSplitAddressTables(pJson, aJson, tJson);
      const totalAmphures = built.reduce((sum, p) => sum + p.amphure.length, 0);
      if (built.length >= 77 && totalAmphures >= 800) {
        return built;
      }
    } catch (err) {
      console.warn("ดึงข้อมูลที่อยู่แบบแยก API ภายนอกไม่สำเร็จ:", err);
    }
  }

  return null;
}

async function loadThaiAddress() {
  const provSelect = document.getElementById('provinceSelect');
  const amphoeSelect = document.getElementById('amphoeSelect');
  const tambonSelect = document.getElementById('tambonSelect');
  const zipInput = document.getElementById('zipcodeInput');

  thaiAddressData = buildBase77AddressList();
  try {
    const cached = localStorage.getItem(THAI_ADDRESS_CACHE_KEY);
    if (cached) {
      const parsedCache = JSON.parse(cached);
      const normalizedCache = normalizeAddressData(parsedCache);
      const cacheAmpCount = normalizedCache.reduce((sum, p) => sum + p.amphure.length, 0);
      if (normalizedCache.length >= 77 && cacheAmpCount >= 800) {
        thaiAddressData = normalizedCache;
      }
    }
  } catch (e) {
    console.warn("อ่านแคชที่อยู่ไม่สำเร็จ:", e);
  }

  populateProvinceDropdown(provSelect, false);
  bindProvinceFilter(provSelect);

  provSelect.onchange = function() {
    zipInput.value = '';
    tambonSelect.innerHTML = '<option value="">-- เลือกตำบล/แขวง --</option>';
    tambonSelect.disabled = true;
    tambonSelect.className = "w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-[#128F8B] bg-gray-100 text-sm";

    amphoeSelect.innerHTML = '<option value="">-- เลือกเขต/อำเภอ --</option>';
    const selectedProv = thaiAddressData.find(p => p.name_th === this.value);
    if (selectedProv && selectedProv.amphure.length > 0) {
      amphoeSelect.disabled = false;
      amphoeSelect.className = "w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-[#128F8B] bg-white text-sm";
      selectedProv.amphure.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.name_th;
        opt.textContent = a.name_th;
        opt.setAttribute('data-zip', a.zip_code || '');
        amphoeSelect.appendChild(opt);
      });
    } else {
      amphoeSelect.disabled = true;
      amphoeSelect.className = "w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-[#128F8B] bg-gray-100 text-sm";
    }
  };

  amphoeSelect.onchange = function() {
    const selectedAmpOpt = this.options[this.selectedIndex];
    const ampZip = selectedAmpOpt ? (selectedAmpOpt.getAttribute('data-zip') || '') : '';
    zipInput.value = ampZip;

    tambonSelect.innerHTML = '<option value="">-- เลือกตำบล/แขวง --</option>';
    const selectedProv = thaiAddressData.find(p => p.name_th === provSelect.value);
    const selectedAmp = selectedProv ? selectedProv.amphure.find(a => a.name_th === this.value) : null;
    if (selectedAmp && selectedAmp.tambon.length > 0) {
      tambonSelect.disabled = false;
      tambonSelect.className = "w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-[#128F8B] bg-white text-sm";
      selectedAmp.tambon.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.name_th;
        opt.textContent = t.name_th;
        opt.setAttribute('data-zip', t.zip_code || ampZip || '');
        tambonSelect.appendChild(opt);
      });
    } else {
      tambonSelect.disabled = true;
      tambonSelect.className = "w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-[#128F8B] bg-gray-100 text-sm";
    }
  };

  tambonSelect.onchange = function() {
    const selectedTambonOpt = this.options[this.selectedIndex];
    const selectedAmpOpt = amphoeSelect.options[amphoeSelect.selectedIndex];
    const tamZip = selectedTambonOpt ? (selectedTambonOpt.getAttribute('data-zip') || '') : '';
    const ampZip = selectedAmpOpt ? (selectedAmpOpt.getAttribute('data-zip') || '') : '';
    zipInput.value = tamZip || ampZip || '';
  };

  const fullData = await fetchFullThaiAddressRemote();
  if (fullData) {
    thaiAddressData = fullData;
    try {
      localStorage.setItem(THAI_ADDRESS_CACHE_KEY, JSON.stringify(fullData));
    } catch (e) {
      console.warn("บันทึกแคชที่อยู่ไม่สำเร็จ:", e);
    }
    populateProvinceDropdown(provSelect, false);
    if (provSelect.value) {
      provSelect.onchange();
    }
  }
}

window.onload = function() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('dateInput').value = today;
  document.getElementById('contractDate').value = today;
  
  document.getElementById('parentName').addEventListener('input', function() {
    document.getElementById('parentNamePreview').innerText = this.value.trim() || 'ผู้ปกครอง';
  });

  loadThaiAddress();
};
