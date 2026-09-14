# Betterehau — Local REHAU Bridge for Home Assistant

Local, cloud-free Home Assistant integration for the **REHAU Nea Smart 2.0**
heating / cooling base station. Talks straight to the device on the LAN
(HTTP scrape) and re-publishes everything as MQTT discovery entities. The
Bridge, control UI, REST API, and native REHAU proxy run together in one Docker
container.

> **About this fork.** This fork builds on
> [`manuxio/rehau-nea-smart-2-home-assistant`](https://github.com/manuxio/rehau-nea-smart-2-home-assistant)
> and adds robust energy-level parsing, verified Holiday writes, a live System
> refresh on page entry, and an optional proxy for the native REHAU web UI.

This fork uses the local-only architecture introduced in v6.0.0. It does not
use the REHAU cloud, a Home Assistant Supervisor add-on, or separate ESP32
firmware.

---

## Screenshots

### In Home Assistant

Once the container is running and connected to MQTT, HA discovers a single
MQTT device with all the entities — climate per room, system selects,
sensors, switches, diagnostics — populated from the live state of the
REHAU base station.

<p align="center">
  <img src="docs/screenshots/00-ha-device.png" alt="Home Assistant device page for REHAU Nea Smart 2" width="720"/>
</p>

### In the bundled Web UI (mobile)

The bundled web UI is mobile-first — installable as a PWA from any
browser, themed for dark / light, EN + IT. Every shot below comes
straight from the running SPA against a real REHAU base station on
the LAN — no mocks, no Photoshop, just headless-Chromium + a CSS
phone frame.

<table>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/phone/00-login.png" alt="Login" width="280"/><br/>
      <sub><b>Login</b> — JWT-bearer, local-only. No e-mail, no cloud, no 2FA.</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/phone/01-home.png" alt="Dashboard" width="280"/><br/>
      <sub><b>Dashboard</b> — rooms grouped by floor, live temperature and humidity, current mode pill, and the active setpoint. Scenes (one-tap mode + setpoint roll-outs) sit at the top.</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/phone/02-room-detail.png" alt="Room — mode + setpoint" width="280"/><br/>
      <sub><b>Room — mode + setpoint</b> — segmented mode chooser drives a radial dial. Writes are optimistic on the bridge: the new target shows instantly and reverts only if REHAU refuses it.</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/phone/03-system.png" alt="System" width="280"/><br/>
      <sub><b>System</b> — heating / cooling / manual tiles, energy-level pills (Normal · Reduced · Standby · Auto · Holiday), live outdoor temperature, and the active winter ↔ summer window.</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/phone/04-floors.png" alt="Floors editor" width="280"/><br/>
      <sub><b>Floors editor</b> — assign each room to a floor label. The Dashboard regroups (alphabetic) automatically; below the floors list sit the REHAU-state telemetry and app-version chips.</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/phone/05-scenes-editor.png" alt="Scene editor — global mode + setpoint" width="280"/><br/>
      <sub><b>Scene editor — global</b> — name, icon (twenty options), scope (All rooms / Per-room), the target mode and, for Normal / Reduced, a setpoint Stepper. Apply once → every room writes through the optimistic-write path.</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/phone/06-scenes-perroom.png" alt="Scene editor — per-room" width="280"/><br/>
      <sub><b>Scene editor — per-room</b> — flip the Scope toggle and each room gets its own mode + setpoint pair. Rooms left on "Skip" stay untouched when the scene fires — useful for asymmetric night-time profiles.</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/phone/07-programs.png" alt="Programs" width="280"/><br/>
      <sub><b>Programs</b> — five weekly programs × ten daily slots, mirrored straight from the device. The slot picker is filled lazily — every slot is reachable, even ones REHAU's UI hides behind the dropdown.</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/phone/08-messages.png" alt="Messages" width="280"/><br/>
      <sub><b>Messages</b> — REHAU notification log: alarm code, source channel, start / resolved timestamps. "Active only" filter and a one-tap "Acknowledge all" that POSTs <code>MessagesHidden=</code> on the device.</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/phone/09-installer.png" alt="Installer — icon tabs" width="280"/><br/>
      <sub><b>Installer</b> — restricted-access section for users with the installer code. Six subtabs (Curve, Calibration, Bus, I/O, Diagnostics, Advanced) live behind a horizontally-scrolling icon strip. Edits batch behind one Save button so REHAU's all-or-nothing forms get a single round-trip.</sub>
    </td>
  </tr>
</table>

---

## Runtime

| Component | Port | Purpose |
|---|---:|---|
| Betterehau Bridge and Web UI | `8081` | Polling, MQTT discovery, REST API, Swagger, and React UI |
| Native REHAU proxy | `8092` | Access to the base station's AP-only web interface |
| MQTT broker | external | Connects Betterehau to Home Assistant |

The production container is named `rehau-bridge-proxy` and uses the operating
system route to reach the REHAU access point.

---

## What this does for you

- **One HA device per REHAU installation** — climate, sensor, switch and
  binary_sensor entities are auto-discovered. No YAML, no templates.
- **Per-room climate** with the right mode mapping (`standby`→`off`,
  `normal`/`reduced`→`heat`, `program`→`auto`) and preset support for
  REHAU's native modes.
- **Fancoil awareness** — speed and flap state are surfaced as diagnostic
  sensors, plus a `binary_sensor` that mirrors the pink "fan running"
  badge on the REHAU console.
- **Lock / Auto-start / Open-window detection** per room exposed as
  HA switches (config entity category) — wires straight to the
  `room-set-up.html` form on the device.
- **Calibration offsets** (outdoor probe + per-room temperature/humidity)
  visible as diagnostic sensors when `expose_calibration: true`.
- **Raw I/O** of master + every U-module (RZ, RELAY, DI, AI, AO) when
  `expose_io: true`, useful for power-user automations.
- **Web UI** (React SPA, dark/light theme, EN/IT) exposed directly on
  `http://<docker-host>:8081/` for fullscreen / PWA use.
- **Reliable global energy control** — malformed duplicate `selected`
  options from REHAU firmware are resolved like a browser, and Holiday
  writes remain pending until the base station confirms them.
- **Fresh System state on entry** — opening the System page triggers one
  targeted device refresh instead of waiting for the normal poll interval.
- **Optional native web proxy** — expose the AP-only REHAU interface through
  the bridge host without running a separate proxy container.
- **Mobile-first**: PWA manifest, status-bar safe areas, scrollbars
  hidden, pinch zoom disabled, font scales with the OS text-size
  preference. Add to home screen → fullscreen app.

## How it works

```text
REHAU base (AP mode, 192.168.0.2)
               |
               | local HTTP via the Docker host route
               v
rehau-bridge-proxy
  |-- Bridge + Web UI + REST/Swagger :8081
  |-- Native REHAU proxy             :8092
  `-- MQTT -------------------------> external broker
                                           |
                                           v
                                    Home Assistant
```

1. A poller scrapes the REHAU device's installer web UI on a tight
   schedule (rooms every 15 s, room details round-robin every 60 s, I/O
   every 10 s, messages every 5 min — all tunable).
2. State is normalised into a typed store; every change emits an event.
3. The MQTT bridge publishes retained state JSON per topic, plus HA
   discovery payloads (climate, sensor, switch, binary_sensor) so HA
   builds the device card automatically.
4. The Fastify server exposes a JSON REST API (`/api/v1/*`), a Swagger
  UI (`/docs`), and the bundled React SPA at `/`. When enabled, a second
  listener transparently proxies the native REHAU web UI.

### Why local, not cloud

| | Local (this bridge) | Cloud-based (previous v5 line) |
|---|---|---|
| Latency | ~150 ms LAN round-trip | seconds — and a Playwright session has to be running |
| Auth | One installer code | E-mail account + password + 2FA via POP3 / OAuth2 |
| Rate limit | None (your device) | REHAU may throttle |
| Privacy | Nothing leaves the LAN | Your control state goes through REHAU's servers |
| Outage tolerance | Works if HA + REHAU on LAN | Breaks the moment REHAU has an outage |

The trade-off: local needs the **installer code** for the device (printed
on the box, sticker, or the unique code page on the device itself). Cloud
needed your REHAU MyHome account. Pick whichever fits your setup; you can
only run one at a time.

---

## Prerequisite — REHAU base station in AP mode

The local REHAU web interface is available only while the base station is in
Access Point mode, normally at `http://192.168.0.2`. The Docker host needs a
network interface connected to that access point and a route to `192.168.0.2`.
Betterehau needs no interface selector; the operating system chooses the route.

You also need the first eight characters of the REHAU unique code as the
installer code. Cloud mode is not supported by this bridge.

## Quick start

Clone the repository and create a `.env` file next to `docker-compose.yml`.
At minimum, set `DEVICE_INSTALLER_CODE`, `MQTT_URL`, `JWT_SECRET`, and
`API_PASSWORD_HASH`.

### Docker Compose sample

This sample uses host networking so the container inherits the Linux host's
route to the REHAU access point.

```yaml
services:
  rehau-bridge-proxy:
    build: .
    image: rehau-bridge:local
    container_name: rehau-bridge-proxy
    restart: unless-stopped
    network_mode: host
    env_file:
      - .env
    environment:
      DEVICE_URL: http://192.168.0.2
      HTTP_PORT: 8081
      DEVICE_PROXY_ENABLED: "true"
      DEVICE_PROXY_PORT: 8092
      MQTT_BASE_TOPIC: rehau
      MQTT_HA_DISCOVERY: "true"
      INSTALLATION_NAME: Home
      ADMIN_ROLE: installer
      EXPOSE_IO: "true"
      EXPOSE_CALIBRATION: "false"
      LOG_LEVEL: info
      LOG_FORMAT: json
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:8081/healthz"]
      interval: 30s
      timeout: 3s
      retries: 3
```

Sample `.env`:

```dotenv
DEVICE_INSTALLER_CODE=12345678
MQTT_URL=mqtt://192.168.178.79:1883
MQTT_USERNAME=rehau
MQTT_PASSWORD=change-me
JWT_SECRET=replace-with-at-least-32-random-characters
API_USER=admin
API_PASSWORD_HASH=replace-with-a-bcrypt-hash
```

Generate the API password hash with `npm run hashpw -- <password>`, then start
the container:

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f rehau-bridge-proxy
```

With MQTT discovery enabled, Home Assistant creates:

- one `climate.<installation>_<room>` entity per zone
- `sensor.<installation>_<room>_humidity` per zone
- `select.<installation>_operating_mode`, `_energy_level`
- `binary_sensor.<installation>_alarms_active`
- switches for room lock / auto-start / window detection, plus the room light
  when applicable
- diagnostic sensors for fancoil running / fan speed / flap
- diagnostic I/O entities when `EXPOSE_IO=true`
- diagnostic calibration sensors when `EXPOSE_CALIBRATION=true`

Open the interfaces:

- Betterehau: `http://<docker-host>:8081/`
- Native REHAU UI: `http://<docker-host>:8092/`

---

## Configuration reference

All options are environment variables. `docker-compose.yml` can load secrets
and host-specific values from `.env`.

| Key | Default | What |
|---|---|---|
| `DEVICE_URL` | `http://10.0.0.1` in Compose | REHAU base URL; use `http://192.168.0.2` in AP mode |
| `DEVICE_INSTALLER_CODE` | *(empty)* | First 8 characters of the REHAU unique code |
| `DEVICE_REQUEST_TIMEOUT_MS` / `DEVICE_MIN_GAP_MS` | `5000` / `150` | Request timeout and minimum delay between device calls |
| `HTTP_PORT` | `8080` | Bridge, API, and Web UI listener inside the container |
| `DEVICE_PROXY_ENABLED` / `DEVICE_PROXY_PORT` | `false` / `8092` | Enable the native REHAU proxy and choose its listener port |
| `API_USER` / `API_PASSWORD_HASH` | `admin` / required | Local Web UI credentials; password must be a bcrypt hash |
| `JWT_SECRET` / `JWT_TTL` | required / `1h` | Token signing secret and lifetime |
| `ADMIN_ROLE` | `installer` | `user` or `installer` Web UI access |
| `INSTALLATION_NAME` | `Casa` | Home Assistant device name and MQTT topic slug |
| `MQTT_URL` / `MQTT_USERNAME` / `MQTT_PASSWORD` | *(empty)* | External MQTT broker connection |
| `MQTT_BASE_TOPIC` / `MQTT_HA_DISCOVERY` | `rehau` / `true` | MQTT root topic and Home Assistant discovery |
| `POLL_DASHBOARD_S` / `POLL_ROOMS_S` | `120` / `120` | Dashboard and room-list polling intervals |
| `POLL_MESSAGES_S` / `POLL_IO_S` | `300` / `10` | Message and I/O polling intervals |
| `EXPOSE_IO` / `EXPOSE_CALIBRATION` | `true` / `false` | Diagnostic MQTT entities |
| `ROOM_FLOORS` | *(empty)* | Initial floor mapping, for example `0:First,1:Ground` |
| `LOG_LEVEL` / `LOG_FORMAT` | `info` / `json` | Logging verbosity and output format |

### Native REHAU web proxy

Set `DEVICE_PROXY_ENABLED=true` to make the base station's AP-only web UI
reachable through the bridge host. Open
`http://<bridge-host>:<DEVICE_PROXY_PORT>/`; the default proxy port is `8092`.
The bridge follows the operating system route to `DEVICE_URL`, so a host with a
dedicated interface for the REHAU access point needs no interface setting in the
application.

The proxy does not add authentication. Keep it on a trusted LAN and never expose
the proxy port directly to the internet.

---

## MQTT topic structure

```
<base>/<installation-slug>/<device-id>/
├── system/state                                # JSON
├── system/operating_mode/set                   # command topic
├── system/energy_level/set                     # command topic
├── messages                                    # JSON array
├── alarms/active                               # "true" | "false"
├── alarms/count                                # integer
├── io                                          # JSON snapshot
├── availability                                # "online" | "offline" (LWT)
└── rooms/<room-id>/
    ├── state                                   # full Room JSON
    ├── setpoint/set                            # float °C
    ├── mode/set                                # standby|normal|reduced|program
    ├── light/set                               # "true" | "false"
    ├── lock/set                                # "true" | "false"
    ├── auto_start/set                          # "true" | "false"
    └── window_detection/set                    # "true" | "false"
```

Example with `installation_name=Casa` and `device_id=27165454`:
`rehau/casa/27165454/rooms/r-arianna/state`

The slug-in-the-path lets multiple installations coexist on the same
broker without collisions.

---

## Web UI

The bundled React SPA lives at `/` on the Bridge port. Features:

- **Dashboard** — room cards with current temperature, setpoint, mode
  pill, program strip, fancoil status (icon spins when running), light
  state (icon glows when on).
- **System** — operating mode, energy level, outdoor temperature,
  seasonal window, device info, link to Swagger docs.
- **Messages** — REHAU alarms / events with active filter.
- **Programs** — visual editor for the 10 daily programs (15-min
  resolution, drag-to-paint) and the 5 weekly programs (per-day
  stepper).
- **Installer** (installer role only) — heat curve, calibration,
  bus topology, live I/O, diagnostics, and direct edit of every
  installer-page setting (curve / heat-cool / devices / functions /
  PID / fancoil).
- **Room detail** — radial setpoint dial, mode segmented control,
  per-room preferences (lock / auto-start / window detection),
  accessories (light, fancoil status, flap).
- Dark + light theme, EN + IT, OS-text-size aware, mobile/PWA optimised.

REST + SSE are mounted under `/api/v1/`; OpenAPI 3 spec at
`/openapi.json`, Swagger UI at `/docs`.

---

## Common issues

**The bridge starts but I see no rooms.**
The base station is unreachable. Check `DEVICE_URL`, ping it from the
Docker host, and verify the route. The bridge logs the first failure with the
exact URL it tried.

**`ConnectTimeout` errors in the log.**
REHAU's TCP socket table is small; back-to-back requests can exhaust
TIME_WAIT. Raise `DEVICE_MIN_GAP_MS` to `250` or `400`. The bridge
already enforces a cool-down + retry.

**MQTT entities not appearing in HA.**
Make sure the configured broker is reachable and set `MQTT_URL` explicitly.
Check the container log for `mqtt connecting` and
`ha discovery published`.

**Web UI loads but every action fails with 401.**
Your JWT expired. The default TTL is `1h`; set `JWT_TTL=30d` or another
duration appropriate for your environment.

**Fancoil button doesn't appear for a room that has a fancoil.**
REHAU's installer page (`installer-room-set-up.html`) field `FanH`
must be `HC` or `Heating` for heating-only systems. The bridge only
shows what REHAU's UI shows; if you don't see the fancoil button on
the REHAU display either, fix `FanH` there first.

---

## Development

Source for the bridge and web UI lives in this repository under `apps/`, with
shared types under `packages/`.

Requires Node.js 22 or newer. Install dependencies and validate a change with:

```bash
npm ci
npm test
npm run typecheck
npm run build
```

The production image is built from the root `Dockerfile` and orchestrated with
`docker-compose.yml`.

---

## License

MIT. See the linked source repo for full text. The bundled fonts
(IBM Plex Sans/Mono, Bricolage Grotesque) and the REHAU trademark
remain property of their owners.

REHAU® and Nea Smart® are trademarks of REHAU AG. This project is an
independent third-party integration, not affiliated with or endorsed
by REHAU.
