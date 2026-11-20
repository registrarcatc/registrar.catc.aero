// *** URL Web App ของ Google Apps Script ***
const API_URL = "https://script.google.com/macros/s/AKfycbw1K2D8a27-m4AjHEA9FSQjhxpkwSspuKpZ4HJa2NYtti4kwbOhjQgmpoIy_0XhElW0/exec";
const ADMIN_ID = "1032355109000";

let currentStudent = null;
let adminStudentsList = [];
let currentAdminTab = 'pdpa';
let thaiAddressData = [];

// ==========================================
// 1. ระบบค้นหาหลัก (รองรับทั้ง Admin และนักศึกษา)
// ==========================================
async function search() {
  const idCard = document.getElementById('idSearch').value.trim();
  if (idCard.length !== 13) {
    Swal.fire({ icon: 'warning', title: 'กรุณากรอกเลขบัตรประชาชน 13 หลักให้ครบถ้วน' });
    return;
  }

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
    setDocBuildProgress('pdpa', 0, '', false);
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
    setDocBuildProgress('contract', 0, '', false);
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
    setDocBuildProgress('trans', 0, '', false);
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

function setDocBuildProgress(prefix, percent, labelText, show = true) {
  const box = document.getElementById(`${prefix}ProgressBox`);
  const bar = document.getElementById(`${prefix}ProgressBar`);
  const pctEl = document.getElementById(`${prefix}ProgressPercent`);
  const lblEl = document.getElementById(`${prefix}ProgressLabel`);
  if (!box || !bar || !pctEl || !lblEl) return;

  if (!show) {
    box.classList.add('hidden');
    bar.style.width = '0%';
    pctEl.innerText = '0%';
    return;
  }

  box.classList.remove('hidden');
  const safePercent = Math.max(0, Math.min(100, percent));
  bar.style.width = `${safePercent}%`;
  pctEl.innerText = `${safePercent}%`;
  if (labelText) lblEl.innerHTML = labelText;
}

function setBadge(id, title, status) {
  const el = document.getElementById(id);

  if (status === 'เรียบร้อย') {
    el.innerHTML = `${title}: ✅`;
    el.className = "px-3 py-2 rounded-full text-white text-xs font-bold truncate shadow-sm status-green";
  } else if (status === 'รอตรวจสอบ') {
    el.innerHTML = `${title}: <i class="fa-solid fa-clock mr-1"></i>รอตรวจสอบ`;
    el.className = "px-3 py-2 rounded-full text-white text-xs font-bold truncate shadow-sm status-yellow";
  } else {
    el.innerHTML = `${title}: <i class="fa-solid fa-hourglass-half mr-1"></i>รอดำเนินการ`;
    el.className = "px-3 py-2 rounded-full text-white text-xs font-bold truncate shadow-sm status-gray";
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

// บันทึก PDPA
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

  setDocBuildProgress('pdpa', 25, '<i class="fa-solid fa-file-pdf mr-1"></i> เตรียมข้อมูลและลายมือชื่อ...');
  Swal.fire({ title: 'กำลังสร้างเอกสาร PDF PDPA...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  try {
    setDocBuildProgress('pdpa', 65, '<i class="fa-solid fa-gear fa-spin mr-1"></i> กำลังสร้างไฟล์ PDF PDPA...');
    const response = await fetch(API_URL, {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify({ action: 'savePdpa', formData: formData })
    });
    const res = await response.json();
    if (res.status === 'success') {
      setDocBuildProgress('pdpa', 100, '<i class="fa-solid fa-circle-check mr-1"></i> สร้างไฟล์ PDF PDPA สำเร็จ');
      currentStudent.pdpaPdfUrl = res.data;
      currentStudent.pdpaStatus = 'รอตรวจสอบ';
      renderStudentUI();
      setTimeout(() => setDocBuildProgress('pdpa', 0, '', false), 800);
      Swal.fire({ icon: 'success', title: 'บันทึกและสร้าง PDF PDPA สำเร็จ' });
    } else {
      setDocBuildProgress('pdpa', 0, '', false);
      Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: res.message });
    }
  } catch (err) {
    setDocBuildProgress('pdpa', 0, '', false);
    Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message });
  }
}

// บันทึก Contract
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

  setDocBuildProgress('contract', 25, '<i class="fa-solid fa-file-pdf mr-1"></i> เตรียมข้อมูลและลายมือชื่อ...');
  Swal.fire({ title: 'กำลังสร้างเอกสาร PDF สัญญาการศึกษา...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  try {
    setDocBuildProgress('contract', 65, '<i class="fa-solid fa-gear fa-spin mr-1"></i> กำลังสร้างไฟล์ PDF สัญญาการศึกษา...');
    const response = await fetch(API_URL, {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify({ action: 'saveContract', formData: formData })
    });
    const res = await response.json();
    if (res.status === 'success') {
      setDocBuildProgress('contract', 100, '<i class="fa-solid fa-circle-check mr-1"></i> สร้างไฟล์ PDF สัญญาการศึกษาสำเร็จ');
      currentStudent.contractPdfUrl = res.data;
      currentStudent.contractStatus = 'รอตรวจสอบ';
      renderStudentUI();
      setTimeout(() => setDocBuildProgress('contract', 0, '', false), 800);
      Swal.fire({ icon: 'success', title: 'บันทึกและสร้าง PDF สัญญาสำเร็จ' });
    } else {
      setDocBuildProgress('contract', 0, '', false);
      Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: res.message });
    }
  } catch (err) {
    setDocBuildProgress('contract', 0, '', false);
    Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message });
  }
}

// อัปโหลด Transcript
async function uploadFile() {
  const fileInput = document.getElementById('fileIn');
  if (fileInput.files.length === 0) {
    Swal.fire({ icon: 'warning', title: 'กรุณาเลือกไฟล์ PDF ก่อนอัปโหลด' });
    return;
  }
  const file = fileInput.files[0];
  if (file.size > 5 * 1024 * 1024) {
    Swal.fire({ icon: 'warning', title: 'ขนาดไฟล์เกิน 5MB' });
    return;
  }

  setDocBuildProgress('trans', 20, '<i class="fa-solid fa-file-pdf mr-1"></i> กำลังอ่านไฟล์ PDF...');
  Swal.fire({ title: 'กำลังอัปโหลดไฟล์ Transcript...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  const reader = new FileReader();
  reader.onload = async function() {
    try {
      setDocBuildProgress('trans', 65, '<i class="fa-solid fa-cloud-arrow-up mr-1"></i> กำลังส่งไฟล์ Transcript...');
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
      if (res.status === 'success') {
        setDocBuildProgress('trans', 100, '<i class="fa-solid fa-circle-check mr-1"></i> อัปโหลดไฟล์ Transcript สำเร็จ');
        currentStudent.transcriptFileUrl = res.data;
        currentStudent.transcriptStatus = 'รอตรวจสอบ';
        renderStudentUI();
        setTimeout(() => setDocBuildProgress('trans', 0, '', false), 800);
        Swal.fire({ icon: 'success', title: 'อัปโหลด Transcript สำเร็จ' });
      } else {
        setDocBuildProgress('trans', 0, '', false);
        Swal.fire({ icon: 'error', title: 'อัปโหลดไม่สำเร็จ', text: res.message });
      }
    } catch (err) {
      setDocBuildProgress('trans', 0, '', false);
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message });
    }
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
  // 1. คำนวณ Dashboard ภาพรวมด้านบน
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

  // 2. นับเฉพาะช่องที่มีลิงก์หลักฐานจริง (ไม่เป็นค่าว่าง) และมีสถานะ "รอตรวจสอบ"
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

    // 1. แถวสำหรับตาราง (จอใหญ่)
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

    // 2. Card สำหรับมือถือ (จอเล็ก)
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
// 4. ระบบ UI, Tab, ลายมือชื่อ และข้อมูลที่อยู่ประเทศไทย
// ==========================================
function switchTab(tab) {
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
  modalSignaturePad = new SignaturePad(canvas, { backgroundColor: 'rgba(255,255,255,0)' });
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

// โหลดข้อมูลจังหวัด/อำเภอ/ตำบล ของประเทศไทยแบบครบถ้วนพร้อมแหล่งสำรอง
async function loadThaiAddress() {
  const provSelect = document.getElementById('provinceSelect');
  const amphoeSelect = document.getElementById('amphoeSelect');
  const tambonSelect = document.getElementById('tambonSelect');
  const zipInput = document.getElementById('zipcodeInput');

  const combinedUrls = [
    'https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province_with_amphure_tambon.json',
    'https://cdn.jsdelivr.net/gh/kongvut/thai-province-data@master/api_province_with_amphure_tambon.json'
  ];

  const splitSets = [
    {
      prov: 'https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province.json',
      amp: 'https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_amphure.json',
      tam: 'https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_tambon.json'
    },
    {
      prov: 'https://cdn.jsdelivr.net/gh/kongvut/thai-province-data@master/api_province.json',
      amp: 'https://cdn.jsdelivr.net/gh/kongvut/thai-province-data@master/api_amphure.json',
      tam: 'https://cdn.jsdelivr.net/gh/kongvut/thai-province-data@master/api_tambon.json'
    }
  ];

  function normalizeCombinedData(rawData) {
    if (!Array.isArray(rawData) || rawData.length === 0) return [];
    return rawData
      .map(p => ({
        name_th: (p.name_th || p.nameInThai || '').trim(),
        amphure: (p.amphure || p.amphures || [])
          .map(a => ({
            name_th: (a.name_th || a.nameInThai || '').trim(),
            tambon: (a.tambon || a.tambons || [])
              .map(t => ({
                name_th: (t.name_th || t.nameInThai || '').trim(),
                zip_code: String(t.zip_code || t.zipCode || '').trim()
              }))
              .filter(t => t.name_th)
          }))
          .filter(a => a.name_th)
      }))
      .filter(p => p.name_th)
      .sort((a, b) => a.name_th.localeCompare(b.name_th, 'th'));
  }

  function buildFromSplitTables(provs, amps, tams) {
    if (!Array.isArray(provs) || !Array.isArray(amps) || !Array.isArray(tams)) return [];

    const tambonByAmphoe = new Map();
    tams.forEach(t => {
      const ampId = t.amphure_id ?? t.amphureId;
      const nameTh = (t.name_th || t.nameInThai || '').trim();
      const zipCode = String(t.zip_code || t.zipCode || '').trim();
      if (!ampId || !nameTh) return;
      if (!tambonByAmphoe.has(ampId)) tambonByAmphoe.set(ampId, []);
      tambonByAmphoe.get(ampId).push({ name_th: nameTh, zip_code: zipCode });
    });

    const amphoeByProvince = new Map();
    amps.forEach(a => {
      const ampId = a.id;
      const provId = a.province_id ?? a.provinceId;
      const nameTh = (a.name_th || a.nameInThai || '').trim();
      if (!ampId || !provId || !nameTh) return;
      if (!amphoeByProvince.has(provId)) amphoeByProvince.set(provId, []);
      amphoeByProvince.get(provId).push({
        name_th: nameTh,
        tambon: tambonByAmphoe.get(ampId) || []
      });
    });

    return provs
      .map(p => ({
        name_th: (p.name_th || p.nameInThai || '').trim(),
        amphure: amphoeByProvince.get(p.id) || []
      }))
      .filter(p => p.name_th)
      .sort((a, b) => a.name_th.localeCompare(b.name_th, 'th'));
  }

  let loadedData = [];

  for (const url of combinedUrls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      const normalized = normalizeCombinedData(json);
      if (normalized.length >= 70) {
        loadedData = normalized;
        break;
      }
    } catch (err) {
      console.warn('โหลดไฟล์รวมไม่สำเร็จจาก:', url, err);
    }
  }

  if (loadedData.length === 0) {
    for (const set of splitSets) {
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
        const built = buildFromSplitTables(pJson, aJson, tJson);
        if (built.length >= 70) {
          loadedData = built;
          break;
        }
      } catch (err) {
        console.warn('โหลดข้อมูลแบบแยกตารางไม่สำเร็จ:', err);
      }
    }
  }

  thaiAddressData = loadedData;

  provSelect.innerHTML = '<option value="">-- เลือกจังหวัด --</option>';
  if (thaiAddressData.length === 0) {
    provSelect.innerHTML += '<option value="">ไม่สามารถโหลดข้อมูลจังหวัดได้ กรุณารีเฟรชหน้าเว็บ</option>';
    return;
  }

  thaiAddressData.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.name_th;
    opt.textContent = p.name_th;
    provSelect.appendChild(opt);
  });

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
        amphoeSelect.appendChild(opt);
      });
    } else {
      amphoeSelect.disabled = true;
      amphoeSelect.className = "w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-[#128F8B] bg-gray-100 text-sm";
    }
  };

  amphoeSelect.onchange = function() {
    zipInput.value = '';
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
        opt.setAttribute('data-zip', t.zip_code);
        tambonSelect.appendChild(opt);
      });
    } else {
      tambonSelect.disabled = true;
      tambonSelect.className = "w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-[#128F8B] bg-gray-100 text-sm";
    }
  };

  tambonSelect.onchange = function() {
    const selectedOpt = this.options[this.selectedIndex];
    zipInput.value = selectedOpt ? (selectedOpt.getAttribute('data-zip') || '') : '';
  };
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
