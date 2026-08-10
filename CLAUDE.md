# FreakyQuest — Claude Code Configuration

## Rules

- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary — prefer editing existing files
- NEVER create documentation files unless explicitly requested
- NEVER save working files or tests to root — use `/docs`, `/scripts`
- ALWAYS read a file before editing it
- NEVER commit secrets, credentials, or .env files
- NEVER add a `Co-Authored-By` trailer to commits unless the user explicitly asks for it
- Keep files under 500 lines
- Validate input at system boundaries

## Build & Test

Static PWA (vanilla JS/HTML/CSS), no build step. Deploy is automatic via `git push` to `main` (Vercel).

After editing `app.js`, `index.html`, or `styles.css`, run:

```bash
python validate.py
python check_duplicate_ids.py
```
