# Web screen map

The React web application uses the Express API for authentication, incident
reporting/history, hospital-directory reads, notifications, and supported
responder/admin actions. Role-protected routes are enforced in the frontend
and independently by backend authorization.

## Public and authentication

- `/` — landing page; map area and directory counts are labeled development
  preview content.
- `/login`, `/register` — citizen account access.
- `/forgot-password`, `/reset-password` — request and complete a reset using a
  single-use token. Actual delivery depends on the configured backend
  transport.

## Citizen

- `/dashboard` — explicitly labeled sample dashboard data.
- `/report-accident` and the `/report-accident/location`,
  `/report-accident/information`, and `/report-accident/review` steps —
  incident submission.
- `/incidents`, `/incidents/:incidentId` — the signed-in user's incident list,
  detail, and status history.
- `/hospitals`, `/hospitals/:hospitalId` — backend directory and record detail.
- `/notifications`, `/notifications/:notificationId` — personal notifications.
- `/emergency-contacts`, `/profile`, `/settings` — account and contact
  management.

## Responder

- `/responder` — responder profile, availability, and assigned incidents.
- `/responder/incident/:incidentId` — assigned-incident detail and supported
  status transitions.

## Admin

- `/admin` — backend-provided platform counts.
- `/admin/users`, `/admin/incidents`, `/admin/responders` — supported
  administration and incident coordination.
- `/admin/hospitals` — read-only backend directory.
- `/admin/analytics` — only backend-provided aggregate metrics.
- `/admin/audit-log`, `/admin/reports` — informational unavailable states;
  persistent audit logging and report export are not implemented.

## Mobile

The Expo routes are preview placeholders and are not connected to the backend.
They are not a production client.
