# Frontend architecture

The frontend is deliberately layered:

UI → State → Service Layer → Mock Data

The service layer is the replacement point for future REST APIs. UI components should not contain API calls or scattered demo objects.
