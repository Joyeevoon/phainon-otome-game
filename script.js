/* 夏日贴纸 · 人鱼泡澡 — 交互主逻辑 v3
 * 加载 → 首页 → 游戏；BGM 双轨（首页美人鱼 / 游戏内 last page）；语音单例；白色提示圈
 */
import { STICKERS, VIDEOS, BGM, HOME_VIDEO, LOADER_CHARACTER, FAVOR_PER_STICKER } from "./data.js";

/* ---------- 全局状态 ---------- */
const S = {
  phase: "HOME",          // HOME → LOADING → PLAY ⇄ SPEAKING → DONE
  current: 0,
  favor: 0,
  speechId: 0,
  placed: [],
  armed: false,
};

/* ---------- DOM ---------- */
const $ = (s) => document.querySelector(s);
const frame = $("#frame");
const vidHome = $("#vidHome");
const vidIdle = $("#vidIdle");
const vidSpeak = $("#vidSpeaking");
const dock = $("#dock");
const bubble = $("#bubble");
const ghost = $("#ghost");
const favorFill = $("#favorFill");
const favorPct = $("#favorPct");
const favorHeart = $("#favorHeart");
const finale = $("#finale");
const hint = $("#hint");
const homeOverlay = $("#homeOverlay");
const loader = $("#loader");
const loadBar = $("#loader .bar i");
const musicBtn = $("#musicBtn");
const homeBtn = $("#homeBtn");

/* ================= BGM（双轨 + 开关 + 默认自动播放） ================= */
const bgm = {
  el: new Audio(),
  track: null,            // "home" | "game"
  on: true,               // 默认自动播放
  set(track) {
    if (this.track === track && !this.el.paused) return;
    this.track = track;
    this.el.loop = true;
    this.el.src = BGM[track];
    this.el.volume = 0.5;
    if (this.on) this.play();
  },
  play() {
    if (!this.on) return;
    const p = this.el.play();
    if (p) p.catch(() => {});        // 自动播放被拒 → 等手势补播
  },
  duck(onDuck) {                     // 语音时压低，结束恢复
    this.el.volume = onDuck ? 0.12 : 0.5;
  },
  toggle() {
    this.on = !this.on;
    if (this.on) { this.play(); musicBtn.classList.add("on"); musicBtn.title = "音乐：开"; }
    else { this.el.pause(); musicBtn.classList.remove("on"); musicBtn.title = "音乐：关"; }
    return this.on;
  },
  unlock() {
    if (this.on && this.el.paused) this.play();
  },
};
musicBtn.addEventListener("click", (e) => { e.stopPropagation(); bgm.toggle(); });
homeBtn.addEventListener("click", (e) => { e.stopPropagation(); returnHome(); });
window.addEventListener("pointerdown", () => bgm.unlock(), { passive: true });

/* ================= FrameMap：帧百分比 → 舞台像素 ================= */
function videoMetrics() {
  const width = frame.clientWidth;
  const height = frame.clientHeight;
  const videoAspect = 9 / 16;
  const frameAspect = width / height;
  if (frameAspect > videoAspect) {
    const displayedHeight = width / videoAspect;
    return { width, height: displayedHeight, offsetX: 0, offsetY: (displayedHeight - height) / 2 };
  }
  const displayedWidth = height * videoAspect;
  return { width: displayedWidth, height, offsetX: (displayedWidth - width) / 2, offsetY: 0 };
}

function frameToStage(p) {
  const video = videoMetrics();
  return {
    x: (p.x / 100) * video.width - video.offsetX,
    y: (p.y / 100) * video.height - video.offsetY,
  };
}

/* ================= 目标圆圈（白色） ================= */
const targets = [];
function buildTargets() {
  STICKERS.forEach((st, i) => {
    const t = document.createElement("div");
    t.className = "target";
    t.dataset.idx = i;
    frame.appendChild(t);
    targets.push(t);
    t.addEventListener("click", (e) => onTargetClick(i, e));
  });
  layoutTargets();
  refreshTargets();
}
function layoutTargets() {
  targets.forEach((t, i) => {
    const p = frameToStage(STICKERS[i].target);
    t.style.left = `${p.x}px`;
    t.style.top = `${p.y}px`;
  });
  S.placed.forEach((el) => {
    const p = frameToStage(STICKERS[el.idx].target);
    el.style.left = `${p.x}px`;
    el.style.top = `${p.y}px`;
  });
}
function refreshTargets() {
  targets.forEach((t, i) => {
    t.classList.toggle("active", i === S.current && S.phase === "PLAY");
    t.classList.toggle("future", i > S.current);
    t.classList.toggle("done", i < S.current);
    t.classList.remove("armed");
  });
}
function armTarget(i, on) {
  const t = targets[i];
  if (t) t.classList.toggle("armed", on);
}
window.addEventListener("resize", layoutTargets);

/* ================= 底部贴纸栏 ================= */
function buildDock() {
  STICKERS.forEach((st, i) => {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.idx = i;
    const img = document.createElement("img");
    img.src = st.img; img.draggable = false;
    slot.appendChild(img);
    dock.appendChild(slot);
    slot.addEventListener("pointerdown", (e) => onSlotDown(i, e));
    slot.addEventListener("click", () => onSlotClick(i));
  });
  refreshDock();
}
function refreshDock() {
  dock.querySelectorAll(".slot").forEach((el, i) => {
    el.classList.toggle("current", i === S.current && S.phase === "PLAY");
    el.classList.toggle("used", i < S.current);
    el.classList.toggle("locked", i > S.current);
  });
}

/* ================= 拖拽 + 点击双模式（Pointer Events） ================= */
let drag = null;

function onSlotDown(i, e) {
  if (S.phase !== "PLAY" || i !== S.current) return;
  drag = { idx: i, startX: e.clientX, startY: e.clientY, moved: false };
  const st = STICKERS[i];
  ghost.innerHTML = "";
  const g = document.createElement("img");
  g.src = st.img;
  ghost.style.width = `${(st.size * videoMetrics().width) / 100}px`;
  ghost.appendChild(g);
  moveGhost(e.clientX, e.clientY);

  const onMove = (ev) => {
    if (!drag) return;
    if (!drag.moved && Math.hypot(ev.clientX - drag.startX, ev.clientY - drag.startY) > 8) {
      drag.moved = true;
      ghost.classList.add("on");
      armTarget(i, true);
    }
    if (drag.moved) {
      moveGhost(ev.clientX, ev.clientY);
      nearTarget(ev.clientX, ev.clientY);   // 吸附提示
    }
  };
  const onUp = (ev) => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    if (!drag) return;
    const wasMoved = drag.moved;
    drag = null;
    ghost.classList.remove("on");
    armTarget(i, false);
    if (wasMoved) {
      const hit = nearTarget(ev.clientX, ev.clientY, true);
      if (hit) commitSticker(i, ev);        // 拖拽提交
      else returnBack(i);                   // 放错：回弹不消耗
    }
    // 未拖动 → 交给后续 click 走点击放置
  };
  window.addEventListener("pointermove", onMove, { passive: false });
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
}

function moveGhost(x, y) {
  ghost.style.left = `${x}px`;
  ghost.style.top = `${y}px`;
}

function nearTarget(cx, cy, commit = false) {
  const t = targets[S.current];
  if (!t) return false;
  const r = t.getBoundingClientRect();
  const c = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  const dist = Math.hypot(cx - c.x, cy - c.y);
  const snap = Math.max(r.width * 2.2, 44);
  if (commit) return dist <= snap;
  t.classList.toggle("armed", dist <= snap);
  return dist <= snap;
}

function returnBack(i) {
  const slot = dock.querySelector(`.slot[data-idx="${i}"]`);
  if (slot) slot.animate(
    [{ transform: "translateX(0)" }, { transform: "translateX(-6px)" },
     { transform: "translateX(6px)" }, { transform: "translateX(0)" }],
    { duration: 260 });
}

/* ---------- 点击放置模式 ---------- */
function onSlotClick(i) {
  if (S.phase !== "PLAY" || i !== S.current) return;
  S.armed = true;
  hint.textContent = `点击人物身上的圆圈，把「${STICKERS[i].label}」贴上去 ♪`;
  armTarget(i, true);
}

function onTargetClick(i, e) {
  if (S.phase !== "PLAY" || i !== S.current) return;
  commitSticker(i, e);
}

/* ================= 提交贴纸（同一手势栈：先播音） ================= */
function commitSticker(i, evt) {
  const st = STICKERS[i];
  S.phase = "SPEAKING";
  S.current = i + 1;
  S.armed = false;

  // 1) 语音启动放在最前（移动端授权窗口内）
  const sid = ++S.speechId;
  speech.play(st.audio, sid, () => closeSpeech(sid));
  bgm.duck(true);                          // 语音时压低 BGM

  // 2) 后续 UI
  placeSticker(i);
  refreshTargets();
  addFavor();
  showBubble(st);
  // 切说话视频
  switchVideo(true);
  refreshDock();
  hint.textContent = "♪";
}

function placeSticker(i) {
  const st = STICKERS[i];
  const el = document.createElement("img");
  el.src = st.img;
  el.className = "sticker-placed";
  el.idx = i;
  el.style.width = `${(st.size / 100) * videoMetrics().width}px`;
  frame.appendChild(el);
  S.placed.push(el);
  layoutTargets();
}

/* ---------- 好感度 ---------- */
function addFavor() {
  S.favor = Math.min(100, S.favor + FAVOR_PER_STICKER);
  favorFill.style.height = `${S.favor}%`;
  favorPct.textContent = `${S.favor}%`;
  favorHeart.classList.remove("beat");
  void favorHeart.offsetWidth;
  favorHeart.classList.add("beat");
  spawnHearts();
}

function spawnHearts() {
  for (let k = 0; k < 6; k++) {
    const h = document.createElement("span");
    h.className = "heart-p";
    h.textContent = Math.random() < 0.7 ? "💗" : "✨";
    h.style.left = `${75 + Math.random() * 15}%`;
    h.style.top = `${38 + Math.random() * 10}%`;
    h.style.animationDelay = `${k * 0.08}s`;
    frame.appendChild(h);
    setTimeout(() => h.remove(), 1400);
  }
}

function showBubble(st) {
  bubble.innerHTML = `<div class="line">${st.line}</div><div class="sub">${st.sub}</div>`;
  bubble.classList.add("show");
}

/* ================= 语音（单例 + ended 唯一时钟 + speechId） ================= */
const speech = (() => {
  const el = new Audio();
  el.preload = "auto";
  let fallbackTimer = null;
  let curSid = -1;
  let started = false;

  function stopCurrent() {
    clearTimeout(fallbackTimer);
    started = false;
    el.pause();
    try { el.currentTime = 0; } catch (_) {}
  }
  function kick() {
    if (started && el.paused && curSid >= 0) el.play().catch(() => {});
  }
  function play(src, sid, onEnd) {
    stopCurrent();
    curSid = sid;
    el.src = src;
    const p = el.play();
    started = true;
    if (p) p.catch(() => setTimeout(() => { if (curSid === sid) el.play().catch(() => {}); }, 120));
    const dur = () => (isFinite(el.duration) && el.duration > 0 ? el.duration * 1000 + 400 : 9000);
    const arm = () => { fallbackTimer = setTimeout(() => { if (curSid === sid) onEnd(); }, dur()); };
    el.onloadedmetadata = arm;
    if (el.readyState >= 1) arm();
    el.onended = () => { if (curSid === sid) { clearTimeout(fallbackTimer); onEnd(); } };
  }
  return { play, stopCurrent, kick };
})();

/* ---------- 语音结束：收尾回 IDLE ---------- */
function closeSpeech(sid) {
  if (sid !== S.speechId) return;
  bubble.classList.remove("show");
  switchVideo(false);
  bgm.duck(false);
  if (S.current >= STICKERS.length) {
    S.phase = "DONE";
    finale.classList.add("show");
  } else {
    S.phase = "PLAY";
    refreshTargets();
    refreshDock();
    hint.textContent = `把「${STICKERS[S.current].label}」拖到圆圈上 ♪（或点击贴纸再点圆圈）`;
  }
}

/* ================= 视频（三态：首页/待机/说话，互斥） ================= */
vidSpeak.loop = true;
function switchVideo(toSpeaking) {
  if (toSpeaking) {
    const play = () => {
      vidIdle.pause();
      vidSpeak.currentTime = 0;
      vidSpeak.style.opacity = "1";
      const p = vidSpeak.play();
      if (p) p.catch(() => {});
    };
    // 手机上视频未加载完就切，会切成空白：先加载，能播了再切
    if (vidSpeak.readyState >= 3) { play(); return; }
    if (vidSpeak.readyState === 0 && !vidSpeak.error) {
      vidSpeak.preload = "auto";
      vidSpeak.load();
    }
    const onReady = () => {
      vidSpeak.removeEventListener("canplay", onReady);
      vidSpeak.removeEventListener("error", onReady);
      if (S.phase === "SPEAKING") play();   // 语音已结束则不再切回说话画面
    };
    vidSpeak.addEventListener("canplay", onReady);
    vidSpeak.addEventListener("error", onReady);
  } else {
    vidSpeak.pause();
    vidSpeak.style.opacity = "0";
    vidIdle.play().catch(() => {});
  }
}

function playHomeVideo() {
  if (S.phase !== "HOME") return;
  if (!vidHome.getAttribute("src")) vidHome.src = HOME_VIDEO;
  vidHome.loop = true;
  vidHome.muted = true;
  vidHome.playsInline = true;
  vidHome.setAttribute("muted", "");
  vidHome.setAttribute("playsinline", "");
  const attempt = () => {
    if (S.phase !== "HOME") return;
    const p = vidHome.play();
    if (p) p.catch(() => {});
  };
  attempt();
  if (vidHome.readyState < 2) {
    vidHome.addEventListener("loadeddata", attempt, { once: true });
    vidHome.addEventListener("canplay", attempt, { once: true });
  }
}

/* ---------- 手势解锁兜底 ---------- */
const unlock = () => {
  bgm.unlock();
  if (S.phase === "HOME") { playHomeVideo(); return; }
  if (S.phase === "SPEAKING") {
    if (vidSpeak.paused) vidSpeak.play().catch(() => {});
    speech.kick();
  } else if (vidIdle.paused && S.phase === "PLAY") {
    vidIdle.play().catch(() => {});
  }
};
window.addEventListener("pointerdown", unlock, { passive: true });

/* ================= 流程：加载页 → 首页 → 游戏 ================= */
function boot() {
  // 加载页先出现，等首页视频攒够一小段缓冲再进首页（最多等 6 秒，避免网络差时又卡在加载页）
  loader.classList.remove("dormant");
  loader.classList.remove("hide");
  loader.classList.add("show");
  startHome();
}

function startHome() {
  S.phase = "HOME";
  homeBtn.hidden = true;
  playHomeVideo();
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    vidHome.removeEventListener("progress", check);
    vidHome.removeEventListener("canplaythrough", check);
    loader.classList.add("hide");
    homeOverlay.classList.remove("hide");
    bgm.set("home");
  };
  const enough = () => {
    const b = vidHome.buffered;
    return vidHome.readyState >= 3 && b.length > 0 && b.end(b.length - 1) >= 2.5;
  };
  const check = () => { if (enough()) finish(); };
  vidHome.addEventListener("progress", check);
  vidHome.addEventListener("canplaythrough", check);
  check();
  setTimeout(finish, 6000);   // 兑底：最多等 6 秒
  homeOverlay.onclick = enterGame;
}

function returnHome() {
  speech.stopCurrent();
  S.speechId += 1;
  bubble.classList.remove("show");
  finale.classList.remove("show");
  bgm.set("home");
  vidIdle.pause();
  vidSpeak.pause();
  vidHome.currentTime = 0;
  S.phase = "HOME";
  S.current = 0;
  S.favor = 0;
  S.armed = false;
  S.placed.forEach((el) => el.remove());
  S.placed = [];
  favorFill.style.height = "0%";
  favorPct.textContent = "0%";
  refreshTargets();
  refreshDock();
  startHome();
}

function enterGame() {
  homeOverlay.classList.add("hide");
  vidHome.pause();
  S.phase = "PLAY";
  bgm.set("game");
  startGame();
}

function startGame() {
  S.phase = "PLAY";
  homeBtn.hidden = false;
  loader.classList.add("hide");          // 先启动再淡出
  // 如果首页阶段预载还没启动，这里开始（真实播放器，单次下载）
  if (vidIdle.preload !== "auto") { vidIdle.preload = "auto"; vidIdle.load(); }
  vidIdle.loop = true;
  vidIdle.muted = true;
  vidIdle.playsInline = true;
  vidIdle.play().catch(() => {});
  refreshTargets();
  refreshDock();
  hint.textContent = `把「${STICKERS[0].label}」拖到圆圈上 ♪（或点击贴纸再点圆圈）`;
}

/* ---------- 启动 ---------- */
buildDock();
buildTargets();
boot();   // 加载页 → 首页 → 游戏
