/* =========================================================
   StudyQuest data layer
   Everything is stored in the browser's localStorage, so the
   whole app works with no backend/server — just open the
   HTML files. One browser = one "device" with its own accounts.
   ========================================================= */

const SQ = (() => {
  const LS_USERS = "sq_users";           // { [userId]: userRecord }
  const LS_SESSION = "sq_session";        // current logged-in userId
  const LS_SUBJECTS = "sq_subjects";      // { [userId]: Subject[] }
  const LS_SESSIONS = "sq_study_sessions";// { [userId]: StudySession[] }
  const LS_ACHIEVEMENTS = "sq_user_achievements"; // { [userId]: {code, unlocked_at}[] }

  /* ---------------- generic storage helpers ---------------- */
  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }
  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function uid() {
    return "id_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  /* ---------------- game rules ---------------- */
  const XP_PER_MINUTE = 1;

  function xpForLevel(level) {
    const n = Math.max(1, level) - 1;
    return (250 * n * (n + 1)) / 2;
  }

  function getLevelInfo(xp) {
    const safeXp = Math.max(0, Math.floor(xp || 0));
    let level = 1;
    while (xpForLevel(level + 1) <= safeXp) level += 1;
    const start = xpForLevel(level);
    const next = xpForLevel(level + 1);
    const xpForThisLevel = next - start;
    const xpIntoLevel = safeXp - start;
    return {
      level,
      xpIntoLevel,
      xpForThisLevel,
      xpToNextLevel: next - safeXp,
      progress: Math.min(100, Math.round((xpIntoLevel / xpForThisLevel) * 100)),
    };
  }

  function formatMinutes(minutes) {
    const total = Math.max(0, Math.round(minutes || 0));
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }

  function formatHours(minutes) {
    return (Math.max(0, minutes || 0) / 60).toFixed(1);
  }

  function formatStopwatch(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const hh = String(Math.floor(s / 3600)).padStart(2, "0");
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }

  function toDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  function todayKey() { return toDateKey(new Date()); }

  function startOfWeekKey(base = new Date()) {
    const d = new Date(base);
    const day = (d.getDay() + 6) % 7; // Monday = 0
    d.setDate(d.getDate() - day);
    return toDateKey(d);
  }
  function startOfMonthKey(base = new Date()) {
    return toDateKey(new Date(base.getFullYear(), base.getMonth(), 1));
  }
  function addDays(dateKey, delta) {
    const [y, m, d] = dateKey.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + delta);
    return toDateKey(dt);
  }

  const SUBJECT_COLORS = [
    "#d9773f", "#e0b03a", "#6fae7d", "#4f95c4",
    "#8a7bc8", "#d16a8f", "#4bab9b", "#b0693f",
  ];

  const ACHIEVEMENTS = [
    { code: "first_session", title: "First Study Session", description: "You opened the notebook and started your quest.", icon: "book-open", xp_reward: 50 },
    { code: "streak_3", title: "3 Day Streak", description: "Studied three days in a row.", icon: "flame", xp_reward: 100 },
    { code: "streak_7", title: "7 Day Study Streak", description: "A full week of consistency!", icon: "flame", xp_reward: 200 },
    { code: "streak_30", title: "30 Day Streak", description: "A whole month without missing a day.", icon: "trophy", xp_reward: 1000 },
    { code: "hours_10", title: "10 Hours Studied", description: "Ten hours of focus banked.", icon: "clock", xp_reward: 150 },
    { code: "hours_50", title: "50 Hours Studied", description: "Half a hundred hours of study.", icon: "star", xp_reward: 500 },
    { code: "hours_100", title: "100 Hours Studied", description: "Century club of studying.", icon: "award", xp_reward: 1000 },
    { code: "sessions_25", title: "25 Sessions", description: "Twenty-five study sessions logged.", icon: "notebook-pen", xp_reward: 250 },
    { code: "subjects_3", title: "Well Rounded", description: "Created three different subjects.", icon: "library", xp_reward: 100 },
    { code: "marathon", title: "Marathon Session", description: "A single session of 120 minutes or more.", icon: "rocket", xp_reward: 300 },
  ];

  /* ---------------- stats helpers ---------------- */
  function sumMinutes(sessions) {
    return sessions.reduce((t, s) => t + s.minutes, 0);
  }
  function minutesSince(sessions, fromKey) {
    return sumMinutes(sessions.filter((s) => s.studied_on >= fromKey));
  }
  function dashboardTotals(sessions) {
    const today = todayKey();
    return {
      today: minutesSince(sessions, today),
      week: minutesSince(sessions, startOfWeekKey()),
      month: minutesSince(sessions, startOfMonthKey()),
      total: sumMinutes(sessions),
      sessionCount: sessions.length,
    };
  }
  function minutesBySubject(sessions, subjects, fromKey = "1970-01-01") {
    return subjects.map((subject) => ({
      subject,
      minutes: sessions
        .filter((s) => s.subject_id === subject.id && s.studied_on >= fromKey)
        .reduce((t, s) => t + s.minutes, 0),
    }));
  }
  function buildHeatmap(sessions, weeks = 12) {
    const byDay = new Map();
    for (const s of sessions) byDay.set(s.studied_on, (byDay.get(s.studied_on) ?? 0) + s.minutes);

    const end = new Date();
    const endMonday = new Date(end);
    endMonday.setDate(end.getDate() - ((end.getDay() + 6) % 7));

    const grid = [];
    for (let w = weeks - 1; w >= 0; w--) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const day = new Date(endMonday);
        day.setDate(endMonday.getDate() - w * 7 + d);
        const key = toDateKey(day);
        week.push({ date: key, minutes: day > end ? -1 : (byDay.get(key) ?? 0) });
      }
      grid.push(week);
    }
    return grid;
  }
  function heatLevel(minutes) {
    if (minutes < 0) return -1;
    if (minutes === 0) return 0;
    if (minutes < 30) return 1;
    if (minutes < 60) return 2;
    if (minutes < 120) return 3;
    return 4;
  }
  function lastDays(sessions, days) {
    const byDay = new Map();
    for (const s of sessions) byDay.set(s.studied_on, (byDay.get(s.studied_on) ?? 0) + s.minutes);
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = toDateKey(d);
      result.push({
        date: key,
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        minutes: byDay.get(key) ?? 0,
      });
    }
    return result;
  }

  /* ---------------- accounts ---------------- */
  function getUsers() { return readJSON(LS_USERS, {}); }
  function saveUsers(users) { writeJSON(LS_USERS, users); }

  function findUserByEmail(email) {
    const users = getUsers();
    return Object.values(users).find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  function findUserByUsername(username) {
    const users = getUsers();
    return Object.values(users).find((u) => u.username.toLowerCase() === username.toLowerCase()) || null;
  }

  // Small non-cryptographic hash — this app has no server, so this is just
  // to avoid storing raw passwords in plain text in localStorage.
  function hashPassword(password) {
    let h = 0;
    for (let i = 0; i < password.length; i++) {
      h = (h << 5) - h + password.charCodeAt(i);
      h |= 0;
    }
    return "h" + h.toString(36) + "_" + password.length;
  }

  function signUp({ username, email, password }) {
    if (findUserByEmail(email)) {
      return { error: "An account with that email already exists." };
    }
    if (findUserByUsername(username)) {
      return { error: "That username is already taken." };
    }
    const users = getUsers();
    const id = uid();
    const user = {
      id,
      username,
      email,
      password_hash: hashPassword(password),
      avatar_url: null,
      bio: null,
      xp: 0,
      current_streak: 0,
      longest_streak: 0,
      last_study_date: null,
      created_at: new Date().toISOString(),
    };
    users[id] = user;
    saveUsers(users);
    writeJSON(LS_SUBJECTS_KEY(id), []);
    writeJSON(LS_SESSIONS_KEY(id), []);
    writeJSON(LS_ACH_KEY(id), []);
    setSession(id);
    return { user };
  }

  function signIn({ email, password }) {
    const user = findUserByEmail(email);
    if (!user || user.password_hash !== hashPassword(password)) {
      return { error: "Incorrect email or password." };
    }
    user.last_login_at = new Date().toISOString();
    const users = getUsers();
    users[user.id] = user;
    saveUsers(users);
    setSession(user.id);
    return { user };
  }

  function setSession(userId) { localStorage.setItem(LS_SESSION, userId); }
  function signOut() { localStorage.removeItem(LS_SESSION); }

  function getUserById(userId) {
    if (!userId) return null;
    const users = getUsers();
    return users[userId] || null;
  }

  function getCurrentUser() {
    const id = localStorage.getItem(LS_SESSION);
    if (!id) return null;
    const users = getUsers();
    return users[id] || null;
  }

  function requireAuth() {
    const user = getCurrentUser();
    if (!user) {
      window.location.href = "auth.html";
      return null;
    }
    return user;
  }

  function updateProfile(userId, patch) {
    const users = getUsers();
    if (!users[userId]) return null;

    if (patch.username) {
      const duplicate = Object.values(users).find(
        (u) => u.id !== userId && u.username.toLowerCase() === patch.username.toLowerCase()
      );
      if (duplicate) return { error: "That username is already taken." };
    }

    users[userId] = { ...users[userId], ...patch, updated_at: new Date().toISOString() };
    saveUsers(users);
    return users[userId];
  }

  /* ---------------- per-user storage keys ---------------- */
  function LS_SUBJECTS_KEY(userId) { return `${LS_SUBJECTS}_${userId}`; }
  function LS_SESSIONS_KEY(userId) { return `${LS_SESSIONS}_${userId}`; }
  function LS_ACH_KEY(userId) { return `${LS_ACHIEVEMENTS}_${userId}`; }

  /* ---------------- subjects ---------------- */
  function getSubjects(userId) { return readJSON(LS_SUBJECTS_KEY(userId), []); }
  function saveSubject(userId, subject) {
    const subjects = getSubjects(userId);
    if (subject.id) {
      const idx = subjects.findIndex((s) => s.id === subject.id);
      if (idx >= 0) subjects[idx] = { ...subjects[idx], ...subject };
    } else {
      subjects.unshift({
        id: uid(),
        user_id: userId,
        name: subject.name,
        color: subject.color,
        weekly_goal_hours: subject.weekly_goal_hours,
        created_at: new Date().toISOString(),
      });
    }
    writeJSON(LS_SUBJECTS_KEY(userId), subjects);
    checkAchievements(userId);
    return subjects;
  }
  function deleteSubject(userId, subjectId) {
    const subjects = getSubjects(userId).filter((s) => s.id !== subjectId);
    writeJSON(LS_SUBJECTS_KEY(userId), subjects);
    // sessions referencing this subject lose their subject, like ON DELETE SET NULL
    const sessions = getSessions(userId).map((s) =>
      s.subject_id === subjectId ? { ...s, subject_id: null } : s
    );
    writeJSON(LS_SESSIONS_KEY(userId), sessions);
    return subjects;
  }

  /* ---------------- sessions ---------------- */
  function getSessions(userId) {
    return readJSON(LS_SESSIONS_KEY(userId), [])
      .slice()
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  }

  /** Mirrors the `handle_new_session` DB trigger: XP + streak bookkeeping. */
  function addSession(userId, input) {
    const users = getUsers();
    const user = users[userId];
    if (!user) return { error: "Not signed in." };

    const minutes = Math.max(0, Math.round(input.minutes));
    const xpEarned = minutes * XP_PER_MINUTE;

    const session = {
      id: uid(),
      user_id: userId,
      subject_id: input.subject_id || null,
      name: input.name || "Study session",
      studied_on: input.studied_on || todayKey(),
      minutes,
      xp_earned: xpEarned,
      notes: input.notes || null,
      created_at: new Date().toISOString(),
    };

    const sessions = getSessions(userId);
    sessions.unshift(session);
    writeJSON(LS_SESSIONS_KEY(userId), sessions);

    // streak logic — same rules as the SQL trigger
    let streak = user.current_streak || 0;
    const lastDay = user.last_study_date;
    if (!lastDay) {
      streak = 1;
    } else if (session.studied_on === lastDay) {
      streak = Math.max(streak, 1);
    } else if (session.studied_on === addDays(lastDay, 1)) {
      streak = streak + 1;
    } else if (session.studied_on > lastDay) {
      streak = 1;
    }

    const newLastDay = !lastDay || session.studied_on > lastDay ? session.studied_on : lastDay;

    updateProfile(userId, {
      xp: (user.xp || 0) + xpEarned,
      current_streak: streak,
      longest_streak: Math.max(user.longest_streak || 0, streak),
      last_study_date: newLastDay,
    });

    const unlocked = checkAchievements(userId);
    return { session, unlocked };
  }

  function deleteSession(userId, sessionId) {
    const sessions = getSessions(userId);
    const target = sessions.find((s) => s.id === sessionId);
    const remaining = sessions.filter((s) => s.id !== sessionId);
    writeJSON(LS_SESSIONS_KEY(userId), remaining);
    if (target) {
      const users = getUsers();
      const user = users[userId];
      if (user) {
        updateProfile(userId, { xp: Math.max(0, (user.xp || 0) - target.xp_earned) });
      }
    }
    return remaining;
  }

  /* ---------------- achievements ---------------- */
  function getUnlockedAchievements(userId) {
    return readJSON(LS_ACH_KEY(userId), []); // [{code, unlocked_at}]
  }

  /** Mirrors the `check_achievements` DB function. */
  function checkAchievements(userId) {
    const users = getUsers();
    const user = users[userId];
    if (!user) return [];

    const sessions = getSessions(userId);
    const subjects = getSubjects(userId);
    const totalMinutes = sumMinutes(sessions);
    const sessionCount = sessions.length;
    const maxMinutes = sessions.reduce((m, s) => Math.max(m, s.minutes), 0);
    const subjectCount = subjects.length;
    const streak = user.current_streak || 0;

    const earned = [];
    if (sessionCount >= 1) earned.push("first_session");
    if (streak >= 3) earned.push("streak_3");
    if (streak >= 7) earned.push("streak_7");
    if (streak >= 30) earned.push("streak_30");
    if (totalMinutes >= 600) earned.push("hours_10");
    if (totalMinutes >= 3000) earned.push("hours_50");
    if (totalMinutes >= 6000) earned.push("hours_100");
    if (sessionCount >= 25) earned.push("sessions_25");
    if (subjectCount >= 3) earned.push("subjects_3");
    if (maxMinutes >= 120) earned.push("marathon");

    const already = getUnlockedAchievements(userId);
    const alreadyCodes = new Set(already.map((a) => a.code));
    const newlyUnlocked = earned.filter((c) => !alreadyCodes.has(c));

    if (newlyUnlocked.length > 0) {
      const now = new Date().toISOString();
      const updated = already.concat(newlyUnlocked.map((code) => ({ code, unlocked_at: now })));
      writeJSON(LS_ACH_KEY(userId), updated);

      const bonusXp = newlyUnlocked.reduce((sum, code) => {
        const def = ACHIEVEMENTS.find((a) => a.code === code);
        return sum + (def ? def.xp_reward : 0);
      }, 0);
      const freshUser = getUsers()[userId];
      updateProfile(userId, { xp: (freshUser.xp || 0) + bonusXp });
    }

    return newlyUnlocked.map((code) => ACHIEVEMENTS.find((a) => a.code === code)).filter(Boolean);
  }

  function achievementsWithStatus(userId) {
    const unlocked = getUnlockedAchievements(userId);
    const map = new Map(unlocked.map((a) => [a.code, a.unlocked_at]));
    return ACHIEVEMENTS.map((a) => ({ ...a, unlocked_at: map.get(a.code) || null }));
  }

  /* ---------------- leaderboard ---------------- */
  // Only real accounts stored by this app are ranked. No demo/fake users.
  function getLeaderboard(period) {
    const rows = [];
    const users = getUsers();

    for (const user of Object.values(users)) {
      const sessions = getSessions(user.id);
      const fromKey =
        period === "week" ? startOfWeekKey() : period === "month" ? startOfMonthKey() : "1970-01-01";

      const periodSessions = sessions.filter((s) => s.studied_on >= fromKey);
      const minutes = periodSessions.reduce((sum, s) => sum + Number(s.minutes || 0), 0);
      const xp = periodSessions.reduce((sum, s) => sum + Number(s.xp_earned || 0), 0);

      rows.push({
        user_id: user.id,
        username: user.username,
        avatar_url: user.avatar_url,
        xp,
        minutes,
      });
    }

    rows.sort((a, b) =>
      b.xp - a.xp ||
      b.minutes - a.minutes ||
      a.username.localeCompare(b.username)
    );

    return rows.slice(0, 100);
  }

  return {
    // rules
    XP_PER_MINUTE, xpForLevel, getLevelInfo, formatMinutes, formatHours, formatStopwatch,
    toDateKey, todayKey, startOfWeekKey, startOfMonthKey, SUBJECT_COLORS, ACHIEVEMENTS,
    // stats
    sumMinutes, minutesSince, dashboardTotals, minutesBySubject, buildHeatmap, heatLevel, lastDays,
    // auth
    signUp, signIn, signOut, getCurrentUser, getUserById, requireAuth, updateProfile,
    // subjects / sessions / achievements
    getSubjects, saveSubject, deleteSubject,
    getSessions, addSession, deleteSession,
    getUnlockedAchievements, achievementsWithStatus, checkAchievements,
    // leaderboard
    getLeaderboard,
  };
})();
