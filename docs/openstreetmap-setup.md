# OpenStreetMap and Leaflet

The web app renders maps with Leaflet and OpenStreetMap raster tiles. No map API
key, Google Cloud project, or billing account is required.

Hospital records, coordinates, filters, and nearby distance results continue to
come from the Emergency Response Platform PostgreSQL-backed API. The browser
only renders those records as map markers. Browser location is requested only
after the user selects the location control; it is not collected continuously.

The map includes visible OpenStreetMap contributor attribution. The default
`tile.openstreetmap.org` service is community infrastructure with a usage policy
and no production availability guarantee. Use it respectfully for development
and low-volume testing; do not bulk-download or prefetch tiles. For a high-volume
or production deployment, select a tile provider or self-host tiles and follow
its terms. This project does not call a geocoder, Places, routing, or navigation
service.