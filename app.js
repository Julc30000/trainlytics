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
const savedUsersEl = document.getElementById('saved-users');

function runSplash() {
    // Phase 1 runs via CSS animations (runner + data items + logo reveal)
    // After ~2.5s switch to welcome message
    setTimeout(() => {
        document.getElementById('splash-anim').style.display = 'none';
        document.getElementById('splash-msg').style.display = '';
    }, 2500);
    // After ~4.5s total, fade out splash and show login
    setTimeout(() => {
        splashScreen.classList.add('fade-out');
        loginScreen.style.display = '';
        loginScreen.classList.add('fade-in');
        setTimeout(() => { splashScreen.style.display = 'none'; }, 600);
    }, 4500);
}

// Only show splash on first visit per session
if (!sessionStorage.getItem('trainlytics_splashed')) {
    sessionStorage.setItem('trainlytics_splashed', '1');
    runSplash();
} else {
    splashScreen.style.display = 'none';
    loginScreen.style.display = '';
}

function renderSavedUsers() {
    const users = getUsers();
    if (!users.length) { savedUsersEl.innerHTML = ''; return; }
    savedUsersEl.innerHTML = `
        <p class="saved-users-title">Schnellzugang</p>
        ${users.map(u => `<button type="button" class="user-chip" data-user="${escapeHtml(u)}">
            <span class="user-chip-icon">${escapeHtml(u.charAt(0).toUpperCase())}</span>
            ${escapeHtml(u.charAt(0).toUpperCase() + u.slice(1))}
        </button>`).join('')}`;
    savedUsersEl.querySelectorAll('.user-chip').forEach(c =>
        c.addEventListener('click', () => loginAs(c.dataset.user)));
}

async function loginAs(name) {
    const clean = name.trim();
    if (!clean) return;
    currentUser = clean;
    addUser(clean);
    loginScreen.style.display = 'none';
    appEl.style.display = '';
    document.getElementById('user-greeting').textContent = 'Hallo, ' + clean.charAt(0).toUpperCase() + clean.slice(1) + '!';
    await loadFromFirestore(clean);
    startListener(clean);
    renderList();
}

loginForm.addEventListener('submit', e => { e.preventDefault(); loginAs(loginNameInput.value); });

document.getElementById('btn-logout').addEventListener('click', () => {
    if (_unsubscribe) { _unsubscribe(); _unsubscribe = null; }
    currentUser = null;
    _cachedEntries = [];
    loginScreen.style.display = '';
    loginScreen.classList.remove('fade-in');
    appEl.style.display = 'none';
    loginNameInput.value = '';
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
    intensityGroup.style.display = isTempo ? '' : 'none';
    document.getElementById('kraft-container').style.display = isKraft ? '' : 'none';
    if (isKraft) {
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
    const intensity = isTempo ? trainingIntensity.value : '';
    const isCountMode = intensity === 'NI';

    if (isTempo && !intensity) { showToast('Bitte Intensität wählen'); return; }

    let times = [];
    let count = null;
    let telemarks = null;
    let exercises = null;

    if (isKraft) {
        exercises = {};
        let anyChecked = false;
        KRAFT_EXERCISES.forEach(ex => {
            const cb = document.getElementById('kraft-' + ex);
            if (cb && cb.checked) {
                anyChecked = true;
                const exData = { done: true };
                const kgEl = document.getElementById('kraft-' + ex + '-kg');
                const repsEl = document.getElementById('kraft-' + ex + '-reps');
                if (kgEl && kgEl.value) exData.kg = parseFloat(kgEl.value);
                if (repsEl && repsEl.value) exData.reps = parseInt(repsEl.value, 10);
                exercises[ex] = exData;
            }
        });
        if (!anyChecked) { showToast('Bitte mindestens eine Übung abhaken'); return; }
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

    const entry = { id: generateId(), date, time, type, intensity, times, count, telemarks, exercises, notes };
    const data = loadData();
    data.unshift(entry);
    saveData(data);

    form.reset();
    setDefaults();
    intensityGroup.style.display = 'none';
    telemarkContainer.style.display = 'none';
    telemarkYes.classList.add('active');
    telemarkNo.classList.remove('active');
    telemarkCountGroup.style.display = '';
    document.getElementById('kraft-container').style.display = 'none';
    KRAFT_EXERCISES.forEach(ex => {
        const det = document.getElementById('kraft-' + ex + '-details');
        if (det) det.style.display = 'none';
    });
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
    return 'tempo150';
}

function fmtDate(d) {
    return new Date(d+'T00:00:00').toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'});
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
                    if (v.kg) detail += v.kg + 'kg';
                    if (v.reps) detail += (detail ? ' × ' : '') + v.reps + ' Wdh';
                    return `<span class="kraft-chip">${escapeHtml(label)}${detail ? ` <span class="kraft-chip-detail">${escapeHtml(detail)}</span>` : ''}</span>`;
                  }).join('')}</div>`
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
    const isTempo = type.startsWith('Tempolauf');
    analyticsIntGroup.style.display = (isTempo && !isGeneral && !isKraft) ? '' : 'none';

    // Show/hide stats rows
    document.getElementById('stats-row-general').style.display = isGeneral ? '' : 'none';
    document.getElementById('stats-row').style.display = (isGeneral || isKraft) ? 'none' : '';
    document.getElementById('stats-row-ni').style.display = 'none';
    document.getElementById('stats-row-kraft').style.display = isKraft ? '' : 'none';
    document.getElementById('pb-card').style.display = (isGeneral || isKraft) ? 'none' : '';

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

    // Max Kniebeugen kg
    const kbKgs = data.filter(d => d.exercises?.kniebeugen?.kg).map(d => d.exercises.kniebeugen.kg);
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

    // 3) Kniebeugen kg progression
    const kbData = data.filter(d => d.exercises?.kniebeugen?.kg);
    if (kbData.length) {
        const c3 = makeChartCard('Kniebeugen – Gewicht (kg)','Linie','ch-kraft-kb',false);
        container.appendChild(c3);
        drawKraftProgression(kbData, 'kniebeugen', 'kb', {main:'#B4A8FF', bg:'rgba(180,168,255,0.18)', g1:'rgba(180,168,255,0.35)', g2:'rgba(180,168,255,0.02)'});
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

// ---- Init ----
renderList();
