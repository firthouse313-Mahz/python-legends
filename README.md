# Digi Class – Python Legends

A real third-person 3D arcade adventure where students write and run **real
Python** (via Pyodide — actual CPython compiled to WebAssembly, never
simulated or hard-coded output) to progress through a voxel-style world.
Built with React + TypeScript + Vite + Babylon.js.

This is a separate project from the main DigiClass platform, linked from its
"Digi Game" nav card. SQL is planned as a separate, future game and is out
of scope here.

## Status: Prompt 2 complete (curriculum worlds and level system)

### What exists right now, tested end-to-end

**The playable 3D foundation (Prompt 1):**
- One controllable 3D robot character (built entirely from primitive
  meshes — no external/copyrighted assets) with walk, run, jump, and real
  Babylon.js collision (boundary walls, trees, rocks and the ground all
  actually stop the player, via a collider ellipsoid + `moveWithCollisions()`).
- A third-person follow camera (drag to orbit).
- A small explorable village world, an NPC with dialog, a glowing terminal,
  keyboard controls (WASD + Shift to run + Space to jump + E to interact)
  and touch controls (virtual joystick + buttons) for mobile.
- A responsive HUD: coins, XP, current mission text, pause menu.

**The curriculum, world map, and level system (Prompt 2):**
- The full 5-world, 25-level curriculum map from the build brief, stored
  as structured data (`src/curriculum/worlds.ts`) rather than hard-coded
  into scene logic — topic, syllabus pathway tag, and whether it's been
  implemented yet, for every one of the 25 levels.
- A World Map hub screen (`src/ui/WorldMapScreen.tsx`) showing all five
  worlds. **World 1 — Python Village — is fully implemented and playable,
  end to end**, all 7 of its levels. Worlds 2–5 are shown with their real
  planned topic names, clearly labelled **"Coming soon"** — not empty or
  fake playable levels, per the brief's explicit instruction.
- Level states — locked / unlocked / in-progress / completed — computed
  from real progress, with sequential unlocking (level *N* opens once
  level *N-1* is completed).
- Save/resume: progress (completed levels, XP, coins, pathway choice)
  persists in the browser via `localStorage` and survives a reload.
  There's no backend yet — that's Prompt 7 (Supabase accounts) — so this
  is per-browser, not per-account, for now.
- A CS/IP syllabus pathway toggle exists in the data model and the hub UI.
  Every level right now is tagged `pathway: 'common'`, because these early
  fundamentals are shared between the CBSE Computer Science and
  Informatics Practices syllabi — the toggle doesn't change anything
  *yet*, and this map has not been independently re-verified against the
  current official CBSE syllabus documents (disclosed honestly, as the
  brief requires).
- World 1's 7 real missions (`src/curriculum/missions.ts`): Introduction
  to Python, `print()`, comments, variables, data types, `input()`, and
  type conversion — each one genuine, checkable Python run through
  Pyodide (including real `input()` support via a fixed pre-supplied
  answer for the `input()` and type-conversion levels).

Everything from Prompts 3–8 (the full Pyodide lab upgrades, the complete
9-step learning cycle with predict/debug/HOTS/boss per level, arcade
polish, the Study Skills Academy, accounts/teacher dashboard,
deployment/QA, and the separate SQL game) is **not** built yet.

### Known limitations (disclosed honestly, not swept under the rug)

- Only World 1 is playable. Worlds 2–5 exist as labelled, honest
  placeholder *data* (so the full curriculum is visible), not playable
  content.
- Each World 1 level is currently just the "Code" step of the brief's full
  9-step learning cycle (story → learn → explore → **code** → predict →
  debug → apply → HOTS → boss). The full cycle is explicitly Prompt 4.
- `input()` inside a mission only supports a **fixed, pre-supplied**
  answer — not true interactive/blocking input. True interactive
  `input()` needs a cross-origin-isolated page (COOP/COEP) with
  `SharedArrayBuffer` — a later-phase change.
- Save/resume is per-browser (`localStorage`), not per-account — no
  backend exists yet (Supabase integration is Prompt 7).
- The CS/IP pathway toggle doesn't change any content yet (see above).
- No PWA manifest/service worker yet (deferred to Prompt 8) — not
  installable or offline-capable.
- The follow camera has no collision of its own, so in tight corners it
  can visually clip through scenery/walls. Cosmetic only — doesn't affect
  player movement or physics.
- Camera zoom (pinch/scroll) isn't wired up to the camera's distance
  limits yet.
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
  curriculum/
    worlds.ts        the 5-world, 25-level curriculum map (structured data)
    missions.ts       the 7 real, checkable World-1 missions
  progress/
    progressService.ts   localStorage-backed save/resume + level unlock rules
  game/
    camera/        third-person follow camera
    characters/     the robot character + its movement/physics
    controls/       unified keyboard+touch input
    engine/         GameScene — the per-frame orchestrator
    world/          the village world, the NPC, the terminal
  python-lab/        Pyodide worker + runner + the mission UI overlay
  ui/
    WorldMapScreen.tsx   the hub: 5 worlds, 25 levels, lock states
    HUD.tsx, TouchControls.tsx, PauseMenu.tsx, DialogBubble.tsx
public/pyodide/      self-hosted Pyodide runtime (npm package, not CDN)
```
