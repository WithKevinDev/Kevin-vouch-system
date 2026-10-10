const grid = document.getElementById("grid");
const STORAGE_KEY = "kv_vouches";
let all = [];

/* ---------- STORAGE ---------- */
function getVouches() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveVouches(v) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
}

/* ---------- LOAD ---------- */
function load() {
  all = getVouches().sort((a, b) => b.created_at - a.created_at);
  render(all);
  updateStats(all);
}

/* ---------- STATS ---------- */
function updateStats(list) {
  animateNumber("total", list.length);
  animateNumber("verified", list.filter(v => v.is_verified).length);
  const avg = list.length
    ? (list.reduce((s, v) => s + v.rating, 0) / list.length).toFixed(1)
    : "5.0";
  document.getElementById("avg").textContent = avg;
}

function animateNumber(id, target) {
  const el = document.getElementById(id);
  const start = parseInt(el.textContent) || 0;
  const duration = 700;
  const t0 = performance.now();
  function step(now) {
    const p = Math.min((now - t0) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(start + (target - start) * eased);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ---------- TIME ---------- */
function timeAgo(ts) {
  const s = Math.floor(Date.now() / 1000) - ts;
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  if (s < 2592000) return Math.floor(s / 86400) + "d ago";
  return Math.floor(s / 2592000) + "mo ago";
}

function stars(n) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---------- RENDER ---------- */
function render(list) {
  grid.innerHTML = "";
  if (!list.length) {
    grid.innerHTML = `
      <div class="empty">
        <div class="big">🔥</div>
        <p>no vouches yet — be the first!</p>
      </div>`;
    return;
  }
  list.forEach((v, i) => {
    const el = document.createElement("div");
    el.className = "vouch";
    el.style.animationDelay = Math.min(i * 30, 600) + "ms";
    el.innerHTML = `
      <div class="vouch-head">
        <img src="${v.avatar}" alt="" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(v.username)}'"/>
        <div>
          <div class="vouch-name">
            ${escapeHtml(v.username)}
            ${v.is_verified ? '<span class="vf">✔</span>' : ''}
          </div>
          <div class="vouch-time">${timeAgo(v.created_at)}</div>
        </div>
      </div>
      <div class="vouch-msg">${escapeHtml(v.message)}</div>
      <div class="vouch-stars">${stars(v.rating)}</div>
    `;
    grid.appendChild(el);
  });
}

/* ---------- ADD VOUCH ---------- */
document.getElementById("addForm").addEventListener("submit", e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const username = fd.get("username").trim();
  const message  = fd.get("message").trim();
  const rating   = parseInt(fd.get("rating"));
  if (!username || !message) return;

  const list = getVouches();
  list.push({
    id: crypto.randomUUID(),
    username,
    message,
    rating,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username + Math.random())}`,
    created_at: Math.floor(Date.now() / 1000),
    is_verified: false
  });
  saveVouches(list);

  e.target.reset();
  const status = document.getElementById("addStatus");
  status.textContent = "✅ vouch posted, thanks!";
  setTimeout(() => status.textContent = "", 3000);

  load();
  document.getElementById("list").scrollIntoView({ behavior: "smooth" });
});

/* ---------- SEARCH + SORT ---------- */
document.getElementById("search").addEventListener("input", e => {
  const q = e.target.value.toLowerCase();
  render(all.filter(v =>
    v.username.toLowerCase().includes(q) ||
    v.message.toLowerCase().includes(q)
  ));
});

document.getElementById("sort").addEventListener("change", e => {
  const v = e.target.value;
  let copy = [...all];
  if (v === "new") copy.sort((a, b) => b.created_at - a.created_at);
  if (v === "old") copy.sort((a, b) => a.created_at - b.created_at);
  if (v === "high") copy.sort((a, b) => b.rating - a.rating);
  render(copy);
});

/* ---------- CROSS-TAB SYNC ---------- */
window.addEventListener("storage", e => {
  if (e.key === STORAGE_KEY) load();
});

/* ---------- EXPOSE FOR ADMIN ---------- */
window.KV = { getVouches, saveVouches, load };

load();
