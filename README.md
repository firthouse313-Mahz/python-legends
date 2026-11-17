# Digi Class – Python Legends

A continuous auto-running 3D platformer where students write and run **real
Python** (via Pyodide — actual CPython compiled to WebAssembly, never
simulated or hard-coded output) to progress through a 5-world curriculum,
starting with "Python Forest" (World 1) and "Loop Kingdom" (World 2). Built
with React + TypeScript + Vite.

This is a separate project from the main DigiClass platform, linked from its
"Digi Game" nav card. SQL is planned as a separate, future game and is out
of scope here.

## Status: World 1 + World 2 live on the continuous-runner engine
## (milestone 5 of the adventure-game brief, in progress)

**Big architecture change:** the game was rebuilt from a free-roam
third-person Babylon.js explorer (walk around, talk to an NPC, walk up to a
terminal) into a **continuous auto-scrolling platformer** on **React Three
Fiber** (`src/runner/`), per the "PLAY. EXPLORE. CODE. CONQUER." brief. The
player auto-runs forward; jump and slide clear obstacles; each world's real
Python missions sit as glowing "gates" along the track that pause the run
until solved, then the run continues automatically — no trip back to the
World Map between challenges. A boss fight closes out each world. The old
Babylon.js free-roam engine (`src/game/`) is kept in the repo, unused, in
case anything from it is needed again — nothing was deleted.

The runner engine itself is now **world-generic** (`src/runner/trackData.ts`,
`worldThemes.ts`, `bossChallenges.ts`, `RunnerGame.tsx` all key off
`world.id`), so bringing up a new world is now a content exercise — new
missions + a new boss — rather than new engine code. World 1 proved the
pattern; World 2 is the first world built on top of the generalized engine.

World 1 is **"Python Forest"** and Worlds 2-5 are renamed/regrouped to
**Loop Kingdom, Function Castle, Data Structure City, and The Coding
Battle** (`src/curriculum/worlds.ts`), matching the new brief; each also
records its boss name (Infinite Loop Dragon, The Return Wizard, The Data
Destroyer, The Master Debugger). Worlds 3-5 still have **zero real
content** — honest "coming soon" data, same as before.

### What's real in the runner (verified with Playwright, no mocked data)

- **Continuous auto-run** down a track (`src/runner/trackData.ts`): no
  steering needed, just forward momentum; jump (+ a double jump) and slide
  clear ground/overhead obstacles. Each world gets its own color theme
  (`src/runner/worldThemes.ts`) — World 1's forest greens, World 2's
  Loop Kingdom dusk purples.
- **World 1 — Python Forest:** all 7 real missions (unchanged content,
  unchanged Pyodide checking logic, unchanged `PythonLabOverlay`) sit as
  sequential gates. Verified end-to-end: a full run solves all 7 with real
  typed Python, auto-continues after each one with zero trips to the map,
  then the boss fight (**The Variable Monster**, 3 predict-the-output hits)
  triggers automatically and marks the world complete.
- **World 2 — Loop Kingdom:** 4 new real missions covering `for` loops,
  `while` loops, nested loops, and `range()` (`src/curriculum/missions.ts`,
  `WORLD_2_MISSIONS`) — genuinely checked by the same Pyodide pipeline, not
  fixed-answer matching. Verified end-to-end: all 4 gates solved with real
  typed Python (for-loop range printing, a while-loop countdown, a nested
  loop printing a 3×3 grid, and a list-comprehension-style squares loop),
  then the boss fight (**The Infinite Loop Dragon**, 3 loop-themed
  predict-the-output hits) triggers and marks the world complete.
- **Boss fights:** 3 "predict the output" hits per world; wrong answers
  cost energy and the question stays up to retry (never a hard fail);
  defeating the boss awards a bonus and marks that world complete.
- **Energy, coins, XP, shield/boost power-ups:** hitting an obstacle costs
  energy (or is absorbed by a collected shield); energy hitting 0 respawns
  the student at their last cleared gate, not all the way from zero.
- **Checkpoint/resume:** leaving and coming back resumes the run just past
  the furthest level already completed (derived from the same
  `progressService` save data as before — no new save schema needed), for
  either world.
- **Desktop + touch:** Space/↑ to jump, ↓ to slide, or on-screen JUMP/SLIDE
  buttons on touch devices; verified on a mobile viewport.
- **Sound, mute toggle, pause menu:** reused from the existing `src/audio/sfx.ts`
  synthesized sound engine and `PauseMenu`.

### What's not built yet

- **Worlds 3-5 have no real scenes or missions** — still just honest
  placeholder topic/boss-name data, same limitation as before.
- **Parallax is a simple 3-layer recycling effect**, not hand-painted art
  (no external image assets are fetchable in this environment).
- **No lives system** — only the energy/respawn-to-checkpoint loop described
  above; "lives" in the strict sense (a limited count, game-over screen)
  wasn't built this pass.
- **Daily challenges, achievement badges, and a personal-best tracker**
  from the brief's reward-system section aren't built yet.
- The old free-roam Babylon engine's own features (the Level-1
  conduit/gate/Guardian hurdle sequence, NPC dialog) are **not** part of the
  new runner — that whole interaction model was replaced, per the chosen
  direction, by the gate-gameplay described above.

## Status: Prompt 3 in progress (real Python coding laboratory)

**Deployed:** a built version is pushed to the `gh-pages` branch, for
GitHub Pages at `https://<account>.github.io/python-legends/` once Pages is
enabled in the repo settings (Settings → Pages → Deploy from branch →
`gh-pages` / root).

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

**The real coding-lab upgrades (Prompt 3), built after critical testing
feedback that the game gave away every answer:**
- **Every mission's starter code was rewritten to remove the working
  solution.** Starter code now contains only task instructions/comments —
  students must actually write the Python themselves. Verified with an
  automated Playwright run that solves all 7 levels by *hand-typing* real
  code (not pre-filled), and separately confirms an unmodified/blank
  starter genuinely fails.
- **A tangible, visible reward for solving a terminal:** a treasure chest
  pops open in the 3D world next to the terminal with bonus coins
  scattered around it to run over and collect — not just a text banner.
- **Hidden test cases:** two missions (`input()`, type conversion) quietly
  re-run the student's code with a second, different input after the
  visible one passes, so a hard-coded answer that only matches the one
  example on screen is caught and rejected.
- **Predict-the-output questions** before the editor on two levels, and a
  **bonus debugging challenge** (fix an intentionally broken variable-name
  typo) on the variables level.
- **Friendly, mapped runtime-error messages** and an output-length cap in
  the Pyodide worker, instead of raw Python tracebacks.
- Fixed a real bug where the global keyboard handler (for WASD/Space game
  controls) was eating every Space character typed into the code editor,
  silently stripping spaces from strings students typed.

**Real stakes in Level 1 — a chase/hurdle/energy proof-of-concept,** built
after feedback that the game needed real tension, not just a terminal to
solve:
- **Two Energy Conduits** scattered around the village, each with its own
  real Python challenge (one arithmetic, one a `for` loop). Solving one
  charges 50/100 energy, shown as a live bar in the HUD.
- **The Vault Gate:** a physical barrier (a real collider, not just a
  visual) blocking the path to the main terminal until both conduits are
  charged to 100. Verified it can't be walked around — it spans the full
  width between the boundary walls — and that it genuinely holds at any
  energy below 100.
- **The Guardian Sentinel:** a chaser enemy that activates the moment the
  first conduit is solved, patrols, and switches to actively chasing the
  player when they get close. Catching the player costs 20 energy and
  sends the Guardian into a cooldown — a real, escapable threat rather
  than a hard fail state. (Its own collider is deliberately non-solid
  against the player — two dynamic colliders pressing a thin wall at once
  was found, during testing, to let the player tunnel straight through it.)
- All of World 1's other 6 levels are unaffected by this and still work
  exactly as before (re-verified end to end).

**Brighter, cooler visual pass:** the HUD, the coding lab, and the World
Map hub were redesigned with glowing cyan/violet glass panels and a
cooler, higher-contrast sky and lighting in the village itself.

**Levels now chain together in one session.** Finishing a level's main
terminal offers a "▶ Next: Level N" button that jumps straight into the
next level's scene immediately — no trip back to the World Map hub
between every single level. The map is still there for picking which
world/level to jump into (or switching pathways), and "Stay & explore" /
"Back to World Map" remain available as secondary options. Verified with
Playwright: the World Map screen never appears between two chained
levels.

**Real sound effects, everywhere** — synthesized on the fly with the Web
Audio API (`src/audio/sfx.ts`), so there are no audio asset files to fetch
(no network access to a sound-asset host from this sandbox): coin pickups,
jumping, a predict-question right/wrong answer, Run passing/failing, an
Energy Conduit charging, the Vault Gate unlocking, the Guardian spotting
and catching the player, and a fanfare on finishing a level's terminal —
plus a soft, sparse ambient loop while playing. A mute toggle (🔊/🔇) sits
in the HUD next to pause and remembers its state across sessions.

**The Guardian chase now lives in every World 1 level, not just Level 1.**
Levels 2–7 each get their own Guardian patrolling a line near the
terminal/NPC area, live and hunting from the moment the level loads — no
conduits or gate puzzle needed there, since the level's own terminal
mission already is the real Python challenge. Getting caught costs a
couple of coins and a jolt (there's no energy bar outside the hurdle
level) and never blocks reaching the terminal — verified with Playwright
that the terminal is still reachable and solvable on every level with the
Guardian active. Level 1 keeps its deeper, richer conduit + gate + energy
version as the "tutorial boss" introduction to the mechanic.

Everything from Prompts 4–8 (the full 9-step learning cycle with
story/predict/debug/apply/HOTS/boss per level, arcade polish, the Study
Skills Academy, accounts/teacher dashboard, deployment/QA, and the
separate SQL game) is **not** built yet.

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
