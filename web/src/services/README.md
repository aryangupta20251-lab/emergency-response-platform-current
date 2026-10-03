The frontend service layer owns HTTP and Socket.IO communication with the
backend. API base URL resolution is centralized in `src/config/api.js`; UI
components should call feature services rather than issuing network requests
directly. Google Maps JavaScript API loading is centralized in
`src/services/googleMapsLoader.js` and shared by the map component.

Administrator, responder, and password-reset flows use the backend APIs. A
page should show unavailable/error state when an API capability does not
exist; do not substitute demo records or success-shaped local state.
