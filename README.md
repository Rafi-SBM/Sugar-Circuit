# Sugar Circuit

A cross-platform Match-3 mobile puzzle game built with React Native, Expo, and TypeScript for the Nexus Mind AI take-home assignment.

---

## Overview

Sugar Circuit is an 8x8 match-3 puzzle game inspired by classic titles like Candy Crush. Players swap adjacent candy gems to create horizontal or vertical lines of 3 or more matching tiles. Matches clear from the board, score points, and trigger cascading gravity drops as new tiles fall into place from the top.

### Key Gameplay Features
- **Board Setup**: Initializes an 8x8 grid with no pre-existing matches, while guaranteeing at least one valid swap is available at launch.
- **Controls**: Supports both tap-to-select (tap first tile, then an adjacent tile) and directional swipe gestures (up, down, left, right).
- **Match & Cascade Engine**: Detects 3-in-a-row, 4-in-a-row, 5-in-a-row, and intersecting T/L-shaped matches. Matches clear with visual feedback and sound, tiles drop to fill empty cells, and new tiles refill from above.
- **Invalid Swap Handling**: If a swap does not result in a match, tiles slide back to their original positions with haptic and audio feedback.
- **Scoring & Cascades**: Base points per tile with combo multipliers for chained cascade reactions (x2, x3, x4+) and bonus points for matches of 4 or 5 tiles.
- **Game Modes**:
  - *Classic Moves*: Reach the target score of 2,500 points within 24 moves.
  - *Blitz Mode*: 90-second timed sprint to score as much as possible before time runs out.
- **Visual Themes**: Toggle between Royal Twilight (deep purple arcade) and Candy Sunset (warm amber/rose).
- **Audio & Haptics**: Built-in procedural audio engine synthesized via Web Audio (taps, swooshes, chimes, invalid bumps, victory fanfare) with an instant mute toggle.
- **Deadlock Protection**: If no valid moves remain on the board, the game automatically reshuffles the board so the player is never stuck.

---

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript (strict mode enabled)
- **State Management**: React `useReducer` for predictable, deterministic state transitions
- **Styling**: React Native `StyleSheet` with `expo-linear-gradient`
- **Icons**: `@expo/vector-icons` (MaterialCommunityIcons)
- **Audio**: Procedural Web Audio API synthesizer
- **Testing**: Jest with `babel-jest` for pure unit and reducer tests

---

## Project Structure

```text
App.tsx                       # Main application shell, layout, and gesture coordination
src/
├── audio/
│   └── soundManager.ts       # Procedural audio synthesis (no external audio assets needed)
├── components/
│   ├── Board.tsx             # Board container and grid layout
│   ├── Tile.tsx              # Tile component with animations, gesture handlers, and themes
│   ├── Header.tsx            # Navigation bar, score targets, and controls
│   ├── ScoreHud.tsx          # Live score display, best score, and target progress
│   ├── MovesHud.tsx          # Moves counter / Blitz mode countdown timer
│   ├── GameOverOverlay.tsx   # Win / Game Over modal with restart controls
│   ├── HowToPlayModal.tsx    # Rules and instructions modal
│   ├── ComboCalloutBanner.tsx# Cascade multiplier callouts (Sweet Combo, Delicious, etc.)
│   ├── FloatingScoreBadge.tsx# Floating +score animations on matches
│   ├── MatchSpark.tsx        # Radial burst effect on cleared cells
│   └── ConfettiCannon.tsx    # Victory screen confetti particles
├── game/
│   ├── constants.ts          # Grid dimensions, scoring rules, themes, and timings
│   └── engine.ts             # Pure game engine: board gen, matching, gravity, cascades
└── state/
    └── gameReducer.ts        # Pure reducer managing gameplay state, moves, and timers
__tests__/
└── engine.test.ts            # Unit test suite covering engine rules and reducer logic
```

---

## System Requirements

- **Node.js**: v20 or newer (LTS recommended)
- **npm**: v10 or newer
- **Expo CLI**: bundled via `npx expo`
- **Mobile Development (optional for native simulators)**:
  - **iOS**: macOS with Xcode 15+ and an iOS Simulator, or the Expo Go app on a physical iPhone.
  - **Android**: Android Studio with an Android 12+ emulator (AVD), or the Expo Go app on a physical Android device.

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run on Web

The fastest way to test the game locally:

```bash
npm run web
```

Open `http://localhost:8081` in your browser. Both mouse clicks and drag-to-swipe gestures work out of the box.

### 3. Run on Mobile

Start the Expo development server:

```bash
npm start
```

- Press `a` in the terminal to launch on a running Android emulator.
- Press `i` in the terminal to launch on an iOS simulator (macOS only).
- Or scan the QR code using the **Expo Go** app on your physical mobile device.

---

## Running the Tests

The test suite covers the pure engine logic (board invariants, match detection, gravity fall, cascade chains, scoring formulas) and reducer state transitions.

```bash
npm test
```

To run TypeScript type checks:

```bash
npx tsc --noEmit
```

### How the Core Logic is Tested
- **Board Generation Invariants**: Verifies that newly generated boards are strictly 8x8, contain zero initial matches, and always have at least one valid swap available.
- **Swap Adjacency**: Confirms only orthogonal moves (Manhattan distance = 1) are accepted; diagonal swaps and distant cells are rejected.
- **Match Detection**: Tests horizontal runs, vertical runs, and cross/T-shaped intersections to make sure shared intersection tiles are counted once without duplicate scoring.
- **Cascade & Gravity**: Simulates step-by-step tile clearing, downward drops, and top-row refills, verifying that empty spaces are properly resolved.
- **Reversion on Invalid Moves**: Checks that swapping two non-matching tiles returns `valid: false` and preserves the original board reference without unintended mutations.
- **Reducer State**: Tests all reducer actions (`SELECT_TILE`, `PLAY_MOVE`, `INVALID_SWAP`, `RESTART`, `TICK_BLITZ_TIMER`), verifying win/lose conditions for both Moves and Blitz modes.

---

## Engineering Decisions & Trade-offs

1. **Separation of Game Engine from UI**:
   The engine in `src/game/engine.ts` is written as pure TypeScript functions with no dependencies on React, React Native, or DOM APIs. This makes it trivial to unit test, deterministic to debug, and decoupled from how the UI renders.

2. **Web Audio for Sound**:
   Instead of bundling large MP3/WAV assets that increase bundle size and require asynchronous asset preloading, sound effects are generated procedurally using the Web Audio API. When running on native devices where Web Audio is unavailable, it fails gracefully without throwing errors.

3. **Predictable State Transitions**:
   All game rules, move counters, and mode switches are coordinated through a single `gameReducer`. This keeps state changes traceable and eliminates subtle synchronization bugs between the timer, moves count, and board state.

4. **Visual Swap Animation Coordination**:
   When two tiles are swapped, the UI animates the physical offset first. If the move is invalid, it springs back and triggers a shake before resetting selection. If valid, the engine resolves the match and cascades, triggering particle bursts and combo callouts.

---

## Known Limitations

- **Native Audio Integration**: The procedural audio implementation relies on the Web Audio API (supported on web and webview environments). For a standalone production binary on native iOS/Android, integrating `expo-av` or pre-rendered audio buffers would provide uniform sound across all bare native targets.
- **Native Haptics**: Haptics currently use `navigator.vibrate` on supported web devices. On native devices, replacing this with `expo-haptics` would unlock fine-grained tactile feedback on iOS Taptic Engine and Android haptic motors.
- **Persistence**: High scores are currently saved in `localStorage` on web. A production release would use `@react-native-async-storage/async-storage` for cross-platform native persistence.

---

## Future Improvements

If extending this beyond a take-home prototype:
1. **Special Tiles**: Add line-clearing rockets for 4-in-a-row matches and color bombs for 5-in-a-row matches.
2. **Obstacles & Blockers**: Introduce jelly, ice blocks, or stone tiles that require adjacent matches to clear.
3. **Sequential Cascade Delay**: Add configurable per-step delays so players can watch multi-step cascade drops fall one row at a time.
4. **Persistent Level Progression**: Add a multi-stage level map with star ratings and objective targets.
