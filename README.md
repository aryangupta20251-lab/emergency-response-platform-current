# Emergency Response Platform

A full-stack emergency response platform for reporting road incidents, managing responder workflows, and supporting admin oversight. The project includes a React/Vite web frontend, a Node.js/Express API, and PostgreSQL data persistence.

## Technology stack

- React 19 + Vite 7 + React Router 6
- Node.js + Express
- PostgreSQL
- JWT-based authentication and role-based authorization
- Socket.IO for realtime notifications and incident updates
- Leaflet/OpenStreetMap map tiles for location-aware views

## Project structure

```text
EmergencyResponsePlatform/
  backend/           Express API and PostgreSQL integration
  docs/              Design and product documentation
  mobile/            Expo/mobile app foundation
  web/               Vite React frontend for browser deployment
  .github/workflows/ GitHub Pages deployment workflow
```

## Core functionality

- Citizen registration, login, profile, emergency contacts, and settings
- Accident reporting, review, and incident tracking
- Hospital directory and nearby hospital queries
- Responder profile, availability, assignment, and status flows
- Admin user, responder, incident, visibility, and statistics management
- Notification reads, unread counts, and realtime incident updates
- GitHub Pages deployment for the frontend static build

## Local development

Install workspace dependencies:

```bash
npm install
```

Start the backend:

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Start the frontend:

```bash
npm run web
```

The frontend runs at `http://localhost:5173/` and the backend defaults to `http://localhost:5000`.

## Backend environment

Create a backend `.env` from the example file and set secure values for:

- `PORT`
- `CORS_ORIGIN`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `NODE_ENV`

Do not commit real secrets or production credentials.

## Frontend environment

The frontend is configured to use a backend URL from the environment variable `VITE_API_BASE_URL` when present. If it is not set, it falls back to the local development backend:

```text
http://localhost:5000/api
```

For deployed or hosted backend environments, set the variable to the live API origin before building or running the app.

## Testing and validation

Backend tests:

```bash
cd backend
npm test
```

Frontend build:

```bash
npm --workspace web run build
```

## GitHub Pages deployment

The frontend is deployed to GitHub Pages via the workflow in `.github/workflows/deploy-pages.yml`. The app uses a GitHub Pages-compatible Vite base path and SPA fallback files so nested routes can reload safely in a static hosting environment.

## Important production note

GitHub Pages hosts only the frontend. The backend remains a separate application that must be deployed to an environment with its own infrastructure and database credentials. The project is production-configurable, but it does not claim to have a public production backend without explicit external deployment setup.
