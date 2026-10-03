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

The API listens on port 5000 by default. In development it binds to `0.0.0.0`
so a trusted device on the same LAN can reach it; production defaults to
`127.0.0.1`. On the PC, use `http://localhost:5000`. Set `PORT` in `.env` to
use another port. Keep development ports behind the private-network firewall;
do not expose them to the public internet.

`HOST` overrides the bind address. A production reverse-proxy or container
deployment that requires an external interface must set `HOST=0.0.0.0`
explicitly and restrict inbound access at the hosting firewall/proxy.

`CORS_ORIGIN` is a comma-separated allowlist of frontend origins. By default it
allows only `http://localhost:5173` and `http://127.0.0.1:5173`. For phone
testing, add `http://<PC-LAN-IP>:5173` to the local ignored `.env` and restart
the API. Wildcard origins are rejected.

## Available endpoints

- GET /api — confirms that the API foundation is available.
- GET /api/health — confirms that the API and PostgreSQL connection are responding.
- POST /api/auth/password-reset/request — requests reset delivery without revealing whether an account exists.
- POST /api/auth/password-reset/confirm — changes the password with a single-use, 30-minute token.

Password reset tokens are stored as SHA-256 hashes. Local development defaults
to a link printed in the backend terminal; this is a development-only delivery
sink, not email or SMS. Production must configure `PASSWORD_RESET_DELIVERY=webhook`,
`PASSWORD_RESET_URL`, `PASSWORD_RESET_WEBHOOK_URL`, and
`PASSWORD_RESET_WEBHOOK_TOKEN`. The configured HTTPS webhook receives a JSON
payload containing `recipient`, `resetUrl`, and `expiresAt`, authenticated by
the bearer token, and is responsible for private delivery. No email/SMS
provider is bundled. If delivery is disabled or unavailable, the request
returns an explicit service error rather than claiming that instructions were
sent.

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
`PATCH /api/responders/me/availability`. Their assigned incident list and
assignment-scoped detail/history are available from
`GET /api/responders/me/incidents` and
`GET /api/responders/me/incidents/:id`; other responders cannot read those
records through these endpoints. Nearby discovery is admin-only at
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

## Tests

Backend tests write temporary records to PostgreSQL. Configure
`TEST_DATABASE_URL` in the ignored `.env` to a separate disposable database
whose database name includes `test` (for example, `emergency_response_test`).
`npm test` migrates only this database and will not fall back to
`DATABASE_URL`. Never use a production database or a database containing data
you need. The tests remove their generated rows during teardown.

## LAN development

For full PC/phone instructions, including Vite's LAN binding, the API URL,
CORS allowlist, and Windows Firewall guidance, see the main project README's
"Run the Web App on Your Phone" section.