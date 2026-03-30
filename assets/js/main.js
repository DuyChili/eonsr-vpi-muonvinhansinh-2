function openPopup() {
    document.getElementById('overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closePopup() {
    document.getElementById('overlay').classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(resetAll, 400);
}
function handleOverlayClick(e) {
    if (e.target === document.getElementById('overlay')) closePopup();
}

function resetAll() {
  showStep('step1');
  
  document.getElementById('step2').classList.remove('hidden-left', 'active');
  document.getElementById('step2').classList.add('hidden-right');
  
  const step3 = document.getElementById('step3');
  if(step3) {
    step3.classList.remove('hidden-left', 'active');
    step3.classList.add('hidden-right');
  }

  const step4 = document.getElementById('step4');
  if(step4) {
    step4.classList.remove('hidden-left', 'active');
    step4.classList.add('hidden-right');
  }

  document.getElementById('inputName').value = '';
  document.getElementById('inputEmail').value = '';
  clearError('fieldName','inputName');
  clearError('fieldEmail','inputEmail');
  
  document.querySelectorAll('.choice-item').forEach(el => el.classList.remove('selected'));
  if(document.getElementById('surveyErr')) document.getElementById('surveyErr').classList.remove('show');
  if(document.getElementById('surveyErr3')) document.getElementById('surveyErr3').classList.remove('show');
}

function setError(f, i) { document.getElementById(f).classList.add('has-error'); document.getElementById(i).classList.add('error'); }
function clearError(f, i) { document.getElementById(f).classList.remove('has-error'); document.getElementById(i).classList.remove('error'); }

function goStep2() {
    const name = document.getElementById('inputName').value.trim();
    const email = document.getElementById('inputEmail').value.trim();
    let ok = true;
    if (!name) { setError('fieldName', 'inputName'); ok = false; } else clearError('fieldName', 'inputName');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('fieldEmail', 'inputEmail'); ok = false; } else clearError('fieldEmail', 'inputEmail');
    if (!ok) return;

    // Slide step1 ra trái, step2 vào từ phải
    document.getElementById('step1').classList.remove('active');
    document.getElementById('step1').classList.add('hidden-left');
    document.getElementById('step2').classList.remove('hidden-right', 'hidden-left');
    document.getElementById('step2').classList.add('active');
}

function selectChoice(el) {
    const parentList = el.closest('.choice-list');
    // Chỉ xóa class selected của các item trong cùng 1 bước
    parentList.querySelectorAll('.choice-item').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');

    // Ẩn thông báo lỗi nếu có
    const err = parentList.nextElementSibling;
    if (err && err.classList.contains('survey-err')) {
        err.classList.remove('show');
    }
}

function goStep3() {
    const step2 = document.getElementById('step2');
    const selected = step2.querySelector('.choice-item.selected');

    if (!selected) {
        document.getElementById('surveyErr').classList.add('show');
        return;
    }

    // Slide step2 ra trái, step3 vào từ phải
    step2.classList.remove('active');
    step2.classList.add('hidden-left');

    const step3 = document.getElementById('step3');
    step3.classList.remove('hidden-right', 'hidden-left');
    step3.classList.add('active');
}

function handleSubmit() {
  const step3 = document.getElementById('step3');
  const selected = step3.querySelector('.choice-item.selected');
  
  if (!selected) {
    document.getElementById('surveyErr3').classList.add('show');
    return;
  }
  
  // Trượt Step 3 ra trái, Step 4 vào từ phải
  step3.classList.remove('active');
  step3.classList.add('hidden-left');
  
  const step4 = document.getElementById('step4');
  step4.classList.remove('hidden-right','hidden-left');
  step4.classList.add('active');

  // Xóa dòng setTimeout(closePopup, 2500) cũ đi để màn hình không tự tắt
  
  // NƠI XỬ LÝ GỬI DỮ LIỆU ĐI (API/Fetch)
  // ...
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closePopup(); });
window.addEventListener('load', () => setTimeout(openPopup, 300));