# FreakyQuest — Claude Code Configuration

## Rules

- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary — prefer editing existing files
- NEVER create documentation files unless explicitly requested
- NEVER save working files or tests to root — use `/docs`, `/scripts`
- NEVER run the full audit (`scripts/audit_all.py`) unless the user asks or is releasing — see Build & Test
- ALWAYS read a file before editing it
- NEVER commit secrets, credentials, or .env files
- NEVER add a `Co-Authored-By` trailer to commits unless the user explicitly asks for it
- Keep files under 500 lines
- Validate input at system boundaries

## Sessões externas (Cowork)

Histórico de investigações/alterações feitas fora do Claude Code (app
desktop, modo Cowork) em `docs/COWORK_HANDOFF.md`. Leia antes de assumir que
já sabe o estado atual do projeto ou de repetir uma auditoria já feita.

## Build & Test

Static PWA (vanilla JS/HTML/CSS), no build step. Deploy is automatic via `git push` to `main` (Vercel).

### JS layout

The old single `app.js` is split into `js/app-01-*.js` … `js/app-14-*.js`.
These are **classic scripts, not ES modules**: they share one global scope and
are loaded in order by `index.html`. Do not reorder the `<script>` tags, do not
add `type="module"`, and do not add `import`/`export`. Functions call each
other freely across files exactly as before.

When adding a file to `js/`, register it in **both** `index.html` and the
`ASSETS` list in `sw.js`, and bump `CACHE_NAME` in `sw.js`.

### Day-to-day (run every time)

After editing anything in `js/`, `index.html`, or `styles.css`, run:

```bash
python validate.py
python check_duplicate_ids.py
```

### Full audit (release only — DO NOT run by default)

`python scripts/audit_all.py` opens the app in a headless browser across 12
screen sizes. It takes minutes and burns a lot of tokens and time.

**Only run it when the user explicitly asks, or is about to deploy/release.**
Do NOT run it after a routine edit, do NOT run it "just to be safe", and do
NOT run it as a verification step for a small change — the two commands above
are the verification step for everyday work.

If a change feels risky but it is not a release, `python scripts/audit_all.py
--sem-navegador` runs the static checks only (seconds, no browser).

Full documentation in `docs/QA.md`.
