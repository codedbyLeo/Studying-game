(async function () {
  const user = await sqInitShell("leaderboard");
  if (!user) return;

  let period = "all";
  const activeEvent = await SQ.getActiveEvent();
  const eventBanner = document.getElementById("xp-event-banner");
  if (activeEvent && eventBanner) { eventBanner.style.display = "block"; eventBanner.innerHTML = `<strong>⚡ ${sqEscape(activeEvent.name)}</strong> · ${Number(activeEvent.multiplier)}× XP is active!`; }

  async function render() {
    const rows = await SQ.getLeaderboard(period);
    const list = document.getElementById("lb-list");
    const empty = document.getElementById("lb-empty");

    if (rows.length === 0) {
      list.innerHTML = "";
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    list.innerHTML = rows
      .map((row, index) => {
        const isMe = row.user_id === user.id;
        const level = SQ.getLevelInfo(Number(row.xp));
        const rank = index + 1;
        const isMonthlyChampion = period === "month" && rank === 1;
        const rankIcon =
          rank === 1 ? `<i data-lucide="crown" style="color:var(--primary);"></i>`
          : rank === 2 ? `<i data-lucide="medal" style="color:var(--muted-foreground);"></i>`
          : rank === 3 ? `<i data-lucide="trophy" style="color:var(--muted-foreground);"></i>`
          : rank;
        return `
          <li class="lb-row${isMe ? " me" : ""}${isMonthlyChampion ? " monthly-champion" : ""}">
            <span class="lb-rank">${rankIcon}</span>
            <div class="avatar avatar-sm">
              ${row.avatar_url ? `<img src="${sqEscape(row.avatar_url)}" alt="">` : sqInitials(row.username)}
            </div>
            <div style="min-width:0;flex:1;">
              <p style="font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                ${sqEscape(row.username)}
                ${isMonthlyChampion ? `<span class="champion-badge">MONTHLY CHAMPION</span>` : ""}
                ${isMe ? `<span class="hand text-primary" style="font-size:1.05rem;margin-left:.4rem;">you!</span>` : ""}
              </p>
              <p class="muted" style="font-size:.72rem;">Level ${level.level} · ${SQ.formatHours(Number(row.minutes))}h studied</p>
            </div>
            <span class="lb-xp">${Number(row.xp)} XP</span>
          </li>`;
      })
      .join("");
    sqIcons();
  }

  document.querySelectorAll(".tab-btn[data-period]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn[data-period]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      period = btn.dataset.period;
      render();
    });
  });

  render();
})();
