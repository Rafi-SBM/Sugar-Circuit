# Sugar Circuit — Take-Home Assignment Documentation
**Role**: Mobile Engineer (Cross-Platform)  
**Project**: Sugar Circuit (Cross-Platform Match-3 Puzzle Game)  
**Author**: Rafi  
**Repository**: [https://github.com/Rafi-SBM/Sugar-Circuit](https://github.com/Rafi-SBM/Sugar-Circuit)  
**Live Web Demo**: [https://cool-melons-ask.loca.lt](https://cool-melons-ask.loca.lt) *(Temporary tunnel; or run locally via `npm run web`)*  

---

## 1. Project Overview & Goals

When I read the assignment prompt, the main goal was to build a clean, cross-platform Match-3 game similar to Candy Crush within a short time box, while keeping the code maintainable, readable, and well-tested.

Rather than just throwing together a quick hack or relying on heavy pre-made game engines like Unity, I wanted to build this using **React Native with Expo and TypeScript**. This allowed me to:
1. Keep the whole codebase lightweight and standard mobile JavaScript/TypeScript.
2. Run seamlessly across **iOS, Android, and Web** from one single codebase without rewriting anything.
3. Write pure unit tests for all the puzzle logic using Jest without needing an emulator running.
4. Give it a polished, tactile feel with smooth animations, custom sound synthesis, and clean responsive layouts.

I named the game **Sugar Circuit**. It’s played on an 8×8 grid where players swap adjacent candies to line up matches of 3, 4, or 5 in a row.

---

## 2. Tech Stack & Tools

* **Core Framework**: React Native (0.81.5) with Expo SDK 54.
* **Language**: TypeScript (strict mode enabled across the entire repo).
* **State Management**: React `useReducer` with a pure reducer function (`gameReducer.ts`).
* **Styling**: React Native `StyleSheet` with `expo-linear-gradient` for rich depth and lighting.
* **Icons**: `@expo/vector-icons` (`MaterialCommunityIcons`).
* **Sound & Feedback**: Web Audio API procedural synthesizer (zero audio asset files required) + Vibration API haptics.
* **Testing**: Jest with `babel-jest` (22 unit tests covering all core game mechanics).

---

## 3. How the Game Works (Core Mechanics)

### 3.1 Board Initialization
* The board is an 8×8 matrix of 6 distinct candy types (Strawberry Heart, Golden Star, Emerald Clover, Sapphire Diamond, Grape Blossom, Tangerine Drop).
* When a new game starts, the generator fills each cell while checking neighboring tiles so that **no matches of 3 exist on spawn**.
* It also runs a solver check (`findValidSwap`) to ensure that **at least one valid move is available right away**, so the player never spawns into an unplayable board.

### 3.2 Swapping & Gestures
* Players can interact in two ways:
  1. **Tap-to-Swap**: Tap a tile to select it, then tap any adjacent tile (up, down, left, right).
  2. **Swipe**: Drag a tile in the direction they want to move it (with a 20px gesture threshold to prevent accidental taps).
* Diagonals and non-adjacent moves are strictly ignored.
* If a swap doesn't result in any 3-in-a-row match, the tiles slide back to their original position with a small rubbery shake animation and a bump sound effect.

### 3.3 Match Detection & Cascade Gravity
* The engine scans both horizontally and vertically for continuous runs of 3, 4, or 5 matching tiles.
* It handles intersection shapes like **T-shapes and L-shapes** cleanly, using coordinate maps to prevent double-counting shared corner tiles.
* Once matches are found:
  1. The matched tiles clear with radial particle sparks and floating score badges.
  2. Tiles directly above drop down to fill the empty spaces (gravity).
  3. Fresh random tiles drop in from the top row to refill the board.
* If the new falling tiles form another match, a **cascade reaction** triggers automatically. The engine loops until the board completely settles with zero matches.

### 3.4 Deadlock / Board Stall Prevention
* In match-3 games, a common annoying bug is when a board runs out of valid moves.
* If all available moves on the board are exhausted, the engine detects this automatically and reshuffles the existing tiles while showing a brief notice (*"No moves left — Shuffling board!"*), so the player can keep playing without frustration.

---

## 4. Scoring & Game Modes

### Scoring Rules
* **Base Score**: 50 points per matched tile (so a basic 3-tile match awards 150 points).
* **Bonus for Big Matches**: +25 points for each additional tile beyond 3 (e.g. 4-in-a-row awards 225 pts).
* **Cascade Multiplier**: If matches chain into cascades, the score for that step is multiplied by the chain level (`×2`, `×3`, `×4`, etc.), accompanied by visual combo banners (*"SWEET COMBO!"*, *"SUPER CASCADE!"*, *"DELICIOUS!"*).

### Two Game Modes
1. **Classic Moves Mode**:
   * Target: Reach **2,500 points** in **24 moves**.
   * Win: Reaching 2,500 points triggers victory confetti and star ratings.
   * Game Over: Running out of moves before reaching 2,500 points ends the round with a restart button.
2. **Speed Blitz Mode**:
   * A high-energy 90-second countdown sprint against the clock.
   * Players try to score as many points and big cascades as possible before the timer reaches zero.

---

## 5. UI/UX & Design Decisions

I wanted the game to feel tactile and pleasant to play rather than flat or robotic:
* **Tactile Candy Tiles**: Each tile has a subtle 3D bevel, top specular shine arc, and soft shadow lip so they look like physical pieces you want to tap.
* **Responsive Cabinet Frame**: On desktop browsers, the board sits inside a sleek dark arcade cabinet that automatically scales both width and height to fit the screen without cutting off the footer or board edges. On mobile phones, it seamlessly spans the portrait screen.
* **Dual Color Themes**: Includes a theme toggle between **Royal Twilight** (deep purple neon) and **Candy Sunset** (warm amber and rose).
* **Dynamic Action Ribbon**: A compact prompt right above the board that guides the player (*"Tap a neighbor to swap"*, *"Hint available"*, etc.) without cluttering the screen.
* **Idle Hint System**: If a player is idle for more than 3 seconds, the game gently pulses a valid pair with a breathing glow to guide them.

---

## 6. Procedural Audio Engine

Instead of adding heavy MP3 or WAV audio files into the repo (which bloat repository size and require async preloading), I built a procedural synthesizer using the **Web Audio API** in `src/audio/soundManager.ts`:
* Tile taps produce a crisp high-frequency sine pip.
* Swaps produce a soft triangle swoosh.
* Matches trigger resonant pentatonic chime notes (C5 → E5 → G5 → C6) that pitch up higher with each cascade level.
* Invalid moves produce a low sawtooth bump.
* Victory triggers an arpeggiated C-major fanfare.
* Includes an instant mute/unmute toggle that saves user preference.

---

## 7. Architecture & Code Structure

The repository is organized with strict separation of concerns:

```text
App.tsx                       # Main UI container, responsive layout, gesture coordination
src/
├── audio/
│   └── soundManager.ts       # Procedural audio synthesis (Web Audio API)
├── components/
│   ├── Tile.tsx              # Individual candy tile with spring animations and swipe detection
│   ├── Header.tsx            # Game title, mode switcher, theme toggle, mute button, help
│   ├── ScoreHud.tsx          # Live score, best score pill, milestone star progress gauge
│   ├── MovesHud.tsx          # Remaining moves counter / Blitz mode countdown timer
│   ├── GameOverOverlay.tsx   # Victory & Game Over modal with restart controls
│   ├── HowToPlayModal.tsx    # 4-step tutorial modal explaining rules and combos
│   ├── ComboCalloutBanner.tsx# Animated cascade multiplier banner (Sweet Combo, Delicious, etc.)
│   ├── FloatingScoreBadge.tsx# Floating +score text rising from cleared positions
│   ├── MatchSpark.tsx        # Radial burst particles on cleared cells
│   └── ConfettiCannon.tsx    # Victory screen celebratory confetti particles
├── game/
│   ├── constants.ts          # Grid dimensions, scores, timings, tile colors, theme palettes
│   └── engine.ts             # PURE GAME ENGINE: zero UI dependencies, fully testable
└── state/
    └── gameReducer.ts        # Pure reducer managing complete game state & transitions
__tests__/
└── engine.test.ts            # Jest unit test suite (22 tests)
scripts/
└── e2e_web_smoke.py          # Playwright automated browser test script
```

### Key Architectural Highlights
1. **Engine Purity**: `src/game/engine.ts` has **zero** React or UI dependencies. It operates exclusively on immutable 2D board arrays. This makes the game logic completely decoupled and trivial to unit test in isolation.
2. **Predictable State Machine**: All gameplay state (selected tile, scores, moves, timer, game status) is handled by `gameReducer.ts`. No scattered component state or race conditions.
3. **Decoupled Render Pipeline**: When a swap occurs, the UI first animates the physical sliding offset of the two tiles. Once the animation completes, the reducer commits the new board state. This guarantees smooth 60fps animations without visual teleporting.

---

## 8. How to Run the App & Tests

### Prerequisites
* **Node.js**: v20 or newer
* **npm**: v10 or newer
* **Expo CLI**: bundled via `npx expo`

### 1. Install Dependencies
```bash
npm install
```

### 2. Run on Web (Fastest Way to Test)
```bash
npm run web
```
Opens in your browser at `http://localhost:8081` with full mouse click and drag-to-swipe support.

### 3. Run on Mobile (iOS / Android)
```bash
npm start
```
* Press `a` to open on an Android emulator.
* Press `i` to open on an iOS simulator (macOS required).
* Or scan the terminal QR code with the **Expo Go** mobile app on your physical phone.

### 4. Run the Unit Tests
```bash
npm test
```
Runs the 22 Jest tests verifying:
* Deterministic 8×8 board generation without pre-existing matches.
* Guaranteed valid starting move.
* Orthogonal adjacency validation (rejecting diagonal and distant swaps).
* Horizontal, vertical, and cross (T/L) match detection.
* Swap rollback on invalid moves without mutating state.
* Cascading gravity and score multiplier formulas.
* Board reshuffle on stall.
* Reducer win/lose conditions for both Moves and Blitz modes.

---

## 9. Known Limitations & Engineering Trade-offs

1. **Audio Implementation**: The procedural synthesizer uses the Web Audio API, which works out of the box on Web and WebView. In a standalone production binary for bare iOS/Android, I would bundle pre-rendered audio files via `expo-av` or `react-native-sound` for guaranteed native background audio handling.
2. **Haptic Feedback**: Currently relies on `navigator.vibrate` on web. For a production native mobile app, I would plug in `expo-haptics` to access the native Apple Taptic Engine and Android vibrator motors.
3. **High Score Persistence**: Best scores are currently saved in `localStorage` on web. On native mobile builds, swapping this to `@react-native-async-storage/async-storage` would persist high scores across app restarts.

---

## 10. What I Would Build Next (Future Roadmap)

If this were being expanded into a full commercial game, here is what I would prioritize:
1. **Special Candy Power-Ups**:
   * *Striped Candies (Match-4)*: Clears an entire horizontal or vertical line when matched.
   * *Color Bomb (Match-5)*: Clears all candies of a chosen color from the entire board.
   * *Wrapped Candy (T/L shape)*: Explodes a 3×3 radius.
2. **Obstacles & Blockers**:
   * Introducing ice blocks, chocolate spreads, or locked chains that require adjacent matches to break.
3. **Sequential Cascade Pacing**:
   * Adding a slight delay between each step of a multi-tier cascade so the player can watch tiles tumble down row-by-row like in traditional Candy Crush.
4. **Campaign Map & Levels**:
   * A multi-level progression map with star achievements and progressive difficulty scaling.
