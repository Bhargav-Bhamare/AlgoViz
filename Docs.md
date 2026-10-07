# DAA Lab: interactive algorithm simulator

```bash
npm install
npm start      # http://localhost:3000
```

Architecture: `algorithms/**` engines (UMD, no DOM) generate step lists -> `public/js/player.js` steps through them -> `public/js/visualizer.js` renders each snapshot.

Add an algorithm: create an engine returning `{ generate, pseudocode, statLabels, options }`, then add a `registry.js` entry with `available: true` and `engine: 'path/file.js'`.

Status: Phases 1-3 done (Express/EJS shell, step engine, Merge Sort, Quick Sort).
