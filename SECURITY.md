# Security Policy

## Supported branch

Security hardening is maintained on `master`.

## Current dependency posture

CoinTracker is an Angular 9 / Firebase 7 application. The repository intentionally blocks critical production vulnerabilities with:

```bash
npm run audit:critical
```

A full `npm audit` can still report high or moderate advisories in the legacy Angular/Firebase dependency line. The available automated fix upgrades Angular/Firebase across multiple major versions, which is a breaking framework migration rather than a safe patch-level hardening change.

## Required gate before release

Firestore rules are owner-scoped: users can read/write only `users/{uid}` and `users/{uid}/coins` when `request.auth.uid == uid`; all other document paths are denied.

Run the full release gate before deploying:

```bash
npm run verify
```

This executes lint, production build, headless unit tests, and the critical production audit gate.

## Planned major migration

A clean all-level audit requires a dedicated framework upgrade project:

1. Upgrade Angular CLI/core/material incrementally to a supported LTS line.
2. Migrate Firebase/AngularFire to the current modular APIs.
3. Replace Protractor/Cypress 4 era e2e tooling with a current maintained browser test runner.
4. Re-run visual, auth, Firestore, wallet, and Firebase Hosting regression checks.

Do not apply `npm audit fix --force` directly on this branch without that migration plan; it installs breaking major versions and can silently invalidate Angular 9 runtime behavior.
