/* =========================================================
   StudyQuest — cozy digital study notebook
   Plain HTML / CSS / JS rebuild
   ========================================================= */

:root {
  --radius: 1rem;
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);

  --font-display: "Fraunces", ui-serif, Georgia, serif;
  --font-sans: "Nunito", ui-sans-serif, system-ui, sans-serif;
  --font-hand: "Caveat", ui-sans-serif, cursive;

  --background: oklch(0.968 0.018 88);
  --foreground: oklch(0.28 0.03 55);

  --paper: oklch(0.99 0.01 92);
  --paper-line: oklch(0.9 0.025 85);
  --ink: oklch(0.3 0.04 262);
  --ink-light: oklch(0.52 0.03 262);

  --card: oklch(0.99 0.01 92);
  --card-foreground: oklch(0.28 0.03 55);

  --primary: oklch(0.55 0.15 35);
  --primary-foreground: oklch(0.985 0.012 90);
  --secondary: oklch(0.93 0.03 88);
  --secondary-foreground: oklch(0.34 0.04 55);
  --muted: oklch(0.945 0.022 88);
  --muted-foreground: oklch(0.53 0.03 65);
  --accent: oklch(0.9 0.06 190);
  --accent-foreground: oklch(0.3 0.05 220);
  --destructive: oklch(0.56 0.19 25);
  --destructive-foreground: oklch(0.985 0.012 90);

  --border: oklch(0.89 0.028 82);
  --input: oklch(0.89 0.028 82);
  --ring: oklch(0.62 0.13 45);

  --highlight: oklch(0.9 0.16 100);
  --highlight-foreground: oklch(0.3 0.05 70);
  --sticky: oklch(0.92 0.14 100);
  --sticky-foreground: oklch(0.32 0.05 70);
  --mint: oklch(0.78 0.12 165);
  --berry: oklch(0.62 0.17 355);
  --sky: oklch(0.72 0.12 235);
  --xp: oklch(0.72 0.16 85);

  --chart-1: oklch(0.62 0.16 40);
  --chart-2: oklch(0.72 0.12 235);
  --chart-3: oklch(0.75 0.13 160);
  --chart-4: oklch(0.78 0.15 95);
  --chart-5: oklch(0.62 0.17 355);

  --shadow-paper: 0 1px 0 0 var(--paper-line), 0 8px 20px -12px oklch(0.35 0.06 60 / 0.35);
  --shadow-lift: 0 18px 40px -22px oklch(0.35 0.06 60 / 0.45);
  --shadow-sticky: 4px 6px 14px -6px oklch(0.4 0.08 70 / 0.4);
}

* { box-sizing: border-box; }

html, body { height: 100%; }

body {
  margin: 0;
  background-color: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
  background-image:
    radial-gradient(circle at 12% 18%, oklch(0.93 0.05 95 / 0.7) 0, transparent 42%),
    radial-gradient(circle at 88% 8%, oklch(0.9 0.05 200 / 0.5) 0, transparent 38%);
  background-attachment: fixed;
  min-height: 100%;
}

h1, h2, h3, h4 {
  font-family: var(--font-display);
  letter-spacing: -0.01em;
  margin: 0;
}

p { margin: 0; }
a { color: inherit; text-decoration: none; }
button { font-family: inherit; }
img { max-width: 100%; display: block; }

.container {
  max-width: 72rem;
  margin: 0 auto;
  padding: 0 1rem;
}
@media (min-width: 640px) {
  .container { padding: 0 1.5rem; }
}

/* ---------- utilities ---------- */
.hand { font-family: var(--font-hand); }
.muted { color: var(--muted-foreground); }
.text-primary { color: var(--primary); }
.text-center { text-align: center; }
.flex { display: flex; }
.grid { display: grid; }
.gap-2 { gap: .5rem; }
.gap-3 { gap: .75rem; }
.gap-4 { gap: 1rem; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.w-full { width: 100%; }
.mt-1 { margin-top: .25rem; }
.mt-2 { margin-top: .5rem; }
.mt-3 { margin-top: .75rem; }
.mt-4 { margin-top: 1rem; }
.mt-5 { margin-top: 1.25rem; }
.mt-6 { margin-top: 1.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-6 { margin-bottom: 1.5rem; }

.notebook-card {
  position: relative;
  background-color: var(--paper);
  border: 1px solid var(--border);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-paper);
}

.ruled {
  background-image: repeating-linear-gradient(
    to bottom, transparent 0, transparent 31px,
    var(--paper-line) 31px, var(--paper-line) 32px
  );
}

.sticky-note {
  background-color: var(--sticky);
  color: var(--sticky-foreground);
  box-shadow: var(--shadow-sticky);
  border-radius: calc(var(--radius) - 6px);
}
.rotate-neg1 { transform: rotate(-1deg); }

@keyframes pop-in {
  from { opacity: 0; transform: translateY(10px) scale(.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-pop-in { animation: pop-in .35s cubic-bezier(.34,1.56,.64,1) both; }

@keyframes level-up {
  0% { opacity: 0; transform: scale(.6) rotate(-6deg); }
  40% { opacity: 1; transform: scale(1.12) rotate(2deg); }
  70% { transform: scale(.98) rotate(-1deg); }
  100% { opacity: 1; transform: scale(1) rotate(0); }
}
.animate-level-up { animation: level-up 1.1s ease-out both; }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
.animate-float { animation: float 6s ease-in-out infinite; }

/* ---------- buttons ---------- */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .4rem;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 800;
  font-size: .875rem;
  padding: .6rem 1.1rem;
  cursor: pointer;
  transition: transform .12s ease, box-shadow .12s ease, background-color .12s ease, opacity .12s ease;
  white-space: nowrap;
}
.btn svg, .btn i { width: 1rem; height: 1rem; }
.btn:active { transform: translateY(1px); }
.btn:disabled { opacity: .6; cursor: not-allowed; }
.btn-primary { background-color: var(--primary); color: var(--primary-foreground); box-shadow: var(--shadow-lift); }
.btn-primary:hover { opacity: .92; }
.btn-secondary { background-color: var(--secondary); color: var(--secondary-foreground); }
.btn-secondary:hover { opacity: .85; }
.btn-ghost { background-color: transparent; color: var(--foreground); }
.btn-ghost:hover { background-color: var(--secondary); }
.btn-lg { padding: .85rem 1.5rem; font-size: 1rem; border-radius: var(--radius-lg); }
.btn-icon { padding: .55rem; border-radius: var(--radius-md); }
.btn-block { width: 100%; }

/* ---------- forms ---------- */
label, .field-label {
  display: block;
  font-size: .8rem;
  font-weight: 700;
  margin-bottom: .35rem;
  color: var(--foreground);
}
input, textarea, select {
  width: 100%;
  font-family: inherit;
  font-size: .9rem;
  padding: .6rem .75rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--input);
  background-color: var(--paper);
  color: var(--foreground);
}
input:focus, textarea:focus, select:focus {
  outline: 2px solid var(--ring);
  outline-offset: 1px;
}
.field { margin-bottom: 1rem; }
textarea { resize: vertical; }

/* ---------- badges / chips ---------- */
.chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background-color: var(--secondary);
  color: var(--secondary-foreground);
  padding: .3rem .7rem;
  font-size: .75rem;
  font-weight: 800;
}

/* ---------- progress ---------- */
.progress {
  width: 100%;
  height: .9rem;
  background-color: var(--secondary);
  border-radius: 999px;
  overflow: hidden;
}
.progress-thin { height: .4rem; }
.progress > div {
  height: 100%;
  background-color: var(--primary);
  border-radius: 999px;
  transition: width .4s ease;
}

/* ---------- landing page ---------- */
.landing-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 0;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 1.25rem;
}
.brand-mark {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-md);
  background-color: var(--primary);
  color: var(--primary-foreground);
}

.hero {
  display: grid;
  gap: 2rem;
  align-items: center;
  padding: 1.5rem 0 3rem;
}
@media (min-width: 1024px) {
  .hero { grid-template-columns: 1fr 1fr; padding: 3rem 0; }
}
.hero h1 {
  font-size: 2.5rem;
  line-height: 1.05;
  font-weight: 900;
  margin-top: .25rem;
}
@media (min-width: 640px) { .hero h1 { font-size: 3rem; } }
@media (min-width: 1024px) { .hero h1 { font-size: 3.5rem; } }

.hero-art {
  border-radius: var(--radius-2xl);
  padding: 1.75rem;
  background:
    linear-gradient(135deg, oklch(0.93 0.05 95) 0%, oklch(0.9 0.06 190) 100%);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-paper);
  position: relative;
  overflow: hidden;
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero-art .doodle { position: absolute; opacity: .55; }

.features {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
  padding: .5rem 0 2.5rem;
}
@media (min-width: 640px) { .features { grid-template-columns: 1fr 1fr; } }
@media (min-width: 1024px) { .features { grid-template-columns: 1fr 1fr 1fr; } }

.feature-card { padding: 1.25rem; }
.feature-icon {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-md);
  background-color: var(--secondary);
  color: var(--secondary-foreground);
}

.cta-block { padding: 2rem; text-align: center; margin-bottom: 2.5rem; }
.landing-footer {
  border-top: 1px solid var(--border);
  padding: 1.5rem 0;
  text-align: center;
  font-size: .875rem;
  color: var(--muted-foreground);
}

/* ---------- auth page ---------- */
.auth-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1rem;
}
.auth-box { width: 100%; max-width: 26rem; }
.tabs { display: grid; grid-template-columns: 1fr 1fr; gap: .25rem; background: var(--secondary); padding: .25rem; border-radius: var(--radius-md); margin-bottom: 1rem; }
.tab-btn {
  border: none; background: transparent; padding: .5rem; border-radius: var(--radius-sm);
  font-weight: 800; font-size: .85rem; cursor: pointer; color: var(--secondary-foreground);
}
.tab-btn.active { background-color: var(--paper); box-shadow: var(--shadow-paper); }
.tab-panel { display: none; }
.tab-panel.active { display: block; }
.divider { display: flex; align-items: center; gap: .75rem; margin: 1.25rem 0; font-size: .75rem; color: var(--muted-foreground); }
.divider::before, .divider::after { content: ""; flex: 1; height: 1px; background: var(--border); }

/* ---------- app shell ---------- */
.app-shell { min-height: 100vh; }
@media (min-width: 1024px) { .app-shell { display: flex; } }

.sidebar {
  display: none;
  width: 16rem;
  flex-shrink: 0;
  flex-direction: column;
  gap: 1.5rem;
  border-right: 1px solid var(--border);
  background-color: oklch(0.99 0.01 92 / 0.7);
  padding: 1.75rem 1.25rem;
}
@media (min-width: 1024px) { .sidebar { display: flex; } }

.side-profile { padding: 1rem; }
.side-profile-top { display: flex; align-items: center; gap: .75rem; }

.avatar {
  border-radius: 999px;
  background-color: var(--secondary);
  color: var(--secondary-foreground);
  display: grid;
  place-items: center;
  font-weight: 900;
  overflow: hidden;
  border: 1px solid var(--border);
  flex-shrink: 0;
}
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.avatar-sm { width: 2.25rem; height: 2.25rem; font-size: .75rem; }
.avatar-md { width: 2.75rem; height: 2.75rem; font-size: .9rem; }
.avatar-lg { width: 6rem; height: 6rem; font-size: 1.75rem; border-width: 4px; border-color: var(--paper); box-shadow: var(--shadow-lift); }

.side-nav { display: flex; flex-direction: column; gap: .25rem; }
.side-nav a {
  display: flex; align-items: center; gap: .75rem;
  padding: .65rem .75rem; border-radius: var(--radius-md);
  font-size: .875rem; font-weight: 700; color: var(--muted-foreground);
}
.side-nav a:hover { background-color: oklch(0.93 0.03 88 / 0.7); color: var(--foreground); }
.side-nav a.active { background-color: var(--secondary); color: var(--secondary-foreground); }
.side-nav svg { width: 1rem; height: 1rem; }

.main-col { flex: 1; min-width: 0; display: flex; flex-direction: column; }

.mobile-header {
  position: sticky; top: 0; z-index: 20;
  display: flex; align-items: center; gap: .75rem;
  border-bottom: 1px solid var(--border);
  background-color: oklch(0.99 0.01 92 / 0.9);
  backdrop-filter: blur(6px);
  padding: .75rem 1rem;
}
@media (min-width: 1024px) { .mobile-header { display: none; } }

main.page {
  max-width: 72rem;
  margin: 0 auto;
  width: 100%;
  padding: 1.25rem 1rem 7rem;
  flex: 1;
}
@media (min-width: 640px) { main.page { padding-left: 1.5rem; padding-right: 1.5rem; } }
@media (min-width: 1024px) { main.page { padding: 2rem 1.5rem 2.5rem; } }

.bottom-nav {
  position: fixed; inset-inline: 0; bottom: 0; z-index: 30;
  display: flex; justify-content: space-between; gap: 2px;
  border-top: 1px solid var(--border);
  background-color: oklch(0.99 0.01 92 / 0.95);
  backdrop-filter: blur(6px);
  padding: .5rem .35rem calc(.5rem + env(safe-area-inset-bottom, 0px));
}
@media (min-width: 1024px) { .bottom-nav { display: none; } }
.bottom-nav a {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: .15rem;
  padding: .2rem; border-radius: var(--radius-sm);
  font-size: .6rem; font-weight: 800; color: var(--muted-foreground);
}
.bottom-nav a.active { color: var(--primary); }
.bottom-nav svg { width: 1.2rem; height: 1.2rem; }

/* ---------- page header ---------- */
.page-header {
  display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between;
  gap: 1rem; margin-bottom: 1.5rem;
}
.page-header h1 { font-size: 1.9rem; font-weight: 900; }
@media (min-width: 640px) { .page-header h1 { font-size: 2.25rem; } }

/* ---------- stat cards ---------- */
.stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
@media (min-width: 640px) { .stat-grid { gap: 1rem; } }
@media (min-width: 1024px) { .stat-grid.cols-3 { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 1024px) { .stat-grid.cols-4 { grid-template-columns: repeat(4, 1fr); } }

.stat-card { padding: 1rem; }
.stat-card .row { display: flex; align-items: center; justify-content: space-between; gap: .5rem; }
.stat-card .label { font-size: .7rem; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; opacity: .7; }
.stat-card .value { font-family: var(--font-display); font-size: 1.6rem; font-weight: 900; margin-top: .4rem; }
.stat-card .hint { font-size: .7rem; opacity: .7; margin-top: .2rem; }

/* ---------- generic content card ---------- */
.card { padding: 1.25rem; }
.card h2.card-title, .card-title {
  display: flex; align-items: center; gap: .5rem;
  font-size: 1.1rem; font-weight: 800; margin-bottom: 1rem;
}

/* ---------- subjects ---------- */
.subject-grid { display: grid; gap: 1rem; grid-template-columns: 1fr; }
@media (min-width: 640px) { .subject-grid { grid-template-columns: 1fr 1fr; } }
@media (min-width: 1280px) { .subject-grid { grid-template-columns: 1fr 1fr 1fr; } }
.subject-card { overflow: hidden; }
.subject-card .stripe { height: .5rem; width: 100%; }
.subject-card .body { padding: 1.25rem; }
.subject-bar { height: .75rem; width: 100%; border-radius: 999px; background-color: var(--secondary); overflow: hidden; margin-top: .4rem; }
.subject-bar > div { height: 100%; border-radius: 999px; }

.color-swatch {
  width: 2rem; height: 2rem; border-radius: 999px; border: 2px solid transparent; cursor: pointer;
}
.color-swatch.selected { border-color: var(--foreground); transform: scale(1.1); }

/* ---------- timer ---------- */
.stopwatch-display {
  text-align: center; padding: 2rem 1rem; border: 1px solid var(--border); border-radius: var(--radius-lg);
}
.stopwatch-display .time {
  font-family: var(--font-display); font-weight: 900; font-size: 3rem; font-variant-numeric: tabular-nums;
}
@media (min-width: 640px) { .stopwatch-display .time { font-size: 3.75rem; } }

/* ---------- table ---------- */
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: .875rem; }
thead th { text-align: left; padding: .5rem .6rem; font-size: .72rem; text-transform: uppercase; letter-spacing: .03em; color: var(--muted-foreground); border-bottom: 1px solid var(--border); }
tbody td { padding: .6rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
tbody tr:last-child td { border-bottom: none; }

/* ---------- heatmap ---------- */
.heatmap-scroll { overflow-x: auto; padding-bottom: .5rem; }
.heatmap { display: flex; gap: 6px; }
.heatmap-week { display: flex; flex-direction: column; gap: 6px; }
.heat-cell { width: 16px; height: 16px; border-radius: 4px; border: 1px solid oklch(0.89 0.028 82 / .6); }
.heat-0 { background-color: var(--secondary); }
.heat-1 { background-color: color-mix(in oklch, var(--mint) 40%, transparent); }
.heat-2 { background-color: color-mix(in oklch, var(--mint) 65%, transparent); }
.heat-3 { background-color: color-mix(in oklch, var(--mint) 85%, transparent); }
.heat-4 { background-color: var(--mint); }
.heat-legend { display: flex; align-items: center; gap: .4rem; font-size: .72rem; color: var(--muted-foreground); margin-top: .75rem; }
.heat-legend .heat-cell { width: 14px; height: 14px; }

/* ---------- simple bar chart ---------- */
.bar-chart { display: flex; align-items: flex-end; gap: .6rem; height: 15rem; padding-top: 1rem; }
.bar-chart .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: .4rem; height: 100%; justify-content: flex-end; }
.bar-chart .bar { width: 100%; max-width: 2.75rem; border-radius: 8px 8px 0 0; min-height: 2px; transition: height .4s ease; position: relative; }
.bar-chart .bar-value { font-size: .7rem; font-weight: 800; }
.bar-chart .bar-label { font-size: .72rem; color: var(--muted-foreground); text-align: center; }

/* ---------- achievements ---------- */
.ach-grid { display: grid; gap: .75rem; grid-template-columns: 1fr; }
@media (min-width: 640px) { .ach-grid { grid-template-columns: 1fr 1fr; } }
.ach-item { display: flex; align-items: flex-start; gap: .75rem; border: 1px solid var(--border); border-radius: var(--radius-md); padding: .75rem; }
.ach-item.unlocked { border-color: color-mix(in oklch, var(--primary) 40%, transparent); background-color: color-mix(in oklch, var(--highlight) 30%, transparent); }
.ach-item.locked { background-color: color-mix(in oklch, var(--muted) 40%, transparent); opacity: .6; }
.ach-icon { display: grid; place-items: center; width: 2.5rem; height: 2.5rem; border-radius: var(--radius-sm); flex-shrink: 0; }
.ach-item.unlocked .ach-icon { background-color: var(--primary); color: var(--primary-foreground); }
.ach-item.locked .ach-icon { background-color: var(--muted); color: var(--muted-foreground); }

/* ---------- leaderboard ---------- */
.lb-row {
  display: flex; align-items: center; gap: .75rem;
  border: 1px solid var(--border); background-color: var(--paper);
  border-radius: var(--radius-md); padding: .75rem; margin-bottom: .5rem;
}
.lb-row.me { border-color: var(--primary); background-color: color-mix(in oklch, var(--highlight) 40%, transparent); }
.lb-rank { width: 2.25rem; flex-shrink: 0; text-align: center; font-family: var(--font-display); font-weight: 900; font-size: 1.1rem; }
.lb-xp { flex-shrink: 0; background-color: var(--secondary); border-radius: 999px; padding: .3rem .75rem; font-size: .85rem; font-weight: 800; }

/* ---------- modal ---------- */
.modal-overlay {
  position: fixed; inset: 0; z-index: 50; background-color: oklch(0.28 0.03 55 / .45);
  display: none; align-items: center; justify-content: center; padding: 1rem;
}
.modal-overlay.open { display: flex; }
.modal-box { width: 100%; max-width: 26rem; padding: 1.5rem; }
.modal-box h2 { font-size: 1.25rem; margin-bottom: 1rem; }
.modal-actions { display: flex; justify-content: flex-end; gap: .5rem; margin-top: 1.25rem; }

.celebrate-box { max-width: 24rem; text-align: center; padding: 2rem; }

/* ---------- toast ---------- */
#toast-region {
  position: fixed; top: 1rem; right: 1rem; z-index: 100;
  display: flex; flex-direction: column; gap: .5rem; max-width: 22rem;
}
.toast {
  background-color: var(--foreground); color: var(--background);
  padding: .7rem 1rem; border-radius: var(--radius-md); font-size: .85rem; font-weight: 700;
  box-shadow: var(--shadow-lift); animation: pop-in .25s ease both;
}
.toast.error { background-color: var(--destructive); color: var(--destructive-foreground); }
.toast.success { background-color: var(--primary); color: var(--primary-foreground); }

/* ---------- empty states ---------- */
.empty-state { padding: 2.5rem 1rem; text-align: center; }
.empty-state svg { margin: 0 auto; width: 2.5rem; height: 2.5rem; color: var(--primary); }

/* icons via lucide */
[data-lucide] { display: inline-block; }


/* ---------- profile editor ---------- */
.profile-editor-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.profile-edit-icon {
  display: grid;
  place-items: center;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 999px;
  background: var(--secondary);
  color: var(--primary);
}
.profile-avatar-editor {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  margin-bottom: 1.25rem;
  border: 1px dashed var(--border);
  border-radius: var(--radius-lg);
  background: color-mix(in oklch, var(--secondary) 45%, transparent);
}
.profile-avatar-editor .avatar {
  width: 5rem;
  height: 5rem;
  font-size: 1.3rem;
}
.profile-avatar-editor .field-label {
  margin-bottom: .45rem;
}
#pf-bio-count {
  float: right;
  font-weight: 600;
}
#ach-toggle {
  font-size: .78rem;
  padding: .45rem .75rem;
}
.ach-grid {
  transition: opacity .2s ease;
}

/* ---------- avatar cropper ---------- */
.avatar-crop-box {
  max-width: 30rem;
  padding: 1.25rem;
}
.crop-stage {
  position: relative;
  width: min(100%, 24rem);
  aspect-ratio: 1;
  margin: 1.25rem auto 1rem;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: #111;
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
.crop-stage.dragging { cursor: grabbing; }
.crop-stage img {
  position: absolute;
  top: 0;
  left: 0;
  max-width: none;
  display: block;
  transform-origin: top left;
  pointer-events: none;
  user-select: none;
}
.crop-window {
  position: absolute;
  inset: 0;
  border: 3px solid rgba(255,255,255,.95);
  border-radius: 50%;
  box-shadow:
    0 0 0 999px rgba(0,0,0,.5),
    inset 0 0 0 1px rgba(255,255,255,.35);
  pointer-events: none;
}
.crop-controls {
  display: flex;
  align-items: center;
  gap: .5rem;
  max-width: 22rem;
  margin: 0 auto;
}
.crop-controls input[type="range"] {
  padding: 0;
  border: 0;
  background: transparent;
}
.crop-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .35rem;
  font-size: .75rem;
  margin-top: .6rem;
}
.crop-hint svg { width: .9rem; height: .9rem; }
@media (max-width: 480px) {
  .profile-avatar-editor { align-items: flex-start; }
  .profile-avatar-editor .avatar { width: 4.25rem; height: 4.25rem; }
  .avatar-crop-box { padding: 1rem; }
}


/* ---------- responsive polish ---------- */
.lb-row[role="link"] {
  cursor: pointer;
  transition: transform .12s ease, box-shadow .12s ease, background-color .12s ease;
}
.lb-row[role="link"]:hover,
.lb-row[role="link"]:focus-visible {
  transform: translateY(-1px);
  box-shadow: var(--shadow-paper);
  outline: none;
}
.crop-stage img {
  max-width: none;
  max-height: none;
}
@media (max-width: 720px) {
  .page-header {
    align-items: stretch;
  }
  .page-header > .flex {
    width: 100%;
  }
  .page-header > .flex .btn {
    flex: 1;
  }
  .card {
    padding: 1rem;
  }
  .profile-avatar-editor {
    flex-wrap: wrap;
  }
  .profile-avatar-editor > div:last-child {
    flex: 1;
    min-width: 12rem;
  }
  .modal-overlay {
    align-items: flex-end;
    padding: .5rem;
  }
  .avatar-crop-box {
    max-width: 100%;
    max-height: calc(100dvh - 1rem);
    overflow: auto;
  }
  .crop-stage {
    width: min(100%, 22rem);
    max-height: 55dvh;
  }
  .bottom-nav {
    justify-content: flex-start;
    gap: .15rem;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-left: .35rem;
    padding-right: .35rem;
  }
  .bottom-nav::-webkit-scrollbar {
    display: none;
  }
  .bottom-nav a {
    flex: 0 0 4.4rem;
    min-width: 4.4rem;
    font-size: .58rem;
    padding: .3rem .1rem;
  }
  .bottom-nav svg {
    width: 1.15rem;
    height: 1.15rem;
  }
}
@media (max-width: 420px) {
  .container {
    padding-left: .75rem;
    padding-right: .75rem;
  }
  main.page {
    padding-left: .75rem;
    padding-right: .75rem;
    padding-bottom: 6.5rem;
  }
  .mobile-header {
    padding-left: .75rem;
    padding-right: .75rem;
  }
  .page-header h1 {
    font-size: 1.7rem;
  }
  .btn {
    min-height: 2.65rem;
  }
  .stat-card .value {
    font-size: 1.35rem;
  }
  .lb-row {
    gap: .5rem;
    padding: .65rem;
  }
  .lb-xp {
    padding: .25rem .5rem;
    font-size: .72rem;
  }
}
