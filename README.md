# Fogbound / Three-view Playtest

A browser-based original asymmetric chase prototype with a shared simulation and two switchable renderers: isometric Canvas and WebGL third-person using Three.js.

## Run

Requires Node.js 18 or newer. No npm installation required.

```sh
npm start
```

Open http://localhost:5173. For phones, connect to the same Wi-Fi and open your computer's LAN IP on port 5173. Allow the port through the local firewall only on trusted networks.

```sh
npm test
```

The 3D renderer loads Three.js from jsDelivr on first use; it requires internet access and WebGL. If loading fails, the isometric view remains available. Fonts are optional network resources.

## Controls

- WASD / arrows: move; Shift: sprint; hold E: interact.
- Remain stationary to repair generators and open the exit.
- Near a standing pallet, E drops it and stuns a nearby hunter.
- In 3D, drag the scene to rotate the camera. Movement is camera-relative.
- Mobile: virtual joystick, hold sprint / interact buttons.
- Switch views at any point without resetting the match.

Repair three generators, open the east gate, then walk through it. Two hits or a four-minute timeout ends the match. The hunter patrols, detects unobstructed nearby players, remembers sightings briefly, and uses grid pathfinding around obstacles.

## Scope and Future Networking

This is a single-player visual and interaction prototype, not a multiplayer release. There are no accounts, persistence, matchmaking, or four survivor bots yet.

For a small server, host static assets separately and use one authoritative WebSocket service: fixed 10-15 Hz room simulation, capped room count, inputs rather than client-authoritative positions, client-side interpolation, and reliable gameplay events. Do not simulate visual objects on the server. Measure CPU / bandwidth before setting room limits. SQLite with a single writer is sufficient for initial accounts and results; use secure password hashing, rate limits, and HTTPS when adding authentication.
