# Copilot instructions

## Build, test, and lint

There is no root package script; run commands from the relevant app directory.

- Web: `cd apps/web && npm run dev`, `npm run build`, or `npm run lint`.
- Mobile: `cd apps/mobile && npm start`, `npm run lint`, or `npx expo export --platform ios`. Use `--platform android` for an Android bundle.
- Backend: `cd backend && npm run dev` or `npm start`; run all tests with `npm test`.
- Run one backend test file with `cd backend && node --test test/attendance.test.js`. Narrow further with `node --test --test-name-pattern="GPS fix" test/attendance.test.js`.
- The backend uses Node's built-in test runner. Web and Mobile currently do not define test suites.

## Architecture

- This repository contains three deployable apps: a React/Vite workspace for administrators and project managers, an Expo worker app, and a shared Express/MongoDB API. The Web and Mobile clients call the same `/api` backend; keep client-specific UI and platform capabilities in their respective apps.
- Web starts in `apps/web/src/main.jsx` and renders `web.jsx`. Feature workflows live under `src/features/`, reusable UI under `src/components/`, and API/configuration/formatting helpers under `src/shared/`. `App.jsx` is a compatibility export.
- Mobile registers `Mobile.jsx` from `index.js`; `App.js` is a compatibility export. Screens are under `src/screens/`, shared UI under `src/components/`, and API/theme/styles under `src/shared/`. The current worker navigation is local tab state in `Mobile.jsx`, not Expo Router.
- Backend startup is `src/server.js`; `src/app.js` configures middleware and mounts `src/routes/`. Routes define endpoint paths and middleware, controllers handle HTTP requests, and domain helpers/services/models own reusable rules, integrations, and persistence respectively.

## Repository conventions

- Backend modules use JavaScript ES modules. Route handlers use Zod schemas for request validation and `allowRoles(...)` for role restrictions; authenticated handlers rely on `req.user`. Keep project/worker/manager query scoping in the backend, not only in client-side visibility.
- Authentication is public under `/api/auth` where intended; other protected API groups are mounted behind `authenticate` in `src/app.js`. Preserve route paths, payloads, status codes, role permissions, and MongoDB model/schema behavior when changing either client or server.
- Web API access uses `VITE_API_URL`; Mobile uses `EXPO_PUBLIC_API_URL`. Web sessions use `sessionStorage`; Mobile keeps its worker token in Expo SecureStore. Keep platform-specific session handling in its client.
- Attendance and breaks are server-authoritative. Mobile sends GPS/selfie evidence for attendance; do not replace server-side verification or break limits with client-only checks.
- Before changing Expo or React Native APIs, check the `expo` version in `apps/mobile/package.json` and use the matching versioned Expo documentation. Add Expo-compatible packages with `npx expo install <package>`.
- See [README.md](../README.md) for local environment setup, MongoDB/admin seeding, API behavior, and deployment configuration. Mobile-specific guidance is in [apps/mobile/AGENTS.md](../apps/mobile/AGENTS.md).
