# Grand Aurora Theatre: Interactive Ticket Selection

Front-end ticket selection for a theatre, built with HTML, CSS and vanilla JavaScript (Web & Mobile I project). No backend or libraries.

## How to run
Download or clone the repository and open `index.html` in a browser.

## Features
- Seat map generated from JavaScript data (`venue-data.js`), about 440 seats in 6 sections
- 4 price categories: VIP $120, Premium $90, Standard $65, Economy $35
- Click a seat to inspect it (section, row, seat, category, price, status); only ADD TO CART adds it
- Seat states: available, inspected, in cart, unavailable
- Cart with prices, total, remove and clear; duplicate seats are prevented
- Map and cart stay synchronized
- Cart saved in localStorage and restored after refresh
- Zoom in/out, move up/down/left/right, reset/center view
- Responsive layout for small screens
- Bonus: mouse-wheel zoom and click-drag panning

## Project structure
- `index.html`: page structure
- `style.css`: styling and responsive rules
- `venue-data.js`: venue model (sections, prices, stage)
- `app.js`: seat generation, rendering, cart, storage, navigation

## Known limitations
Seat availability is simulated; there is no backend or real checkout.
