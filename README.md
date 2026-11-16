# Digi Class – Python Legends

A real third-person 3D arcade adventure where students write and run **real
Python** (via Pyodide — actual CPython compiled to WebAssembly, never
simulated or hard-coded output) to progress through a voxel-style world.
Built with React + TypeScript + Vite + Babylon.js.

This is a separate project from the main DigiClass platform, linked from its
"Digi Game" nav card. SQL is planned as a separate, future game and is out
of scope here.

## Status: Prompt 1 complete (playable 3D foundation)

What exists right now, and has been tested end-to-end:

- One controllable 3D robot character (built entirely from primitive
  meshes — no external/copyrighted assets) with walk, run, and jump.
- A third-person follow camera (drag to orbit).
- Real collision: the player has a proper Babylon.js collider (ellipsoid)
  and is moved with `moveWithCollisions()`, so the boundary walls, trees,
  rocks, and ground all actually stop the player instead of being walked
  through.
- One small explorable village world with a coin trail, trees, and rocks.
- One NPC with dialog.
- One glowing terminal that opens a real Python mission: students write
  and run actual Python code (via Pyodide, executed in a Web Worker) to
  complete it.
- Keyboard controls (WASD + Shift to run + Space to jump + E to interact)
  and touch controls (virtual joystick + run/jump/interact buttons) for
  mobile.
- A responsive HUD: coins, XP, current mission text, and a pause menu.

Everything from Prompts 2–8 in the build brief (multiple worlds/levels,
the full learning cycle, boss fights/arcade polish, the Study Skills
Academy, accounts/teacher dashboard, deployment/QA, and the separate SQL
game) is **not** built yet — this milestone is deliberately scoped to the
playable foundation only.

### Known limitations (disclosed honestly, not swept under the rug)

- `input()` inside a mission only supports a **fixed, pre-supplied** list
  of answers — not true interactive/blocking input. True interactive
  `input()` needs a cross-origin-isolated page (COOP/COEP) with
  `SharedArrayBuffer`, which is a later-phase change.
- No PWA manifest/service worker yet (explicitly deferred to Prompt 8),
  so it is not installable or offline-capable yet.
- The follow camera has no collision of its own, so in tight corners it
  can visually clip through scenery/walls. This is cosmetic — it does not
  affect player movement or physics.
- Camera zoom (pinch/scroll) isn't wired up to the camera's distance
  limits yet.
- Only one world, one NPC, one terminal, and one mission exist, by design
  — this is the Prompt 1 scope, not a bug.
- Not yet deployed anywhere public.

## Running it

```bash
npm install
npm run dev
```

Then open the printed local URL. Pyodide's runtime (~12MB) is self-hosted
under `public/pyodide/` (copied from the `pyodide` npm package) rather than
fetched from a CDN, so the game works without any third-party script host
being reachable.

### Type-checking

```bash
npx tsc -b --noEmit
```

## Tech stack

- **React 19 + TypeScript + Vite** — app shell and build tooling.
- **Babylon.js** (`@babylonjs/core`, `@babylonjs/materials`) — the 3D
  engine: camera, lighting, collisions, and every mesh in the world is
  built procedurally from primitives.
- **Pyodide**, running inside a classic Web Worker — real, sandboxed
  Python execution for every mission.
- **CodeMirror 6** (`@uiw/react-codemirror`, `@codemirror/lang-python`) —
  the in-game Python editor.

## Project layout

```
src/
  game/
    camera/        third-person follow camera
    characters/     the robot character + its movement/physics
    controls/       unified keyboard+touch input
    engine/         GameScene — the per-frame orchestrator
    missions/       mission data (story, starter code, success check)
    world/          the village world, the NPC, the terminal
  python-lab/        Pyodide worker + runner + the mission UI overlay
  ui/                HUD, touch controls, pause menu, dialog bubble
public/pyodide/      self-hosted Pyodide runtime (npm package, not CDN)
```
