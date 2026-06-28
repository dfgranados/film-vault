# FilmVault

A self-hosted web app for organizing film photography by roll, location, camera, and film stock. Import lab scans and Lightroom edits into a local library, browse with rich filters, and plan social media post sets.

## Quick start

```bash
cd ~/Projects/film-vault
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Library location

By default, all photos and metadata live in `~/FilmVault/`:

```
~/FilmVault/
├── library/rolls/     # imported originals and edits
├── thumbnails/        # generated WebP previews
├── exports/           # social exports (future)
└── data/filmvault.db  # SQLite database
```

Change the library path in **Settings**.

## Workflow

1. **Create a roll** before or during shooting — set camera, film, location, date.
2. **Import lab scans** — enter the folder path on your Mac; files are copied into the library.
3. **Import Lightroom edits** — export from Lightroom, then import as edit variants linked to the same frames.
4. **Browse** — filter by location, roll, camera, film, date, favorites.
5. **Post sets** — group photos for social, track which platform each has been posted to.

## Import notes

- Import is **copy-only** — your lab folder and Lightroom catalog are never modified.
- Enter full macOS paths like `/Users/you/Downloads/roll-scans`.
- iCloud placeholder files must be downloaded locally before import.

## Tech stack

- Next.js 16 + TypeScript + Tailwind
- SQLite via Drizzle ORM + libSQL (local file, no native build required)
- sharp for thumbnails

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — production server
- `npm run db:studio` — Drizzle Studio (database browser)
