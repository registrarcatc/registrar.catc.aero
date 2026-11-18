// ข้อมูลจำลองนักศึกษาในระบบ และ Admin Key
const ADMIN_ID = "1032355109000";

let studentsDB = [
  { idCard: "1100100111111", studentId: "6901001", name: "นายสมชาย การบิน", course: "หลักสูตรวิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมการบิน", pdpaStatus: "รอตรวจสอบ", pdpaLink: "pdpa_sample.pdf", contractStatus: "", contractLink: "", transStatus: "รอตรวจสอบ", transLink: "trans_sample.pdf" },
  { idCard: "1100100222222", studentId: "6901002", name: "นางสาวสมหญิง น่านฟ้า", course: "หลักสูตรประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.) สาขาวิชาเทคโนโลยีการบิน", pdpaStatus: "เรียบร้อย", pdpaLink: "doc1.pdf", contractStatus: "รอตรวจสอบ", contractLink: "contract_sample.pdf", transStatus: "", transLink: "" },
  { idCard: "1100100333333", studentId: "6901003", name: "นายกัปตัน มั่นคง", course: "หลักสูตรวิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมการบิน", pdpaStatus: "", pdpaLink: "", contractStatus: "เรียบร้อย", contractLink: "doc2.pdf", transStatus: "รอตรวจสอบ", transLink: "trans_sample2.pdf" }
];

let currentStudent = null;
let currentAdminTab = 'pdpa';
let reviewingStudentId = null;

// ฟังก์ชันค้นหาข้อมูล (รองรับเลข Admin)
function search() {
  const query = document.getElementById('idSearch').value.trim();
  if (query.length !== 13) {
    Swal.fire({ icon: 'warning', title: 'กรุณากรอกเลขบัตรประชาชน 13 หลักให้ครบถ้วน' });
    return;
  }

  // ถ้ากรอกเลข Admin ให้เข้าสู่หน้า Admin ทันที
  if (query === ADMIN_ID) {
    document.getElementById('resultArea').classList.add('hidden');
    document.getElementById('adminArea').classList.remove('hidden');
    renderAdminDashboard();
    Swal.fire({ icon: 'success', title: 'เข้าสู่ระบบผู้ดูแลระบบ (Admin) สำเร็จ', timer: 1500, showConfirmButton: false });
    return;
  }

  const found = studentsDB.find(s => s.idCard === query);
  if (!found) {
    Swal.fire({ icon: 'error', title: 'ไม่พบข้อมูลนักศึกษา', text: 'กรุณาตรวจสอบเลขประจำตัวประชาชนอีกครั้ง' });
    document.getElementById('resultArea').classList.add('hidden');
    document.getElementById('adminArea').classList.add('hidden');
    return;
  }

  currentStudent = found;
  document.getElementById('adminArea').classList.add('hidden');
  document.getElementById('resultArea').classList.remove('hidden');
  updateStudentUI();
}

function updateStudentUI() {
  document.getElementById('resName').innerText = currentStudent.name;
  document.getElementById('resName2').innerText = currentStudent.name;
  document.getElementById('resId').innerText = currentStudent.studentId;
  document.getElementById('resCourse').innerText = currentStudent.course;

  updateBadge('pdpaBadge', 'PDPA', currentStudent.pdpaStatus || 'ยังไม่ส่ง');
  updateBadge('contractBadge', 'Contract', currentStudent.contractStatus || 'ยังไม่ส่ง');
  updateBadge('transBadge', 'Transcript', currentStudent.transStatus || 'ยังไม่ส่ง');

  const allPassed = (currentStudent.pdpaStatus === 'เรียบร้อย' && currentStudent.contractStatus === 'เรียบร้อย' && currentStudent.transStatus === 'เรียบร้อย');
  const eduBtn = document.getElementById('eduSystemBtn');
  if (allPassed) {
    eduBtn.className = "w-full py-3.5 rounded-2xl font-bold text-white text-base shadow-md transition status-green hover:opacity-90";
  } else {
    eduBtn.className = "w-full py-3.5 rounded-2xl font-bold text-white text-base shadow-md transition status-gray cursor-not-allowed";
  }
}

function updateBadge(elementId, label, status) {
  const el = document.getElementById(elementId);
  el.innerText = `${label}: ${status}`;
  if (status === 'เรียบร้อย') el.className = "px-3 py-2 rounded-full text-white text-xs font-bold truncate shadow-sm status-green";
  else if (status === 'ไม่ผ่าน') el.className = "px-3 py-2 rounded-full text-white text-xs font-bold truncate shadow-sm bg-red-600";
  else if (status === 'รอตรวจสอบ') el.className = "px-3 py-2 rounded-full text-white text-xs font-bold truncate shadow-sm status-yellow";
  else el.className = "px-3 py-2 rounded-full text-white text-xs font-bold truncate shadow-sm bg-gray-400";
}

function handleEduSystemClick() {
  const allPassed = (currentStudent.pdpaStatus === 'เรียบร้อย' && currentStudent.contractStatus === 'เรียบร้อย' && currentStudent.transStatus === 'เรียบร้อย');
  if (!allPassed) {
    Swal.fire({ icon: 'warning', title: 'ยังไม่สามารถเข้าสู่ระบบได้', text: 'กรุณาดำเนินการเอกสารทั้ง 3 ฉบับและรอผลอนุมัติให้เรียบร้อยก่อน' });
    return;
  }
  window.open('https://reg.catc.or.th', '_blank');
}

// ----------------- ADMIN FUNCTIONS -----------------

function logoutAdmin() {
  document.getElementById('adminArea').classList.add('hidden');
  document.getElementById('idSearch').value = '';
  Swal.fire({ icon: 'info', title: 'ออกจากระบบ Admin แล้ว', timer: 1200, showConfirmButton: false });
}

function renderAdminDashboard() {
  // นับเฉพาะรายการที่มีลิงก์ข้อมูลจริง และมีสถานะเป็น "รอตรวจสอบ" เท่านั้น
  const countPdpa = studentsDB.filter(s => s.pdpaLink && s.pdpaLink !== '#' && s.pdpaStatus === 'รอตรวจสอบ').length;
  const countContract = studentsDB.filter(s => s.contractLink && s.contractLink !== '#' && s.contractStatus === 'รอตรวจสอบ').length;
  const countTrans = studentsDB.filter(s => s.transLink && s.transLink !== '#' && s.transStatus === 'รอตรวจสอบ').length;

  document.getElementById('countPdpa').innerText = countPdpa;
  document.getElementById('countContract').innerText = countContract;
  document.getElementById('countTrans').innerText = countTrans;

  renderAdminTable();
}

function switchAdminTab(tab) {
  currentAdminTab = tab;
  document.getElementById('adminTabPdpa').className = tab === 'pdpa' ? "flex-1 py-3 text-center text-theme-green border-b-4 border-theme-green transition bg-emerald-50" : "flex-1 py-3 text-center text-gray-400 border-b-4 border-transparent transition hover:text-theme-green";
  document.getElementById('adminTabContract').className = tab === 'contract' ? "flex-1 py-3 text-center text-theme-green border-b-4 border-theme-green transition bg-emerald-50" : "flex-1 py-3 text-center text-gray-400 border-b-4 border-transparent transition hover:text-theme-green";
  document.getElementById('adminTabTrans').className = tab === 'trans' ? "flex-1 py-3 text-center text-theme-green border-b-4 border-theme-green transition bg-emerald-50" : "flex-1 py-3 text-center text-gray-400 border-b-4 border-transparent transition hover:text-theme-green";
  renderAdminTable();
}

function renderAdminTable() {
  const tbody = document.getElementById('adminTableBody');
  tbody.innerHTML = '';

  // กรองเฉพาะนักศึกษาที่มีข้อมูลลิงก์จริง และสถานะเป็น "รอตรวจสอบ" ใน Tab นั้นๆ
  const filtered = studentsDB.filter(s => {
    if (currentAdminTab === 'pdpa') {
      return s.pdpaLink && s.pdpaLink !== '#' && s.pdpaStatus === 'รอตรวจสอบ';
    }
    if (currentAdminTab === 'contract') {
      return s.contractLink && s.contractLink !== '#' && s.contractStatus === 'รอตรวจสอบ';
    }
    if (currentAdminTab === 'trans') {
      return s.transLink && s.transLink !== '#' && s.transStatus === 'รอตรวจสอบ';
    }
    return false;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-gray-400 italic">ไม่มีเอกสารที่อยู่ในสถานะรอตรวจสอบ</td></tr>`;
    return;
  }

  filtered.forEach(s => {
    tbody.innerHTML += `
      <tr class="hover:bg-gray-50 border-b">
        <td class="p-4 font-mono font-bold">${s.studentId}</td>
        <td class="p-4 font-medium">${s.name}</td>
        <td class="p-4 text-xs text-gray-600">${s.course}</td>
        <td class="p-4 text-center">
          <button onclick="openDocViewer('${s.studentId}', '${currentAdminTab}')" class="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-xs font-bold hover:bg-blue-200 transition"><i class="fa-solid fa-eye mr-1"></i> ดูเอกสาร</button>
        </td>
        <td class="p-4 text-center space-x-2">
          <button onclick="updateDocStatus('${s.studentId}', '${currentAdminTab}', 'เรียบร้อย')" class="px-3 py-1.5 bg-[#128F8B] text-white rounded-lg text-xs font-bold hover:opacity-90 transition"><i class="fa-solid fa-check mr-1"></i> เรียบร้อย</button>
          <button onclick="updateDocStatus('${s.studentId}', '${currentAdminTab}', 'ไม่ผ่าน')" class="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition"><i class="fa-solid fa-xmark mr-1"></i> ไม่ผ่าน</button>
        </td>
      </tr>
    `;
  });
}

function openDocViewer(studentId, docType) {
  reviewingStudentId = studentId;
  const s = studentsDB.find(x => x.studentId === studentId);
  const link = docType === 'pdpa' ? s.pdpaLink : (docType === 'contract' ? s.contractLink : s.transLink);
  
  document.getElementById('viewerTitle').innerText = `ตรวจสอบเอกสาร (${docType.toUpperCase()}) - ${s.name}`;
  document.getElementById('viewerBody').innerHTML = `
    <div class="text-center space-y-3">
      <p class="text-gray-700 font-medium">กำลังแสดงไฟล์: <span class="font-mono text-theme-green">${link}</span></p>
      <a href="#" class="inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow hover:bg-blue-700 transition" target="_blank">เปิดไฟล์เอกสารในแท็บใหม่</a>
    </div>
  `;
  document.getElementById('docViewerModal').style.display = 'block';
}

function closeDocViewer() {
  document.getElementById('docViewerModal').style.display = 'none';
}

function adminReviewAction(action) {
  closeDocViewer();
  updateDocStatus(reviewingStudentId, currentAdminTab, action === 'pass' ? 'เรียบร้อย' : 'ไม่ผ่าน');
}

// อัปเดตสถานะ และหากเลือก "ไม่ผ่าน" จะทำการล้างค่าลิงก์และสถานะ เพื่อให้ User ทำใหม่
function updateDocStatus(studentId, docType, status) {
  const s = studentsDB.find(x => x.studentId === studentId);
  if (!s) return;

  if (docType === 'pdpa') {
    s.pdpaStatus = status;
    if (status === 'ไม่ผ่าน') {
      s.pdpaLink = ''; // ล้างข้อมูล/ลิงก์ใน Google Sheet ให้เป็นค่าว่าง
      s.pdpaStatus = ''; // ล้างสถานะ
    }
  } else if (docType === 'contract') {
    s.contractStatus = status;
    if (status === 'ไม่ผ่าน') {
      s.contractLink = '';
      s.contractStatus = '';
    }
  } else if (docType === 'trans') {
    s.transStatus = status;
    if (status === 'ไม่ผ่าน') {
      s.transLink = '';
      s.transStatus = '';
    }
  }

  Swal.fire({
    icon: status === 'เรียบร้อย' ? 'success' : 'warning',
    title: `บันทึกสถานะ: "${status}" เรียบร้อย`,
    text: status === 'ไม่ผ่าน' ? 'ระบบได้ทำการล้างข้อมูลช่องสถานะและลิงก์ใน Google Sheet เรียบร้อยแล้ว เพื่อให้นักศึกษาเข้ามาทำรายการใหม่' : 'อัปเดตสถานะสำเร็จ',
    timer: 1800,
    showConfirmButton: false
  });

  renderAdminDashboard();
}

// ----------------- TAB & FORM LOGIC -----------------
function switchTab(tab) {
  document.getElementById('pdpaSection').classList.add('hidden');
  document.getElementById('contractSection').classList.add('hidden');
  document.getElementById('transSection').classList.add('hidden');

  document.getElementById('tabPdpaBtn').className = "flex-1 py-3 px-1 md:py-4 text-center font-bold text-gray-400 border-b-4 border-transparent transition hover:text-theme-green";
  document.getElementById('tabContractBtn').className = "flex-1 py-3 px-1 md:py-4 text-center font-bold text-gray-400 border-b-4 border-transparent transition hover:text-theme-green";
  document.getElementById('tabTransBtn').className = "flex-1 py-3 px-1 md:py-4 text-center font-bold text-gray-400 border-b-4 border-transparent transition hover:text-theme-green";

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

let activeSigTarget = null;
let sigPads = {};

function openModal(target) {
  activeSigTarget = target;
  document.getElementById('sigModal').style.display = 'block';
  const canvas = document.getElementById('modalCanvas');
  if (!sigPads[target]) {
    sigPads[target] = new SignaturePad(canvas, { backgroundColor: 'rgb(255, 255, 255)' });
  } else {
    sigPads[target].clear();
  }
}

function closeModal() {
  document.getElementById('sigModal').style.display = 'none';
}

function clearModalSig() {
  if (sigPads[activeSigTarget]) sigPads[activeSigTarget].clear();
}

function saveModalSig() {
  if (!sigPads[activeSigTarget] || sigPads[activeSigTarget].isEmpty()) {
    Swal.fire({ icon: 'warning', title: 'กรุณาลายมือชื่อก่อนบันทึก' });
    return;
  }
  const dataUrl = sigPads[activeSigTarget].toDataURL();
  const box = document.getElementById(activeSigTarget === 'user' ? 'userPreview' : (activeSigTarget === 'studentSig' ? 'studentSigPreview' : 'parentSigPreview'));
  box.innerHTML = `<img src="${dataUrl}" class="h-full object-contain">`;
  closeModal();
}

function submitPdpa() {
  if (currentStudent) {
    currentStudent.pdpaStatus = 'รอตรวจสอบ';
    currentStudent.pdpaLink = 'pdpa_doc.pdf';
    updateStudentUI();
    document.getElementById('pdpaForm').classList.add('hidden');
    document.getElementById('pdpaViewArea').classList.remove('hidden');
    Swal.fire({ icon: 'success', title: 'บันทึกแบบฟอร์ม PDPA สำเร็จ', text: 'ส่งข้อมูลให้เจ้าหน้าที่ตรวจสอบเรียบร้อยแล้ว' });
  }
}

function submitContract() {
  const pName = document.getElementById('parentName').value;
  if (!pName) {
    Swal.fire({ icon: 'warning', title: 'กรุณากรอกชื่อผู้ปกครอง' });
    return;
  }
  if (currentStudent) {
    currentStudent.contractStatus = 'รอตรวจสอบ';
    currentStudent.contractLink = 'contract_doc.pdf';
    updateStudentUI();
    document.getElementById('contractForm').classList.add('hidden');
    document.getElementById('contractViewArea').classList.remove('hidden');
    Swal.fire({ icon: 'success', title: 'บันทึกสัญญาการศึกษาสำเร็จ', text: 'ส่งข้อมูลให้เจ้าหน้าที่ตรวจสอบเรียบร้อยแล้ว' });
  }
}

function uploadFile() {
  const fileInput = document.getElementById('fileIn');
  if (fileInput.files.length === 0) {
    Swal.fire({ icon: 'warning', title: 'กรุณาเลือกไฟล์ PDF ก่อนอัปโหลด' });
    return;
  }
  if (currentStudent) {
    currentStudent.transStatus = 'รอตรวจสอบ';
    currentStudent.transLink = fileInput.files[0].name;
    updateStudentUI();
    document.getElementById('uploadZone').classList.add('hidden');
    document.getElementById('transViewArea').classList.remove('hidden');
    Swal.fire({ icon: 'success', title: 'อัปโหลด Transcript สำเร็จ', text: 'ส่งข้อมูลให้เจ้าหน้าที่ตรวจสอบเรียบร้อยแล้ว' });
  }
}

window.onload = function() {
  document.getElementById('dateInput').valueAsDate = new Date();
  document.getElementById('contractDate').valueAsDate = new Date();
  
  const provSelect = document.getElementById('provinceSelect');
  provSelect.innerHTML = '<option value="กรุงเทพมหานคร">กรุงเทพมหานคร</option><option value="นนทบุรี">นนทบุรี</option><option value="สมุทรปราการ">สมุทรปราการ</option>';
  document.getElementById('zipcodeInput').value = '10110';
};
