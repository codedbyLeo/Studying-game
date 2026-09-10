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
  const LS_DEMO = "sq_demo_leaderboard";  // seeded fake rivals for the leaderboard

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
    { code: "first_session", title: "First Study Session", description: "You opened the notebook and started your quest.", icon: "book-open", xp_reward: 50, rarity: "common" },
    { code: "streak_3", title: "3 Day Streak", description: "Studied three days in a row.", icon: "flame", xp_reward: 100, rarity: "common" },
    { code: "streak_7", title: "7 Day Study Streak", description: "A full week of consistency!", icon: "flame", xp_reward: 200, rarity: "uncommon" },
    { code: "streak_30", title: "30 Day Streak", description: "A whole month without missing a day.", icon: "trophy", xp_reward: 1000, rarity: "legendary" },
    { code: "hours_10", title: "10 Hours Studied", description: "Ten hours of focus banked.", icon: "clock", xp_reward: 150, rarity: "uncommon" },
    { code: "hours_50", title: "50 Hours Studied", description: "Half a hundred hours of study.", icon: "star", xp_reward: 500, rarity: "rare" },
    { code: "hours_100", title: "100 Hours Studied", description: "Century club of studying.", icon: "award", xp_reward: 1000, rarity: "legendary" },
    { code: "sessions_25", title: "25 Sessions", description: "Twenty-five study sessions logged.", icon: "notebook-pen", xp_reward: 250, rarity: "rare" },
    { code: "subjects_3", title: "Well Rounded", description: "Created three different subjects.", icon: "library", xp_reward: 100, rarity: "common" },
    { code: "marathon", title: "Marathon Session", description: "A single session of 120 minutes or more.", icon: "rocket", xp_reward: 300, rarity: "epic" },
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

  /* ---------------- cloud + accounts ---------------- */
  const CONFIG = window.STUDYQUEST_CONFIG || {};
  const CLOUD_ENABLED = !!(window.supabase && CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY &&
    !CONFIG.SUPABASE_URL.includes("YOUR-PROJECT") && !CONFIG.SUPABASE_ANON_KEY.includes("YOUR_SUPABASE"));
  const sb = CLOUD_ENABLED ? window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  }) : null;

  function getUsers() { return readJSON(LS_USERS, {}); }
  function saveUsers(users) { writeJSON(LS_USERS, users); }
  function findUserByEmail(email) {
    const users = getUsers();
    return Object.values(users).find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }
  function hashPassword(password) {
    let h = 0;
    for (let i = 0; i < password.length; i++) { h = (h << 5) - h + password.charCodeAt(i); h |= 0; }
    return "h" + h.toString(36) + "_" + password.length;
  }
  function setSession(userId) { localStorage.setItem(LS_SESSION, userId); }
  function signOutLocal() { localStorage.removeItem(LS_SESSION); }

  async function init() {
    if (!CLOUD_ENABLED) return getCurrentUser();
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.user) { signOutLocal(); return null; }
    const uid = session.user.id;
    const { data: profile } = await sb.from("profiles").select("*").eq("id", uid).maybeSingle();
    if (!profile) {
      const fallback = { id: uid, username: session.user.user_metadata?.username || session.user.email?.split("@")[0] || "student", email: session.user.email || "", password_hash: "", avatar_url: null, bio: null, xp: 0, current_streak: 0, longest_streak: 0, last_study_date: null, created_at: new Date().toISOString() };
      await sb.from("profiles").upsert(fallback);
      saveUsers({ ...getUsers(), [uid]: fallback });
    } else saveUsers({ ...getUsers(), [uid]: profile });
    setSession(uid);

    const [subjects, sessions, achievements] = await Promise.all([
      sb.from("subjects").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
      sb.from("study_sessions").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
      sb.from("user_achievements").select("*").eq("user_id", uid).order("unlocked_at", { ascending: true })
    ]);
    writeJSON(LS_SUBJECTS_KEY(uid), subjects.data || []);
    writeJSON(LS_SESSIONS_KEY(uid), sessions.data || []);
    writeJSON(LS_ACH_KEY(uid), (achievements.data || []).map(a => ({ code: a.code, unlocked_at: a.unlocked_at })));
    return getCurrentUser();
  }

  async function signUp({ username, email, password }) {
    if (!CLOUD_ENABLED) {
      if (findUserByEmail(email)) return { error: "An account with that email already exists." };
      const users = getUsers(), id = uid();
      const user = { id, username, email, password_hash: hashPassword(password), avatar_url: null, bio: null, xp: 0, current_streak: 0, longest_streak: 0, last_study_date: null, created_at: new Date().toISOString() };
      users[id] = user; saveUsers(users); writeJSON(LS_SUBJECTS_KEY(id), []); writeJSON(LS_SESSIONS_KEY(id), []); writeJSON(LS_ACH_KEY(id), []); setSession(id);
      return { user };
    }
    const { data, error } = await sb.auth.signUp({ email, password, options: { data: { username } } });
    if (error) return { error: error.message };
    if (!data.user) return { error: "Could not create the account." };
    const id = data.user.id;
    const user = { id, username, email, password_hash: "", avatar_url: null, bio: null, xp: 0, current_streak: 0, longest_streak: 0, last_study_date: null, created_at: new Date().toISOString() };
    const { error: profileError } = await sb.from("profiles").upsert(user);
    if (profileError) return { error: profileError.message };
    saveUsers({ ...getUsers(), [id]: user });
    writeJSON(LS_SUBJECTS_KEY(id), []); writeJSON(LS_SESSIONS_KEY(id), []); writeJSON(LS_ACH_KEY(id), []);
    if (data.session) setSession(id);
    return { user, needsConfirmation: !data.session };
  }

  async function signIn({ email, password }) {
    if (!CLOUD_ENABLED) {
      const user = findUserByEmail(email);
      if (!user || user.password_hash !== hashPassword(password)) return { error: "Incorrect email or password." };
      setSession(user.id); return { user };
    }
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    await init();
    return { user: getCurrentUser() };
  }

  async function signOut() { if (CLOUD_ENABLED) await sb.auth.signOut(); signOutLocal(); }
  function getCurrentUser() { const id = localStorage.getItem(LS_SESSION); return id ? getUsers()[id] || null : null; }
  function requireAuth() { const user = getCurrentUser(); if (!user) { window.location.href = "auth.html"; return null; } return user; }

  function updateProfile(userId, patch) {
    const users = getUsers(); if (!users[userId]) return null;
    users[userId] = { ...users[userId], ...patch, updated_at: new Date().toISOString() }; saveUsers(users);
    if (CLOUD_ENABLED) sb.from("profiles").update(patch).eq("id", userId).then(({ error }) => { if (error) console.error(error); });
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
    if (subject.id) { const idx = subjects.findIndex(s => s.id === subject.id); if (idx >= 0) subjects[idx] = { ...subjects[idx], ...subject }; }
    else subjects.unshift({ id: uid(), user_id: userId, name: subject.name, color: subject.color, weekly_goal_hours: subject.weekly_goal_hours, created_at: new Date().toISOString() });
    writeJSON(LS_SUBJECTS_KEY(userId), subjects); checkAchievements(userId);
    const saved = subjects.find(s => s.id === (subject.id || subjects[0].id));
    if (CLOUD_ENABLED && saved) sb.from("subjects").upsert(saved).then(({ error }) => { if (error) console.error(error); });
    return subjects;
  }
  function deleteSubject(userId, subjectId) {
    const subjects = getSubjects(userId).filter(s => s.id !== subjectId); writeJSON(LS_SUBJECTS_KEY(userId), subjects);
    const sessions = getSessions(userId).map(s => s.subject_id === subjectId ? { ...s, subject_id: null } : s); writeJSON(LS_SESSIONS_KEY(userId), sessions);
    if (CLOUD_ENABLED) { sb.from("subjects").delete().eq("id", subjectId).eq("user_id", userId); sb.from("study_sessions").update({ subject_id: null }).eq("subject_id", subjectId).eq("user_id", userId); }
    return subjects;
  }

  /* ---------------- live XP events ---------------- */
  async function getActiveEvent() {
    if (!CLOUD_ENABLED) return null;
    const { data, error } = await sb.rpc("get_active_event");
    if (error) { console.error(error); return null; }
    return data?.[0] || null;
  }

  async function isAdmin() {
    if (!CLOUD_ENABLED) return false;
    const { data, error } = await sb.rpc("is_admin");
    return !error && data === true;
  }

  async function getPublicProfiles() {
    if (!CLOUD_ENABLED) return Object.values(getUsers()).map(u=>({id:u.id,username:u.username,xp:u.xp||0,avatar_url:u.avatar_url}));
    const { data, error } = await sb.from("profiles").select("id,username,xp,avatar_url").order("xp", {ascending:false});
    if (error) { console.error(error); return []; }
    return data || [];
  }

  async function getEvents() {
    if (!CLOUD_ENABLED) return [];
    const { data, error } = await sb.from("game_events").select("*").order("starts_at", { ascending: false });
    if (error) { console.error(error); return []; }
    return data || [];
  }

  async function adminCreateEvent(input) {
    if (!CLOUD_ENABLED) return { error: "Cloud mode is required." };
    const { data, error } = await sb.rpc("admin_create_event", {
      p_name: input.name, p_multiplier: Number(input.multiplier), p_starts_at: input.starts_at, p_ends_at: input.ends_at
    });
    return error ? { error: error.message } : { event: data?.[0] || null };
  }

  async function adminDeleteEvent(id) {
    if (!CLOUD_ENABLED) return { error: "Cloud mode is required." };
    const { error } = await sb.rpc("admin_delete_event", { p_event_id: id });
    return error ? { error: error.message } : { ok: true };
  }

  async function adminAdjustXp(userId, amount, reason) {
    if (!CLOUD_ENABLED) return { error: "Cloud mode is required." };
    const { data, error } = await sb.rpc("admin_adjust_xp", { p_user_id: userId, p_amount: Number(amount), p_reason: reason || "Admin game effect" });
    return error ? { error: error.message } : { user: data?.[0] || null };
  }

  /* ---------------- sessions ---------------- */
  function getSessions(userId) { return readJSON(LS_SESSIONS_KEY(userId), []).slice().sort((a,b)=>(b.created_at||"").localeCompare(a.created_at||"")); }
  async function addSession(userId, input) {
    const users=getUsers(), user=users[userId]; if(!user) return {error:"Not signed in."};
    const minutes=Math.max(0,Math.round(input.minutes));
    const activeEvent = await getActiveEvent();
    const multiplier = Number(activeEvent?.multiplier || 1);
    const xpEarned = Math.round(minutes * XP_PER_MINUTE * multiplier);
    const session={id:uid(),user_id:userId,subject_id:input.subject_id||null,name:input.name||"Study session",studied_on:input.studied_on||todayKey(),minutes,xp_earned:xpEarned,notes:input.notes||null,created_at:new Date().toISOString()};
    const sessions=getSessions(userId); sessions.unshift(session); writeJSON(LS_SESSIONS_KEY(userId),sessions);
    let streak=user.current_streak||0,lastDay=user.last_study_date;
    if(!lastDay) streak=1; else if(session.studied_on===lastDay) streak=Math.max(streak,1); else if(session.studied_on===addDays(lastDay,1)) streak+=1; else if(session.studied_on>lastDay) streak=1;
    const newLastDay=!lastDay||session.studied_on>lastDay?session.studied_on:lastDay;
    updateProfile(userId,{xp:(user.xp||0)+xpEarned,current_streak:streak,longest_streak:Math.max(user.longest_streak||0,streak),last_study_date:newLastDay});
    if(CLOUD_ENABLED) sb.from("study_sessions").insert(session).then(({error})=>{if(error)console.error(error);});
    const unlocked=checkAchievements(userId); return {session,unlocked};
  }
  function deleteSession(userId, sessionId) {
    const sessions=getSessions(userId),target=sessions.find(s=>s.id===sessionId),remaining=sessions.filter(s=>s.id!==sessionId); writeJSON(LS_SESSIONS_KEY(userId),remaining);
    if(target){const user=getUsers()[userId]; if(user) updateProfile(userId,{xp:Math.max(0,(user.xp||0)-target.xp_earned)});}
    if(CLOUD_ENABLED) sb.from("study_sessions").delete().eq("id",sessionId).eq("user_id",userId);
    return remaining;
  }

  /* ---------------- achievements ---------------- */
  function getUnlockedAchievements(userId){return readJSON(LS_ACH_KEY(userId),[]);}
  function checkAchievements(userId){
    const users=getUsers(),user=users[userId];if(!user)return[];const sessions=getSessions(userId),subjects=getSubjects(userId),totalMinutes=sumMinutes(sessions),sessionCount=sessions.length,maxMinutes=sessions.reduce((m,s)=>Math.max(m,s.minutes),0),subjectCount=subjects.length,streak=user.current_streak||0;
    const earned=[];if(sessionCount>=1)earned.push("first_session");if(streak>=3)earned.push("streak_3");if(streak>=7)earned.push("streak_7");if(streak>=30)earned.push("streak_30");if(totalMinutes>=600)earned.push("hours_10");if(totalMinutes>=3000)earned.push("hours_50");if(totalMinutes>=6000)earned.push("hours_100");if(sessionCount>=25)earned.push("sessions_25");if(subjectCount>=3)earned.push("subjects_3");if(maxMinutes>=120)earned.push("marathon");
    const already=getUnlockedAchievements(userId),alreadyCodes=new Set(already.map(a=>a.code)),newlyUnlocked=earned.filter(c=>!alreadyCodes.has(c));
    if(newlyUnlocked.length){const now=new Date().toISOString(),updated=already.concat(newlyUnlocked.map(code=>({code,unlocked_at:now})));writeJSON(LS_ACH_KEY(userId),updated);const bonusXp=newlyUnlocked.reduce((sum,code)=>sum+(ACHIEVEMENTS.find(a=>a.code===code)?.xp_reward||0),0);const fresh=getUsers()[userId];updateProfile(userId,{xp:(fresh.xp||0)+bonusXp});if(CLOUD_ENABLED)sb.from("user_achievements").upsert(newlyUnlocked.map(code=>({user_id:userId,code,unlocked_at:now})),{onConflict:"user_id,code"});}
    return newlyUnlocked.map(c=>ACHIEVEMENTS.find(a=>a.code===c)).filter(Boolean);
  }
  function achievementsWithStatus(userId){
    const unlocked=getUnlockedAchievements(userId),map=new Map(unlocked.map(a=>[a.code,a.unlocked_at]));
    const rarity={legendary:5,epic:4,rare:3,uncommon:2,common:1};
    return ACHIEVEMENTS.map(a=>({...a,unlocked_at:map.get(a.code)||null}))
      .sort((a,b)=>(Number(!!b.unlocked_at)-Number(!!a.unlocked_at)) || ((rarity[b.rarity]||1)-(rarity[a.rarity]||1)) || a.title.localeCompare(b.title));
  }

  /* ---------------- leaderboard ---------------- */
  async function getLeaderboard(period){
    if (CLOUD_ENABLED) {
      const { data, error } = await sb.rpc("get_leaderboard", { p_period: period });
      if (!error && data) return data.slice(0, 100).map(r => ({ user_id:r.user_id, username:r.username, avatar_url:r.avatar_url, xp:Number(r.xp)||0, minutes:Number(r.minutes)||0 }));
      console.error(error);
    }
    const users=getUsers(); const rows=Object.values(users).map(user=>{
      const sessions=getSessions(user.id),fromKey=period==="week"?startOfWeekKey():period==="month"?startOfMonthKey():"1970-01-01";
      const filtered=sessions.filter(s=>s.studied_on>=fromKey),minutes=filtered.reduce((sum,s)=>sum+s.minutes,0),xp=filtered.reduce((sum,s)=>sum+s.xp_earned,0);
      return {user_id:user.id,username:user.username,avatar_url:user.avatar_url,xp,minutes};
    });
    rows.sort((a,b)=>b.xp-a.xp||b.minutes-a.minutes||a.username.localeCompare(b.username)); return rows.slice(0,100);
  }

  return {
    XP_PER_MINUTE, xpForLevel, getLevelInfo, formatMinutes, formatHours, formatStopwatch,
    toDateKey, todayKey, startOfWeekKey, startOfMonthKey, SUBJECT_COLORS, ACHIEVEMENTS,
    sumMinutes, minutesSince, dashboardTotals, minutesBySubject, buildHeatmap, heatLevel, lastDays,
    init, signUp, signIn, signOut, getCurrentUser, requireAuth, updateProfile,
    getSubjects, saveSubject, deleteSubject, getSessions, addSession, deleteSession,
    getUnlockedAchievements, achievementsWithStatus, checkAchievements, getLeaderboard, getActiveEvent, getEvents, isAdmin, getPublicProfiles, adminCreateEvent, adminDeleteEvent, adminAdjustXp,
  };
})();
