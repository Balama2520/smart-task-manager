<div align="center">

# ✅ Smart Task

**An offline-first task manager. No sign-up, no backend, no data leaving your device.**

[Live App](https://bala-smart-task-manager.netlify.app) · [Report a Bug](https://github.com/Balama2520/smart-task-manager/issues/new) · [Request a Feature](https://github.com/Balama2520/smart-task-manager/issues/new)

</div>

---

## About

Smart Tasks is a fast, installable, offline-first Progressive Web App (PWA) for managing daily tasks. It's built entirely in vanilla JavaScript — no frameworks, no build tools, no backend server, and no account required. Everything is stored locally in your browser.

This is a rebuilt, second version of an earlier task manager I built as an intern. The goal this time: something I'd actually keep using.

## Features

- **Task management** — add, edit, delete, and drag-and-drop reorder tasks
- **Organization** — category, priority, and due-date sorting; search and filter (Today / Overdue / by category)
- **Voice input** — add tasks by speaking, via the Web Speech API
- **Pomodoro timer** — a built-in focus timer with session tracking
- **Due-date reminders** — local browser notifications, no push server required
- **Daily streak tracking** — tracks consecutive days with a completed task
- **Offline support** — full functionality with no internet connection, via a Service Worker
- **Installable** — works as a native-feeling app on desktop and mobile (PWA)
- **Import / export** — back up or transfer your tasks as a JSON file
- **Dark / light theme** — with system-aware defaults
- **Keyboard shortcuts** — `N` new task, `/` search, `P` Pomodoro, `Esc` close, `?` shortcuts panel
- **Privacy-first** — no analytics, no ads, no third-party trackers

## Tech stack

| Layer | Technology |
|---|---|
| UI | Vanilla JavaScript, HTML5, CSS3 |
| Offline / caching | Service Worker (Cache API) |
| Voice input | Web Speech API |
| Notifications | Notifications API |
| Reordering | Drag and Drop API |
| Storage | `localStorage` (on-device only) |
| Install / app shell | Web App Manifest (PWA), including Shortcuts, Share Target, File Handlers, Protocol Handlers, Edge Side Panel, and a Windows Widgets Board widget |
| Hosting | Netlify |

No frameworks, no bundler, no `node_modules` required to run it.

## Getting started (for developers)

Because this is a static site with no build step, running it locally is simple.

### Option 1 — just open it
Clone the repo and open `index.html` directly in a browser. Most features work this way, though the Service Worker and some browser APIs behave more reliably when served over `http://` rather than `file://`.

### Option 2 — serve it locally (recommended)
```bash
git clone https://github.com/Balama2520/smart-task-manager.git
cd smart-task-manager

# any static file server works, for example:
npx serve .
# or
python3 -m http.server 8080
```
Then open `http://localhost:8080` (or whichever port your server prints).

### Project structure
```
smart-task-manager/
├── index.html              # App shell and markup
├── style.css                # All styling
├── script.js                 # App logic (tasks, timer, voice, notifications, etc.)
├── manifest.json              # Web App Manifest (PWA config)
├── sw.js                       # Service Worker (offline caching, sync, push scaffolding)
├── privacy.html                 # Privacy policy page
├── widgets/                       # Windows Widgets Board — Adaptive Card template + data
│   ├── task-widget-template.json
│   └── task-widget-data.json
├── icon-*.png, favicon-32.png, apple-touch-icon.png   # App icons
├── og-image.png                   # Social share preview image
├── screenshot-wide-*.png           # Manifest screenshots (store listings)
├── robots.txt, sitemap.xml          # SEO
└── manifest.json                     # PWA manifest
```

## Installing as an app

- **Desktop (Chrome/Edge):** open the live site → click the install icon in the address bar, or the in-app install button.
- **Android:** open in Chrome → "Add to Home screen."
- **iOS:** open in Safari → Share → "Add to Home Screen" (iOS reads meta tags separately from the manifest for this).
- **Windows (Store-style package):** packaged via [PWABuilder](https://www.pwabuilder.com) — see Releases for a sideloadable build.

## Privacy

No accounts, no servers, no tracking. See [`privacy.html`](./privacy.html) for the full policy — short version: your tasks never leave your device unless you explicitly export them.

## Contributing

Contributions, bug reports, and feature requests are welcome. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for guidelines.

## License

Licensed under the [MIT License](./LICENSE).

## Author

**Bala Maneesh Ayanala**
Full-Stack Developer · IBM SkillsBuild
[Portfolio](https://abms-portfolio.netlify.app) · [LinkedIn](https://linkedin.com/in/bala-maneesh-ayanala-702582266) · [GitHub](https://github.com/Balama2520)
