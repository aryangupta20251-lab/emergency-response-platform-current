# Frontend architecture

The browser app is organized into reusable UI and route/layout components,
React context for shared authentication and feature state, and service modules
for REST/Socket.IO communication with the backend. API base URL resolution is
centralized in `web/src/config/api.js`.

Citizen reporting, incident history/detail, hospital directory, notifications,
and the supported admin/responder profile and incident actions use the
authoritative Express API. The admin overview/analytics display only available
backend aggregates. Hospital administration, audit-event storage, and report
export are not implemented; their pages identify the missing API rather than
simulating success. The responder assignment list and detail are scoped by the
backend to the authenticated responder.

Google Maps JavaScript API loading is centralized in
`web/src/services/googleMapsLoader.js`. A real key is external configuration;
mock/test-double coverage is not evidence of a real Google Maps render.
