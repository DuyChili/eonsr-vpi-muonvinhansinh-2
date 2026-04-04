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

// Map câu trả lời survey → giá trị gửi lên API + URL redirect
// Step 2: hành trình sở hữu nhà → question2 + redirect URL
const STEP2_MAP = {
    'Tôi đang tìm hiểu để mua căn nhà đầu tiên': {
        value: 'Mua nhà lần đầu',
        url:   'https://livingconnection.vanphu.vn/mua-nha-wiki/',
    },
    'Tôi đã có nhà nhưng muốn nâng cấp tổ ấm': {
        value: 'Nâng cấp tổ ấm',
        url:   'https://livingconnection.vanphu.vn/nha-dep/',
    },
    'Tôi đang tìm kiếm cơ hội đầu tư bất động sản': {
        value: 'Đầu tư BĐS',
        url:   'https://livingconnection.vanphu.vn/thi-truong-bat-dong-san/',
    },
};
// Step 3: điều quan tâm → question1
const STEP3_MAP = {
    'Vị trí thuận lợi':                     'Vị trí thuận lợi',
    'Mức giá phù hợp với tài chính':         'Mức giá phù hợp',
    'Tiện ích và môi trường xung quanh':     'Tiện ích & môi trường',
    'Pháp lý và uy tín của chủ đầu tư':      'Pháp lý & uy tín',
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
// STEP 1 → STEP 2 (có check email tồn tại)
// ============================================================
async function goStep2() {
    const name  = document.getElementById('inputName').value.trim();
    const email = document.getElementById('inputEmail').value.trim();
    let ok = true;
    if (!name)  { setError('fieldName', 'inputName'); ok = false; }  else clearError('fieldName', 'inputName');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('fieldEmail', 'inputEmail'); ok = false; } else clearError('fieldEmail', 'inputEmail');
    if (!ok) return;

    // Check email tồn tại trong hệ thống
    const btn = document.querySelector('#step1 .btn-submit');
    btn.disabled = true;
    btn.textContent = 'Đang kiểm tra…';

    try {
        const res = await apiPost('/guest/send-otp', {
            full_name: name,
            email: email,
        });

        // Nếu email không tồn tại trong hệ thống → backend trả lỗi (không phải 429)
        if (!res.ok && res.status !== 429) {
            // Email không tồn tại → quay lại step 1, highlight ô email
            setEmailNotFoundError();
            return;
        }

        // Email hợp lệ (tồn tại hoặc vừa gửi OTP) → qua step 2
        document.getElementById('step1').classList.remove('active');
        document.getElementById('step1').classList.add('hidden-left');
        document.getElementById('step2').classList.remove('hidden-right', 'hidden-left');
        document.getElementById('step2').classList.add('active');

    } catch {
        setEmailNotFoundError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Tiếp tục';
    }
}

function setEmailNotFoundError(msg) {
    const field = document.getElementById('fieldEmail');
    const input = document.getElementById('inputEmail');
    const errEl = field.querySelector('.err-msg');

    field.classList.add('has-error');
    input.classList.add('error');
    if (errEl) errEl.textContent = msg || 'Email này chưa đăng ký tham dự sự kiện.';
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

    // SỬA LỖI 1: Xóa sạch khoảng trắng thừa ở giữa và 2 đầu để map chuẩn xác 100%
    const rawStep2 = document.getElementById('step2').querySelector('.choice-item.selected')?.textContent || '';
    const step2Answer = rawStep2.replace(/\s+/g, ' ').trim();
    
    const rawStep3 = selected.textContent || '';
    const step3Answer = rawStep3.replace(/\s+/g, ' ').trim();

    const step2Data  = STEP2_MAP[step2Answer] || { value: step2Answer, url: null };
    const source     = step2Data.value;
    const redirectUrl = step2Data.url;
    const feedback   = STEP3_MAP[step3Answer] || step3Answer;

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
                question1: source,
                question2: feedback,
            },
        });

        if (!res.ok) console.warn('update-extra:', res.data?.message);

        // Chuyển sang step 4
        step3.classList.remove('active');
        step3.classList.add('hidden-left');

        const step4 = document.getElementById('step4');
        step4.classList.remove('hidden-right', 'hidden-left');
        step4.classList.add('active');

        // SỬA LỖI 2 & 3: Xử lý lại nút "Khám phá ngay"
        const exploreBtn = document.getElementById('exploreBtn');
        if (exploreBtn) {
            if (redirectUrl) {
                // Có URL -> Gán href bình thường, để thẻ <a> tự làm nhiệm vụ mở tab (nhờ target="_blank")
                exploreBtn.href = redirectUrl;
                exploreBtn.onclick = null; // Bỏ onclick để không bị lỗi mở 2 tab
            } else {
                // Không có URL -> Xóa href và chặn hành vi nhảy trang/mở tab ẩn
                exploreBtn.href = "javascript:void(0);";
                exploreBtn.onclick = function(e) {
                    e.preventDefault(); 
                    alert("Chưa có đường dẫn phù hợp cho lựa chọn này.");
                };
            }
        }

    } catch (err) {
        console.warn('update-extra error:', err);
        // Vẫn cho qua step 4
        step3.classList.remove('active');
        step3.classList.add('hidden-left');
        const step4 = document.getElementById('step4');
        step4.classList.remove('hidden-right', 'hidden-left');
        step4.classList.add('active');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Hoàn thành';
    }
}

// ============================================================
// KEYBOARD + AUTO OPEN
// ============================================================
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePopup(); });
window.addEventListener('load', () => setTimeout(openPopup, 300));