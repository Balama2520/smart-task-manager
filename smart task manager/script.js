// ── Safe localStorage wrapper (Safari private mode / storage-full safe) ────
function lsGet(key, fallback) {
  try {
    var v = localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch (e) {
    return fallback;
  }
}
function lsSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    toast('Storage unavailable — changes won\'t be saved this session');
    return false;
  }
}

// ── Name screen ────────────────────────────────────────────────────────────
var userName = lsGet('userName', '');

function showNameScreen() {
  var screen = document.getElementById('nameScreen');
  var app = document.getElementById('mainApp');
  if (userName) {
    if (screen) { screen.style.display = 'none'; }
    if (app) { app.style.display = 'flex'; app.style.flexDirection = 'column'; }
    updateGreeting();
  } else {
    if (screen) { screen.style.display = 'flex'; }
    if (app) { app.style.display = 'none'; }
    setTimeout(function () {
      var ni = document.getElementById('nameInput');
      if (ni) ni.focus();
    }, 200);
  }
}

function saveName() {
  var inp = document.getElementById('nameInput');
  var val = inp ? inp.value.trim() : '';
  if (!val) { if (inp) inp.focus(); return; }
  userName = val;
  lsSet('userName', userName);
  var screen = document.getElementById('nameScreen');
  var app = document.getElementById('mainApp');
  if (screen) { screen.style.display = 'none'; }
  if (app) { app.style.display = 'flex'; app.style.flexDirection = 'column'; }
  updateGreeting();
  render();
}

function updateGreeting() {
  var gr = document.getElementById('greeting');
  if (!gr) return;
  var h = new Date().getHours();
  var time = h >= 5 && h < 12 ? 'morning ☀️'
    : h >= 12 && h < 17 ? 'afternoon 🌤'
      : h >= 17 && h < 21 ? 'evening 🌇'
        : 'night 🌙';
  gr.textContent = 'Good ' + time + ', ' + userName + '!';
}

// All tasks stored in localStorage
var tasks;
try {
  tasks = JSON.parse(lsGet('tasks', '[]'));
  if (!Array.isArray(tasks)) tasks = [];
} catch (e) {
  tasks = [];
}
var currentFilter = 'all';
var currentSort = 'new';
var manualOrder = false; // true once the user drag-reorders tasks — preserves their custom order
var searchText = '';
var timerOn = false;
var timerSecs = 25 * 60;
var timerInterval = null;

// ── Clock & background colour by time of day ───────────────────────────────
function tickClock() {
  var now = new Date();
  var h = now.getHours();
  var m = now.getMinutes();
  var pad = function (n) { return n < 10 ? '0' + n : '' + n; };

  var el = document.getElementById('clock');
  if (el) el.textContent = pad(h) + ':' + pad(m);

  var bg = document.getElementById('bg');
  var gr = document.getElementById('greeting');
  if (bg) {
    bg.className = 'bg';
    if (h >= 5 && h < 12) { bg.classList.add('morning'); if (gr && userName) gr.textContent = 'Good morning ☀️, ' + userName + '!'; else if (gr) gr.textContent = 'Good morning ☀️'; }
    else if (h >= 12 && h < 17) { bg.classList.add('afternoon'); if (gr) gr.textContent = 'Good afternoon 🌤'; }
    else if (h >= 17 && h < 21) { bg.classList.add('evening'); if (gr && userName) gr.textContent = 'Good evening 🌇, ' + userName + '!'; else if (gr) gr.textContent = 'Good evening 🌇'; }
    else { bg.classList.add('night'); if (gr && userName) gr.textContent = 'Good night 🌙, ' + userName + '!'; else if (gr) gr.textContent = 'Good night 🌙'; }
  }
}

// ── Save to localStorage ───────────────────────────────────────────────────
function save() {
  lsSet('tasks', JSON.stringify(tasks));
}

// ── Render task list ───────────────────────────────────────────────────────
function render() {
  var list = document.getElementById('taskList');
  var empty = document.getElementById('empty');
  if (!list) return;

  // 1. Filter
  var shown = tasks.filter(function (t) {
    var matchFilter = currentFilter === 'all' || t.category === currentFilter;
    var matchSearch = !searchText || t.text.toLowerCase().includes(searchText.toLowerCase());
    return matchFilter && matchSearch;
  });

  // 2. Sort (skipped once the user has drag-reordered — their order wins until they pick a sort)
  if (!manualOrder) {
    shown.sort(function (a, b) {
      if (currentSort === 'new') return (b.createdAt || 0) - (a.createdAt || 0);
      if (currentSort === 'pri') {
        var rank = { high: 0, medium: 1, low: 2 };
        return rank[a.priority] - rank[b.priority];
      }
      if (currentSort === 'due') {
        if (!a.due && !b.due) return 0;
        if (!a.due) return 1;
        if (!b.due) return -1;
        return new Date(a.due) - new Date(b.due);
      }
      if (currentSort === 'az') return a.text.localeCompare(b.text);
      return 0;
    });
  }

  // 3. Draw
  if (shown.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'flex';
  } else {
    empty.style.display = 'none';
    list.innerHTML = shown.map(drawTask).join('');
    attachEvents();
  }

  updateStats();
}

function drawTask(t) {
  var today = new Date().toISOString().split('T')[0];
  var late = t.due && t.due < today && !t.done;
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var dueStr = '';
  if (t.due) {
    var p = t.due.split('-');
    dueStr = '<span class="tdue' + (late ? ' late' : '') + '">' +
      (late ? '⚠ ' : '📅 ') + months[parseInt(p[1]) - 1] + ' ' + parseInt(p[2]) + '</span>';
  }

  return '<div class="task-item' + (t.done ? ' done' : '') + '" data-id="' + t.id + '" draggable="true">' +
    '<button class="cbox' + (t.done ? ' on' : '') + '" data-a="check" aria-label="' +
    (t.done ? 'Mark as not done' : 'Mark as done') + '" aria-pressed="' + (t.done ? 'true' : 'false') + '">' +
    (t.done ? '✓' : '') + '</button>' +
    '<div class="tbody">' +
    '<span class="ttext">' + esc(t.text) + '</span>' +
    '<div class="tmeta">' +
    '<span class="ttag tag-' + t.category + '">' + t.category + '</span>' +
    '<span class="pdot p-' + t.priority + '" title="' + t.priority + ' priority" aria-label="' + t.priority + ' priority"></span>' +
    dueStr +
    '</div>' +
    '</div>' +
    '<div class="tactions">' +
    '<button class="tabtn" data-a="edit" title="Edit" aria-label="Edit task: ' + esc(t.text) + '">✎</button>' +
    '<button class="tabtn del" data-a="del" title="Delete" aria-label="Delete task: ' + esc(t.text) + '">✕</button>' +
    '</div>' +
    '</div>';
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function attachEvents() {
  document.querySelectorAll('.task-item').forEach(function (item) {
    var id = item.getAttribute('data-id'); // string id (UUID) — do not parseInt
    item.querySelector('[data-a="check"]').onclick = function () { toggleDone(id); };
    item.querySelector('[data-a="edit"]').onclick = function () { startEdit(id, item); };
    item.querySelector('[data-a="del"]').onclick = function () { deleteTask(id); };

    // Drag-and-drop manual reordering
    item.addEventListener('dragstart', function () {
      item.classList.add('dragging');
    });
    item.addEventListener('dragend', function () {
      item.classList.remove('dragging');
      document.querySelectorAll('.task-item.drag-over').forEach(function (el) {
        el.classList.remove('drag-over');
      });
    });
    item.addEventListener('dragover', function (e) {
      e.preventDefault();
      if (item.classList.contains('dragging')) return;
      item.classList.add('drag-over');
    });
    item.addEventListener('dragleave', function () {
      item.classList.remove('drag-over');
    });
    item.addEventListener('drop', function (e) {
      e.preventDefault();
      item.classList.remove('drag-over');
      var draggedId = document.querySelector('.task-item.dragging');
      draggedId = draggedId ? draggedId.getAttribute('data-id') : null;
      if (!draggedId || draggedId === id) return;
      reorderTasks(draggedId, id);
    });
  });
}

// ── Manual drag reordering ──────────────────────────────────────────────────
function reorderTasks(draggedId, targetId) {
  var fromIdx = tasks.findIndex(function (t) { return t.id === draggedId; });
  var toIdx = tasks.findIndex(function (t) { return t.id === targetId; });
  if (fromIdx === -1 || toIdx === -1) return;

  var moved = tasks.splice(fromIdx, 1)[0];
  toIdx = tasks.findIndex(function (t) { return t.id === targetId; });
  tasks.splice(toIdx, 0, moved);

  manualOrder = true;
  save();
  render();
}

// ── Stats bar ──────────────────────────────────────────────────────────────
function updateStats() {
  var total = tasks.length;
  var done = tasks.filter(function (t) { return t.done; }).length;
  var pct = total ? Math.round(done / total * 100) : 0;

  setText('totalCount', total);
  setText('doneCount', done);
  setText('leftCount', total - done);
  setText('pLabel', pct + '% done');

  var bar = document.getElementById('pbar');
  if (bar) bar.style.width = pct + '%';
}

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ── ID generator (avoids Date.now() collisions on rapid-fire adds) ─────────
function makeId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

// ── Add task ───────────────────────────────────────────────────────────────
function addTask() {
  var input = document.getElementById('taskInput');
  var cat = document.getElementById('catSel');
  var pri = document.getElementById('priSel');
  var due = document.getElementById('dateSel');
  if (!input || !input.value.trim()) { if (input) input.focus(); return; }

  tasks.unshift({
    id: makeId(),
    createdAt: Date.now(),
    text: input.value.trim(),
    category: cat ? cat.value : 'other',
    priority: pri ? pri.value : 'medium',
    due: due ? due.value : '',
    done: false
  });

  save();
  render();
  input.value = '';
  if (due) due.value = '';
  input.focus();
  toast('Task added ✓');
}

// ── Toggle complete ────────────────────────────────────────────────────────
function toggleDone(id) {
  var t = tasks.find(function (t) { return t.id === id; });
  if (t) {
    t.done = !t.done;
    save();
    render();
    if (t.done) recordCompletionToday();
  }
}

// ── Streak tracker ───────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function recordCompletionToday() {
  var days = JSON.parse(lsGet('completionDays', '[]'));
  var today = todayStr();
  if (days.indexOf(today) === -1) {
    days.push(today);
    lsSet('completionDays', JSON.stringify(days));
  }
  updateStreakBadge();
}

function computeStreak() {
  var days = JSON.parse(lsGet('completionDays', '[]'));
  var daySet = {};
  days.forEach(function (d) { daySet[d] = true; });

  var streak = 0;
  var cursor = new Date();

  // If nothing done today yet, streak can still count from yesterday backwards
  if (!daySet[todayStr()]) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    var iso = cursor.toISOString().split('T')[0];
    if (!daySet[iso]) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function updateStreakBadge() {
  var badge = document.getElementById('streakBadge');
  if (!badge) return;
  var streak = computeStreak();
  if (streak > 0) {
    badge.textContent = '🔥 ' + streak + (streak === 1 ? ' day' : ' days');
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

// ── Inline edit ────────────────────────────────────────────────────────────
function startEdit(id, item) {
  var t = tasks.find(function (t) { return t.id === id; });
  if (!t) return;

  var textEl = item.querySelector('.ttext');
  var inp = document.createElement('input');
  inp.type = 'text';
  inp.className = 'tedit';
  inp.value = t.text;
  textEl.replaceWith(inp);
  inp.focus();
  inp.select();

  function commit() {
    if (inp.value.trim()) { t.text = inp.value.trim(); save(); }
    render();
  }

  inp.onblur = commit;
  inp.onkeydown = function (e) {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') render();
  };
}

// ── Delete ─────────────────────────────────────────────────────────────────
function deleteTask(id) {
  var idx = tasks.findIndex(function (t) { return t.id === id; });
  if (idx === -1) return;
  var removed = tasks[idx];

  tasks.splice(idx, 1);
  save();
  render();

  toast('Task deleted', 'Undo', function () {
    // Re-insert by creation time rather than the old array index — if a new
    // task was added during the 5s undo window, an index-based restore
    // could land in the wrong slot.
    var insertAt = tasks.findIndex(function (t) { return (t.createdAt || 0) < (removed.createdAt || 0); });
    if (insertAt === -1) insertAt = tasks.length;
    tasks.splice(insertAt, 0, removed);
    save();
    render();
  });
}

// ── Voice input ────────────────────────────────────────────────────────────
function startVoice() {
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast('Voice not supported in this browser'); return; }

  var rec = new SR();
  rec.lang = 'en-IN';
  rec.interimResults = false;

  var btn = document.getElementById('voiceBtn');
  if (btn) btn.textContent = '🔴 Listening...';

  rec.onresult = function (e) {
    var t = e.results[0][0].transcript;
    var inp = document.getElementById('taskInput');
    if (inp) { inp.value = t; inp.focus(); }
    if (btn) btn.textContent = '🎤 Voice';
    toast('Heard: "' + t + '"');
  };
  rec.onerror = function () {
    if (btn) btn.textContent = '🎤 Voice';
    toast('Could not hear anything');
  };
  rec.onend = function () { if (btn) btn.textContent = '🎤 Voice'; };
  rec.start();
}

// ── Pomodoro ───────────────────────────────────────────────────────────────
function updateTimerDisplay() {
  var m = Math.floor(timerSecs / 60);
  var s = timerSecs % 60;
  var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
  var el = document.getElementById('timerDisplay');
  if (el) el.textContent = pad(m) + ':' + pad(s);
}

function startPause() {
  if (timerOn) {
    clearInterval(timerInterval);
    timerOn = false;
    setText('startBtn', 'Start');
  } else {
    timerOn = true;
    setText('startBtn', 'Pause');
    timerInterval = setInterval(function () {
      timerSecs--;
      updateTimerDisplay();
      if (timerSecs <= 0) {
        clearInterval(timerInterval);
        timerOn = false;
        timerSecs = 25 * 60;
        updateTimerDisplay();
        setText('startBtn', 'Start');
        toast('🍅 Focus session complete!');
      }
    }, 1000);
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  timerOn = false;
  timerSecs = 25 * 60;
  updateTimerDisplay();
  setText('startBtn', 'Start');
}

// ── Export / Import ────────────────────────────────────────────────────────
function exportTasks() {
  var data = JSON.stringify(tasks, null, 2);
  var blob = new Blob([data], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'tasks-' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  toast('Tasks exported');
}

function importTasks() {
  var inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '.json';
  inp.onchange = function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      try {
        var data = JSON.parse(ev.target.result);
        if (Array.isArray(data)) {
          tasks = data;
          save();
          render();
          toast(data.length + ' tasks imported');
        }
      } catch (err) { toast('Invalid file'); }
    };
    reader.readAsText(file);
  };
  inp.click();
}

// ── Toast ──────────────────────────────────────────────────────────────────
function toast(msg, actionLabel, actionFn) {
  var wrap = document.getElementById('toasts');
  if (!wrap) return;

  var el = document.createElement('div');
  el.className = 'toast';

  var msgSpan = document.createElement('span');
  msgSpan.textContent = msg;
  el.appendChild(msgSpan);

  var timeoutId;
  var dismiss = function () {
    clearTimeout(timeoutId);
    if (el.parentNode) el.parentNode.removeChild(el);
  };

  if (actionLabel && actionFn) {
    var btn = document.createElement('button');
    btn.className = 'toast-action';
    btn.textContent = actionLabel;
    btn.onclick = function () {
      actionFn();
      dismiss();
    };
    el.appendChild(btn);
  }

  wrap.appendChild(el);
  timeoutId = setTimeout(dismiss, actionLabel ? 5000 : 2500);
}

function logout() {
  var keepTasks = confirm('Log out? Your saved tasks stay on this device — only your name is cleared.');
  if (!keepTasks) return;
  userName = '';
  try { localStorage.removeItem('userName'); } catch (e) { /* ignore */ }
  showNameScreen();
  var ni = document.getElementById('nameInput');
  if (ni) { ni.value = ''; }
  toast('Logged out');
}

// ── Theme ──────────────────────────────────────────────────────────────────
function toggleTheme() {
  var cur = document.documentElement.getAttribute('data-theme');
  var next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next === 'light' ? '' : next);
  lsSet('theme', next);
}

// ── Due-date reminders (foreground check — notifies while the tab is open) ──
function remindersEnabled() {
  return lsGet('remindersOn', '') === 'true';
}

function checkDueReminders() {
  if (!remindersEnabled() || !('Notification' in window) || Notification.permission !== 'granted') return;

  var today = todayStr();
  var notifiedKey = 'notified_' + today;
  var notified = JSON.parse(lsGet(notifiedKey, '[]'));

  tasks.forEach(function (t) {
    if (t.due === today && !t.done && notified.indexOf(t.id) === -1) {
      try {
        new Notification('📅 Task due today', { body: t.text, icon: 'icon-192.png' });
      } catch (e) { /* Notification constructor unsupported in this context — ignore */ }
      notified.push(t.id);
    }
  });

  lsSet(notifiedKey, JSON.stringify(notified));
}

function toggleReminders() {
  if (!('Notification' in window)) {
    toast('Notifications are not supported in this browser');
    return;
  }

  if (remindersEnabled()) {
    lsSet('remindersOn', 'false');
    setNotifBtnState(false);
    toast('Due-date reminders turned off');
    return;
  }

  Notification.requestPermission().then(function (perm) {
    if (perm === 'granted') {
      lsSet('remindersOn', 'true');
      setNotifBtnState(true);
      toast('Due-date reminders turned on');
      checkDueReminders();
    } else {
      toast('Notification permission denied');
    }
  });
}

function setNotifBtnState(on) {
  var btn = document.getElementById('notifBtn');
  if (btn) btn.classList.toggle('active', !!on);
}

// ── Init ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

  // Name screen
  showNameScreen();

  var nameBtn = document.getElementById('nameBtn');
  if (nameBtn) nameBtn.addEventListener('click', saveName);
  var nameInput = document.getElementById('nameInput');
  if (nameInput) nameInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') saveName(); });

  // Restore theme (redundant safety net — head script already applies it pre-paint)
  if (lsGet('theme', '') === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  // Clock — tick every second
  tickClock();
  setInterval(tickClock, 1000);

  // Render saved tasks
  render();

  // Add task
  var addBtn = document.getElementById('addBtn');
  if (addBtn) addBtn.addEventListener('click', addTask);

  var taskInput = document.getElementById('taskInput');
  if (taskInput) {
    taskInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') addTask();
    });
  }

  // Search
  var searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      searchText = this.value;
      render();
    });
  }

  // Filter chips
  document.querySelectorAll('.chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      document.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('active'); });
      this.classList.add('active');
      currentFilter = this.getAttribute('data-f');
      render();
    });
  });

  // Sort
  var sortSel = document.getElementById('sortSel');
  if (sortSel) {
    sortSel.addEventListener('change', function () {
      currentSort = this.value;
      manualOrder = false; // an explicit sort choice overrides any drag order
      render();
    });
  }

  // Voice
  var voiceBtn = document.getElementById('voiceBtn');
  if (voiceBtn) voiceBtn.addEventListener('click', startVoice);

  // Export / Import
  var expBtn = document.getElementById('exportBtn');
  var impBtn = document.getElementById('importBtn');
  if (expBtn) expBtn.addEventListener('click', exportTasks);
  if (impBtn) impBtn.addEventListener('click', importTasks);

  // Clear done
  var clearBtn = document.getElementById('clearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      var removedTasks = tasks.filter(function (t) { return t.done; });
      if (removedTasks.length === 0) { toast('No completed tasks to clear'); return; }

      tasks = tasks.filter(function (t) { return !t.done; });
      save();
      render();

      toast(removedTasks.length + ' tasks cleared', 'Undo', function () {
        tasks = tasks.concat(removedTasks);
        save();
        render();
      });
    });
  }

  // Pomodoro
  var pomBtn = document.getElementById('pomBtn');
  var pomCard = document.getElementById('pomCard');
  var closePom = document.getElementById('closePom');
  var startBtn = document.getElementById('startBtn');
  var resetBtn = document.getElementById('resetBtn');

  if (pomBtn && pomCard) {
    pomBtn.addEventListener('click', function () {
      pomCard.style.display = pomCard.style.display === 'none' ? 'block' : 'none';
    });
  }
  if (closePom && pomCard) {
    closePom.addEventListener('click', function () {
      pomCard.style.display = 'none';
      resetTimer();
    });
  }
  if (startBtn) startBtn.addEventListener('click', startPause);
  if (resetBtn) resetBtn.addEventListener('click', resetTimer);

  // Theme
  var themeBtn = document.getElementById('themeToggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Logout
  var logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  // Profile modal
  var profileBtn = document.getElementById('profileBtn');
  var modal = document.getElementById('modal');
  var mclose = document.getElementById('mclose');

  if (profileBtn && modal) {
    profileBtn.addEventListener('click', function () { modal.classList.add('open'); });
  }
  if (mclose && modal) {
    mclose.addEventListener('click', function () { modal.classList.remove('open'); });
  }
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) modal.classList.remove('open');
    });
  }

  // Streak
  updateStreakBadge();

  // Due-date reminders
  var notifBtn = document.getElementById('notifBtn');
  if (notifBtn) {
    notifBtn.addEventListener('click', toggleReminders);
    setNotifBtnState(remindersEnabled() && 'Notification' in window && Notification.permission === 'granted');
  }
  checkDueReminders();
  setInterval(checkDueReminders, 5 * 60 * 1000); // re-check every 5 minutes

  // Keyboard shortcuts help modal
  var shortcutsBtn = document.getElementById('shortcutsBtn');
  var shortcutsModal = document.getElementById('shortcutsModal');
  var shortcutsClose = document.getElementById('shortcutsClose');
  if (shortcutsBtn && shortcutsModal) {
    shortcutsBtn.addEventListener('click', function () { shortcutsModal.classList.add('open'); });
  }
  if (shortcutsClose && shortcutsModal) {
    shortcutsClose.addEventListener('click', function () { shortcutsModal.classList.remove('open'); });
  }
  if (shortcutsModal) {
    shortcutsModal.addEventListener('click', function (e) {
      if (e.target === shortcutsModal) shortcutsModal.classList.remove('open');
    });
  }

  // Global keyboard shortcuts — ignored while typing in a field, except Escape/Enter
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    var typing = tag === 'input' || tag === 'textarea' || tag === 'select';

    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.open').forEach(function (m) { m.classList.remove('open'); });
      return;
    }

    if (typing) return;

    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      var ti = document.getElementById('taskInput');
      if (ti) ti.focus();
    } else if (e.key === '/') {
      e.preventDefault();
      var si = document.getElementById('searchInput');
      if (si) si.focus();
    } else if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      var pb = document.getElementById('pomBtn');
      if (pb) pb.click();
    } else if (e.key === '?') {
      e.preventDefault();
      if (shortcutsModal) shortcutsModal.classList.add('open');
    }
  });
});
