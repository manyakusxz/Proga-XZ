let exercisesList = JSON.parse(localStorage.getItem('xz_exercises')) || ["румынка", "мост", "сведение сидя", "разведение сидя", "жим гантелей лежа", "жим гантелей сидя", "бабочка", "разведение в стороны", "трица", "тяга горизонт", "тяга верт", "тяга к лицу"];
const dayNames = ['вторник', 'четверг', 'воскресение'];

function saveAll() {
    localStorage.setItem('xz_exercises', JSON.stringify(exercisesList));
    const data = [];
    document.querySelectorAll('.day-card').forEach(card => {
        const dayData = { name: card.querySelector('.day-title').innerText, exercises: [] };
        card.querySelectorAll('.exercise-row').forEach(row => {
            dayData.exercises.push({
                name: row.querySelector('.sel-exercise').value,
                sets: row.querySelectorAll('.sel-num')[0].value,
                reps: row.querySelectorAll('.sel-num')[1].value
            });
        });
        data.push(dayData);
    });
    localStorage.setItem('xz_workout_data', JSON.stringify(data));
}

function createRow(savedEx = "", savedSets = 1, savedReps = 10) {
    const row = document.createElement('div');
    row.className = 'exercise-row';
    row.draggable = true;
    row.innerHTML = `
        <div class="drag-handle">⠿</div>
        <select class="sel-exercise" onchange="saveAll(); updateStats();">
            <option value="" disabled ${!savedEx ? 'selected' : ''}>...</option>
            ${exercisesList.map(ex => `<option value="${ex}" ${savedEx === ex ? 'selected' : ''}>${ex}</option>`).join('')}
        </select>
        <select class="sel-num" onchange="saveAll(); updateStats();">
            ${Array.from({length: 5}, (_, i) => `<option value="${i+1}" ${savedSets == i+1 ? 'selected' : ''}>${i+1}</option>`).join('')}
        </select>
        <span class="multiplier">×</span>
        <select class="sel-num" onchange="saveAll();">${Array.from({length: 20}, (_, i) => `<option value="${i+1}" ${savedReps == i+1 ? 'selected' : ''}>${i+1}</option>`).join('')}</select>
        <button class="btn-remove" onclick="this.parentElement.remove(); saveAll(); updateStats();">×</button>
    `;
    row.addEventListener('dragstart', () => row.classList.add('dragging'));
    row.addEventListener('dragend', () => { row.classList.remove('dragging'); saveAll(); });
    return row;
}

function switchTab(btn, tabId) {
    document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active-tab'));
    btn.classList.add('active');
    document.getElementById(tabId).classList.add('active-tab');
    if(tabId === 'tab-settings') renderFullList();
}

function addNewExercise() {
    const val = document.getElementById('newExInput').value.trim().toLowerCase();
    if(val && !exercisesList.includes(val)) {
        exercisesList.push(val);
        exercisesList.sort();
        saveAll();
        renderFullList();
        refreshAllDropdowns();
        document.getElementById('newExInput').value = '';
    }
}

function removeExerciseFromBase(exName) {
    if(confirm(`УДАЛИТЬ "${exName.toUpperCase()}" ИЗ БАЗЫ?`)) {
        exercisesList = exercisesList.filter(e => e !== exName);
        saveAll();
        renderFullList();
        refreshAllDropdowns();
    }
}

function refreshAllDropdowns() {
    document.querySelectorAll('.sel-exercise').forEach(sel => {
        const cur = sel.value;
        sel.innerHTML = `<option value="" disabled>...</option>` + exercisesList.map(ex => `<option value="${ex}">${ex}</option>`).join('');
        if(exercisesList.includes(cur)) sel.value = cur;
    });
}

function renderFullList() {
    const container = document.getElementById('fullList');
    container.innerHTML = exercisesList.map(ex => `
        <div class="ex-item">
            <span>${ex}</span>
            <button class="btn-delete-ex" onclick="removeExerciseFromBase('${ex}')">УДАЛИТЬ</button>
        </div>
    `).join('');
}

function updateStats() {
    const stats = {};
    document.querySelectorAll('.exercise-row').forEach(row => {
        const name = row.querySelector('.sel-exercise').value;
        const sets = parseInt(row.querySelectorAll('.sel-num')[0].value);
        if(name) stats[name] = (stats[name] || 0) + sets;
    });
    const list = document.getElementById('statsList');
    list.innerHTML = Object.entries(stats).sort((a,b)=>b[1]-a[1]).map(([n, c]) => `
        <div class="stats-item"><span class="stats-name">${n}</span><span class="stats-count">${c}</span></div>
    `).join('') || '<p style="color:#444; text-align:center;">ПРОГРАММА ПУСТА</p>';
}

const savedWorkout = JSON.parse(localStorage.getItem('xz_workout_data'));
dayNames.forEach((dayName, idx) => {
    const card = document.createElement('div');
    card.className = 'day-card';
    card.innerHTML = `<div class="day-title">${dayName}</div><div class="rows-holder"></div>`;
    const holder = card.querySelector('.rows-holder');
    
    if(savedWorkout && savedWorkout[idx]) {
        savedWorkout[idx].exercises.forEach(ex => holder.appendChild(createRow(ex.name, ex.sets, ex.reps)));
    } else {
        for(let i=0; i<4; i++) holder.appendChild(createRow());
    }

    const addBtn = document.createElement('button');
    addBtn.className = 'btn-add';
    addBtn.innerText = '+ ДОБАВИТЬ';
    addBtn.onclick = () => { holder.appendChild(createRow()); saveAll(); };
    card.appendChild(addBtn);
    document.getElementById('app').appendChild(card);

    holder.addEventListener('dragover', e => {
        e.preventDefault();
        const dragging = document.querySelector('.dragging');
        const afterElement = [...holder.querySelectorAll('.exercise-row:not(.dragging)')].reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = e.clientY - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) return { offset, element: child };
            else return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
        if (!afterElement) holder.appendChild(dragging); else holder.insertBefore(dragging, afterElement);
    });
});

renderFullList();