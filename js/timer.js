(function () {
  const user = sqInitShell("timer");
  if (!user) return;

  const subjects = SQ.getSubjects(user.id);
  if (window.matchMedia("(min-width: 1024px)").matches) {
    document.getElementById("timer-grid").style.gridTemplateColumns = "1fr 1fr";
  }

  function fillSubjectSelect(select) {
    subjects.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.name;
      select.appendChild(opt);
    });
  }
  fillSubjectSelect(document.getElementById("tw-subject"));
  fillSubjectSelect(document.getElementById("m-subject"));
  if (subjects.length === 0) document.getElementById("tw-tip").style.display = "block";

  document.getElementById("m-date").value = SQ.todayKey();
  document.getElementById("m-date").max = SQ.todayKey();

  /* ---------------- stopwatch ---------------- */
  let seconds = 0;
  let running = false;
  let tickHandle = null;

  const timeEl = document.getElementById("stopwatch-time");
  const xpEl = document.getElementById("stopwatch-xp");
  const toggleBtn = document.getElementById("tw-toggle");

  function renderStopwatch() {
    timeEl.textContent = SQ.formatStopwatch(seconds);
    xpEl.textContent = `${Math.floor(seconds / 60)} XP so far`;
  }
  renderStopwatch();

  function setRunning(next) {
    running = next;
    if (running) {
      tickHandle = setInterval(() => {
        seconds += 1;
        renderStopwatch();
      }, 1000);
      toggleBtn.innerHTML = `<i data-lucide="pause"></i> Pause`;
    } else {
      clearInterval(tickHandle);
      toggleBtn.innerHTML = `<i data-lucide="play"></i> ${seconds > 0 ? "Resume" : "Start"}`;
    }
    sqIcons();
  }

  toggleBtn.addEventListener("click", () => setRunning(!running));

  document.getElementById("tw-reset").addEventListener("click", () => {
    setRunning(false);
    seconds = 0;
    renderStopwatch();
  });

  function showUnlocks(unlocked) {
    if (!unlocked || unlocked.length === 0) return;
    const list = document.getElementById("unlock-list");
    list.innerHTML = unlocked
      .map(
        (a) => `<li class="sticky-note rotate-neg1" style="padding:.55rem .75rem;font-size:.85rem;font-weight:800;">
          ${sqEscape(a.title)} <span style="font-weight:400;">+${a.xp_reward} XP</span>
        </li>`
      )
      .join("");
    document.getElementById("unlock-overlay").classList.add("open");
  }
  document.getElementById("unlock-close").addEventListener("click", () => {
    document.getElementById("unlock-overlay").classList.remove("open");
  });

  document.getElementById("tw-finish").addEventListener("click", () => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 1) return sqToast("Study for at least one minute before saving.", "error");
    setRunning(false);

    const subjectId = document.getElementById("tw-subject").value;
    const name = document.getElementById("tw-name").value.trim() || "Study session";

    const { session, unlocked } = SQ.addSession(user.id, {
      subject_id: subjectId || null,
      name,
      studied_on: SQ.todayKey(),
      minutes,
    });

    sqToast(`Saved! +${session.xp_earned} XP`, "success");
    seconds = 0;
    renderStopwatch();
    document.getElementById("tw-name").value = "";
    showUnlocks(unlocked);
  });

  /* ---------------- manual entry ---------------- */
  document.getElementById("manual-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const mins = Number(document.getElementById("m-minutes").value);
    const notes = document.getElementById("m-notes").value.trim();

    if (!Number.isFinite(mins) || mins < 1 || mins > 1440) {
      return sqToast("Minutes must be between 1 and 1440.", "error");
    }
    if (notes.length > 1000) return sqToast("Notes must be under 1000 characters.", "error");

    const { session, unlocked } = SQ.addSession(user.id, {
      subject_id: document.getElementById("m-subject").value || null,
      name: document.getElementById("m-name").value.trim().slice(0, 80) || "Study session",
      studied_on: document.getElementById("m-date").value || SQ.todayKey(),
      minutes: Math.round(mins),
      notes: notes || null,
    });

    sqToast(`Saved! +${session.xp_earned} XP`, "success");
    document.getElementById("m-minutes").value = "30";
    document.getElementById("m-name").value = "";
    document.getElementById("m-notes").value = "";
    showUnlocks(unlocked);
  });
})();
