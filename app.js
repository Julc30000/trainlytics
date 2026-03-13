/* ========================================
   Trainlytics v3 — App Logic
   ======================================== */

const MONTH_NAMES = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
const INTENSITIES = ['NI','I3','I2','I1'];

// ================================================================
//  AUTH / USER
// ================================================================
let currentUser = null;

function storageKeyFor(user) { return 'trainlytics_v3_' + user.toLowerCase().trim(); }
function usersListKey() { return 'trainlytics_v3_users'; }

function getUsers() {
    try { return JSON.parse(localStorage.getItem(usersListKey())) || []; } catch { return []; }
}
function addUser(name) {
    const users = getUsers();
    const lower = name.toLowerCase().trim();
    if (!users.includes(lower)) { users.push(lower); localStorage.setItem(usersListKey(), JSON.stringify(users)); }
}

function loadData() {
    if (!currentUser) return [];
    try { return JSON.parse(localStorage.getItem(storageKeyFor(currentUser))) || []; } catch { return []; }
}
function saveData(data) {
    if (!currentUser) return;
    localStorage.setItem(storageKeyFor(currentUser), JSON.stringify(data));
}

function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function escapeHtml(s) { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

// ---- Login Screen ----
const loginScreen = document.getElementById('login-screen');
const appEl = document.getElementById('app');
const loginForm = document.getElementById('login-form');
const loginNameInput = document.getElementById('login-name');
const savedUsersEl = document.getElementById('saved-users');

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

function loginAs(name) {
    const clean = name.trim();
    if (!clean) return;
    currentUser = clean;
    addUser(clean);
    loginScreen.style.display = 'none';
    appEl.style.display = '';
    document.getElementById('user-greeting').textContent = 'Hallo, ' + clean.charAt(0).toUpperCase() + clean.slice(1) + '!';
    renderList();
}

loginForm.addEventListener('submit', e => { e.preventDefault(); loginAs(loginNameInput.value); });

document.getElementById('btn-logout').addEventListener('click', () => {
    currentUser = null;
    loginScreen.style.display = '';
    appEl.style.display = 'none';
    loginNameInput.value = '';
    renderSavedUsers();
});

renderSavedUsers();

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
    const isTempo = trainingType.value.startsWith('Tempolauf');
    intensityGroup.style.display = isTempo ? '' : 'none';
    if (!isTempo) {
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
    if (int === 'I1' || int === 'NI') showCountMode();
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
function addTimeEntry(value = '') {
    const idx = timesList.querySelectorAll('.time-entry').length + 1;
    const e = document.createElement('div');
    e.className = 'time-entry';
    e.innerHTML = `<span class="time-index">${idx}</span>
        <input type="number" step="0.01" min="0" placeholder="z.B. 6.85" class="time-input" value="${escapeHtml(String(value))}" required>
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
    const isTempo = type.startsWith('Tempolauf');
    const intensity = isTempo ? trainingIntensity.value : '';
    const isCountMode = intensity === 'I1' || intensity === 'NI';

    if (isTempo && !intensity) { showToast('Bitte Intensität wählen'); return; }

    let times = [];
    let count = null;
    let telemarks = null;

    if (isCountMode) {
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

    const entry = { id: generateId(), date, time, type, intensity, times, count, telemarks, notes };
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
            ${en.intensity === 'I1' || en.intensity === 'NI'
                ? `<div class="entry-count">Anzahl Läufe: <strong>${en.count || 0}</strong>${en.intensity === 'NI' && en.telemarks != null ? ` · Telemarks: <strong>${en.telemarks}</strong>` : ''}</div>`
                : `<div class="entry-times">${en.times.map(t=>`<span class="time-chip">${escapeHtml(String(t))}s</span>`).join('')}</div>`
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
    const isTempo = analyticsTypeEl.value.startsWith('Tempolauf');
    analyticsIntGroup.style.display = isTempo ? '' : 'none';
    if (!isTempo) analyticsIntEl.value = 'all';
    updateAnalytics();
});
analyticsIntEl.addEventListener('change', updateAnalytics);

const chartInstances = {};
const COLORS = {
    'Sprint (50m)':       { main:'#B4A8FF', bg:'rgba(180,168,255,0.18)', g1:'rgba(180,168,255,0.35)', g2:'rgba(180,168,255,0.02)' },
    'Tempolauf (120m)':   { main:'#22D3C5', bg:'rgba(34,211,197,0.18)',  g1:'rgba(34,211,197,0.35)',  g2:'rgba(34,211,197,0.02)' },
    'Tempolauf (150m)':   { main:'#FBBF24', bg:'rgba(251,191,36,0.18)',  g1:'rgba(251,191,36,0.35)',  g2:'rgba(251,191,36,0.02)' },
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
    const isTempo = type.startsWith('Tempolauf');
    analyticsIntGroup.style.display = isTempo ? '' : 'none';

    const intFilter = isTempo ? analyticsIntEl.value : 'all';
    const isI1 = intFilter === 'I1';
    const isNI = intFilter === 'NI';

    let data = loadData().filter(d => d.type === type);
    if (intFilter !== 'all') data = data.filter(d => d.intensity === intFilter);
    data.sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

    // For "all" view, filter out count-only entries (NI/I1) for time-based charts
    const timeData = data.filter(d => d.intensity !== 'I1' && d.intensity !== 'NI');

    const c = COLORS[type];

    // Extract meters from type string (e.g. "Tempolauf (120m)" -> 120)
    const metersMatch = type.match(/\((\d+)m\)/);
    const meters = metersMatch ? parseInt(metersMatch[1], 10) : 0;

    // Show/hide stats rows
    document.getElementById('stats-row').style.display = (isI1 || isNI) ? 'none' : '';
    document.getElementById('stats-row-i1').style.display = isI1 ? '' : 'none';
    document.getElementById('stats-row-ni').style.display = isNI ? '' : 'none';
    document.getElementById('pb-card').style.display = (isI1 || isNI) ? 'none' : '';

    destroyAll();

    if (isNI) {
        updateStatsNI(data, meters);
        buildNICharts(data, c, meters);
    } else if (isI1) {
        updateStatsI1(data);
        buildI1Charts(data, c);
    } else {
        updateStats(timeData);
        buildTimeCharts(timeData, c);
        drawPBTable(timeData);
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
function updateStatsI1(data) {
    const $ = id => document.getElementById(id);
    $('stat-i1-sessions').textContent = data.length;
    const counts = data.map(d => d.count || 0);
    $('stat-i1-total').textContent = counts.reduce((a,b)=>a+b,0);
    $('stat-i1-avg-count').textContent = data.length ? (counts.reduce((a,b)=>a+b,0)/counts.length).toFixed(1) : '--';
}

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
//  I1 CHARTS (Count-based)
// ================================================================
function buildI1Charts(data, c) {
    const container = getChartsContainer();

    // 1) Count over time
    const c1 = makeChartCard('Anzahl Läufe pro Einheit','Balken','ch-i1-count',false);
    container.appendChild(c1);
    drawI1Count(data, c);

    // 2) Monthly total
    const c2 = makeChartCard('Gesamt-Läufe pro Monat','Balken','ch-i1-monthly',false);
    container.appendChild(c2);
    drawI1Monthly(data, c);

    // 3) Monthly avg count
    const c3 = makeChartCard('Ø Läufe pro Einheit (Monat)','Linie','ch-i1-monthly-avg',false);
    container.appendChild(c3);
    drawI1MonthlyAvg(data, c);
}

function drawI1Count(data, c) {
    const ctx = document.getElementById('ch-i1-count')?.getContext('2d');
    if(!ctx) return;
    if(!data.length) { chartInstances.i1Count = emptyChart(ctx); return; }
    const labels = data.map(d=>shortDate(d.date));
    const vals = data.map(d=>d.count||0);
    const notes = data.map(d=>d.notes||'');
    chartInstances.i1Count = new Chart(ctx, {
        type:'bar',
        data:{labels, datasets:[{data:vals, backgroundColor:c.bg, borderColor:c.main, borderWidth:2, borderRadius:8, hoverBackgroundColor:c.main}]},
        options:{...BASE, plugins:{...BASE.plugins, tooltip:{...BASE.plugins.tooltip,
            callbacks:{label:t=>t.parsed.y+' Läufe', afterBody:items=>{const n=notes[items[0]?.dataIndex]; return n?'📝 '+n:'';}}
        }}, scales:{...BASE.scales, y:{...BASE.scales.y, ticks:{...BASE.scales.y.ticks,stepSize:1}, title:{display:true,text:'Anzahl',color:'#555870',font:{size:11}}}}}
    });
}

function drawI1Monthly(data, c) {
    const ctx = document.getElementById('ch-i1-monthly')?.getContext('2d');
    if(!ctx) return;
    if(!data.length) { chartInstances.i1Monthly = emptyChart(ctx); return; }
    const g = groupByMonth(data);
    const labels = Object.keys(g);
    const totals = labels.map(k => g[k].reduce((s,d)=>s+(d.count||0),0));
    chartInstances.i1Monthly = new Chart(ctx, {
        type:'bar',
        data:{labels:labels.map(prettyMonth), datasets:[{data:totals, backgroundColor:c.bg, borderColor:c.main, borderWidth:2, borderRadius:8}]},
        options:{...BASE, scales:{...BASE.scales, y:{...BASE.scales.y, ticks:{...BASE.scales.y.ticks,stepSize:1}, title:{display:true,text:'Gesamtläufe',color:'#555870',font:{size:11}}}}}
    });
}

function drawI1MonthlyAvg(data, c) {
    const ctx = document.getElementById('ch-i1-monthly-avg')?.getContext('2d');
    if(!ctx) return;
    if(!data.length) { chartInstances.i1MonthAvg = emptyChart(ctx); return; }
    const g = groupByMonth(data);
    const labels = Object.keys(g);
    const avgs = labels.map(k => { const counts=g[k].map(d=>d.count||0); return counts.reduce((a,b)=>a+b,0)/counts.length; });
    chartInstances.i1MonthAvg = new Chart(ctx, {
        type:'line',
        data:{labels:labels.map(prettyMonth), datasets:[{data:avgs, borderColor:c.main, backgroundColor:grad(ctx,c),
            borderWidth:2.5, pointBackgroundColor:c.main, pointRadius:4, fill:true, tension:0.35}]},
        options:{...BASE, scales:{...BASE.scales, y:{...BASE.scales.y, title:{display:true,text:'Ø Läufe',color:'#555870',font:{size:11}}}}}
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
