# Emergency Response Platform API

A small Express REST API foundation for the Emergency Response Platform.

This backend is a coordination technology layer. It does not replace India official emergency services such as 112 or 108, and it does not dispatch real responders or provide medical advice.

## Requirements

- Node.js 18.11 or newer
- npm

## Setup

From this folder, install dependencies with npm install.

Create a local environment file from the example with:
Copy-Item .env.example .env

Start the development server with npm run dev.

The API listens on http://localhost:5000 by default. Set PORT in .env to use another port.

## Available endpoints

- GET /api — confirms that the API foundation is available.
- GET /api/health — confirms that the API and PostgreSQL connection are responding.

### Hospitals

Hospital directory read routes are public; user and incident data remain protected:

- GET /api/hospitals — list active hospitals; supports `type`, `city`, and `emergency=true|false` filters.
- GET /api/hospitals/:id — retrieve an active hospital by its stable slug.
- GET /api/hospitals/nearby?latitude=...&longitude=... — nearby search; `radius` defaults to 10 km and has a 50 km maximum.

Nearby `distanceKm` is approximate straight-line distance calculated with the
Haversine formula. It is not driving distance. Emergency availability is a
stored directory flag, not a live capacity or acceptance signal.

Run `npm run db:migrate` and then `npm run db:seed:hospitals` to load the
development listings. Seeded records use synthetic coordinates, contain no
phone numbers, and are marked `isDemo: true` with `dataSource: development_seed`.
The development seed command refuses to run when `NODE_ENV=production`.

### Responders and assignments

Responder identities use the existing `users` table and `responder` role. An
admin can create a responder profile with `POST /api/responders`; new profiles
start offline, inactive, and unverified. Only an admin can change activation or
verification using `PATCH /api/responders/:userId/verification`. No responder
or citizen endpoint can self-verify an account.

Responders can use `GET /api/responders/me`,
`PATCH /api/responders/me/location`, and
`PATCH /api/responders/me/availability`. Nearby discovery is admin-only at
`GET /api/responders/nearby` and
`GET /api/incidents/:id/responders`; its radius defaults to 10 km and is capped
at 50 km. Distances are approximate straight-line kilometers. Exact responder
locations are not returned to citizens.

An admin can assign an active, verified, available responder using
`POST /api/incidents/:id/assign-responder`. The incident must already be
verified; the existing status transition system records `responder_assigned`
and the responder becomes busy in the same transaction. Only the assigned
responder can advance that incident's status. Resolving or cancelling an
assignment releases an active, verified responder to available. The incident
owner can retrieve the assigned responder's safe summary using
`GET /api/incidents/:id/assigned-responder`.

### Notifications and live incident updates

Notifications are created only by backend incident and assignment operations.
Authenticated users can list their own notifications with
`GET /api/notifications?page=1&limit=20`, read their unread count with
`GET /api/notifications/unread-count`, mark one as read with
`PATCH /api/notifications/:id/read`, or mark their own unread notifications
read with `PATCH /api/notifications/read-all`. The maximum page size is 100.
There is no endpoint for clients to create arbitrary notifications.

Socket.IO shares the existing HTTP server. Connect using the authenticated
JWT in the Socket.IO `auth.token` option. The server validates the token and
current active user role, then joins only that user's private room; clients
cannot join arbitrary rooms. Events include `notification:new`,
`notification:read`, `notification:read-all`, and `incident:update`. Incident
events are emitted only to the reporter and assigned responder after the
database transaction commits. REST remains the persistent source of truth after
reconnects. No push, SMS, or email transport is configured.

## Configuration

.env.example lists safe configuration names. Database access and authentication
use the existing environment configuration; never put real secrets in the
example file. The local `.env` remains ignored by Git.