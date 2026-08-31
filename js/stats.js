(function () {
  const user = sqInitShell("stats");
  if (!user) return;

  const sessions = SQ.getSessions(user.id);
  const subjects = SQ.getSubjects(user.id);
  const totals = SQ.dashboardTotals(sessions);

  document.getElementById("stats-grid").innerHTML = `
    ${statCard("Today", SQ.formatMinutes(totals.today), "sticky")}
    ${statCard("This week", `${SQ.formatHours(totals.week)}h`)}
    ${statCard("This month", `${SQ.formatHours(totals.month)}h`)}
    ${statCard("All time", `${SQ.formatHours(totals.total)}h`, "sticky")}
  `;
  function statCard(label, value, tone) {
    const cls = tone === "sticky" ? "sticky-note rotate-neg1 stat-card animate-pop-in" : "notebook-card stat-card animate-pop-in";
    return `<div class="${cls}"><p class="label">${label}</p><p class="value">${value}</p></div>`;
  }

  const weekBySubject = SQ.minutesBySubject(sessions, subjects, SQ.startOfWeekKey()).map(({ subject, minutes }) => ({
    name: subject.name,
    hours: Number((minutes / 60).toFixed(2)),
    color: subject.color,
  }));
  const daily = SQ.lastDays(sessions, 7).map((d) => ({ ...d, hours: Number((d.minutes / 60).toFixed(2)) }));

  function barChart(data, colorKey) {
    const max = Math.max(1, ...data.map((d) => d.hours));
    return `
      <div class="bar-chart">
        ${data
          .map((d) => {
            const heightPct = Math.max(2, Math.round((d.hours / max) * 100));
            const color = colorKey ? d[colorKey] : "var(--primary)";
            return `
              <div class="bar-col">
                <span class="bar-value">${d.hours}h</span>
                <div class="bar" style="height:${heightPct}%;background:${color};" title="${d.hours} h"></div>
                <span class="bar-label">${sqEscape(d.name || d.label)}</span>
              </div>`;
          })
          .join("")}
      </div>`;
  }

  const chartsWrap = document.getElementById("stats-charts");
  if (window.matchMedia("(min-width: 1024px)").matches) chartsWrap.style.gridTemplateColumns = "1fr 1fr";

  chartsWrap.innerHTML = `
    <div class="notebook-card animate-pop-in card">
      <h2 class="card-title"><i data-lucide="calendar-range" style="width:1rem;height:1rem;color:var(--primary);"></i> Hours per subject this week</h2>
      ${weekBySubject.length === 0
        ? `<p class="muted" style="font-size:.9rem;">Add subjects to see this chart.</p>`
        : barChart(weekBySubject, "color")}
    </div>
    <div class="notebook-card animate-pop-in card">
      <h2 class="card-title"><i data-lucide="flame" style="width:1rem;height:1rem;color:var(--primary);"></i> Last 7 days</h2>
      ${barChart(daily)}
    </div>
  `;

  const heatmap = SQ.buildHeatmap(sessions, 12);
  document.getElementById("heatmap").innerHTML = heatmap
    .map(
      (week) => `
      <div class="heatmap-week">
        ${week
          .map((day) => {
            const level = SQ.heatLevel(day.minutes);
            if (level < 0) return `<div class="heat-cell" style="opacity:0;"></div>`;
            return `<div class="heat-cell heat-${level}" title="${day.date}: ${SQ.formatMinutes(day.minutes)}"></div>`;
          })
          .join("")}
      </div>`
    )
    .join("");

  sqIcons();
})();
