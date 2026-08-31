/* Populates the sidebar / mobile header / bottom nav on authenticated pages. */

function sqInitShell(activePage) {
  const user = SQ.requireAuth();
  if (!user) return null;

  const level = SQ.getLevelInfo(user.xp || 0);

  document.querySelectorAll("[data-nav-link]").forEach((el) => {
    if (el.dataset.navLink === activePage) el.classList.add("active");
    else el.classList.remove("active");
  });

  document.querySelectorAll("[data-user-name]").forEach((el) => (el.textContent = user.username));
  document.querySelectorAll("[data-user-level]").forEach((el) => (el.textContent = `Level ${level.level}`));
  document.querySelectorAll("[data-user-xp-next]").forEach(
    (el) => (el.textContent = `${level.xpToNextLevel} XP to level ${level.level + 1}`)
  );
  document.querySelectorAll("[data-user-streak]").forEach(
    (el) => (el.textContent = `${user.current_streak || 0} day streak`)
  );
  document.querySelectorAll("[data-user-progress]").forEach((el) => {
    el.style.width = `${level.progress}%`;
  });
  document.querySelectorAll("[data-user-avatar]").forEach((el) => {
    if (user.avatar_url) {
      el.innerHTML = `<img src="${sqEscape(user.avatar_url)}" alt="">`;
    } else {
      el.textContent = sqInitials(user.username);
    }
  });

  document.querySelectorAll("[data-sign-out]").forEach((btn) => {
    btn.addEventListener("click", () => {
      SQ.signOut();
      window.location.href = "auth.html";
    });
  });

  sqIcons();
  return user;
}
