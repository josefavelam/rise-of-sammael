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
