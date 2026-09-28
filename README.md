# Emergency Response Platform

Frontend-only Emergency Response Platform for organizing road-accident reports, citizen support flows, responder demos, hospital directories, and admin operations views.

## Technology stack

- React 19
- Vite 7
- React Router 6
- Lucide React icons
- CSS design tokens and responsive CSS
- Expo Router and React Native for the mobile workspace foundation

## Project structure

```text
EmergencyResponsePlatform/
	docs/             Design and screen documentation
	web/              React/Vite web application
		src/components/ Shared UI, layouts, maps, timelines, and states
		src/context/    Mock auth, report, contact, responder, and admin state
		src/data/       Centralized demo datasets
		src/pages/      Citizen, responder, and admin screens
		src/services/   Replaceable mock service boundaries
		src/styles/     Design tokens and global responsive styles
	mobile/           Expo Router mobile foundation
```

## Installation

From the project root:

```bash
npm install
```

The root workspace installs the web and mobile workspace dependencies. No PostgreSQL, backend, or deployment tooling is required for the current frontend scope.

## Development commands

Start the web application:

```bash
npm run web
```

The web app is available at `http://localhost:5173/`.

Build the web application:

```bash
npm run web:build
```

Start the mobile workspace foundation:

```bash
npm run mobile
```

## Current frontend scope

The frontend includes:

- Mock authentication and protected navigation
- Citizen dashboard and accident-reporting flow
- Demo incident history, detail, and timelines
- Demo hospital directory, search, filters, maps, and details
- Notifications, emergency contacts, profile, and settings UI
- Mock responder workspace and assignment actions
- Mock admin dashboard, management views, analytics, audit log, and reports
- Loading, error, empty, offline/demo, responsive, and accessibility states

## Mock/demo data and limitations

This frontend currently uses mock/demo data where applicable. Local UI changes are held in browser memory or local storage only. It does not replace 112/108 emergency infrastructure, does not perform real emergency dispatch, and does not claim that responders or hospitals are available in real time.

There is no real authentication server, GPS provider, map provider, push-notification service, responder dispatch, hospital capacity feed, audit backend, REST API, database, or production authorization. Frontend role restrictions are presentation-only and are not production authorization.

## Future integration direction

The context and service boundaries are intentionally replaceable:

```text
UI -> Context/state -> Mock service -> Future REST API -> Backend/database
```

Backend, API, database, real authentication, dispatch integrations, and deployment belong to a later phase.

## Design source of truth

The supplied Emergency Response Platform design reference defines the visual language. The implementation uses its approved palette, typography hierarchy, spacing, rounded cards, status colors, responsive navigation, and map presentation.
