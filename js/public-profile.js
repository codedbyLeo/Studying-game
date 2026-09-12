(async function () {
  const currentUser = await sqInitShell("public-profile");
  if (!currentUser) return;

  // Get user ID from URL parameter: ?id=user_id_123
  const params = new URLSearchParams(window.location.search);
  const viewingUserId = params.get("id");

  if (!viewingUserId) {
    document.getElementById("pp-error").style.display = "block";
    document.getElementById("pp-content").style.display = "none";
    return;
  }

  // Load the user's public data
  const allUsers = SQ.getUsers ? SQ.getUsers() : {};
  const profileUser = allUsers[viewingUserId];

  if (!profileUser) {
    document.getElementById("pp-error").style.display = "block";
    document.getElementById("pp-content").style.display = "none";
    return;
  }

  // Get their sessions and subjects
  const sessions = SQ.getSessions ? SQ.getSessions(viewingUserId) : [];
  const subjects = SQ.getSubjects ? SQ.getSubjects(viewingUserId) : [];
  const achievements = SQ.achievementsWithStatus ? SQ.achievementsWithStatus(viewingUserId) : [];
  const unlocked = achievements.filter((a) => a.unlocked_at);

  // Calculate stats
  const totals = SQ.dashboardTotals(sessions);
  const level = SQ.getLevelInfo(profileUser.xp || 0);

  // Update page title
  document.getElementById("pp-title").textContent = `${profileUser.username}'s profile`;

  // Avatar
  const avatarEl = document.getElementById("pp-avatar");
  if (profileUser.avatar_url) {
    avatarEl.innerHTML = `<img src="${sqEscape(profileUser.avatar_url)}" alt="${sqEscape(profileUser.username)}" style="width:100%;height:100%;object-fit:cover;">`;
  } else {
    avatarEl.textContent = sqInitials(profileUser.username);
  }

  // Username and level
  document.getElementById("pp-username").textContent = profileUser.username;
  document.getElementById("pp-level").textContent = `Level ${level.level}`;
  document.getElementById("pp-bio").textContent = profileUser.bio || "";

  // Stats grid
  function statCard(label, value) {
    return `
      <div class="notebook-card stat-card" style="text-align:left;">
        <p class="label">${label}</p>
        <p class="value">${value}</p>
      </div>`;
  }

  document.getElementById("pp-stat-grid").innerHTML = `
    ${statCard("Total XP", String(profileUser.xp || 0))}
    ${statCard("Total Hours", `${SQ.formatHours(totals.total)}h`)}
    ${statCard("Sessions", String(totals.sessionCount))}
    ${statCard("Streak", `${profileUser.current_streak || 0} days`)}
  `;

  // Study stats section
  const weekly = SQ.minutesBySubject ? SQ.minutesBySubject(sessions, subjects, SQ.startOfWeekKey()) : [];
  const weeklyHtml = weekly.length === 0
    ? `<p class="muted" style="font-size:.9rem;">No subjects yet.</p>`
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

  document.getElementById("pp-stats").innerHTML = `
    <div style="margin-bottom:1rem;">
      <p style="font-weight:700;font-size:.9rem;margin-bottom:.5rem;">This week by subject</p>
      ${weeklyHtml}
    </div>
    <p class="muted" style="font-size:.85rem;">
      <strong>Total studied:</strong> ${SQ.formatMinutes(totals.total)}
    </p>
  `;

  // Achievements
  const achGridHtml = unlocked.length === 0
    ? `<p class="muted" style="font-size:.9rem;">No badges unlocked yet.</p>`
    : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(60px,1fr));gap:.5rem;">
        ${unlocked.slice(0, 8).map((a) => `
          <div style="text-align:center;cursor:help;" title="${sqEscape(a.title)}">
            <div style="width:60px;height:60px;border-radius:8px;background:var(--sticky);display:flex;align-items:center;justify-content:center;margin:0 auto;">
              <i data-lucide="${a.icon}" style="width:32px;height:32px;color:var(--primary);"></i>
            </div>
            <p style="font-size:.65rem;margin-top:.3rem;font-weight:700;">${sqEscape(a.title)}</p>
          </div>
        `).join("")}
      </div>`;

  document.getElementById("pp-ach-grid").innerHTML = achGridHtml;

  document.getElementById("pp-content").style.display = "block";
  document.getElementById("pp-error").style.display = "none";

  sqIcons();
})();
