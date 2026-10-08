# Rise of Sammael

Necromancer dungeon-crawler game — single-file HTML5.

## Play
Deployed via Netlify. See the live site for the latest build.

## Structure
- `index.html` — complete game (HTML + CSS + JS, ~28k lines)

## Development
Built iteratively with Claude. Each session produces an updated `index.html` pushed directly to this repo, which triggers an automatic Netlify redeploy.

## Pipeline
`Claude session` → `GitHub push` → `Netlify auto-deploy` ✅


## Layout (since 2026-10-08)

`index.html` holds the page markup only. Code and styles live in separate files, loaded in order as plain scripts (no build step, no modules — every file shares the same globals, exactly as when they were inline):

- `js/01-boot.js` … `js/10-hud.js` — `03-main.js` is the game itself; the others are the icon system, co-op, the map screens, cloud save, the Grimoire and the HUD.
- `css/01-fonts.css` … `css/06-hud.css`.
- `tools/stamp.py` — run before every push: syntax-checks `js/*.js` and refreshes the `?v=` stamp on each script and stylesheet so browsers never run a stale file.
- `tools/smoke.js` — headless smoke test (needs Playwright and a local server).

Order matters: do not reorder the script tags.
