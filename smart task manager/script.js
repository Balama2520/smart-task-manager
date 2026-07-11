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

  // 2. Sort
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

  return '<div class="task-item' + (t.done ? ' done' : '') + '" data-id="' + t.id + '">' +
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
  });
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
  if (t) { t.done = !t.done; save(); render(); }
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
  tasks = tasks.filter(function (t) { return t.id !== id; });
  save();
  render();
  toast('Task deleted');
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
function toast(msg) {
  var wrap = document.getElementById('toasts');
  if (!wrap) return;
  var el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2500);
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
      var before = tasks.length;
      tasks = tasks.filter(function (t) { return !t.done; });
      save();
      render();
      toast((before - tasks.length) + ' tasks cleared');
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

  // Keyboard shortcut — Escape closes modal
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var m = document.getElementById('modal');
      if (m) m.classList.remove('open');
    }
  });
});