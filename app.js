/* ========================================
   TrainLytics v3 — App Logic
   ======================================== */

const MONTH_NAMES = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
const INTENSITIES = ['NI','I3','I2','I1'];

// ================================================================
//  FIREBASE
// ================================================================
const firebaseConfig = {
    apiKey: "AIzaSyBDlocw5nJKeCj5POS4FWwAHy3t1-LJxNs",
    authDomain: "trainlytics-10c67.firebaseapp.com",
    projectId: "trainlytics-10c67",
    storageBucket: "trainlytics-10c67.firebasestorage.app",
    messagingSenderId: "296168035386",
    appId: "1:296168035386:web:1af111f2348c29d36bd103"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
db.enablePersistence().catch(() => {});

// ================================================================
//  AUTH / USER
// ================================================================
let currentUser = null;
let _cachedEntries = [];
let _unsubscribe = null;

function storageKeyFor(user) { return 'trainlytics_v3_' + user.toLowerCase().trim(); }
function usersListKey() { return 'trainlytics_v3_users'; }

function getUsers() {
    try { return JSON.parse(localStorage.getItem(usersListKey())) || []; } catch { return []; }
}
function addUser(name) {
    const users = getUsers();
    const lower = name.toLowerCase().trim();
    if (!users.includes(lower)) {
        users.push(lower);
        localStorage.setItem(usersListKey(), JSON.stringify(users));
        db.collection('meta').doc('users').set({ list: users }).catch(() => {});
    }
}

async function syncUsers() {
    try {
        const doc = await db.collection('meta').doc('users').get();
        if (doc.exists) {
            const remote = doc.data().list || [];
            const local = getUsers();
            const merged = [...new Set([...local, ...remote])];
            localStorage.setItem(usersListKey(), JSON.stringify(merged));
        }
    } catch(e) { /* offline fallback */ }
}

function loadData() {
    return _cachedEntries;
}

function saveData(data) {
    _cachedEntries = data;
    if (!currentUser) return;
    localStorage.setItem(storageKeyFor(currentUser), JSON.stringify(data));
    db.collection('users').doc(currentUser.toLowerCase().trim())
      .set({ entries: data }).catch(() => {});
}

async function loadFromFirestore(user) {
    try {
        const doc = await db.collection('users').doc(user.toLowerCase().trim()).get();
        if (doc.exists) {
            _cachedEntries = doc.data().entries || [];
            localStorage.setItem(storageKeyFor(user), JSON.stringify(_cachedEntries));
        } else {
            _cachedEntries = JSON.parse(localStorage.getItem(storageKeyFor(user))) || [];
            if (_cachedEntries.length) {
                db.collection('users').doc(user.toLowerCase().trim())
                  .set({ entries: _cachedEntries }).catch(() => {});
            }
        }
    } catch(e) {
        try { _cachedEntries = JSON.parse(localStorage.getItem(storageKeyFor(user))) || []; }
        catch { _cachedEntries = []; }
    }
}

function startListener(user) {
    if (_unsubscribe) _unsubscribe();
    _unsubscribe = db.collection('users').doc(user.toLowerCase().trim())
      .onSnapshot(doc => {
        if (doc.exists && !doc.metadata.hasPendingWrites) {
            _cachedEntries = doc.data().entries || [];
            localStorage.setItem(storageKeyFor(user), JSON.stringify(_cachedEntries));
            renderList();
        }
    });
}

function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function escapeHtml(s) { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

// ---- Splash Screen ----
const splashScreen = document.getElementById('splash-screen');
const loginScreen = document.getElementById('login-screen');
const appEl = document.getElementById('app');
const loginForm = document.getElementById('login-form');
const loginNameInput = document.getElementById('login-name');

function runSplash() {
    // Show welcome message, then fade to login
    setTimeout(() => {
        splashScreen.classList.add('fade-out');
        loginScreen.style.display = '';
        loginScreen.classList.add('fade-in');
        setTimeout(() => { splashScreen.style.display = 'none'; }, 600);
    }, 3000);
}

// Only show splash on first visit per session
if (!sessionStorage.getItem('trainlytics_splashed')) {
    sessionStorage.setItem('trainlytics_splashed', '1');
    runSplash();
} else {
    splashScreen.style.display = 'none';
    loginScreen.style.display = '';
}

const MASTER_NAME = 'micky';
const PW_USERS = ['micky', 'angelika'];
const loginPwGroup = document.getElementById('login-pw-group');
const loginPwInput = document.getElementById('login-pw');
const coachApp = document.getElementById('coach-app');

// Show password field when name requires it
loginNameInput.addEventListener('input', () => {
    const val = loginNameInput.value.trim().toLowerCase();
    loginPwGroup.style.display = PW_USERS.includes(val) ? '' : 'none';
    if (!PW_USERS.includes(val)) loginPwInput.value = '';
});

function renderSavedUsers() {}

async function loginAs(name) {
    const clean = name.trim();
    if (!clean) return;

    // Coach login flow
    if (clean.toLowerCase() === MASTER_NAME) {
        const pw = loginPwInput.value;
        if (!pw) { showToast('Bitte Passwort eingeben'); return; }
        try {
            const doc = await db.collection('meta').doc('coach').get();
            if (doc.exists) {
                if (doc.data().pw !== pw) { showToast('Falsches Passwort'); return; }
            } else {
                await db.collection('meta').doc('coach').set({ pw });
                showToast('Passwort gesetzt ✓');
            }
        } catch(e) { showToast('Fehler bei Coach-Login'); return; }
        currentUser = clean;
        addUser(clean);
        loginScreen.style.display = 'none';
        coachApp.style.display = '';
        loginPwInput.value = '';
        loginPwGroup.style.display = 'none';
        await loadCoachDashboard();
        return;
    }

    // Password-protected user login (Angelika etc.)
    if (PW_USERS.includes(clean.toLowerCase())) {
        const pw = loginPwInput.value;
        if (!pw) { showToast('Bitte Passwort eingeben'); return; }
        const docKey = 'pw_' + clean.toLowerCase();
        try {
            const doc = await db.collection('meta').doc(docKey).get();
            if (doc.exists) {
                if (doc.data().pw !== pw) { showToast('Falsches Passwort'); return; }
            } else {
                await db.collection('meta').doc(docKey).set({ pw });
                showToast('Passwort gesetzt ✓');
            }
        } catch(e) { showToast('Fehler beim Login'); return; }
        loginPwInput.value = '';
        loginPwGroup.style.display = 'none';
    }

    currentUser = clean;
    addUser(clean);
    loginScreen.style.display = 'none';
    appEl.style.display = '';
    document.getElementById('user-greeting').textContent = 'Hallo, ' + clean.charAt(0).toUpperCase() + clean.slice(1) + '!';

    // Reset form/UI for new user
    resetAppUI();

    // Restrict Angelika to Joggen only
    applyUserRestrictions(clean);

    await loadFromFirestore(clean);
    await loadCompetitionsFromFirestore(clean);
    await loadInjuriesFromFirestore(clean);
    startListener(clean);
    renderList();
}

loginForm.addEventListener('submit', e => { e.preventDefault(); loginAs(loginNameInput.value); });

function resetAppUI() {
    form.reset();
    setDefaults();
    // Explicitly clear fields that form.reset() may miss
    document.getElementById('training-notes').value = '';
    document.getElementById('joggen-min').value = '';
    document.getElementById('joggen-sec').value = '';
    document.getElementById('training-count').value = '';
    document.getElementById('telemark-count').value = '';
    intensityGroup.style.display = 'none';
    document.getElementById('kraft-container').style.display = 'none';
    joggenContainer.style.display = 'none';
    timesContainer.style.display = '';
    countContainer.style.display = 'none';
    telemarkContainer.style.display = 'none';
    telemarkYes.classList.add('active');
    telemarkNo.classList.remove('active');
    telemarkCountGroup.style.display = '';
    KRAFT_EXERCISES.forEach(ex => {
        const cb = document.getElementById('kraft-' + ex);
        if (cb) cb.checked = false;
        const det = document.getElementById('kraft-' + ex + '-details');
        if (det) det.style.display = 'none';
    });
    kbPyramidMode = false;
    kbModeNormal.classList.add('active');
    kbModePyramid.classList.remove('active');
    kbNormalFields.style.display = '';
    kbPyramidFields.style.display = 'none';
    timesList.innerHTML = '';
    addTimeEntry();
    destroyAll();
    // Reset to Training tab
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const firstTab = document.querySelector('.tab-btn[data-tab="training"]');
    if (firstTab) firstTab.classList.add('active');
    const firstContent = document.getElementById('training');
    if (firstContent) firstContent.classList.add('active');
    // Clear stale training list
    trainingListEl.innerHTML = '';
}

document.getElementById('btn-logout').addEventListener('click', () => {
    if (_unsubscribe) { _unsubscribe(); _unsubscribe = null; }
    currentUser = null;
    _cachedEntries = [];
    _competitions = [];
    _injuries = [];
    resetAppUI();
    loginScreen.style.display = '';
    loginScreen.classList.remove('fade-in');
    appEl.style.display = 'none';
    coachApp.style.display = 'none';
    loginNameInput.value = '';
    loginPwInput.value = '';
    loginPwGroup.style.display = 'none';
    renderSavedUsers();
});

document.getElementById('btn-coach-logout').addEventListener('click', () => {
    currentUser = null;
    loginScreen.style.display = '';
    loginScreen.classList.remove('fade-in');
    coachApp.style.display = 'none';
    loginNameInput.value = '';
    loginPwInput.value = '';
    loginPwGroup.style.display = 'none';
    renderSavedUsers();
});

syncUsers().then(() => renderSavedUsers());

// ================================================================
//  TABS
// ================================================================
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
        if (btn.dataset.tab === 'analytics') updateAnalytics();
        if (btn.dataset.tab === 'kalender') renderCalendar();
        if (btn.dataset.tab === 'tagebuch') { renderInjuryList(); loadAndShowPlan(); }
    });
});

// ================================================================
//  TOAST
// ================================================================
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2400);
}

// ================================================================
//  FORM LOGIC
// ================================================================
const ANGELIKA_NAME = 'angelika';
const joggenContainer = document.getElementById('joggen-container');

function applyUserRestrictions(userName) {
    const sel = document.getElementById('training-type');
    const hFilter = document.getElementById('history-filter');
    const aType = document.getElementById('analytics-type');
    if (userName.toLowerCase() === ANGELIKA_NAME) {
        // Only Joggen for Angelika
        sel.innerHTML = '<option value="">-- Bitte wählen --</option><option value="Joggen (5km)">Joggen (5km)</option>';
        hFilter.innerHTML = '<option value="all">Alle</option><option value="Joggen (5km)">Joggen (5km)</option>';
        aType.innerHTML = '<option value="Allgemein">📊 Allgemein</option><option value="Joggen (5km)">🏃‍♀️ Joggen (5km)</option>';
    } else {
        // Restore all options (excluding Joggen for non-Angelika)
        sel.innerHTML = '<option value="">-- Bitte wählen --</option><option value="Sprint (50m)">Sprint (50m)</option><option value="Tempolauf (120m)">Tempolauf (120m)</option><option value="Tempolauf (150m)">Tempolauf (150m)</option><option value="Kraft">Kraft</option>';
        hFilter.innerHTML = '<option value="all">Alle</option><option value="Sprint (50m)">Sprint (50m)</option><option value="Tempolauf (120m)">Tempolauf (120m)</option><option value="Tempolauf (150m)">Tempolauf (150m)</option><option value="Kraft">Kraft</option>';
        aType.innerHTML = '<option value="Allgemein">📊 Allgemein</option><option value="Sprint (50m)">Sprint (50m)</option><option value="Tempolauf (120m)">Tempolauf (120m)</option><option value="Tempolauf (150m)">Tempolauf (150m)</option><option value="Kraft">💪 Kraft</option>';
    }
}

const trainingType = document.getElementById('training-type');
const intensityGroup = document.getElementById('intensity-group');
const trainingIntensity = document.getElementById('training-intensity');
const timesContainer = document.getElementById('times-container');
const countContainer = document.getElementById('count-container');
const telemarkContainer = document.getElementById('telemark-container');
const telemarkCountGroup = document.getElementById('telemark-count-group');
const telemarkYes = document.getElementById('telemark-yes');
const telemarkNo = document.getElementById('telemark-no');
const timesList = document.getElementById('times-list');

// Show/hide intensity when type changes
trainingType.addEventListener('change', () => {
    const val = trainingType.value;
    const isTempo = val.startsWith('Tempolauf');
    const isKraft = val === 'Kraft';
    const isJoggen = val === 'Joggen (5km)';
    intensityGroup.style.display = isTempo ? '' : 'none';
    document.getElementById('kraft-container').style.display = isKraft ? '' : 'none';
    joggenContainer.style.display = isJoggen ? '' : 'none';
    if (isKraft || isJoggen) {
        timesContainer.style.display = 'none';
        countContainer.style.display = 'none';
        telemarkContainer.style.display = 'none';
    } else if (!isTempo) {
        trainingIntensity.value = '';
        showTimesMode();
    } else {
        updateFormMode();
    }
});

// Show/hide times vs count when intensity changes
trainingIntensity.addEventListener('change', updateFormMode);

function updateFormMode() {
    const int = trainingIntensity.value;
    if (int === 'NI') showCountMode();
    else showTimesMode();
    telemarkContainer.style.display = int === 'NI' ? '' : 'none';
}

function showTimesMode() {
    timesContainer.style.display = '';
    countContainer.style.display = 'none';
    telemarkContainer.style.display = 'none';
}
function showCountMode() {
    timesContainer.style.display = 'none';
    countContainer.style.display = '';
}

// Telemark toggle
telemarkYes.addEventListener('click', () => {
    telemarkYes.classList.add('active');
    telemarkNo.classList.remove('active');
    telemarkCountGroup.style.display = '';
});
telemarkNo.addEventListener('click', () => {
    telemarkNo.classList.add('active');
    telemarkYes.classList.remove('active');
    telemarkCountGroup.style.display = 'none';
    document.getElementById('telemark-count').value = '';
});

// ---- Time entries ----
// Kraft exercise checkbox toggles
const KRAFT_EXERCISES = ['kniebeugen','waden','beuger','bauch','ruecken','exzentrisch','hipthrust'];
const KRAFT_LABELS = {kniebeugen:'Kniebeugen',waden:'Waden',beuger:'Beuger',bauch:'Bauch',ruecken:'Rücken',exzentrisch:'Exzentrisch',hipthrust:'Hip Thrust'};
KRAFT_EXERCISES.forEach(ex => {
    const cb = document.getElementById('kraft-' + ex);
    const det = document.getElementById('kraft-' + ex + '-details');
    if (cb && det) {
        cb.addEventListener('change', () => { det.style.display = cb.checked ? '' : 'none'; });
    }
});

// Kniebeugen pyramid mode
let kbPyramidMode = false;
const kbModeNormal = document.getElementById('kb-mode-normal');
const kbModePyramid = document.getElementById('kb-mode-pyramid');
const kbNormalFields = document.getElementById('kb-normal-fields');
const kbPyramidFields = document.getElementById('kb-pyramid-fields');
const kbPyramidSets = document.getElementById('kb-pyramid-sets');

kbModeNormal.addEventListener('click', () => {
    kbPyramidMode = false;
    kbModeNormal.classList.add('active');
    kbModePyramid.classList.remove('active');
    kbNormalFields.style.display = '';
    kbPyramidFields.style.display = 'none';
});
kbModePyramid.addEventListener('click', () => {
    kbPyramidMode = true;
    kbModePyramid.classList.add('active');
    kbModeNormal.classList.remove('active');
    kbNormalFields.style.display = 'none';
    kbPyramidFields.style.display = '';
});

function addPyramidSet() {
    const count = kbPyramidSets.querySelectorAll('.pyramid-set').length + 1;
    const row = document.createElement('div');
    row.className = 'pyramid-set';
    row.innerHTML = `<span class="pyramid-set-label">Satz ${count}</span>
        <div class="kraft-inputs">
            <div class="kraft-field"><label>Wdh.</label><input type="number" class="kb-pyr-reps" min="1" step="1" placeholder="Wdh"></div>
            <div class="kraft-field"><label>Kilo</label><input type="number" class="kb-pyr-kg" min="0" step="0.5" placeholder="kg"></div>
        </div>
        <button type="button" class="btn-remove-time" title="Entfernen" style="margin-left:4px">&times;</button>`;
    row.querySelector('.btn-remove-time').addEventListener('click', () => { row.remove(); refreshPyramidLabels(); });
    kbPyramidSets.appendChild(row);
}

function refreshPyramidLabels() {
    kbPyramidSets.querySelectorAll('.pyramid-set').forEach((el, i) => {
        el.querySelector('.pyramid-set-label').textContent = 'Satz ' + (i + 1);
    });
}

document.getElementById('kb-add-set').addEventListener('click', addPyramidSet);

function addTimeEntry(value = '') {
    const idx = timesList.querySelectorAll('.time-entry').length + 1;
    const e = document.createElement('div');
    e.className = 'time-entry';
    e.innerHTML = `<span class="time-index">${idx}</span>
        <input type="number" step="0.01" min="0" placeholder="z.B. 6.85" class="time-input" value="${escapeHtml(String(value))}">
        <button type="button" class="btn-remove-time" title="Entfernen">&times;</button>`;
    e.querySelector('.btn-remove-time').addEventListener('click', () => { e.remove(); refreshIdx(); });
    timesList.appendChild(e);
    refreshIdx();
}

function refreshIdx() {
    const entries = timesList.querySelectorAll('.time-entry');
    entries.forEach((el, i) => {
        el.querySelector('.time-index').textContent = i + 1;
        el.querySelector('.btn-remove-time').disabled = entries.length <= 1;
    });
}

timesList.querySelector('.btn-remove-time').addEventListener('click', function() {
    if (timesList.querySelectorAll('.time-entry').length > 1) { this.closest('.time-entry').remove(); refreshIdx(); }
});

document.getElementById('add-time-btn').addEventListener('click', () => addTimeEntry());

function setDefaults() {
    const n = new Date();
    document.getElementById('training-date').value = n.toISOString().split('T')[0];
    document.getElementById('training-time').value = n.toTimeString().slice(0, 5);
}
setDefaults();

// ---- Submit ----
const form = document.getElementById('training-form');
form.addEventListener('submit', e => {
    e.preventDefault();
    const date = document.getElementById('training-date').value;
    const time = document.getElementById('training-time').value;
    const type = trainingType.value;
    const notes = document.getElementById('training-notes').value.trim();

    if (!date || !time || !type) { showToast('Bitte alle Felder ausfüllen'); return; }

    const isTempo = type.startsWith('Tempolauf');
    const isKraft = type === 'Kraft';
    const isJoggen = type === 'Joggen (5km)';
    const intensity = isTempo ? trainingIntensity.value : '';
    const isCountMode = intensity === 'NI';

    if (isTempo && !intensity) { showToast('Bitte Intensität wählen'); return; }

    let times = [];
    let count = null;
    let telemarks = null;
    let exercises = null;
    let joggenTimeSec = null;

    if (isKraft) {
        exercises = {};
        let anyChecked = false;
        KRAFT_EXERCISES.forEach(ex => {
            const cb = document.getElementById('kraft-' + ex);
            if (cb && cb.checked) {
                anyChecked = true;
                const exData = { done: true };
                if (ex === 'kniebeugen') {
                    if (kbPyramidMode) {
                        const sets = [];
                        kbPyramidSets.querySelectorAll('.pyramid-set').forEach(row => {
                            const reps = parseInt(row.querySelector('.kb-pyr-reps').value, 10) || 0;
                            const kg = parseFloat(row.querySelector('.kb-pyr-kg').value) || 0;
                            if (reps > 0 && kg > 0) sets.push({ reps, kg });
                        });
                        if (sets.length) exData.pyramid = sets;
                        exData.mode = 'pyramid';
                    } else {
                        const kgEl = document.getElementById('kraft-kniebeugen-kg');
                        const repsEl = document.getElementById('kraft-kniebeugen-reps');
                        if (kgEl && kgEl.value) exData.kg = parseFloat(kgEl.value);
                        if (repsEl && repsEl.value) exData.reps = parseInt(repsEl.value, 10);
                        exData.mode = 'normal';
                    }
                } else {
                    const kgEl = document.getElementById('kraft-' + ex + '-kg');
                    const repsEl = document.getElementById('kraft-' + ex + '-reps');
                    if (kgEl && kgEl.value) exData.kg = parseFloat(kgEl.value);
                    if (repsEl && repsEl.value) exData.reps = parseInt(repsEl.value, 10);
                }
                exercises[ex] = exData;
            }
        });
        if (!anyChecked) { showToast('Bitte mindestens eine Übung abhaken'); return; }
    } else if (isJoggen) {
        const minVal = parseInt(document.getElementById('joggen-min').value, 10);
        const secVal = parseInt(document.getElementById('joggen-sec').value, 10) || 0;
        if (isNaN(minVal) || minVal < 0 || (minVal === 0 && secVal <= 0)) { showToast('Bitte gültige Laufzeit eingeben'); return; }
        joggenTimeSec = minVal * 60 + secVal;
    } else if (isCountMode) {
        count = parseInt(document.getElementById('training-count').value, 10);
        if (!count || count < 1) { showToast('Bitte Anzahl eingeben'); return; }
        if (intensity === 'NI') {
            const tmActive = telemarkYes.classList.contains('active');
            if (tmActive) {
                telemarks = parseInt(document.getElementById('telemark-count').value, 10);
                if (!telemarks || telemarks < 1) { showToast('Bitte Telemark-Anzahl eingeben'); return; }
            } else {
                telemarks = 0;
            }
        }
    } else {
        const inputs = timesList.querySelectorAll('.time-input');
        let ok = true;
        inputs.forEach(inp => {
            const v = parseFloat(inp.value);
            if (isNaN(v) || v <= 0) { ok = false; inp.style.borderColor = 'var(--danger)'; }
            else { inp.style.borderColor = ''; times.push(v); }
        });
        if (!ok || !times.length) { showToast('Bitte gültige Zeiten eingeben'); return; }
    }

    const entry = { id: generateId(), date, time, type, intensity, times, count, telemarks, exercises, joggenTimeSec, notes };
    const data = loadData();
    data.unshift(entry);
    saveData(data);

    form.reset();
    setDefaults();
    document.getElementById('training-notes').value = '';
    document.getElementById('joggen-min').value = '';
    document.getElementById('joggen-sec').value = '';
    intensityGroup.style.display = 'none';
    telemarkContainer.style.display = 'none';
    telemarkYes.classList.add('active');
    telemarkNo.classList.remove('active');
    telemarkCountGroup.style.display = '';
    document.getElementById('kraft-container').style.display = 'none';
    joggenContainer.style.display = 'none';
    KRAFT_EXERCISES.forEach(ex => {
        const det = document.getElementById('kraft-' + ex + '-details');
        if (det) det.style.display = 'none';
    });
    // Reset pyramid mode
    kbPyramidMode = false;
    kbModeNormal.classList.add('active');
    kbModePyramid.classList.remove('active');
    kbNormalFields.style.display = '';
    kbPyramidFields.style.display = 'none';
    kbPyramidSets.innerHTML = `<div class="pyramid-set">
        <span class="pyramid-set-label">Satz 1</span>
        <div class="kraft-inputs">
            <div class="kraft-field"><label>Wdh.</label><input type="number" class="kb-pyr-reps" min="1" step="1" placeholder="Wdh"></div>
            <div class="kraft-field"><label>Kilo</label><input type="number" class="kb-pyr-kg" min="0" step="0.5" placeholder="kg"></div>
        </div>
    </div>`;
    showTimesMode();
    timesList.innerHTML = '';
    addTimeEntry();
    renderList();
    showToast('Gespeichert ✓');
});

// ================================================================
//  TRAINING LIST
// ================================================================
const trainingListEl = document.getElementById('training-list');
const historyFilter = document.getElementById('history-filter');
historyFilter.addEventListener('change', renderList);

function typeCss(type) {
    if (type.startsWith('Sprint')) return 'sprint';
    if (type.includes('120')) return 'tempo120';
    if (type === 'Kraft') return 'kraft';
    if (type.startsWith('Joggen')) return 'joggen';
    return 'tempo150';
}

function fmtDate(d) {
    return new Date(d+'T00:00:00').toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'});
}

function fmtJoggenTime(totalSec) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
}

function renderList() {
    const data = loadData();
    const f = historyFilter.value;
    const list = (f === 'all' ? data : data.filter(d => d.type === f))
        .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

    if (!list.length) {
        trainingListEl.innerHTML = `<div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.25"><path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            <p>Noch keine Einheiten vorhanden.</p></div>`;
        return;
    }

    trainingListEl.innerHTML = list.map(en => `
        <div class="training-entry" data-id="${escapeHtml(en.id)}">
            <div class="entry-header">
                <div class="entry-meta">
                    <span class="entry-date">${escapeHtml(fmtDate(en.date))}</span>
                    <span class="entry-time-label">${escapeHtml(en.time)} Uhr</span>
                </div>
                <div class="entry-badges">
                    <span class="type-badge ${typeCss(en.type)}">${escapeHtml(en.type)}</span>
                    ${en.intensity ? `<span class="intensity-badge">${escapeHtml(en.intensity)}</span>` : ''}
                </div>
            </div>
            ${en.type === 'Kraft' && en.exercises
                ? `<div class="entry-kraft">${Object.entries(en.exercises).map(([k,v]) => {
                    const label = KRAFT_LABELS[k] || k;
                    let detail = '';
                    if (v.pyramid && v.pyramid.length) {
                        detail = v.pyramid.map(s => s.reps + '×' + s.kg + 'kg').join(', ');
                    } else {
                        if (v.kg) detail += v.kg + 'kg';
                        if (v.reps) detail += (detail ? ' × ' : '') + v.reps + ' Wdh';
                    }
                    return `<span class="kraft-chip">${escapeHtml(label)}${detail ? ` <span class="kraft-chip-detail">${escapeHtml(detail)}</span>` : ''}</span>`;
                  }).join('')}</div>`
                : en.type === 'Joggen (5km)' && en.joggenTimeSec
                ? `<div class="entry-times"><span class="time-chip joggen-chip">${fmtJoggenTime(en.joggenTimeSec)}</span></div>`
                : en.intensity === 'NI'
                ? `<div class="entry-count">Anzahl Läufe: <strong>${en.count || 0}</strong>${en.telemarks != null ? ` · Telemarks: <strong>${en.telemarks}</strong>` : ''}</div>`
                : `<div class="entry-times">${(en.times||[]).map(t=>`<span class="time-chip">${escapeHtml(String(t))}s</span>`).join('')}</div>`
            }
            ${en.notes ? `<div class="entry-notes">${escapeHtml(en.notes)}</div>` : ''}
            <div class="entry-footer">
                <button class="btn-icon btn-del" data-id="${escapeHtml(en.id)}" title="Löschen">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                </button>
            </div>
        </div>`).join('');

    trainingListEl.querySelectorAll('.btn-del').forEach(b =>
        b.addEventListener('click', () => openDeleteModal(b.dataset.id)));
}

// ---- Delete Modal ----
let delTarget = null;
const modal = document.getElementById('delete-modal');
document.getElementById('modal-cancel').addEventListener('click', () => { modal.classList.remove('show'); });
document.getElementById('modal-confirm').addEventListener('click', () => {
    if (delTarget) { saveData(loadData().filter(d => d.id !== delTarget)); renderList(); showToast('Gelöscht'); }
    modal.classList.remove('show'); delTarget = null;
});
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });
function openDeleteModal(id) { delTarget = id; modal.classList.add('show'); }

// ================================================================
//  ANALYTICS
// ================================================================
const analyticsTypeEl = document.getElementById('analytics-type');
const analyticsIntGroup = document.getElementById('analytics-intensity-group');
const analyticsIntEl = document.getElementById('analytics-intensity');

analyticsTypeEl.addEventListener('change', () => {
    const val = analyticsTypeEl.value;
    const isGeneral = val === 'Allgemein';
    const isTempo = val.startsWith('Tempolauf');
    analyticsIntGroup.style.display = (isTempo && !isGeneral) ? '' : 'none';
    if (!isTempo) analyticsIntEl.value = 'all';
    updateAnalytics();
});
analyticsIntEl.addEventListener('change', updateAnalytics);

const chartInstances = {};
const COLORS = {
    'Sprint (50m)':       { main:'#B4A8FF', bg:'rgba(180,168,255,0.18)', g1:'rgba(180,168,255,0.35)', g2:'rgba(180,168,255,0.02)' },
    'Tempolauf (120m)':   { main:'#22D3C5', bg:'rgba(34,211,197,0.18)',  g1:'rgba(34,211,197,0.35)',  g2:'rgba(34,211,197,0.02)' },
    'Tempolauf (150m)':   { main:'#FBBF24', bg:'rgba(251,191,36,0.18)',  g1:'rgba(251,191,36,0.35)',  g2:'rgba(251,191,36,0.02)' },
    'Kraft':              { main:'#F87171', bg:'rgba(248,113,113,0.18)', g1:'rgba(248,113,113,0.35)', g2:'rgba(248,113,113,0.02)' },
    'Joggen (5km)':       { main:'#34D399', bg:'rgba(52,211,153,0.18)',  g1:'rgba(52,211,153,0.35)',  g2:'rgba(52,211,153,0.02)' },
};

function grad(ctx, c) {
    const g = ctx.createLinearGradient(0,0,0,ctx.canvas.height);
    g.addColorStop(0, c.g1); g.addColorStop(1, c.g2);
    return g;
}

const BASE = {
    responsive:true, maintainAspectRatio:false,
    animation:{duration:400},
    plugins:{
        legend:{display:false},
        tooltip:{
            backgroundColor:'#1A1D26', titleColor:'#EAEDF3',
            bodyColor:'#B4A8FF', borderColor:'rgba(255,255,255,0.08)',
            borderWidth:1, cornerRadius:8, padding:10,
            bodyFont:{weight:'600'}
        }
    },
    scales:{
        x:{ ticks:{color:'#555870',font:{size:11,family:'Inter'}}, grid:{color:'rgba(255,255,255,0.03)'}, border:{color:'transparent'} },
        y:{ ticks:{color:'#555870',font:{size:11,family:'Inter'}}, grid:{color:'rgba(255,255,255,0.04)'}, border:{color:'transparent'} }
    }
};

function destroyAll() { Object.keys(chartInstances).forEach(k => { if(chartInstances[k]){chartInstances[k].destroy();chartInstances[k]=null;} }); }

function updateAnalytics() {
    const type = analyticsTypeEl.value;
    const isGeneral = type === 'Allgemein';
    const isKraft = type === 'Kraft';
    const isJoggen = type === 'Joggen (5km)';
    const isTempo = type.startsWith('Tempolauf');
    analyticsIntGroup.style.display = (isTempo && !isGeneral && !isKraft && !isJoggen) ? '' : 'none';

    // Show/hide stats rows
    document.getElementById('stats-row-general').style.display = isGeneral ? '' : 'none';
    document.getElementById('stats-row').style.display = (isGeneral || isKraft || isJoggen) ? 'none' : '';
    document.getElementById('stats-row-ni').style.display = 'none';
    document.getElementById('stats-row-kraft').style.display = isKraft ? '' : 'none';
    document.getElementById('stats-row-joggen').style.display = isJoggen ? '' : 'none';
    document.getElementById('pb-card').style.display = (isGeneral || isKraft || isJoggen) ? 'none' : '';

    destroyAll();

    if (isGeneral) {
        updateGeneralStats();
        buildGeneralCharts();
        return;
    }

    if (isKraft) {
        const kraftData = loadData().filter(d => d.type === 'Kraft').sort((a,b) => a.date.localeCompare(b.date));
        updateKraftStats(kraftData);
        buildKraftCharts(kraftData);
        return;
    }

    if (isJoggen) {
        const joggenData = loadData().filter(d => d.type === 'Joggen (5km)').sort((a,b) => a.date.localeCompare(b.date));
        updateJoggenStats(joggenData);
        buildJoggenCharts(joggenData);
        return;
    }

    const intFilter = isTempo ? analyticsIntEl.value : 'all';
    const isNI = intFilter === 'NI';

    let data = loadData().filter(d => d.type === type);
    if (intFilter !== 'all') data = data.filter(d => d.intensity === intFilter);
    data.sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

    const timeData = data.filter(d => d.intensity !== 'NI');

    const c = COLORS[type];

    const metersMatch = type.match(/\((\d+)m\)/);
    const meters = metersMatch ? parseInt(metersMatch[1], 10) : 0;

    document.getElementById('stats-row').style.display = isNI ? 'none' : '';
    document.getElementById('stats-row-ni').style.display = isNI ? '' : 'none';
    document.getElementById('pb-card').style.display = isNI ? 'none' : '';

    if (isNI) {
        updateStatsNI(data, meters);
        buildNICharts(data, c, meters);
    } else {
        updateStats(timeData);
        buildTimeCharts(timeData, c);
        drawPBTable(timeData);
    }
}

// ================================================================
//  GENERAL / ALLGEMEIN ANALYTICS
// ================================================================
function getCurrentSeason() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth(); // 0-based
    // Season runs Sep(8) to Aug(7). If month >= Sep, season = thisYear/nextYear, else lastYear/thisYear
    if (m >= 8) return { start: y + '-09-01', end: (y+1) + '-08-31', label: y + '/' + (y+1) };
    return { start: (y-1) + '-09-01', end: y + '-08-31', label: (y-1) + '/' + y };
}

function getWeekNumber(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const jan1 = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
}

function getWeekKey(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const y = d.getFullYear();
    const w = getWeekNumber(dateStr);
    return y + '-W' + String(w).padStart(2, '0');
}

function updateGeneralStats() {
    const $ = id => document.getElementById(id);
    const all = loadData();
    const season = getCurrentSeason();
    const seasonData = all.filter(d => d.date >= season.start && d.date <= season.end);

    $('stat-gen-season').textContent = season.label;
    $('stat-gen-total').textContent = seasonData.length;
    $('stat-gen-total-all').textContent = all.length;

    // Avg per week in season
    if (seasonData.length) {
        const weeks = new Set(seasonData.map(d => getWeekKey(d.date)));
        const seasonStart = new Date(season.start + 'T00:00:00');
        const now = new Date();
        const diffWeeks = Math.max(1, Math.ceil((now - seasonStart) / (7 * 86400000)));
        $('stat-gen-weekly').textContent = (seasonData.length / diffWeeks).toFixed(1);
    } else {
        $('stat-gen-weekly').textContent = '--';
    }

    // Current weekly streak: consecutive weeks with at least 1 session
    if (all.length) {
        const sorted = [...all].sort((a, b) => b.date.localeCompare(a.date));
        const weekKeys = [...new Set(sorted.map(d => getWeekKey(d.date)))].sort().reverse();
        // Current week
        const currentWeek = getWeekKey(new Date().toISOString().split('T')[0]);
        let streak = 0;
        // Start from current week and go backwards
        const d = new Date();
        for (let i = 0; i < 52; i++) {
            const wk = getWeekKey(d.toISOString().split('T')[0]);
            if (weekKeys.includes(wk)) {
                streak++;
            } else if (i > 0) {
                break; // Allow current week to have no training yet
            }
            d.setDate(d.getDate() - 7);
        }
        $('stat-gen-streak').textContent = streak;
    } else {
        $('stat-gen-streak').textContent = '0';
    }

    // Last session
    if (all.length) {
        const sorted = [...all].sort((a, b) => b.date.localeCompare(a.date));
        $('stat-gen-last').textContent = fmtDate(sorted[0].date);
    } else {
        $('stat-gen-last').textContent = '--';
    }
}

function buildGeneralCharts() {
    const container = getChartsContainer();
    const all = loadData();
    if (!all.length) return;

    const sorted = [...all].sort((a, b) => a.date.localeCompare(b.date));
    const season = getCurrentSeason();
    const seasonData = sorted.filter(d => d.date >= season.start && d.date <= season.end);

    const cGen = { main: '#B4A8FF', bg: 'rgba(180,168,255,0.18)', g1: 'rgba(180,168,255,0.35)', g2: 'rgba(180,168,255,0.02)' };

    // 1) Sessions per month (season)
    const c1 = makeChartCard('Einheiten pro Monat (Saison ' + season.label + ')', 'Balken', 'ch-gen-monthly', false);
    container.appendChild(c1);
    drawGenMonthly(seasonData, cGen);

    // 2) Sessions per type (pie)
    const c2 = makeChartCard('Verteilung nach Trainingsart', 'Kreis', 'ch-gen-type-pie', false);
    container.appendChild(c2);
    drawGenTypePie(seasonData);

    // 3) Weekly frequency over time
    const c3 = makeChartCard('Einheiten pro Woche (Saison)', 'Balken', 'ch-gen-weekly', true);
    container.appendChild(c3);
    drawGenWeekly(seasonData, cGen);

    // 4) Weekday distribution
    const c4 = makeChartCard('Trainingstage (Wochentag)', 'Balken', 'ch-gen-weekday', false);
    container.appendChild(c4);
    drawGenWeekday(seasonData);

    // 5) Monthly comparison across seasons
    const c5 = makeChartCard('Einheiten pro Monat (Gesamtverlauf)', 'Balken', 'ch-gen-all-monthly', false);
    container.appendChild(c5);
    drawGenMonthly(sorted, { main: '#22D3C5', bg: 'rgba(34,211,197,0.18)', g1: 'rgba(34,211,197,0.35)', g2: 'rgba(34,211,197,0.02)' }, 'genAllMonthly');

    // 6) Intensity distribution (all Tempolauf in season)
    const tempoData = seasonData.filter(d => d.type.startsWith('Tempolauf') && d.intensity);
    if (tempoData.length) {
        const c6 = makeChartCard('Intensitätsverteilung (Tempolauf, Saison)', 'Kreis', 'ch-gen-intensity', false);
        container.appendChild(c6);
        drawGenIntensityPie(tempoData);
    }
}

function drawGenMonthly(data, c, key) {
    const canvasId = key ? 'ch-gen-all-monthly' : 'ch-gen-monthly';
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    if (!data.length) { chartInstances[key || 'genMonthly'] = emptyChart(ctx); return; }
    const g = groupByMonth(data);
    const labels = Object.keys(g);
    const counts = labels.map(k => g[k].length);
    chartInstances[key || 'genMonthly'] = new Chart(ctx, {
        type: 'bar',
        data: { labels: labels.map(prettyMonth), datasets: [{ data: counts, backgroundColor: c.bg, borderColor: c.main, borderWidth: 2, borderRadius: 8, hoverBackgroundColor: c.main }] },
        options: { ...BASE, scales: { ...BASE.scales, y: { ...BASE.scales.y, ticks: { ...BASE.scales.y.ticks, stepSize: 1 }, title: { display: true, text: 'Einheiten', color: '#555870', font: { size: 11 } } } } }
    });
}

function drawGenTypePie(data) {
    const ctx = document.getElementById('ch-gen-type-pie')?.getContext('2d');
    if (!ctx) return;
    if (!data.length) { chartInstances.genTypePie = emptyChart(ctx); return; }
    const types = {};
    data.forEach(d => { types[d.type] = (types[d.type] || 0) + 1; });
    const labels = Object.keys(types);
    const values = Object.values(types);
    const colors = labels.map(l => (COLORS[l] || { main: '#8B8FA7' }).main);
    chartInstances.genTypePie = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: values, backgroundColor: colors, borderColor: '#12141C', borderWidth: 3 }] },
        options: {
            responsive: true, maintainAspectRatio: false, animation: { duration: 400 },
            plugins: {
                legend: { display: true, position: 'bottom', labels: { color: '#8B8FA7', font: { size: 12, family: 'Inter' }, padding: 16 } },
                tooltip: { ...BASE.plugins.tooltip, callbacks: { label: t => t.label + ': ' + t.parsed + ' (' + Math.round(t.parsed / values.reduce((a, b) => a + b, 0) * 100) + '%)' } }
            }
        }
    });
}

function drawGenWeekly(data, c) {
    const ctx = document.getElementById('ch-gen-weekly')?.getContext('2d');
    if (!ctx) return;
    if (!data.length) { chartInstances.genWeekly = emptyChart(ctx); return; }
    const weeks = {};
    data.forEach(d => { const w = getWeekKey(d.date); weeks[w] = (weeks[w] || 0) + 1; });
    const labels = Object.keys(weeks).sort();
    const values = labels.map(k => weeks[k]);
    // Pretty week labels
    const prettyWeeks = labels.map(k => {
        const parts = k.split('-W');
        return 'KW' + parseInt(parts[1]);
    });
    chartInstances.genWeekly = new Chart(ctx, {
        type: 'bar',
        data: { labels: prettyWeeks, datasets: [{ data: values, backgroundColor: c.bg, borderColor: c.main, borderWidth: 2, borderRadius: 6, hoverBackgroundColor: c.main }] },
        options: { ...BASE, scales: { ...BASE.scales, y: { ...BASE.scales.y, ticks: { ...BASE.scales.y.ticks, stepSize: 1 }, title: { display: true, text: 'Einheiten', color: '#555870', font: { size: 11 } } } } }
    });
}

function drawGenWeekday(data) {
    const ctx = document.getElementById('ch-gen-weekday')?.getContext('2d');
    if (!ctx) return;
    if (!data.length) { chartInstances.genWeekday = emptyChart(ctx); return; }
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const counts = Array(7).fill(0);
    data.forEach(d => { counts[new Date(d.date + 'T00:00:00').getDay()]++; });
    // Reorder: Mo-So
    const reorder = [1, 2, 3, 4, 5, 6, 0];
    const labels = reorder.map(i => days[i]);
    const values = reorder.map(i => counts[i]);
    const colors = reorder.map((_, i) => i < 5 ? 'rgba(34,211,197,0.25)' : 'rgba(251,191,36,0.25)');
    const borders = reorder.map((_, i) => i < 5 ? '#22D3C5' : '#FBBF24');
    chartInstances.genWeekday = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ data: values, backgroundColor: colors, borderColor: borders, borderWidth: 2, borderRadius: 8 }] },
        options: { ...BASE, scales: { ...BASE.scales, y: { ...BASE.scales.y, ticks: { ...BASE.scales.y.ticks, stepSize: 1 }, title: { display: true, text: 'Einheiten', color: '#555870', font: { size: 11 } } } } }
    });
}

function drawGenIntensityPie(data) {
    const ctx = document.getElementById('ch-gen-intensity')?.getContext('2d');
    if (!ctx) return;
    const ints = {};
    data.forEach(d => { ints[d.intensity] = (ints[d.intensity] || 0) + 1; });
    const labels = Object.keys(ints);
    const values = Object.values(ints);
    const intColors = { NI: '#8B8FA7', I3: '#22D3C5', I2: '#FBBF24', I1: '#F87171' };
    const colors = labels.map(l => intColors[l] || '#B4A8FF');
    chartInstances.genIntensity = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: values, backgroundColor: colors, borderColor: '#12141C', borderWidth: 3 }] },
        options: {
            responsive: true, maintainAspectRatio: false, animation: { duration: 400 },
            plugins: {
                legend: { display: true, position: 'bottom', labels: { color: '#8B8FA7', font: { size: 12, family: 'Inter' }, padding: 16 } },
                tooltip: { ...BASE.plugins.tooltip, callbacks: { label: t => t.label + ': ' + t.parsed + ' (' + Math.round(t.parsed / values.reduce((a, b) => a + b, 0) * 100) + '%)' } }
            }
        }
    });
}

// ================================================================
//  KRAFT ANALYTICS
// ================================================================
function updateKraftStats(data) {
    const $ = id => document.getElementById(id);
    $('stat-kraft-sessions').textContent = data.length;

    if (!data.length) {
        $('stat-kraft-avg-ex').textContent = '--';
        $('stat-kraft-max-kb').textContent = '--';
        $('stat-kraft-max-waden').textContent = '--';
        $('stat-kraft-fav').textContent = '--';
        $('stat-kraft-weekly').textContent = '--';
        return;
    }

    // Avg exercises per session
    const exCounts = data.map(d => d.exercises ? Object.keys(d.exercises).length : 0);
    $('stat-kraft-avg-ex').textContent = (exCounts.reduce((a,b)=>a+b,0) / data.length).toFixed(1);

    // Max Kniebeugen kg (including pyramid sets)
    const kbKgs = [];
    data.forEach(d => {
        const kb = d.exercises?.kniebeugen;
        if (!kb) return;
        if (kb.pyramid) kb.pyramid.forEach(s => { if (s.kg) kbKgs.push(s.kg); });
        else if (kb.kg) kbKgs.push(kb.kg);
    });
    $('stat-kraft-max-kb').textContent = kbKgs.length ? Math.max(...kbKgs) + 'kg' : '--';

    // Max Waden kg
    const wadenKgs = data.filter(d => d.exercises?.waden?.kg).map(d => d.exercises.waden.kg);
    $('stat-kraft-max-waden').textContent = wadenKgs.length ? Math.max(...wadenKgs) + 'kg' : '--';

    // Most frequent exercise
    const freq = {};
    data.forEach(d => {
        if (!d.exercises) return;
        Object.keys(d.exercises).forEach(ex => { freq[ex] = (freq[ex]||0) + 1; });
    });
    const sorted = Object.entries(freq).sort((a,b) => b[1]-a[1]);
    $('stat-kraft-fav').textContent = sorted.length ? KRAFT_LABELS[sorted[0][0]] || sorted[0][0] : '--';

    // Avg per week (season)
    const season = getCurrentSeason();
    const seasonKraft = data.filter(d => d.date >= season.start && d.date <= season.end);
    if (seasonKraft.length) {
        const seasonStart = new Date(season.start + 'T00:00:00');
        const now = new Date();
        const diffWeeks = Math.max(1, Math.ceil((now - seasonStart) / (7 * 86400000)));
        $('stat-kraft-weekly').textContent = (seasonKraft.length / diffWeeks).toFixed(1);
    } else {
        $('stat-kraft-weekly').textContent = '--';
    }
}

function buildKraftCharts(data) {
    const container = getChartsContainer();
    if (!data.length) return;
    const cK = { main:'#F87171', bg:'rgba(248,113,113,0.18)', g1:'rgba(248,113,113,0.35)', g2:'rgba(248,113,113,0.02)' };

    // 1) Sessions per month
    const c1 = makeChartCard('Krafteinheiten pro Monat','Balken','ch-kraft-monthly',false);
    container.appendChild(c1);
    drawKraftMonthly(data, cK);

    // 2) Exercise frequency (bar)
    const c2 = makeChartCard('Übungshäufigkeit (Gesamt)','Balken','ch-kraft-freq',false);
    container.appendChild(c2);
    drawKraftFrequency(data);

    // 3) Kniebeugen kg progression (use max kg for pyramid)
    const kbData = data.filter(d => {
        const kb = d.exercises?.kniebeugen;
        return kb && (kb.kg || (kb.pyramid && kb.pyramid.length));
    });
    if (kbData.length) {
        const c3 = makeChartCard('Kniebeugen – Max Gewicht (kg)','Linie','ch-kraft-kb',false);
        container.appendChild(c3);
        drawKraftKbProgression(kbData);
    }

    // 4) Waden kg progression
    const wadenData = data.filter(d => d.exercises?.waden?.kg);
    if (wadenData.length) {
        const c4 = makeChartCard('Waden – Gewicht (kg)','Linie','ch-kraft-waden',false);
        container.appendChild(c4);
        drawKraftProgression(wadenData, 'waden', 'waden', {main:'#22D3C5', bg:'rgba(34,211,197,0.18)', g1:'rgba(34,211,197,0.35)', g2:'rgba(34,211,197,0.02)'});
    }

    // 5) Beuger kg progression
    const beugerData = data.filter(d => d.exercises?.beuger?.kg);
    if (beugerData.length) {
        const c5 = makeChartCard('Beuger – Gewicht (kg)','Linie','ch-kraft-beuger',false);
        container.appendChild(c5);
        drawKraftProgression(beugerData, 'beuger', 'beuger', {main:'#FBBF24', bg:'rgba(251,191,36,0.18)', g1:'rgba(251,191,36,0.35)', g2:'rgba(251,191,36,0.02)'});
    }

    // 5b) Hip Thrust kg progression
    const htData = data.filter(d => d.exercises?.hipthrust?.kg);
    if (htData.length) {
        const c5b = makeChartCard('Hip Thrust – Gewicht (kg)','Linie','ch-kraft-hipthrust',false);
        container.appendChild(c5b);
        drawKraftProgression(htData, 'hipthrust', 'hipthrust', {main:'#E879F9', bg:'rgba(232,121,249,0.18)', g1:'rgba(232,121,249,0.35)', g2:'rgba(232,121,249,0.02)'});
    }

    // 6) Exercises per session trend
    const c6 = makeChartCard('Übungen pro Einheit','Linie','ch-kraft-ex-trend',false);
    container.appendChild(c6);
    drawKraftExTrend(data, cK);
}

function drawKraftMonthly(data, c) {
    const ctx = document.getElementById('ch-kraft-monthly')?.getContext('2d');
    if (!ctx) return;
    const g = groupByMonth(data);
    const labels = Object.keys(g);
    const counts = labels.map(k => g[k].length);
    chartInstances.kraftMonthly = new Chart(ctx, {
        type:'bar',
        data:{labels:labels.map(prettyMonth), datasets:[{data:counts, backgroundColor:c.bg, borderColor:c.main, borderWidth:2, borderRadius:8, hoverBackgroundColor:c.main}]},
        options:{...BASE, scales:{...BASE.scales, y:{...BASE.scales.y, ticks:{...BASE.scales.y.ticks,stepSize:1}, title:{display:true,text:'Einheiten',color:'#555870',font:{size:11}}}}}
    });
}

function drawKraftFrequency(data) {
    const ctx = document.getElementById('ch-kraft-freq')?.getContext('2d');
    if (!ctx) return;
    const freq = {};
    data.forEach(d => {
        if (!d.exercises) return;
        Object.keys(d.exercises).forEach(ex => { freq[ex] = (freq[ex]||0) + 1; });
    });
    const sorted = Object.entries(freq).sort((a,b) => b[1]-a[1]);
    const labels = sorted.map(e => KRAFT_LABELS[e[0]] || e[0]);
    const values = sorted.map(e => e[1]);
    const colors = ['#B4A8FF','#22D3C5','#FBBF24','#F87171','#60A5FA','#34D399','#E879F9'];
    chartInstances.kraftFreq = new Chart(ctx, {
        type:'bar',
        data:{labels, datasets:[{data:values, backgroundColor:colors.slice(0,labels.length).map(c=>c+'30'), borderColor:colors.slice(0,labels.length), borderWidth:2, borderRadius:8}]},
        options:{...BASE, indexAxis:'y', scales:{
            x:{...BASE.scales.x, ticks:{...BASE.scales.x.ticks,stepSize:1}, title:{display:true,text:'Anzahl',color:'#555870',font:{size:11}}},
            y:{...BASE.scales.y}
        }}
    });
}

function drawKraftKbProgression(data) {
    const ctx = document.getElementById('ch-kraft-kb')?.getContext('2d');
    if (!ctx) return;
    const c = {main:'#B4A8FF', bg:'rgba(180,168,255,0.18)', g1:'rgba(180,168,255,0.35)', g2:'rgba(180,168,255,0.02)'};
    const labels = data.map(d => shortDate(d.date));
    const values = data.map(d => {
        const kb = d.exercises.kniebeugen;
        if (kb.pyramid && kb.pyramid.length) return Math.max(...kb.pyramid.map(s => s.kg));
        return kb.kg || 0;
    });
    chartInstances.kraft_kb = new Chart(ctx, {
        type:'line',
        data:{labels, datasets:[{data:values, borderColor:c.main, backgroundColor:grad(ctx,c),
            borderWidth:2.5, pointBackgroundColor:c.main, pointRadius:4, pointHoverRadius:7, fill:true, tension:0.35}]},
        options:{...BASE, plugins:{...BASE.plugins, tooltip:{...BASE.plugins.tooltip,
            callbacks:{label:t => t.parsed.y + 'kg'}
        }}, scales:{...BASE.scales, y:{...BASE.scales.y, title:{display:true,text:'Kilogramm',color:'#555870',font:{size:11}}}}}
    });
}

function drawKraftProgression(data, exercise, key, c) {
    const ctx = document.getElementById('ch-kraft-' + key)?.getContext('2d');
    if (!ctx) return;
    const labels = data.map(d => shortDate(d.date));
    const values = data.map(d => d.exercises[exercise].kg);
    chartInstances['kraft_' + key] = new Chart(ctx, {
        type:'line',
        data:{labels, datasets:[{data:values, borderColor:c.main, backgroundColor:grad(ctx,c),
            borderWidth:2.5, pointBackgroundColor:c.main, pointRadius:4, pointHoverRadius:7, fill:true, tension:0.35}]},
        options:{...BASE, plugins:{...BASE.plugins, tooltip:{...BASE.plugins.tooltip,
            callbacks:{label:t => t.parsed.y + 'kg'}
        }}, scales:{...BASE.scales, y:{...BASE.scales.y, title:{display:true,text:'Kilogramm',color:'#555870',font:{size:11}}}}}
    });
}

function drawKraftExTrend(data, c) {
    const ctx = document.getElementById('ch-kraft-ex-trend')?.getContext('2d');
    if (!ctx) return;
    const labels = data.map(d => shortDate(d.date));
    const values = data.map(d => d.exercises ? Object.keys(d.exercises).length : 0);
    chartInstances.kraftExTrend = new Chart(ctx, {
        type:'line',
        data:{labels, datasets:[{data:values, borderColor:c.main, backgroundColor:grad(ctx,c),
            borderWidth:2.5, pointBackgroundColor:c.main, pointRadius:3.5, fill:true, tension:0.35}]},
        options:{...BASE, scales:{...BASE.scales, y:{...BASE.scales.y, ticks:{...BASE.scales.y.ticks,stepSize:1}, title:{display:true,text:'Übungen',color:'#555870',font:{size:11}}}}}
    });
}

// ================================================================
//  JOGGEN ANALYTICS
// ================================================================
function updateJoggenStats(data) {
    const $ = id => document.getElementById(id);
    if (!data.length) {
        ['stat-jog-best','stat-jog-avg','stat-jog-km','stat-jog-trend','stat-jog-weekly'].forEach(id => { $(id).textContent = '--'; $(id).style.color = ''; });
        $('stat-jog-sessions').textContent = '0';
        return;
    }
    const withTime = data.filter(d => d.joggenTimeSec);
    $('stat-jog-sessions').textContent = data.length;
    $('stat-jog-km').textContent = (data.length * 5) + ' km';
    if (withTime.length) {
        const best = Math.min(...withTime.map(d => d.joggenTimeSec));
        const avg = withTime.reduce((s,d) => s + d.joggenTimeSec, 0) / withTime.length;
        $('stat-jog-best').textContent = fmtJoggenTime(best);
        $('stat-jog-avg').textContent = fmtJoggenTime(Math.round(avg));
    } else {
        $('stat-jog-best').textContent = '--';
        $('stat-jog-avg').textContent = '--';
    }
    // Trend
    const tEl = $('stat-jog-trend');
    if (withTime.length >= 4) {
        const h = Math.floor(withTime.length / 2);
        const oldAvg = withTime.slice(0, h).reduce((s,d) => s + d.joggenTimeSec, 0) / h;
        const newAvg = withTime.slice(h).reduce((s,d) => s + d.joggenTimeSec, 0) / (withTime.length - h);
        const diff = newAvg - oldAvg;
        if (diff < -10) { tEl.textContent = '↓ Schneller'; tEl.style.color = '#34D399'; }
        else if (diff > 10) { tEl.textContent = '↑ Langsamer'; tEl.style.color = '#F87171'; }
        else { tEl.textContent = '→ Stabil'; tEl.style.color = '#B4A8FF'; }
    } else { tEl.textContent = '--'; tEl.style.color = ''; }
    // Weekly avg
    const season = getCurrentSeason();
    const seasonData = data.filter(d => d.date >= season.start && d.date <= season.end);
    if (seasonData.length) {
        const seasonStart = new Date(season.start + 'T00:00:00');
        const now = new Date();
        const diffWeeks = Math.max(1, Math.ceil((now - seasonStart) / (7 * 86400000)));
        $('stat-jog-weekly').textContent = (seasonData.length / diffWeeks).toFixed(1) + '/Wo';
    } else { $('stat-jog-weekly').textContent = '--'; }
}

function buildJoggenCharts(data) {
    const container = getChartsContainer();
    if (!data.length) return;
    const cJ = COLORS['Joggen (5km)'];
    const withTime = data.filter(d => d.joggenTimeSec);

    // 1) Time trend
    if (withTime.length) {
        const c1 = makeChartCard('Laufzeit-Verlauf (5 km)', 'Linie', 'ch-jog-time', false);
        container.appendChild(c1);
        const ctx1 = document.getElementById('ch-jog-time')?.getContext('2d');
        if (ctx1) {
            const labels = withTime.map(d => shortDate(d.date));
            const values = withTime.map(d => d.joggenTimeSec);
            chartInstances.jogTime = new Chart(ctx1, {
                type: 'line',
                data: { labels, datasets: [{
                    data: values, borderColor: cJ.main, backgroundColor: grad(ctx1, cJ),
                    borderWidth: 2.5, pointBackgroundColor: cJ.main, pointRadius: 4, pointHoverRadius: 7, fill: true, tension: 0.35
                }]},
                options: { ...BASE, plugins: { ...BASE.plugins, tooltip: { ...BASE.plugins.tooltip,
                    callbacks: { label: t => fmtJoggenTime(t.parsed.y) }
                }}, scales: { ...BASE.scales, y: { ...BASE.scales.y, reverse: true, title: { display: true, text: 'Zeit (mm:ss)', color: '#555870', font: { size: 11 }},
                    ticks: { ...BASE.scales.y.ticks, callback: v => fmtJoggenTime(Math.round(v)) }
                }}}
            });
        }
    }

    // 2) Monthly sessions
    const c2 = makeChartCard('Joggen-Einheiten pro Monat', 'Balken', 'ch-jog-monthly', false);
    container.appendChild(c2);
    const ctx2 = document.getElementById('ch-jog-monthly')?.getContext('2d');
    if (ctx2) {
        const g = groupByMonth(data);
        const mLabels = Object.keys(g);
        const counts = mLabels.map(k => g[k].length);
        chartInstances.jogMonthly = new Chart(ctx2, {
            type: 'bar',
            data: { labels: mLabels.map(prettyMonth), datasets: [{
                data: counts, backgroundColor: cJ.bg, borderColor: cJ.main, borderWidth: 2, borderRadius: 8, hoverBackgroundColor: cJ.main
            }]},
            options: { ...BASE, scales: { ...BASE.scales, y: { ...BASE.scales.y, ticks: { ...BASE.scales.y.ticks, stepSize: 1 }, title: { display: true, text: 'Einheiten', color: '#555870', font: { size: 11 }}}}}
        });
    }

    // 3) Pace per km trend
    if (withTime.length) {
        const c3 = makeChartCard('Pace pro km (Durchschnitt)', 'Linie', 'ch-jog-pace', false);
        container.appendChild(c3);
        const ctx3 = document.getElementById('ch-jog-pace')?.getContext('2d');
        if (ctx3) {
            const labels = withTime.map(d => shortDate(d.date));
            const paceValues = withTime.map(d => Math.round(d.joggenTimeSec / 5));
            chartInstances.jogPace = new Chart(ctx3, {
                type: 'line',
                data: { labels, datasets: [{
                    data: paceValues, borderColor: '#60A5FA', backgroundColor: 'rgba(96,165,250,0.12)',
                    borderWidth: 2.5, pointBackgroundColor: '#60A5FA', pointRadius: 4, fill: true, tension: 0.35
                }]},
                options: { ...BASE, plugins: { ...BASE.plugins, tooltip: { ...BASE.plugins.tooltip,
                    callbacks: { label: t => fmtJoggenTime(t.parsed.y) + ' /km' }
                }}, scales: { ...BASE.scales, y: { ...BASE.scales.y, reverse: true, title: { display: true, text: 'Pace (mm:ss/km)', color: '#555870', font: { size: 11 }},
                    ticks: { ...BASE.scales.y.ticks, callback: v => fmtJoggenTime(Math.round(v)) }
                }}}
            });
        }
    }

    // 4) Monthly average time
    if (withTime.length) {
        const c4 = makeChartCard('Ø Laufzeit pro Monat', 'Balken', 'ch-jog-mavg', false);
        container.appendChild(c4);
        const ctx4 = document.getElementById('ch-jog-mavg')?.getContext('2d');
        if (ctx4) {
            const g = groupByMonth(withTime);
            const mLabels = Object.keys(g);
            const avgTimes = mLabels.map(k => {
                const arr = g[k].filter(d => d.joggenTimeSec);
                return arr.length ? Math.round(arr.reduce((s,d) => s + d.joggenTimeSec, 0) / arr.length) : 0;
            });
            chartInstances.jogMavg = new Chart(ctx4, {
                type: 'bar',
                data: { labels: mLabels.map(prettyMonth), datasets: [{
                    data: avgTimes, backgroundColor: cJ.bg, borderColor: cJ.main, borderWidth: 2, borderRadius: 8, hoverBackgroundColor: cJ.main
                }]},
                options: { ...BASE, plugins: { ...BASE.plugins, tooltip: { ...BASE.plugins.tooltip,
                    callbacks: { label: t => fmtJoggenTime(t.parsed.y) }
                }}, scales: { ...BASE.scales, y: { ...BASE.scales.y, reverse: true, title: { display: true, text: 'Ø Zeit (mm:ss)', color: '#555870', font: { size: 11 }},
                    ticks: { ...BASE.scales.y.ticks, callback: v => fmtJoggenTime(Math.round(v)) }
                }}}
            });
        }
    }
}

// ---- Stats (Time-based) ----
function updateStats(data) {
    const $ = id => document.getElementById(id);
    if (!data.length) {
        ['stat-best','stat-avg','stat-recent','stat-trend','stat-worst'].forEach(id => { $(id).textContent='--'; $(id).style.color=''; });
        $('stat-count').textContent='0';
        return;
    }
    const all = data.flatMap(d => d.times);
    $('stat-best').textContent = Math.min(...all).toFixed(2)+'s';
    $('stat-worst').textContent = Math.max(...all).toFixed(2)+'s';
    $('stat-avg').textContent = (all.reduce((a,b)=>a+b,0)/all.length).toFixed(2)+'s';
    $('stat-count').textContent = data.length;

    const r5 = data.slice(-5).flatMap(d=>d.times);
    $('stat-recent').textContent = r5.length ? (r5.reduce((a,b)=>a+b,0)/r5.length).toFixed(2)+'s' : '--';

    const tEl = $('stat-trend');
    if (data.length >= 4) {
        const h = Math.floor(data.length/2);
        const oA = data.slice(0,h).flatMap(d=>d.times); const nA = data.slice(h).flatMap(d=>d.times);
        const diff = (nA.reduce((a,b)=>a+b,0)/nA.length) - (oA.reduce((a,b)=>a+b,0)/oA.length);
        if(diff<-0.1){tEl.textContent='↓ Besser';tEl.style.color='#34D399';}
        else if(diff>0.1){tEl.textContent='↑ Langsamer';tEl.style.color='#F87171';}
        else{tEl.textContent='→ Stabil';tEl.style.color='#FBBF24';}
    } else { tEl.textContent='–'; tEl.style.color=''; }
}

// ---- Stats (I1 count-based) ----
// ---- Stats (NI count-based with meters & telemarks) ----
function updateStatsNI(data, meters) {
    const $ = id => document.getElementById(id);
    $('stat-ni-sessions').textContent = data.length;
    const counts = data.map(d => d.count || 0);
    const totalRuns = counts.reduce((a,b)=>a+b,0);
    $('stat-ni-total').textContent = totalRuns;
    $('stat-ni-avg-count').textContent = data.length ? (totalRuns/data.length).toFixed(1) : '--';
    $('stat-ni-meters').textContent = (totalRuns * meters).toLocaleString('de-DE') + 'm';
    const tms = data.map(d => d.telemarks || 0);
    const totalTm = tms.reduce((a,b)=>a+b,0);
    $('stat-ni-telemarks').textContent = totalTm;
    const tmSessions = data.filter(d => d.telemarks != null && d.telemarks > 0);
    $('stat-ni-avg-tm').textContent = tmSessions.length ? (totalTm / tmSessions.length).toFixed(1) : '--';
}

// ---- Build charts container dynamically ----
function getChartsContainer() {
    const el = document.getElementById('charts-container');
    el.innerHTML = '';
    return el;
}

function makeChartCard(title, tag, id, tall) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<div class="chart-header"><h3>${escapeHtml(title)}</h3><span class="chart-tag">${escapeHtml(tag)}</span></div>
        <div class="chart-container${tall?' chart-tall':''}"><canvas id="${id}"></canvas></div>`;
    return card;
}

// ================================================================
//  TIME-BASED CHARTS
// ================================================================
function buildTimeCharts(data, c) {
    const container = getChartsContainer();

    // 1) Best time trend
    const c1 = makeChartCard('Trend: Beste Zeit pro Einheit','Linie','ch-best-trend',false);
    container.appendChild(c1);
    drawBestTrend(data, c);

    // 2) All times scatter
    const c2 = makeChartCard('Alle Zeiten im Zeitverlauf','Scatter','ch-all-times',true);
    container.appendChild(c2);
    drawAllTimes(data, c);

    // 3) Monthly avg
    const c3 = makeChartCard('Monatsdurchschnitt','Balken','ch-monthly-avg',false);
    container.appendChild(c3);
    drawMonthlyAvg(data, c);

    // 4) Monthly best
    const c4 = makeChartCard('Beste Zeit pro Monat','Linie','ch-monthly-best',false);
    container.appendChild(c4);
    drawMonthlyBest(data, c);

    // 5) Volume
    const c5 = makeChartCard('Trainingsvolumen pro Monat','Balken','ch-volume',false);
    container.appendChild(c5);
    drawVolume(data, c);

    // 6) Distribution
    const c6 = makeChartCard('Zeitverteilung (Histogramm)','Balken','ch-dist',false);
    container.appendChild(c6);
    drawDistribution(data, c);
}

// Build note lookup: date -> notes
function noteMap(data) {
    const m = {};
    data.forEach(d => { if(d.notes) m[d.date] = (m[d.date] ? m[d.date]+' | ' : '') + d.notes; });
    return m;
}

function tooltipWithNotes(data) {
    const nm = noteMap(data);
    return {
        ...BASE.plugins.tooltip,
        callbacks: {
            label: ctx => ctx.parsed.y.toFixed(2)+'s',
            afterBody: (items) => {
                const idx = items[0]?.dataIndex;
                if (idx == null || !data[idx]) return '';
                const n = data[idx].notes;
                return n ? '📝 ' + n : '';
            }
        }
    };
}

function drawBestTrend(data, c) {
    const ctx = document.getElementById('ch-best-trend')?.getContext('2d');
    if(!ctx) return;
    if(!data.length) { chartInstances.bestTrend = emptyChart(ctx); return; }
    const labels = data.map(d => shortDate(d.date));
    const vals = data.map(d => Math.min(...d.times));
    chartInstances.bestTrend = new Chart(ctx, {
        type:'line',
        data:{labels, datasets:[{data:vals, borderColor:c.main, backgroundColor:grad(ctx,c),
            borderWidth:2.5, pointBackgroundColor:c.main, pointRadius:3.5, pointHoverRadius:6, fill:true, tension:0.35}]},
        options:{...BASE, plugins:{...BASE.plugins, tooltip:tooltipWithNotes(data)},
            scales:{...BASE.scales, y:{...BASE.scales.y, title:{display:true,text:'Sekunden',color:'#555870',font:{size:11}}}}}
    });
}

function drawAllTimes(data, c) {
    const ctx = document.getElementById('ch-all-times')?.getContext('2d');
    if(!ctx) return;
    if(!data.length) { chartInstances.allTimes = emptyChart(ctx); return; }

    const points = []; const labelSet = []; const pointNotes = [];
    data.forEach(d => {
        const label = shortDate(d.date);
        if(!labelSet.includes(label)) labelSet.push(label);
        d.times.forEach(t => { points.push({x:labelSet.indexOf(label), y:t}); pointNotes.push(d.notes||''); });
    });

    chartInstances.allTimes = new Chart(ctx, {
        type:'scatter',
        data:{datasets:[{data:points, backgroundColor:c.main, borderColor:c.main, pointRadius:5, pointHoverRadius:8}]},
        options:{...BASE,
            plugins:{...BASE.plugins, tooltip:{...BASE.plugins.tooltip,
                callbacks:{
                    title:items=>labelSet[items[0].parsed.x]||'',
                    label:item=>item.parsed.y.toFixed(2)+'s',
                    afterBody:items=>{const n=pointNotes[items[0]?.dataIndex]; return n?'📝 '+n:'';}
                }
            }},
            scales:{
                x:{...BASE.scales.x, type:'linear', ticks:{...BASE.scales.x.ticks, stepSize:1, callback:v=>labelSet[v]||''}},
                y:{...BASE.scales.y, title:{display:true,text:'Sekunden',color:'#555870',font:{size:11}}}
            }
        }
    });
}

function drawMonthlyAvg(data, c) {
    const ctx = document.getElementById('ch-monthly-avg')?.getContext('2d');
    if(!ctx) return;
    if(!data.length) { chartInstances.monthlyAvg = emptyChart(ctx); return; }
    const g = groupByMonth(data);
    const labels = Object.keys(g);
    const avgs = labels.map(k => { const a=g[k].flatMap(d=>d.times); return a.reduce((x,y)=>x+y,0)/a.length; });
    // Collect notes per month
    const monthNotes = labels.map(k => g[k].filter(d=>d.notes).map(d=>d.notes).join(' | '));
    chartInstances.monthlyAvg = new Chart(ctx, {
        type:'bar',
        data:{labels:labels.map(prettyMonth), datasets:[{data:avgs, backgroundColor:c.bg, borderColor:c.main, borderWidth:2, borderRadius:8, hoverBackgroundColor:c.main}]},
        options:{...BASE, plugins:{...BASE.plugins, tooltip:{...BASE.plugins.tooltip,
            callbacks:{label:t=>t.parsed.y.toFixed(2)+'s', afterBody:items=>{const n=monthNotes[items[0]?.dataIndex]; return n?'📝 '+n:'';}}
        }}, scales:{...BASE.scales, y:{...BASE.scales.y, title:{display:true,text:'Ø Sekunden',color:'#555870',font:{size:11}}}}}
    });
}

function drawMonthlyBest(data, c) {
    const ctx = document.getElementById('ch-monthly-best')?.getContext('2d');
    if(!ctx) return;
    if(!data.length) { chartInstances.monthlyBest = emptyChart(ctx); return; }
    const g = groupByMonth(data);
    const labels = Object.keys(g);
    const bests = labels.map(k => Math.min(...g[k].flatMap(d=>d.times)));
    const monthNotes = labels.map(k => g[k].filter(d=>d.notes).map(d=>d.notes).join(' | '));
    chartInstances.monthlyBest = new Chart(ctx, {
        type:'line',
        data:{labels:labels.map(prettyMonth), datasets:[{data:bests, borderColor:c.main, backgroundColor:grad(ctx,c),
            borderWidth:2.5, pointBackgroundColor:'#fff', pointBorderColor:c.main, pointBorderWidth:2, pointRadius:5, fill:true, tension:0.3}]},
        options:{...BASE, plugins:{...BASE.plugins, tooltip:{...BASE.plugins.tooltip,
            callbacks:{label:t=>t.parsed.y.toFixed(2)+'s', afterBody:items=>{const n=monthNotes[items[0]?.dataIndex]; return n?'📝 '+n:'';}}
        }}, scales:{...BASE.scales, y:{...BASE.scales.y, title:{display:true,text:'Beste Zeit (s)',color:'#555870',font:{size:11}}}}}
    });
}

function drawVolume(data, c) {
    const ctx = document.getElementById('ch-volume')?.getContext('2d');
    if(!ctx) return;
    if(!data.length) { chartInstances.volume = emptyChart(ctx); return; }
    const g = groupByMonth(data);
    const labels = Object.keys(g);
    const sessions = labels.map(k => g[k].length);
    const runs = labels.map(k => g[k].reduce((s,d)=>s+d.times.length,0));
    chartInstances.volume = new Chart(ctx, {
        type:'bar',
        data:{labels:labels.map(prettyMonth), datasets:[
            {label:'Einheiten', data:sessions, backgroundColor:c.bg, borderColor:c.main, borderWidth:2, borderRadius:8},
            {label:'Einzelläufe', data:runs, backgroundColor:'rgba(96,165,250,0.18)', borderColor:'#60A5FA', borderWidth:2, borderRadius:8}
        ]},
        options:{...BASE, plugins:{...BASE.plugins, legend:{display:true, labels:{color:'#8B8FA7',font:{size:11,family:'Inter'},boxWidth:14,padding:16}}},
            scales:{...BASE.scales, y:{...BASE.scales.y, ticks:{...BASE.scales.y.ticks,stepSize:1}}}}
    });
}

function drawDistribution(data, c) {
    const ctx = document.getElementById('ch-dist')?.getContext('2d');
    if(!ctx) return;
    if(!data.length) { chartInstances.dist = emptyChart(ctx); return; }
    const all = data.flatMap(d=>d.times);
    const min = Math.floor(Math.min(...all)*2)/2;
    const max = Math.ceil(Math.max(...all)*2)/2;
    const step = Math.max(0.5, Math.round(((max-min)/8)*2)/2);
    const bins=[]; const binLabels=[];
    for(let s=min;s<max+step;s+=step){
        bins.push(all.filter(t=>t>=s&&t<s+step).length);
        binLabels.push(s.toFixed(1)+'–'+(s+step).toFixed(1));
    }
    chartInstances.dist = new Chart(ctx, {
        type:'bar',
        data:{labels:binLabels, datasets:[{data:bins, backgroundColor:c.bg, borderColor:c.main, borderWidth:2, borderRadius:6, hoverBackgroundColor:c.main}]},
        options:{...BASE, scales:{
            x:{...BASE.scales.x, title:{display:true,text:'Sekunden',color:'#555870',font:{size:11}}},
            y:{...BASE.scales.y, title:{display:true,text:'Häufigkeit',color:'#555870',font:{size:11}}, ticks:{...BASE.scales.y.ticks,stepSize:1}}
        }}
    });
}

// ================================================================
//  NI CHARTS (Count + Meters + Telemarks)
// ================================================================
function buildNICharts(data, c, meters) {
    const container = getChartsContainer();

    // 1) Count over time
    const c1 = makeChartCard('Anzahl Läufe pro Einheit','Balken','ch-ni-count',false);
    container.appendChild(c1);
    drawNICount(data, c);

    // 2) Meters over time (count × meters)
    const c2 = makeChartCard('Meter pro Einheit (Läufe × '+meters+'m)','Balken','ch-ni-meters',false);
    container.appendChild(c2);
    drawNIMeters(data, c, meters);

    // 3) Monthly total runs
    const c3 = makeChartCard('Gesamt-Läufe pro Monat','Balken','ch-ni-monthly',false);
    container.appendChild(c3);
    drawNIMonthly(data, c);

    // 4) Monthly total meters
    const c4 = makeChartCard('Gesamt-Meter pro Monat','Balken','ch-ni-monthly-meters',false);
    container.appendChild(c4);
    drawNIMonthlyMeters(data, c, meters);

    // 5) Telemarks over time
    const c5 = makeChartCard('Telemarks pro Einheit','Balken','ch-ni-telemarks',false);
    container.appendChild(c5);
    drawNITelemarks(data, c);

    // 6) Monthly total telemarks
    const c6 = makeChartCard('Gesamt-Telemarks pro Monat','Balken','ch-ni-monthly-tm',false);
    container.appendChild(c6);
    drawNIMonthlyTelemarks(data, c);
}

function drawNICount(data, c) {
    const ctx = document.getElementById('ch-ni-count')?.getContext('2d');
    if(!ctx) return;
    if(!data.length) { chartInstances.niCount = emptyChart(ctx); return; }
    const labels = data.map(d=>shortDate(d.date));
    const vals = data.map(d=>d.count||0);
    const notes = data.map(d=>d.notes||'');
    chartInstances.niCount = new Chart(ctx, {
        type:'bar',
        data:{labels, datasets:[{data:vals, backgroundColor:c.bg, borderColor:c.main, borderWidth:2, borderRadius:8, hoverBackgroundColor:c.main}]},
        options:{...BASE, plugins:{...BASE.plugins, tooltip:{...BASE.plugins.tooltip,
            callbacks:{label:t=>t.parsed.y+' Läufe', afterBody:items=>{const n=notes[items[0]?.dataIndex]; return n?'📝 '+n:'';}}
        }}, scales:{...BASE.scales, y:{...BASE.scales.y, ticks:{...BASE.scales.y.ticks,stepSize:1}, title:{display:true,text:'Anzahl',color:'#555870',font:{size:11}}}}}
    });
}

function drawNIMeters(data, c, meters) {
    const ctx = document.getElementById('ch-ni-meters')?.getContext('2d');
    if(!ctx) return;
    if(!data.length) { chartInstances.niMeters = emptyChart(ctx); return; }
    const labels = data.map(d=>shortDate(d.date));
    const vals = data.map(d=>(d.count||0)*meters);
    const notes = data.map(d=>d.notes||'');
    chartInstances.niMeters = new Chart(ctx, {
        type:'bar',
        data:{labels, datasets:[{data:vals, backgroundColor:'rgba(96,165,250,0.18)', borderColor:'#60A5FA', borderWidth:2, borderRadius:8, hoverBackgroundColor:'#60A5FA'}]},
        options:{...BASE, plugins:{...BASE.plugins, tooltip:{...BASE.plugins.tooltip,
            callbacks:{label:t=>t.parsed.y.toLocaleString('de-DE')+'m', afterBody:items=>{const n=notes[items[0]?.dataIndex]; return n?'📝 '+n:'';}}
        }}, scales:{...BASE.scales, y:{...BASE.scales.y, title:{display:true,text:'Meter',color:'#555870',font:{size:11}}}}}
    });
}

function drawNIMonthly(data, c) {
    const ctx = document.getElementById('ch-ni-monthly')?.getContext('2d');
    if(!ctx) return;
    if(!data.length) { chartInstances.niMonthly = emptyChart(ctx); return; }
    const g = groupByMonth(data);
    const labels = Object.keys(g);
    const totals = labels.map(k => g[k].reduce((s,d)=>s+(d.count||0),0));
    chartInstances.niMonthly = new Chart(ctx, {
        type:'bar',
        data:{labels:labels.map(prettyMonth), datasets:[{data:totals, backgroundColor:c.bg, borderColor:c.main, borderWidth:2, borderRadius:8}]},
        options:{...BASE, scales:{...BASE.scales, y:{...BASE.scales.y, ticks:{...BASE.scales.y.ticks,stepSize:1}, title:{display:true,text:'Gesamtläufe',color:'#555870',font:{size:11}}}}}
    });
}

function drawNIMonthlyMeters(data, c, meters) {
    const ctx = document.getElementById('ch-ni-monthly-meters')?.getContext('2d');
    if(!ctx) return;
    if(!data.length) { chartInstances.niMonthlyMeters = emptyChart(ctx); return; }
    const g = groupByMonth(data);
    const labels = Object.keys(g);
    const totals = labels.map(k => g[k].reduce((s,d)=>s+(d.count||0)*meters,0));
    chartInstances.niMonthlyMeters = new Chart(ctx, {
        type:'bar',
        data:{labels:labels.map(prettyMonth), datasets:[{data:totals, backgroundColor:'rgba(96,165,250,0.18)', borderColor:'#60A5FA', borderWidth:2, borderRadius:8}]},
        options:{...BASE, scales:{...BASE.scales, y:{...BASE.scales.y, title:{display:true,text:'Meter',color:'#555870',font:{size:11}}}}}
    });
}

function drawNITelemarks(data, c) {
    const ctx = document.getElementById('ch-ni-telemarks')?.getContext('2d');
    if(!ctx) return;
    if(!data.length) { chartInstances.niTelemarks = emptyChart(ctx); return; }
    const labels = data.map(d=>shortDate(d.date));
    const vals = data.map(d=>d.telemarks||0);
    const notes = data.map(d=>d.notes||'');
    chartInstances.niTelemarks = new Chart(ctx, {
        type:'bar',
        data:{labels, datasets:[{data:vals, backgroundColor:'rgba(251,191,36,0.18)', borderColor:'#FBBF24', borderWidth:2, borderRadius:8, hoverBackgroundColor:'#FBBF24'}]},
        options:{...BASE, plugins:{...BASE.plugins, tooltip:{...BASE.plugins.tooltip,
            callbacks:{label:t=>t.parsed.y+' Telemarks', afterBody:items=>{const n=notes[items[0]?.dataIndex]; return n?'📝 '+n:'';}}
        }}, scales:{...BASE.scales, y:{...BASE.scales.y, ticks:{...BASE.scales.y.ticks,stepSize:1}, title:{display:true,text:'Telemarks',color:'#555870',font:{size:11}}}}}
    });
}

function drawNIMonthlyTelemarks(data, c) {
    const ctx = document.getElementById('ch-ni-monthly-tm')?.getContext('2d');
    if(!ctx) return;
    if(!data.length) { chartInstances.niMonthlyTm = emptyChart(ctx); return; }
    const g = groupByMonth(data);
    const labels = Object.keys(g);
    const totals = labels.map(k => g[k].reduce((s,d)=>s+(d.telemarks||0),0));
    chartInstances.niMonthlyTm = new Chart(ctx, {
        type:'bar',
        data:{labels:labels.map(prettyMonth), datasets:[{data:totals, backgroundColor:'rgba(251,191,36,0.18)', borderColor:'#FBBF24', borderWidth:2, borderRadius:8}]},
        options:{...BASE, scales:{...BASE.scales, y:{...BASE.scales.y, ticks:{...BASE.scales.y.ticks,stepSize:1}, title:{display:true,text:'Telemarks',color:'#555870',font:{size:11}}}}}
    });
}

// ================================================================
//  PB TABLE
// ================================================================
function drawPBTable(data) {
    const container = document.getElementById('pb-table-container');
    if(!data.length) { container.innerHTML='<p class="empty-chart-msg">Keine Daten vorhanden.</p>'; return; }
    const runs=[];
    data.forEach(d=>d.times.forEach(t=>runs.push({time:t,date:d.date,notes:d.notes||''})));
    runs.sort((a,b)=>a.time-b.time);
    const top=runs.slice(0,10);
    container.innerHTML=`<table class="pb-table">
        <thead><tr><th>#</th><th>Zeit</th><th>Datum</th><th>Notiz</th></tr></thead>
        <tbody>${top.map((r,i)=>{
            const cls=i===0?'gold':i===1?'silver':i===2?'bronze':'normal';
            return `<tr><td><span class="pb-rank ${cls}">${i+1}</span></td>
                <td class="pb-time">${r.time.toFixed(2)}s</td>
                <td>${fmtDate(r.date)}</td>
                <td style="font-size:12px;color:#8B8FA7;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(r.notes)}</td></tr>`;
        }).join('')}</tbody></table>`;
}

// ================================================================
//  HELPERS
// ================================================================
function shortDate(d) { return new Date(d+'T00:00:00').toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'}); }
function groupByMonth(data) {
    const m={}; data.forEach(d=>{const k=d.date.slice(0,7); if(!m[k])m[k]=[]; m[k].push(d);}); return m;
}
function prettyMonth(ym) { const [y,m]=ym.split('-'); return MONTH_NAMES[parseInt(m,10)-1]+' '+y.slice(2); }
function emptyChart(ctx) {
    return new Chart(ctx,{type:'bar',data:{labels:['Keine Daten'],datasets:[{data:[0],backgroundColor:'rgba(255,255,255,0.03)'}]},
        options:{...BASE,scales:{x:{display:false},y:{display:false}}}});
}

// ================================================================
//  COACH DASHBOARD
// ================================================================
let coachChartInstances = {};

function destroyCoachCharts() {
    Object.keys(coachChartInstances).forEach(k => { if(coachChartInstances[k]){coachChartInstances[k].destroy();coachChartInstances[k]=null;} });
}

async function loadCoachDashboard() {
    // Get all users except micky
    await syncUsers();
    const users = getUsers().filter(u => u !== MASTER_NAME);

    // Load all user data from Firestore
    const allData = {};
    for (const u of users) {
        try {
            const doc = await db.collection('users').doc(u).get();
            allData[u] = doc.exists ? (doc.data().entries || []) : [];
        } catch(e) { allData[u] = []; }
    }

    renderCoachRanking(users, allData);
    populateCoachUserSelect(users);
    populatePlanUserSelect(users);

    const coachUserSelect = document.getElementById('coach-user-select');
    coachUserSelect.addEventListener('change', () => {
        const sel = coachUserSelect.value;
        if (sel && allData[sel]) renderCoachUserStats(sel, allData[sel]);
        else { document.getElementById('coach-stats-container').innerHTML = ''; document.getElementById('coach-charts-container').innerHTML = ''; destroyCoachCharts(); }
    });
}

function populateCoachUserSelect(users) {
    const sel = document.getElementById('coach-user-select');
    sel.innerHTML = '<option value="">-- Bitte wählen --</option>' +
        users.map(u => `<option value="${escapeHtml(u)}">${escapeHtml(u.charAt(0).toUpperCase() + u.slice(1))}</option>`).join('');
}

function renderCoachRanking(users, allData) {
    const container = document.getElementById('coach-ranking');
    if (!users.length) { container.innerHTML = '<p class="empty-chart-msg">Keine Athleten vorhanden.</p>'; return; }

    const season = getCurrentSeason();

    // Calculate stats per user
    const stats = users.map(u => {
        const entries = allData[u] || [];
        const seasonEntries = entries.filter(d => d.date >= season.start && d.date <= season.end);
        const total = entries.length;
        const seasonTotal = seasonEntries.length;

        // Avg per week (season)
        let avgWeek = 0;
        if (seasonTotal > 0) {
            const seasonStart = new Date(season.start + 'T00:00:00');
            const now = new Date();
            const diffWeeks = Math.max(1, Math.ceil((now - seasonStart) / (7 * 86400000)));
            avgWeek = seasonTotal / diffWeeks;
        }

        return { name: u, total, seasonTotal, avgWeek };
    });

    // Sort by total (absolute)
    const byTotal = [...stats].sort((a, b) => b.total - a.total);
    // Sort by avg per week
    const byAvg = [...stats].sort((a, b) => b.avgWeek - a.avgWeek);

    container.innerHTML = `
        <div class="coach-ranking-section">
            <h3>Einheiten Gesamt</h3>
            <div class="coach-ranking-list">
                ${byTotal.map((s, i) => `<div class="coach-rank-row">
                    <span class="pb-rank ${i===0?'gold':i===1?'silver':i===2?'bronze':'normal'}">${i+1}</span>
                    <span class="coach-rank-name">${escapeHtml(s.name.charAt(0).toUpperCase() + s.name.slice(1))}</span>
                    <span class="coach-rank-value">${s.total}</span>
                </div>`).join('')}
            </div>
        </div>
        <div class="coach-ranking-section" style="margin-top:16px">
            <h3>Ø Einheiten pro Woche (Saison ${escapeHtml(season.label)})</h3>
            <div class="coach-ranking-list">
                ${byAvg.map((s, i) => `<div class="coach-rank-row">
                    <span class="pb-rank ${i===0?'gold':i===1?'silver':i===2?'bronze':'normal'}">${i+1}</span>
                    <span class="coach-rank-name">${escapeHtml(s.name.charAt(0).toUpperCase() + s.name.slice(1))}</span>
                    <span class="coach-rank-value">${s.avgWeek.toFixed(1)}</span>
                </div>`).join('')}
            </div>
        </div>
        <div class="coach-ranking-section" style="margin-top:16px">
            <h3>Einheiten Saison (${escapeHtml(season.label)})</h3>
            <div class="coach-ranking-list">
                ${[...stats].sort((a,b) => b.seasonTotal - a.seasonTotal).map((s, i) => `<div class="coach-rank-row">
                    <span class="pb-rank ${i===0?'gold':i===1?'silver':i===2?'bronze':'normal'}">${i+1}</span>
                    <span class="coach-rank-name">${escapeHtml(s.name.charAt(0).toUpperCase() + s.name.slice(1))}</span>
                    <span class="coach-rank-value">${s.seasonTotal}</span>
                </div>`).join('')}
            </div>
        </div>`;
}

function renderCoachUserStats(userName, entries) {
    destroyCoachCharts();
    const statsContainer = document.getElementById('coach-stats-container');
    const chartsContainer = document.getElementById('coach-charts-container');
    chartsContainer.innerHTML = '';

    if (!entries.length) {
        statsContainer.innerHTML = '<div class="card"><p class="empty-chart-msg">Keine Einträge vorhanden.</p></div>';
        return;
    }

    const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);
    const season = getCurrentSeason();
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const seasonData = sorted.filter(d => d.date >= season.start && d.date <= season.end);

    // Overall stats
    const total = entries.length;
    const seasonTotal = seasonData.length;
    let avgWeek = '--';
    if (seasonTotal > 0) {
        const diffWeeks = Math.max(1, Math.ceil((new Date() - new Date(season.start + 'T00:00:00')) / (7 * 86400000)));
        avgWeek = (seasonTotal / diffWeeks).toFixed(1);
    }

    // Type breakdown
    const types = {};
    entries.forEach(d => { types[d.type] = (types[d.type] || 0) + 1; });
    const typeStr = Object.entries(types).map(([k, v]) => `${k}: ${v}`).join(' · ');

    // Last session
    const lastEntry = [...entries].sort((a, b) => b.date.localeCompare(a.date))[0];
    const lastDate = lastEntry ? fmtDate(lastEntry.date) : '--';

    // Sprint PB
    const sprintEntries = entries.filter(d => d.type === 'Sprint (50m)' && d.times && d.times.length);
    const sprintPB = sprintEntries.length ? Math.min(...sprintEntries.flatMap(d => d.times)).toFixed(2) + 's' : '--';

    // Kraft stats
    const kraftEntries = entries.filter(d => d.type === 'Kraft');
    let maxKB = '--';
    kraftEntries.forEach(d => {
        const kb = d.exercises?.kniebeugen;
        if (!kb) return;
        if (kb.pyramid) kb.pyramid.forEach(s => { if (s.kg && (maxKB === '--' || s.kg > parseFloat(maxKB))) maxKB = s.kg + 'kg'; });
        else if (kb.kg && (maxKB === '--' || kb.kg > parseFloat(maxKB))) maxKB = kb.kg + 'kg';
    });

    statsContainer.innerHTML = `
        <div class="card">
            <div class="card-header"><h2>${escapeHtml(displayName)}</h2></div>
            <div class="stats-row">
                <div class="stat-card accent-purple">
                    <span class="stat-icon">🏃</span>
                    <span class="stat-value">${total}</span>
                    <span class="stat-label">Gesamt</span>
                </div>
                <div class="stat-card accent-teal">
                    <span class="stat-icon">📅</span>
                    <span class="stat-value">${seasonTotal}</span>
                    <span class="stat-label">Saison</span>
                </div>
                <div class="stat-card accent-gold">
                    <span class="stat-icon">📆</span>
                    <span class="stat-value">${avgWeek}</span>
                    <span class="stat-label">Ø/Woche</span>
                </div>
                <div class="stat-card accent-blue">
                    <span class="stat-icon">⏱️</span>
                    <span class="stat-value">${escapeHtml(sprintPB)}</span>
                    <span class="stat-label">Sprint PB</span>
                </div>
                <div class="stat-card accent-green">
                    <span class="stat-icon">🏋️</span>
                    <span class="stat-value">${escapeHtml(maxKB)}</span>
                    <span class="stat-label">Max KB (kg)</span>
                </div>
                <div class="stat-card accent-red">
                    <span class="stat-icon">📋</span>
                    <span class="stat-value">${escapeHtml(lastDate)}</span>
                    <span class="stat-label">Letzte Einheit</span>
                </div>
            </div>
            <p style="font-size:12px;color:var(--text-tertiary);margin-top:4px">${escapeHtml(typeStr)}</p>
        </div>`;

    // Charts
    const cPurple = {main:'#B4A8FF', bg:'rgba(180,168,255,0.18)', g1:'rgba(180,168,255,0.35)', g2:'rgba(180,168,255,0.02)'};
    const cTeal = {main:'#22D3C5', bg:'rgba(34,211,197,0.18)', g1:'rgba(34,211,197,0.35)', g2:'rgba(34,211,197,0.02)'};

    // Monthly sessions
    if (seasonData.length) {
        const c1 = makeChartCard(displayName + ' – Einheiten/Monat (Saison)', 'Balken', 'ch-coach-monthly', false);
        chartsContainer.appendChild(c1);
        const ctx1 = document.getElementById('ch-coach-monthly')?.getContext('2d');
        if (ctx1) {
            const g = groupByMonth(seasonData);
            const labels = Object.keys(g);
            coachChartInstances.coachMonthly = new Chart(ctx1, {
                type:'bar',
                data:{labels:labels.map(prettyMonth), datasets:[{data:labels.map(k=>g[k].length), backgroundColor:cPurple.bg, borderColor:cPurple.main, borderWidth:2, borderRadius:8, hoverBackgroundColor:cPurple.main}]},
                options:{...BASE, scales:{...BASE.scales, y:{...BASE.scales.y, ticks:{...BASE.scales.y.ticks,stepSize:1}, title:{display:true,text:'Einheiten',color:'#555870',font:{size:11}}}}}
            });
        }
    }

    // Type distribution pie
    if (seasonData.length) {
        const c2 = makeChartCard(displayName + ' – Trainingsverteilung (Saison)', 'Kreis', 'ch-coach-types', false);
        chartsContainer.appendChild(c2);
        const ctx2 = document.getElementById('ch-coach-types')?.getContext('2d');
        if (ctx2) {
            const tMap = {};
            seasonData.forEach(d => { tMap[d.type] = (tMap[d.type] || 0) + 1; });
            const tLabels = Object.keys(tMap);
            const tValues = Object.values(tMap);
            const tColors = tLabels.map(l => (COLORS[l] || {main:'#8B8FA7'}).main);
            coachChartInstances.coachTypes = new Chart(ctx2, {
                type:'doughnut',
                data:{labels:tLabels, datasets:[{data:tValues, backgroundColor:tColors, borderColor:'#12141C', borderWidth:3}]},
                options:{responsive:true, maintainAspectRatio:false, animation:{duration:400},
                    plugins:{legend:{display:true,position:'bottom',labels:{color:'#8B8FA7',font:{size:12,family:'Inter'},padding:16}},
                        tooltip:{...BASE.plugins.tooltip, callbacks:{label:t=>t.label+': '+t.parsed}}}}
            });
        }
    }

    // Sprint best time trend
    const sprintSorted = sprintEntries.sort((a,b) => a.date.localeCompare(b.date));
    if (sprintSorted.length >= 2) {
        const c3 = makeChartCard(displayName + ' – Sprint Bestzeit Trend', 'Linie', 'ch-coach-sprint', false);
        chartsContainer.appendChild(c3);
        const ctx3 = document.getElementById('ch-coach-sprint')?.getContext('2d');
        if (ctx3) {
            const labels = sprintSorted.map(d => shortDate(d.date));
            const vals = sprintSorted.map(d => Math.min(...d.times));
            coachChartInstances.coachSprint = new Chart(ctx3, {
                type:'line',
                data:{labels, datasets:[{data:vals, borderColor:cTeal.main, backgroundColor:grad(ctx3, cTeal),
                    borderWidth:2.5, pointBackgroundColor:cTeal.main, pointRadius:4, fill:true, tension:0.35}]},
                options:{...BASE, plugins:{...BASE.plugins, tooltip:{...BASE.plugins.tooltip,
                    callbacks:{label:t=>t.parsed.y.toFixed(2)+'s'}
                }}, scales:{...BASE.scales, y:{...BASE.scales.y, title:{display:true,text:'Sekunden',color:'#555870',font:{size:11}}}}}
            });
        }
    }

    // KB progression
    const kbEntries = kraftEntries.filter(d => {
        const kb = d.exercises?.kniebeugen;
        return kb && (kb.kg || (kb.pyramid && kb.pyramid.length));
    }).sort((a,b) => a.date.localeCompare(b.date));
    if (kbEntries.length >= 2) {
        const c4 = makeChartCard(displayName + ' – Kniebeugen Max kg', 'Linie', 'ch-coach-kb', false);
        chartsContainer.appendChild(c4);
        const ctx4 = document.getElementById('ch-coach-kb')?.getContext('2d');
        if (ctx4) {
            const labels = kbEntries.map(d => shortDate(d.date));
            const vals = kbEntries.map(d => {
                const kb = d.exercises.kniebeugen;
                if (kb.pyramid && kb.pyramid.length) return Math.max(...kb.pyramid.map(s => s.kg));
                return kb.kg || 0;
            });
            const cGold = {main:'#FBBF24', bg:'rgba(251,191,36,0.18)', g1:'rgba(251,191,36,0.35)', g2:'rgba(251,191,36,0.02)'};
            coachChartInstances.coachKb = new Chart(ctx4, {
                type:'line',
                data:{labels, datasets:[{data:vals, borderColor:cGold.main, backgroundColor:grad(ctx4, cGold),
                    borderWidth:2.5, pointBackgroundColor:cGold.main, pointRadius:4, fill:true, tension:0.35}]},
                options:{...BASE, plugins:{...BASE.plugins, tooltip:{...BASE.plugins.tooltip,
                    callbacks:{label:t=>t.parsed.y+'kg'}
                }}, scales:{...BASE.scales, y:{...BASE.scales.y, title:{display:true,text:'Kilogramm',color:'#555870',font:{size:11}}}}}
            });
        }
    }
}

// ---- Init ----
renderList();

// ================================================================
//  KALENDER / WETTKÄMPFE
// ================================================================
let _competitions = [];

function competitionsKey() { return 'trainlytics_wk_' + (currentUser || '').toLowerCase().trim(); }

function loadCompetitions() {
    try { _competitions = JSON.parse(localStorage.getItem(competitionsKey())) || []; }
    catch { _competitions = []; }
    return _competitions;
}

function saveCompetitions(list) {
    _competitions = list;
    if (!currentUser) return;
    localStorage.setItem(competitionsKey(), JSON.stringify(list));
    db.collection('users').doc(currentUser.toLowerCase().trim())
      .update({ competitions: list }).catch(() => {
        db.collection('users').doc(currentUser.toLowerCase().trim())
          .set({ competitions: list }, { merge: true }).catch(() => {});
      });
}

async function loadCompetitionsFromFirestore(user) {
    try {
        const doc = await db.collection('users').doc(user.toLowerCase().trim()).get();
        if (doc.exists && doc.data().competitions) {
            _competitions = doc.data().competitions;
            localStorage.setItem(competitionsKey(), JSON.stringify(_competitions));
        } else {
            loadCompetitions();
        }
    } catch { loadCompetitions(); }
}

// ---- Competition Modal ----
const wkModal = document.getElementById('wk-modal');
const wkForm = document.getElementById('wk-form');

document.getElementById('btn-add-wk').addEventListener('click', () => {
    wkForm.reset();
    wkModal.classList.add('show');
});
document.getElementById('wk-cancel').addEventListener('click', () => { wkModal.classList.remove('show'); });
wkModal.addEventListener('click', e => { if (e.target === wkModal) wkModal.classList.remove('show'); });

wkForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('wk-name').value.trim();
    const date = document.getElementById('wk-date').value;
    const time = document.getElementById('wk-time').value;
    const discs = [];
    wkForm.querySelectorAll('.wk-disciplines input:checked').forEach(cb => discs.push(cb.value));

    if (!name || !date || !time) { showToast('Bitte alle Felder ausfüllen'); return; }
    if (!discs.length) { showToast('Bitte mindestens eine Disziplin wählen'); return; }

    const list = loadCompetitions();
    list.push({ id: generateId(), name, date, time, disciplines: discs });
    list.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    saveCompetitions(list);
    wkModal.classList.remove('show');
    showToast('Wettkampf gespeichert ✓');
    renderCalendar();
});

// ---- Delete Competition ----
let wkDelTarget = null;
function deleteCompetition(id) {
    const list = loadCompetitions().filter(w => w.id !== id);
    saveCompetitions(list);
    renderCalendar();
    showToast('Wettkampf gelöscht');
}

// ---- Calendar Rendering ----
function renderCalendar() {
    const season = getCurrentSeason();
    document.getElementById('cal-season-label').textContent = 'Saison ' + season.label;

    const trainings = loadData();
    const competitions = loadCompetitions();
    const today = new Date().toISOString().split('T')[0];

    // Build sets for quick lookup
    const trainingDays = new Set(trainings.map(t => t.date));
    const wkDays = {};
    competitions.forEach(w => {
        if (!wkDays[w.date]) wkDays[w.date] = [];
        wkDays[w.date].push(w);
    });

    // Countdown to next competition
    const upcoming = competitions.filter(w => w.date >= today).sort((a, b) => a.date.localeCompare(b.date));
    const countdownEl = document.getElementById('wk-countdown');
    if (upcoming.length) {
        const next = upcoming[0];
        const daysLeft = Math.ceil((new Date(next.date + 'T00:00:00') - new Date(today + 'T00:00:00')) / 86400000);
        const daysText = daysLeft === 0 ? 'Heute!' : daysLeft === 1 ? 'Morgen!' : 'Noch ' + daysLeft + ' Tage';
        countdownEl.innerHTML = `
            <div class="countdown-name">${escapeHtml(next.name)}</div>
            <div class="countdown-days">${daysText}</div>
            <div class="countdown-date">${escapeHtml(fmtDate(next.date))} · ${escapeHtml(next.time)} Uhr</div>
            <div class="countdown-discs">${next.disciplines.map(d => '<span class="wk-disc-tag">' + escapeHtml(d) + '</span>').join('')}</div>`;
    } else {
        countdownEl.innerHTML = '<span class="countdown-none">Kein Wettkampf geplant</span>';
    }

    // Build month grid (Sep to Aug)
    const calGrid = document.getElementById('cal-grid');
    calGrid.innerHTML = '';
    const startYear = parseInt(season.label.split('/')[0], 10);
    const months = [];
    for (let m = 8; m < 12; m++) months.push({ year: startYear, month: m });
    for (let m = 0; m < 8; m++) months.push({ year: startYear + 1, month: m });

    const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

    months.forEach(({ year, month }) => {
        const monthEl = document.createElement('div');
        monthEl.className = 'cal-month';
        const mLabel = MONTH_NAMES[month] + ' ' + year;
        let html = '<div class="cal-month-label">' + mLabel + '</div>';
        html += '<div class="cal-days-header">' + dayNames.map(d => '<span>' + d + '</span>').join('') + '</div>';
        html += '<div class="cal-days">';

        const firstDay = new Date(year, month, 1);
        let startDow = firstDay.getDay(); // 0=Sun
        startDow = startDow === 0 ? 6 : startDow - 1; // convert to Mon=0

        // Empty cells before first day
        for (let i = 0; i < startDow; i++) html += '<span class="cal-day empty"></span>';

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
            const isToday = dateStr === today;
            const hasTrain = trainingDays.has(dateStr);
            const hasWk = wkDays[dateStr];
            let cls = 'cal-day';
            if (isToday) cls += ' today';
            if (hasTrain) cls += ' trained';
            if (hasWk) cls += ' wk';
            const tooltip = [];
            if (hasTrain) tooltip.push('🏃 Training');
            if (hasWk) tooltip.push('🏆 ' + hasWk.map(w => w.name).join(', '));
            html += '<span class="' + cls + '"' + (tooltip.length ? ' title="' + escapeHtml(tooltip.join(' | ')) + '"' : '') + '>' + d + '</span>';
        }
        html += '</div>';
        monthEl.innerHTML = html;
        calGrid.appendChild(monthEl);
    });

    // Competition list
    const wkListEl = document.getElementById('wk-list');
    if (!competitions.length) {
        wkListEl.innerHTML = '<div class="empty-state"><p>Noch keine Wettkämpfe eingetragen.</p></div>';
    } else {
        wkListEl.innerHTML = competitions.sort((a, b) => a.date.localeCompare(b.date)).map(w => {
            const isPast = w.date < today;
            return `<div class="wk-entry ${isPast ? 'wk-past' : ''}">
                <div class="wk-entry-header">
                    <div>
                        <div class="wk-entry-name">${escapeHtml(w.name)}</div>
                        <div class="wk-entry-date">${escapeHtml(fmtDate(w.date))} · ${escapeHtml(w.time)} Uhr</div>
                    </div>
                    <button class="btn-icon btn-del wk-del-btn" data-wkid="${escapeHtml(w.id)}" title="Löschen">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    </button>
                </div>
                <div class="wk-entry-discs">${w.disciplines.map(d => '<span class="wk-disc-tag">' + escapeHtml(d) + '</span>').join('')}</div>
            </div>`;
        }).join('');
        wkListEl.querySelectorAll('.wk-del-btn').forEach(b => {
            b.addEventListener('click', () => deleteCompetition(b.dataset.wkid));
        });
    }
}

// ================================================================
//  SCHMERZTAGEBUCH (INJURY DIARY)
// ================================================================
let _injuries = [];

function injuriesKey() { return 'trainlytics_injuries_' + (currentUser || '').toLowerCase().trim(); }

function loadInjuries() {
    try { _injuries = JSON.parse(localStorage.getItem(injuriesKey())) || []; }
    catch { _injuries = []; }
    return _injuries;
}

function saveInjuries(list) {
    _injuries = list;
    if (!currentUser) return;
    localStorage.setItem(injuriesKey(), JSON.stringify(list));
    db.collection('users').doc(currentUser.toLowerCase().trim())
      .set({ injuries: list }, { merge: true }).catch(() => {});
}

async function loadInjuriesFromFirestore(user) {
    try {
        const doc = await db.collection('users').doc(user.toLowerCase().trim()).get();
        if (doc.exists && doc.data().injuries) {
            _injuries = doc.data().injuries;
            localStorage.setItem(injuriesKey(), JSON.stringify(_injuries));
        } else {
            loadInjuries();
        }
    } catch { loadInjuries(); }
}

// ---- Injury Modal ----
const injuryModal = document.getElementById('injury-modal');
const injuryForm = document.getElementById('injury-form');
const painSlider = document.getElementById('injury-pain');
const painVal = document.getElementById('injury-pain-val');

painSlider.addEventListener('input', () => { painVal.textContent = painSlider.value; });

// Side toggle
let injurySide = 'Links';
['links', 'rechts', 'beide'].forEach(s => {
    const btn = document.getElementById('injury-side-' + s);
    btn.addEventListener('click', () => {
        document.querySelectorAll('#injury-form .toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        injurySide = s.charAt(0).toUpperCase() + s.slice(1);
    });
});

document.getElementById('btn-add-injury').addEventListener('click', () => {
    injuryForm.reset();
    painSlider.value = 5;
    painVal.textContent = '5';
    injurySide = 'Links';
    document.querySelectorAll('#injury-form .toggle-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('injury-side-links').classList.add('active');
    const now = new Date();
    document.getElementById('injury-date').value = now.toISOString().split('T')[0];
    injuryModal.classList.add('show');
});

document.getElementById('injury-cancel').addEventListener('click', () => { injuryModal.classList.remove('show'); });
injuryModal.addEventListener('click', e => { if (e.target === injuryModal) injuryModal.classList.remove('show'); });

injuryForm.addEventListener('submit', e => {
    e.preventDefault();
    const date = document.getElementById('injury-date').value;
    const bodypart = document.getElementById('injury-bodypart').value;
    const pain = parseInt(painSlider.value, 10);
    const notes = document.getElementById('injury-notes').value.trim();

    if (!date || !bodypart) { showToast('Bitte Datum und Körperteil angeben'); return; }

    const list = loadInjuries();
    list.push({ id: generateId(), date, bodypart, side: injurySide, pain, notes });
    list.sort((a, b) => b.date.localeCompare(a.date));
    saveInjuries(list);
    injuryModal.classList.remove('show');
    showToast('Eintrag gespeichert ✓');
    renderInjuryList();
});

function painColor(level) {
    if (level <= 3) return '#34D399';
    if (level <= 6) return '#FBBF24';
    return '#F87171';
}

function renderInjuryList() {
    const list = loadInjuries();
    const el = document.getElementById('injury-list');
    const statsCard = document.getElementById('injury-stats-card');

    if (!list.length) {
        el.innerHTML = '<div class="empty-state"><p>Noch keine Einträge vorhanden.</p></div>';
        statsCard.style.display = 'none';
        return;
    }

    el.innerHTML = list.map(inj => `
        <div class="injury-entry">
            <div class="injury-entry-header">
                <div class="injury-entry-info">
                    <span class="injury-bodypart">${escapeHtml(inj.bodypart)}</span>
                    <span class="injury-side-tag">${escapeHtml(inj.side)}</span>
                    <span class="injury-pain-badge" style="background:${painColor(inj.pain)}20;color:${painColor(inj.pain)}">${inj.pain}/10</span>
                </div>
                <button class="btn-icon btn-del injury-del-btn" data-injid="${escapeHtml(inj.id)}" title="Löschen">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                </button>
            </div>
            <div class="injury-date">${escapeHtml(fmtDate(inj.date))}</div>
            ${inj.notes ? '<div class="injury-notes">' + escapeHtml(inj.notes) + '</div>' : ''}
            <div class="injury-pain-bar"><div class="injury-pain-fill" style="width:${inj.pain * 10}%;background:${painColor(inj.pain)}"></div></div>
        </div>`).join('');

    el.querySelectorAll('.injury-del-btn').forEach(b => {
        b.addEventListener('click', () => {
            const list2 = loadInjuries().filter(i => i.id !== b.dataset.injid);
            saveInjuries(list2);
            renderInjuryList();
            showToast('Eintrag gelöscht');
        });
    });

    // Stats summary
    renderInjuryStats(list);
}

function renderInjuryStats(list) {
    const statsCard = document.getElementById('injury-stats-card');
    const statsEl = document.getElementById('injury-stats');
    if (list.length < 2) { statsCard.style.display = 'none'; return; }
    statsCard.style.display = '';

    // Count by body part
    const freq = {};
    list.forEach(inj => { freq[inj.bodypart] = (freq[inj.bodypart] || 0) + 1; });
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);

    // Avg pain
    const avgPain = (list.reduce((s, i) => s + i.pain, 0) / list.length).toFixed(1);

    // Most affected
    const most = sorted[0];

    statsEl.innerHTML = `
        <div class="injury-stats-grid">
            <div class="injury-stat">
                <span class="injury-stat-val">${list.length}</span>
                <span class="injury-stat-label">Einträge gesamt</span>
            </div>
            <div class="injury-stat">
                <span class="injury-stat-val" style="color:${painColor(Math.round(avgPain))}">${avgPain}</span>
                <span class="injury-stat-label">Ø Schmerzlevel</span>
            </div>
            <div class="injury-stat">
                <span class="injury-stat-val">${escapeHtml(most[0])}</span>
                <span class="injury-stat-label">Häufigste Stelle (${most[1]}×)</span>
            </div>
        </div>
        <div class="injury-freq-bars">
            ${sorted.map(([part, count]) => `
                <div class="injury-freq-row">
                    <span class="injury-freq-label">${escapeHtml(part)}</span>
                    <div class="injury-freq-bar-bg"><div class="injury-freq-bar-fill" style="width:${Math.round(count / sorted[0][1] * 100)}%"></div></div>
                    <span class="injury-freq-count">${count}</span>
                </div>`).join('')}
        </div>`;
}

// ================================================================
//  TRAININGSPLAN (COACH → ATHLETE)
// ================================================================

// Coach: Save plan for a user
document.getElementById('btn-save-plan')?.addEventListener('click', async () => {
    const userSel = document.getElementById('plan-user-select');
    const user = userSel.value;
    const weekStart = document.getElementById('plan-week').value;
    const notes = document.getElementById('plan-notes').value.trim();

    if (!user || !weekStart) { showToast('Bitte Athlet und Woche wählen'); return; }

    const days = {};
    document.querySelectorAll('#plan-days .plan-day-row').forEach(row => {
        const day = row.dataset.day;
        const val = row.querySelector('.plan-day-input').value.trim();
        if (val) days[day] = val;
    });

    if (!Object.keys(days).length) { showToast('Bitte mindestens einen Tag ausfüllen'); return; }

    const plan = { weekStart, days, notes, createdAt: new Date().toISOString() };
    const targets = user === '__alle__' ? _planUsers : [user];

    try {
        await Promise.all(targets.map(u =>
            db.collection('users').doc(u.toLowerCase().trim())
              .set({ trainingPlan: plan }, { merge: true })
        ));
        showToast(targets.length > 1 ? `Plan an ${targets.length} Athleten zugewiesen ✓` : 'Plan zugewiesen ✓');
        // Reset form
        document.querySelectorAll('#plan-days .plan-day-input').forEach(inp => { inp.value = ''; });
        document.getElementById('plan-notes').value = '';
    } catch(e) {
        showToast('Fehler beim Speichern');
    }
});

// Populate plan user select alongside coach user select
let _planUsers = [];
function populatePlanUserSelect(users) {
    _planUsers = users;
    const sel = document.getElementById('plan-user-select');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Bitte wählen --</option>' +
        '<option value="__alle__">📢 Alle Athleten</option>' +
        users.map(u => `<option value="${escapeHtml(u)}">${escapeHtml(u.charAt(0).toUpperCase() + u.slice(1))}</option>`).join('');
}

// Athlete: Load and display assigned plan
async function loadAndShowPlan() {
    if (!currentUser) return;
    const planCard = document.getElementById('plan-card');
    const planDisplay = document.getElementById('plan-display');

    try {
        const doc = await db.collection('users').doc(currentUser.toLowerCase().trim()).get();
        if (doc.exists && doc.data().trainingPlan) {
            const plan = doc.data().trainingPlan;
            planCard.style.display = '';
            const dayOrder = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
            const dayShort = { Montag: 'Mo', Dienstag: 'Di', Mittwoch: 'Mi', Donnerstag: 'Do', Freitag: 'Fr', Samstag: 'Sa', Sonntag: 'So' };

            planDisplay.innerHTML = `
                <div class="plan-week-label">Woche ab ${escapeHtml(fmtDate(plan.weekStart))}</div>
                <div class="plan-grid">
                    ${dayOrder.map(day => {
                        const val = plan.days[day];
                        if (!val) return '';
                        return `<div class="plan-grid-day">
                            <span class="plan-grid-day-label">${dayShort[day]}</span>
                            <span class="plan-grid-day-val">${escapeHtml(val)}</span>
                        </div>`;
                    }).join('')}
                </div>
                ${plan.notes ? '<div class="plan-coach-notes">' + escapeHtml(plan.notes) + '</div>' : ''}`;
        } else {
            planCard.style.display = 'none';
        }
    } catch {
        planCard.style.display = 'none';
    }
}
