// --- 1. ПЕРЕМЕННЫЕ ---
let players = [];
let events = {};
let tacticsData = { players: {}, opponents: [] };
let currentDate = new Date();
let selectedDate = null;
let tempMatchDetails = { goals: [], yellow: [], red: [] };

// --- 2. ИНИЦИАЛИЗАЦИЯ ---
function initData() {
    // Игроки
    const p = localStorage.getItem('coachApp_players');
    if (p) players = JSON.parse(p);
    else {
        players = [{id:1,name:"Буринский Тимур",pos:"Вратарь",status:"Здоров"},{id:2,name:"Шимак Пётр",pos:"Вратарь",status:"Здоров"},{id:3,name:"Чирва Егор",pos:"Защитник",status:"Здоров"},{id:4,name:"Розум Илья",pos:"Защитник",status:"Здоров"},{id:5,name:"Мудрый Артём",pos:"Защитник",status:"Здоров"},{id:6,name:"Щур Степан",pos:"Защитник",status:"Здоров"},{id:7,name:"Левкевич Кирилл",pos:"Защитник",status:"Здоров"},{id:8,name:"Толпо Матвей",pos:"Защитник",status:"Здоров"},{id:9,name:"Верчук Роман",pos:"Защитник",status:"Здоров"},{id:10,name:"Лихаческий Иван",pos:"Защитник",status:"Здоров"},{id:11,name:"Толмачёв Тимур",pos:"Защитник",status:"Здоров"},{id:12,name:"Завиленский Илья",pos:"Полузащитник",status:"Здоров"},{id:13,name:"Шапляк Дементий",pos:"Полузащитник",status:"Здоров"},{id:14,name:"Гутник Глеб",pos:"Полузащитник",status:"Здоров"},{id:15,name:"Цуприняк Иван",pos:"Полузащитник",status:"Здоров"},{id:16,name:"Поплавский Артём",pos:"Полузащитник",status:"Здоров"},{id:17,name:"Хроль Федор",pos:"Полузащитник",status:"Здоров"},{id:18,name:"Климко Роман",pos:"Полузащитник",status:"Здоров"},{id:19,name:"Бернгард Арсений",pos:"Полузащитник",status:"Здоров"},{id:20,name:"Египцев Фёдор",pos:"Полузащитник",status:"Здоров"},{id:21,name:"Дубалеко Артём",pos:"Полузащитник",status:"Здоров"},{id:22,name:"Алисиевич Матвей",pos:"Нападающий",status:"Здоров"},{id:23,name:"Савастюк Мирон",pos:"Нападающий",status:"Здоров"},{id:24,name:"Клишевич Александр",pos:"Нападающий",status:"Здоров"},{id:25,name:"Сабович Даниил",pos:"Нападающий",status:"Здоров"}];
        savePlayers();
    }
    // Матчи
    const ev = localStorage.getItem('coachApp_events');
    if(ev) events = JSON.parse(ev);
    else { events = {}; saveEvents(); }
    
    // Тактика
    const t = localStorage.getItem('coachApp_tactics');
    if(t) {
        let raw = JSON.parse(t);
        if(!raw.players) tacticsData = { players: raw, opponents: [] };
        else tacticsData = raw;
    }
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
        e.target.classList.add('active');
        const id = e.target.getAttribute('href').substring(1);
        document.getElementById(id).classList.add('active-section');
        renderAll();
    });
});

function renderAll() {
    renderOverview();
    renderPlayers();
    renderMatches();
    renderCalendar();
    renderTactics();
}

// 4.1. Обзор
function renderOverview() {
    const container = document.getElementById('overview-stats');
    if(!container) return;
    const totalP = players.length;
    const unavailable = players.filter(p => p.status !== 'Здоров');
    const healthy = totalP - unavailable.length;
    let sickHTML = unavailable.length ? `<ul class="sick-list">${unavailable.map(p=>`<li><span>${p.name}</span><span class="mini-badge ${p.status==='Травма'?'status-bad':'status-warn'}">${p.status}</span></li>`).join('')}</ul>` : '<p style="color:#888;font-size:0.9rem;">Лазарет пуст.</p>';

    let allM = [];
    Object.values(events).forEach(arr => allM.push(...arr.filter(e => e.type === 'match')));
    allM.sort((a,b) => new Date(b.date+'T'+b.time) - new Date(a.date+'T'+a.time));

    const wins = allM.filter(m => m.homeScore > m.awayScore).length;
    const draws = allM.filter(m => m.homeScore == m.awayScore).length;
    const losses = allM.filter(m => m.homeScore < m.awayScore).length;
    const gs = allM.reduce((a,b)=>a+b.homeScore,0);
    const gc = allM.reduce((a,b)=>a+b.awayScore,0);
    const diff = gs - gc;

    const today = new Date(); today.setHours(0,0,0,0);
    let fut = [];
    Object.keys(events).forEach(d => { if(new Date(d)>=today) events[d].forEach(e=>{if(e.type==='match') fut.push({...e, date:d})})});
    fut.sort((a,b)=>new Date(a.date)-new Date(b.date));
    const next = fut[0];
    let nextHTML = next ? `<div class="next-match-card"><div class="nm-header">Следующий матч</div><div class="nm-vs"><div class="nm-team">Мы</div><div class="nm-vs-text">VS</div><div class="nm-team opponent">${next.opponent}</div></div><div class="nm-date">${new Date(next.date).toLocaleDateString()}</div></div>` : `<div class="next-match-card empty"><p>Нет матчей</p></div>`;

    const last5 = allM.slice(0, 5); 
    let formHTML = '<div class="form-dots">';
    last5.forEach(m => {
        let c = 'dot-draw';
        if(m.homeScore > m.awayScore) c = 'dot-win';
        if(m.homeScore < m.awayScore) c = 'dot-loss';
        formHTML += `<div class="${c}" title="${m.opponent}"></div>`;
    });
    formHTML += '</div>';

    container.innerHTML = `<div class="stat-card span-2">${nextHTML}</div><div class="stat-card"><h3>Состав</h3><div class="health-summary"><span class="big-num ${healthy==totalP?'good':'warn'}">${healthy}/${totalP}</span></div>${sickHTML}</div><div class="stat-card"><h3>Сезон</h3><div class="season-stats-row"><span class="sb-val good">${wins}</span><span class="sb-val gray">${draws}</span><span class="sb-val bad">${losses}</span></div><div style="margin-top:15px;text-align:center;">${formHTML}</div></div><div class="stat-card"><h3>Голы</h3><div class="goals-chart"><div class="goal-row"><span>З</span><div class="progress-bg"><div class="progress-fill p-green" style="width:${Math.min(100,(gs/(gs+gc||1))*100)}%"></div></div><span class="g-val">${gs}</span></div><div class="goal-row"><span>П</span><div class="progress-bg"><div class="progress-fill p-red" style="width:${Math.min(100,(gc/(gs+gc||1))*100)}%"></div></div><span class="g-val">${gc}</span></div></div><div class="goal-diff">Разница: <span class="${diff>=0?'good-text':'bad-text'}">${diff>0?'+':''}${diff}</span></div></div>`;
}

// 4.2. Игроки
function renderPlayers() {
    const stats = {};
    players.forEach(p => stats[p.id] = {g:0, y:0, r:0});
    Object.values(events).forEach(day => day.forEach(ev => { if(ev.type==='match' && ev.details) { if(ev.details.goals) ev.details.goals.forEach(id => {if(stats[id]) stats[id].g++}); if(ev.details.yellow) ev.details.yellow.forEach(id => {if(stats[id]) stats[id].y++}); if(ev.details.red) ev.details.red.forEach(id => {if(stats[id]) stats[id].r++}); } }));
    const list = document.getElementById('players-list-container');
    if(!list) return;
    list.innerHTML = `<table><thead><tr><th>ФИО</th><th>Поз</th><th class="col-center">⚽</th><th class="col-center">🟨</th><th class="col-center">🟥</th><th>Статус</th><th></th></tr></thead><tbody>${players.map(p => `<tr><td>${p.name}</td><td>${p.pos}</td><td class="col-center stat-val">${stats[p.id].g}</td><td class="col-center stat-val" style="color:orange">${stats[p.id].y}</td><td class="col-center stat-val" style="color:red">${stats[p.id].r}</td><td class="status-${p.status.split(' ')[0]}">${p.status}</td><td><button onclick="editPlayer(${p.id})">✏️</button><button onclick="deletePlayer(${p.id})" style="color:red">✕</button></td></tr>`).join('')}</tbody></table>`;
}

// 4.3. Матчи
function renderMatches() {
    const list = document.getElementById('matches-list-container');
    if(!list) return;
    let all = [];
    Object.keys(events).forEach(d => events[d].forEach(e => {if(e.type==='match') all.push({...e, date:d})}));
    all.sort((a,b)=>new Date(b.date)-new Date(a.date));
    list.innerHTML = all.length ? all.map(m => { let res = m.homeScore > m.awayScore ? 'res-win' : (m.homeScore < m.awayScore ? 'res-loss' : 'res-draw'); return `<div class="match-item"><div class="match-info-container"><div class="match-date">${new Date(m.date).toLocaleDateString()}</div><div class="match-opponent">vs ${m.opponent}</div></div><div class="score-badge ${res}">${m.homeScore}:${m.awayScore}</div></div>` }).join('') : '<p style="text-align:center;color:#888">Нет матчей</p>';
}

// 4.4. Календарь
function renderCalendar() {
    const cont = document.getElementById('calendar-container');
    if(!cont) return;
    cont.innerHTML = `<div class="cal-header"><button onclick="changeMonth(-1)">◀</button><h2>${currentDate.toLocaleDateString('ru',{month:'long',year:'numeric'})}</h2><button onclick="changeMonth(1)">▶</button></div>`;
    const grid = document.createElement('div'); grid.className = 'cal-grid';
    ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].forEach(d => grid.innerHTML += `<div class="cal-day-name">${d}</div>`);
    const y = currentDate.getFullYear(), m = currentDate.getMonth();
    const fd = new Date(y,m,1).getDay() || 7;
    const dim = new Date(y,m+1,0).getDate();
    for(let i=1; i<fd; i++) grid.innerHTML += `<div></div>`;
    for(let d=1; d<=dim; d++) {
        const ds = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const div = document.createElement('div'); div.className = 'cal-day';
        if(new Date().toDateString() === new Date(ds).toDateString()) div.classList.add('today');
        div.innerHTML = `<div><b>${d}</b></div>`;
        if(events[ds]) { events[ds].sort((a,b)=>a.time.localeCompare(b.time)); events[ds].forEach(e => div.innerHTML += `<div class="evt-dot evt-${e.type}">${e.time} ${e.type==='match'?e.opponent:e.description||'?'}</div>`); }
        div.onclick = () => openEventModal(ds);
        grid.appendChild(div);
    }
    cont.appendChild(grid);
}
window.changeMonth = (d) => { currentDate.setMonth(currentDate.getMonth()+d); renderCalendar(); };

// --- 5. ТАКТИКА ---
function renderTactics() {
    const bench = document.getElementById('tactics-bench');
    const fieldLayer = document.getElementById('field-players-layer');
    if(!bench || !fieldLayer) return;
    bench.innerHTML = ''; fieldLayer.innerHTML = '';
    
    players.forEach(p => {
        const pos = tacticsData.players[p.id] || { onField: false, x: 0, y: 0 };
        if (pos.onField) {
            const chip = createChip(p, pos);
            chip.classList.add('field-chip');
            fieldLayer.appendChild(chip);
        }
    });

    const positions = ['Вратарь', 'Защитник', 'Полузащитник', 'Нападающий'];
    positions.forEach(posName => {
        const groupPlayers = players.filter(p => p.pos === posName && !(tacticsData.players[p.id] && tacticsData.players[p.id].onField));
        if (groupPlayers.length > 0) {
            const title = document.createElement('div');
            title.className = 'bench-group-title';
            title.textContent = posName + ' (' + groupPlayers.length + ')';
            bench.appendChild(title);
            groupPlayers.forEach(p => {
                const row = document.createElement('div');
                row.className = 'bench-row';
                const nameDiv = document.createElement('div');
                nameDiv.className = 'bench-name';
                nameDiv.textContent = p.name;
                const chip = createChip(p, { onField: false });
                chip.classList.add('list-chip');
                row.appendChild(nameDiv);
                row.appendChild(chip);
                bench.appendChild(row);
            });
        }
    });

    if(tacticsData.opponents) {
        tacticsData.opponents.forEach((opp, idx) => {
            const chip = document.createElement('div');
            chip.className = 'player-chip field-chip opponent-chip';
            chip.innerText = opp.id;
            chip.setAttribute('data-type', 'opponent');
            chip.setAttribute('data-idx', idx);
            chip.style.left = opp.x + '%';
            chip.style.top = opp.y + '%';
            chip.onmousedown = dragStart; chip.ontouchstart = dragStart;
            chip.ondblclick = () => removeOpponent(idx);
            fieldLayer.appendChild(chip);
        });
    }
}

function createChip(p, pos) {
    const chip = document.createElement('div');
    chip.className = 'player-chip';
    chip.setAttribute('data-type', 'player');
    chip.setAttribute('data-id', p.id);
    chip.innerText = p.name.substring(0, 2).toUpperCase();
    chip.onmousedown = dragStart; chip.ontouchstart = dragStart;
    if (pos.onField) {
        chip.setAttribute('data-name', p.name);
        chip.style.left = pos.x + '%';
        chip.style.top = pos.y + '%';
    }
    return chip;
}

let activeChip = null;
let shiftX = 0, shiftY = 0;

function dragStart(e) {
    e.preventDefault();
    const evt = e.type === 'touchstart' ? e.touches[0] : e;
    activeChip = e.target;
    const rect = activeChip.getBoundingClientRect();
    shiftX = evt.clientX - rect.left;
    shiftY = evt.clientY - rect.top;
    activeChip.style.position = 'fixed';
    activeChip.style.zIndex = 1000;
    moveAt(evt.clientX, evt.clientY);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('touchend', dragEnd);
    document.addEventListener('touchmove', dragMove, {passive:false});
}

function moveAt(pageX, pageY) {
    if (!activeChip) return;
    activeChip.style.left = pageX - shiftX + 'px';
    activeChip.style.top = pageY - shiftY + 'px';
}

function dragMove(e) {
    if (!activeChip) return;
    e.preventDefault();
    const evt = e.type === 'touchmove' ? e.touches[0] : e;
    moveAt(evt.clientX, evt.clientY);
}

function dragEnd(e) {
    if (!activeChip) return;
    document.removeEventListener('mouseup', dragEnd);
    document.removeEventListener('mousemove', dragMove);
    document.removeEventListener('touchend', dragEnd);
    document.removeEventListener('touchmove', dragMove);

    const evt = e.type === 'touchend' ? e.changedTouches[0] : e;
    const field = document.getElementById('football-field');
    const fRect = field.getBoundingClientRect();
    const realChipLeft = evt.clientX - shiftX;
    const realChipTop = evt.clientY - shiftY;
    const chipCenterX = realChipLeft + (activeChip.offsetWidth / 2);
    const chipCenterY = realChipTop + (activeChip.offsetHeight / 2);
    const inside = (chipCenterX >= fRect.left && chipCenterX <= fRect.right && chipCenterY >= fRect.top && chipCenterY <= fRect.bottom);

    activeChip.style.position = ''; activeChip.style.zIndex = '';
    const type = activeChip.getAttribute('data-type');

    if (inside) {
        let px = ((realChipLeft - fRect.left) / fRect.width) * 100;
        let py = ((realChipTop - fRect.top) / fRect.height) * 100;
        px = Math.max(0, Math.min(100, px));
        py = Math.max(0, Math.min(100, py));
        if (type === 'player') {
            const pid = activeChip.getAttribute('data-id');
            tacticsData.players[pid] = { onField: true, x: px, y: py };
        } else if (type === 'opponent') {
            const idx = activeChip.getAttribute('data-idx');
            tacticsData.opponents[idx] = { id: tacticsData.opponents[idx].id, x: px, y: py };
        }
    } else {
        if (type === 'player') {
            const pid = activeChip.getAttribute('data-id');
            tacticsData.players[pid] = { onField: false, x: 0, y: 0 };
        } else if (type === 'opponent') {
            const idx = activeChip.getAttribute('data-idx');
            removeOpponent(idx);
            activeChip = null;
            return;
        }
    }
    saveTactics(); renderTactics(); activeChip = null;
}

document.getElementById('add-opponent-btn').onclick = () => {
    if(!tacticsData.opponents) tacticsData.opponents = [];
    tacticsData.opponents.push({ id: tacticsData.opponents.length + 1, x: 50, y: 50 });
    saveTactics(); renderTactics();
};
function removeOpponent(idx) { tacticsData.opponents.splice(idx, 1); saveTactics(); renderTactics(); }
document.getElementById('reset-tactics-btn').onclick = () => { if(confirm('Сбросить поле?')) { tacticsData={players:{}, opponents:[]}; saveTactics(); renderTactics(); } };

// --- 6. МОДАЛКИ (Без изменений) ---
const modals = document.querySelectorAll('.modal-overlay'); const closeBtns = document.querySelectorAll('.close-modal-btn');
function showModal(id) { document.getElementById(id).classList.add('visible'); }
function hideModals() { modals.forEach(m => m.classList.remove('visible')); }
closeBtns.forEach(b => b.onclick = hideModals);
function openEventModal(ds) { selectedDate = ds; document.getElementById('selection-modal-date').innerText = new Date(ds).toLocaleDateString(); const list = document.getElementById('existing-events-list'); list.innerHTML = ''; if(events[ds]) events[ds].forEach(ev => { list.innerHTML += `<div style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid #eee"><span><b>${ev.time}</b> ${ev.type==='match'?'Матч: '+ev.opponent:ev.description}</span><div><button onclick="editEvent('${ds}',${ev.id})" style="border:none;background:none;cursor:pointer">✏️</button><button onclick="deleteEvent('${ds}',${ev.id})" style="border:none;background:none;color:red;cursor:pointer">✕</button></div></div>`; }); else list.innerHTML = '<p style="text-align:center;color:#999">Пусто</p>'; showModal('eventSelectionModal'); }
window.editEvent = (ds, id) => { const ev = events[ds].find(e => e.id == id); if (!ev) return; hideModals(); const type = ev.type; const map = { 'match': 'addMatchModal', 'training': 'addTrainingModal', 'meeting': 'addMeetingModal' }; document.getElementById(`${type}-modal-date`).innerText = new Date(ds).toLocaleDateString(); document.getElementById(`${type}-date`).value = ds; document.getElementById(`${type}-event-id`).value = id; document.getElementById(`${type}-time`).value = ev.time; if (type === 'match') { document.getElementById('match-opponent').value = ev.opponent; document.getElementById('home-score').value = ev.homeScore; document.getElementById('away-score').value = ev.awayScore; const d = ev.details || {}; tempMatchDetails = { goals: d.goals||[], yellow: d.yellow||[], red: d.red||[] }; populateSelects(); updateDetailList('goals'); updateDetailList('yellow'); updateDetailList('red'); } else if (type === 'training') { document.getElementById('training-description').value = ev.description; } else { document.getElementById('meeting-opponent').value = ev.description; } showModal(map[type]); };
document.getElementById('select-match-btn').onclick = () => { hideModals(); setupForm('match'); }; document.getElementById('select-training-btn').onclick = () => { hideModals(); setupForm('training'); }; document.getElementById('select-meeting-btn').onclick = () => { hideModals(); setupForm('meeting'); };
function populateSelects() { ['goal-select', 'yellow-select', 'red-select'].forEach(id => { const el = document.getElementById(id); if(el) { el.innerHTML = '<option value="">Выбрать...</option>' + players.map(p=>`<option value="${p.id}">${p.name}</option>`).join(''); } }); }
function updateDetailList(type) { const c = document.getElementById(`${type}-list`); if(c) { c.innerHTML = tempMatchDetails[type].map((id,i) => { const p = players.find(x=>x.id==id); return p ? `<div class="added-item">${p.name} <button type="button" onclick="removeDetail('${type}',${i})">✕</button></div>` : ''; }).join(''); } }
window.removeDetail = (t,i) => { tempMatchDetails[t].splice(i,1); updateDetailList(t); };
document.getElementById('add-goal-btn').onclick = () => { const v=document.getElementById('goal-select').value; if(v){tempMatchDetails.goals.push(+v); updateDetailList('goals');} }; document.getElementById('add-yellow-btn').onclick = () => { const v=document.getElementById('yellow-select').value; if(v){tempMatchDetails.yellow.push(+v); updateDetailList('yellow');} }; document.getElementById('add-red-btn').onclick = () => { const v=document.getElementById('red-select').value; if(v){tempMatchDetails.red.push(+v); updateDetailList('red');} };
function setupForm(type) { const map = { 'match': 'addMatchModal', 'training': 'addTrainingModal', 'meeting': 'addMeetingModal' }; document.getElementById(`${type}-modal-date`).innerText = new Date(selectedDate).toLocaleDateString(); document.getElementById(`${type}-date`).value = selectedDate; document.getElementById(`add-${type}-form`).reset(); document.getElementById(`${type}-event-id`).value = ""; if(type === 'match') { tempMatchDetails = {goals:[],yellow:[],red:[]}; populateSelects(); updateDetailList('goals'); updateDetailList('yellow'); updateDetailList('red'); } showModal(map[type]); }
['match', 'training', 'meeting'].forEach(type => { document.getElementById(`add-${type}-form`).onsubmit = (e) => { e.preventDefault(); const d = document.getElementById(`${type}-date`).value; const id = document.getElementById(`${type}-event-id`).value; let nev = { id: id ? +id : Date.now(), type: type, time: document.getElementById(`${type}-time`).value }; if(type==='match') { nev.opponent = document.getElementById('match-opponent').value; nev.homeScore = +document.getElementById('home-score').value; nev.awayScore = +document.getElementById('away-score').value; nev.details = JSON.parse(JSON.stringify(tempMatchDetails)); } else if (type==='training') nev.description = document.getElementById('training-description').value; else nev.description = document.getElementById('meeting-opponent').value; if(!events[d]) events[d] = []; if(id) { const idx = events[d].findIndex(x=>x.id==id); if(idx!==-1) events[d][idx]=nev; } else events[d].push(nev); saveEvents(); hideModals(); renderAll(); }; });
window.deleteEvent = (d, id) => { if(confirm('Удалить?')) { events[d]=events[d].filter(e=>e.id!=id); if(!events[d].length) delete events[d]; saveEvents(); hideModals(); renderAll(); } };
document.getElementById('add-player-btn').onclick = () => { document.getElementById('add-edit-player-form').reset(); document.getElementById('player-id').value = ''; showModal('playerModal'); };
document.getElementById('add-edit-player-form').onsubmit = (e) => { e.preventDefault(); const id = document.getElementById('player-id').value; const data = { id: id ? +id : Date.now(), name: document.getElementById('player-name').value, pos: document.getElementById('player-pos').value, status: document.getElementById('player-status').value, height: document.getElementById('player-height').value, weight: document.getElementById('player-weight').value }; if(id) { const i = players.findIndex(x=>x.id==id); if(i!==-1) players[i]=data; } else players.push(data); savePlayers(); hideModals(); renderAll(); };
window.editPlayer = (id) => { const p = players.find(x=>x.id==id); if(!p)return; document.getElementById('player-id').value=p.id; document.getElementById('player-name').value=p.name; document.getElementById('player-pos').value=p.pos; document.getElementById('player-status').value=p.status; document.getElementById('player-height').value=p.height; document.getElementById('player-weight').value=p.weight; showModal('playerModal'); };
window.deletePlayer = (id) => { if(confirm('Удалить?')) { players=players.filter(x=>x.id!=id); savePlayers(); renderAll(); } };

// --- 7. НАСТРОЙКИ (ЭКСПОРТ / ИМПОРТ) ---
document.getElementById('export-btn').addEventListener('click', () => {
    const allData = {
        players: players,
        events: events,
        tacticsData: tacticsData,
        backupDate: new Date().toISOString()
    };
    const jsonString = JSON.stringify(allData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `coach_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

document.getElementById('import-trigger-btn').addEventListener('click', () => {
    document.getElementById('import-file').click();
});

document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!confirm('ВНИМАНИЕ: Все текущие данные будут заменены данными из файла. Продолжить?')) {
        e.target.value = ''; // Сброс выбора файла
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            
            // Простейшая валидация
            if (data.players && data.events) {
                players = data.players;
                events = data.events;
                tacticsData = data.tacticsData || { players: {}, opponents: [] };
                
                savePlayers();
                saveEvents();
                saveTactics();
                renderAll();
                
                alert('База данных успешно загружена!');
            } else {
                alert('Ошибка: Неверный формат файла.');
            }
        } catch (err) {
            console.error(err);
            alert('Ошибка при чтении файла.');
        }
    };
    reader.readAsText(file);
});

document.getElementById('clear-all-btn').addEventListener('click', () => {
    if (confirm('ВЫ УВЕРЕНЫ? Это удалит ВСЕ данные (игроков, матчи, тактику) безвозвратно!')) {
        if (confirm('Точно? Пути назад нет.')) {
            localStorage.removeItem('coachApp_players');
            localStorage.removeItem('coachApp_events');
            localStorage.removeItem('coachApp_tactics');
            location.reload(); // Перезагрузка страницы для сброса состояния
        }
    }
});

window.onload = () => { initData(); renderAll(); };