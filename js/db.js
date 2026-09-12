/* StudyQuest Database Layer — localStorage + optional Supabase cloud */

window.SQ = window.SQ || {};

(async function() {
  const LS_USERS = "sq_users";
  const LS_SESSIONS = "sq_sessions";
  const LS_SUBJECTS = "sq_subjects";
  const LS_ACHIEVEMENTS = "sq_achievements";
  const LS_SESSION = "sq_session";

  let CLOUD_ENABLED = false;
  let sb = null;

  function readJSON(key, fallback) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch (e) {
      console.error("readJSON error:", e);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function uid() {
    return "id_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  // Achievement definitions
  const ACHIEVEMENTS = [
    { code: "first_session", title: "First Steps", icon: "play", xp_reward: 10 },
    { code: "ten_sessions", title: "Dedicated", icon: "book-open", xp_reward: 25 },
    { code: "hour_studied", title: "Marathon", icon: "hourglass", xp_reward: 50 },
    { code: "level_5", title: "Climber", icon: "trending-up", xp_reward: 100 },
    { code: "week_streak", title: "On Fire", icon: "flame", xp_reward: 75 },
  ];

  const SUBJECT_COLORS = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
    "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B88B", "#52D3A7",
  ];

  function xpForLevel(level) {
    const n = Math.max(1, level) - 1;
    return (250 * n * (n + 1)) / 2;
  }

  function getLevelInfo(xp) {
    let level = 1;
    let totalXpForLevel = 0;
    while (xpForLevel(level + 1) <= xp) {
      level++;
    }
    totalXpForLevel = xpForLevel(level);
    const xpForThisLevel = xpForLevel(level + 1) - totalXpForLevel;
    const xpIntoLevel = xp - totalXpForLevel;
    const xpToNextLevel = Math.max(0, xpForThisLevel - xpIntoLevel);
    const progress = Math.round((xpIntoLevel / xpForThisLevel) * 100);
    return { level, xpIntoLevel, xpForThisLevel, xpToNextLevel, progress };
  }

  function formatMinutes(minutes) {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  function formatHours(minutes) {
    return (Math.max(0, minutes || 0) / 60).toFixed(1);
  }

  function formatStopwatch(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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
    d.setDate(d.getDate() - d.getDay());
    return toDateKey(d);
  }

  function startOfMonthKey(base = new Date()) {
    return toDateKey(new Date(base.getFullYear(), base.getMonth(), 1));
  }

  function addDays(dateKey, delta) {
    const [y, m, d] = dateKey.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + delta);
    return toDateKey(date);
  }

  function sumMinutes(sessions) {
    return sessions.reduce((t, s) => t + (s.minutes || 0), 0);
  }

  function minutesSince(sessions, fromKey) {
    return sumMinutes(sessions.filter((s) => s.studied_on >= fromKey));
  }

  function dashboardTotals(sessions) {
    const today = todayKey();
    const weekStart = startOfWeekKey();
    const monthStart = startOfMonthKey();

    return {
      today: minutesSince(sessions, today),
      week: minutesSince(sessions, weekStart),
      month: minutesSince(sessions, monthStart),
      total: sumMinutes(sessions),
      sessionCount: sessions.length,
    };
  }

  function minutesBySubject(sessions, subjects, fromKey = "1970-01-01") {
    const filtered = sessions.filter((s) => s.studied_on >= fromKey);
    const bySubject = {};
    filtered.forEach((s) => {
      const sid = s.subject_id || "none";
      bySubject[sid] = (bySubject[sid] || 0) + (s.minutes || 0);
    });
    return subjects.map((subj) => ({
      subject: subj,
      minutes: bySubject[subj.id] || 0,
    }));
  }

  function buildHeatmap(sessions, weeks = 12) {
    const today = new Date();
    const heatmap = [];
    for (let w = weeks - 1; w >= 0; w--) {
      const week = [];
      for (let d = 6; d >= 0; d--) {
        const date = new Date(today);
        date.setDate(date.getDate() - (w * 7 + d));
        const dateKey = toDateKey(date);
        const dayMinutes = sessions
          .filter((s) => s.studied_on === dateKey)
          .reduce((t, s) => t + (s.minutes || 0), 0);
        week.push({ date: dateKey, minutes: dayMinutes });
      }
      heatmap.push(week.reverse());
    }
    return heatmap;
  }

  function heatLevel(minutes) {
    if (minutes === 0) return -1;
    if (minutes < 30) return 0;
    if (minutes < 60) return 1;
    if (minutes < 120) return 2;
    if (minutes < 180) return 3;
    return 4;
  }

  function lastDays(sessions, days) {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = toDateKey(date);
      const minutes = sessions
        .filter((s) => s.studied_on === dateKey)
        .reduce((t, s) => t + (s.minutes || 0), 0);
      result.push({ date: dateKey, label: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()], minutes });
    }
    return result;
  }

  function getUsers() { return readJSON(LS_USERS, {}); }
  function saveUsers(users) { writeJSON(LS_USERS, users); }

  function findUserByEmail(email) {
    const users = getUsers();
    return Object.values(users).find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  function hashPassword(password) {
    // Simple hash — in production use bcrypt or Supabase auth
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return "hash_" + Math.abs(hash).toString(36);
  }

  function setSession(userId) { localStorage.setItem(LS_SESSION, userId); }
  function signOutLocal() { localStorage.removeItem(LS_SESSION); }

  async function init() {
    if (window.STUDYQUEST_CONFIG?.SUPABASE_URL && window.STUDYQUEST_CONFIG?.SUPABASE_ANON_KEY) {
      try {
        sb = window.supabase.createClient(
          window.STUDYQUEST_CONFIG.SUPABASE_URL,
          window.STUDYQUEST_CONFIG.SUPABASE_ANON_KEY
        );
        CLOUD_ENABLED = true;
      } catch (e) {
        console.warn("Supabase init failed, using localStorage only", e);
        CLOUD_ENABLED = false;
      }
    }
  }

  async function signUp({ username, email, password }) {
    if (!username || !email || !password) return { error: "All fields required" };

    if (CLOUD_ENABLED && sb) {
      try {
        const { data, error } = await sb.auth.signUp({ email, password });
        if (error) return { error: error.message };
        return { needsConfirmation: data.user && !data.session };
      } catch (e) {
        return { error: e.message };
      }
    }

    // Local mode
    if (findUserByEmail(email)) return { error: "Email already exists" };
    const userId = uid();
    const users = getUsers();
    users[userId] = {
      id: userId,
      username,
      email,
      password_hash: hashPassword(password),
      avatar_url: null,
      bio: "",
      xp: 0,
      current_streak: 0,
      longest_streak: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveUsers(users);
    setSession(userId);
    return { success: true };
  }

  async function signIn({ email, password }) {
    if (!email || !password) return { error: "Email and password required" };

    if (CLOUD_ENABLED && sb) {
      try {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };
        if (data.session) {
          setSession(data.user.id);
          return { success: true };
        }
      } catch (e) {
        return { error: e.message };
      }
    }

    // Local mode
    const user = findUserByEmail(email);
    if (!user || user.password_hash !== hashPassword(password)) {
      return { error: "Invalid email or password" };
    }
    setSession(user.id);
    return { success: true };
  }

  async function signOut() { if (CLOUD_ENABLED) await sb.auth.signOut(); signOutLocal(); }
  function getCurrentUser() { const id = localStorage.getItem(LS_SESSION); return id ? getUsers()[id] || null : null; }
  function requireAuth() { const user = getCurrentUser(); if (!user) { window.location.href = "auth.html"; return null; } return user; }

  function updateProfile(userId, patch) {
    const users = getUsers();
    if (users[userId]) {
      users[userId] = { ...users[userId], ...patch, updated_at: new Date().toISOString() };
      saveUsers(users);
    }
  }

  function LS_SUBJECTS_KEY(userId) { return `${LS_SUBJECTS}_${userId}`; }
  function LS_SESSIONS_KEY(userId) { return `${LS_SESSIONS}_${userId}`; }
  function LS_ACH_KEY(userId) { return `${LS_ACHIEVEMENTS}_${userId}`; }

  function getSubjects(userId) { return readJSON(LS_SUBJECTS_KEY(userId), []); }

  function saveSubject(userId, subject) {
    const subjects = getSubjects(userId);
    const idx = subjects.findIndex((s) => s.id === subject.id);
    if (idx >= 0) {
      subjects[idx] = subject;
    } else {
      subjects.push({ ...subject, id: subject.id || uid(), created_at: new Date().toISOString() });
    }
    writeJSON(LS_SUBJECTS_KEY(userId), subjects);
  }

  function deleteSubject(userId, subjectId) {
    const subjects = getSubjects(userId);
    writeJSON(LS_SUBJECTS_KEY(userId), subjects.filter((s) => s.id !== subjectId));
  }

  async function getActiveEvent() {
    if (CLOUD_ENABLED && sb) {
      try {
        const { data } = await sb.rpc("get_active_event");
        return data?.[0] || null;
      } catch (e) {
        console.warn("getActiveEvent error:", e);
      }
    }
    return null;
  }

  async function isAdmin() {
    if (CLOUD_ENABLED && sb) {
      try {
        const { data } = await sb.rpc("is_admin");
        return data === true;
      } catch (e) {
        console.warn("isAdmin error:", e);
      }
    }
    return false;
  }

  async function getPublicProfiles() {
    if (CLOUD_ENABLED && sb) {
      try {
        const { data } = await sb.from("profiles").select("id,username,avatar_url,xp");
        return data || [];
      } catch (e) {
        console.warn("getPublicProfiles error:", e);
      }
    }
    return [];
  }

  async function getEvents() {
    if (CLOUD_ENABLED && sb) {
      try {
        const { data } = await sb.from("game_events").select("*");
        return data || [];
      } catch (e) {
        console.warn("getEvents error:", e);
      }
    }
    return [];
  }

  async function adminCreateEvent(input) {
    if (!CLOUD_ENABLED || !sb) return { error: "Cloud mode required" };
    try {
      const { data, error } = await sb.rpc("admin_create_event", {
        p_name: input.name,
        p_multiplier: input.multiplier,
        p_starts_at: input.starts_at,
        p_ends_at: input.ends_at,
      });
      return { data, error };
    } catch (e) {
      return { error: e.message };
    }
  }

  async function adminDeleteEvent(id) {
    if (!CLOUD_ENABLED || !sb) return { error: "Cloud mode required" };
    try {
      await sb.rpc("admin_delete_event", { p_event_id: id });
      return { success: true };
    } catch (e) {
      return { error: e.message };
    }
  }

  async function adminAdjustXp(userId, amount, reason) {
    if (!CLOUD_ENABLED || !sb) return { error: "Cloud mode required" };
    try {
      await sb.rpc("admin_adjust_xp", {
        p_user_id: userId,
        p_amount: amount,
        p_reason: reason,
      });
      return { success: true };
    } catch (e) {
      return { error: e.message };
    }
  }

  function getSessions(userId) { return readJSON(LS_SESSIONS_KEY(userId), []).slice().sort((a,b)=>(b.created_at||"").localeCompare(a.created_at||"")); }

  async function addSession(userId, input) {
    const user = getUsers()[userId];
    if (!user) return { error: "User not found" };

    // Calculate XP earned (1 minute = 1 XP, adjusted by active event multiplier)
    let multiplier = 1;
    const activeEvent = await getActiveEvent();
    if (activeEvent) {
      multiplier = Number(activeEvent.multiplier) || 1;
    }
    const xpEarned = Math.round(Math.max(0, input.minutes || 0) * multiplier);

    // Create session
    const session = {
      id: uid(),
      subject_id: input.subject_id || null,
      name: input.name || "Study session",
      studied_on: input.studied_on || todayKey(),
      minutes: Math.max(0, input.minutes || 0),
      xp_earned: xpEarned,
      notes: input.notes || null,
      created_at: new Date().toISOString(),
    };

    // Save session to localStorage
    const sessions = getSessions(userId);
    sessions.push(session);
    writeJSON(LS_SESSIONS_KEY(userId), sessions);

    // Update user XP
    const newXp = (user.xp || 0) + xpEarned;
    updateProfile(userId, { xp: newXp });

    // Check achievements
    const unlocked = checkAchievements(userId);

    // Update streak
    const today = todayKey();
    const lastStudyDate = user.last_study_date;
    let newStreak = user.current_streak || 0;
    let longestStreak = user.longest_streak || 0;

    if (lastStudyDate !== today) {
      const yesterday = addDays(today, -1);
      if (lastStudyDate === yesterday) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
      longestStreak = Math.max(newStreak, longestStreak);
      updateProfile(userId, {
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_study_date: today,
      });
    }

    if (CLOUD_ENABLED && sb) {
      try {
        await sb.from("study_sessions").insert([session]);
      } catch (e) {
        console.warn("Cloud session sync failed:", e);
      }
    }

    return { session, unlocked };
  }

  function deleteSession(userId, sessionId) {
    const sessions = getSessions(userId);
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      // Refund XP
      const user = getUsers()[userId];
      if (user) {
        updateProfile(userId, { xp: Math.max(0, (user.xp || 0) - session.xp_earned) });
      }
    }
    writeJSON(LS_SESSIONS_KEY(userId), sessions.filter((s) => s.id !== sessionId));

    if (CLOUD_ENABLED && sb) {
      try {
        sb.from("study_sessions").delete().eq("id", sessionId);
      } catch (e) {
        console.warn("Cloud session delete failed:", e);
      }
    }
  }

  function getUnlockedAchievements(userId){return readJSON(LS_ACH_KEY(userId),[]);}

  function checkAchievements(userId) {
    const sessions = getSessions(userId);
    const user = getUsers()[userId];
    const unlocked = getUnlockedAchievements(userId);
    const newUnlocks = [];

    const checks = {
      first_session: () => sessions.length === 1,
      ten_sessions: () => sessions.length >= 10,
      hour_studied: () => sumMinutes(sessions) >= 60,
      level_5: () => getLevelInfo(user.xp || 0).level >= 5,
      week_streak: () => (user.current_streak || 0) >= 7,
    };

    Object.keys(checks).forEach((code) => {
      if (!unlocked.find((a) => a.code === code) && checks[code]()) {
        const ach = ACHIEVEMENTS.find((a) => a.code === code);
        if (ach) {
          const achievement = { ...ach, unlocked_at: new Date().toISOString() };
          unlocked.push(achievement);
          newUnlocks.push(achievement);
        }
      }
    });

    if (newUnlocks.length > 0) {
      writeJSON(LS_ACH_KEY(userId), unlocked);
    }

    return newUnlocks;
  }

  function achievementsWithStatus(userId){
    const unlocked = getUnlockedAchievements(userId);
    return ACHIEVEMENTS.map((ach) => ({
      ...ach,
      unlocked_at: unlocked.find((u) => u.code === ach.code)?.unlocked_at || null,
    }));
  }

  async function getLeaderboard(period){
    if (CLOUD_ENABLED && sb) {
      try {
        const { data } = await sb.rpc("get_leaderboard", { p_period: period });
        return data || [];
      } catch (e) {
        console.warn("getLeaderboard error:", e);
      }
    }
    return [];
  }

  // Export
  SQ.init = init;
  SQ.signUp = signUp;
  SQ.signIn = signIn;
  SQ.signOut = signOut;
  SQ.getCurrentUser = getCurrentUser;
  SQ.requireAuth = requireAuth;
  SQ.updateProfile = updateProfile;
  SQ.getSubjects = getSubjects;
  SQ.saveSubject = saveSubject;
  SQ.deleteSubject = deleteSubject;
  SQ.getSessions = getSessions;
  SQ.addSession = addSession;
  SQ.deleteSession = deleteSession;
  SQ.getActiveEvent = getActiveEvent;
  SQ.isAdmin = isAdmin;
  SQ.getPublicProfiles = getPublicProfiles;
  SQ.getEvents = getEvents;
  SQ.adminCreateEvent = adminCreateEvent;
  SQ.adminDeleteEvent = adminDeleteEvent;
  SQ.adminAdjustXp = adminAdjustXp;
  SQ.getLeaderboard = getLeaderboard;
  SQ.getUnlockedAchievements = getUnlockedAchievements;
  SQ.checkAchievements = checkAchievements;
  SQ.achievementsWithStatus = achievementsWithStatus;
  SQ.getLevelInfo = getLevelInfo;
  SQ.formatMinutes = formatMinutes;
  SQ.formatHours = formatHours;
  SQ.formatStopwatch = formatStopwatch;
  SQ.dashboardTotals = dashboardTotals;
  SQ.minutesBySubject = minutesBySubject;
  SQ.buildHeatmap = buildHeatmap;
  SQ.heatLevel = heatLevel;
  SQ.lastDays = lastDays;
  SQ.todayKey = todayKey;
  SQ.startOfWeekKey = startOfWeekKey;
  SQ.startOfMonthKey = startOfMonthKey;
  SQ.addDays = addDays;
  SQ.SUBJECT_COLORS = SUBJECT_COLORS;
})();
