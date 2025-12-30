// --- 1. ПЕРЕМЕННЫЕ ---
let players = [];
let events = {};
let tacticsData = { players: {}, opponents: [] };
let tacticsLibrary = {};
let currentDate = new Date();
let selectedDate = null;

const ICONS = {
    analytics: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>',
    win: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
    form: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
    upcoming: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>',
    goals: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path d="m6.7 6.7 10.6 10.6"/><path d="m6.7 17.3 10.6-10.6"/><circle cx="12" cy="12" r="4"/></svg>',
    cleanSheet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>'
};

// --- 2. ИНИЦИАЛИЗАЦИЯ ---
function initData() {
    const p = localStorage.getItem('coachApp_players');
    if (p) players = JSON.parse(p); else players = [];
    const ev = localStorage.getItem('coachApp_events');
    if (ev) events = JSON.parse(ev); else events = {};
    const t = localStorage.getItem('coachApp_tactics');
    if (t) tacticsData = JSON.parse(t);
    const tl = localStorage.getItem('coachApp_tacticsLib');
    if (tl) tacticsLibrary = JSON.parse(tl);
}
function savePlayers() { localStorage.setItem('coachApp_players', JSON.stringify(players)); }
function saveEvents() { localStorage.setItem('coachApp_events', JSON.stringify(events)); }
function saveTactics() { localStorage.setItem('coachApp_tactics', JSON.stringify(tacticsData)); }

// --- 3. НАВИГАЦИЯ ---
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();

        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active-section'));

        e.currentTarget.classList.add('active');
        const id = e.currentTarget.getAttribute('href').substring(1);
        const section = document.getElementById(id);

        if (section) {
            section.classList.add('active-section');
            renderAll();
            // Фикс скролла
            setTimeout(() => {
                const mainContent = document.getElementById('main-content');
                if (mainContent) mainContent.scrollTop = 0;
                window.scrollTo(0, 0);
            }, 10);
        }
    });
});

window.addEventListener('load', () => {
    initData();
    renderAll();
    updateTacticsDropdown();
    const splash = document.getElementById('intro-overlay');
    if (splash) setTimeout(() => splash.remove(), 8500);
});

function renderAll() {
    renderAnalytics();
    renderPlayers();
    renderMatches();
    renderCalendar();
    renderTactics();
}

// --- 4. АНАЛИТИКА ---
function renderAnalytics() {
    const container = document.getElementById('analytics-dashboard-container');
    if (!container) return;
    const playedMatches = [], upcomingEvents = [], now = new Date();
    Object.entries(events).forEach(([date, dayEvents]) => {
        dayEvents.forEach(ev => {
            const d = new Date(date + 'T' + ev.time);
            if (ev.type === 'match') {
                if (ev.isPlayed === true || (ev.isPlayed === undefined && d < now)) playedMatches.push({ ...ev, date });
                else upcomingEvents.push({ ...ev, date });
            } else if (d >= now) upcomingEvents.push({ ...ev, date });
        });
    });
    playedMatches.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
    upcomingEvents.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));

    const total = playedMatches.length;
    const wins = playedMatches.filter(m => m.homeScore > m.awayScore).length;
    const winRate = total ? Math.round((wins / total) * 100) : 0;
    const goals = playedMatches.reduce((a, m) => a + (m.homeScore || 0), 0);
    const clean = playedMatches.filter(m => m.awayScore === 0).length;

    const last5 = [...playedMatches].reverse().slice(0, 5).reverse();
    const formHTML = last5.map(m => {
        const res = m.homeScore > m.awayScore ? 'win' : (m.homeScore == m.awayScore ? 'draw' : 'loss');
        const txt = m.homeScore > m.awayScore ? 'В' : (m.homeScore == m.awayScore ? 'Н' : 'П');
        return `<div class="form-badge badge-${res}">${txt}</div>`;
    }).join('');

    const upHTML = upcomingEvents.slice(0, 2).map(e => `
        <div class="upcoming-event-item"><div class="evt-date-box">${new Date(e.date).getDate()}</div><div><div style="font-weight:700;font-size:0.9rem">${e.type === 'match' ? 'vs ' + e.opponent : e.description}</div><div style="color:#888;font-size:0.75rem">${e.time}</div></div></div>
    `).join('') || '<div style="color:#999">Нет событий</div>';

    container.innerHTML = `
        <div class="analytics-grid">
            <div class="stat-card card-1x1"><div class="card-header"><div class="card-icon">${ICONS.analytics}</div><h3>Игры</h3></div><div class="stat-value-big">${total}</div></div>
            <div class="stat-card card-1x1"><div class="card-header"><div class="card-icon" style="color:#34C759;background:rgba(52,199,89,0.1)">${ICONS.win}</div><h3>Победы</h3></div><div class="stat-value-big" style="color:#34C759">${winRate}%</div></div>
            <div class="stat-card card-2x2"><div class="card-header"><div class="card-icon" style="color:#AF52DE;background:rgba(175,82,222,0.1)">${ICONS.form}</div><h3>Форма</h3></div><div class="form-timeline">${formHTML}</div><div id="sparkline-cont" class="premium-sparkline"></div></div>
            <div class="stat-card card-2x1"><div class="card-header"><div class="card-icon">${ICONS.upcoming}</div><h3>Скоро</h3></div>${upHTML}</div>
            <div class="stat-card card-1x1"><div class="card-header"><div class="card-icon" style="color:#FF9500;background:rgba(255,149,0,0.1)">${ICONS.goals}</div><h3>Голы</h3></div><div class="stat-value-big">${goals}</div></div>
            <div class="stat-card card-1x1"><div class="card-header"><div class="card-icon">${ICONS.cleanSheet}</div><h3>Сухие</h3></div><div class="stat-value-big">${clean}</div></div>
        </div>
    `;
    const sp = document.getElementById('sparkline-cont');
    if (sp && last5.length > 1) {
        const vals = last5.map(m => m.homeScore);
        const max = Math.max(...vals, 1);
        const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * 100},${100 - (v / max) * 80}`).join(' ');
        sp.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="#007aff" stroke-width="2"/></svg>`;
    }
}

// --- 5. ИГРОКИ ---
function renderPlayers() {
    const list = document.getElementById('players-list-container');
    if (!list) return;
    const rows = players.map(p => `<tr><td>${p.name}</td><td>${p.pos}</td><td><span class="status-${p.status.split(' ')[0]}">${p.status}</span></td><td><div class="action-buttons-wrapper"><button onclick="editPlayer(${p.id})">✏️</button><button class="delete-btn" onclick="deletePlayer(${p.id})">✕</button></div></td></tr>`).join('');
    list.innerHTML = `<table><thead><tr><th>Имя</th><th>Поз</th><th>Статус</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
}

// --- 6. МАТЧИ ---
function renderMatches() {
    const list = document.getElementById('matches-list-container');
    if (!list) return;
    const all = [];
    Object.keys(events).forEach(d => events[d].forEach(e => { if (e.type === 'match') all.push({ ...e, date: d }) }));
    all.sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time));
    list.innerHTML = all.map(m => {
        const res = m.homeScore > m.awayScore ? '#34C759' : (m.homeScore < m.awayScore ? '#FF3B30' : '#888');
        return `<div style="padding:15px;background:white;margin-bottom:10px;border-radius:14px;border:1px solid #eee;display:flex;justify-content:space-between;align-items:center;"><div><div style="font-size:0.8rem;color:#888">${new Date(m.date).toLocaleDateString()}</div><div style="font-weight:700">vs ${m.opponent}</div></div><div style="font-weight:800;font-size:1.2rem;color:${res}">${m.homeScore}:${m.awayScore}</div></div>`
    }).join('') || '<p style="color:#999;text-align:center">Нет матчей</p>';
}

// --- 7. ТАКТИКА (ИСПРАВЛЕННАЯ ВЕРСИЯ) ---
function renderTactics() {
    const bench = document.getElementById('tactics-bench');
    const fieldLayer = document.getElementById('field-players-layer');
    if (!bench || !fieldLayer) return;

    bench.innerHTML = '';
    fieldLayer.innerHTML = '';

    // 1. Игроки на поле
    players.forEach(p => {
        if (!tacticsData.players[p.id]) {
            tacticsData.players[p.id] = { onField: false, x: 0, y: 0 };
        }
        const pos = tacticsData.players[p.id];

        if (pos.onField) {
            const chip = createChip(p);
            chip.classList.add('field-chip');
            chip.style.left = pos.x + '%';
            chip.style.top = pos.y + '%';
            chip.setAttribute('data-on-field', 'true');
            fieldLayer.appendChild(chip);
        }
    });

    // 2. Игроки на скамейке
    ['Вратарь', 'Защитник', 'Полузащитник', 'Нападающий'].forEach(posName => {
        const group = players.filter(p => p.pos === posName && (!tacticsData.players[p.id] || !tacticsData.players[p.id].onField));

        if (group.length > 0) {
            const header = document.createElement('div');
            header.style.padding = '5px 12px';
            header.style.background = 'rgba(0,0,0,0.03)';
            header.style.fontSize = '0.7rem';
            header.style.fontWeight = '700';
            header.style.textTransform = 'uppercase';
            header.style.color = '#888';
            header.innerText = posName;
            bench.appendChild(header);

            group.forEach(p => {
                const row = document.createElement('div');
                row.className = 'bench-row';
                const nameSpan = document.createElement('span');
                nameSpan.style.flex = '1';
                nameSpan.style.fontSize = '0.9rem';
                nameSpan.innerText = p.name;

                const chip = createChip(p);
                chip.classList.add('list-chip');
                chip.setAttribute('data-on-field', 'false');

                row.appendChild(nameSpan);
                row.appendChild(chip);
                bench.appendChild(row);
            });
        }
    });

    // 3. Соперники
    if (tacticsData.opponents) {
        tacticsData.opponents.forEach((opp, idx) => {
            const chip = document.createElement('div');
            chip.className = 'player-chip field-chip opponent-chip';
            chip.innerText = opp.id;
            chip.setAttribute('data-type', 'opponent');
            chip.setAttribute('data-idx', idx);
            chip.style.left = opp.x + '%';
            chip.style.top = opp.y + '%';
            addDragListeners(chip);
            chip.ondblclick = (e) => { e.stopPropagation(); removeOpponent(idx); };
            fieldLayer.appendChild(chip);
        });
    }
}

function createChip(p) {
    const chip = document.createElement('div');
    chip.className = 'player-chip';
    chip.setAttribute('data-type', 'player');
    chip.setAttribute('data-id', p.id);
    chip.setAttribute('data-name', p.name);
    chip.innerText = p.name.substring(0, 2).toUpperCase();
    addDragListeners(chip);
    return chip;
}

// --- ЛОГИКА DRAG & DROP (ИСПРАВЛЕННАЯ) ---
let draggedItem = null;
let sourceItem = null;
let shiftX = 0;
let shiftY = 0;

function addDragListeners(el) {
    el.addEventListener('mousedown', onDragStart);
    el.addEventListener('touchstart', onDragStart, { passive: false });
}

function onDragStart(e) {
    const evt = e.type === 'touchstart' ? e.touches[0] : e;
    if (e.type === 'touchstart') document.body.style.overflow = 'hidden';

    sourceItem = e.target.closest('.player-chip');
    if (!sourceItem) return;

    draggedItem = sourceItem.cloneNode(true);
    const rect = sourceItem.getBoundingClientRect();

    shiftX = evt.clientX - rect.left;
    shiftY = evt.clientY - rect.top;

    draggedItem.style.position = 'fixed';
    draggedItem.style.zIndex = '999999';
    draggedItem.style.width = rect.width + 'px';
    draggedItem.style.height = rect.height + 'px';
    draggedItem.style.pointerEvents = 'none';
    draggedItem.style.opacity = '0.9';
    draggedItem.style.transform = 'scale(1.1)';
    draggedItem.style.margin = '0';

    if (sourceItem.classList.contains('list-chip')) {
        draggedItem.classList.remove('list-chip');
        draggedItem.classList.add('field-chip');
    }

    document.body.appendChild(draggedItem);
    moveAt(evt.clientX, evt.clientY);

    sourceItem.style.opacity = '0.3';

    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('touchend', onDragEnd);
}

function moveAt(pageX, pageY) {
    if (draggedItem) {
        draggedItem.style.left = (pageX - shiftX) + 'px';
        draggedItem.style.top = (pageY - shiftY) + 'px';
    }
}

function onDragMove(e) {
    if (!draggedItem) return;
    e.preventDefault();
    const evt = e.type === 'touchmove' ? e.touches[0] : e;
    moveAt(evt.clientX, evt.clientY);
}

function onDragEnd(e) {
    if (!draggedItem) return;

    // Очистка событий
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    document.removeEventListener('touchmove', onDragMove);
    document.removeEventListener('touchend', onDragEnd);

    // Восстановление
    document.body.style.overflow = '';
    const evt = e.type === 'touchend' ? e.changedTouches[0] : e;
    const clientX = evt.clientX;
    const clientY = evt.clientY;

    const field = document.getElementById('football-field');
    const fRect = field.getBoundingClientRect();

    // Попали ли на поле?
    const isInside = (clientX >= fRect.left && clientX <= fRect.right &&
        clientY >= fRect.top && clientY <= fRect.bottom);

    // Получаем данные из draggedItem (так как это клон, атрибуты скопированы)
    const type = draggedItem.getAttribute('data-type');
    const id = draggedItem.getAttribute('data-id');
    const idx = draggedItem.getAttribute('data-idx');

    if (isInside) {
        // Считаем координаты. 
        // Формула: (Позиция мыши - Левый край поля - Смещение курсора внутри фишки) / Ширина поля
        let px = ((clientX - fRect.left) - shiftX) / fRect.width * 100;
        let py = ((clientY - fRect.top) - shiftY) / fRect.height * 100;

        // Ограничиваем от 0 до 95 (чтобы не улетело совсем за край)
        px = Math.max(0, Math.min(95, px));
        py = Math.max(0, Math.min(95, py));

        if (type === 'player') {
            if (!tacticsData.players[id]) tacticsData.players[id] = {};
            tacticsData.players[id].onField = true;
            tacticsData.players[id].x = px;
            tacticsData.players[id].y = py;
        } else if (type === 'opponent') {
            tacticsData.opponents[idx].x = px;
            tacticsData.opponents[idx].y = py;
        }
    } else {
        // Если отпустили за пределами поля
        if (type === 'player') {
            // Убираем с поля (возвращаем в список)
            if (tacticsData.players[id]) {
                tacticsData.players[id].onField = false;
            }
        }
        // Соперников пока просто оставляем или не меняем, если вытянули наружу
    }

    // Удаляем фантом
    draggedItem.remove();
    draggedItem = null;
    if (sourceItem) {
        sourceItem.style.opacity = '1';
        sourceItem = null;
    }

    saveTactics();
    renderTactics();
}

// --- 8. КАЛЕНДАРЬ ---
function renderCalendar() {
    const cont = document.getElementById('calendar-container');
    if (!cont) return;
    cont.innerHTML = `
        <div class="cal-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
            <button onclick="changeMonth(-1)" style="width:30px;height:30px;background:#f2f2f7;border:none;border-radius:50%">◀</button>
            <h2 style="margin:0">${currentDate.toLocaleDateString('ru', { month: 'long', year: 'numeric' })}</h2>
            <button onclick="changeMonth(1)" style="width:30px;height:30px;background:#f2f2f7;border:none;border-radius:50%">▶</button>
        </div>
    `;
    const grid = document.createElement('div');
    grid.className = 'cal-grid';
    ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].forEach(d => {
        const dn = document.createElement('div');
        dn.style.textAlign = 'center'; dn.style.fontWeight = '700'; dn.style.color = '#888'; dn.style.paddingBottom = '10px';
        dn.innerText = d; grid.appendChild(dn);
    });
    const y = currentDate.getFullYear(), m = currentDate.getMonth();
    let fd = new Date(y, m, 1).getDay(); if (fd === 0) fd = 7;
    const dim = new Date(y, m + 1, 0).getDate();
    for (let i = 1; i < fd; i++) grid.appendChild(document.createElement('div'));
    for (let d = 1; d <= dim; d++) {
        const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const div = document.createElement('div'); div.className = 'cal-day';
        if (new Date().toDateString() === new Date(ds).toDateString()) div.classList.add('today');
        let html = `<div><b>${d}</b></div>`;
        if (events[ds]) {
            events[ds].sort((a, b) => a.time.localeCompare(b.time));
            events[ds].forEach(e => {
                const color = e.type === 'match' ? '#ff3b30' : (e.type === 'training' ? '#34C759' : '#007aff');
                html += `<div style="font-size:0.7rem;background:${color};color:white;padding:2px 4px;border-radius:4px;margin-top:2px;white-space:nowrap;overflow:hidden">${e.time} ${e.type === 'match' ? 'vs ' + e.opponent : e.description}</div>`;
            });
        }
        div.innerHTML = html; div.onclick = () => openEventModal(ds); grid.appendChild(div);
    }
    cont.appendChild(grid);
}
window.changeMonth = (d) => { currentDate.setMonth(currentDate.getMonth() + d); renderCalendar(); };

// --- 9. ПРОЧЕЕ И МОДАЛКИ ---
const modals = document.querySelectorAll('.modal-overlay');
const closeBtns = document.querySelectorAll('.close-modal-btn');
const confirmModal = document.getElementById('confirmModal');
let confirmCallback = null;

function showConfirmModal(msg, cb) {
    const el = document.getElementById('confirm-message');
    if (el) el.textContent = msg;
    confirmCallback = cb;
    if (confirmModal) confirmModal.classList.add('visible');
}
const confirmCancel = document.getElementById('confirm-cancel-btn');
if (confirmCancel) confirmCancel.onclick = () => { confirmModal.classList.remove('visible'); confirmCallback = null; };

const confirmOk = document.getElementById('confirm-ok-btn');
if (confirmOk) confirmOk.onclick = () => { if (confirmCallback) confirmCallback(); confirmModal.classList.remove('visible'); confirmCallback = null; };

function showModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('visible');
}
function hideModals() {
    modals.forEach(m => m.classList.remove('visible'));
    confirmCallback = null;
}
closeBtns.forEach(b => b.onclick = hideModals);

// Tactic Buttons
const addOppBtn = document.getElementById('add-opponent-btn');
if (addOppBtn) addOppBtn.onclick = () => { if (!tacticsData.opponents) tacticsData.opponents = []; tacticsData.opponents.push({ id: tacticsData.opponents.length + 1, x: 50, y: 50 }); saveTactics(); renderTactics(); };

const resetTacBtn = document.getElementById('reset-tactics-btn');
if (resetTacBtn) resetTacBtn.onclick = () => { if (confirm('Сбросить поле?')) { tacticsData = { players: {}, opponents: [] }; saveTactics(); renderTactics(); } };

function removeOpponent(idx) { tacticsData.opponents.splice(idx, 1); saveTactics(); renderTactics(); }

function updateTacticsDropdown() {
    const select = document.getElementById('tactics-select'); if (!select) return;
    select.innerHTML = '<option value="">-- Выберите схему --</option>';
    Object.keys(tacticsLibrary).forEach(name => { select.innerHTML += `<option value="${name}">${name}</option>`; });
}

const saveTacBtn = document.getElementById('save-tactic-btn');
if (saveTacBtn) saveTacBtn.addEventListener('click', () => {
    const name = document.getElementById('tactic-name-input').value.trim();
    if (!name) return alert('Введите название!');
    tacticsLibrary[name] = JSON.parse(JSON.stringify(tacticsData));
    localStorage.setItem('coachApp_tacticsLib', JSON.stringify(tacticsLibrary));
    updateTacticsDropdown(); document.getElementById('tactics-select').value = name;
});

const selTac = document.getElementById('tactics-select');
if (selTac) selTac.addEventListener('change', (e) => {
    const name = e.target.value; if (!name || !tacticsLibrary[name]) return;
    tacticsData = JSON.parse(JSON.stringify(tacticsLibrary[name])); saveTactics(); renderTactics();
});

const delTacBtn = document.getElementById('delete-tactic-btn');
if (delTacBtn) delTacBtn.addEventListener('click', () => {
    const name = document.getElementById('tactics-select').value; if (!name) return;
    if (confirm('Удалить?')) { delete tacticsLibrary[name]; localStorage.setItem('coachApp_tacticsLib', JSON.stringify(tacticsLibrary)); updateTacticsDropdown(); }
});

const dlTacBtn = document.getElementById('download-tactic-btn');
if (dlTacBtn) dlTacBtn.addEventListener('click', () => {
    const btn = document.getElementById('download-tactic-btn'); const txt = btn.innerText; btn.innerText = '⏳';
    if (typeof html2canvas !== 'undefined') {
        html2canvas(document.getElementById('football-field'), { scale: 2, useCORS: true, backgroundColor: '#388e3c' }).then(c => {
            const l = document.createElement('a'); l.download = `tactic_${Date.now()}.png`; l.href = c.toDataURL(); l.click(); btn.innerText = txt;
        });
    } else {
        alert('Библиотека html2canvas не подключена');
        btn.innerText = txt;
    }
});

// Forms
function openEventModal(ds) {
    selectedDate = ds;
    document.getElementById('selection-modal-date').innerText = new Date(ds).toLocaleDateString();
    const l = document.getElementById('existing-events-list');
    l.innerHTML = '';
    if (events[ds]) events[ds].forEach(e => l.innerHTML += `<div>${e.time} ${e.type} <button onclick="deleteEvent('${ds}',${e.id})">Del</button></div>`);
    showModal('eventSelectionModal');
}
window.deleteEvent = (d, id) => { events[d] = events[d].filter(e => e.id != id); if (!events[d].length) delete events[d]; saveEvents(); hideModals(); renderAll(); };

const btnMatch = document.getElementById('select-match-btn');
if (btnMatch) btnMatch.onclick = () => setupForm('match');
const btnTrain = document.getElementById('select-training-btn');
if (btnTrain) btnTrain.onclick = () => setupForm('training');
const btnMeet = document.getElementById('select-meeting-btn');
if (btnMeet) btnMeet.onclick = () => setupForm('meeting');

function setupForm(type) {
    hideModals();
    document.getElementById(`${type}-date`).value = selectedDate;
    document.getElementById(`add-${type}-form`).reset();
    if (type === 'match') populateSelects();
    showModal(`add${type.charAt(0).toUpperCase() + type.slice(1)}Modal`);
}

['match', 'training', 'meeting'].forEach(t => {
    const f = document.getElementById(`add-${t}-form`);
    if (f) f.onsubmit = (e) => {
        e.preventDefault(); const d = document.getElementById(`${t}-date`).value;
        const nev = { id: Date.now(), type: t, time: document.getElementById(`${t}-time`).value };
        if (t === 'match') { nev.opponent = document.getElementById('match-opponent').value; nev.homeScore = +document.getElementById('home-score').value; nev.awayScore = +document.getElementById('away-score').value; }
        else nev.description = document.getElementById(t === 'training' ? 'training-description' : 'meeting-opponent').value;
        if (!events[d]) events[d] = []; events[d].push(nev); saveEvents(); hideModals(); renderAll();
    };
});

function populateSelects() { ['goal-select', 'yellow-select', 'red-select', 'match-mvp'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = '<option value="">...</option>' + players.map(p => `<option value="${p.id}">${p.name}</option>`).join(''); }); }

window.updatePhotoPreview = (u) => {
    const prev = document.getElementById('player-photo-preview');
    if (prev) prev.innerHTML = u ? `<img src="${u}">` : '📷';
}
const addPlBtn = document.getElementById('add-player-btn');
if (addPlBtn) addPlBtn.onclick = () => { document.getElementById('add-edit-player-form').reset(); showModal('playerModal'); };

const plForm = document.getElementById('add-edit-player-form');
if (plForm) plForm.onsubmit = (e) => {
    e.preventDefault(); const id = document.getElementById('player-id').value;
    const d = { id: id ? +id : Date.now(), name: document.getElementById('player-name').value, pos: document.getElementById('player-pos').value, status: document.getElementById('player-status').value, photo: document.getElementById('player-photo-url').value };
    if (id) { const i = players.findIndex(x => x.id == id); players[i] = d; } else players.push(d); savePlayers(); hideModals(); renderAll();
};

window.editPlayer = (id) => { const p = players.find(x => x.id == id); document.getElementById('player-id').value = p.id; document.getElementById('player-name').value = p.name; showModal('playerModal'); };
window.deletePlayer = (id) => { showConfirmModal('Del?', () => { players = players.filter(x => x.id != id); savePlayers(); renderAll(); }); };

const clearBtn = document.getElementById('clear-all-btn');
if (clearBtn) clearBtn.onclick = () => { localStorage.clear(); location.reload(); };
