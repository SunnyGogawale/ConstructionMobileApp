# BuildFlow Construction Operations

A React web workspace, Expo worker app, and Express/MongoDB API.

## Targets

- `apps/web`: responsive admin and project-manager workspace, project lists, attendance and progress views, finance modules, reports, notifications, and settings.
- `apps/mobile`: worker-focused Expo app with secure sign-in, project opportunities, GPS/selfie attendance, break controls, progress submissions, and photo uploads.
- `backend`: Express API with JWT role checks, MongoDB models, project assignment, attendance, progress, and image upload routes.

## Backend

1. Install MongoDB and create a local database.
2. In `backend`, copy `.env.example` to `.env`, set `MONGODB_URI`, and provide a random `JWT_SECRET` of at least 32 characters.
3. Set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` (at least 12 characters) in the environment, then run `npm run seed:admin` to create the first administrator.
4. Run `npm run dev` from `backend`.

Image uploads are stored locally in `backend/uploads` for development. Use managed object storage and signed uploads in production. Configure `CORS_ORIGIN` for the deployed web origin.

## Web

1. In `apps/web`, run `npm install`.
2. Copy `.env.example` to `.env.local` and set `VITE_API_URL` to the backend URL.
3. Run `npm run dev` and open the printed local URL.

The project workspace includes realistic preview data. Sign-in uses the backend when `VITE_API_URL` is configured; project creation is persisted for an authenticated admin or project manager.

## Mobile

1. In `apps/mobile`, run `npm install`.
2. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL`. For a physical device, use the computer's LAN IP instead of `localhost`.
3. Run `npx expo start`, then open the app in an iOS or Android simulator/device.

The mobile app requires a worker account. Check-in/out submit GPS and uploaded selfie evidence; breaks and exclusive acceptance are server-authoritative. Camera and location permissions are required.

## Verification

- Web production build: `cd apps/web && npm run build`
- Mobile iOS bundle: `cd apps/mobile && npx expo export --platform ios`
- Backend tests: `cd backend && npm test`
