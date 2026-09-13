(async function () {
  const user = await sqInitShell("profile");
  if (!user) return;

  if (window.matchMedia("(min-width: 1024px)").matches) {
    document.getElementById("profile-grid").style.gridTemplateColumns = "1fr 2fr";
  }

  const sessions = SQ.getSessions(user.id);
  const totals = SQ.dashboardTotals(sessions);
  const level = SQ.getLevelInfo(user.xp || 0);

  document.getElementById("p-level-title").textContent = `Level ${level.level} scholar`;
  document.getElementById("p-bio").textContent = user.bio || "";
  document.getElementById("p-bio").style.display = user.bio ? "block" : "none";
  document.getElementById("p-progress-text").textContent = `${level.xpIntoLevel}/${level.xpForThisLevel} XP toward level ${level.level + 1}`;

  function statCard(label, value) {
    return `<div class="notebook-card stat-card"><p class="label">${label}</p><p class="value">${value}</p></div>`;
  }

  document.getElementById("p-stat-grid").innerHTML = `
    ${statCard("Total XP", String(user.xp || 0))}
    ${statCard("Hours", `${SQ.formatHours(totals.total)}h`)}
    ${statCard("Streak", `${user.current_streak || 0} days`)}
  `;

  // Achievements
  const achievements = SQ.achievementsWithStatus(user.id);
  const unlocked = achievements.filter((a) => a.unlocked_at);
  const achGrid = document.getElementById("ach-grid");

  const renderAchievements = (showAll = false) => {
    const visible = showAll ? achievements : unlocked.slice(0, 4);
    achGrid.innerHTML = visible.length
      ? visible
          .map(
            (a) =>
              `<div class="ach-item ${a.unlocked_at ? "unlocked" : "locked"}" title="${sqEscape(a.title)}">
            <span class="ach-icon"><i data-lucide="${a.icon}"></i></span>
            <p style="font-size:.7rem;font-weight:700;margin-top:.3rem;">${sqEscape(a.title)}</p>
          </div>`
          )
          .join("")
      : `<p class="muted" style="font-size:.9rem;">No badges yet. Keep studying!</p>`;

    let btn = document.getElementById("show-all-badges");
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "show-all-badges";
      btn.className = "btn btn-ghost btn-block mt-3";
      achGrid.parentElement.appendChild(btn);
    }
    btn.style.display = achievements.length > 4 ? "block" : "none";
    btn.textContent = showAll ? "Show fewer badges" : "Show all badges";
    btn.onclick = () => renderAchievements(!showAll);
    sqIcons();
  };
  renderAchievements(false);

  // Profile form
  const usernameInput = document.getElementById("pf-username");
  const bioInput = document.getElementById("pf-bio");
  const fileInput = document.getElementById("pf-avatar-file");
  const preview = document.getElementById("pf-avatar-preview");

  usernameInput.value = user.username;
  bioInput.value = user.bio || "";

  let avatarData = user.avatar_url || null;

  const setPreview = () => {
    if (avatarData) {
      preview.innerHTML = `<img src="${sqEscape(avatarData)}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
      preview.textContent = sqInitials(user.username);
    }
  };
  setPreview();

  // Avatar cropper
  const modal = document.getElementById("avatar-crop-modal");
  const canvas = document.getElementById("crop-canvas");
  const ctx = canvas.getContext("2d");
  const zoom = document.getElementById("crop-zoom");

  let img = null;
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let dragging = false;
  let startX = 0;
  let startY = 0;

  function draw() {
    if (!img) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.beginPath();
    ctx.arc(180, 180, 180, 0, Math.PI * 2);
    ctx.clip();

    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, 180 - w / 2 + offsetX, 180 - h / 2 + offsetY, w, h);
    ctx.restore();
  }

  document.getElementById("pf-avatar-btn").onclick = () => fileInput.click();

  fileInput.onchange = () => {
    const f = fileInput.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return sqToast("Please choose an image file.", "error");

    const reader = new FileReader();
    reader.onload = (e) => {
      img = new Image();
      img.onload = () => {
        scale = 1;
        offsetX = 0;
        offsetY = 0;
        zoom.value = 1;
        draw();
        modal.classList.add("open");
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(f);
  };

  zoom.oninput = () => {
    scale = Number(zoom.value);
    draw();
  };

  canvas.onpointerdown = (e) => {
    dragging = true;
    canvas.setPointerCapture(e.pointerId);
    startX = e.clientX - offsetX;
    startY = e.clientY - offsetY;
  };

  canvas.onpointermove = (e) => {
    if (!dragging) return;
    offsetX = e.clientX - startX;
    offsetY = e.clientY - startY;
    draw();
  };

  canvas.onpointerup = canvas.onpointercancel = () => {
    dragging = false;
  };

  document.getElementById("crop-cancel").onclick = () => {
    modal.classList.remove("open");
  };

  document.getElementById("crop-save").onclick = () => {
    const out = document.createElement("canvas");
    const o = out.getContext("2d");
    out.width = 512;
    out.height = 512;

    o.beginPath();
    o.arc(256, 256, 256, 0, Math.PI * 2);
    o.clip();

    const w = img.width * scale;
    const h = img.height * scale;
    o.drawImage(img, 256 - w / 2 + offsetX * 1.42, 256 - h / 2 + offsetY * 1.42, w, h);

    avatarData = out.toDataURL("image/jpeg", 0.85);
    setPreview();
    modal.classList.remove("open");
    sqToast("Photo cropped! Save your profile to apply.", "success");
  };

  // Profile form submit
  document.getElementById("profile-form").addEventListener("submit", (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const bio = bioInput.value.trim();

    if (username.length < 2 || username.length > 24) {
      return sqToast("Username must be 2–24 characters.", "error");
    }

    SQ.updateProfile(user.id, {
      username,
      bio,
      avatar_url: avatarData,
    });

    sqToast("Profile saved!", "success");
    if (window.sqRefreshUserShell) window.sqRefreshUserShell();
  });

  sqIcons();
})();
