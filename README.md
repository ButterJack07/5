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

- WASD / arrows: move; E: interact; Q: selected character's single active skill. There is no separate sprint button.
- Approach a generator and tap the translucent decode button beside it (or E) once. Decoding runs automatically; press Space or tap the calibration prompt when its needle reaches the highlighted zone. Missing a calibration loses progress and alerts the hunter. Moving, dashing, or taking damage cancels decoding. Hold E while stationary to open the exit.
- Near a standing pallet, E drops it and stuns a nearby hunter.
- Near a window, E vaults across it. When injured, hold E while stationary to bandage yourself.
- All survivor active skills have a 5-second cooldown. Courier: 0.8-second continuous dash at 26 units/sec. Warden: 2-second one-hit shield. Mist: 4-second smoke screen. Doctor: stationary self-healing in 3 seconds, interrupted by movement or damage; no other character can self-heal.
- Windows are built into walls and pallets into building doorways. Window and pallet vaults take 1 second with a short interpolated crossing, not a teleport. Window vault completion gives exactly 2 seconds of 30% movement speed increase.
- In 3D, drag the scene to rotate the camera. Movement is camera-relative.
- Mobile: virtual joystick, context interaction button, and exactly one character skill button.
- Switch views at any point without resetting the match.

Decode three machines, open the east gate, then walk through it. Two hits or a five-minute timeout ends the match. The expanded 140x140 map includes buildings, rock clusters, chained walls and open woodland. The hunter patrols, detects unobstructed nearby players, remembers sightings briefly, and uses grid pathfinding around obstacles.

## Scope and Future Networking

This is a single-player visual and interaction prototype, not a multiplayer release. There are no accounts, persistence, matchmaking, or four survivor bots yet.

For a small server, host static assets separately and use one authoritative WebSocket service: fixed 10-15 Hz room simulation, capped room count, inputs rather than client-authoritative positions, client-side interpolation, and reliable gameplay events. Do not simulate visual objects on the server. Measure CPU / bandwidth before setting room limits. SQLite with a single writer is sufficient for initial accounts and results; use secure password hashing, rate limits, and HTTPS when adding authentication.
