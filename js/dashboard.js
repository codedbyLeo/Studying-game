(function () {
  const user = sqInitShell("dashboard");
  if (!user) return;

  const sessions = SQ.getSessions(user.id);
  const subjects = SQ.getSubjects(user.id);
  const achievements = SQ.achievementsWithStatus(user.id);
  const unlocked = achievements.filter((a) => a.unlocked_at);

  const totals = SQ.dashboardTotals(sessions);
  const level = SQ.getLevelInfo(user.xp || 0);
  const weekly = SQ.minutesBySubject(sessions, subjects, SQ.startOfWeekKey())
    .filter((w) => w.subject);

  /* ---------------- stat cards ---------------- */
  const statGrid = document.getElementById("stat-grid");
  statGrid.innerHTML = `
    ${statCard("Today", SQ.formatMinutes(totals.today), `${totals.today} XP earned today`, "clock", "sticky")}
    ${statCard("This week", SQ.formatMinutes(totals.week), `${SQ.formatHours(totals.week)} hours`, "calendar-days")}
    ${statCard("Total hours", `${SQ.formatHours(totals.total)}h`, `${totals.sessionCount} sessions logged`, "hourglass")}
    ${statCard("Streak", `${user.current_streak || 0} days`, `Best: ${user.longest_streak || 0} days`, "flame")}
    ${statCard("Total XP", String(user.xp || 0), "1 minute studied = 1 XP", "sparkles")}
    ${statCard("Level", String(level.level), `${level.xpToNextLevel} XP to next level`, "trophy", "sticky")}
  `;

  function statCard(label, value, hint, icon, tone) {
    const cls = tone === "sticky" ? "sticky-note rotate-neg1 stat-card animate-pop-in" : "notebook-card stat-card animate-pop-in";
    return `
      <div class="${cls}">
        <div class="row">
          <p class="label">${label}</p>
          <i data-lucide="${icon}" style="width:1rem;height:1rem;opacity:.7;"></i>
        </div>
        <p class="value">${value}</p>
        <p class="hint">${hint}</p>
      </div>`;
  }

  /* ---------------- columns ---------------- */
  const cols = document.getElementById("dashboard-columns");
  cols.style.gridTemplateColumns = "1fr";
  if (window.matchMedia("(min-width: 1024px)").matches) {
    cols.style.gridTemplateColumns = "2fr 1fr";
  }

  const weeklyHtml = weekly.length === 0
    ? `<p class="muted" style="font-size:.9rem;">No subjects yet. <a href="subjects.html" style="color:var(--primary);font-weight:700;text-decoration:underline;">Create your first subject</a>.</p>`
    : `<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:.75rem;">
        ${weekly.map(({ subject, minutes }) => {
          const goalMinutes = Math.max(1, subject.weekly_goal_hours * 60);
          const pct = Math.min(100, Math.round((minutes / goalMinutes) * 100));
          return `
            <li>
              <div class="flex justify-between" style="font-size:.85rem;">
                <span class="flex items-center gap-2" style="font-weight:700;">
                  <span style="width:.7rem;height:.7rem;border-radius:999px;background:${subject.color};display:inline-block;"></span>
                  ${sqEscape(subject.name)}
                </span>
                <span class="muted">${SQ.formatHours(minutes)}/${subject.weekly_goal_hours}h</span>
              </div>
              <div class="subject-bar mt-1"><div style="width:${pct}%;background:${subject.color};"></div></div>
            </li>`;
        }).join("")}
      </ul>`;

  const recentHtml = sessions.length === 0
    ? `<p class="muted" style="font-size:.9rem;">Nothing here yet — start the timer and earn your first XP.</p>`
    : `<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:.75rem;">
        ${sessions.slice(0, 5).map((s) => {
          const subject = subjects.find((sub) => sub.id === s.subject_id);
          return `
            <li class="flex items-center justify-between gap-3" style="font-size:.85rem;">
              <div style="min-width:0;">
                <p style="font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${sqEscape(s.name)}</p>
                <p class="muted" style="font-size:.72rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${subject ? sqEscape(subject.name) : "No subject"} · ${s.studied_on}</p>
              </div>
              <span class="chip">+${s.xp_earned} XP</span>
            </li>`;
        }).join("")}
      </ul>`;

  const badgesHtml = unlocked.length === 0
    ? `<p class="muted" style="font-size:.9rem;">No badges yet. Your first study session unlocks one!</p>`
    : `<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:.5rem;">
        ${unlocked.slice(0, 4).map((a) => `
          <li class="sticky-note rotate-neg1" style="padding:.55rem .75rem;font-size:.85rem;font-weight:700;">
            ${sqEscape(a.title)} <span style="font-weight:400;font-size:.72rem;opacity:.7;">+${a.xp_reward} XP</span>
          </li>`).join("")}
      </ul>`;

  cols.innerHTML = `
    <div class="notebook-card animate-pop-in card">
      <div class="flex justify-between" style="align-items:flex-end;font-size:.9rem;">
        <span style="font-weight:700;">Level ${level.level}</span>
        <span class="muted">${level.xpIntoLevel} / ${level.xpForThisLevel} XP</span>
      </div>
      <div class="progress mt-2" style="height:1rem;"><div style="width:${level.progress}%;"></div></div>
      <p class="hand text-primary mt-3" style="font-size:1.2rem;">
        ${level.xpToNextLevel} XP to reach level ${level.level + 1} — that's ${SQ.formatMinutes(level.xpToNextLevel)} of studying.
      </p>
      <h3 class="mt-6" style="font-size:.8rem;font-weight:800;text-transform:uppercase;letter-spacing:.03em;color:var(--muted-foreground);margin-bottom:.75rem;">
        This week by subject
      </h3>
      ${weeklyHtml}
    </div>

    <div class="flex" style="flex-direction:column;gap:1rem;">
      <div class="notebook-card animate-pop-in card">
        <h2 class="card-title">Recent sessions</h2>
        ${recentHtml}
      </div>
      <div class="notebook-card animate-pop-in card">
        <h2 class="card-title">Latest badges</h2>
        ${badgesHtml}
        <a href="profile.html" class="btn btn-ghost btn-block mt-3">See all achievements</a>
      </div>
    </div>
  `;

  sqIcons();

  /* ---------------- level-up celebration ---------------- */
  const lastSeenLevel = Number(sessionStorage.getItem("sq_last_seen_level") || level.level);
  if (level.level > lastSeenLevel) {
    document.getElementById("celebrate-level").textContent = `Level ${level.level}`;
    document.getElementById("celebrate-text").textContent =
      `Keep going — ${level.xpToNextLevel} XP until level ${level.level + 1}.`;
    const overlay = document.getElementById("celebrate-overlay");
    overlay.classList.add("open");
    overlay.addEventListener("click", () => overlay.classList.remove("open"));
    setTimeout(() => overlay.classList.remove("open"), 3500);
  }
  sessionStorage.setItem("sq_last_seen_level", String(level.level));
})();
