// ============================================================
// CONFIG API
// ============================================================
const API_BASE = 'https://event-vanphu.eonsr.com/api';
const BASIC_AUTH = 'Basic ' + btoa('vanphu_api:VanPhu@2026!');

function apiPost(endpoint, body) {
    return fetch(API_BASE + endpoint, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': BASIC_AUTH,
        },
        body: JSON.stringify(body),
    }).then(async (res) => {
        const data = await res.json();
        return { ok: res.ok, status: res.status, data };
    });
}

// ============================================================
// ĐỌC URL PARAMS — auto-fill form + lưu guest info
// ============================================================
const urlParams = new URLSearchParams(window.location.search);
const guestName       = urlParams.get('name')        || '';
const guestEmail      = urlParams.get('email')       || '';
const guestId         = urlParams.get('id')          || '';
const guestSecretCode = urlParams.get('secret_code') || '';

// Map câu trả lời survey → giá trị gửi lên API
// Step 2: hành trình sở hữu nhà → dùng làm "source"
const STEP2_MAP = {
    'Tôi đang tìm hiểu để mua căn nhà đầu tiên': 'Mua nhà lần đầu',
    'Tôi đã có nhà nhưng muốn nâng cấp tổ ấm':  'Nâng cấp tổ ấm',
    'Tôi đang tìm kiếm cơ hội đầu tư bất động sản': 'Đầu tư BĐS',
};
// Step 3: điều quan tâm → dùng làm "feedback"
const STEP3_MAP = {
    'Vị trí thuận lợi':                          'Vị trí thuận lợi',
    'Mức giá phù hợp với tài chính':              'Mức giá phù hợp',
    'Tiện ích và môi trường xung quanh':          'Tiện ích & môi trường',
    'Pháp lý và uy tín của chủ đầu tư':           'Pháp lý & uy tín',
};

// ============================================================
// POPUP OPEN / CLOSE
// ============================================================
function openPopup() {
    document.getElementById('overlay').classList.add('active');
    document.body.style.overflow = 'hidden';

    // Auto-fill họ tên + email nếu có từ URL params
    if (guestName)  document.getElementById('inputName').value  = decodeURIComponent(guestName);
    if (guestEmail) document.getElementById('inputEmail').value = decodeURIComponent(guestEmail);
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

    ['step2', 'step3', 'step4'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('hidden-left', 'active');
            el.classList.add('hidden-right');
        }
    });

    document.getElementById('inputName').value  = '';
    document.getElementById('inputEmail').value = '';
    clearError('fieldName', 'inputName');
    clearError('fieldEmail', 'inputEmail');

    document.querySelectorAll('.choice-item').forEach(el => el.classList.remove('selected'));
    ['surveyErr', 'surveyErr3'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('show');
    });
}

function showStep(id) {
    document.querySelectorAll('.step').forEach(s => {
        s.classList.remove('active');
        if (s.id !== id) s.classList.add('hidden-right');
    });
    const target = document.getElementById(id);
    if (target) {
        target.classList.remove('hidden-right', 'hidden-left');
        target.classList.add('active');
    }
}

// ============================================================
// VALIDATION HELPERS
// ============================================================
function setError(f, i)   { document.getElementById(f).classList.add('has-error');    document.getElementById(i).classList.add('error'); }
function clearError(f, i) { document.getElementById(f).classList.remove('has-error'); document.getElementById(i).classList.remove('error'); }

// ============================================================
// STEP 1 → STEP 2
// ============================================================
function goStep2() {
    const name  = document.getElementById('inputName').value.trim();
    const email = document.getElementById('inputEmail').value.trim();
    let ok = true;
    if (!name)  { setError('fieldName', 'inputName'); ok = false; }  else clearError('fieldName', 'inputName');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('fieldEmail', 'inputEmail'); ok = false; } else clearError('fieldEmail', 'inputEmail');
    if (!ok) return;

    document.getElementById('step1').classList.remove('active');
    document.getElementById('step1').classList.add('hidden-left');
    document.getElementById('step2').classList.remove('hidden-right', 'hidden-left');
    document.getElementById('step2').classList.add('active');
}

// ============================================================
// CHỌN ĐÁP ÁN
// ============================================================
function selectChoice(el) {
    const parentList = el.closest('.choice-list');
    parentList.querySelectorAll('.choice-item').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');

    const err = parentList.nextElementSibling;
    if (err && err.classList.contains('survey-err')) err.classList.remove('show');
}

// ============================================================
// STEP 2 → STEP 3
// ============================================================
function goStep3() {
    const step2    = document.getElementById('step2');
    const selected = step2.querySelector('.choice-item.selected');
    if (!selected) { document.getElementById('surveyErr').classList.add('show'); return; }

    step2.classList.remove('active');
    step2.classList.add('hidden-left');

    const step3 = document.getElementById('step3');
    step3.classList.remove('hidden-right', 'hidden-left');
    step3.classList.add('active');
}

// ============================================================
// STEP 3 → GỌI API → STEP 4
// ============================================================
async function handleSubmit() {
    const step3    = document.getElementById('step3');
    const selected = step3.querySelector('.choice-item.selected');
    if (!selected) { document.getElementById('surveyErr3').classList.add('show'); return; }

    // Lấy câu trả lời 2 bước
    const step2Answer = document.getElementById('step2').querySelector('.choice-item.selected')?.textContent.trim() || '';
    const step3Answer = selected.textContent.trim();

    const source   = STEP2_MAP[step2Answer] || step2Answer;
    const feedback = STEP3_MAP[step3Answer] || step3Answer;

    // Disable nút tránh double-submit
    const btn = step3.querySelector('.btn-submit');
    btn.disabled = true;
    btn.textContent = 'Đang gửi…';

    try {
        const res = await apiPost('/guest/update-extra', {
            id:            guestId,
            secret_code:   guestSecretCode,
            photo_booth:   true,
            reminder_sent: true,
            survey: {
                rating:   5,
                feedback: feedback,
                source:   source,
            },
        });

        if (!res.ok) {
            console.warn('Update survey failed:', res.data?.message);
            // Vẫn cho qua step 4 dù API lỗi, không block UX
        }
    } catch (err) {
        console.warn('Update survey error:', err);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Hoàn thành';
    }

    // Chuyển sang step 4 (success)
    step3.classList.remove('active');
    step3.classList.add('hidden-left');

    const step4 = document.getElementById('step4');
    step4.classList.remove('hidden-right', 'hidden-left');
    step4.classList.add('active');
}

// ============================================================
// KEYBOARD + AUTO OPEN
// ============================================================
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePopup(); });
window.addEventListener('load', () => setTimeout(openPopup, 300));