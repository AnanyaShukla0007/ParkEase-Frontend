# ParkEase — Angular 16 Frontend

A neo-futuristic, fully-animated frontend for the ParkEase Smart Parking Lot Management System. Wired to the ParkEase .NET 8 microservices backend through the YARP API gateway at `localhost:5000/api/v1/*`.

> **Find. Reserve. Park. Effortlessly.**

---

## What you get

A three-role Angular 16 application:

- **Landing** — animated hero with moving cars on a scrolling road, glowing parking grid on the horizon, parallax skyline, city pulse bars, editorial feature grid, marquee strip.
- **Auth** — split-screen login + 2-step register (driver / lot manager) with a mini-animated parking lot as the art panel.
- **Driver dashboard** — stats, upcoming bookings, garage preview.
- **Driver nearby lots** — Leaflet dark-tile map + geolocated side list, custom drop-pin markers color-coded by availability.
- **Driver lot detail** — spot-grid visualizer per floor with EV / accessible badges, animated occupancy ring, filter pills, booking modal with fare preview.
- **Driver bookings** — filter tabs, check-in / check-out / cancel actions wired to real endpoints.
- **Driver vehicles** — garage grid with inline SVG car illustrations; EV-tagged cars glow cyan.
- **Manager dashboard** — portfolio stats, recent activity across all their lots.
- **Manager lots** — card grid with live occupancy metrics; create new lot with a "Use my GPS" button.
- **Manager lot edit** — full spot grid with bulk-create, per-spot release / delete.
- **Manager analytics** — 24-hour occupancy bars, revenue-by-day bars, spot-type utilisation rows. Pure SCSS, no chart library.
- **Admin dashboard** — platform KPIs, top cities by lot count, pending approvals queue.
- **Admin lot approvals** — approve / reject / delete with full review card.
- **Admin users** — searchable table with role filters, suspend / reactivate / delete.

## Stack

- **Angular 16.2.12** (matches `Angular CLI 16.2.16` and `Node 18.20.8`)
- **Leaflet 1.9.4** for the nearby-lots map — dark tiles via CARTO Voyager (free, no API key)
- **RxJS 7** everywhere
- Zero UI component libraries — every card, chart, modal, and animation is hand-rolled SCSS

## Aesthetic

- **Fraunces** (display serif) × **IBM Plex Sans** (body) × **JetBrains Mono** (mono) via Google Fonts
- High-voltage amber `#ffd84d` + electric cyan `#5eead4` + lime `#c6ff4d` + rose `#ff5d73` on ink-900 `#050a14`
- Grain overlay + atmospheric radial gradients everywhere — never a flat background
- CSS-keyframed animations for cars, lanes, spot pulses, bar growth, pin drops, occupancy rings

## Getting started

### Prerequisites

- Node.js 18+ (you have 18.20.8 — perfect)
- npm 10+ (you have 10.8.2 — perfect)
- Angular CLI 16 (`npm i -g @angular/cli@16`)
- The ParkEase backend running with the gateway at `localhost:5000`

### Install

```bash
cd parkease-frontend
npm install
```

### Run dev server

```bash
ng serve
# or
npm start
```

Opens at **http://localhost:4200**.

### Configure backend URL

Edit `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api/v1'  // your YARP gateway
};
```

If you're running the backend on a different port or hostname (hotspot IP, Docker, etc.), change it here.

### CORS

The frontend runs on `:4200`, the gateway on `:5000`. Add this to your gateway's `Program.cs` once if it's not there already:

```csharp
builder.Services.AddCors(o => o.AddPolicy("spa", p =>
    p.WithOrigins("http://localhost:4200")
     .AllowAnyMethod()
     .AllowAnyHeader()));

app.UseCors("spa");
```

### Build for production

```bash
ng build
```

Outputs to `dist/parkease-frontend/`.

---

## Project structure

```
src/app/
├── core/
│   ├── guards/             authGuard, roleGuard
│   ├── interceptors/       JWT + 401 auto-logout
│   ├── models/             Backend-mirrored DTOs and enums
│   └── services/           auth, geolocation, 8 API services
├── features/
│   ├── landing/            Animated hero + marketing
│   ├── auth/               login, register (2-step)
│   ├── driver/             dashboard, nearby, lot-detail, bookings, vehicles
│   ├── manager/            dashboard, lots, lot-edit, analytics
│   └── admin/              dashboard, lot approvals, users
└── shared/
    ├── components/         DashNavComponent
    ├── shared.module.ts
    └── dashboard-shared.scss
```

Every service in `core/services/api.services.ts` maps 1:1 to a controller in your backend — auth, parkinglots, spots, bookings, payments, vehicles, notifications, analytics.

## Backend alignment notes

All numeric enums match the .NET side exactly:

| Enum | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| `SpotType` | Compact | Standard | Large | Motorbike | EV |
| `SpotStatus` | Available | Reserved | Occupied | | |
| `VehicleType` | TwoWheeler | FourWheeler | Heavy | | |
| `BookingType` | PreBooking | WalkIn | | | |
| `BookingStatus` | Reserved | Active | Completed | Cancelled | |
| `PaymentState` | Pending | Paid | Refunded | Failed | |

DTOs follow your exact field names: `StartTimeUtc`, `EndTimeUtc`, `EstimatedAmount`, `FinalAmount`, `VehiclePlate`, `IsEVCharging`, `IsHandicapped`, `PricePerHour`, etc.

## Known things that work end-to-end

- Register a driver → log in → nearby lots → book a spot → check in → check out → see it in history
- Register a manager → log in → register a lot (uses GPS) → bulk-create spots → analytics after a few bookings
- Log in as admin → approve pending lots → suspend a user

## Known things that need the backend up

The whole thing, basically — but that's the point. If the gateway at `localhost:5000` isn't up, you'll see friendly "Cannot reach the gateway" messages in place of crashes.

---

Built against the Parking Lot System (.NET Edition) case study, v1.0 · 2026.
