# Emergency Response Platform

A full-stack emergency response platform for reporting road incidents, managing responder workflows, and supporting admin oversight. The project includes a React/Vite web frontend, a Node.js/Express API, and PostgreSQL data persistence.

## Technology stack

- React 19 + Vite 7 + React Router 6
- Node.js + Express
- PostgreSQL
- JWT-based authentication and role-based authorization
- Socket.IO for realtime notifications and incident updates
- Google Maps JavaScript API for location-aware views

## Project structure

```text
EmergencyResponsePlatform/
  backend/           Authoritative Express API and PostgreSQL integration
  docs/              Design and product documentation
  mobile/            Expo/mobile app foundation
  web/               Vite React frontend for browser deployment
  .github/workflows/ GitHub Pages deployment workflow
```

In the current workspace, another `backend/` copy exists outside this
repository and differs from this project's API. The `backend/` inside this
repository is the authoritative implementation documented and used here.

## Core functionality

- Citizen registration, login, profile, emergency contacts, and settings
- Accident reporting, review, and incident tracking
- Hospital directory and nearby hospital queries
- Responder profile, availability, assignment, and status flows
- Admin user, responder, incident, visibility, and statistics management
- Notification reads, unread counts, and realtime incident updates
- GitHub Pages deployment for the frontend static build

Authenticated API requests re-check that the account remains active and its
role has not changed; signing in again is required after an administrator
changes a user's role. The web administrator and responder workspaces use
backend records for supported profile, assignment, status, and aggregate
operations. Dedicated audit logging, hospital administration, and report
export are not implemented and are identified as unavailable in the UI.

## Local development

Install frontend and mobile workspace dependencies from this directory:

```bash
npm install
```

Configure and start the backend in a separate PowerShell window:

```bash
Set-Location backend
npm install
Copy-Item .env.example .env
# Edit backend/.env and set DATABASE_URL and a unique JWT_SECRET.
npm run db:migrate
npm run dev
```

Start the web app from the project root in another window:

```bash
npm run web
```

Vite listens on `0.0.0.0:5173` for development, while remaining reachable on the
same PC at `http://localhost:5173/`. The API listens on `0.0.0.0:5000`; its
local URL is `http://localhost:5000`.

## Backend environment

Create a backend `.env` from the example file and set secure values for:

- `PORT`
- `HOST` (optional; development defaults to `0.0.0.0`, production to `127.0.0.1`)
- `CORS_ORIGIN`
- `DATABASE_URL`
- `TEST_DATABASE_URL` (required for backend tests; dedicated disposable PostgreSQL database)
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `NODE_ENV`
- `PASSWORD_RESET_DELIVERY`, `PASSWORD_RESET_URL`, and (for webhook delivery)
  `PASSWORD_RESET_WEBHOOK_URL` / `PASSWORD_RESET_WEBHOOK_TOKEN`

Do not commit real secrets or production credentials.

## Frontend environment

The web app reads `VITE_GOOGLE_MAPS_API_KEY` and optional `VITE_API_BASE_URL`
from `web/.env.local`. Start from the safe example:

```powershell
Copy-Item web\.env.example web\.env.local
```

For Vite development, when this variable is unset, the API host follows the
host used to open the web app. Production builds must set it to the deployed API
base URL before building.

Password reset is implemented with hashed, expiring, single-use database
tokens. Local development prints the private reset link in the backend terminal
only. No email/SMS provider is bundled; production delivery requires the
documented webhook configuration in `backend/README.md`.

## Google Maps configuration

The web maps use the Google Maps JavaScript API. Create or choose a Google
Cloud project, enable billing, enable **Maps JavaScript API**, and create an API
key. No Places, Routes, Geocoding, Roads, Street View, Navigation, or Elevation
API is needed for the current map views; hospital records and coordinates
continue to come from this application's backend.

Set `VITE_GOOGLE_MAPS_API_KEY` in the `web\.env.local` file created above. Vite
embeds `VITE_` variables in browser code, so this key is visible to users and is
**not a server-side secret**. Protect it in Google Cloud:

- Restrict the key to **Websites** (HTTP referrers) and to **Maps JavaScript API**.
- For local development, allow `http://localhost:5173/*` and
  `http://127.0.0.1:5173/*`.
- For LAN development, add the exact PC origin, such as
  `http://192.168.1.8:5173/*`; update it when the PC's LAN address changes.
- Add only the production website origins that actually serve the app. Use
  separate keys for development and production where practical.
- Do not commit `.env.local` or paste an unrestricted key into source control.

Restart Vite after changing the key. Google Maps Platform usage is billed
according to the current Google Cloud account and usage terms. Any included
monthly usage is monthly, not a daily allowance. Monitor Maps JavaScript API
usage and quotas in Google Cloud, and configure budget notifications. A budget
notification is an alert, **not** an automatic hard spending cap. Maps are
created only on pages that render them, but each rendered map contributes to
Google Maps usage.

## Run the Web App on Your Phone

This is local network development, not public deployment:

1. Connect the PC and phone to the same trusted Wi-Fi network.
2. Run `ipconfig` on the PC and note its IPv4 address for the active Wi-Fi adapter.
3. Set `CORS_ORIGIN` in `backend\.env` to include the frontend origin, for example
   `http://localhost:5173,http://127.0.0.1:5173,http://<PC-LAN-IP>:5173`.
   Replace the placeholder with the PC's actual IPv4 address; do not commit it.
4. Run the backend using `Set-Location backend; npm run dev`.
5. Run `npm run web` from the project root. Vite is already configured to accept
   LAN connections.
6. If the API runs on the same PC and port 5000, Vite development automatically
   targets the host used to open the page. Alternatively, create
   `web\.env.local` and set
   `VITE_API_BASE_URL=http://<PC-LAN-IP>:5000/api`. Restart Vite after changing
   frontend environment values.
7. On the phone, open `http://<PC-LAN-IP>:5173`.

On a phone, `localhost` means the phone itself, not the PC. The PC firewall may
block inbound connections. Do not disable Windows Firewall. If necessary, from
an elevated PowerShell window, add rules limited to private networks and the
local subnet:

```powershell
New-NetFirewallRule -DisplayName "Emergency Response Web Dev" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5173 -Profile Private -RemoteAddress LocalSubnet
New-NetFirewallRule -DisplayName "Emergency Response API Dev" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5000 -Profile Private -RemoteAddress LocalSubnet
```

Remove only these named rules when no longer needed. Firewall/network access and
the phone journey must be verified on the actual device; no physical phone test
is claimed by this project documentation.

The API permits only the configured CORS origins. Its default development
origins are localhost and 127.0.0.1; add the PC LAN frontend origin to the
ignored `backend\.env` for phone access. Do not use `*` or expose development
ports to public networks.

For this PC the current IPv4 address is `192.168.1.8`, so the phone URL is
`http://192.168.1.8:5173`. This address can change; check `ipconfig` before
each LAN session. The ignored local `backend\.env` may contain the current
address in `CORS_ORIGIN`; update it when the PC address changes. The web app
does not need a fixed `VITE_API_BASE_URL` for Vite development because it uses
the page host for API and Socket.IO requests.

## Mobile status

The Expo app is a navigation and visual shell only. Welcome, demo login, and
dashboard screens are placeholders; mobile authentication, backend
integration, reporting, and responder workflows are not implemented. Do not
use it as a production emergency-response client. Android export has an
outstanding `react-native-screens`/Expo compatibility failure; it is not a
verified installable mobile release.

## Testing and validation

Backend tests require a dedicated disposable PostgreSQL database. Set
`TEST_DATABASE_URL` to a separate database whose name includes `test` (for
example, `emergency_response_test`) in `backend\.env`. `npm test` applies the
migrations to that database and runs the integration tests; it never falls
back to `DATABASE_URL`. Do not point it at production or a database containing
data you need.

```powershell
Set-Location D:\new\EmergencyResponsePlatform\backend
npm test
```

Frontend unit tests and production build:

```powershell
Set-Location D:\new\EmergencyResponsePlatform
node --test web/test/*.test.js
npm run web:build
```

The backend test runner refuses to use `DATABASE_URL` as a fallback. Do not
point it at a production database or any database containing data you need.
The current local test suite has 63 backend tests and 8 frontend tests.

## Production deployment status

The existing production frontend is hosted on
[GitHub Pages](https://aryangupta20251-lab.github.io/emergency-response-platform-current/).
The most recent application-code revision, `c022d2d`, passed its GitHub Pages
build and deployment workflow. This documentation-only update does not change
the frontend or backend code. The workflow is defined in
[`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml);
it requires the repository Actions variables `VITE_API_BASE_URL` (the HTTPS
backend API base URL ending in `/api`) and `VITE_GOOGLE_MAPS_API_KEY` (a
browser key restricted to approved website referrers and Maps JavaScript API).
The Maps key is embedded in browser code and is not a server-side secret.

The existing Express API is deployed on
Railway at `https://emergency-response-platform-current-production.up.railway.app/api`.
The Railway production service uses this repository's `main` branch, the
`backend/` root directory, and the existing PostgreSQL service. The last
verified successful Railway deployment runs commit
`c022d2d92dbb464f28e0c852bec6fcf8dc223da5`; `/api/health` reported success
with PostgreSQL connected. Automatic deploys are disabled, so a backend code
change must be deployed from the existing Railway service. Do not create a
second service or project.

Real Google Maps JavaScript API tiles and controls have been verified on the
production Pages site. The configured browser key's Google Cloud restrictions
must still be managed and reviewed in Google Cloud; never add its value to
source control.

GitHub Pages serves only the frontend; the API and PostgreSQL remain separate
services. Production health and safe authentication failure paths have been
checked. Do not create production test accounts or incidents without an
approved cleanup procedure. The production hospital endpoint returned an
empty directory during the latest check; no live hospital records have been
verified or seeded into production.

## Known limitations and safety

- This platform does **not** replace 112/108 or official emergency dispatch,
  does not contact emergency services, and does not guarantee a response.
- It does not provide verified ambulance availability or guaranteed live
  hospital capacity. Hospital emergency flags are stored directory data.
  Nearby distances use approximate straight-line calculations, not driving
  routes.
- Production hospital results depend on records entered in the backend
  directory; development seed records use synthetic coordinates and are
  labeled as samples. The landing and citizen dashboard also contain clearly
  labeled sample content and must not be mistaken for live user or location
  data.
- The web client does not expose exact responder locations to citizens.
- Password-reset tokens are hashed, single-use, and expire after 30 minutes.
  A generic HTTPS webhook transport exists, but no bundled email/SMS provider
  is included and external email, SMS, or push delivery has not been verified.
- The admin audit-log, hospital create/edit, and report-export screens explain
  that their supporting backend capabilities are not implemented.
- The mobile app is a preview shell only. No physical-phone journey has been
  verified.
- This software does not provide medical advice. For a life-threatening
  emergency, contact official emergency services such as 112 or 108.
