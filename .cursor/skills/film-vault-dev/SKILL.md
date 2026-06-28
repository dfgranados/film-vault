---
name: film-vault-dev
description: Develop and ship FilmVault features following project conventions. Use when adding rolls, imports, API routes, schema changes, UI screens, fixing CI, or running the local quality gate before commit.
---

# FilmVault development

## Quality gate

Before committing or opening a PR:

```bash
cd ~/Projects/film-vault
npm run check
```

Individual steps: `typecheck`, `lint`, `lint:fix`, `format`, `format:check`, `test`, `build`.

Pre-commit (husky + lint-staged) runs ESLint fix and Prettier on staged files.

## Common tasks

### Add a DB field

1. Add column in `src/db/schema.ts`
2. Add `CREATE TABLE` column to migrations array in `src/db/index.ts`
3. Add idempotent `ALTER TABLE ... ADD COLUMN` in the try/catch block for existing DBs
4. Update `src/types/index.ts` and relevant API routes
5. Add/adjust unit tests for pure logic

### Add an API endpoint

1. Create `src/app/api/<resource>/route.ts` (or `[id]/route.ts`)
2. Use `const db = await getDb()`
3. Return `NextResponse.json`
4. Wire up client page with `fetch`

### Add import or library behavior

- Copy logic: `src/lib/library.ts`
- Import pipeline: `src/lib/import.ts`
- Rules: copy-only, SHA-256 dedup, iCloud placeholders must error clearly

### Add UI screen

1. Page under `src/app/<route>/page.tsx`
2. Extract reusable pieces to `src/components/`
3. Server page if reading DB directly; `"use client"` if interactive

## Commit workflow

```bash
git add .
git commit -m "feat(rolls): short description"
git push
```

CI (`.github/workflows/ci.yml`) runs the same checks as `npm run check` on push/PR to `main`.

## Do not

- Put photo library files (`~/FilmVault/`) in git
- Use sync `better-sqlite3` APIs
- Delete user lab/Lightroom source folders on import
