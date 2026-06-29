# Office Chaos

An Expo (React Native) mobile game. The office scene is rendered with
`@shopify/react-native-skia`; gameplay logic lives in `src/game/` and the UI
screens in `src/screens/`. The target platforms are **iOS and Android only**
(landscape).

Standard commands live in `package.json` (`npm start`, `npm run android`,
`npm run ios`, `npm run prebuild`).

## Cursor Cloud specific instructions

- **Dependencies:** `npm install` (lockfile is `package-lock.json`; the update
  script handles this on startup). Node 22 / npm 10 are fine.
- **Typecheck (the closest thing to a lint here):** `npx tsc --noEmit`. There is
  no ESLint config.
- **Run the dev server:** `npx expo start` (Metro). Verify it bundles for the
  real targets by requesting a platform bundle, e.g.
  `curl "http://localhost:<port>/node_modules/expo/AppEntry.bundle?platform=android&dev=true"`
  (use `platform=ios` for iOS). A `HTTP 200` with a multi-MB body means the app
  compiles.
- **Web does NOT work and is not a supported target.** `GameEngine` calls
  `Skia.Paint()` eagerly at module load, but on web CanvasKit (WASM) loads
  asynchronously, so `Skia` is `undefined` and the page renders blank with
  `TypeError: Cannot read properties of undefined (reading 'Paint')`. Do not add
  `react-native-web`/`react-dom` to "run on web" — it will not render without
  source changes.
- **No emulator/simulator is available in this VM**, so the GUI cannot be shown
  directly. To exercise core gameplay headlessly, bundle and run the pure engine
  (`src/game/`) with a stub for `@shopify/react-native-skia` (the engine's only
  external runtime import; it's used solely for rendering). Example:
  `npx esbuild harness.ts --bundle --platform=node --format=cjs --alias:@shopify/react-native-skia=skia-stub.js --outfile=out.cjs && node out.cjs`.
  The core loop is: a worker gets drowsy → select a coworker → run a
  `WAKE_ACTIONS` action (e.g. `phone`) → the worker wakes → `winRound()`.
- **Known config warning (harmless):** `expo-doctor` flags `android.screenOrientation`
  in `app.json` as an unknown schema field. It does not affect bundling.
