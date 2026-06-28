# Smart Task Manager

A clean, offline-first task manager built with Vanilla JS during my IBM SkillsBuild internship. No frameworks, no backend — just HTML, CSS, and JavaScript.

## 🚀 Live Demo
👉 [bala-smart-task-manager.netlify.app](https://bala-smart-task-manager.netlify.app)

## ✨ Features

- **Personalised greeting** — asks your name on first visit, remembers it via localStorage
- **Time-aware background** — gradient changes automatically (morning/afternoon/evening/night)
- **Add tasks** — with category (Work/Study/Personal), priority (High/Medium/Low), and due date
- **Inline editing** — click edit on any task, type and press Enter. No popups.
- **Filter & Search** — filter by category, search by keyword, sort by newest/priority/deadline/A–Z
- **Voice input** — speak your task using Web Speech API
- **Pomodoro timer** — 25-minute focus timer with pause and reset
- **Export / Import** — save tasks as JSON, restore anytime
- **Dark / Light theme** — persists across sessions
- **PWA + Offline** — works without internet via Service Worker caching
- **95+ Lighthouse score**

## 📊 Stats Bar
Real-time count of total, completed, and pending tasks with a progress bar.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 |
| Styling | CSS3 (gradients, animations, responsive) |
| Logic | Vanilla JavaScript (ES6) |
| Storage | localStorage |
| Offline | Service Worker (PWA) |
| Voice | Web Speech API |

## ⚡ Quick Start

```bash
git clone https://github.com/Balama2520/smart-mini-task-manager
cd smart-mini-task-manager

# Open directly in browser
open index.html

# Or serve locally (recommended for PWA features)
npx serve .
```

## 📁 Project Structure

```
├── index.html      # App structure and layout
├── style.css       # All styles, themes, animations
├── script.js       # All logic — tasks, voice, timer, storage
├── manifest.json   # PWA manifest
└── sw.js           # Service Worker for offline support
```

## 💡 Key Technical Decisions

- **No frameworks** — built entirely in Vanilla JS to demonstrate core fundamentals
- **localStorage** — client-side only, no server needed, works offline
- **Inline editing** — replaces text span with input on click, commits on blur or Enter
- **Time-aware UI** — checks `new Date().getHours()` every second to set background class

## 👨‍💻 Author

**Bala Maneesh Ayanala** — IBM SkillsBuild Intern · Full-Stack Developer · IEEE Published

🌐 [Portfolio](https://abms-portfolio.netlify.app) · 💼 [LinkedIn](https://linkedin.com/in/bala-maneesh-ayanala-702582266) · ⌥ [GitHub](https://github.com/Balama2520)
