/* ========================================
   TrainLytics v3 — App Logic
   ======================================== */

const MONTH_NAMES_DE = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
function MONTH_NAMES_T() { return t('months'); }
const INTENSITIES = ['NI','I3','I2','I1'];
const WEEKLY_TRACK_START = '2026-03-09';

// ================================================================
//  i18n HELPERS
// ================================================================
const TYPE_I18N_MAP = {
    'Sprint (50m)':     'type_sprint',
    'Tempolauf (120m)': 'type_tempo120',
    'Tempolauf (150m)': 'type_tempo150',
    'Kraft':            'type_kraft',
    'Technik':          'type_technik',
    'Joggen (5km)':     'type_joggen',
    'Pausetag':         'type_pause'
};
function translateType(val) {
    const key = TYPE_I18N_MAP[val];
    return key ? t(key) : val;
}

const BODY_I18N_MAP = {
    'Knie': 'body_knee', 'Oberschenkel': 'body_thigh', 'Wade': 'body_calf',
    'Sprunggelenk': 'body_ankle', 'Fuß': 'body_foot', 'Hüfte': 'body_hip',
    'Rücken': 'body_back', 'Schulter': 'body_shoulder', 'Achillessehne': 'body_achilles',
    'Schienbein': 'body_shin', 'Sonstiges': 'cat_sonstiges'
};
function translateBody(val) {
    const key = BODY_I18N_MAP[val];
    return key ? t(key) : val;
}

const SIDE_I18N_MAP = { 'Links': 'side_left', 'Rechts': 'side_right', 'Beide': 'side_both' };
function translateSide(val) { const key = SIDE_I18N_MAP[val]; return key ? t(key) : val; }

const KRAFT_I18N_MAP = {
    'kniebeugen':'kraft_kniebeugen','waden':'kraft_waden','beuger':'kraft_beuger',
    'bauch':'kraft_bauch','ruecken':'kraft_ruecken','exzentrisch':'kraft_exzentrisch','hipthrust':'kraft_hipthrust'
};
function translateKraft(val) { return t(KRAFT_I18N_MAP[val] || val); }

const SPRINT_CAT_I18N = { 'Locker':'cat_locker','Sub-Max':'cat_submax','Max':'cat_max','Seil':'cat_seil' };
const TECHNIK_CAT_I18N = { 'Hütchen':'cat_huetchen','Schirm':'cat_schirm','Sonstiges':'cat_sonstiges' };
function translateSprintCat(val) { const k = SPRINT_CAT_I18N[val]; return k ? t(k) : val; }
function translateTechnikCat(val) { const k = TECHNIK_CAT_I18N[val]; return k ? t(k) : val; }

function applyLanguage() {
    const $ = sel => document.querySelector(sel);
    const $$ = sel => document.querySelectorAll(sel);

    // data-i18n (textContent)
    $$('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) el.textContent = t(key);
    });
    // data-i18n-html (innerHTML)
    $$('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        if (key) el.innerHTML = t(key);
    });
    // data-i18n-ph (placeholder)
    $$('[data-i18n-ph]').forEach(el => {
        const key = el.getAttribute('data-i18n-ph');
        if (key) el.placeholder = t(key);
    });
    // data-i18n-title (title attr)
    $$('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (key) el.title = t(key);
    });

    // Update all static labels, form elements, selects, headings not covered by data-i18n
    // Training form
    const trainingFormCard = document.querySelector('#training .card-header h2');
    if (trainingFormCard) trainingFormCard.textContent = t('new_session');
    const trainingBadge = document.querySelector('#training .card-badge');
    if (trainingBadge) trainingBadge.textContent = t('new_badge');

    // Form labels by their `for` attributes
    const labelMap = {
        'training-date': 'date_label', 'training-time': 'time_label',
        'training-type': 'type_label', 'sprint-category': 'category_label',
        'technik-category': 'category_label', 'custom-category': 'category_label',
        'training-intensity': 'intensity_label', 'training-notes': null, // handled separately
        'training-count': 'count_label',
        'analytics-type': 'analytics_type_label',
        'injury-bodypart': 'body_part_label', 'injury-side': 'side_label',
    };
    Object.entries(labelMap).forEach(([forAttr, key]) => {
        if (!key) return;
        const lbl = document.querySelector(`label[for="${forAttr}"]`);
        if (lbl) lbl.textContent = t(key);
    });

    // Notes label with hint
    const notesLabel = document.querySelector('label[for="training-notes"]');
    if (notesLabel) notesLabel.innerHTML = t('notes_label') + ' <span class="label-hint">(' + t('optional_hint').replace(/[()]/g,'') + ')</span>';
    const notesTA = document.getElementById('training-notes');
    if (notesTA) notesTA.placeholder = t('notes_ph');

    // Times label
    const timesLabel = document.querySelector('#times-container > label');
    if (timesLabel) timesLabel.innerHTML = t('times_label') + ' <span class="label-hint">' + t('times_hint') + '</span>';

    // Add time button
    const addTimeBtn = document.getElementById('add-time-btn');
    if (addTimeBtn) { const svg = addTimeBtn.querySelector('svg'); addTimeBtn.textContent = ''; if (svg) addTimeBtn.appendChild(svg); addTimeBtn.append(' ' + t('add_time')); }

    // Distance labels
    const distanceLabel = document.querySelector('#distance-container > label');
    if (distanceLabel) distanceLabel.innerHTML = t('distance_label') + ' <span class="label-hint">' + t('distance_hint') + '</span>';
    const addDistBtn = document.getElementById('add-distance-btn');
    if (addDistBtn) { const svg = addDistBtn.querySelector('svg'); addDistBtn.textContent = ''; if (svg) addDistBtn.appendChild(svg); addDistBtn.append(' ' + t('add_distance')); }

    // Joggen labels
    const joggenMinLabel = document.querySelector('label[for="joggen-min"]');
    if (joggenMinLabel) joggenMinLabel.textContent = t('minutes_label');
    const joggenSecLabel = document.querySelector('label[for="joggen-sec"]');
    if (joggenSecLabel) joggenSecLabel.textContent = t('seconds_label');
    const joggenHeader = document.querySelector('#joggen-container > label');
    if (joggenHeader) joggenHeader.textContent = t('run_time');
    const joggenMinPh = document.getElementById('joggen-min');
    if (joggenMinPh) joggenMinPh.placeholder = t('minutes_ph');
    const joggenSecPh = document.getElementById('joggen-sec');
    if (joggenSecPh) joggenSecPh.placeholder = t('seconds_ph');
    const countPh = document.getElementById('training-count');
    if (countPh) countPh.placeholder = t('count_ph');

    // ct-kg labels
    const ctKgLabel = document.querySelector('#ct-kg-container > label');
    if (ctKgLabel) ctKgLabel.textContent = t('weight_label');
    const ctKgValLabel = document.querySelector('label[for="ct-kg-value"]');
    if (ctKgValLabel) ctKgValLabel.textContent = t('kg_label');
    const ctKgRepsLabel = document.querySelector('label[for="ct-kg-reps"]');
    if (ctKgRepsLabel) ctKgRepsLabel.textContent = t('reps_label');

    // Telemarks
    const tmQuestion = document.querySelector('#telemark-container > .form-group > label');
    if (tmQuestion) tmQuestion.textContent = t('telemark_question');
    document.getElementById('telemark-no').textContent = t('no');
    document.getElementById('telemark-yes').textContent = t('yes');
    const tmCountLabel = document.querySelector('label[for="telemark-count"]');
    if (tmCountLabel) tmCountLabel.textContent = t('telemark_count');

    // Kraft exercises label
    const kraftLabel = document.querySelector('#kraft-container > label');
    if (kraftLabel) kraftLabel.innerHTML = t('exercises_label') + ' <span class="label-hint">' + t('exercises_hint') + '</span>';
    // Kraft exercise names
    KRAFT_EXERCISES.forEach(ex => {
        const cb = document.getElementById('kraft-' + ex);
        if (cb && cb.parentElement) {
            const label = cb.parentElement;
            // Keep the checkbox, update text after it
            const checkbox = label.querySelector('input');
            label.textContent = '';
            label.appendChild(checkbox);
            label.append(' ' + translateKraft(ex));
        }
    });
    // KB mode buttons
    document.getElementById('kb-mode-normal').textContent = t('normal');
    document.getElementById('kb-mode-pyramid').textContent = t('pyramid');
    // KB add set button
    const kbAddSet = document.getElementById('kb-add-set');
    if (kbAddSet) { const svg = kbAddSet.querySelector('svg'); kbAddSet.textContent = ''; if (svg) kbAddSet.appendChild(svg); kbAddSet.append(' ' + t('add_set')); }

    // Additional type button
    const addTypeBtn = document.getElementById('add-type-btn');
    if (addTypeBtn) { const svg = addTypeBtn.querySelector('svg'); addTypeBtn.textContent = ''; if (svg) addTypeBtn.appendChild(svg); addTypeBtn.append(' ' + t('add_type_btn')); }

    // Save button
    const saveBtn = document.querySelector('#training-form button[type="submit"]');
    if (saveBtn) { const svg = saveBtn.querySelector('svg'); saveBtn.textContent = ''; if (svg) saveBtn.appendChild(svg); saveBtn.append(' ' + t('save_btn')); }

    // History
    const histH2 = document.querySelector('.history-header h2');
    if (histH2) histH2.textContent = t('history_title');

    // Analytics
    const dashH2 = document.querySelector('#analytics .card-header h2');
    if (dashH2) dashH2.textContent = t('dashboard');

    // Stat labels (static HTML stat-label elements)
    const statLabels = {
        'stat-gen-season': 'stat_season', 'stat-gen-total': 'stat_sessions_season',
        'stat-gen-weekly': 'stat_avg_week', 'stat-gen-streak': 'stat_streak',
        'stat-gen-total-all': 'stat_total_all', 'stat-gen-pause': 'stat_pause_season',
        'stat-gen-last': 'stat_last_session',
        'stat-kraft-sessions': 'stat_sessions', 'stat-kraft-avg-ex': 'stat_avg_exercises',
        'stat-kraft-max-kb': 'stat_max_kb', 'stat-kraft-max-waden': 'stat_max_waden',
        'stat-kraft-fav': 'stat_most_exercise', 'stat-kraft-weekly': 'stat_avg_week',
        'stat-tech-sessions': 'stat_sessions', 'stat-tech-fav': 'stat_most_category',
        'stat-tech-weekly': 'stat_avg_week', 'stat-tech-last': 'stat_last_session',
        'stat-jog-sessions': 'stat_sessions', 'stat-jog-best': 'stat_best_time',
        'stat-jog-avg': 'stat_avg_time', 'stat-jog-km': 'stat_total_km',
        'stat-jog-trend': 'stat_trend', 'stat-jog-weekly': 'stat_avg_week',
        'stat-ct-sessions': 'stat_sessions', 'stat-ct-fav': 'stat_custom_most_cat',
        'stat-ct-weekly': 'stat_avg_week', 'stat-ct-last': 'stat_custom_last',
        'stat-best': 'stat_pb', 'stat-avg': 'stat_average',
        'stat-count': 'stat_sessions', 'stat-recent': 'stat_last5',
        'stat-trend': 'stat_trend', 'stat-worst': 'stat_worst',
        'stat-ni-sessions': 'stat_sessions', 'stat-ni-avg-count': 'stat_avg_runs',
        'stat-ni-total': 'stat_total_runs', 'stat-ni-meters': 'stat_total_meters',
        'stat-ni-telemarks': 'stat_total_telemarks', 'stat-ni-avg-tm': 'stat_avg_telemarks',
    };
    Object.entries(statLabels).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el) {
            const labelEl = el.closest('.stat-card')?.querySelector('.stat-label');
            if (labelEl) labelEl.textContent = t(key);
        }
    });

    // PB heading
    const pbH3 = document.querySelector('#pb-card .chart-header h3');
    if (pbH3) pbH3.textContent = t('pb_title');

    // Calendar
    const calCountdownH2 = document.querySelector('.countdown-card .card-header h2');
    if (calCountdownH2) calCountdownH2.textContent = t('next_comp');
    const calCountdownNone = document.querySelector('.countdown-none');
    if (calCountdownNone) calCountdownNone.textContent = t('no_comp_planned');
    const addWkBtn = document.getElementById('btn-add-wk');
    if (addWkBtn) { const svg = addWkBtn.querySelector('svg'); addWkBtn.textContent = ''; if (svg) addWkBtn.appendChild(svg); addWkBtn.append(' ' + t('add_comp_btn')); }
    // Calendar legend
    const legendItems = document.querySelectorAll('.cal-legend-item');
    const legendKeys = ['legend_training', 'legend_comp', 'legend_today'];
    legendItems.forEach((el, i) => {
        if (legendKeys[i]) {
            const dot = el.querySelector('.cal-dot');
            el.textContent = '';
            if (dot) el.appendChild(dot);
            el.append(' ' + t(legendKeys[i]));
        }
    });
    const wkListH2 = document.querySelector('#kalender .card-header h2:last-of-type');
    if (wkListH2 && wkListH2.textContent.match(/Wettk|Compet/)) wkListH2.textContent = t('competitions_title');
    // Competition list heading
    document.querySelectorAll('#kalender .card-header h2').forEach(h => {
        if (h.id === 'cal-season-label') h.textContent = t('season_label');
        else if (!h.closest('.countdown-card')) h.textContent = t('competitions_title');
    });

    // Tagebuch / Diary
    const planH2 = document.querySelector('#plan-card .card-header h2');
    if (planH2) planH2.textContent = t('plan_title');
    const prevBtn = document.getElementById('plan-prev');
    if (prevBtn) prevBtn.title = t('prev_week');
    const nextBtn = document.getElementById('plan-next');
    if (nextBtn) nextBtn.title = t('next_week');
    const addInjBtn = document.getElementById('btn-add-injury');
    if (addInjBtn) { const svg = addInjBtn.querySelector('svg'); addInjBtn.textContent = ''; if (svg) addInjBtn.appendChild(svg); addInjBtn.append(' ' + t('add_injury_btn')); }
    const diaryH2 = document.querySelector('#tagebuch .card-header h2');
    if (diaryH2 && diaryH2.textContent.match(/Schmerz|Jurnal/)) diaryH2.textContent = t('diary_title');
    const injStatsH2 = document.querySelector('#injury-stats-card .card-header h2');
    if (injStatsH2) injStatsH2.textContent = t('pain_overview');

    // Delete modal
    const delH3 = document.querySelector('#delete-modal .modal h3');
    if (delH3) delH3.textContent = t('delete_modal_title');
    const delP = document.querySelector('#delete-modal .modal p');
    if (delP) delP.textContent = t('delete_modal_text');
    document.getElementById('modal-cancel').textContent = t('cancel_btn');
    document.getElementById('modal-confirm').textContent = t('delete_btn');

    // Competition modal
    const wkH3 = document.querySelector('#wk-modal h3');
    if (wkH3) wkH3.textContent = t('comp_modal_title');
    const wkNameLabel = document.querySelector('label[for="wk-name"]');
    if (wkNameLabel) wkNameLabel.textContent = t('comp_name_label');
    document.getElementById('wk-name').placeholder = t('comp_name_ph');
    const discLabel = document.querySelector('#wk-form .form-group label:last-of-type');
    // Discipline checkboxes - update "Weitsprung" and "Dreisprung"
    document.querySelectorAll('.wk-disc-check').forEach(lbl => {
        const cb = lbl.querySelector('input');
        if (cb && cb.value === 'Weitsprung') { lbl.textContent = ''; lbl.appendChild(cb); lbl.append(' ' + t('comp_weitsprung')); }
        if (cb && cb.value === 'Dreisprung') { lbl.textContent = ''; lbl.appendChild(cb); lbl.append(' ' + t('comp_dreisprung')); }
    });
    document.getElementById('wk-cancel').textContent = t('cancel_btn');

    // Injury modal
    const injH3 = document.querySelector('#injury-modal h3');
    if (injH3) injH3.textContent = t('injury_modal_title');
    const injBodyLabel = document.querySelector('label[for="injury-bodypart"]');
    if (injBodyLabel) injBodyLabel.textContent = t('body_part_label');
    // Translate body part options
    const bodySelect = document.getElementById('injury-bodypart');
    if (bodySelect) {
        bodySelect.querySelectorAll('option').forEach(opt => {
            if (opt.value === '') opt.textContent = t('body_select');
            else opt.textContent = translateBody(opt.value);
        });
    }
    const painLabel = document.querySelector('#injury-form .pain-slider-wrap')?.closest('.form-group')?.querySelector('label');
    if (painLabel) painLabel.textContent = t('pain_level');
    const sideLabel = document.querySelector('#injury-form .toggle-row')?.closest('.form-group');
    if (sideLabel) {
        const lbl = sideLabel.querySelector('label[for="injury-side"]') || sideLabel.querySelector('label');
        if (lbl) lbl.textContent = t('side_label');
    }
    document.getElementById('injury-side-links').textContent = t('side_left');
    document.getElementById('injury-side-rechts').textContent = t('side_right');
    document.getElementById('injury-side-beide').textContent = t('side_both');
    const injNotesLabel = document.querySelector('label[for="injury-notes"]');
    if (injNotesLabel) injNotesLabel.innerHTML = t('description_label') + ' <span class="label-hint">(' + t('optional_hint').replace(/[()]/g,'') + ')</span>';
    document.getElementById('injury-cancel').textContent = t('cancel_btn');
    // Injury modal save button
    const injSaveBtn = document.querySelector('#injury-form button[type="submit"]');
    if (injSaveBtn) injSaveBtn.textContent = t('save_btn');
    // WK modal save button
    const wkSaveBtn = document.querySelector('#wk-form button[type="submit"]');
    if (wkSaveBtn) wkSaveBtn.textContent = t('save_btn');

    // Settings modal
    const settingsH3 = document.querySelector('#custom-types-modal .settings-header h3');
    if (settingsH3) settingsH3.textContent = t('settings_title_modal');
    document.querySelectorAll('.settings-tab').forEach(tab => {
        if (tab.dataset.tab === 'tab-report') tab.textContent = t('tab_report');
        if (tab.dataset.tab === 'tab-types') tab.textContent = t('tab_types');
    });
    const reportHint = document.querySelector('#tab-report .settings-hint');
    if (reportHint) reportHint.textContent = t('report_hint');
    const reportWeekLabel = document.querySelector('label[for="report-week"]');
    if (reportWeekLabel) reportWeekLabel.textContent = t('week_label');
    const dlPdfBtn = document.getElementById('btn-send-report');
    if (dlPdfBtn) dlPdfBtn.textContent = t('download_pdf');

    // Custom types form
    const ctTitle = document.getElementById('ct-form-title');
    if (ctTitle && !ctTitle.dataset.editing) ctTitle.textContent = t('new_type');
    const ctNameLabel = document.querySelector('label[for="ct-name"]');
    if (ctNameLabel) ctNameLabel.textContent = t('name_label');
    document.getElementById('ct-name').placeholder = t('name_ph');
    const ctEmojiLabel = document.querySelector('label[for="ct-emoji"]');
    if (ctEmojiLabel) ctEmojiLabel.textContent = t('emoji_label');
    document.getElementById('ct-emoji').placeholder = t('emoji_ph');
    const ctColorLabel = document.querySelector('label[for="ct-color"]');
    if (ctColorLabel) ctColorLabel.textContent = t('color_label');
    const ctSubLabel = document.querySelector('label[for="ct-subcategories"]');
    if (ctSubLabel) ctSubLabel.innerHTML = t('subcategories_label') + ' <span class="label-hint">' + t('subcategories_hint') + '</span>';
    document.getElementById('ct-subcategories').placeholder = t('subcategories_ph');
    // Toggle labels
    const ctTimesLabel = document.querySelector('#ct-times-group > label');
    if (ctTimesLabel) ctTimesLabel.textContent = t('track_times');
    document.getElementById('ct-times-no').textContent = t('no');
    document.getElementById('ct-times-yes').textContent = t('yes');
    const ctCountLabel = document.querySelector('#ct-count-group > label');
    if (ctCountLabel) ctCountLabel.textContent = t('track_reps');
    document.getElementById('ct-count-no').textContent = t('no');
    document.getElementById('ct-count-yes').textContent = t('yes');
    const ctWeightLabel = document.querySelector('#ct-weight-group > label');
    if (ctWeightLabel) ctWeightLabel.textContent = t('track_kg');
    document.getElementById('ct-weight-no').textContent = t('no');
    document.getElementById('ct-weight-yes').textContent = t('yes');
    const ctDistanceLabel = document.querySelector('#ct-distance-group > label');
    if (ctDistanceLabel) ctDistanceLabel.textContent = t('track_distance');
    document.getElementById('ct-distance-no').textContent = t('no');
    document.getElementById('ct-distance-yes').textContent = t('yes');
    const ctCancelBtn = document.getElementById('ct-cancel-edit');
    if (ctCancelBtn) ctCancelBtn.textContent = t('cancel_btn');
    const ctSaveBtn = document.getElementById('ct-save');
    if (ctSaveBtn && !ctSaveBtn.dataset.editing) ctSaveBtn.textContent = t('add_btn');

    // Subcategory section
    const scTypeLabel = document.querySelector('label[for="sc-type"]');
    if (scTypeLabel) scTypeLabel.textContent = t('type_label');
    const scNameLabel = document.querySelector('label[for="sc-name"]');
    if (scNameLabel) scNameLabel.textContent = t('new_subcat_label');
    document.getElementById('sc-name').placeholder = t('new_subcat_ph');
    // SC tracking labels
    const scTimesLabel = document.querySelector('#sc-times-group > label');
    if (scTimesLabel) scTimesLabel.textContent = t('track_times');
    document.getElementById('sc-times-no').textContent = t('no');
    document.getElementById('sc-times-yes').textContent = t('yes');
    const scCountLabel = document.querySelector('#sc-count-group > label');
    if (scCountLabel) scCountLabel.textContent = t('track_reps');
    document.getElementById('sc-count-no').textContent = t('no');
    document.getElementById('sc-count-yes').textContent = t('yes');
    const scWeightLabel = document.querySelector('#sc-weight-group > label');
    if (scWeightLabel) scWeightLabel.textContent = t('track_kg');
    document.getElementById('sc-weight-no').textContent = t('no');
    document.getElementById('sc-weight-yes').textContent = t('yes');
    const scDistanceLabel = document.querySelector('#sc-distance-group > label');
    if (scDistanceLabel) scDistanceLabel.textContent = t('track_distance');
    document.getElementById('sc-distance-no').textContent = t('no');
    document.getElementById('sc-distance-yes').textContent = t('yes');
    // Section titles
    const scSectionTitle = document.getElementById('sc-section-title');
    if (scSectionTitle) scSectionTitle.textContent = t('extend_subcats');
    // Select options that need translation (type selectors)
    ['training-type', 'history-filter', 'analytics-type'].forEach(selId => {
        const sel = document.getElementById(selId);
        if (!sel) return;
        sel.querySelectorAll('option').forEach(opt => {
            if (opt.value === '' || opt.value === 'all') {
                if (selId === 'history-filter') opt.textContent = t('filter_all');
                else if (selId === 'analytics-type' && opt.value === 'Allgemein') opt.textContent = '📊 ' + t('general');
                else if (opt.value === '') opt.textContent = t('please_select');
            } else if (TYPE_I18N_MAP[opt.value]) {
                const prefix = selId === 'analytics-type' ? ({'Sprint (50m)':'⚡ ','Tempolauf (120m)':'🏃 ','Tempolauf (150m)':'🏃 ','Kraft':'💪 ','Technik':'🎯 ','Joggen (5km)':'🏃‍♀️ '}[opt.value] || '') : '';
                opt.textContent = prefix + translateType(opt.value);
            }
        });
    });

    // Sprint/Technik category selects
    const sprintCat = document.getElementById('sprint-category');
    if (sprintCat) sprintCat.querySelectorAll('option').forEach(opt => {
        if (opt.value === '') opt.textContent = t('please_select');
        else if (SPRINT_CAT_I18N[opt.value]) opt.textContent = translateSprintCat(opt.value);
    });
    const technikCat = document.getElementById('technik-category');
    if (technikCat) technikCat.querySelectorAll('option').forEach(opt => {
        if (opt.value === '') opt.textContent = t('please_select');
        else if (TECHNIK_CAT_I18N[opt.value]) opt.textContent = translateTechnikCat(opt.value);
    });

    // Analytics filter selects
    const aSprintCat = document.getElementById('analytics-sprint-cat');
    if (aSprintCat) aSprintCat.querySelectorAll('option').forEach(opt => {
        if (opt.value === 'all') opt.textContent = t('all_categories');
        else if (SPRINT_CAT_I18N[opt.value]) opt.textContent = translateSprintCat(opt.value);
    });
    const aIntensity = document.getElementById('analytics-intensity');
    if (aIntensity) aIntensity.querySelector('option[value="all"]').textContent = t('all_intensities');
    const aCustomCat = document.getElementById('analytics-custom-cat');
    if (aCustomCat) {
        const allOpt = aCustomCat.querySelector('option[value="all"]');
        if (allOpt) allOpt.textContent = t('all_categories');
        const aCustomCatLabel = document.querySelector('label[for="analytics-custom-cat"]');
        if (aCustomCatLabel) aCustomCatLabel.textContent = t('category_label');
    }

    // Coach plan day labels
    document.querySelectorAll('#plan-days .plan-day-row').forEach(row => {
        const dayDE = row.dataset.day;
        const shortMap = { 'Montag':'day_mon_s','Dienstag':'day_tue_s','Mittwoch':'day_wed_s','Donnerstag':'day_thu_s','Freitag':'day_fri_s','Samstag':'day_sat_s','Sonntag':'day_sun_s' };
        const lbl = row.querySelector('.plan-day-label');
        if (lbl && shortMap[dayDE]) lbl.textContent = t(shortMap[dayDE]);
    });

    // Coach plan assign button
    const planBtn = document.getElementById('btn-save-plan');
    if (planBtn) { const svg = planBtn.querySelector('svg'); planBtn.textContent = ''; if (svg) planBtn.appendChild(svg); planBtn.append(' ' + t('assign_plan_btn')); }

    // Description label & placeholder
    const technikCustomLabel = document.querySelector('label[for="technik-custom"]');
    if (technikCustomLabel) technikCustomLabel.textContent = t('description_label');
    const technikCustomInput = document.getElementById('technik-custom');
    if (technikCustomInput) technikCustomInput.placeholder = t('description_ph');

    // Kraft field labels (Kilo, Wdh.)
    document.querySelectorAll('.kraft-field label').forEach(lbl => {
        if (lbl.textContent.trim() === 'Kilo' || lbl.textContent.trim() === t('kilo')) lbl.textContent = t('kilo');
        if (lbl.textContent.trim() === 'Wdh.' || lbl.textContent.trim() === t('reps_dot')) lbl.textContent = t('reps_dot');
    });
}

// Language selector on login screen
document.querySelectorAll('#lang-selector .lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#lang-selector .lang-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setLang(btn.dataset.lang);
        applyLanguage();
    });
});

// Apply saved language on page load
(function initLang() {
    const savedLang = getLang();
    document.querySelectorAll('#lang-selector .lang-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.lang === savedLang);
    });
    if (savedLang !== 'de') applyLanguage();
})();

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
let _customTypes = [];
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
        let doc;
        try { doc = await db.collection('meta').doc('users').get({ source: 'server' }); }
        catch { doc = await db.collection('meta').doc('users').get(); }
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
      .set({ entries: data }, { merge: true }).catch(() => {});
}

async function loadFromFirestore(user) {
    try {
        let doc;
        try { doc = await db.collection('users').doc(user.toLowerCase().trim()).get({ source: 'server' }); }
        catch { doc = await db.collection('users').doc(user.toLowerCase().trim()).get(); }
        if (doc.exists) {
            const serverEntries = doc.data().entries;
            const localEntries = JSON.parse(localStorage.getItem(storageKeyFor(user)) || '[]');
            if (Array.isArray(serverEntries)) {
                _cachedEntries = serverEntries;
            } else if (localEntries.length) {
                // Firestore doc exists but entries field is missing — use local data and restore
                _cachedEntries = localEntries;
                db.collection('users').doc(user.toLowerCase().trim())
                  .set({ entries: _cachedEntries }, { merge: true }).catch(() => {});
            } else {
                _cachedEntries = [];
            }
            localStorage.setItem(storageKeyFor(user), JSON.stringify(_cachedEntries));
        } else {
            _cachedEntries = JSON.parse(localStorage.getItem(storageKeyFor(user))) || [];
            if (_cachedEntries.length) {
                db.collection('users').doc(user.toLowerCase().trim())
                  .set({ entries: _cachedEntries }, { merge: true }).catch(() => {});
            }
        }
    } catch(e) {
        try { _cachedEntries = JSON.parse(localStorage.getItem(storageKeyFor(user))) || []; }
        catch { _cachedEntries = []; }
    }
}

// ---- Custom Training Types ----
function customTypesKey() { return 'trainlytics_customtypes_' + (currentUser || '').toLowerCase().trim(); }

function loadCustomTypes() {
    try { _customTypes = JSON.parse(localStorage.getItem(customTypesKey())) || []; }
    catch { _customTypes = []; }
    return _customTypes;
}

function saveCustomTypes(list) {
    _customTypes = list;
    if (!currentUser) return;
    localStorage.setItem(customTypesKey(), JSON.stringify(list));
    db.collection('users').doc(currentUser.toLowerCase().trim())
      .set({ customTypes: list }, { merge: true }).catch(() => {});
}

async function loadCustomTypesFromFirestore(user) {
    try {
        let doc;
        try { doc = await db.collection('users').doc(user.toLowerCase().trim()).get({ source: 'server' }); }
        catch { doc = await db.collection('users').doc(user.toLowerCase().trim()).get(); }
        if (doc.exists) {
            if (doc.data().customTypes) {
                _customTypes = doc.data().customTypes;
                localStorage.setItem(customTypesKey(), JSON.stringify(_customTypes));
            } else { loadCustomTypes(); }
            if (doc.data().customSubcategories) {
                _customSubcategories = doc.data().customSubcategories;
            }

        } else {
            loadCustomTypes();
        }
    } catch { loadCustomTypes(); }
}

let _customSubcategories = {};
function saveCustomSubcategories(data) {
    _customSubcategories = data;
    if (!currentUser) return;
    db.collection('users').doc(currentUser.toLowerCase().trim())
      .set({ customSubcategories: data }, { merge: true }).catch(() => {});
}

// Subcategory entry helpers (backward compat: entries can be string or {name, trackTimes, trackCount, trackWeight})
function scEntryName(entry) { return typeof entry === 'string' ? entry : (entry.name || ''); }
function scEntryNames(type) { return (_customSubcategories[type] || []).map(scEntryName); }
function scFindEntry(type, name) { return (_customSubcategories[type] || []).find(e => scEntryName(e) === name); }

function getCustomType(typeName) {
    return _customTypes.find(ct => ct.name === typeName);
}

function startListener(user) {
    if (_unsubscribe) _unsubscribe();
    _unsubscribe = db.collection('users').doc(user.toLowerCase().trim())
      .onSnapshot(doc => {
        if (doc.exists && !doc.metadata.hasPendingWrites) {
            const data = doc.data();
            // Sync entries — guard against accidental data wipe
            const incoming = data.entries;
            if (Array.isArray(incoming)) {
                _cachedEntries = incoming;
                localStorage.setItem(storageKeyFor(user), JSON.stringify(_cachedEntries));
            } else if (incoming === undefined && _cachedEntries.length > 0) {
                // entries field missing from Firestore but we have local data — restore it
                console.warn('[TrainLytics] entries field missing in Firestore, restoring from local cache');
                db.collection('users').doc(user.toLowerCase().trim())
                  .set({ entries: _cachedEntries }, { merge: true }).catch(() => {});
            }
            renderList();
            // Sync competitions
            if (data.competitions) {
                _competitions = data.competitions;
                localStorage.setItem(competitionsKey(), JSON.stringify(_competitions));
                renderCalendar();
            }
            // Sync injuries
            if (data.injuries) {
                _injuries = data.injuries;
                localStorage.setItem(injuriesKey(), JSON.stringify(_injuries));
                renderInjuryList();
            }
            // Sync custom types
            if (data.customTypes) {
                _customTypes = data.customTypes;
                localStorage.setItem(customTypesKey(), JSON.stringify(_customTypes));
                applyUserRestrictions(currentUser);
            }
            // Sync custom subcategories
            if (data.customSubcategories) {
                _customSubcategories = data.customSubcategories;
            }

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
        if (!pw) { showToast(t('toast_pw_required')); return; }
        try {
            const doc = await db.collection('meta').doc('coach').get();
            if (doc.exists) {
                if (doc.data().pw !== pw) { showToast(t('toast_pw_wrong')); return; }
            } else {
                await db.collection('meta').doc('coach').set({ pw });
                showToast(t('toast_pw_set'));
            }
        } catch(e) { showToast(t('toast_login_error_coach')); return; }
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
        if (!pw) { showToast(t('toast_pw_required')); return; }
        const docKey = 'pw_' + clean.toLowerCase();
        try {
            const doc = await db.collection('meta').doc(docKey).get();
            if (doc.exists) {
                if (doc.data().pw !== pw) { showToast(t('toast_pw_wrong')); return; }
            } else {
                await db.collection('meta').doc(docKey).set({ pw });
                showToast(t('toast_pw_set'));
            }
        } catch(e) { showToast(t('toast_login_error')); return; }
        loginPwInput.value = '';
        loginPwGroup.style.display = 'none';
    }

    currentUser = clean;
    addUser(clean);
    loginScreen.style.display = 'none';
    appEl.style.display = '';
    document.getElementById('user-greeting').textContent = t('greeting') + ', ' + clean.charAt(0).toUpperCase() + clean.slice(1) + '!';

    // Reset form/UI for new user
    resetAppUI();

    // Restrict Angelika to Joggen only
    applyUserRestrictions(clean);

    await loadFromFirestore(clean);
    await loadCompetitionsFromFirestore(clean);
    await loadInjuriesFromFirestore(clean);
    await loadCustomTypesFromFirestore(clean);
    applyUserRestrictions(clean);
    startListener(clean);
    renderList();
}

loginForm.addEventListener('submit', e => { e.preventDefault(); loginAs(loginNameInput.value); });

function resetAppUI() {
    form.reset();
    setDefaults();
    clearAdditionalTypes();
    // Explicitly clear fields that form.reset() may miss
    document.getElementById('training-notes').value = '';
    document.getElementById('joggen-min').value = '';
    document.getElementById('joggen-sec').value = '';
    document.getElementById('training-count').value = '';
    document.getElementById('telemark-count').value = '';
    intensityGroup.style.display = 'none';
    document.getElementById('sprint-cat-group').style.display = 'none';
    document.getElementById('sprint-category').value = '';
    document.getElementById('technik-cat-group').style.display = 'none';
    document.getElementById('technik-category').value = '';
    document.getElementById('technik-custom-group').style.display = 'none';
    document.getElementById('technik-custom').value = '';
    document.getElementById('custom-cat-group').style.display = 'none';
    document.getElementById('custom-category').value = '';
    document.getElementById('kraft-container').style.display = 'none';
    document.getElementById('ct-kg-container').style.display = 'none';
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
    _customTypes = [];
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
        sel.innerHTML = '<option value="">' + escapeHtml(t('please_select')) + '</option><option value="Joggen (5km)">' + escapeHtml(translateType('Joggen (5km)')) + '</option>';
        hFilter.innerHTML = '<option value="all">' + escapeHtml(t('filter_all')) + '</option><option value="Joggen (5km)">' + escapeHtml(translateType('Joggen (5km)')) + '</option>';
        aType.innerHTML = '<option value="Allgemein">📊 ' + escapeHtml(t('general')) + '</option><option value="Joggen (5km)">🏃‍♀️ ' + escapeHtml(translateType('Joggen (5km)')) + '</option>';
    } else {
        const biTraining = [
            {v:'Sprint (50m)', l:translateType('Sprint (50m)')},
            {v:'Tempolauf (120m)', l:translateType('Tempolauf (120m)')},
            {v:'Tempolauf (150m)', l:translateType('Tempolauf (150m)')},
            {v:'Kraft', l:translateType('Kraft')},
            {v:'Technik', l:translateType('Technik')},
            {v:'Pausetag', l:translateType('Pausetag')},
        ];
        const biAnalytics = [
            {v:'Sprint (50m)', e:'⚡'},
            {v:'Tempolauf (120m)', e:'🏃'},
            {v:'Tempolauf (150m)', e:'🏃'},
            {v:'Kraft', e:'💪'},
            {v:'Technik', e:'🎯'},
        ];
        sel.innerHTML = '<option value="">' + escapeHtml(t('please_select')) + '</option>' +
            biTraining.map(bt => '<option value="' + escapeHtml(bt.v) + '">' + escapeHtml(bt.l) + '</option>').join('');
        hFilter.innerHTML = '<option value="all">' + escapeHtml(t('filter_all')) + '</option>' +
            biTraining.map(bt => '<option value="' + escapeHtml(bt.v) + '">' + escapeHtml(bt.l) + '</option>').join('');
        aType.innerHTML = '<option value="Allgemein">📊 ' + escapeHtml(t('general')) + '</option>' +
            biAnalytics.map(bt => '<option value="' + escapeHtml(bt.v) + '">' + bt.e + ' ' + escapeHtml(translateType(bt.v)) + '</option>').join('');
    }
    // Append custom training types to all dropdowns
    _customTypes.forEach(ct => {
        const eName = escapeHtml(ct.name);
        const emoji = ct.emoji ? escapeHtml(ct.emoji) + ' ' : '📌 ';
        sel.insertAdjacentHTML('beforeend', '<option value="' + eName + '">' + eName + '</option>');
        hFilter.insertAdjacentHTML('beforeend', '<option value="' + eName + '">' + eName + '</option>');
        aType.insertAdjacentHTML('beforeend', '<option value="' + eName + '">' + emoji + eName + '</option>');
    });
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
    const isSprint = val === 'Sprint (50m)';
    const isTechnik = val === 'Technik';
    const isPause = val === 'Pausetag';
    const customType = getCustomType(val);
    // Sprint subcategories (hardcoded + custom)
    if (isSprint) {
        const sprintSel = document.getElementById('sprint-category');
        const builtIn = ['Locker', 'Sub-Max', 'Max', 'Seil'];
        const custom = scEntryNames('Sprint (50m)');
        sprintSel.innerHTML = '<option value="">-- ' + t('please_select') + ' --</option>' +
            [...builtIn, ...custom].map(s => '<option value="' + escapeHtml(s) + '">' + escapeHtml(s) + '</option>').join('');
        document.getElementById('sprint-cat-group').style.display = '';
    } else {
        document.getElementById('sprint-cat-group').style.display = 'none';
        document.getElementById('sprint-category').value = '';
    }
    // Technik subcategories (hardcoded + custom)
    if (isTechnik) {
        const technikSel = document.getElementById('technik-category');
        const builtIn = ['Hütchen', 'Schirm'];
        const custom = scEntryNames('Technik');
        technikSel.innerHTML = '<option value="">-- ' + t('please_select') + ' --</option>' +
            [...builtIn, ...custom].map(s => '<option value="' + escapeHtml(s) + '">' + escapeHtml(s) + '</option>').join('') +
            '<option value="Sonstiges">' + t('cat_sonstiges') + '</option>';
        document.getElementById('technik-cat-group').style.display = '';
    } else {
        document.getElementById('technik-cat-group').style.display = 'none';
    }
    document.getElementById('technik-custom-group').style.display = 'none';
    if (!isTechnik) { document.getElementById('technik-category').value = ''; document.getElementById('technik-custom').value = ''; }
    // Custom type subcategory OR built-in type custom subcategories
    const customCatGroup = document.getElementById('custom-cat-group');
    const customCatSel = document.getElementById('custom-category');
    const builtInCustomSubs = (!customType && !isSprint && !isTechnik) ? scEntryNames(val) : [];
    if (customType && customType.subcategories && customType.subcategories.length) {
        const extended = scEntryNames(val).filter(s => !customType.subcategories.includes(s));
        const allSubs = [...customType.subcategories, ...extended];
        customCatSel.innerHTML = '<option value="">-- ' + t('please_select') + ' --</option>' +
            allSubs.map(s => '<option value="' + escapeHtml(s) + '">' + escapeHtml(s) + '</option>').join('');
        customCatGroup.style.display = '';
    } else if (builtInCustomSubs.length) {
        customCatSel.innerHTML = '<option value="">-- ' + t('please_select') + ' --</option>' +
            builtInCustomSubs.map(s => '<option value="' + escapeHtml(s) + '">' + escapeHtml(s) + '</option>').join('');
        customCatGroup.style.display = '';
    } else {
        customCatGroup.style.display = 'none';
        customCatSel.value = '';
    }
    intensityGroup.style.display = isTempo ? '' : 'none';
    document.getElementById('kraft-container').style.display = isKraft ? '' : 'none';
    joggenContainer.style.display = isJoggen ? '' : 'none';
    if (isKraft || isJoggen || isTechnik || isPause) {
        timesContainer.style.display = 'none';
        countContainer.style.display = 'none';
        document.getElementById('ct-kg-container').style.display = 'none';
        distanceContainer.style.display = 'none';
        telemarkContainer.style.display = 'none';
    } else if (customType) {
        timesContainer.style.display = customType.trackTimes ? '' : 'none';
        countContainer.style.display = customType.trackCount ? '' : 'none';
        document.getElementById('ct-kg-container').style.display = customType.trackWeight ? '' : 'none';
        distanceContainer.style.display = customType.trackDistance ? '' : 'none';
        telemarkContainer.style.display = 'none';
        if (customType.trackCount) {
            document.querySelector('label[for="training-count"]').textContent = t('count_prefix');
        }
        if (!customType.trackTimes && !customType.trackCount) {
            trainingIntensity.value = '';
        }
    } else if (!isTempo) {
        trainingIntensity.value = '';
        document.querySelector('label[for="training-count"]').textContent = t('count_label');
        showTimesMode();
    } else {
        updateFormMode();
    }
});

// Show/hide times vs count when intensity changes
trainingIntensity.addEventListener('change', updateFormMode);

// Show/hide Technik custom input when Sonstiges selected
document.getElementById('technik-category').addEventListener('change', () => {
    const val = document.getElementById('technik-category').value;
    document.getElementById('technik-custom-group').style.display = val === 'Sonstiges' ? '' : 'none';
    if (val !== 'Sonstiges') document.getElementById('technik-custom').value = '';
});

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
    row.innerHTML = `<span class="pyramid-set-label">${t('set_label')} ${count}</span>
        <div class="kraft-inputs">
            <div class="kraft-field"><label>${t('reps_dot')}</label><input type="number" class="kb-pyr-reps" min="1" step="1" placeholder="${t('reps_short')}"></div>
            <div class="kraft-field"><label>${t('kilo')}</label><input type="number" class="kb-pyr-kg" min="0" step="0.5" placeholder="kg"></div>
        </div>
        <button type="button" class="btn-remove-time" title="${t('remove_label')}" style="margin-left:4px">&times;</button>`;
    row.querySelector('.btn-remove-time').addEventListener('click', () => { row.remove(); refreshPyramidLabels(); });
    kbPyramidSets.appendChild(row);
}

function refreshPyramidLabels() {
    kbPyramidSets.querySelectorAll('.pyramid-set').forEach((el, i) => {
        el.querySelector('.pyramid-set-label').textContent = t('set_label') + ' ' + (i + 1);
    });
}

document.getElementById('kb-add-set').addEventListener('click', addPyramidSet);

function addTimeEntry(value = '') {
    const idx = timesList.querySelectorAll('.time-entry').length + 1;
    const e = document.createElement('div');
    e.className = 'time-entry';
    e.innerHTML = `<span class="time-index">${idx}</span>
        <input type="number" step="0.01" min="0" placeholder="${t('time_ph')}" class="time-input" value="${escapeHtml(String(value))}">
        <button type="button" class="btn-remove-time" title="${t('remove_label')}">&times;</button>`;
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

// ---- Distance entries ----
const distanceList = document.getElementById('distance-list');
const distanceContainer = document.getElementById('distance-container');

function addDistanceEntry(value = '') {
    const idx = distanceList.querySelectorAll('.time-entry').length + 1;
    const e = document.createElement('div');
    e.className = 'time-entry';
    e.innerHTML = `<span class="time-index">${idx}</span>
        <input type="number" step="0.01" min="0" placeholder="${t('distance_ph')}" class="distance-input" value="${escapeHtml(String(value))}">
        <button type="button" class="btn-remove-time" title="${t('remove_label')}">&times;</button>`;
    e.querySelector('.btn-remove-time').addEventListener('click', () => { e.remove(); refreshDistanceIdx(); });
    distanceList.appendChild(e);
    refreshDistanceIdx();
}

function refreshDistanceIdx() {
    const entries = distanceList.querySelectorAll('.time-entry');
    entries.forEach((el, i) => {
        el.querySelector('.time-index').textContent = i + 1;
        el.querySelector('.btn-remove-time').disabled = entries.length <= 1;
    });
}

distanceList.querySelector('.btn-remove-time').addEventListener('click', function() {
    if (distanceList.querySelectorAll('.time-entry').length > 1) { this.closest('.time-entry').remove(); refreshDistanceIdx(); }
});

document.getElementById('add-distance-btn').addEventListener('click', () => addDistanceEntry());

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

    if (!date || !time || !type) { showToast(t('toast_fill_all')); return; }

    const isTempo = type.startsWith('Tempolauf');
    const isKraft = type === 'Kraft';
    const isJoggen = type === 'Joggen (5km)';
    const isSprint = type === 'Sprint (50m)';
    const isTechnik = type === 'Technik';
    const isPause = type === 'Pausetag';
    const customType = getCustomType(type);
    const intensity = isTempo ? trainingIntensity.value : '';
    const sprintCategory = isSprint ? document.getElementById('sprint-category').value : '';
    const technikCategory = isTechnik ? document.getElementById('technik-category').value : '';
    const technikCustom = (isTechnik && technikCategory === 'Sonstiges') ? document.getElementById('technik-custom').value.trim() : '';
    const customCategory = (customType || (!isSprint && !isTechnik && scEntryNames(type).length)) ? document.getElementById('custom-category').value : '';
    const isCountMode = intensity === 'NI';

    if (isTempo && !intensity) { showToast(t('toast_select_intensity')); return; }
    if (isSprint && !sprintCategory) { showToast(t('toast_select_sprint_cat')); return; }
    if (isTechnik && !technikCategory) { showToast(t('toast_select_technik_cat')); return; }
    if (isTechnik && technikCategory === 'Sonstiges' && !technikCustom) { showToast(t('toast_enter_description')); return; }
    if (customType && customType.subcategories && customType.subcategories.length && !customCategory) { showToast(t('toast_select_category')); return; }
    if (!customType && !isSprint && !isTechnik && scEntryNames(type).length && !customCategory) { showToast(t('toast_select_category')); return; }

    // Pausetag — no data collection needed
    if (isPause) {
        const entry = { id: generateId(), date, time, type: 'Pausetag', intensity: '', sprintCategory: '', technikCategory: '', technikCustom: '', customCategory: '', times: [], count: null, telemarks: null, exercises: null, joggenTimeSec: null, customKg: null, customReps: null, distances: [], notes };
        const data = loadData();
        data.unshift(entry);
        saveData(data);
        form.reset();
        setDefaults();
        document.getElementById('training-notes').value = '';
        renderList();
        showToast(t('toast_pause_saved'));
        return;
    }

    let times = [];
    let count = null;
    let telemarks = null;
    let exercises = null;
    let joggenTimeSec = null;
    let customKg = null;
    let customReps = null;
    let distances = [];

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
        if (!anyChecked) { showToast(t('toast_check_exercise')); return; }
    } else if (isJoggen) {
        const minVal = parseInt(document.getElementById('joggen-min').value, 10);
        const secVal = parseInt(document.getElementById('joggen-sec').value, 10) || 0;
        if (isNaN(minVal) || minVal < 0 || (minVal === 0 && secVal <= 0)) { showToast(t('toast_valid_runtime')); return; }
        joggenTimeSec = minVal * 60 + secVal;
    } else if (isTechnik) {
        // Technik has no times/count — just category + notes
    } else if (customType) {
        // Custom type: check for subcategory tracking override
        const scOverride = customCategory ? scFindEntry(type, customCategory) : null;
        const effTimes = (scOverride && typeof scOverride === 'object') ? scOverride.trackTimes : customType.trackTimes;
        const effCount = (scOverride && typeof scOverride === 'object') ? scOverride.trackCount : customType.trackCount;
        const effWeight = (scOverride && typeof scOverride === 'object') ? scOverride.trackWeight : customType.trackWeight;
        const effDistance = (scOverride && typeof scOverride === 'object') ? scOverride.trackDistance : customType.trackDistance;
        if (effTimes) {
            const inputs = timesList.querySelectorAll('.time-input');
            let ok = true;
            inputs.forEach(inp => {
                const v = parseFloat(inp.value);
                if (isNaN(v) || v <= 0) { ok = false; inp.style.borderColor = 'var(--danger)'; }
                else { inp.style.borderColor = ''; times.push(v); }
            });
            if (!ok || !times.length) { showToast(t('toast_valid_times')); return; }
        }
        if (effCount) {
            count = parseInt(document.getElementById('training-count').value, 10);
            if (!count || count < 1) { showToast(t('toast_enter_count')); return; }
        }
        if (effWeight) {
            const kgVal = parseFloat(document.getElementById('ct-kg-value').value);
            const repsVal = parseInt(document.getElementById('ct-kg-reps').value, 10);
            if (!kgVal || kgVal <= 0) { showToast(t('toast_enter_kg')); return; }
            customKg = kgVal;
            customReps = repsVal > 0 ? repsVal : null;
        }
        if (effDistance) {
            const inputs = distanceList.querySelectorAll('.distance-input');
            let ok = true;
            inputs.forEach(inp => {
                const v = parseFloat(inp.value);
                if (isNaN(v) || v <= 0) { ok = false; inp.style.borderColor = 'var(--danger)'; }
                else { inp.style.borderColor = ''; distances.push(v); }
            });
            if (!ok || !distances.length) { showToast(t('toast_valid_distances')); return; }
        }
    } else if (isCountMode) {
        count = parseInt(document.getElementById('training-count').value, 10);
        if (!count || count < 1) { showToast(t('toast_enter_count')); return; }
        if (intensity === 'NI') {
            const tmActive = telemarkYes.classList.contains('active');
            if (tmActive) {
                telemarks = parseInt(document.getElementById('telemark-count').value, 10);
                if (!telemarks || telemarks < 1) { showToast(t('toast_enter_telemark')); return; }
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
        if (!ok || !times.length) { showToast(t('toast_valid_times')); return; }
    }

    const entry = { id: generateId(), date, time, type, intensity, sprintCategory, technikCategory, technikCustom, customCategory, times, count, telemarks, exercises, joggenTimeSec, customKg, customReps, distances, notes };

    // Collect additional training types
    const additionalTypes = collectAdditionalTypes();
    if (additionalTypes.length) entry.additionalTypes = additionalTypes;

    const data = loadData();
    data.unshift(entry);
    saveData(data);

    form.reset();
    setDefaults();
    clearAdditionalTypes();
    document.getElementById('training-notes').value = '';
    document.getElementById('joggen-min').value = '';
    document.getElementById('joggen-sec').value = '';
    intensityGroup.style.display = 'none';
    document.getElementById('sprint-cat-group').style.display = 'none';
    document.getElementById('sprint-category').value = '';
    document.getElementById('technik-cat-group').style.display = 'none';
    document.getElementById('technik-category').value = '';
    document.getElementById('technik-custom-group').style.display = 'none';
    document.getElementById('technik-custom').value = '';
    document.getElementById('custom-cat-group').style.display = 'none';
    document.getElementById('custom-category').value = '';
    telemarkContainer.style.display = 'none';
    telemarkYes.classList.add('active');
    telemarkNo.classList.remove('active');
    telemarkCountGroup.style.display = '';
    document.getElementById('kraft-container').style.display = 'none';
    document.getElementById('ct-kg-container').style.display = 'none';
    document.getElementById('ct-kg-value').value = '';
    document.getElementById('ct-kg-reps').value = '';
    distanceContainer.style.display = 'none';
    distanceList.innerHTML = '';
    addDistanceEntry();
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
        <span class="pyramid-set-label">${t('set_label')} 1</span>
        <div class="kraft-inputs">
            <div class="kraft-field"><label>${t('reps_dot')}</label><input type="number" class="kb-pyr-reps" min="1" step="1" placeholder="${t('reps_short')}"></div>
            <div class="kraft-field"><label>${t('kilo')}</label><input type="number" class="kb-pyr-kg" min="0" step="0.5" placeholder="kg"></div>
        </div>
    </div>`;
    showTimesMode();
    timesList.innerHTML = '';
    addTimeEntry();
    renderList();
    showToast(t('toast_saved'));
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
    if (type === 'Technik') return 'technik';
    if (type.startsWith('Joggen')) return 'joggen';
    if (type === 'Pausetag') return 'pausetag';
    if (getCustomType(type)) return 'custom-type';
    return 'tempo150';
}

function fmtDate(d) {
    return new Date(d+'T00:00:00').toLocaleDateString(t('locale'),{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'});
}

function fmtJoggenTime(totalSec) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
}

function renderList() {
    const data = loadData();
    const f = historyFilter.value;
    const list = (f === 'all' ? data : data.filter(d => d.type === f || (d.additionalTypes && d.additionalTypes.some(at => at.type === f))))
        .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

    if (!list.length) {
        trainingListEl.innerHTML = `<div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.25"><path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            <p>${escapeHtml(t('empty_sessions'))}</p></div>`;
        return;
    }

    trainingListEl.innerHTML = list.map(en => `
        <div class="training-entry" data-id="${escapeHtml(en.id)}">
            <div class="entry-header">
                <div class="entry-meta">
                    <span class="entry-date">${escapeHtml(fmtDate(en.date))}</span>
                    <span class="entry-time-label">${escapeHtml(en.time)}${t('clock_suffix') ? ' ' + t('clock_suffix') : ''}</span>
                </div>
                <div class="entry-badges">
                    <span class="type-badge ${typeCss(en.type)}"${(() => { const ct = getCustomType(en.type); return ct ? ' style="background:' + ct.color + '20;color:' + ct.color + '"' : ''; })()}>${escapeHtml(translateType(en.type))}</span>
                    ${en.sprintCategory ? `<span class="intensity-badge sprint-cat-badge">${escapeHtml(en.sprintCategory)}</span>` : ''}
                    ${en.technikCategory ? `<span class="intensity-badge technik-cat-badge">${escapeHtml(en.technikCategory === 'Sonstiges' && en.technikCustom ? en.technikCustom : en.technikCategory)}</span>` : ''}
                    ${en.customCategory ? `<span class="intensity-badge custom-cat-badge">${escapeHtml(en.customCategory)}</span>` : ''}
                    ${en.intensity ? `<span class="intensity-badge">${escapeHtml(en.intensity)}</span>` : ''}
                    ${(en.additionalTypes || []).map(at => `<span class="type-badge ${typeCss(at.type)}"${(() => { const ct = getCustomType(at.type); return ct ? ' style="background:' + ct.color + '20;color:' + ct.color + '"' : ''; })()}>${escapeHtml(at.type)}</span>${at.category ? `<span class="intensity-badge">${escapeHtml(at.category)}</span>` : ''}`).join('')}
                </div>
            </div>
            ${en.type === 'Pausetag'
                ? '<div class="entry-notes" style="opacity:.6">' + escapeHtml(t('pausetag_text')) + '</div>'
                : en.type === 'Technik'
                ? ''
                : en.type === 'Kraft' && en.exercises
                ? `<div class="entry-kraft">${Object.entries(en.exercises).map(([k,v]) => {
                    const label = translateKraft(k);
                    let detail = '';
                    if (v.pyramid && v.pyramid.length) {
                        detail = v.pyramid.map(s => s.reps + '×' + s.kg + 'kg').join(', ');
                    } else {
                        if (v.kg) detail += v.kg + 'kg';
                        if (v.reps) detail += (detail ? ' × ' : '') + v.reps + ' ' + t('reps_short');
                    }
                    return `<span class="kraft-chip">${escapeHtml(label)}${detail ? ` <span class="kraft-chip-detail">${escapeHtml(detail)}</span>` : ''}</span>`;
                  }).join('')}</div>`
                : en.type === 'Joggen (5km)' && en.joggenTimeSec
                ? `<div class="entry-times"><span class="time-chip joggen-chip">${fmtJoggenTime(en.joggenTimeSec)}</span></div>`
                : getCustomType(en.type)
                ? (() => {
                    let parts = [];
                    if (en.times && en.times.length) parts.push(`<div class="entry-times">${en.times.map(t=>`<span class="time-chip">${escapeHtml(String(t))}s</span>`).join('')}</div>`);
                    if (en.distances && en.distances.length) parts.push(`<div class="entry-times">${en.distances.map(d=>`<span class="time-chip">${escapeHtml(String(d))}m</span>`).join('')}</div>`);
                    if (en.count) parts.push(`<div class="entry-count">${t('count_prefix')}: <strong>${en.count}</strong></div>`);
                    if (en.customKg) parts.push(`<div class="entry-count">${en.customKg}kg${en.customReps ? ' × ' + en.customReps + ' ' + t('reps_short') : ''}</div>`);
                    return parts.join('');
                  })()
                : en.intensity === 'NI'
                ? `<div class="entry-count">${t('runs_count')}: <strong>${en.count || 0}</strong>${en.telemarks != null ? ` · ${t('telemarks_label')}: <strong>${en.telemarks}</strong>` : ''}</div>`
                : (en.times && en.times.length) ? `<div class="entry-times">${en.times.map(t=>`<span class="time-chip">${escapeHtml(String(t))}s</span>`).join('')}</div>` : ''
            }
            ${en.notes ? `<div class="entry-notes">${escapeHtml(en.notes)}</div>` : ''}
            <div class="entry-footer">
                <button class="btn-icon btn-del" data-id="${escapeHtml(en.id)}" title="${escapeHtml(t('delete_title'))}">
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
    if (delTarget) { saveData(loadData().filter(d => d.id !== delTarget)); renderList(); showToast(t('toast_deleted')); }
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

const analyticsSprintCatGroup = document.getElementById('analytics-sprint-cat-group');
const analyticsSprintCatEl = document.getElementById('analytics-sprint-cat');
const analyticsCustomCatGroup = document.getElementById('analytics-custom-cat-group');
const analyticsCustomCatEl = document.getElementById('analytics-custom-cat');

analyticsTypeEl.addEventListener('change', () => {
    const val = analyticsTypeEl.value;
    const isGeneral = val === 'Allgemein';
    const isTempo = val.startsWith('Tempolauf');
    const isSprint = val === 'Sprint (50m)';
    const isTechnik = val === 'Technik';
    const customType = getCustomType(val);
    analyticsIntGroup.style.display = (isTempo && !isGeneral) ? '' : 'none';
    analyticsSprintCatGroup.style.display = isSprint ? '' : 'none';
    if (!isTempo) analyticsIntEl.value = 'all';
    if (!isSprint) analyticsSprintCatEl.value = 'all';
    // Show custom category filter for Technik and custom types with subcategories
    const showCustomCat = isTechnik || (customType && customType.subcategories && customType.subcategories.length);
    analyticsCustomCatGroup.style.display = showCustomCat ? '' : 'none';
    if (showCustomCat) {
        populateAnalyticsCustomCat(val, customType);
    } else {
        analyticsCustomCatEl.value = 'all';
    }
    updateAnalytics();
});
analyticsIntEl.addEventListener('change', updateAnalytics);
analyticsSprintCatEl.addEventListener('change', updateAnalytics);
analyticsCustomCatEl.addEventListener('change', updateAnalytics);

function populateAnalyticsCustomCat(type, customType) {
    const curVal = analyticsCustomCatEl.value;
    let cats = [];
    if (type === 'Technik') {
        // Built-in + extended subcategories
        const builtIn = ['Hütchen', 'Schirm', 'Sonstiges'];
        const extended = scEntryNames('Technik');
        cats = [...builtIn, ...extended.filter(s => !builtIn.includes(s))];
    } else if (customType && customType.subcategories) {
        const extended = scEntryNames(type).filter(s => !customType.subcategories.includes(s));
        cats = [...customType.subcategories, ...extended];
    }
    analyticsCustomCatEl.innerHTML = '<option value="all">' + escapeHtml(t('all_categories')) + '</option>' +
        cats.map(c => '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>').join('');
    // Restore previous value if still valid
    if (curVal && cats.includes(curVal)) analyticsCustomCatEl.value = curVal;
    else analyticsCustomCatEl.value = 'all';
}

const chartInstances = {};
const COLORS = {
    'Sprint (50m)':       { main:'#B4A8FF', bg:'rgba(180,168,255,0.18)', g1:'rgba(180,168,255,0.35)', g2:'rgba(180,168,255,0.02)' },
    'Tempolauf (120m)':   { main:'#22D3C5', bg:'rgba(34,211,197,0.18)',  g1:'rgba(34,211,197,0.35)',  g2:'rgba(34,211,197,0.02)' },
    'Tempolauf (150m)':   { main:'#FBBF24', bg:'rgba(251,191,36,0.18)',  g1:'rgba(251,191,36,0.35)',  g2:'rgba(251,191,36,0.02)' },
    'Kraft':              { main:'#F87171', bg:'rgba(248,113,113,0.18)', g1:'rgba(248,113,113,0.35)', g2:'rgba(248,113,113,0.02)' },
    'Technik':            { main:'#FB923C', bg:'rgba(251,146,60,0.18)',  g1:'rgba(251,146,60,0.35)',  g2:'rgba(251,146,60,0.02)' },
    'Joggen (5km)':       { main:'#34D399', bg:'rgba(52,211,153,0.18)',  g1:'rgba(52,211,153,0.35)',  g2:'rgba(52,211,153,0.02)' },
    'Pausetag':           { main:'#F59E0B', bg:'rgba(245,158,11,0.18)',  g1:'rgba(245,158,11,0.35)',  g2:'rgba(245,158,11,0.02)' },
};

function hexToColorObj(hex) {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return { main: hex, bg: `rgba(${r},${g},${b},0.18)`, g1: `rgba(${r},${g},${b},0.35)`, g2: `rgba(${r},${g},${b},0.02)` };
}

function getTypeColor(type) {
    if (COLORS[type]) return COLORS[type];
    const ct = getCustomType(type);
    if (ct && ct.color) return hexToColorObj(ct.color);
    return { main:'#8B8FA7', bg:'rgba(139,143,167,0.18)', g1:'rgba(139,143,167,0.35)', g2:'rgba(139,143,167,0.02)' };
}

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

function filterByType(type) {
    return loadData().filter(d => d.type === type || (d.additionalTypes && d.additionalTypes.some(at => at.type === type)));
}

function updateAnalytics() {
    const type = analyticsTypeEl.value;
    const isGeneral = type === 'Allgemein';
    const isKraft = type === 'Kraft';
    const isTechnik = type === 'Technik';
    const isJoggen = type === 'Joggen (5km)';
    const isTempo = type.startsWith('Tempolauf');
    const customType = getCustomType(type);
    analyticsIntGroup.style.display = (isTempo && !isGeneral && !isKraft && !isJoggen) ? '' : 'none';

    // Show/hide custom category filter for Technik and custom types with subcategories
    const showCustomCat = isTechnik || (customType && customType.subcategories && customType.subcategories.length);
    analyticsCustomCatGroup.style.display = showCustomCat ? '' : 'none';
    if (showCustomCat) populateAnalyticsCustomCat(type, customType);
    else analyticsCustomCatEl.value = 'all';

    // Show/hide stats rows
    document.getElementById('stats-row-general').style.display = isGeneral ? '' : 'none';
    document.getElementById('stats-row').style.display = (isGeneral || isKraft || isJoggen || isTechnik || customType) ? 'none' : '';
    document.getElementById('stats-row-ni').style.display = 'none';
    document.getElementById('stats-row-kraft').style.display = isKraft ? '' : 'none';
    document.getElementById('stats-row-technik').style.display = isTechnik ? '' : 'none';
    document.getElementById('stats-row-joggen').style.display = isJoggen ? '' : 'none';
    document.getElementById('stats-row-custom').style.display = customType ? '' : 'none';
    document.getElementById('pb-card').style.display = (isGeneral || isKraft || isJoggen || isTechnik || customType) ? 'none' : '';

    destroyAll();

    if (isGeneral) {
        updateGeneralStats();
        buildGeneralCharts();
        return;
    }

    if (isKraft) {
        const kraftData = filterByType('Kraft').sort((a,b) => a.date.localeCompare(b.date));
        updateKraftStats(kraftData);
        buildKraftCharts(kraftData);
        return;
    }

    if (isTechnik) {
        let technikData = filterByType('Technik').sort((a,b) => a.date.localeCompare(b.date));
        const techCatFilter = analyticsCustomCatEl.value;
        if (techCatFilter !== 'all') technikData = technikData.filter(d => {
            const cat = d.technikCategory === 'Sonstiges' && d.technikCustom ? d.technikCustom : (d.technikCategory || '');
            return cat === techCatFilter || d.technikCategory === techCatFilter;
        });
        updateTechnikStats(technikData);
        buildTechnikCharts(technikData);
        return;
    }

    if (isJoggen) {
        const joggenData = filterByType('Joggen (5km)').sort((a,b) => a.date.localeCompare(b.date));
        updateJoggenStats(joggenData);
        buildJoggenCharts(joggenData);
        return;
    }

    if (customType) {
        let ctData = filterByType(type).sort((a,b) => a.date.localeCompare(b.date));
        const ctCatFilter = analyticsCustomCatEl.value;
        if (ctCatFilter !== 'all') ctData = ctData.filter(d => d.customCategory === ctCatFilter);
        // Determine effective tracking settings (subcategory override when filtered)
        let effCt = { ...customType };
        if (ctCatFilter !== 'all') {
            const scOverride = scFindEntry(type, ctCatFilter);
            if (scOverride && typeof scOverride === 'object') {
                effCt = { ...customType, trackTimes: scOverride.trackTimes, trackCount: scOverride.trackCount, trackWeight: scOverride.trackWeight, trackDistance: scOverride.trackDistance };
            }
        }
        updateCustomTypeStats(ctData, effCt);
        buildCustomTypeCharts(ctData, effCt);
        return;
    }

    const intFilter = isTempo ? analyticsIntEl.value : 'all';
    const sprintCatFilter = (type === 'Sprint (50m)') ? analyticsSprintCatEl.value : 'all';
    const isNI = intFilter === 'NI';

    let data = filterByType(type);
    if (intFilter !== 'all') data = data.filter(d => d.intensity === intFilter);
    if (sprintCatFilter !== 'all') data = data.filter(d => d.sprintCategory === sprintCatFilter);
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
    const day = d.getDay() || 7; // Mon=1 ... Sun=7
    d.setDate(d.getDate() + 4 - day); // Thursday of this ISO week
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function getWeekKey(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay() || 7;
    d.setDate(d.getDate() + 4 - day); // Thursday → ISO year
    const y = d.getFullYear();
    const yearStart = new Date(y, 0, 1);
    const w = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return y + '-W' + String(w).padStart(2, '0');
}

function updateGeneralStats() {
    const $ = id => document.getElementById(id);
    const all = loadData();
    const season = getCurrentSeason();
    const seasonData = all.filter(d => d.date >= season.start && d.date <= season.end);
    const seasonTraining = seasonData.filter(d => d.type !== 'Pausetag');
    const seasonPause = seasonData.filter(d => d.type === 'Pausetag');

    $('stat-gen-season').textContent = season.label;
    $('stat-gen-total').textContent = seasonTraining.length;
    $('stat-gen-total-all').textContent = all.filter(d => d.type !== 'Pausetag').length;
    $('stat-gen-pause').textContent = seasonPause.length;

    // Avg per week (from tracking start)
    const weeklyData = seasonTraining.filter(d => d.date >= WEEKLY_TRACK_START);
    if (weeklyData.length) {
        const trackStart = new Date(WEEKLY_TRACK_START + 'T00:00:00');
        const now = new Date();
        const diffWeeks = Math.max(1, Math.ceil((now - trackStart) / (7 * 86400000)));
        $('stat-gen-weekly').textContent = (weeklyData.length / diffWeeks).toFixed(1);
    } else {
        $('stat-gen-weekly').textContent = '--';
    }

    // Current weekly streak: consecutive weeks with at least 1 training session (excl. Pausetag)
    const trainingAll = all.filter(d => d.type !== 'Pausetag');
    if (trainingAll.length) {
        const sorted = [...trainingAll].sort((a, b) => b.date.localeCompare(a.date));
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

    // Last training session (excl. Pausetag)
    if (trainingAll.length) {
        const sorted = [...trainingAll].sort((a, b) => b.date.localeCompare(a.date));
        $('stat-gen-last').textContent = fmtDate(sorted[0].date);
    } else {
        $('stat-gen-last').textContent = '--';
    }
}

function buildGeneralCharts() {
    const container = getChartsContainer();
    const all = loadData().filter(d => d.type !== 'Pausetag');
    if (!all.length) return;

    const sorted = [...all].sort((a, b) => a.date.localeCompare(b.date));
    const season = getCurrentSeason();
    const seasonData = sorted.filter(d => d.date >= season.start && d.date <= season.end);

    const cGen = { main: '#B4A8FF', bg: 'rgba(180,168,255,0.18)', g1: 'rgba(180,168,255,0.35)', g2: 'rgba(180,168,255,0.02)' };

    // 1) Sessions per month (season)
    const c1 = makeChartCard(t('chart_monthly_season', {label: season.label}), t('chart_tag_bar'), 'ch-gen-monthly', false);
    container.appendChild(c1);
    drawGenMonthly(seasonData, cGen);

    // 2) Sessions per type (pie)
    const c2 = makeChartCard(t('chart_type_dist'), t('chart_tag_pie'), 'ch-gen-type-pie', false);
    container.appendChild(c2);
    drawGenTypePie(seasonData);

    // 3) Weekly frequency over time
    const c3 = makeChartCard(t('chart_weekly_season'), t('chart_tag_bar'), 'ch-gen-weekly', true);
    container.appendChild(c3);
    drawGenWeekly(seasonData, cGen);

    // 4) Weekday distribution
    const c4 = makeChartCard(t('chart_weekday'), t('chart_tag_bar'), 'ch-gen-weekday', false);
    container.appendChild(c4);
    drawGenWeekday(seasonData);

    // 5) Monthly comparison across seasons
    const c5 = makeChartCard(t('chart_monthly_all'), t('chart_tag_bar'), 'ch-gen-all-monthly', false);
    container.appendChild(c5);
    drawGenMonthly(sorted, { main: '#22D3C5', bg: 'rgba(34,211,197,0.18)', g1: 'rgba(34,211,197,0.35)', g2: 'rgba(34,211,197,0.02)' }, 'genAllMonthly');

    // 6) Intensity distribution (all Tempolauf in season)
    const tempoData = seasonData.filter(d => d.type.startsWith('Tempolauf') && d.intensity);
    if (tempoData.length) {
        const c6 = makeChartCard(t('chart_intensity_dist'), t('chart_tag_pie'), 'ch-gen-intensity', false);
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
        options: { ...BASE, scales: { ...BASE.scales, y: { ...BASE.scales.y, ticks: { ...BASE.scales.y.ticks, stepSize: 1 }, title: { display: true, text: t('axis_sessions'), color: '#555870', font: { size: 11 } } } } }
    });
}

function drawGenTypePie(data) {
    const ctx = document.getElementById('ch-gen-type-pie')?.getContext('2d');
    if (!ctx) return;
    if (!data.length) { chartInstances.genTypePie = emptyChart(ctx); return; }
    const types = {};
    data.forEach(d => {
        types[d.type] = (types[d.type] || 0) + 1;
        if (d.additionalTypes) d.additionalTypes.forEach(at => { types[at.type] = (types[at.type] || 0) + 1; });
    });
    const labels = Object.keys(types).map(translateType);
    const values = Object.values(types);
    const colors = Object.keys(types).map(l => getTypeColor(l).main);
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
        options: { ...BASE, scales: { ...BASE.scales, y: { ...BASE.scales.y, ticks: { ...BASE.scales.y.ticks, stepSize: 1 }, title: { display: true, text: t('axis_sessions'), color: '#555870', font: { size: 11 } } } } }
    });
}

function drawGenWeekday(data) {
    const ctx = document.getElementById('ch-gen-weekday')?.getContext('2d');
    if (!ctx) return;
    if (!data.length) { chartInstances.genWeekday = emptyChart(ctx); return; }
    const days = t('weekdays');
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
        options: { ...BASE, scales: { ...BASE.scales, y: { ...BASE.scales.y, ticks: { ...BASE.scales.y.ticks, stepSize: 1 }, title: { display: true, text: t('axis_sessions'), color: '#555870', font: { size: 11 } } } } }
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

    // Avg per week (from tracking start)
    const season = getCurrentSeason();
    const seasonKraft = data.filter(d => d.date >= WEEKLY_TRACK_START && d.date >= season.start && d.date <= season.end);
    if (seasonKraft.length) {
        const trackStart = new Date(WEEKLY_TRACK_START + 'T00:00:00');
        const now = new Date();
        const diffWeeks = Math.max(1, Math.ceil((now - trackStart) / (7 * 86400000)));
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
    const c1 = makeChartCard(t('chart_kraft_monthly'),t('chart_tag_bar'),'ch-kraft-monthly',false);
    container.appendChild(c1);
    drawKraftMonthly(data, cK);

    // 2) Exercise frequency (bar)
    const c2 = makeChartCard(t('chart_exercise_freq'),t('chart_tag_bar'),'ch-kraft-freq',false);
    container.appendChild(c2);
    drawKraftFrequency(data);

    // 3) Kniebeugen kg progression (use max kg for pyramid)
    const kbData = data.filter(d => {
        const kb = d.exercises?.kniebeugen;
        return kb && (kb.kg || (kb.pyramid && kb.pyramid.length));
    });
    if (kbData.length) {
        const c3 = makeChartCard(t('chart_kb_max'),t('chart_tag_line'),'ch-kraft-kb',false);
        container.appendChild(c3);
        drawKraftKbProgression(kbData);
    }

    // 4) Waden kg progression
    const wadenData = data.filter(d => d.exercises?.waden?.kg);
    if (wadenData.length) {
        const c4 = makeChartCard(t('chart_waden_kg'),t('chart_tag_line'),'ch-kraft-waden',false);
        container.appendChild(c4);
        drawKraftProgression(wadenData, 'waden', 'waden', {main:'#22D3C5', bg:'rgba(34,211,197,0.18)', g1:'rgba(34,211,197,0.35)', g2:'rgba(34,211,197,0.02)'});
    }

    // 5) Beuger kg progression
    const beugerData = data.filter(d => d.exercises?.beuger?.kg);
    if (beugerData.length) {
        const c5 = makeChartCard(t('chart_beuger_kg'),t('chart_tag_line'),'ch-kraft-beuger',false);
        container.appendChild(c5);
        drawKraftProgression(beugerData, 'beuger', 'beuger', {main:'#FBBF24', bg:'rgba(251,191,36,0.18)', g1:'rgba(251,191,36,0.35)', g2:'rgba(251,191,36,0.02)'});
    }

    // 5b) Hip Thrust kg progression
    const htData = data.filter(d => d.exercises?.hipthrust?.kg);
    if (htData.length) {
        const c5b = makeChartCard(t('chart_hipthrust_kg'),t('chart_tag_line'),'ch-kraft-hipthrust',false);
        container.appendChild(c5b);
        drawKraftProgression(htData, 'hipthrust', 'hipthrust', {main:'#E879F9', bg:'rgba(232,121,249,0.18)', g1:'rgba(232,121,249,0.35)', g2:'rgba(232,121,249,0.02)'});
    }

    // 6) Exercises per session trend
    const c6 = makeChartCard(t('chart_exercises_per'),t('chart_tag_line'),'ch-kraft-ex-trend',false);
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
        options:{...BASE, scales:{...BASE.scales, y:{...BASE.scales.y, ticks:{...BASE.scales.y.ticks,stepSize:1}, title:{display:true,text:t('axis_sessions'),color:'#555870',font:{size:11}}}}}
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
            x:{...BASE.scales.x, ticks:{...BASE.scales.x.ticks,stepSize:1}, title:{display:true,text:t('axis_count'),color:'#555870',font:{size:11}}},
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
        }}, scales:{...BASE.scales, y:{...BASE.scales.y, title:{display:true,text:t('axis_kg'),color:'#555870',font:{size:11}}}}}
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
        }}, scales:{...BASE.scales, y:{...BASE.scales.y, title:{display:true,text:t('axis_kg'),color:'#555870',font:{size:11}}}}}
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
        options:{...BASE, scales:{...BASE.scales, y:{...BASE.scales.y, ticks:{...BASE.scales.y.ticks,stepSize:1}, title:{display:true,text:t('axis_exercises'),color:'#555870',font:{size:11}}}}}
    });
}

// ================================================================
//  TECHNIK ANALYTICS
// ================================================================
function updateTechnikStats(data) {
    const $ = id => document.getElementById(id);
    $('stat-tech-sessions').textContent = data.length;
    if (!data.length) {
        $('stat-tech-fav').textContent = '--';
        $('stat-tech-weekly').textContent = '--';
        $('stat-tech-last').textContent = '--';
        return;
    }
    // Most frequent category
    const freq = {};
    data.forEach(d => {
        const cat = d.technikCategory || 'Unbekannt';
        freq[cat] = (freq[cat]||0) + 1;
    });
    const sorted = Object.entries(freq).sort((a,b) => b[1]-a[1]);
    $('stat-tech-fav').textContent = sorted[0][0];
    // Avg per week (from tracking start)
    const season = getCurrentSeason();
    const seasonData = data.filter(d => d.date >= WEEKLY_TRACK_START && d.date >= season.start && d.date <= season.end);
    if (seasonData.length) {
        const trackStart = new Date(WEEKLY_TRACK_START + 'T00:00:00');
        const now = new Date();
        const diffWeeks = Math.max(1, Math.ceil((now - trackStart) / (7 * 86400000)));
        $('stat-tech-weekly').textContent = (seasonData.length / diffWeeks).toFixed(1);
    } else {
        $('stat-tech-weekly').textContent = '--';
    }
    // Last session
    const last = [...data].sort((a,b) => b.date.localeCompare(a.date))[0];
    $('stat-tech-last').textContent = fmtDate(last.date);
}

function buildTechnikCharts(data) {
    const container = getChartsContainer();
    if (!data.length) return;
    const cT = COLORS['Technik'];

    // 1) Sessions per month
    const c1 = makeChartCard(t('chart_technik_monthly'),t('chart_tag_bar'),'ch-tech-monthly',false);
    container.appendChild(c1);
    const monthly = {};
    data.forEach(d => { const m = d.date.slice(0,7); monthly[m] = (monthly[m]||0) + 1; });
    const mLabels = Object.keys(monthly).sort();
    const mValues = mLabels.map(m => monthly[m]);
    chartInstances['ch-tech-monthly'] = new Chart(document.getElementById('ch-tech-monthly'), {
        type:'bar',
        data:{ labels:mLabels.map(m => { const [y,mo]=m.split('-'); return MONTH_NAMES_T()[parseInt(mo,10)-1]+' '+y.slice(2); }),
               datasets:[{ data:mValues, backgroundColor:cT.bg, borderColor:cT.main, borderWidth:1, borderRadius:4 }] },
        options:{...BASE, plugins:{...BASE.plugins,legend:{display:false}}, scales:{...BASE.scales, y:{...BASE.scales.y, beginAtZero:true, ticks:{...BASE.scales.y.ticks, stepSize:1}}}}
    });

    // 2) Category distribution (doughnut)
    const c2 = makeChartCard(t('chart_cat_dist'),t('chart_tag_pie'),'ch-tech-dist',false);
    container.appendChild(c2);
    const catFreq = {};
    data.forEach(d => {
        const label = d.technikCategory === 'Sonstiges' && d.technikCustom ? d.technikCustom : (d.technikCategory || 'Unbekannt');
        catFreq[label] = (catFreq[label]||0) + 1;
    });
    const catLabels = Object.keys(catFreq);
    const catValues = catLabels.map(k => catFreq[k]);
    const catColors = ['#FB923C','#B4A8FF','#22D3C5','#FBBF24','#F87171','#34D399'];
    chartInstances['ch-tech-dist'] = new Chart(document.getElementById('ch-tech-dist'), {
        type:'doughnut',
        data:{ labels:catLabels, datasets:[{ data:catValues, backgroundColor:catColors.slice(0,catLabels.length), borderWidth:0 }] },
        options:{ responsive:true, maintainAspectRatio:false, animation:{duration:400},
            plugins:{ legend:{ display:true, position:'bottom', labels:{ color:'#EAEDF3', font:{size:11,family:'Inter'}, padding:12 } } } }
    });
}

// ================================================================
//  CUSTOM TYPE ANALYTICS
// ================================================================
function updateCustomTypeStats(data, ct) {
    const $ = id => document.getElementById(id);
    $('stat-ct-icon').textContent = ct.emoji || '📌';
    $('stat-ct-sessions').textContent = data.length;
    if (!data.length) {
        $('stat-ct-fav').textContent = '--';
        $('stat-ct-weekly').textContent = '--';
        $('stat-ct-last').textContent = '--';
        return;
    }
    // Most frequent subcategory
    if (ct.subcategories && ct.subcategories.length) {
        const freq = {};
        data.forEach(d => {
            const cat = d.customCategory || 'Unbekannt';
            freq[cat] = (freq[cat]||0) + 1;
        });
        const sorted = Object.entries(freq).sort((a,b) => b[1]-a[1]);
        $('stat-ct-fav').textContent = sorted[0][0];
    } else {
        $('stat-ct-fav').textContent = '-';
    }
    // Avg per week
    const season = getCurrentSeason();
    const seasonData = data.filter(d => d.date >= WEEKLY_TRACK_START && d.date >= season.start && d.date <= season.end);
    if (seasonData.length) {
        const trackStart = new Date(WEEKLY_TRACK_START + 'T00:00:00');
        const now = new Date();
        const diffWeeks = Math.max(1, Math.ceil((now - trackStart) / (7 * 86400000)));
        $('stat-ct-weekly').textContent = (seasonData.length / diffWeeks).toFixed(1);
    } else {
        $('stat-ct-weekly').textContent = '--';
    }
    // Last session
    const last = [...data].sort((a,b) => b.date.localeCompare(a.date))[0];
    $('stat-ct-last').textContent = fmtDate(last.date);
}

function buildCustomTypeCharts(data, ct) {
    const container = getChartsContainer();
    if (!data.length) return;
    const cCol = getTypeColor(ct.name);

    // 1) Sessions per month
    const c1 = makeChartCard(t('chart_ct_monthly',{name:ct.name}),t('chart_tag_bar'),'ch-ct-monthly',false);
    container.appendChild(c1);
    const monthly = {};
    data.forEach(d => { const m = d.date.slice(0,7); monthly[m] = (monthly[m]||0) + 1; });
    const mLabels = Object.keys(monthly).sort();
    const mValues = mLabels.map(m => monthly[m]);
    chartInstances['ch-ct-monthly'] = new Chart(document.getElementById('ch-ct-monthly'), {
        type:'bar',
        data:{ labels:mLabels.map(m => { const [y,mo]=m.split('-'); return MONTH_NAMES_T()[parseInt(mo,10)-1]+' '+y.slice(2); }),
               datasets:[{ data:mValues, backgroundColor:cCol.bg, borderColor:cCol.main, borderWidth:1, borderRadius:4 }] },
        options:{...BASE, plugins:{...BASE.plugins,legend:{display:false}}, scales:{...BASE.scales, y:{...BASE.scales.y, beginAtZero:true, ticks:{...BASE.scales.y.ticks, stepSize:1}}}}
    });

    // 2) Category distribution (if subcategories)
    if (ct.subcategories && ct.subcategories.length) {
        const c2 = makeChartCard(t('chart_cat_dist'),t('chart_tag_pie'),'ch-ct-dist',false);
        container.appendChild(c2);
        const catFreq = {};
        data.forEach(d => {
            const label = d.customCategory || 'Unbekannt';
            catFreq[label] = (catFreq[label]||0) + 1;
        });
        const catLabels = Object.keys(catFreq);
        const catValues = catLabels.map(k => catFreq[k]);
        const catColors = ['#B4A8FF','#22D3C5','#FBBF24','#F87171','#FB923C','#34D399','#60A5FA','#E879F9'];
        chartInstances['ch-ct-dist'] = new Chart(document.getElementById('ch-ct-dist'), {
            type:'doughnut',
            data:{ labels:catLabels, datasets:[{ data:catValues, backgroundColor:catColors.slice(0,catLabels.length), borderWidth:0 }] },
            options:{ responsive:true, maintainAspectRatio:false, animation:{duration:400},
                plugins:{ legend:{ display:true, position:'bottom', labels:{ color:'#EAEDF3', font:{size:11,family:'Inter'}, padding:12 } } } }
        });
    }

    // 3) Best time trend (if tracking times)
    if (ct.trackTimes) {
        const withTimes = data.filter(d => d.times && d.times.length);
        if (withTimes.length) {
            const c3 = makeChartCard(t('chart_ct_best_time'),t('chart_tag_line'),'ch-ct-besttrend',false);
            container.appendChild(c3);
            const ctx3 = document.getElementById('ch-ct-besttrend')?.getContext('2d');
            if (ctx3) {
                const labels = withTimes.map(d => shortDate(d.date));
                const vals = withTimes.map(d => Math.min(...d.times));
                chartInstances['ch-ct-besttrend'] = new Chart(ctx3, {
                    type:'line',
                    data:{labels, datasets:[{data:vals, borderColor:cCol.main, backgroundColor:grad(ctx3,cCol),
                        borderWidth:2.5, pointBackgroundColor:cCol.main, pointRadius:3.5, fill:true, tension:0.35}]},
                    options:{...BASE, scales:{...BASE.scales, y:{...BASE.scales.y, title:{display:true,text:t('axis_seconds'),color:'#555870',font:{size:11}}}}}
                });
            }
        }
    }

    // 4) Count trend (if tracking count)
    if (ct.trackCount) {
        const withCount = data.filter(d => d.count && d.count > 0);
        if (withCount.length) {
            const c4 = makeChartCard(t('chart_ct_reps'),t('chart_tag_line'),'ch-ct-counttrend',false);
            container.appendChild(c4);
            const ctx4 = document.getElementById('ch-ct-counttrend')?.getContext('2d');
            if (ctx4) {
                const labels = withCount.map(d => shortDate(d.date));
                const vals = withCount.map(d => d.count);
                chartInstances['ch-ct-counttrend'] = new Chart(ctx4, {
                    type:'line',
                    data:{labels, datasets:[{data:vals, borderColor:cCol.main, backgroundColor:grad(ctx4,cCol),
                        borderWidth:2.5, pointBackgroundColor:cCol.main, pointRadius:3.5, fill:true, tension:0.35}]},
                    options:{...BASE, scales:{...BASE.scales, y:{...BASE.scales.y, beginAtZero:true, title:{display:true,text:t('axis_count'),color:'#555870',font:{size:11}}}}}
                });
            }
        }
    }

    // 5) Weight trend (if tracking weight)
    if (ct.trackWeight) {
        const withKg = data.filter(d => d.customKg && d.customKg > 0);
        if (withKg.length) {
            const c5 = makeChartCard(t('chart_ct_kg'),t('chart_tag_line'),'ch-ct-kgtrend',false);
            container.appendChild(c5);
            const ctx5 = document.getElementById('ch-ct-kgtrend')?.getContext('2d');
            if (ctx5) {
                const labels = withKg.map(d => shortDate(d.date));
                const vals = withKg.map(d => d.customKg);
                chartInstances['ch-ct-kgtrend'] = new Chart(ctx5, {
                    type:'line',
                    data:{labels, datasets:[{data:vals, borderColor:cCol.main, backgroundColor:grad(ctx5,cCol),
                        borderWidth:2.5, pointBackgroundColor:cCol.main, pointRadius:3.5, fill:true, tension:0.35}]},
                    options:{...BASE, scales:{...BASE.scales, y:{...BASE.scales.y, title:{display:true,text:t('axis_kg'),color:'#555870',font:{size:11}}}}}
                });
            }
        }
    }

    // 6) Distance trend (if tracking distance)
    if (ct.trackDistance) {
        const withDist = data.filter(d => d.distances && d.distances.length);
        if (withDist.length) {
            const c6 = makeChartCard(t('chart_ct_distance'),t('chart_tag_line'),'ch-ct-disttrend',false);
            container.appendChild(c6);
            const ctx6 = document.getElementById('ch-ct-disttrend')?.getContext('2d');
            if (ctx6) {
                const labels = withDist.map(d => shortDate(d.date));
                const vals = withDist.map(d => Math.max(...d.distances));
                chartInstances['ch-ct-disttrend'] = new Chart(ctx6, {
                    type:'line',
                    data:{labels, datasets:[{data:vals, borderColor:cCol.main, backgroundColor:grad(ctx6,cCol),
                        borderWidth:2.5, pointBackgroundColor:cCol.main, pointRadius:3.5, fill:true, tension:0.35}]},
                    options:{...BASE, scales:{...BASE.scales, y:{...BASE.scales.y, title:{display:true,text:t('axis_distance'),color:'#555870',font:{size:11}}}}}
                });
            }
        }
    }
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
        if (diff < -10) { tEl.textContent = t('trend_faster'); tEl.style.color = '#34D399'; }
        else if (diff > 10) { tEl.textContent = t('trend_slower'); tEl.style.color = '#F87171'; }
        else { tEl.textContent = t('trend_stable'); tEl.style.color = '#B4A8FF'; }
    } else { tEl.textContent = '--'; tEl.style.color = ''; }
    // Weekly avg (from tracking start)
    const season = getCurrentSeason();
    const seasonData = data.filter(d => d.date >= WEEKLY_TRACK_START && d.date >= season.start && d.date <= season.end);
    if (seasonData.length) {
        const trackStart = new Date(WEEKLY_TRACK_START + 'T00:00:00');
        const now = new Date();
        const diffWeeks = Math.max(1, Math.ceil((now - trackStart) / (7 * 86400000)));
        $('stat-jog-weekly').textContent = (seasonData.length / diffWeeks).toFixed(1) + t('per_week');
    } else { $('stat-jog-weekly').textContent = '--'; }
}

function buildJoggenCharts(data) {
    const container = getChartsContainer();
    if (!data.length) return;
    const cJ = COLORS['Joggen (5km)'];
    const withTime = data.filter(d => d.joggenTimeSec);

    // 1) Time trend
    if (withTime.length) {
        const c1 = makeChartCard(t('chart_joggen_trend'), t('chart_tag_line'), 'ch-jog-time', false);
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
                }}, scales: { ...BASE.scales, y: { ...BASE.scales.y, reverse: true, title: { display: true, text: t('axis_time_mmss'), color: '#555870', font: { size: 11 }},
                    ticks: { ...BASE.scales.y.ticks, callback: v => fmtJoggenTime(Math.round(v)) }
                }}}
            });
        }
    }

    // 2) Monthly sessions
    const c2 = makeChartCard(t('chart_joggen_monthly'), t('chart_tag_bar'), 'ch-jog-monthly', false);
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
            options: { ...BASE, scales: { ...BASE.scales, y: { ...BASE.scales.y, ticks: { ...BASE.scales.y.ticks, stepSize: 1 }, title: { display: true, text: t('axis_sessions'), color: '#555870', font: { size: 11 }}}}}
        });
    }

    // 3) Pace per km trend
    if (withTime.length) {
        const c3 = makeChartCard(t('chart_joggen_pace'), t('chart_tag_line'), 'ch-jog-pace', false);
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
                }}, scales: { ...BASE.scales, y: { ...BASE.scales.y, reverse: true, title: { display: true, text: t('axis_pace'), color: '#555870', font: { size: 11 }},
                    ticks: { ...BASE.scales.y.ticks, callback: v => fmtJoggenTime(Math.round(v)) }
                }}}
            });
        }
    }

    // 4) Monthly average time
    if (withTime.length) {
        const c4 = makeChartCard(t('chart_joggen_avg'), t('chart_tag_bar'), 'ch-jog-mavg', false);
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
                }}, scales: { ...BASE.scales, y: { ...BASE.scales.y, reverse: true, title: { display: true, text: t('axis_avg_time'), color: '#555870', font: { size: 11 }},
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
        if(diff<-0.1){tEl.textContent=t('trend_better');tEl.style.color='#34D399';}
        else if(diff>0.1){tEl.textContent=t('trend_slower');tEl.style.color='#F87171';}
        else{tEl.textContent=t('trend_stable');tEl.style.color='#FBBF24';}
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
    $('stat-ni-meters').textContent = (totalRuns * meters).toLocaleString(t('locale')) + 'm';
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
    const c1 = makeChartCard(t('chart_time_trend'),t('chart_tag_line'),'ch-best-trend',false);
    container.appendChild(c1);
    drawBestTrend(data, c);

    // 2) All times scatter
    const c2 = makeChartCard(t('chart_all_times'),'Scatter','ch-all-times',true);
    container.appendChild(c2);
    drawAllTimes(data, c);

    // 3) Monthly avg
    const c3 = makeChartCard(t('chart_monthly_avg'),t('chart_tag_bar'),'ch-monthly-avg',false);
    container.appendChild(c3);
    drawMonthlyAvg(data, c);

    // 4) Monthly best
    const c4 = makeChartCard(t('chart_monthly_best'),t('chart_tag_line'),'ch-monthly-best',false);
    container.appendChild(c4);
    drawMonthlyBest(data, c);

    // 5) Volume
    const c5 = makeChartCard(t('chart_volume'),t('chart_tag_bar'),'ch-volume',false);
    container.appendChild(c5);
    drawVolume(data, c);

    // 6) Distribution
    const c6 = makeChartCard(t('chart_histogram'),t('chart_tag_bar'),'ch-dist',false);
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
            scales:{...BASE.scales, y:{...BASE.scales.y, title:{display:true,text:t('axis_seconds'),color:'#555870',font:{size:11}}}}}
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
                y:{...BASE.scales.y, title:{display:true,text:t('axis_seconds'),color:'#555870',font:{size:11}}}
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
        }}, scales:{...BASE.scales, y:{...BASE.scales.y, title:{display:true,text:t('axis_avg_seconds'),color:'#555870',font:{size:11}}}}}
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
        }}, scales:{...BASE.scales, y:{...BASE.scales.y, title:{display:true,text:t('axis_best_time'),color:'#555870',font:{size:11}}}}}
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
            {label:t('legend_sessions'), data:sessions, backgroundColor:c.bg, borderColor:c.main, borderWidth:2, borderRadius:8},
            {label:t('legend_individual_runs'), data:runs, backgroundColor:'rgba(96,165,250,0.18)', borderColor:'#60A5FA', borderWidth:2, borderRadius:8}
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
            x:{...BASE.scales.x, title:{display:true,text:t('axis_seconds'),color:'#555870',font:{size:11}}},
            y:{...BASE.scales.y, title:{display:true,text:t('axis_frequency'),color:'#555870',font:{size:11}}, ticks:{...BASE.scales.y.ticks,stepSize:1}}
        }}
    });
}

// ================================================================
//  NI CHARTS (Count + Meters + Telemarks)
// ================================================================
function buildNICharts(data, c, meters) {
    const container = getChartsContainer();

    // 1) Count over time
    const c1 = makeChartCard(t('chart_ni_runs'),t('chart_tag_bar'),'ch-ni-count',false);
    container.appendChild(c1);
    drawNICount(data, c);

    // 2) Meters over time (count × meters)
    const c2 = makeChartCard(t('chart_ni_meters',{dist:meters}),t('chart_tag_bar'),'ch-ni-meters',false);
    container.appendChild(c2);
    drawNIMeters(data, c, meters);

    // 3) Monthly total runs
    const c3 = makeChartCard(t('chart_ni_runs_month'),t('chart_tag_bar'),'ch-ni-monthly',false);
    container.appendChild(c3);
    drawNIMonthly(data, c);

    // 4) Monthly total meters
    const c4 = makeChartCard(t('chart_ni_meters_month'),t('chart_tag_bar'),'ch-ni-monthly-meters',false);
    container.appendChild(c4);
    drawNIMonthlyMeters(data, c, meters);

    // 5) Telemarks over time
    const c5 = makeChartCard(t('chart_ni_tele'),t('chart_tag_bar'),'ch-ni-telemarks',false);
    container.appendChild(c5);
    drawNITelemarks(data, c);

    // 6) Monthly total telemarks
    const c6 = makeChartCard(t('chart_ni_tele_month'),t('chart_tag_bar'),'ch-ni-monthly-tm',false);
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
            callbacks:{label:ctx=>ctx.parsed.y+' '+t('runs_suffix'), afterBody:items=>{const n=notes[items[0]?.dataIndex]; return n?'📝 '+n:'';}}
        }}, scales:{...BASE.scales, y:{...BASE.scales.y, ticks:{...BASE.scales.y.ticks,stepSize:1}, title:{display:true,text:t('axis_count'),color:'#555870',font:{size:11}}}}}
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
            callbacks:{label:ctx=>ctx.parsed.y.toLocaleString(t('locale'))+'m', afterBody:items=>{const n=notes[items[0]?.dataIndex]; return n?'📝 '+n:'';}}
        }}, scales:{...BASE.scales, y:{...BASE.scales.y, title:{display:true,text:t('axis_meters'),color:'#555870',font:{size:11}}}}}
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
        options:{...BASE, scales:{...BASE.scales, y:{...BASE.scales.y, ticks:{...BASE.scales.y.ticks,stepSize:1}, title:{display:true,text:t('axis_total_runs'),color:'#555870',font:{size:11}}}}}
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
        options:{...BASE, scales:{...BASE.scales, y:{...BASE.scales.y, title:{display:true,text:t('axis_meters'),color:'#555870',font:{size:11}}}}}
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
            callbacks:{label:ctx=>ctx.parsed.y+' '+t('axis_telemarks'), afterBody:items=>{const n=notes[items[0]?.dataIndex]; return n?'📝 '+n:'';}}
        }}, scales:{...BASE.scales, y:{...BASE.scales.y, ticks:{...BASE.scales.y.ticks,stepSize:1}, title:{display:true,text:t('axis_telemarks'),color:'#555870',font:{size:11}}}}}
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
        options:{...BASE, scales:{...BASE.scales, y:{...BASE.scales.y, ticks:{...BASE.scales.y.ticks,stepSize:1}, title:{display:true,text:t('axis_telemarks'),color:'#555870',font:{size:11}}}}}
    });
}

// ================================================================
//  PB TABLE
// ================================================================
function drawPBTable(data) {
    const container = document.getElementById('pb-table-container');
    if(!data.length) { container.innerHTML='<p class="empty-chart-msg">' + t('no_data_available') + '</p>'; return; }
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
function shortDate(d) { return new Date(d+'T00:00:00').toLocaleDateString(t('locale'),{day:'2-digit',month:'2-digit'}); }
function groupByMonth(data) {
    const m={}; data.forEach(d=>{const k=d.date.slice(0,7); if(!m[k])m[k]=[]; m[k].push(d);}); return m;
}
function prettyMonth(ym) { const [y,m]=ym.split('-'); return MONTH_NAMES_T()[parseInt(m,10)-1]+' '+y.slice(2); }
function emptyChart(ctx) {
    return new Chart(ctx,{type:'bar',data:{labels:[t('no_data')],datasets:[{data:[0],backgroundColor:'rgba(255,255,255,0.03)'}]},
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
    populateCoachDiarySelect(users);

    const coachUserSelect = document.getElementById('coach-user-select');
    coachUserSelect.addEventListener('change', () => {
        const sel = coachUserSelect.value;
        if (sel && allData[sel]) renderCoachUserStats(sel, allData[sel]);
        else { document.getElementById('coach-stats-container').innerHTML = ''; document.getElementById('coach-charts-container').innerHTML = ''; destroyCoachCharts(); }
    });
}

function populateCoachUserSelect(users) {
    const sel = document.getElementById('coach-user-select');
    sel.innerHTML = '<option value="">-- ' + t('please_select') + ' --</option>' +
        users.map(u => `<option value="${escapeHtml(u)}">${escapeHtml(u.charAt(0).toUpperCase() + u.slice(1))}</option>`).join('');
}

function renderCoachRanking(users, allData) {
    const container = document.getElementById('coach-ranking');
    if (!users.length) { container.innerHTML = '<p class="empty-chart-msg">' + t('no_athletes') + '</p>'; return; }

    const season = getCurrentSeason();

    // Calculate stats per user
    const stats = users.map(u => {
        const entries = (allData[u] || []).filter(d => d.type !== 'Pausetag');
        const seasonEntries = entries.filter(d => d.date >= season.start && d.date <= season.end);
        const total = entries.length;
        const seasonTotal = seasonEntries.length;

        // Avg per week (from tracking start, matching individual analytics)
        let avgWeek = 0;
        const weeklyData = seasonEntries.filter(d => d.date >= WEEKLY_TRACK_START);
        if (weeklyData.length) {
            const trackStart = new Date(WEEKLY_TRACK_START + 'T00:00:00');
            const now = new Date();
            const diffWeeks = Math.max(1, Math.ceil((now - trackStart) / (7 * 86400000)));
            avgWeek = weeklyData.length / diffWeeks;
        }

        return { name: u, total, seasonTotal, avgWeek };
    });

    // Sort by total (absolute)
    const byTotal = [...stats].sort((a, b) => b.total - a.total);
    // Sort by avg per week
    const byAvg = [...stats].sort((a, b) => b.avgWeek - a.avgWeek);

    container.innerHTML = `
        <div class="coach-ranking-section">
            <h3>${t('total_sessions')}</h3>
            <div class="coach-ranking-list">
                ${byTotal.map((s, i) => `<div class="coach-rank-row">
                    <span class="pb-rank ${i===0?'gold':i===1?'silver':i===2?'bronze':'normal'}">${i+1}</span>
                    <span class="coach-rank-name">${escapeHtml(s.name.charAt(0).toUpperCase() + s.name.slice(1))}</span>
                    <span class="coach-rank-value">${s.total}</span>
                </div>`).join('')}
            </div>
        </div>
        <div class="coach-ranking-section" style="margin-top:16px">
            <h3>${t('avg_per_week_season', {label: season.label})}</h3>
            <div class="coach-ranking-list">
                ${byAvg.map((s, i) => `<div class="coach-rank-row">
                    <span class="pb-rank ${i===0?'gold':i===1?'silver':i===2?'bronze':'normal'}">${i+1}</span>
                    <span class="coach-rank-name">${escapeHtml(s.name.charAt(0).toUpperCase() + s.name.slice(1))}</span>
                    <span class="coach-rank-value">${s.avgWeek.toFixed(1)}</span>
                </div>`).join('')}
            </div>
        </div>
        <div class="coach-ranking-section" style="margin-top:16px">
            <h3>${t('sessions_season', {label: season.label})}</h3>
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
        statsContainer.innerHTML = '<div class="card"><p class="empty-chart-msg">' + t('no_entries_athlete') + '</p></div>';
        return;
    }

    const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);
    const season = getCurrentSeason();
    const training = entries.filter(d => d.type !== 'Pausetag');
    const sorted = [...training].sort((a, b) => a.date.localeCompare(b.date));
    const seasonData = sorted.filter(d => d.date >= season.start && d.date <= season.end);

    // Overall stats (excl. Pausetag, matching individual analytics)
    const total = training.length;
    const seasonTotal = seasonData.length;
    let avgWeek = '--';
    const weeklyData = seasonData.filter(d => d.date >= WEEKLY_TRACK_START);
    if (weeklyData.length) {
        const diffWeeks = Math.max(1, Math.ceil((new Date() - new Date(WEEKLY_TRACK_START + 'T00:00:00')) / (7 * 86400000)));
        avgWeek = (weeklyData.length / diffWeeks).toFixed(1);
    }

    // Type breakdown (excl. Pausetag)
    const types = {};
    training.forEach(d => {
        types[d.type] = (types[d.type] || 0) + 1;
        if (d.additionalTypes) d.additionalTypes.forEach(at => { types[at.type] = (types[at.type] || 0) + 1; });
    });
    const typeStr = Object.entries(types).map(([k, v]) => `${translateType(k)}: ${v}`).join(' · ');

    // Last session
    const lastEntry = [...entries].sort((a, b) => b.date.localeCompare(a.date))[0];
    const lastDate = lastEntry ? fmtDate(lastEntry.date) : '--';

    // Sprint PB
    const sprintEntries = entries.filter(d => (d.type === 'Sprint (50m)' || (d.additionalTypes && d.additionalTypes.some(at => at.type === 'Sprint (50m)'))) && d.times && d.times.length);
    const sprintPB = sprintEntries.length ? Math.min(...sprintEntries.flatMap(d => d.times)).toFixed(2) + 's' : '--';

    // Kraft stats
    const kraftEntries = entries.filter(d => d.type === 'Kraft' || (d.additionalTypes && d.additionalTypes.some(at => at.type === 'Kraft')));
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
                    <span class="stat-label">${t('stat_total')}</span>
                </div>
                <div class="stat-card accent-teal">
                    <span class="stat-icon">📅</span>
                    <span class="stat-value">${seasonTotal}</span>
                    <span class="stat-label">${t('stat_season')}</span>
                </div>
                <div class="stat-card accent-gold">
                    <span class="stat-icon">📆</span>
                    <span class="stat-value">${avgWeek}</span>
                    <span class="stat-label">${t('coach_avg_week')}</span>
                </div>
                <div class="stat-card accent-blue">
                    <span class="stat-icon">⏱️</span>
                    <span class="stat-value">${escapeHtml(sprintPB)}</span>
                    <span class="stat-label">${t('sprint_pb')}</span>
                </div>
                <div class="stat-card accent-green">
                    <span class="stat-icon">🏋️</span>
                    <span class="stat-value">${escapeHtml(maxKB)}</span>
                    <span class="stat-label">${t('max_kb_kg')}</span>
                </div>
                <div class="stat-card accent-red">
                    <span class="stat-icon">📋</span>
                    <span class="stat-value">${escapeHtml(lastDate)}</span>
                    <span class="stat-label">${t('stat_last_session')}</span>
                </div>
            </div>
            <p style="font-size:12px;color:var(--text-tertiary);margin-top:4px">${escapeHtml(typeStr)}</p>
        </div>`;

    // Charts
    const cPurple = {main:'#B4A8FF', bg:'rgba(180,168,255,0.18)', g1:'rgba(180,168,255,0.35)', g2:'rgba(180,168,255,0.02)'};
    const cTeal = {main:'#22D3C5', bg:'rgba(34,211,197,0.18)', g1:'rgba(34,211,197,0.35)', g2:'rgba(34,211,197,0.02)'};

    // Monthly sessions
    if (seasonData.length) {
        const c1 = makeChartCard(t('chart_coach_monthly',{name:displayName}), t('chart_tag_bar'), 'ch-coach-monthly', false);
        chartsContainer.appendChild(c1);
        const ctx1 = document.getElementById('ch-coach-monthly')?.getContext('2d');
        if (ctx1) {
            const g = groupByMonth(seasonData);
            const labels = Object.keys(g);
            coachChartInstances.coachMonthly = new Chart(ctx1, {
                type:'bar',
                data:{labels:labels.map(prettyMonth), datasets:[{data:labels.map(k=>g[k].length), backgroundColor:cPurple.bg, borderColor:cPurple.main, borderWidth:2, borderRadius:8, hoverBackgroundColor:cPurple.main}]},
                options:{...BASE, scales:{...BASE.scales, y:{...BASE.scales.y, ticks:{...BASE.scales.y.ticks,stepSize:1}, title:{display:true,text:t('axis_sessions'),color:'#555870',font:{size:11}}}}}
            });
        }
    }

    // Type distribution pie
    if (seasonData.length) {
        const c2 = makeChartCard(t('chart_coach_dist',{name:displayName}), t('chart_tag_pie'), 'ch-coach-types', false);
        chartsContainer.appendChild(c2);
        const ctx2 = document.getElementById('ch-coach-types')?.getContext('2d');
        if (ctx2) {
            const tMap = {};
            seasonData.forEach(d => {
                tMap[d.type] = (tMap[d.type] || 0) + 1;
                if (d.additionalTypes) d.additionalTypes.forEach(at => { tMap[at.type] = (tMap[at.type] || 0) + 1; });
            });
            const tLabels = Object.keys(tMap).map(translateType);
            const tValues = Object.values(tMap);
            const tColors = Object.keys(tMap).map(l => getTypeColor(l).main);
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
        const c3 = makeChartCard(t('chart_coach_sprint',{name:displayName}), t('chart_tag_line'), 'ch-coach-sprint', false);
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
                }}, scales:{...BASE.scales, y:{...BASE.scales.y, title:{display:true,text:t('axis_seconds'),color:'#555870',font:{size:11}}}}}
            });
        }
    }

    // KB progression
    const kbEntries = kraftEntries.filter(d => {
        const kb = d.exercises?.kniebeugen;
        return kb && (kb.kg || (kb.pyramid && kb.pyramid.length));
    }).sort((a,b) => a.date.localeCompare(b.date));
    if (kbEntries.length >= 2) {
        const c4 = makeChartCard(t('chart_coach_kb',{name:displayName}), t('chart_tag_line'), 'ch-coach-kb', false);
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
                }}, scales:{...BASE.scales, y:{...BASE.scales.y, title:{display:true,text:t('axis_kg'),color:'#555870',font:{size:11}}}}}
            });
        }
    }
}

// ================================================================
//  CUSTOM TRAINING TYPES MANAGEMENT
// ================================================================

const ctModal = document.getElementById('custom-types-modal');
const ctListEl = document.getElementById('custom-types-list');
let ctEditId = null;
let ctSelectedColor = '#B4A8FF';
let ctTrackTimes = true;
let ctTrackCount = false;
let ctTrackWeight = false;
let ctTrackDistance = false;

document.getElementById('btn-settings').addEventListener('click', () => {
    renderCustomTypesList();
    resetCtForm();
    // Set report week to current ISO week (Mo-So)
    const now = new Date();
    const tmp = new Date(now);
    const dow = tmp.getDay() || 7;
    tmp.setDate(tmp.getDate() + 4 - dow);
    const y = tmp.getFullYear();
    const yearStart = new Date(y, 0, 1);
    const wNum = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
    document.getElementById('report-week').value = y + '-W' + String(wNum).padStart(2, '0');
    // Default to first tab
    document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.settings-tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('.settings-tab[data-tab="tab-report"]').classList.add('active');
    document.getElementById('tab-report').classList.add('active');
    ctModal.classList.add('show');
    renderScList();
    updateScTypeOptions();
});

// Tab switching
document.querySelectorAll('.settings-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.settings-tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});

// ---- Weekly Report PDF ----
function parseWeekRange(weekVal) {
    const [wy, ww] = weekVal.split('-W').map(Number);
    const jan4 = new Date(wy, 0, 4);
    const dayOfWeek = jan4.getDay() || 7;
    const monday = new Date(jan4);
    monday.setDate(jan4.getDate() - dayOfWeek + 1 + (ww - 1) * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    return { start: fmt(monday), end: fmt(sunday), monday, sunday };
}

function typeEmoji(type) {
    const ct = getCustomType(type);
    if (ct) return ct.emoji || '';
    return {'Sprint (50m)':'','Tempolauf (120m)':'','Tempolauf (150m)':'','Kraft':'','Technik':'','Joggen (5km)':''}[type] || '';
}

document.getElementById('btn-send-report').addEventListener('click', () => {
    const weekVal = document.getElementById('report-week').value;
    if (!weekVal) { showToast(t('toast_select_week')); return; }
    generateWeeklyPDF(weekVal);
});

function generateWeeklyPDF(weekVal) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210, H = 297;
    const mg = 14; // margin
    const cw = W - 2 * mg; // content width
    let y = 0;

    // Colors
    const bg = [8, 9, 14];
    const cardBg = [17, 19, 24];
    const border = [40, 42, 50];
    const textCol = [234, 237, 243];
    const mutedCol = [139, 143, 167];
    const primary = [180, 168, 255];
    const accent = [34, 211, 197];

    // Background
    doc.setFillColor(...bg);
    doc.rect(0, 0, W, H, 'F');

    // Parse week
    const range = parseWeekRange(weekVal);
    const all = loadData();
    const week = all.filter(e => e.date >= range.start && e.date <= range.end);

    // ---- Header ----
    y = 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...primary);
    doc.text('TrainLytics', mg, y);
    doc.setFontSize(10);
    doc.setTextColor(...mutedCol);
    doc.text(t('pdf_report'), mg + 55, y);

    // User + Week badge
    y += 3;
    doc.setFontSize(9);
    doc.setTextColor(...mutedCol);
    const headerRight = (currentUser ? currentUser.charAt(0).toUpperCase() + currentUser.slice(1) : '') + '  |  ' + weekVal;
    doc.text(headerRight, W - mg, y, { align: 'right' });

    // Divider
    y += 4;
    doc.setDrawColor(...border);
    doc.setLineWidth(0.3);
    doc.line(mg, y, W - mg, y);

    // ---- Week Range ----
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...textCol);
    doc.text(fmtDate(range.start) + '  –  ' + fmtDate(range.end), mg, y);

    if (!week.length) {
        y += 14;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(...mutedCol);
        doc.text(t('pdf_no_training'), mg, y);
        doc.save('TrainLytics_' + weekVal + '.pdf');
        showToast(t('toast_pdf_done'));
        return;
    }

    // ---- Overview Cards ----
    y += 6;
    const pauseDays = week.filter(e => e.type === 'Pausetag').length;
    const training = week.filter(e => e.type !== 'Pausetag');
    const byType = {};
    training.forEach(e => {
        (byType[e.type] = byType[e.type] || []).push(e);
        if (e.additionalTypes) e.additionalTypes.forEach(at => {
            (byType[at.type] = byType[at.type] || []).push(e);
        });
    });
    const typeCount = Object.keys(byType).length;

    // All times across all timed types
    const allTimedEntries = training.filter(e => e.times && e.times.length);
    const allTimes = allTimedEntries.flatMap(e => e.times).filter(t => t > 0);
    const totalRuns = allTimes.length;
    const bestTime = totalRuns ? Math.min(...allTimes).toFixed(2) + 's' : '--';

    // Days trained
    const daysSet = new Set(training.map(e => e.date));

    const cards = [
        { label: t('pdf_sessions'), value: String(training.length), color: primary },
        { label: t('pdf_types'), value: String(typeCount), color: accent },
        { label: t('pdf_training_days'), value: String(daysSet.size) + '/7', color: [251, 191, 36] },
        { label: t('pdf_best_time'), value: bestTime, color: [52, 211, 153] },
    ];

    const cardW = (cw - 9) / 4;
    const cardH = 22;
    cards.forEach((c, i) => {
        const cx = mg + i * (cardW + 3);
        doc.setFillColor(...cardBg);
        doc.roundedRect(cx, y, cardW, cardH, 3, 3, 'F');
        // Top accent line
        doc.setFillColor(...c.color);
        doc.rect(cx + 4, y + 2, 12, 1.5, 'F');
        // Value
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...c.color);
        doc.text(c.value, cx + cardW / 2, y + 12, { align: 'center' });
        // Label
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...mutedCol);
        doc.text(c.label, cx + cardW / 2, y + 18, { align: 'center' });
    });

    y += cardH + 8;

    // Pausetage note
    if (pauseDays > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(251, 191, 36);
        doc.text('💤 ' + pauseDays + ' ' + (pauseDays > 1 ? t('pdf_pause_plural') : t('pdf_pause_single')), mg, y);
        y += 6;
    }

    // ---- Type Breakdown ----
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...textCol);
    doc.text(t('pdf_type_section'), mg, y);
    y += 5;

    // Type distribution bar
    const barH = 6;
    const barY = y;
    let barX = mg;
    const typeKeys = Object.keys(byType);
    const totalByType = typeKeys.reduce((s, k) => s + byType[k].length, 0);
    typeKeys.forEach(type => {
        const frac = byType[type].length / totalByType;
        const segW = cw * frac;
        const tc = getTypeColor(type);
        const hex = tc.main;
        const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
        doc.setFillColor(r, g, b);
        if (barX === mg) {
            doc.roundedRect(barX, barY, segW, barH, 2, 2, 'F');
        } else if (barX + segW >= W - mg - 0.5) {
            doc.roundedRect(barX, barY, segW, barH, 2, 2, 'F');
        } else {
            doc.rect(barX, barY, segW, barH, 'F');
        }
        barX += segW;
    });
    y += barH + 4;

    // Type legend + details
    typeKeys.forEach(type => {
        if (y > H - 40) {
            doc.addPage();
            doc.setFillColor(...bg);
            doc.rect(0, 0, W, H, 'F');
            y = 18;
        }

        const entries = byType[type];
        const tc = getTypeColor(type);
        const hex = tc.main;
        const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);

        // Card background
        const cardStartY = y;
        const detailLines = [];

        // Collect detail lines first to know card height
        if (type.startsWith('Sprint') || type.startsWith('Tempolauf') || (getCustomType(type) && getCustomType(type).trackTimes)) {
            const times = entries.flatMap(e => e.times || []).filter(t => t > 0);
            if (times.length) {
                detailLines.push(t('pdf_best') + ': ' + Math.min(...times).toFixed(2) + 's   |   Ø ' + (times.reduce((a,b)=>a+b,0)/times.length).toFixed(2) + 's   |   ' + times.length + ' ' + t('pdf_runs'));
            }
        }
        if (type === 'Kraft') {
            const exSet = new Set();
            entries.forEach(e => { if (e.exercises) Object.keys(e.exercises).forEach(k => exSet.add(k)); });
            if (exSet.size) detailLines.push(t('pdf_exercises') + ': ' + [...exSet].join(', '));
        }
        if (type === 'Joggen (5km)') {
            const jogTimes = entries.map(e => e.joggenTimeSec).filter(t => t > 0);
            if (jogTimes.length) {
                const best = Math.min(...jogTimes);
                detailLines.push(t('pdf_best') + ': ' + Math.floor(best/60) + ':' + String(best%60).padStart(2,'0') + ' min');
            }
        }
        if (type === 'Technik') {
            const cats = entries.map(e => e.technikCategory).filter(Boolean);
            if (cats.length) detailLines.push(t('pdf_categories') + ': ' + [...new Set(cats)].join(', '));
        }
        if (type === 'Sprint (50m)') {
            const cats = entries.map(e => e.sprintCategory).filter(Boolean);
            if (cats.length) detailLines.push(t('pdf_categories') + ': ' + [...new Set(cats)].join(', '));
        }
        const ct = getCustomType(type);
        if (ct && ct.subcategories && ct.subcategories.length) {
            const cats = entries.map(e => e.customCategory).filter(Boolean);
            if (cats.length) detailLines.push(t('pdf_categories') + ': ' + [...new Set(cats)].join(', '));
        }
        if (ct && ct.trackCount) {
            const counts = entries.map(e => e.count).filter(c => c > 0);
            if (counts.length) detailLines.push(t('pdf_avg_reps') + ': ' + (counts.reduce((a,b)=>a+b,0)/counts.length).toFixed(1));
        }
        if (ct && ct.trackWeight) {
            const kgs = entries.map(e => e.customKg).filter(k => k > 0);
            if (kgs.length) detailLines.push(t('pdf_max') + ': ' + Math.max(...kgs) + 'kg   |   Ø ' + (kgs.reduce((a,b)=>a+b,0)/kgs.length).toFixed(1) + 'kg');
        }
        if (ct && ct.trackDistance) {
            const dists = entries.flatMap(e => e.distances || []).filter(d => d > 0);
            if (dists.length) detailLines.push(t('pdf_best_distance') + ': ' + Math.max(...dists).toFixed(2) + 'm   |   Ø ' + (dists.reduce((a,b)=>a+b,0)/dists.length).toFixed(2) + 'm');
        }

        const rowH = 8 + detailLines.length * 5;
        doc.setFillColor(...cardBg);
        doc.roundedRect(mg, y, cw, rowH, 2, 2, 'F');

        // Color dot
        doc.setFillColor(r, g, b);
        doc.circle(mg + 6, y + 4, 2, 'F');

        // Type name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(r, g, b);
        doc.text(type, mg + 11, y + 5.5);

        // Count badge
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...mutedCol);
        doc.text(entries.length + 'x', W - mg - 4, y + 5.5, { align: 'right' });

        // Detail lines
        detailLines.forEach((line, li) => {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(...mutedCol);
            doc.text(line, mg + 11, y + 10 + li * 5);
        });

        y += rowH + 3;
    });

    // ---- Individual Sessions ----
    y += 3;
    if (y > H - 30) {
        doc.addPage();
        doc.setFillColor(...bg);
        doc.rect(0, 0, W, H, 'F');
        y = 18;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...textCol);
    doc.text(t('pdf_indiv_sessions'), mg, y);
    y += 5;

    const sorted = [...week].sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
    sorted.forEach(e => {
        if (y > H - 18) {
            doc.addPage();
            doc.setFillColor(...bg);
            doc.rect(0, 0, W, H, 'F');
            y = 18;
        }
        const tc = getTypeColor(e.type);
        const hex = tc.main;
        const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);

        doc.setFillColor(...cardBg);
        doc.roundedRect(mg, y, cw, 7, 1.5, 1.5, 'F');

        // Date
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...mutedCol);
        doc.text(fmtDate(e.date), mg + 3, y + 4.8);

        // Type
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(r, g, b);
        const typeLabel = e.type + ((e.additionalTypes && e.additionalTypes.length) ? ' + ' + e.additionalTypes.map(at => at.type).join(' + ') : '');
        doc.text(typeLabel, mg + 48, y + 4.8);

        // Times summary or detail
        let detail = '';
        const detailParts = [];
        if (e.times && e.times.length) detailParts.push(e.times.map(t => t.toFixed(2) + 's').join(', '));
        if (e.distances && e.distances.length) detailParts.push(e.distances.map(d => d.toFixed(2) + 'm').join(', '));
        if (e.joggenTimeSec) detailParts.push(Math.floor(e.joggenTimeSec/60) + ':' + String(e.joggenTimeSec%60).padStart(2,'0') + ' min');
        if (e.count) detailParts.push(e.count + ' ' + t('pdf_wdh'));
        if (e.customKg) detailParts.push(e.customKg + 'kg' + (e.customReps ? ' × ' + e.customReps + ' ' + t('pdf_wdh') : ''));
        detail = detailParts.join('  |  ');
        if (e.sprintCategory) detail = (e.sprintCategory + '  ' + detail).trim();
        if (e.technikCategory) detail = (e.technikCategory + '  ' + detail).trim();
        if (e.customCategory) detail = (e.customCategory + '  ' + detail).trim();

        if (detail) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.5);
            doc.setTextColor(...mutedCol);
            // Truncate if too long
            if (detail.length > 70) detail = detail.substring(0, 67) + '...';
            doc.text(detail, mg + 90, y + 4.8);
        }

        y += 8.5;
    });

    // ---- Notes section ----
    const notes = week.filter(e => e.notes && e.notes.trim());
    if (notes.length) {
        y += 4;
        if (y > H - 25) {
            doc.addPage();
            doc.setFillColor(...bg);
            doc.rect(0, 0, W, H, 'F');
            y = 18;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...textCol);
        doc.text(t('pdf_notes'), mg, y);
        y += 5;

        notes.forEach(e => {
            if (y > H - 14) {
                doc.addPage();
                doc.setFillColor(...bg);
                doc.rect(0, 0, W, H, 'F');
                y = 18;
            }
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(...mutedCol);
            const line = fmtDate(e.date) + ': ' + e.notes.trim();
            const split = doc.splitTextToSize(line, cw - 6);
            doc.text(split, mg + 3, y + 3);
            y += split.length * 3.5 + 2;
        });
    }

    // ---- Footer ----
    const pageCount = doc.internal.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(...mutedCol);
        doc.text(t('pdf_footer'), mg, H - 8);
        doc.text(t('pdf_page', {p: p, total: pageCount}), W - mg, H - 8, { align: 'right' });
    }

    doc.save('TrainLytics_' + weekVal + '.pdf');
    showToast(t('toast_pdf_done'));
}
document.getElementById('ct-modal-close').addEventListener('click', () => { ctModal.classList.remove('show'); });
ctModal.addEventListener('click', e => { if (e.target === ctModal) ctModal.classList.remove('show'); });

// Color picker
document.querySelectorAll('.ct-color-opt').forEach(el => {
    el.addEventListener('click', () => {
        document.querySelectorAll('.ct-color-opt').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
        ctSelectedColor = el.dataset.color;
    });
});

// Times toggle (independent)
document.getElementById('ct-times-yes').addEventListener('click', () => {
    ctTrackTimes = true;
    document.getElementById('ct-times-yes').classList.add('active');
    document.getElementById('ct-times-no').classList.remove('active');
});
document.getElementById('ct-times-no').addEventListener('click', () => {
    ctTrackTimes = false;
    document.getElementById('ct-times-no').classList.add('active');
    document.getElementById('ct-times-yes').classList.remove('active');
});

// Count toggle (independent)
document.getElementById('ct-count-yes').addEventListener('click', () => {
    ctTrackCount = true;
    document.getElementById('ct-count-yes').classList.add('active');
    document.getElementById('ct-count-no').classList.remove('active');
});
document.getElementById('ct-count-no').addEventListener('click', () => {
    ctTrackCount = false;
    document.getElementById('ct-count-no').classList.add('active');
    document.getElementById('ct-count-yes').classList.remove('active');
});

// Weight toggle (independent)
document.getElementById('ct-weight-yes').addEventListener('click', () => {
    ctTrackWeight = true;
    document.getElementById('ct-weight-yes').classList.add('active');
    document.getElementById('ct-weight-no').classList.remove('active');
});
document.getElementById('ct-weight-no').addEventListener('click', () => {
    ctTrackWeight = false;
    document.getElementById('ct-weight-no').classList.add('active');
    document.getElementById('ct-weight-yes').classList.remove('active');
});

// Distance toggle (independent)
document.getElementById('ct-distance-yes').addEventListener('click', () => {
    ctTrackDistance = true;
    document.getElementById('ct-distance-yes').classList.add('active');
    document.getElementById('ct-distance-no').classList.remove('active');
});
document.getElementById('ct-distance-no').addEventListener('click', () => {
    ctTrackDistance = false;
    document.getElementById('ct-distance-no').classList.add('active');
    document.getElementById('ct-distance-yes').classList.remove('active');
});

function resetCtForm() {
    ctEditId = null;
    updateScTypeOptions();
    document.getElementById('ct-name').value = '';
    document.getElementById('ct-emoji').value = '';
    document.getElementById('ct-subcategories').value = '';
    ctSelectedColor = '#B4A8FF';
    ctTrackTimes = true;
    ctTrackCount = false;
    ctTrackWeight = false;
    ctTrackDistance = false;
    document.querySelectorAll('.ct-color-opt').forEach(o => o.classList.remove('selected'));
    document.querySelector('.ct-color-opt[data-color="#B4A8FF"]').classList.add('selected');
    document.getElementById('ct-times-yes').classList.add('active');
    document.getElementById('ct-times-no').classList.remove('active');
    document.getElementById('ct-count-yes').classList.remove('active');
    document.getElementById('ct-count-no').classList.add('active');
    document.getElementById('ct-weight-yes').classList.remove('active');
    document.getElementById('ct-weight-no').classList.add('active');
    document.getElementById('ct-distance-yes').classList.remove('active');
    document.getElementById('ct-distance-no').classList.add('active');
    document.getElementById('ct-form-title').textContent = t('new_type');
    document.getElementById('ct-save').textContent = t('add_btn');
    document.getElementById('ct-cancel-edit').style.display = 'none';
}

document.getElementById('ct-cancel-edit').addEventListener('click', resetCtForm);

document.getElementById('ct-save').addEventListener('click', () => {
    const name = document.getElementById('ct-name').value.trim();
    const emoji = document.getElementById('ct-emoji').value.trim();
    const color = ctSelectedColor;
    const trackTimes = ctTrackTimes;
    const trackCount = ctTrackCount;
    const trackWeight = ctTrackWeight;
    const trackDistance = ctTrackDistance;
    const subcatsRaw = document.getElementById('ct-subcategories').value.trim();
    const subcategories = subcatsRaw ? subcatsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

    if (!name) { showToast(t('toast_enter_name')); return; }
    if (name.length > 30) { showToast(t('toast_name_long')); return; }

    // Check for reserved names
    const reserved = ['Sprint (50m)', 'Tempolauf (120m)', 'Tempolauf (150m)', 'Kraft', 'Technik', 'Joggen (5km)', 'Allgemein'];
    if (reserved.includes(name)) { showToast(t('toast_name_reserved')); return; }

    const list = [..._customTypes];

    if (ctEditId) {
        const idx = list.findIndex(ct => ct.id === ctEditId);
        if (idx >= 0) {
            if (list.some((ct, i) => i !== idx && ct.name === name)) { showToast(t('toast_name_taken')); return; }
            list[idx] = { ...list[idx], name, emoji, color, subcategories, trackTimes, trackCount, trackWeight, trackDistance };
        }
    } else {
        if (list.some(ct => ct.name === name)) { showToast(t('toast_name_taken')); return; }
        list.push({ id: generateId(), name, emoji, color, subcategories, trackTimes, trackCount, trackWeight, trackDistance });
    }

    saveCustomTypes(list);
    applyUserRestrictions(currentUser);
    renderCustomTypesList();
    resetCtForm();
    showToast(ctEditId ? t('toast_updated') : t('toast_added'));
});

function renderCustomTypesList() {
    if (!_customTypes.length) {
        ctListEl.innerHTML = '<p style="color:var(--text-tertiary);font-size:13px;text-align:center;padding:8px 0">' + t('no_custom_types') + '</p>';
        return;
    }
    ctListEl.innerHTML = _customTypes.map(ct => `
        <div class="ct-item">
            <div class="ct-item-info">
                <span class="ct-item-color" style="background:${escapeHtml(ct.color || '#8B8FA7')}"></span>
                <span class="ct-item-emoji">${escapeHtml(ct.emoji || '📌')}</span>
                <span class="ct-item-name">${escapeHtml(ct.name)}</span>
                ${ct.subcategories && ct.subcategories.length ? '<span class="ct-item-subs">' + ct.subcategories.length + t('cat_suffix') + '</span>' : ''}
                ${ct.trackTimes ? '<span class="ct-item-times">⏱️</span>' : ''}
                ${ct.trackCount ? '<span class="ct-item-times">🔢</span>' : ''}
                ${ct.trackWeight ? '<span class="ct-item-times">🏋️</span>' : ''}
                ${ct.trackDistance ? '<span class="ct-item-times">📏</span>' : ''}
            </div>
            <div class="ct-item-actions">
                <button class="btn-icon ct-edit-btn" data-ctid="${escapeHtml(ct.id)}" title="${t('edit_title')}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn-icon ct-del-btn" data-ctid="${escapeHtml(ct.id)}" title="${t('delete_title')}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                </button>
            </div>
        </div>`).join('');

    ctListEl.querySelectorAll('.ct-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const ct = _customTypes.find(c => c.id === btn.dataset.ctid);
            if (!ct) return;
            ctEditId = ct.id;
            document.getElementById('ct-name').value = ct.name;
            document.getElementById('ct-emoji').value = ct.emoji || '';
            document.getElementById('ct-subcategories').value = (ct.subcategories || []).join(', ');
            ctSelectedColor = ct.color || '#B4A8FF';
            ctTrackTimes = ct.trackTimes !== false;
            ctTrackCount = ct.trackCount === true;
            ctTrackWeight = ct.trackWeight === true;
            ctTrackDistance = ct.trackDistance === true;
            document.querySelectorAll('.ct-color-opt').forEach(o => {
                o.classList.toggle('selected', o.dataset.color === ctSelectedColor);
            });
            document.getElementById('ct-times-yes').classList.toggle('active', ctTrackTimes);
            document.getElementById('ct-times-no').classList.toggle('active', !ctTrackTimes);
            document.getElementById('ct-count-yes').classList.toggle('active', ctTrackCount);
            document.getElementById('ct-count-no').classList.toggle('active', !ctTrackCount);
            document.getElementById('ct-weight-yes').classList.toggle('active', ctTrackWeight);
            document.getElementById('ct-weight-no').classList.toggle('active', !ctTrackWeight);
            document.getElementById('ct-distance-yes').classList.toggle('active', ctTrackDistance);
            document.getElementById('ct-distance-no').classList.toggle('active', !ctTrackDistance);
            document.getElementById('ct-form-title').textContent = t('edit_type');
            document.getElementById('ct-save').textContent = t('save_btn');
            document.getElementById('ct-cancel-edit').style.display = '';
        });
    });

    ctListEl.querySelectorAll('.ct-del-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const ct = _customTypes.find(c => c.id === btn.dataset.ctid);
            if (!ct) return;
            if (!confirm(t('confirm_delete_type', {name: ct.name}))) return;
            const list = _customTypes.filter(c => c.id !== ct.id);
            saveCustomTypes(list);
            applyUserRestrictions(currentUser);
            renderCustomTypesList();
            resetCtForm();
            showToast(t('toast_deleted'));
        });
    });
}

// ================================================================
//  CUSTOM SUBCATEGORIES MANAGEMENT
// ================================================================
let scTrackTimes = false;
let scTrackCount = false;
let scTrackWeight = false;
let scTrackDistance = false;

function updateScTypeOptions() {
    const sel = document.getElementById('sc-type');
    const curVal = sel.value;
    const BUILT_IN = [
        {v:'Sprint (50m)', e:'⚡'}, {v:'Tempolauf (120m)', e:'🏃'}, {v:'Tempolauf (150m)', e:'🏃'},
        {v:'Kraft', e:'💪'}, {v:'Technik', e:'🎯'}, {v:'Joggen (5km)', e:'🏃‍♀️'}
    ];
    sel.innerHTML = BUILT_IN.map(bt => '<option value="' + escapeHtml(bt.v) + '">' + bt.e + ' ' + escapeHtml(bt.v) + '</option>').join('');
    _customTypes.forEach(ct => {
        const opt = document.createElement('option');
        opt.value = ct.name;
        opt.textContent = (ct.emoji || '📌') + ' ' + ct.name;
        sel.appendChild(opt);
    });
    if (curVal) sel.value = curVal;
}

function renderScList() {
    const scListEl = document.getElementById('sc-list');
    const allEntries = [];
    Object.entries(_customSubcategories).forEach(([type, subs]) => {
        subs.forEach(s => {
            const name = scEntryName(s);
            const icons = typeof s === 'object'
                ? (s.trackTimes ? '⏱️' : '') + (s.trackCount ? '🔢' : '') + (s.trackWeight ? '🏋️' : '') + (s.trackDistance ? '📏' : '')
                : '';
            allEntries.push({ type, name, icons });
        });
    });
    if (!allEntries.length) {
        scListEl.innerHTML = '<p style="color:var(--text-tertiary);font-size:13px;text-align:center;padding:4px 0">' + t('no_custom_subcats') + '</p>';
        return;
    }
    scListEl.innerHTML = allEntries.map(e => `
        <div class="ct-item" style="padding:6px 8px">
            <div class="ct-item-info">
                <span class="ct-item-name" style="font-size:12px">${escapeHtml(e.type)}</span>
                <span class="ct-item-subs" style="margin-left:6px">${escapeHtml(e.name)}</span>
                ${e.icons ? '<span class="ct-item-times" style="margin-left:4px">' + e.icons + '</span>' : ''}
            </div>
            <button class="btn-icon sc-del-btn" data-type="${escapeHtml(e.type)}" data-name="${escapeHtml(e.name)}" title="${t('remove_label')}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
        </div>`).join('');

    scListEl.querySelectorAll('.sc-del-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            const name = btn.dataset.name;
            const data = { ..._customSubcategories };
            if (data[type]) {
                data[type] = data[type].filter(s => scEntryName(s) !== name);
                if (!data[type].length) delete data[type];
            }
            saveCustomSubcategories(data);
            renderScList();
            showToast(t('toast_removed'));
        });
    });
}

function resetScForm() {
    scTrackTimes = false; scTrackCount = false; scTrackWeight = false; scTrackDistance = false;
    document.getElementById('sc-name').value = '';
    document.getElementById('sc-times-yes').classList.remove('active');
    document.getElementById('sc-times-no').classList.add('active');
    document.getElementById('sc-count-yes').classList.remove('active');
    document.getElementById('sc-count-no').classList.add('active');
    document.getElementById('sc-weight-yes').classList.remove('active');
    document.getElementById('sc-weight-no').classList.add('active');
    document.getElementById('sc-distance-yes').classList.remove('active');
    document.getElementById('sc-distance-no').classList.add('active');
}

// SC tracking toggles
document.getElementById('sc-times-yes').addEventListener('click', () => {
    scTrackTimes = true;
    document.getElementById('sc-times-yes').classList.add('active');
    document.getElementById('sc-times-no').classList.remove('active');
});
document.getElementById('sc-times-no').addEventListener('click', () => {
    scTrackTimes = false;
    document.getElementById('sc-times-no').classList.add('active');
    document.getElementById('sc-times-yes').classList.remove('active');
});
document.getElementById('sc-count-yes').addEventListener('click', () => {
    scTrackCount = true;
    document.getElementById('sc-count-yes').classList.add('active');
    document.getElementById('sc-count-no').classList.remove('active');
});
document.getElementById('sc-count-no').addEventListener('click', () => {
    scTrackCount = false;
    document.getElementById('sc-count-no').classList.add('active');
    document.getElementById('sc-count-yes').classList.remove('active');
});
document.getElementById('sc-weight-yes').addEventListener('click', () => {
    scTrackWeight = true;
    document.getElementById('sc-weight-yes').classList.add('active');
    document.getElementById('sc-weight-no').classList.remove('active');
});
document.getElementById('sc-weight-no').addEventListener('click', () => {
    scTrackWeight = false;
    document.getElementById('sc-weight-no').classList.add('active');
    document.getElementById('sc-weight-yes').classList.remove('active');
});

// SC Distance toggle
document.getElementById('sc-distance-yes').addEventListener('click', () => {
    scTrackDistance = true;
    document.getElementById('sc-distance-yes').classList.add('active');
    document.getElementById('sc-distance-no').classList.remove('active');
});
document.getElementById('sc-distance-no').addEventListener('click', () => {
    scTrackDistance = false;
    document.getElementById('sc-distance-no').classList.add('active');
    document.getElementById('sc-distance-yes').classList.remove('active');
});

document.getElementById('sc-add').addEventListener('click', () => {
    const type = document.getElementById('sc-type').value;
    const name = document.getElementById('sc-name').value.trim();
    if (!name) { showToast(t('toast_enter_name')); return; }
    if (name.length > 30) { showToast(t('toast_name_too_long')); return; }
    const data = { ..._customSubcategories };
    if (!data[type]) data[type] = [];
    if (scEntryNames(type).includes(name)) { showToast(t('toast_exists')); return; }
    data[type].push({ name, trackTimes: scTrackTimes, trackCount: scTrackCount, trackWeight: scTrackWeight, trackDistance: scTrackDistance });
    saveCustomSubcategories(data);
    resetScForm();
    renderScList();
    showToast(t('toast_added'));
});

// Subcategory tracking override for custom-category dropdown
document.getElementById('custom-category').addEventListener('change', () => {
    const type = document.getElementById('training-type').value;
    const cat = document.getElementById('custom-category').value;
    const isTempo = type.startsWith('Tempolauf');
    const isKraft = type === 'Kraft';
    const isJoggen = type === 'Joggen (5km)';
    // Don't override for types with specialized form handling
    if (isTempo || isKraft || isJoggen) return;
    const entry = cat ? scFindEntry(type, cat) : null;
    if (entry && typeof entry === 'object') {
        timesContainer.style.display = entry.trackTimes ? '' : 'none';
        countContainer.style.display = entry.trackCount ? '' : 'none';
        document.getElementById('ct-kg-container').style.display = entry.trackWeight ? '' : 'none';
        distanceContainer.style.display = entry.trackDistance ? '' : 'none';
        if (entry.trackCount) document.querySelector('label[for="training-count"]').textContent = t('count_prefix');
    } else if (!cat) {
        // Revert to type defaults
        const customType = getCustomType(type);
        if (customType) {
            timesContainer.style.display = customType.trackTimes ? '' : 'none';
            countContainer.style.display = customType.trackCount ? '' : 'none';
            document.getElementById('ct-kg-container').style.display = customType.trackWeight ? '' : 'none';
            distanceContainer.style.display = customType.trackDistance ? '' : 'none';
        }
    }
});

// ================================================================
//  MULTI-TYPE TRAINING SESSIONS
// ================================================================
let _additionalTypeIndex = 0;

function showAddTypeButton() {
    const btn = document.getElementById('add-type-btn');
    const mainType = document.getElementById('training-type').value;
    btn.style.display = (mainType && mainType !== 'Pausetag') ? '' : 'none';
}

document.getElementById('training-type').addEventListener('change', showAddTypeButton);

document.getElementById('add-type-btn').addEventListener('click', () => {
    _additionalTypeIndex++;
    const idx = _additionalTypeIndex;
    const container = document.getElementById('additional-types-container');
    const section = document.createElement('div');
    section.className = 'additional-type-section';
    section.dataset.idx = idx;
    section.innerHTML = `
        <div class="additional-type-header">
            <span class="additional-type-label">${t('additional_type')}</span>
            <button type="button" class="btn-icon btn-remove-additional" title="${t('remove_label')}">&times;</button>
        </div>
        <div class="form-group">
            <label>${t('type_label')}</label>
            <select class="at-type" data-idx="${idx}">
                <option value="">-- ${t('please_select')} --</option>
            </select>
        </div>
        <div class="at-cat-group" style="display:none">
            <div class="form-group">
            <label>${t('category_label')}</label>
                <select class="at-category"></select>
            </div>
        </div>
    `;
    container.appendChild(section);

    // Populate type selector (exclude already selected types and Pausetag)
    const usedTypes = getUsedTypes();
    const typeSel = section.querySelector('.at-type');
    const allTypes = ['Sprint (50m)', 'Tempolauf (120m)', 'Tempolauf (150m)', 'Kraft', 'Technik'];
    if (currentUser && currentUser.toLowerCase() !== ANGELIKA_NAME) {
        allTypes.forEach(t => {
            if (!usedTypes.includes(t)) {
                typeSel.insertAdjacentHTML('beforeend', '<option value="' + escapeHtml(t) + '">' + escapeHtml(t) + '</option>');
            }
        });
        _customTypes.forEach(ct => {
            if (!usedTypes.includes(ct.name)) {
                typeSel.insertAdjacentHTML('beforeend', '<option value="' + escapeHtml(ct.name) + '">' + escapeHtml(ct.name) + '</option>');
            }
        });
    }

    // Type change handler for additional type
    typeSel.addEventListener('change', () => {
        const val = typeSel.value;
        const catGroup = section.querySelector('.at-cat-group');
        const catSel = section.querySelector('.at-category');
        let options = [];

        if (val === 'Sprint (50m)') {
            const builtIn = ['Locker', 'Sub-Max', 'Max', 'Seil'];
            const custom = scEntryNames('Sprint (50m)');
            options = [...builtIn, ...custom];
        } else if (val === 'Technik') {
            const builtIn = ['Hütchen', 'Schirm'];
            const custom = scEntryNames('Technik');
            options = [...builtIn, ...custom, 'Sonstiges'];
        } else {
            const ct = getCustomType(val);
            if (ct && ct.subcategories && ct.subcategories.length) {
                const extended = scEntryNames(val).filter(s => !ct.subcategories.includes(s));
                options = [...ct.subcategories, ...extended];
            } else {
                const custom = scEntryNames(val);
                if (custom.length) options = custom;
            }
        }

        if (options.length) {
            catSel.innerHTML = '<option value="">-- ' + t('please_select') + ' --</option>' +
                options.map(s => '<option value="' + escapeHtml(s) + '">' + escapeHtml(s) + '</option>').join('');
            catGroup.style.display = '';
        } else {
            catGroup.style.display = 'none';
            catSel.innerHTML = '';
        }
    });

    // Remove button
    section.querySelector('.btn-remove-additional').addEventListener('click', () => {
        section.remove();
    });
});

function getUsedTypes() {
    const used = [document.getElementById('training-type').value];
    document.querySelectorAll('.at-type').forEach(sel => {
        if (sel.value) used.push(sel.value);
    });
    return used;
}

function collectAdditionalTypes() {
    const result = [];
    document.querySelectorAll('.additional-type-section').forEach(section => {
        const type = section.querySelector('.at-type').value;
        if (!type) return;
        const catSel = section.querySelector('.at-category');
        const category = catSel ? catSel.value : '';
        result.push({ type, category });
    });
    return result;
}

function clearAdditionalTypes() {
    document.getElementById('additional-types-container').innerHTML = '';
    _additionalTypeIndex = 0;
    document.getElementById('add-type-btn').style.display = 'none';
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
      .set({ competitions: list }, { merge: true }).catch(e => {
        console.error('Fehler beim Speichern der Wettkämpfe:', e);
      });
}

async function loadCompetitionsFromFirestore(user) {
    try {
        let doc;
        try { doc = await db.collection('users').doc(user.toLowerCase().trim()).get({ source: 'server' }); }
        catch { doc = await db.collection('users').doc(user.toLowerCase().trim()).get(); }
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

    if (!name || !date || !time) { showToast(t('toast_comp_fill')); return; }
    if (!discs.length) { showToast(t('toast_comp_discipline')); return; }

    const list = loadCompetitions();
    list.push({ id: generateId(), name, date, time, disciplines: discs });
    list.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    saveCompetitions(list);
    wkModal.classList.remove('show');
    showToast(t('toast_comp_saved'));
    renderCalendar();
});

// ---- Delete Competition ----
let wkDelTarget = null;
function deleteCompetition(id) {
    const list = loadCompetitions().filter(w => w.id !== id);
    saveCompetitions(list);
    renderCalendar();
    showToast(t('toast_comp_deleted'));
}

// ---- Calendar Rendering ----
function renderCalendar() {
    const season = getCurrentSeason();
    document.getElementById('cal-season-label').textContent = t('season_label') + ' ' + season.label;

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
        const daysText = daysLeft === 0 ? t('today_text') : daysLeft === 1 ? t('tomorrow_text') : t('days_left', {n: daysLeft});
        countdownEl.innerHTML = `
            <div class="countdown-name">${escapeHtml(next.name)}</div>
            <div class="countdown-days">${daysText}</div>
            <div class="countdown-date">${escapeHtml(fmtDate(next.date))} · ${escapeHtml(next.time)} ${t('clock_suffix')}</div>
            <div class="countdown-discs">${next.disciplines.map(d => '<span class="wk-disc-tag">' + escapeHtml(d) + '</span>').join('')}</div>`;
    } else {
        countdownEl.innerHTML = '<span class="countdown-none">' + t('no_comp_planned') + '</span>';
    }

    // Build month grid (Sep to Aug)
    const calGrid = document.getElementById('cal-grid');
    calGrid.innerHTML = '';
    const startYear = parseInt(season.label.split('/')[0], 10);
    const months = [];
    for (let m = 8; m < 12; m++) months.push({ year: startYear, month: m });
    for (let m = 0; m < 8; m++) months.push({ year: startYear + 1, month: m });

    const dayNames = t('weekdays_cal');

    months.forEach(({ year, month }) => {
        const monthEl = document.createElement('div');
        monthEl.className = 'cal-month';
        const mLabel = MONTH_NAMES_T()[month] + ' ' + year;
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
            if (hasTrain) tooltip.push(t('cal_training'));
            if (hasWk) tooltip.push(t('cal_comp_prefix') + hasWk.map(w => w.name).join(', '));
            html += '<span class="' + cls + '"' + (tooltip.length ? ' title="' + escapeHtml(tooltip.join(' | ')) + '"' : '') + '>' + d + '</span>';
        }
        html += '</div>';
        monthEl.innerHTML = html;
        calGrid.appendChild(monthEl);
    });

    // Competition list
    const wkListEl = document.getElementById('wk-list');
    if (!competitions.length) {
        wkListEl.innerHTML = '<div class="empty-state"><p>' + t('no_competitions') + '</p></div>';
    } else {
        wkListEl.innerHTML = competitions.sort((a, b) => a.date.localeCompare(b.date)).map(w => {
            const isPast = w.date < today;
            return `<div class="wk-entry ${isPast ? 'wk-past' : ''}">
                <div class="wk-entry-header">
                    <div>
                        <div class="wk-entry-name">${escapeHtml(w.name)}</div>
                        <div class="wk-entry-date">${escapeHtml(fmtDate(w.date))} · ${escapeHtml(w.time)} ${t('clock_suffix')}</div>
                    </div>
                    <button class="btn-icon btn-del wk-del-btn" data-wkid="${escapeHtml(w.id)}" title="${escapeHtml(t('delete_btn'))}">
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
        let doc;
        try { doc = await db.collection('users').doc(user.toLowerCase().trim()).get({ source: 'server' }); }
        catch { doc = await db.collection('users').doc(user.toLowerCase().trim()).get(); }
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

    if (!date || !bodypart) { showToast(t('toast_injury_fill')); return; }

    const list = loadInjuries();
    list.push({ id: generateId(), date, bodypart, side: injurySide, pain, notes });
    list.sort((a, b) => b.date.localeCompare(a.date));
    saveInjuries(list);
    injuryModal.classList.remove('show');
    showToast(t('toast_injury_saved'));
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
        el.innerHTML = '<div class="empty-state"><p>' + t('no_diary_entries') + '</p></div>';
        statsCard.style.display = 'none';
        return;
    }

    el.innerHTML = list.map(inj => `
        <div class="injury-entry">
            <div class="injury-entry-header">
                <div class="injury-entry-info">
                    <span class="injury-bodypart">${escapeHtml(translateBody(inj.bodypart))}</span>
                    <span class="injury-side-tag">${escapeHtml(translateSide(inj.side))}</span>
                    <span class="injury-pain-badge" style="background:${painColor(inj.pain)}20;color:${painColor(inj.pain)}">${inj.pain}/10</span>
                </div>
                <button class="btn-icon btn-del injury-del-btn" data-injid="${escapeHtml(inj.id)}" title="${escapeHtml(t('delete_btn'))}">
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
            showToast(t('toast_injury_deleted'));
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
                <span class="injury-stat-label">${t('injury_total')}</span>
            </div>
            <div class="injury-stat">
                <span class="injury-stat-val" style="color:${painColor(Math.round(avgPain))}">${avgPain}</span>
                <span class="injury-stat-label">${t('injury_avg_pain')}</span>
            </div>
            <div class="injury-stat">
                <span class="injury-stat-val">${escapeHtml(translateBody(most[0]))}</span>
                <span class="injury-stat-label">${t('injury_most_frequent', {n: most[1]})}</span>
            </div>
        </div>
        <div class="injury-freq-bars">
            ${sorted.map(([part, count]) => `
                <div class="injury-freq-row">
                    <span class="injury-freq-label">${escapeHtml(translateBody(part))}</span>
                    <div class="injury-freq-bar-bg"><div class="injury-freq-bar-fill" style="width:${Math.round(count / sorted[0][1] * 100)}%"></div></div>
                    <span class="injury-freq-count">${count}</span>
                </div>`).join('')}
        </div>`;
}

// ================================================================
//  TRAININGSPLAN (COACH → ATHLETE)
// ================================================================

// Coach tab switching
document.querySelectorAll('[data-coachtab]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('[data-coachtab]').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.coach-tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const target = document.getElementById(btn.dataset.coachtab);
        if (target) target.classList.add('active');
    });
});

// Helper: get plans array from Firestore doc data (backward-compatible)
function getPlansFromData(data) {
    if (data.trainingPlans && Array.isArray(data.trainingPlans)) return data.trainingPlans;
    // Migrate single old trainingPlan to array
    if (data.trainingPlan && data.trainingPlan.weekStart) return [data.trainingPlan];
    return [];
}

// Coach: Save plan for a user (upserts by weekStart)
document.getElementById('btn-save-plan')?.addEventListener('click', async () => {
    const userSel = document.getElementById('plan-user-select');
    const user = userSel.value;
    const weekStart = document.getElementById('plan-week').value;
    const notes = document.getElementById('plan-notes').value.trim();

    if (!user || !weekStart) { showToast(t('toast_plan_select')); return; }

    const days = {};
    document.querySelectorAll('#plan-days .plan-day-row').forEach(row => {
        const day = row.dataset.day;
        const val = row.querySelector('.plan-day-input').value.trim();
        if (val) days[day] = val;
    });

    if (!Object.keys(days).length) { showToast(t('toast_plan_fill')); return; }

    const plan = { weekStart, days, notes, createdAt: new Date().toISOString() };
    const targets = user === '__alle__' ? _planUsers : [user];

    try {
        for (const u of targets) {
            const docRef = db.collection('users').doc(u.toLowerCase().trim());
            const snap = await docRef.get();
            let plans = snap.exists ? getPlansFromData(snap.data()) : [];
            // Upsert: replace existing plan for same weekStart, or add new
            const idx = plans.findIndex(p => p.weekStart === weekStart);
            if (idx >= 0) plans[idx] = plan; else plans.push(plan);
            plans.sort((a, b) => a.weekStart.localeCompare(b.weekStart));
            await docRef.set({ trainingPlans: plans, trainingPlan: null }, { merge: true });
        }
        showToast(targets.length > 1 ? t('toast_plan_assigned_multi', {n: targets.length}) : t('toast_plan_assigned'));
        // Reset form
        document.querySelectorAll('#plan-days .plan-day-input').forEach(inp => { inp.value = ''; });
        document.getElementById('plan-notes').value = '';
        document.getElementById('plan-week').value = '';
        document.getElementById('plan-current-info').style.display = 'none';
        // Refresh sent plans
        if (targets.length === 1) await renderCoachSentPlans(targets[0]);
        else await renderCoachSentPlansAll();
    } catch(e) {
        showToast(t('toast_plan_error'));
    }
});

// Coach: Load plans for selected athlete + show sent plans
let _coachPlanUser = '';
let _coachPlansCache = [];
document.getElementById('plan-user-select')?.addEventListener('change', async () => {
    const user = document.getElementById('plan-user-select').value;
    const infoEl = document.getElementById('plan-current-info');
    // Clear form
    document.querySelectorAll('#plan-days .plan-day-input').forEach(inp => { inp.value = ''; });
    document.getElementById('plan-week').value = '';
    document.getElementById('plan-notes').value = '';
    infoEl.style.display = 'none';
    document.getElementById('plan-sent-list').innerHTML = '';
    _coachPlanUser = '';
    _coachPlansCache = [];

    if (!user) return;
    _coachPlanUser = user;

    if (user === '__alle__') {
        await renderCoachSentPlansAll();
    } else {
        await renderCoachSentPlans(user);
    }
});

// Render sent plans for ALL athletes
async function renderCoachSentPlansAll() {
    const container = document.getElementById('plan-sent-list');
    const infoEl = document.getElementById('plan-current-info');
    const dayOrder = t('day_order');
    const dayShort = t('day_short');

    try {
        // Load plans from all users
        const allUserPlans = []; // { user, plan }
        for (const u of _planUsers) {
            const doc = await db.collection('users').doc(u.toLowerCase().trim()).get();
            const plans = doc.exists ? getPlansFromData(doc.data()) : [];
            plans.forEach(p => allUserPlans.push({ user: u, plan: p }));
        }

        if (!allUserPlans.length) {
            container.innerHTML = '';
            infoEl.innerHTML = '<span class="plan-info-badge">' + t('no_plans') + '</span>';
            infoEl.style.display = '';
            return;
        }
        infoEl.style.display = 'none';

        // Group by weekStart
        const byWeek = {};
        allUserPlans.forEach(({ user, plan }) => {
            const key = plan.weekStart;
            if (!byWeek[key]) byWeek[key] = [];
            byWeek[key].push({ user, plan });
        });

        // Sort weeks newest first
        const sortedWeeks = Object.keys(byWeek).sort((a, b) => b.localeCompare(a));

        container.innerHTML = sortedWeeks.map(ws => {
            const items = byWeek[ws];
            const expired = isPlanExpired(items[0].plan);
            const userCount = items.length;
            return `<div class="card glass-card">
                <div class="card-header">
                    <h2>${t('week_from_text', {date: escapeHtml(fmtDate(ws))})}</h2>
                    <div style="display:flex;align-items:center;gap:6px">
                        ${expired ? '<span class="card-badge" style="background:rgba(255,255,255,0.06);color:var(--text-muted)">' + t('expired') + '</span>' : '<span class="card-badge" style="background:rgba(52,211,153,0.12);color:#34D399">' + t('active') + '</span>'}
                    </div>
                </div>
                <div class="sent-plan-bulk-actions" style="display:flex;gap:8px;margin-bottom:12px;">
                    <button class="btn btn-small sent-plan-edit-week" data-ws="${escapeHtml(ws)}" title="${t('edit_all')}">${t('edit_all')}</button>
                    <button class="btn btn-small btn-danger sent-plan-del-week" data-ws="${escapeHtml(ws)}" title="${t('delete_all', {n: userCount})}">${t('delete_all', {n: userCount})}</button>
                </div>
                ${items.map(({ user, plan }) => {
                    const name = user.charAt(0).toUpperCase() + user.slice(1);
                    return `<div class="sent-plan-entry${expired ? ' sent-plan-expired' : ''}">
                        <div class="sent-plan-header">
                            <div>
                                <span class="sent-plan-user">${escapeHtml(name)}</span>
                            </div>
                            <div class="sent-plan-actions">
                                <button class="btn-icon sent-plan-edit-all" data-ws="${escapeHtml(plan.weekStart)}" data-user="${escapeHtml(user)}" title="${t('edit_title')}">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                                <button class="btn-icon sent-plan-del-all" data-ws="${escapeHtml(plan.weekStart)}" data-user="${escapeHtml(user)}" title="${t('delete_title')}">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                                </button>
                            </div>
                        </div>
                        <div class="sent-plan-days">
                            ${dayOrder.map(day => {
                                const val = plan.days[day];
                                if (!val) return '';
                                return `<div class="sent-plan-day"><span class="sent-plan-day-label">${dayShort[day]}</span><span>${escapeHtml(val)}</span></div>`;
                            }).join('')}
                        </div>
                        ${plan.notes ? '<div class="sent-plan-notes">' + escapeHtml(plan.notes) + '</div>' : ''}
                    </div>`;
                }).join('')}
            </div>`;
        }).join('');

        // Bulk edit: load first athlete's plan into form, keep "Alle Athleten" selected
        container.querySelectorAll('.sent-plan-edit-week').forEach(btn => {
            btn.addEventListener('click', () => {
                const ws = btn.dataset.ws;
                const items = byWeek[ws];
                if (!items || !items.length) return;
                const firstPlan = items[0].plan;
                // Keep "Alle Athleten" selected so saving will broadcast to all
                document.getElementById('plan-user-select').value = '__alle__';
                _coachPlanUser = '__alle__';
                // Fill form
                document.getElementById('plan-week').value = firstPlan.weekStart;
                document.getElementById('plan-notes').value = firstPlan.notes || '';
                document.querySelectorAll('#plan-days .plan-day-row').forEach(row => {
                    row.querySelector('.plan-day-input').value = firstPlan.days[row.dataset.day] || '';
                });
                const infoEl2 = document.getElementById('plan-current-info');
                infoEl2.innerHTML = `<span class="plan-info-badge">${t('editing_plan_all', {n: items.length})}</span>`;
                infoEl2.style.display = '';
                document.getElementById('coach-plan').scrollIntoView({ behavior: 'smooth' });
            });
        });

        // Bulk delete: remove plan for this week from ALL athletes
        container.querySelectorAll('.sent-plan-del-week').forEach(btn => {
            btn.addEventListener('click', async () => {
                const ws = btn.dataset.ws;
                const items = byWeek[ws];
                if (!items || !items.length) return;
                if (!confirm(t('confirm_delete_plan_all', {date: fmtDate(ws), n: items.length}))) return;
                try {
                    for (const { user } of items) {
                        const docRef = db.collection('users').doc(user.toLowerCase().trim());
                        const snap = await docRef.get();
                        let updatedPlans = snap.exists ? getPlansFromData(snap.data()) : [];
                        updatedPlans = updatedPlans.filter(p => p.weekStart !== ws);
                        await docRef.set({ trainingPlans: updatedPlans }, { merge: true });
                    }
                    showToast(t('plan_deleted_multi', {n: items.length}));
                    await renderCoachSentPlansAll();
                } catch {
                    showToast(t('toast_plan_delete_error'));
                }
            });
        });

        // Edit: load into form + switch select to that user
        container.querySelectorAll('.sent-plan-edit-all').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetUser = btn.dataset.user;
                const ws = btn.dataset.ws;
                const item = allUserPlans.find(x => x.user === targetUser && x.plan.weekStart === ws);
                if (!item) return;
                // Switch dropdown to specific user
                document.getElementById('plan-user-select').value = targetUser;
                _coachPlanUser = targetUser;
                // Fill form
                document.getElementById('plan-week').value = item.plan.weekStart;
                document.getElementById('plan-notes').value = item.plan.notes || '';
                document.querySelectorAll('#plan-days .plan-day-row').forEach(row => {
                    row.querySelector('.plan-day-input').value = item.plan.days[row.dataset.day] || '';
                });
                const infoEl2 = document.getElementById('plan-current-info');
                const name = targetUser.charAt(0).toUpperCase() + targetUser.slice(1);
                infoEl2.innerHTML = `<span class="plan-info-badge">${t('editing_plan_for', {name: escapeHtml(name)})}</span>`;
                infoEl2.style.display = '';
                document.getElementById('coach-plan').scrollIntoView({ behavior: 'smooth' });
            });
        });

        // Delete: remove from that specific user
        container.querySelectorAll('.sent-plan-del-all').forEach(btn => {
            btn.addEventListener('click', async () => {
                const targetUser = btn.dataset.user;
                const ws = btn.dataset.ws;
                const name = targetUser.charAt(0).toUpperCase() + targetUser.slice(1);
                if (!confirm(t('confirm_delete_plan', {date: fmtDate(ws), name: name}))) return;
                try {
                    const docRef = db.collection('users').doc(targetUser.toLowerCase().trim());
                    const snap = await docRef.get();
                    let updatedPlans = snap.exists ? getPlansFromData(snap.data()) : [];
                    updatedPlans = updatedPlans.filter(p => p.weekStart !== ws);
                    await docRef.set({ trainingPlans: updatedPlans }, { merge: true });
                    showToast(t('toast_plan_deleted'));
                    await renderCoachSentPlansAll();
                } catch {
                    showToast(t('toast_plan_delete_error'));
                }
            });
        });

    } catch {
        container.innerHTML = '';
    }
}

async function renderCoachSentPlans(user) {
    const container = document.getElementById('plan-sent-list');
    const infoEl = document.getElementById('plan-current-info');
    try {
        const doc = await db.collection('users').doc(user.toLowerCase().trim()).get();
        const plans = doc.exists ? getPlansFromData(doc.data()) : [];
        _coachPlansCache = plans;

        if (!plans.length) {
            container.innerHTML = '';
            infoEl.innerHTML = '<span class="plan-info-badge">' + t('no_plan_create') + '</span>';
            infoEl.style.display = '';
            return;
        }
        infoEl.style.display = 'none';
        plans.sort((a, b) => b.weekStart.localeCompare(a.weekStart));

        const dayOrder = t('day_order');
        const dayShort = t('day_short');
        const name = user.charAt(0).toUpperCase() + user.slice(1);

        container.innerHTML = `
            <div class="card glass-card">
                <div class="card-header"><h2>${t('sent_plans', {name: escapeHtml(name)})}</h2><span class="card-badge">${plans.length}</span></div>
                ${plans.map(p => {
                    const expired = isPlanExpired(p);
                    return `<div class="sent-plan-entry${expired ? ' sent-plan-expired' : ''}">
                        <div class="sent-plan-header">
                            <div>
                                <span class="sent-plan-week">${t('week_from_text', {date: escapeHtml(fmtDate(p.weekStart))})}</span>
                                ${expired ? '<span class="sent-plan-tag expired">' + t('expired') + '</span>' : '<span class="sent-plan-tag active">' + t('active') + '</span>'}
                            </div>
                            <div class="sent-plan-actions">
                                <button class="btn-icon sent-plan-edit" data-ws="${escapeHtml(p.weekStart)}" title="${t('edit_title')}">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                                <button class="btn-icon sent-plan-del" data-ws="${escapeHtml(p.weekStart)}" title="${t('delete_title')}">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                                </button>
                            </div>
                        </div>
                        <div class="sent-plan-days">
                            ${dayOrder.map(day => {
                                const val = p.days[day];
                                if (!val) return '';
                                return `<div class="sent-plan-day"><span class="sent-plan-day-label">${dayShort[day]}</span><span>${escapeHtml(val)}</span></div>`;
                            }).join('')}
                        </div>
                        ${p.notes ? '<div class="sent-plan-notes">' + escapeHtml(p.notes) + '</div>' : ''}
                    </div>`;
                }).join('')}
            </div>`;

        // Edit button → load into form
        container.querySelectorAll('.sent-plan-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const plan = plans.find(p => p.weekStart === btn.dataset.ws);
                if (!plan) return;
                document.getElementById('plan-week').value = plan.weekStart;
                document.getElementById('plan-notes').value = plan.notes || '';
                document.querySelectorAll('#plan-days .plan-day-row').forEach(row => {
                    row.querySelector('.plan-day-input').value = plan.days[row.dataset.day] || '';
                });
                infoEl.innerHTML = '<span class="plan-info-badge">' + t('editing_plan') + '</span>';
                infoEl.style.display = '';
                // Scroll to form top
                document.getElementById('coach-plan').scrollIntoView({ behavior: 'smooth' });
            });
        });

        // Delete button
        container.querySelectorAll('.sent-plan-del').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm(t('confirm_delete_plan_athlete', {date: fmtDate(btn.dataset.ws)}))) return;
                const ws = btn.dataset.ws;
                try {
                    const docRef = db.collection('users').doc(user.toLowerCase().trim());
                    const snap = await docRef.get();
                    let updatedPlans = snap.exists ? getPlansFromData(snap.data()) : [];
                    updatedPlans = updatedPlans.filter(p => p.weekStart !== ws);
                    await docRef.set({ trainingPlans: updatedPlans }, { merge: true });
                    showToast(t('toast_plan_deleted'));
                    await renderCoachSentPlans(user);
                } catch {
                    showToast(t('toast_plan_delete_error'));
                }
            });
        });
    } catch {
        container.innerHTML = '';
    }
}

// Populate plan user select alongside coach user select
let _planUsers = [];
function populatePlanUserSelect(users) {
    _planUsers = users;
    const sel = document.getElementById('plan-user-select');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- ' + t('please_select') + ' --</option>' +
        '<option value="__alle__">' + t('all_athletes_option') + '</option>' +
        users.map(u => `<option value="${escapeHtml(u)}">${escapeHtml(u.charAt(0).toUpperCase() + u.slice(1))}</option>`).join('');
}

// Populate coach diary user select
function populateCoachDiarySelect(users) {
    const sel = document.getElementById('coach-diary-user-select');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- ' + t('please_select') + ' --</option>' +
        users.map(u => `<option value="${escapeHtml(u)}">${escapeHtml(u.charAt(0).toUpperCase() + u.slice(1))}</option>`).join('');
}

// Coach: View athlete injury diary
document.getElementById('coach-diary-user-select')?.addEventListener('change', async () => {
    const user = document.getElementById('coach-diary-user-select').value;
    const container = document.getElementById('coach-diary-content');
    container.innerHTML = '';
    if (!user) return;

    try {
        const doc = await db.collection('users').doc(user.toLowerCase().trim()).get();
        const injuries = (doc.exists && doc.data().injuries) ? doc.data().injuries : [];

        if (!injuries.length) {
            container.innerHTML = '<div class="card glass-card"><div class="empty-state"><p>' + t('no_diary') + '</p></div></div>';
            return;
        }

        injuries.sort((a, b) => b.date.localeCompare(a.date));
        const name = user.charAt(0).toUpperCase() + user.slice(1);
        const freq = {};
        injuries.forEach(inj => { freq[inj.bodypart] = (freq[inj.bodypart] || 0) + 1; });
        const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
        const avgPain = (injuries.reduce((s, i) => s + i.pain, 0) / injuries.length).toFixed(1);

        container.innerHTML = `
            <div class="card glass-card">
                <div class="card-header"><h2>${t('diary_overview', {name: escapeHtml(name)})}</h2></div>
                <div class="injury-stats-grid">
                    <div class="injury-stat">
                        <span class="injury-stat-val">${injuries.length}</span>
                        <span class="injury-stat-label">${t('diary_entries_label')}</span>
                    </div>
                    <div class="injury-stat">
                        <span class="injury-stat-val" style="color:${painColor(Math.round(avgPain))}">${avgPain}</span>
                        <span class="injury-stat-label">${t('diary_avg_pain')}</span>
                    </div>
                    <div class="injury-stat">
                        <span class="injury-stat-val">${escapeHtml(translateBody(sorted[0][0]))}</span>
                        <span class="injury-stat-label">${t('diary_most_frequent', {n: sorted[0][1]})}</span>
                    </div>
                </div>
                <div class="injury-freq-bars" style="margin-top:12px">
                    ${sorted.map(([part, count]) => `
                        <div class="injury-freq-row">
                            <span class="injury-freq-label">${escapeHtml(translateBody(part))}</span>
                            <div class="injury-freq-bar-bg"><div class="injury-freq-bar-fill" style="width:${Math.round(count / sorted[0][1] * 100)}%"></div></div>
                            <span class="injury-freq-count">${count}</span>
                        </div>`).join('')}
                </div>
            </div>
            <div class="card glass-card">
                <div class="card-header"><h2>${t('diary_entries')}</h2></div>
                ${injuries.map(inj => `
                    <div class="injury-entry">
                        <div class="injury-entry-header">
                            <div class="injury-entry-info">
                                <span class="injury-bodypart">${escapeHtml(translateBody(inj.bodypart))}</span>
                                <span class="injury-side-tag">${escapeHtml(translateSide(inj.side))}</span>
                                <span class="injury-pain-badge" style="background:${painColor(inj.pain)}20;color:${painColor(inj.pain)}">${inj.pain}/10</span>
                            </div>
                        </div>
                        <div class="injury-date">${escapeHtml(fmtDate(inj.date))}</div>
                        ${inj.notes ? '<div class="injury-notes">' + escapeHtml(inj.notes) + '</div>' : ''}
                        <div class="injury-pain-bar"><div class="injury-pain-fill" style="width:${inj.pain * 10}%;background:${painColor(inj.pain)}"></div></div>
                    </div>`).join('')}
            </div>`;
    } catch {
        container.innerHTML = '<div class="card glass-card"><div class="empty-state"><p>' + t('diary_load_error') + '</p></div></div>';
    }
});

// Plan expiry helper
function isPlanExpired(plan) {
    if (!plan || !plan.weekStart) return true;
    const ws = new Date(plan.weekStart);
    const endOfWeek = new Date(ws);
    endOfWeek.setDate(ws.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return new Date() > endOfWeek;
}

// Athlete: Load and display assigned plans with week navigation
let _athletePlans = [];
let _athletePlanIdx = 0;

async function loadAndShowPlan() {
    if (!currentUser) return;
    const planCard = document.getElementById('plan-card');
    const planDisplay = document.getElementById('plan-display');

    try {
        const doc = await db.collection('users').doc(currentUser.toLowerCase().trim()).get();
        if (!doc.exists) { planCard.style.display = 'none'; return; }

        _athletePlans = getPlansFromData(doc.data());
        _athletePlans.sort((a, b) => a.weekStart.localeCompare(b.weekStart));

        if (!_athletePlans.length) { planCard.style.display = 'none'; return; }

        // Find the current/nearest upcoming week as default
        const today = new Date().toISOString().split('T')[0];
        let bestIdx = _athletePlans.length - 1;
        for (let i = 0; i < _athletePlans.length; i++) {
            if (_athletePlans[i].weekStart >= today) { bestIdx = i; break; }
            // Also show last non-expired plan
            if (!isPlanExpired(_athletePlans[i])) bestIdx = i;
        }
        _athletePlanIdx = bestIdx;

        planCard.style.display = '';
        renderAthletePlan();
    } catch {
        planCard.style.display = 'none';
    }
}

function renderAthletePlan() {
    const planDisplay = document.getElementById('plan-display');
    const indicator = document.getElementById('plan-week-indicator');
    const plan = _athletePlans[_athletePlanIdx];
    if (!plan) return;

    indicator.textContent = t('week_from_text', {date: fmtDate(plan.weekStart)});
    document.getElementById('plan-prev').style.visibility = _athletePlanIdx > 0 ? 'visible' : 'hidden';
    document.getElementById('plan-next').style.visibility = _athletePlanIdx < _athletePlans.length - 1 ? 'visible' : 'hidden';

    const dayOrder = t('day_order');
    const dayShort = t('day_short');

    planDisplay.innerHTML = `
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
}

document.getElementById('plan-prev')?.addEventListener('click', () => {
    if (_athletePlanIdx > 0) { _athletePlanIdx--; renderAthletePlan(); }
});
document.getElementById('plan-next')?.addEventListener('click', () => {
    if (_athletePlanIdx < _athletePlans.length - 1) { _athletePlanIdx++; renderAthletePlan(); }
});

// ================================================================
//  DATA CHAT (Rule-based)
// ================================================================
(function() {
    const chatBtn = document.getElementById('btn-chat');
    const popup = document.getElementById('chat-popup');
    const closeBtn = document.getElementById('chat-close');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const messagesEl = document.getElementById('chat-messages');

    if (!chatBtn || !popup) return;

    chatBtn.addEventListener('click', () => {
        const open = popup.style.display === 'flex';
        popup.style.display = open ? 'none' : 'flex';
        if (!open) {
            if (!messagesEl.children.length) {
                addBotMessage(t('chat_welcome'));
            }
            chatInput.focus();
        }
    });
    closeBtn.addEventListener('click', () => { popup.style.display = 'none'; });

    function addBotMessage(html) {
        const d = document.createElement('div');
        d.className = 'chat-msg bot';
        d.innerHTML = html;
        messagesEl.appendChild(d);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }
    function addUserMessage(text) {
        const d = document.createElement('div');
        d.className = 'chat-msg user';
        d.textContent = text;
        messagesEl.appendChild(d);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function buildSuggestionsHTML() {
        const keys = [
            'chat_q_total', 'chat_q_rest', 'chat_q_streak',
            'chat_q_types', 'chat_q_month', 'chat_q_pb'
        ];
        return '<div class="chat-suggestions-inline">' + keys.map(k =>
            `<button type="button" class="chat-suggestion">${t(k)}</button>`
        ).join('') + '</div>';
    }

    function bindSuggestionClicks(container) {
        container.querySelectorAll('.chat-suggestion').forEach(btn => {
            btn.addEventListener('click', () => { processQuery(btn.textContent); });
        });
    }

    chatForm.addEventListener('submit', e => {
        e.preventDefault();
        const q = chatInput.value.trim();
        if (!q) return;
        chatInput.value = '';
        processQuery(q);
    });

    function processQuery(q) {
        // Handle /ask command
        if (q.toLowerCase().replace(/\s/g, '') === '/ask') {
            addUserMessage(q);
            setTimeout(() => {
                const html = t('chat_ask_hint') + buildSuggestionsHTML();
                addBotMessage(html);
                bindSuggestionClicks(messagesEl.lastElementChild);
            }, 200);
            return;
        }

        addUserMessage(q);
        const answer = analyzeQuery(q);
        setTimeout(() => { addBotMessage(answer); }, 300);
    }

    function analyzeQuery(q) {
        const entries = loadData();
        const comps = _competitions || [];
        const injuries = _injuries || [];
        const ql = q.toLowerCase();

        // --- Rest days / Pause ---
        if (match(ql, ['pause', 'pauză', 'rest', 'frei', 'ruhetag', 'liber'])) {
            return answerRestDays(entries);
        }
        // --- Streak ---
        if (match(ql, ['streak', 'serie', 'hintereinander', 'în șir', 'reihe', 'consecutiv'])) {
            return answerStreak(entries);
        }
        // --- Total trainings ---
        if (match(ql, ['gesamt', 'total', 'insgesamt', 'wie viel', 'wie oft', 'câte', 'de câte ori', 'anzahl'])) {
            const typeMatch = detectType(ql, entries);
            if (typeMatch) return answerTypeCount(entries, typeMatch);
            return answerTotal(entries);
        }
        // --- Type distribution ---
        if (match(ql, ['verteilung', 'typ', 'art', 'distribuție', 'tipuri', 'types', 'aufteilu'])) {
            return answerTypeDistribution(entries);
        }
        // --- Month stats ---
        if (match(ql, ['monat', 'month', 'lună', 'luna', 'januar', 'februar', 'märz', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'dezember', 'ianuarie', 'februarie', 'martie', 'aprilie', 'iunie', 'iulie', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'])) {
            return answerMonthStats(entries, ql);
        }
        // --- This week ---
        if (match(ql, ['diese woche', 'săptămâna', 'this week', 'woche'])) {
            return answerThisWeek(entries);
        }
        // --- PB / Bestzeit / Sprint ---
        if (match(ql, ['pb', 'bestzeit', 'record', 'schnellst', 'fastest', 'cel mai rapid', 'best'])) {
            return answerPB(entries);
        }
        // --- Kraft / max KB ---
        if (match(ql, ['kraft', 'kniebeugen', 'kb', 'genuflexiuni', 'max kg', 'stärkst', 'gewicht'])) {
            return answerMaxKB(entries);
        }
        // --- Joggen ---
        if (match(ql, ['joggen', 'jog', 'laufen', 'alergat', '5km', '5 km'])) {
            return answerJoggen(entries);
        }
        // --- Injuries ---
        if (match(ql, ['verletzung', 'schmerz', 'injury', 'pain', 'durere', 'accidentare', 'weh'])) {
            return answerInjuries(injuries);
        }
        // --- Competition ---
        if (match(ql, ['wettkampf', 'competition', 'competiție', 'competitie', 'wk'])) {
            return answerCompetitions(comps);
        }
        // --- Last training ---
        if (match(ql, ['letzte', 'last', 'ultimul', 'ultima', 'zuletzt', 'recent'])) {
            return answerLast(entries);
        }
        // --- Average / per week ---
        if (match(ql, ['durchschnitt', 'average', 'pro woche', 'per week', 'medie', 'pe săptămână', 'ø'])) {
            return answerAvgPerWeek(entries);
        }
        // --- Intensity ---
        if (match(ql, ['intensität', 'intensity', 'intensitate', 'intensiv'])) {
            return answerIntensity(entries);
        }
        // --- Notes search ---
        if (match(ql, ['notiz', 'note', 'notă', 'notiță'])) {
            return answerNotes(entries, ql);
        }

        return t('chat_unknown');
    }

    function match(ql, keywords) {
        return keywords.some(k => ql.includes(k));
    }

    function detectType(ql, entries) {
        const types = {};
        entries.forEach(e => { if (e.type) types[e.type.toLowerCase()] = e.type; });
        for (const [lower, original] of Object.entries(types)) {
            if (ql.includes(lower)) return original;
        }
        if (ql.includes('sprint')) return Object.values(types).find(t => t.includes('Sprint')) || null;
        if (ql.includes('tempo')) return Object.values(types).find(t => t.includes('Tempolauf')) || null;
        if (ql.includes('kraft') || ql.includes('forță')) return 'Kraft';
        if (ql.includes('technik') || ql.includes('tehnică')) return 'Technik';
        if (ql.includes('joggen') || ql.includes('alergat')) return Object.values(types).find(t => t.includes('Joggen')) || null;
        if (ql.includes('pause') || ql.includes('pauză')) return 'Pausetag';
        return null;
    }

    // --- Answer functions ---

    function answerTotal(entries) {
        const real = entries.filter(e => e.type !== 'Pausetag');
        return t('chat_a_total', { n: '<span class="chat-stat">' + real.length + '</span>' });
    }

    function answerTypeCount(entries, type) {
        const c = entries.filter(e => e.type === type).length;
        return t('chat_a_type_count', {
            type: '<span class="chat-stat">' + translateType(type) + '</span>',
            n: '<span class="chat-stat">' + c + '</span>'
        });
    }

    function answerRestDays(entries) {
        const pauseCount = entries.filter(e => e.type === 'Pausetag').length;
        if (!entries.length) return t('chat_no_data');
        const dates = new Set(entries.map(e => e.date));
        const sorted = [...dates].sort();
        if (sorted.length < 2) return t('chat_a_rest', { n: '<span class="chat-stat">' + pauseCount + '</span>' });
        const first = new Date(sorted[0]);
        const last = new Date(sorted[sorted.length - 1]);
        const totalDays = Math.round((last - first) / 86400000) + 1;
        const daysOff = totalDays - dates.size;
        return t('chat_a_rest_full', {
            pause: '<span class="chat-stat">' + pauseCount + '</span>',
            off: '<span class="chat-stat">' + daysOff + '</span>',
            total: '<span class="chat-stat">' + totalDays + '</span>'
        });
    }

    function answerStreak(entries) {
        if (!entries.length) return t('chat_no_data');
        const dates = [...new Set(entries.filter(e => e.type !== 'Pausetag').map(e => e.date))].sort();
        let maxStreak = 1, current = 1;
        for (let i = 1; i < dates.length; i++) {
            const prev = new Date(dates[i - 1]);
            const curr = new Date(dates[i]);
            const diff = (curr - prev) / 86400000;
            if (diff === 1) { current++; maxStreak = Math.max(maxStreak, current); }
            else { current = 1; }
        }
        if (dates.length <= 1) maxStreak = dates.length;
        return t('chat_a_streak', { n: '<span class="chat-stat">' + maxStreak + '</span>' });
    }

    function answerTypeDistribution(entries) {
        const real = entries.filter(e => e.type !== 'Pausetag');
        if (!real.length) return t('chat_no_data');
        const counts = {};
        real.forEach(e => { counts[e.type] = (counts[e.type] || 0) + 1; });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const lines = sorted.map(([type, n]) => `• ${translateType(type)}: <span class="chat-stat">${n}</span>`);
        return t('chat_a_distribution') + '<br>' + lines.join('<br>');
    }

    function answerMonthStats(entries, ql) {
        const now = new Date();
        let month = now.getMonth();
        let year = now.getFullYear();
        const monthNames = {
            de: ['januar','februar','märz','april','mai','juni','juli','august','september','oktober','november','dezember'],
            ro: ['ianuarie','februarie','martie','aprilie','mai','iunie','iulie','august','septembrie','octombrie','noiembrie','decembrie']
        };
        const lang = getLang();
        (monthNames[lang] || monthNames.de).forEach((name, i) => {
            if (ql.includes(name)) month = i;
        });
        const otherLang = lang === 'de' ? 'ro' : 'de';
        monthNames[otherLang].forEach((name, i) => {
            if (ql.includes(name)) month = i;
        });
        const monthEntries = entries.filter(e => {
            if (!e.date) return false;
            const d = new Date(e.date);
            return d.getMonth() === month && d.getFullYear() === year && e.type !== 'Pausetag';
        });
        const mName = t('months')[month];
        return t('chat_a_month', {
            month: '<span class="chat-stat">' + mName + ' ' + year + '</span>',
            n: '<span class="chat-stat">' + monthEntries.length + '</span>'
        });
    }

    function answerThisWeek(entries) {
        const now = new Date();
        const dayOfWeek = now.getDay() || 7;
        const monday = new Date(now);
        monday.setDate(now.getDate() - dayOfWeek + 1);
        monday.setHours(0, 0, 0, 0);
        const count = entries.filter(e => {
            if (!e.date || e.type === 'Pausetag') return false;
            return new Date(e.date) >= monday;
        }).length;
        return t('chat_a_week', { n: '<span class="chat-stat">' + count + '</span>' });
    }

    function answerPB(entries) {
        const sprintEntries = entries.filter(e => e.type && e.type.includes('Sprint') && e.times && e.times.length);
        if (!sprintEntries.length) return t('chat_a_no_pb');
        let best = null;
        sprintEntries.forEach(e => {
            const min = Math.min(...e.times.filter(t => t > 0));
            if (min > 0 && (!best || min < best.time)) {
                best = { time: min, date: e.date, type: e.type };
            }
        });
        if (!best) return t('chat_a_no_pb');
        return t('chat_a_pb', {
            time: '<span class="chat-stat">' + best.time.toFixed(2) + 's</span>',
            type: translateType(best.type),
            date: '<span class="chat-stat">' + formatLocalDate(best.date) + '</span>'
        });
    }

    function answerMaxKB(entries) {
        const kraftEntries = entries.filter(e => e.type === 'Kraft' && e.exercises && e.exercises.kniebeugen);
        if (!kraftEntries.length) return t('chat_a_no_kb');
        let maxKg = 0, maxDate = '';
        kraftEntries.forEach(e => {
            const kb = e.exercises.kniebeugen;
            if (kb.pyramid && kb.pyramid.length) {
                kb.pyramid.forEach(s => { if (s.kg > maxKg) { maxKg = s.kg; maxDate = e.date; } });
            }
        });
        if (!maxKg) return t('chat_a_no_kb');
        return t('chat_a_kb', {
            kg: '<span class="chat-stat">' + maxKg + ' kg</span>',
            date: '<span class="chat-stat">' + formatLocalDate(maxDate) + '</span>'
        });
    }

    function answerJoggen(entries) {
        const jogs = entries.filter(e => e.type && e.type.includes('Joggen') && e.joggenTimeSec);
        if (!jogs.length) return t('chat_a_no_jog');
        const times = jogs.map(e => e.joggenTimeSec);
        const best = Math.min(...times);
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        const fmtTime = s => {
            const m = Math.floor(s / 60);
            const sec = Math.round(s % 60);
            return m + ':' + String(sec).padStart(2, '0');
        };
        return t('chat_a_jog', {
            n: '<span class="chat-stat">' + jogs.length + '</span>',
            best: '<span class="chat-stat">' + fmtTime(best) + '</span>',
            avg: '<span class="chat-stat">' + fmtTime(avg) + '</span>'
        });
    }

    function answerInjuries(injuries) {
        if (!injuries.length) return t('chat_a_no_injuries');
        const avgPain = (injuries.reduce((s, i) => s + (i.pain || 0), 0) / injuries.length).toFixed(1);
        const parts = {};
        injuries.forEach(i => { parts[i.bodypart] = (parts[i.bodypart] || 0) + 1; });
        const top = Object.entries(parts).sort((a, b) => b[1] - a[1])[0];
        return t('chat_a_injuries', {
            n: '<span class="chat-stat">' + injuries.length + '</span>',
            avg: '<span class="chat-stat">' + avgPain + '</span>',
            part: '<span class="chat-stat">' + translateBody(top[0]) + ' (' + top[1] + '×)</span>'
        });
    }

    function answerCompetitions(comps) {
        if (!comps.length) return t('chat_a_no_comp');
        const upcoming = comps.filter(c => new Date(c.date) >= new Date()).length;
        const past = comps.length - upcoming;
        return t('chat_a_comp', {
            total: '<span class="chat-stat">' + comps.length + '</span>',
            upcoming: '<span class="chat-stat">' + upcoming + '</span>',
            past: '<span class="chat-stat">' + past + '</span>'
        });
    }

    function answerLast(entries) {
        const real = entries.filter(e => e.type !== 'Pausetag');
        if (!real.length) return t('chat_no_data');
        const last = real.sort((a, b) => b.date.localeCompare(a.date))[0];
        return t('chat_a_last', {
            type: '<span class="chat-stat">' + translateType(last.type) + '</span>',
            date: '<span class="chat-stat">' + formatLocalDate(last.date) + '</span>'
        });
    }

    function answerAvgPerWeek(entries) {
        const real = entries.filter(e => e.type !== 'Pausetag');
        if (real.length < 2) return t('chat_no_data');
        const dates = real.map(e => new Date(e.date)).sort((a, b) => a - b);
        const weeks = (dates[dates.length - 1] - dates[0]) / (7 * 86400000);
        const avg = weeks > 0 ? (real.length / weeks).toFixed(1) : real.length;
        return t('chat_a_avg', { n: '<span class="chat-stat">' + avg + '</span>' });
    }

    function answerIntensity(entries) {
        const withIntensity = entries.filter(e => e.intensity && e.intensity !== '');
        if (!withIntensity.length) return t('chat_no_data');
        const counts = {};
        withIntensity.forEach(e => { counts[e.intensity] = (counts[e.intensity] || 0) + 1; });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const lines = sorted.map(([i, n]) => `• ${i}: <span class="chat-stat">${n}×</span>`);
        return t('chat_a_intensity') + '<br>' + lines.join('<br>');
    }

    function answerNotes(entries, ql) {
        const words = ql.replace(/notiz|note|notiță|notă/gi, '').trim();
        if (!words) return t('chat_a_notes_hint');
        const found = entries.filter(e => e.notes && e.notes.toLowerCase().includes(words));
        if (!found.length) return t('chat_a_notes_none', { q: words });
        return t('chat_a_notes_found', {
            n: '<span class="chat-stat">' + found.length + '</span>',
            q: words
        });
    }

    function formatLocalDate(dateStr) {
        if (!dateStr) return '?';
        const d = new Date(dateStr);
        return d.toLocaleDateString(t('locale'), { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
})();
