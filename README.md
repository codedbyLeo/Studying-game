# StudyQuest (plain HTML/CSS/JS rebuild)

A cozy "study notebook" tracker: earn XP for every minute you study, level up,
build streaks, unlock badges and climb a leaderboard.

This is a full rebuild of the original React/Supabase app as a **plain
multi-page website** — separate HTML pages, one shared CSS file, and small
JS files per page. There's no build step and no server: just open
`index.html` in a browser, or serve the folder with any static file server.

## Pages

- `index.html` — landing page
- `auth.html` — sign in / sign up
- `dashboard.html` — the study desk (today/week/level overview)
- `timer.html` — stopwatch + manual session logging
- `subjects.html` — manage subjects, colors and weekly goals
- `stats.html` — charts + 12-week consistency heatmap
- `history.html` — searchable/sortable session log
- `leaderboard.html` — weekly / monthly / all-time XP rankings
- `profile.html` — profile editor + achievements

## How data is stored

There's no backend. All accounts, subjects, sessions and achievements are
stored in the browser's `localStorage` (see `js/db.js`), so everything runs
entirely client-side on one device/browser. The game rules (1 minute = 1 XP,
the leveling curve, streaks, and the achievement thresholds) are ported
directly from the original app's logic.

The leaderboard contains **no fake/ students**. It ranks only accounts
that actually exist in this browser's saved `localStorage` data.

Because this is a static HTML/CSS/JS site with no backend, accounts are saved
immediately in the browser and persist on that device/browser. A GitHub Pages
deployment cannot share accounts or leaderboard data between different
people/devices. For a truly global multi-user leaderboard, connect `js/db.js`
to a real backend/database later.

## Running it

Just double-click `index.html`, or from this folder:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Customizing

- Colors, fonts and the notebook/paper look live in `css/style.css` as CSS
  variables at the top of the file.
- Icons come from the [Lucide](https://lucide.dev) icon set via CDN.
- Fonts (Fraunces, Nunito, Caveat) load from Google Fonts.
