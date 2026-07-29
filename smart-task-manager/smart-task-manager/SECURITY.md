# Security Policy

## Reporting a vulnerability

If you find a security issue in Smart Tasks, please report it privately rather than opening a public issue:

- Open a [private security advisory](https://github.com/Balama2520/smart-task-manager/security/advisories/new) on GitHub, or
- Reach out via the contact links on the [author's GitHub profile](https://github.com/Balama2520)

Please include steps to reproduce and the potential impact. Since this app has no backend and no user accounts, most risk areas are:
- Cross-site scripting (XSS) in task rendering
- Service Worker cache-poisoning issues
- Manifest / protocol handler misuse

## Scope

This app stores all data locally in the browser (`localStorage`) and has no server component, so there is no user data to breach remotely — reports about server-side data exposure don't apply here. Reports about client-side vulnerabilities (XSS, insecure `postMessage` handling, etc.) are in scope and appreciated.
