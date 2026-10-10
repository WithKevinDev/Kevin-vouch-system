(() => {
  const $ = id => document.getElementById(id);
  const PASSWORD = "kevinontop";
  const STORAGE_KEY = "kv_vouches";

  const overlay = $("adminOverlay");
  const loginBox = $("adminLogin");
  const panelBox = $("adminPanel");

  /* ---------- OPEN/CLOSE ---------- */
  $("adminToggle").onclick = () => {
    overlay.classList.remove("hidden");
    if (sessionStorage.getItem("kv_auth") === "1") {
      showPanel();
    } else {
      showLogin();
    }
  };

  $("closeLogin").onclick = closeOverlay;
  $("closePanel").onclick = closeOverlay;
  overlay.addEventListener("click", e => {
    if (e.target === overlay) closeOverlay();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !overlay.classList.contains("hidden")) closeOverlay();
  });

  function closeOverlay() {
    overlay.classList.add("hidden");
    $("loginErr").textContent = "";
    $("pw").value = "";
  }

  function showLogin() {
    loginBox.classList.remove("hidden");
    panelBox.classList.add("hidden");
    setTimeout(() => $("pw").focus(), 100);
  }

  function showPanel() {
    loginBox.classList.add("hidden");
    panelBox.classList.remove("hidden");
    loadAdminList();
  }

  /* ---------- LOGIN ---------- */
  $("loginBtn").onclick = () => {
    if ($("pw").value === PASSWORD) {
      sessionStorage.setItem("kv_auth", "1");
      $("loginErr").textContent = "";
      showPanel();
    } else {
      $("loginErr").textContent = "❌ wrong password";
      $("pw").value = "";
      $("pw").focus();
    }
  };
  $("pw").addEventListener("keydown", e => {
    if (e.key === "Enter") $("loginBtn").click();
  });

  /* ---------- HELPERS ---------- */
  function getVouches() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch { return []; }
  }
  function saveVouches(v) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- MASS CREATE ---------- */
  $("createBtn").onclick = () => {
    const n = Math.min(Math.max(parseInt($("count").value) || 10, 1), 500);
    const list = getVouches();
    const now = Math.floor(Date.now() / 1000);

    for (let i = 0; i < n; i++) {
      const username = randomUsername();
      const message = randomMessage();
      const rating = randomRating();
      const createdAt = now - Math.floor(Math.random() * 60 * 60 * 24 * 90);
      const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
      list.push({
        id: crypto.randomUUID(),
        username,
        avatar,
        message,
        rating,
        created_at: createdAt,
        is_verified: Math.random() > 0.3
      });
    }

    saveVouches(list);
    $("status").textContent = `✅ created ${n} vouches`;
    setTimeout(() => $("status").textContent = "", 3000);
    loadAdminList();
    if (window.KV) window.KV.load();
  };

  /* ---------- CLEAR ---------- */
  $("clearBtn").onclick = () => {
    if (!confirm("delete ALL vouches? this cannot be undone.")) return;
    saveVouches([]);
    $("status").textContent = "🗑️ cleared";
    setTimeout(() => $("status").textContent = "", 3000);
    loadAdminList();
    if (window.KV) window.KV.load();
  };

  /* ---------- ADMIN LIST ---------- */
  function loadAdminList() {
    const list = getVouches().sort((a, b) => b.created_at - a.created_at);
    $("count2").textContent = list.length;
    const wrap = $("adminList");
    wrap.innerHTML = "";
    if (!list.length) {
      wrap.innerHTML = `<p class="muted">no vouches yet</p>`;
      return;
    }
    for (const v of list) {
      const el = document.createElement("div");
      el.className = "list-item";
      el.innerHTML = `
        <img src="${v.avatar}" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(v.username)}'"/>
        <div class="info">
          <strong>${escapeHtml(v.username)} ${v.is_verified ? "✔" : ""}</strong>
          <p>${escapeHtml(v.message)}</p>
        </div>
        <button>delete</button>
      `;
      el.querySelector("button").onclick = () => {
        const current = getVouches().filter(x => x.id !== v.id);
        saveVouches(current);
        loadAdminList();
        if (window.KV) window.KV.load();
      };
      wrap.appendChild(el);
    }
  }

  /* ========================================================
     RANDOM GENERATORS — huge pools, tons of combinations
     ======================================================== */

  const PREFIXES = [
    "vouch", "big vouch", "huge vouch", "vouch for", "def vouch",
    "+rep", "++rep", "rep++", "legit", "100% legit", "actually legit",
    "trusted", "super trusted", "verified", "confirmed", "real one",
    "goated", "W seller", "W", "solid", "clean", "smooth", "fast af",
    "quick", "instant", "no cap", "fr", "ong", "lowkey", "honestly"
  ];

  const MIDDLES = [
    "went first and got it in seconds",
    "paid, got my stuff right after",
    "no scam, everything as described",
    "delivered faster than expected",
    "super easy to deal with",
    "communication was 10/10",
    "helped me out at 3am no complaints",
    "even threw in a little extra",
    "replied in under a minute",
    "explained everything step by step",
    "gave me a discount because i was chill",
    "been buying from him for months now",
    "second time buying, still perfect",
    "third time, still 10/10",
    "never had a single issue",
    "way better than the other sellers i tried",
    "price was more than fair",
    "didnt even have to ask twice",
    "kept me updated the whole time",
    "handled a small problem like a pro"
  ];

  const ENDINGS = [
    "🔥", "🔥🔥", "💯", "🙏", "🤝", "😮‍💨", "🫡", "⚡", "👑", "❤️",
    "will buy again", "coming back for sure", "highly recommend",
    "10/10", "10/10 would recommend", "best seller on here",
    "dont sleep on him", "trust him with your money",
    "no reason to go anywhere else", "goat fr", "my go to now",
    "", "", ""
  ];

  const SHORT_BOPS = [
    "vouch 🔥", "legit", "vouch!!", "W seller", "fast + legit",
    "smooth deal", "trusted ✅", "quick and easy", "10/10",
    "goated fr", "real one 🤝", "no issues", "vouch vouch",
    "came thru 🙏", "easy money", "clean deal", "A+ seller",
    "top tier", "respect 🫡", "god tier seller"
  ];

  const NAMES = [
    "kayden", "marcus", "tyler", "jaylen", "devin", "xavier", "mason", "aiden",
    "liam", "noah", "ethan", "lucas", "logan", "jackson", "sebastian", "mateo",
    "elijah", "oliver", "james", "benjamin", "henry", "alexander", "daniel",
    "michael", "samuel", "david", "joseph", "carter", "wyatt", "john", "owen",
    "luke", "gabriel", "anthony", "isaac", "grayson", "jayce", "dylan", "leo",
    "mia", "ava", "sofia", "isabella", "chloe", "luna", "avery", "mila", "aria",
    "scarlett", "penelope", "layla", "nora", "riley", "zoey", "hazel", "violet",
    "aurora", "ellie", "stella", "nova", "emilia", "willow", "ivy", "jade",
    "skye", "raine", "kai", "zane", "ryder", "cole", "brody", "cash", "king",
    "ace", "jax", "knox", "tripp", "titan", "crue", "ryker", "maddox", "saint"
  ];

  const SUFFIXES = [
    "", "", "", "_", "__", ".", "xo", "yt", "tt", "tv", "gaming", "plays", "real",
    "official", "", "", "", "_hd", "21", "07", "99", "420", "777", "_1k", "_tv",
    "off", "raw", "only", "hq", "gg", "uwu", "lol", "xd"
  ];

  const NUMBERS = ["", "", "", "1", "2", "7", "9", "13", "21", "23", "69", "99", "100", "420", "666", "777", "999", "2004", "2005", "2006", "2007", "2008"];

  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  function randomUsername() {
    let name = pick(NAMES) + pick(SUFFIXES) + pick(NUMBERS);
    if (Math.random() < 0.15) name = name.charAt(0).toUpperCase() + name.slice(1);
    return name;
  }

  function randomMessage() {
    if (Math.random() < 0.15) return pick(SHORT_BOPS);
    const p = pick(PREFIXES), m = pick(MIDDLES), e = pick(ENDINGS);
    const s = Math.random();
    if (s < 0.25) return `${p}, ${m} ${e}`.trim();
    if (s < 0.5)  return `${p} — ${m} ${e}`.trim();
    if (s < 0.75) return `${p}. ${m}. ${e}`.trim();
    return `${p} ${m} ${e}`.trim();
  }

  function randomRating() {
    const r = Math.random();
    if (r < 0.82) return 5;
    if (r < 0.95) return 4;
    return 3;
  }
})();
