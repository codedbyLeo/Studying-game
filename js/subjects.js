(function () {
  const user = sqInitShell("subjects");
  if (!user) return;

  const colorsWrap = document.getElementById("s-colors");
  let selectedColor = SQ.SUBJECT_COLORS[0];
  SQ.SUBJECT_COLORS.forEach((color) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "color-swatch" + (color === selectedColor ? " selected" : "");
    btn.style.backgroundColor = color;
    btn.setAttribute("aria-label", `Colour ${color}`);
    btn.addEventListener("click", () => {
      selectedColor = color;
      [...colorsWrap.children].forEach((c) => c.classList.remove("selected"));
      btn.classList.add("selected");
    });
    colorsWrap.appendChild(btn);
  });

  function render() {
    const sessions = SQ.getSessions(user.id);
    const subjects = SQ.getSubjects(user.id);
    const weekStart = SQ.startOfWeekKey();
    const weekly = SQ.minutesBySubject(sessions, subjects, weekStart);
    const allTime = SQ.minutesBySubject(sessions, subjects);

    document.getElementById("subjects-empty").style.display = subjects.length === 0 ? "block" : "none";

    const grid = document.getElementById("subject-grid");
    grid.innerHTML = subjects
      .map((subject) => {
        const week = weekly.find((w) => w.subject.id === subject.id)?.minutes ?? 0;
        const total = allTime.find((w) => w.subject.id === subject.id)?.minutes ?? 0;
        const goalMinutes = Math.max(1, subject.weekly_goal_hours * 60);
        const pct = Math.min(100, Math.round((week / goalMinutes) * 100));
        return `
          <article class="notebook-card subject-card animate-pop-in">
            <div class="stripe" style="background:${subject.color};"></div>
            <div class="body">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h2 style="font-size:1.2rem;font-weight:800;">${sqEscape(subject.name)}</h2>
                  <p class="muted" style="font-size:.72rem;">Total studied: ${SQ.formatMinutes(total)}</p>
                </div>
                <div class="flex gap-1">
                  <button class="btn btn-ghost btn-icon" data-edit="${subject.id}" aria-label="Edit ${sqEscape(subject.name)}"><i data-lucide="pencil"></i></button>
                  <button class="btn btn-ghost btn-icon" data-delete="${subject.id}" aria-label="Delete ${sqEscape(subject.name)}"><i data-lucide="trash-2"></i></button>
                </div>
              </div>
              <div class="mt-4">
                <div class="flex justify-between" style="font-size:.85rem;font-weight:700;">
                  <span>This week</span>
                  <span>${SQ.formatHours(week)}/${subject.weekly_goal_hours}h</span>
                </div>
                <div class="subject-bar mt-1"><div style="width:${pct}%;background:${subject.color};"></div></div>
                <p class="hand text-primary mt-2" style="font-size:1.1rem;">
                  ${pct >= 100 ? "Goal smashed!" : `${pct}% of your weekly goal`}
                </p>
              </div>
            </div>
          </article>`;
      })
      .join("");

    grid.querySelectorAll("[data-edit]").forEach((btn) =>
      btn.addEventListener("click", () => openModal(subjects.find((s) => s.id === btn.dataset.edit)))
    );
    grid.querySelectorAll("[data-delete]").forEach((btn) =>
      btn.addEventListener("click", () => {
        SQ.deleteSubject(user.id, btn.dataset.delete);
        sqToast("Subject deleted");
        render();
      })
    );
    sqIcons();
  }

  const modal = document.getElementById("subject-modal");
  function openModal(subject) {
    document.getElementById("subject-modal-title").textContent = subject ? "Edit subject" : "New subject";
    document.getElementById("s-id").value = subject ? subject.id : "";
    document.getElementById("s-name").value = subject ? subject.name : "";
    document.getElementById("s-goal").value = subject ? subject.weekly_goal_hours : "5";
    selectedColor = subject ? subject.color : SQ.SUBJECT_COLORS[0];
    [...colorsWrap.children].forEach((c, i) => c.classList.toggle("selected", SQ.SUBJECT_COLORS[i] === selectedColor));
    modal.classList.add("open");
  }
  document.getElementById("new-subject-btn").addEventListener("click", () => openModal(null));
  document.getElementById("subject-cancel").addEventListener("click", () => modal.classList.remove("open"));
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("open"); });

  document.getElementById("subject-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("s-name").value.trim();
    const goal = Number(document.getElementById("s-goal").value);
    if (name.length < 1 || name.length > 40) return sqToast("Subject name must be 1–40 characters.", "error");
    if (!Number.isFinite(goal) || goal < 0 || goal > 100) return sqToast("Weekly goal must be between 0 and 100 hours.", "error");

    const id = document.getElementById("s-id").value || undefined;
    SQ.saveSubject(user.id, { id, name, color: selectedColor, weekly_goal_hours: goal });
    modal.classList.remove("open");
    sqToast("Subject saved", "success");
    render();
  });

  render();
})();
