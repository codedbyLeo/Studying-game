(function () {
  const user = sqInitShell("history");
  if (!user) return;

  const subjects = SQ.getSubjects(user.id);
  const subjectSelect = document.getElementById("h-subject");
  subjects.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.name;
    subjectSelect.appendChild(opt);
  });

  let search = "";
  let subjectFilter = "all";
  let sortKey = "date";
  let ascending = false;

  function render() {
    const sessions = SQ.getSessions(user.id);
    const term = search.trim().toLowerCase();

    let rows = sessions.filter((s) => {
      const subjectName = subjects.find((sub) => sub.id === s.subject_id)?.name ?? "";
      const matchesSearch =
        term.length === 0 ||
        s.name.toLowerCase().includes(term) ||
        (s.notes ?? "").toLowerCase().includes(term) ||
        subjectName.toLowerCase().includes(term);
      const matchesSubject =
        subjectFilter === "all" || (subjectFilter === "none" ? !s.subject_id : s.subject_id === subjectFilter);
      return matchesSearch && matchesSubject;
    });

    rows.sort((a, b) => {
      if (sortKey === "duration") return a.minutes - b.minutes;
      if (sortKey === "xp") return a.xp_earned - b.xp_earned;
      return a.studied_on.localeCompare(b.studied_on);
    });
    if (!ascending) rows.reverse();

    const totalMinutes = rows.reduce((t, s) => t + s.minutes, 0);
    document.getElementById("h-summary").textContent =
      `${rows.length} sessions · ${SQ.formatMinutes(totalMinutes)} of studying`;

    const body = document.getElementById("h-body");
    if (rows.length === 0) {
      body.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem 0;color:var(--muted-foreground);">No sessions match your search yet.</td></tr>`;
    } else {
      body.innerHTML = rows
        .map((s) => {
          const subject = subjects.find((sub) => sub.id === s.subject_id);
          return `
            <tr>
              <td style="white-space:nowrap;">${s.studied_on}</td>
              <td>
                <span class="flex items-center gap-2">
                  <span style="width:.6rem;height:.6rem;border-radius:999px;background:${subject?.color ?? "var(--muted-foreground)"};display:inline-block;"></span>
                  ${subject ? sqEscape(subject.name) : "—"}
                </span>
              </td>
              <td style="font-weight:700;">${sqEscape(s.name)}</td>
              <td>${SQ.formatMinutes(s.minutes)}</td>
              <td>+${s.xp_earned}</td>
              <td class="muted" style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${sqEscape(s.notes || "")}</td>
              <td style="text-align:right;">
                <button class="btn btn-ghost btn-icon" data-del="${s.id}" aria-label="Delete session"><i data-lucide="trash-2"></i></button>
              </td>
            </tr>`;
        })
        .join("");
    }

    body.querySelectorAll("[data-del]").forEach((btn) =>
      btn.addEventListener("click", () => {
        SQ.deleteSession(user.id, btn.dataset.del);
        sqToast("Session deleted");
        render();
      })
    );
    sqIcons();
  }

  document.getElementById("h-search").addEventListener("input", (e) => {
    search = e.target.value;
    render();
  });
  subjectSelect.addEventListener("change", (e) => {
    subjectFilter = e.target.value;
    render();
  });
  document.getElementById("h-sort").addEventListener("change", (e) => {
    sortKey = e.target.value;
    render();
  });
  document.getElementById("h-order").addEventListener("click", () => {
    ascending = !ascending;
    document.getElementById("h-order-label").textContent = ascending ? "Ascending" : "Descending";
    render();
  });

  render();
})();
