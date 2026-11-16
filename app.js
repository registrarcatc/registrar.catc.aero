const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw1K2D8a27-m4AjHEA9FSQjhxpkwSspuKpZ4HJa2NYtti4kwbOhjQgmpoIy_0XhElW0/exec";

let current = null;
let modalPad;
let activeType = '';
let savedSigs = { user: null, w1: null, w2: null, studentSig: null, parentSig: null };

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
  
  Swal.fire({ title: 'กำลังค้นหา...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  
  const data = await callApi('searchStudent', { idCard: id });
  Swal.close();
  
  if (!data) return Swal.fire('ไม่พบข้อมูล', 'ไม่พบข้อมูลนักศึกษาในระบบ', 'error');
  current = data;
  showResult(data);
}

function showResult(data) {
  document.getElementById('resultArea').classList.remove('hidden');
  document.getElementById('resName').innerText = data.name;
  document.getElementById('resName2').innerText = data.name;
  document.getElementById('resName3').innerText = data.name;
  document.getElementById('resId').innerText = data.studentId;
  
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localToday = new Date(now.getTime() - (offset * 60 * 1000));
  const todayStr = localToday.toISOString().split('T')[0];
  
  // Set default dates
  ['dateInput', 'contractDate'].forEach(id => {
    const el = document.getElementById(id);
    if(el) { el.value = todayStr; el.max = todayStr; }
  });

  const getBadgeClass = (status) => {
    if (status === "ผ่าน" || status === "เรียบร้อย") return "status-green";
    if (status === "-") return "status-gray"; 
    return "status-yellow";
  };

  // 1. PDPA Status & View
  document.getElementById('pdpaBadge').innerText = "PDPA: " + (data.pdpaStatus || "ยังไม่ส่ง");
  document.getElementById('pdpaBadge').className = "px-4 py-1.5 rounded-full text-white text-xs font-bold " + getBadgeClass(data.pdpaStatus);
  if(data.pdpaPdfUrl) {
    document.getElementById('pdpaForm').classList.add('hidden');
    document.getElementById('pdpaViewArea').classList.remove('hidden');
    document.getElementById('viewPdpaBtn').href = data.pdpaPdfUrl;
  } else {
    document.getElementById('pdpaForm').classList.remove('hidden');
    document.getElementById('pdpaViewArea').classList.add('hidden');
  }

  // 2. Contract Status & View
  document.getElementById('contractBadge').innerText = "Contract: " + (data.contractStatus || "ยังไม่ส่ง");
  document.getElementById('contractBadge').className = "px-4 py-1.5 rounded-full text-white text-xs font-bold " + getBadgeClass(data.contractStatus);
  if(data.contractPdfUrl) {
    document.getElementById('contractForm').classList.add('hidden');
    document.getElementById('contractViewArea').classList.remove('hidden');
    document.getElementById('viewContractBtn').href = data.contractPdfUrl;
  } else {
    document.getElementById('contractForm').classList.remove('hidden');
    document.getElementById('contractViewArea').classList.add('hidden');
  }

  // 3. Transcript Status & View
  document.getElementById('transBadge').innerText = "Transcript: " + (data.transcriptStatus || "ยังไม่ส่ง");
  document.getElementById('transBadge').className = "px-4 py-1.5 rounded-full text-white text-xs font-bold " + getBadgeClass(data.transcriptStatus);
  
  const uz = document.getElementById('uploadZone');
  uz.classList.add('hidden');
  if (!data.transcriptStatus || data.transcriptStatus === "ยังไม่ส่ง" || data.transcriptStatus === "แก้ไข") uz.classList.remove('hidden');
  if (data.transcriptFileUrl) {
    document.getElementById('transViewArea').classList.remove('hidden');
    document.getElementById('viewTransBtn').href = data.transcriptFileUrl;
  }
}

async function submitPdpa() {
  const dateVal = document.getElementById('dateInput').value;
  if (!dateVal) return Swal.fire('แจ้งเตือน', 'กรุณาเลือกวันที่', 'warning');
  if (!savedSigs.user) return Swal.fire('แจ้งเตือน', 'กรุณาลายมือชื่อนักศึกษา', 'warning');
  if (!document.getElementById('w1Name').value) return Swal.fire('แจ้งเตือน', 'กรุณากรอกชื่อพยาน 1', 'warning');

  Swal.fire({ title: 'กำลังสร้าง PDF PDPA...', text: 'กรุณารอสักครู่', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  const formData = {
    row: current.row, name: current.name, idCard: current.idCard, studentId: current.studentId,
    date: dateVal, writtenAt: document.getElementById('writtenAt').value,
    q1: document.querySelector('input[name="q1"]:checked').value,
    q2: document.querySelector('input[name="q2"]:checked').value,
    q3: document.querySelector('input[name="q3"]:checked').value,
    q4: document.querySelector('input[name="q4"]:checked').value,
    q5: document.querySelector('input[name="q5"]:checked').value,
    w1Name: document.getElementById('w1Name').value,
    w2Name: document.getElementById('w2Name').value,
    userSig: savedSigs.user, w1Sig: savedSigs.w1, w2Sig: savedSigs.w2
  };

  await callApi('savePdpa', { formData });
  Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'บันทึก PDPA เรียบร้อยแล้ว', timer: 2000 }).then(() => search());
}

async function submitContract() {
  const contractDate = document.getElementById('contractDate').value;
  const birthDate = document.getElementById('birthDate').value;
  const address = document.getElementById('address').value;
  const phone = document.getElementById('phone').value;
  const email = document.getElementById('email').value;
  const parentName = document.getElementById('parentName').value;
  const parentPhone = document.getElementById('parentPhone').value;

  if (!contractDate || !birthDate || !address || !phone || !email || !parentName || !parentPhone) {
    return Swal.fire('แจ้งเตือน', 'กรุณากรอกข้อมูลในฟอร์มสัญญาให้ครบถ้วน', 'warning');
  }
  if (!savedSigs.studentSig) return Swal.fire('แจ้งเตือน', 'กรุณาลายมือชื่อนักศึกษา', 'warning');
  if (!savedSigs.parentSig) return Swal.fire('แจ้งเตือน', 'กรุณาลายมือชื่อผู้ปกครอง', 'warning');

  Swal.fire({ title: 'กำลังสร้าง PDF สัญญา...', text: 'กรุณารอสักครู่', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  const formData = {
    row: current.row, name: current.name, idCard: current.idCard, studentId: current.studentId,
    contractDate, birthDate, address, phone, email, parentName, parentPhone,
    studentSig: savedSigs.studentSig, parentSig: savedSigs.parentSig
  };

  await callApi('saveContract', { formData });
  Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'บันทึกสัญญาการศึกษาเรียบร้อยแล้ว', timer: 2000 }).then(() => search());
}

async function uploadFile() {
  const file = document.getElementById('fileIn').files[0];
  if (!file) return Swal.fire('แจ้งเตือน', 'กรุณาเลือกไฟล์ PDF', 'info');

  Swal.fire({ title: 'กำลังอัปโหลด...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  const reader = new FileReader();
  reader.onload = async (e) => {
    await callApi('uploadTranscript', { base64: e.target.result, fileName: file.name, row: current.row });
    Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'อัปโหลดไฟล์เรียบร้อยแล้ว', timer: 2000 }).then(() => search());
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
  
  if (activeType === 'parentName') {
    // ถ้ามีการผูกชื่อผู้ปกครอง
  }
  closeModal();
}

// อัปเดตชื่อผู้ปกครองบน UI แบบ Realtime ใต้ช่องเซ็น
document.getElementById('parentName')?.addEventListener('input', (e) => {
  const val = e.target.value.trim();
  document.getElementById('parentNamePreview').innerText = val || "ผู้ปกครอง";
});
