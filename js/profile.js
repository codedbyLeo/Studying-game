(function () {
  const user = sqInitShell("profile");
  if (!user) return;

  const requestedUserId = new URLSearchParams(window.location.search).get("user");
  const profileUser = requestedUserId ? SQ.getUserById(requestedUserId) : user;
  if (!profileUser) {
    window.location.href = "leaderboard.html";
    return;
  }
  const isOwnProfile = profileUser.id === user.id;
  document.title = isOwnProfile ? "My profile — StudyQuest" : `${profileUser.username} — StudyQuest`;

  if (window.matchMedia("(min-width: 1024px)").matches) {
    document.getElementById("profile-grid").style.gridTemplateColumns = "1fr 2fr";
  }

  const sessions = SQ.getSessions(profileUser.id);
  const totals = SQ.dashboardTotals(sessions);
  const level = SQ.getLevelInfo(profileUser.xp || 0);

  document.getElementById("p-level-title").textContent = `Level ${level.level} scholar`;
  document.getElementById("p-bio").textContent = profileUser.bio || "";
  document.getElementById("p-bio").style.display = profileUser.bio ? "block" : "none";
  document.getElementById("p-progress-text").textContent =
    `${level.xpIntoLevel}/${level.xpForThisLevel} XP toward level ${level.level + 1}`;

  document.getElementById("p-stat-grid").innerHTML = `
    ${statCard("Total XP", String(profileUser.xp || 0))}
    ${statCard("Hours", `${SQ.formatHours(totals.total)}h`)}
    ${statCard("Streak", `${profileUser.current_streak || 0}d`, "sticky")}
    ${statCard("Best streak", `${profileUser.longest_streak || 0}d`, "sticky")}
  `;

  function statCard(label, value, tone) {
    const cls = tone === "sticky" ? "sticky-note rotate-neg1 stat-card" : "notebook-card stat-card";
    return `<div class="${cls}"><p class="label">${label}</p><p class="value" style="font-size:1.2rem;">${value}</p></div>`;
  }

  /* ---------------- badges: collapsed by default ---------------- */
  const achievements = SQ.achievementsWithStatus(profileUser.id);
  const achGrid = document.getElementById("ach-grid");
  const achToggle = document.getElementById("ach-toggle");
  const achCount = document.getElementById("ach-count");
  let showAllBadges = false;

  function renderAchievements() {
    const unlockedCount = achievements.filter((a) => a.unlocked_at).length;
    const visible = showAllBadges ? achievements : achievements.slice(0, 4);

    achCount.textContent = `${unlockedCount} of ${achievements.length} badges unlocked`;
    achToggle.textContent = showAllBadges ? "Show fewer" : `Show all ${achievements.length} badges`;
    achToggle.style.display = achievements.length > 4 ? "inline-flex" : "none";

    achGrid.innerHTML = visible.map((a) => {
      const unlocked = !!a.unlocked_at;
      return `
        <div class="ach-item ${unlocked ? "unlocked" : "locked"}">
          <span class="ach-icon"><i data-lucide="${a.icon}"></i></span>
          <div style="min-width:0;">
            <p style="font-weight:800;">${sqEscape(a.title)}</p>
            <p class="muted" style="font-size:.72rem;">${sqEscape(a.description)}</p>
            <p class="text-primary mt-1" style="font-size:.72rem;font-weight:700;">
              ${unlocked ? `Unlocked · +${a.xp_reward} XP` : `Locked · +${a.xp_reward} XP`}
            </p>
          </div>
        </div>`;
    }).join("");
    sqIcons();
  }

  achToggle.addEventListener("click", () => {
    showAllBadges = !showAllBadges;
    renderAchievements();
  });
  renderAchievements();

  /* ---------------- profile editor ---------------- */
  const usernameInput = document.getElementById("pf-username");
  const bioInput = document.getElementById("pf-bio");
  const bioCount = document.getElementById("pf-bio-count");
  const avatarPreview = document.getElementById("pf-avatar-preview");
  const avatarFile = document.getElementById("pf-avatar-file");
  const avatarButton = document.getElementById("pf-avatar-btn");

  usernameInput.value = profileUser.username;
  bioInput.value = profileUser.bio || "";

  let avatarData = profileUser.avatar_url || null;

  const editorCard = document.querySelector(".profile-editor");
  if (!isOwnProfile) {
    editorCard.style.display = "none";
    document.querySelector(".page-header .hand").textContent = "Student card";
    document.querySelector(".page-header h1").textContent = `${profileUser.username}'s Profile`;
  }
    const publicBack = document.createElement("a");
    publicBack.href = "leaderboard.html";
    publicBack.className = "btn btn-secondary";
    publicBack.innerHTML = '<i data-lucide="arrow-left"></i> Back to ranks';
    document.querySelector(".page-header").appendChild(publicBack);

  function renderAvatarPreview() {
    avatarPreview.innerHTML = avatarData
      ? `<img src="${sqEscape(avatarData)}" alt="Profile preview">`
      : sqInitials(usernameInput.value || user.username);
  }

  function updateBioCount() {
    bioCount.textContent = `${bioInput.value.length}/300`;
  }
  bioInput.addEventListener("input", updateBioCount);
  updateBioCount();
  renderAvatarPreview();

  /* ---------------- profile photo cropper ---------------- */
  const cropModal = document.getElementById("avatar-crop-modal");
  const cropStage = document.getElementById("crop-stage");
  const cropImage = document.getElementById("crop-image");
  const cropZoom = document.getElementById("crop-zoom");
  let cropSourceUrl = null;
  let cropScale = 1;
  let cropX = 0;
  let cropY = 0;
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let startX = 0;
  let startY = 0;

  function clampCrop() {
    const stageSize = cropStage.clientWidth;
    const imgW = cropImage.naturalWidth * cropScale;
    const imgH = cropImage.naturalHeight * cropScale;

    if (imgW <= stageSize) {
      cropX = (stageSize - imgW) / 2;
    } else {
      cropX = Math.min(0, Math.max(stageSize - imgW, cropX));
    }

    if (imgH <= stageSize) {
      cropY = (stageSize - imgH) / 2;
    } else {
      cropY = Math.min(0, Math.max(stageSize - imgH, cropY));
    }
  }

  function renderCropImage() {
    cropImage.style.width = `${cropImage.naturalWidth * cropScale}px`;
    cropImage.style.height = `${cropImage.naturalHeight * cropScale}px`;
    cropImage.style.transform = `translate(${cropX}px, ${cropY}px)`;
  }

  function fitCropImage() {
    const size = cropStage.clientWidth;
    if (!cropImage.naturalWidth || !cropImage.naturalHeight) return;

    // Fit the whole photo first. The user can then zoom in or out manually.
    const fitScale = Math.min(
      size / cropImage.naturalWidth,
      size / cropImage.naturalHeight
    );

    cropScale = fitScale;
    cropZoom.min = String(Math.max(0.05, fitScale));
    cropZoom.max = "4";
    cropZoom.value = String(cropScale);

    cropX = (size - cropImage.naturalWidth * cropScale) / 2;
    cropY = (size - cropImage.naturalHeight * cropScale) / 2;
    clampCrop();
    renderCropImage();
  }

  function openCropper(dataUrl) {
    cropSourceUrl = dataUrl;
    cropImage.src = dataUrl;
    cropModal.classList.add("open");
    cropModal.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => {
      if (cropImage.complete) fitCropImage();
    });
  }

  function closeCropper() {
    cropModal.classList.remove("open");
    cropModal.setAttribute("aria-hidden", "true");
    if (cropSourceUrl) URL.revokeObjectURL?.(cropSourceUrl);
    cropSourceUrl = null;
    avatarFile.value = "";
  }

  cropImage.addEventListener("load", fitCropImage);

  cropStage.addEventListener("pointerdown", (e) => {
    dragging = true;
    cropStage.setPointerCapture(e.pointerId);
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    startX = cropX;
    startY = cropY;
    cropStage.classList.add("dragging");
  });

  cropStage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    cropX = startX + e.clientX - dragStartX;
    cropY = startY + e.clientY - dragStartY;
    clampCrop();
    renderCropImage();
  });

  function stopDragging() {
    dragging = false;
    cropStage.classList.remove("dragging");
  }
  cropStage.addEventListener("pointerup", stopDragging);
  cropStage.addEventListener("pointercancel", stopDragging);
  cropStage.addEventListener("pointerleave", (e) => {
    if (dragging && !cropStage.hasPointerCapture(e.pointerId)) stopDragging();
  });

  function setZoom(value) {
    const next = Number(value);
    const stageSize = cropStage.clientWidth;
    const centerX = stageSize / 2;
    const centerY = stageSize / 2;
    const oldScale = cropScale;
    cropScale = next;
    cropX = centerX - (centerX - cropX) * (cropScale / oldScale);
    cropY = centerY - (centerY - cropY) * (cropScale / oldScale);
    clampCrop();
    renderCropImage();
  }

  cropZoom.addEventListener("input", () => setZoom(cropZoom.value));
  document.getElementById("crop-zoom-in").addEventListener("click", () => {
    cropZoom.value = Math.min(Number(cropZoom.max), Number(cropZoom.value) + 0.1);
    setZoom(cropZoom.value);
  });
  document.getElementById("crop-zoom-out").addEventListener("click", () => {
    cropZoom.value = Math.max(Number(cropZoom.min), Number(cropZoom.value) - 0.1);
    setZoom(cropZoom.value);
  });

  avatarButton.addEventListener("click", () => avatarFile.click());
  avatarFile.addEventListener("change", () => {
    const file = avatarFile.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      avatarFile.value = "";
      return sqToast("Please choose an image file.", "error");
    }
    if (file.size > 8 * 1024 * 1024) {
      avatarFile.value = "";
      return sqToast("Please choose an image smaller than 8 MB.", "error");
    }

    const reader = new FileReader();
    reader.onload = () => openCropper(reader.result);
    reader.readAsDataURL(file);
  });

  function makeCroppedAvatar() {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    const stageSize = cropStage.clientWidth;
    const sourceScale = cropImage.naturalWidth / (cropImage.naturalWidth * cropScale);
    const sx = Math.max(0, -cropX * sourceScale);
    const sy = Math.max(0, -cropY * sourceScale);
    const sw = stageSize * sourceScale;
    const sh = stageSize * sourceScale;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(cropImage, sx, sy, sw, sh, 0, 0, size, size);
    return canvas.toDataURL("image/png");
  }

  document.getElementById("avatar-crop-save").addEventListener("click", () => {
    avatarData = makeCroppedAvatar();
    renderAvatarPreview();
    closeCropper();
    sqToast("Photo ready — save your profile when you're done.", "success");
  });

  document.getElementById("avatar-crop-cancel").addEventListener("click", closeCropper);
  document.getElementById("avatar-crop-cancel-2").addEventListener("click", closeCropper);
  cropModal.addEventListener("click", (e) => {
    if (e.target === cropModal) closeCropper();
  });

  /* ---------------- save ---------------- */
  document.getElementById("profile-form").addEventListener("submit", (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const bio = bioInput.value.trim();

    if (username.length < 2 || username.length > 24) {
      return sqToast("Username must be 2–24 characters.", "error");
    }
    if (bio.length > 300) {
      return sqToast("Bio must be under 300 characters.", "error");
    }

    const updated = SQ.updateProfile(profileUser.id, {
      username,
      avatar_url: avatarData || null,
      bio: bio || null
    });

    if (updated?.error) return sqToast(updated.error, "error");

    sqToast("Profile saved", "success");
    setTimeout(() => window.location.reload(), 350);
  });

  sqIcons();
})();
