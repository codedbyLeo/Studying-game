(async function () {
  const user = await sqInitShell("profile");
  if (!user) return;

  if (window.matchMedia("(min-width: 1024px)").matches) document.getElementById("profile-grid").style.gridTemplateColumns = "1fr 2fr";

  const sessions = SQ.getSessions(user.id), totals = SQ.dashboardTotals(sessions), level = SQ.getLevelInfo(user.xp || 0);
  document.getElementById("p-level-title").textContent = `Level ${level.level} scholar`;
  document.getElementById("p-bio").textContent = user.bio || "";
  document.getElementById("p-bio").style.display = user.bio ? "block" : "none";
  document.getElementById("p-progress-text").textContent = `${level.xpIntoLevel}/${level.xpForThisLevel} XP toward level ${level.level + 1}`;
  document.getElementById("p-stat-grid").innerHTML = `${statCard("Total XP", String(user.xp || 0))}${statCard("Hours", `${SQ.formatHours(totals.total)}h`)}${statCard("Streak", `${user.current_streak || 0}d`, "sticky")}${statCard("Best streak", `${user.longest_streak || 0}d`, "sticky")}`;
  function statCard(label,value,tone){const cls=tone==="sticky"?"sticky-note rotate-neg1 stat-card":"notebook-card stat-card";return `<div class="${cls}"><p class="label">${label}</p><p class="value" style="font-size:1.2rem;">${value}</p></div>`;}

  const achievements = SQ.achievementsWithStatus(user.id), unlocked = achievements.filter(a => a.unlocked_at);
  const achGrid = document.getElementById("ach-grid");
  const renderAchievements = (showAll=false) => {
    const visible = showAll ? achievements : unlocked.slice(0,4);
    achGrid.innerHTML = visible.length ? visible.map(a => `<div class="ach-item ${a.unlocked_at ? "unlocked":"locked"}"><span class="ach-icon"><i data-lucide="${a.icon}"></i></span><div style="min-width:0;"><p style="font-weight:800;">${sqEscape(a.title)}</p><p class="muted" style="font-size:.72rem;">${sqEscape(a.description)}</p><p class="mt-1" style="font-size:.62rem;font-weight:900;text-transform:uppercase;letter-spacing:.04em;opacity:.75;">${sqEscape(a.rarity || "common")}</p><p class="text-primary mt-1" style="font-size:.72rem;font-weight:700;">${a.unlocked_at ? `Unlocked · +${a.xp_reward} XP`:`Locked · +${a.xp_reward} XP`}</p></div></div>`).join("") : `<p class="muted" style="font-size:.9rem;">No badges yet. Your first study session unlocks one!</p>`;
    let btn=document.getElementById("show-all-badges");
    if(!btn){btn=document.createElement("button");btn.id="show-all-badges";btn.className="btn btn-ghost btn-block mt-3";achGrid.parentElement.appendChild(btn);}
    btn.style.display=achievements.length>4?"block":"none"; btn.textContent=showAll?"Show fewer badges":"Show all badges"; btn.onclick=()=>renderAchievements(!showAll); sqIcons();
  };
  renderAchievements(false);

  const usernameInput=document.getElementById("pf-username"), bioInput=document.getElementById("pf-bio"), fileInput=document.getElementById("pf-avatar-file"), preview=document.getElementById("pf-avatar-preview");
  usernameInput.value=user.username; bioInput.value=user.bio||"";
  let avatarData=user.avatar_url||null;
  const setPreview=()=>{preview.innerHTML=avatarData?`<img src="${sqEscape(avatarData)}" alt="">`:sqInitials(user.username);}; setPreview();

  const modal=document.getElementById("avatar-crop-modal"), canvas=document.getElementById("crop-canvas"), ctx=canvas.getContext("2d"), zoom=document.getElementById("crop-zoom");
  let img=null, scale=1, offsetX=0, offsetY=0, dragging=false, startX=0, startY=0;
  function draw(){ if(!img)return; ctx.clearRect(0,0,canvas.width,canvas.height); ctx.save(); ctx.beginPath();ctx.arc(180,180,180,0,Math.PI*2);ctx.clip(); const base=Math.max(360/img.width,360/img.height)*scale; const w=img.width*base,h=img.height*base; ctx.drawImage(img,(360-w)/2+offsetX,(360-h)/2+offsetY,w,h);ctx.restore(); }
  document.getElementById("pf-avatar-btn").onclick=()=>fileInput.click();
  fileInput.onchange=()=>{const f=fileInput.files?.[0];if(!f)return;if(!f.type.startsWith("image/"))return sqToast("Please choose an image file.","error");const reader=new FileReader();reader.onload=()=>{img=new Image();img.onload=()=>{scale=1;offsetX=0;offsetY=0;zoom.value="1";draw();modal.classList.add("open");};img.src=reader.result;};reader.readAsDataURL(f);fileInput.value="";};
  zoom.oninput=()=>{scale=Number(zoom.value);draw();};
  canvas.onpointerdown=e=>{dragging=true;canvas.setPointerCapture(e.pointerId);startX=e.clientX-offsetX;startY=e.clientY-offsetY;};
  canvas.onpointermove=e=>{if(!dragging)return;offsetX=e.clientX-startX;offsetY=e.clientY-startY;draw();};
  canvas.onpointerup=canvas.onpointercancel=()=>dragging=false;
  document.getElementById("crop-cancel").onclick=()=>modal.classList.remove("open");
  document.getElementById("crop-save").onclick=()=>{const out=document.createElement("canvas"),o=out.getContext("2d");out.width=512;out.height=512;o.beginPath();o.arc(256,256,256,0,Math.PI*2);o.clip();const base=Math.max(512/img.width,512/img.height)*scale,w=img.width*base,h=img.height*base;o.drawImage(img,(512-w)/2+offsetX*(512/360),(512-h)/2+offsetY*(512/360),w,h);avatarData=out.toDataURL("image/jpeg",.86);setPreview();modal.classList.remove("open");sqToast("Photo ready — save your profile.","success");};

  document.getElementById("profile-form").addEventListener("submit",e=>{e.preventDefault();const username=usernameInput.value.trim(),bio=bioInput.value.trim();if(username.length<2||username.length>24)return sqToast("Username must be 2–24 characters.","error");if(bio.length>300)return sqToast("Bio must be under 300 characters.","error");SQ.updateProfile(user.id,{username,avatar_url:avatarData,bio:bio||null});sqToast("Profile updated","success");setTimeout(()=>window.location.reload(),500);});
  sqIcons();
})();
