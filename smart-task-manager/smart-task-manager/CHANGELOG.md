# Changelog

All notable changes to this project are documented here.

## [2.0.0] — 2026-07

Full rebuild of the original task manager.

### Added
- Offline-first architecture via Service Worker (cache-first strategy)
- Voice input for adding tasks (Web Speech API)
- Pomodoro focus timer with session tracking
- Due-date browser reminders (Notifications API)
- Daily task-completion streak tracking
- Drag-and-drop task reordering
- Import / export tasks as JSON
- Dark / light theme toggle
- Keyboard shortcuts (`N`, `/`, `P`, `Esc`, `?`)
- Full PWA installability: manifest, icons, shortcuts, share target, file handlers
- Windows Widgets Board support (Adaptive Card widget)
- Window Controls Overlay and Tabbed Display support on desktop installs
- Protocol handler (`web+smarttasks://`) and Note Taking launch support
- Privacy policy page
- SEO basics: Open Graph tags, structured data, sitemap, robots.txt

### Changed
- Rebuilt from the original "Smart Mini Task Manager" prototype with a completely new UI and codebase

## [1.0.0] — 2025

Original task manager built during internship. IBM-themed, basic add/remove functionality, no offline support.
