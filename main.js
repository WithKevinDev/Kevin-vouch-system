const grid = document.getElementById("grid");
const STORAGE_KEY = "kv_vouches";
let all = [];

function load() {
  try {
    all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    all = [];
  }
  all.sort((a,b) => b.created_at - a.created_at);
  render(all);
  updateStats(all);
}

function updateStats(list) {
  document.getElementById("total").textContent = list.length;
  document.getElementById("verified").textContent = list.filter(v => v.is_verified).length;
  const avg = list.length ? (list.reduce((s,v)=>s+v.rating,0)/list.length).toFixed(1) : "5.0";
  document.getElementById("avg").textContent = avg;
}

function timeAgo(ts) {
  const s = Math.floor(Date.now()/1000) - ts;
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s/60) + "m ago";
  if (s < 86400) return Math.floor(s/3600) + "h ago";
  if (s < 2592000) return Math.floor(s/86400) + "d ago";
  return Math.floor(s/2592000) + "mo ago";
}

function stars(n) {
  return "★".repeat(n) + "☆".repeat(5-n);
}

function render(list) {
  grid.innerHTML = "";
  if (!list.length) {
    grid.innerHTML = `<p style="color:var(--muted)">no vouches yet</p>`;
    return;
  }
  for (const v of list) {
    const el = document.createElement("div");
    el.className = "vouch";
    el.innerHTML = `
      <div class="vouch-head">
        <img src="${v.avatar}" alt="" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(v.username)}'"/>
        <div>
          <div class="vouch-name">${escapeHtml(v.username)} ${v.is_verified ? '<span class="vf">✔</span>' : ''}</div>
          <div class="vouch-time">${timeAgo(v.created_at)}</div>
        </div>
      </div>
      <div class="vouch-msg">${escapeHtml(v.message)}</div>
      <div class="vouch-stars">${stars(v.rating)}</div>
    `;
    grid.appendChild(el);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

document.getElementById("search").addEventListener("input", e => {
  const q = e.target.value.toLowerCase();
  render(all.filter(v => v.username.toLowerCase().includes(q) || v.message.toLowerCase().includes(q)));
});

document.getElementById("sort").addEventListener("change", e => {
  const v = e.target.value;
  let copy = [...all];
  if (v === "new") copy.sort((a,b)=>b.created_at-a.created_at);
  if (v === "old") copy.sort((a,b)=>a.created_at-b.created_at);
  if (v === "high") copy.sort((a,b)=>b.rating-a.rating);
  render(copy);
});

load();
