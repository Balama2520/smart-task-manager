# Contributing to Smart Tasks

Thanks for considering a contribution — bug reports, feature ideas, and pull requests are all welcome.

## Reporting a bug

Open an [issue](https://github.com/Balama2520/smart-task-manager/issues/new) and include:
- What you expected to happen vs. what actually happened
- Steps to reproduce it
- Browser and OS (e.g. Chrome 126 on Windows 11)
- A screenshot if it's a visual bug

## Suggesting a feature

Open an issue describing the feature and the problem it solves. Keep in mind this project is intentionally:
- **Vanilla JS** — no frameworks or build tooling
- **Backend-free** — everything runs and stores data on the user's own device
- **Offline-first** — features shouldn't require a network connection to work

Feature requests that fit within those constraints are the easiest to merge.

## Making a pull request

1. Fork the repo and create a branch off `main`:
   ```bash
   git checkout -b feature/short-description
   ```
2. Make your changes. Since there's no build step, just edit `index.html`, `style.css`, and `script.js` directly and refresh the browser to test.
3. Test in at least one Chromium browser (Chrome/Edge) and, if your change touches CSS layout, one other browser too.
4. If you touch offline behavior, bump the `CACHE_NAME` version in `sw.js` so users actually receive the update.
5. Commit with a clear message and open a pull request describing what changed and why.

## Code style

- Keep it dependency-free — no adding frameworks, bundlers, or npm packages for the core app.
- Match the existing code style (4-ish spaces, descriptive function names, comments for anything non-obvious like browser API quirks).
- Don't add analytics, trackers, or any code that sends user data off-device — this is a hard rule, not a preference, and any PR that does this will be rejected.

## Questions

Open an issue or reach out via the links on the [author's GitHub profile](https://github.com/Balama2520).
