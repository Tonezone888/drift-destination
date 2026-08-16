(function () {
  const DEMO = [
    { name: "KC's Bar & Grill", cat: "eat", locality: "Airlie Beach" },
    { name: "La Tabella Italian", cat: "eat", locality: "Airlie Beach" },
    { name: "Anchor Bar", cat: "eat", locality: "Airlie Beach" },
    { name: "Ocean Rafting", cat: "tours", locality: "Coral Sea Marina" },
    { name: "Cruise Whitsundays", cat: "tours", locality: "Port of Airlie" },
    { name: "Whitehaven Beach", cat: "beaches", locality: "Whitsundays" },
    { name: "Airlie Beach Lagoon", cat: "beaches", locality: "Airlie Beach" },
    { name: "Whitsunday Village shops", cat: "shop", locality: "Airlie Beach" },
  ];

  let listings = DEMO.slice();
  let favs = new Set(JSON.parse(localStorage.getItem("drift_favs") || "[]"));
  let guest = localStorage.getItem("drift_guest") === "1";

  function period() {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
  }

  const DEST_NAMES = {
    whitsundays: "Whitsundays",
    "hamilton-island": "Hamilton Island",
    hamilton_island: "Hamilton Island",
    "magnetic-island": "Magnetic Island",
    magnetic_island: "Magnetic Island",
    "port-douglas": "Port Douglas",
    port_douglas: "Port Douglas",
    proserpine: "Proserpine"
  };

  function currentDestination() {
    try {
      return localStorage.getItem("drift_destination_v1") || "whitsundays";
    } catch {
      return "whitsundays";
    }
  }

  /** Folder id under data/ — matches Operator profile ids (underscores) */
  function destDataId() {
    return String(currentDestination() || "whitsundays")
      .trim()
      .toLowerCase()
      .replace(/-/g, "_") || "whitsundays";
  }

  function businessesUrl() {
    return "data/" + destDataId() + "/businesses.json";
  }

  function opsUrl() {
    return "data/" + destDataId() + "/ops.json";
  }

  function setDestinationChip() {
    const nameEl = document.getElementById("destChipName");
    if (!nameEl) return;
    nameEl.textContent = DEST_NAMES[currentDestination()] || "Whitsundays";
  }

  function setGreeting() {
    const el = document.getElementById("greetingTitle");
    if (!el) return;
    const destName = DEST_NAMES[currentDestination()] || "Whitsundays";
    el.textContent = guest
      ? `Welcome to ${destName} 🌴`
      : `Good ${period()}, Tony 👋`;
    const sub = document.querySelector(".greeting-subtitle");
    setDestinationChip();
    if (sub) sub.textContent = "What do you feel like doing today?";
  }

  function showView(name) {
    const map = {
      home: "viewHome",
      list: "viewList",
      explore: "viewExplore",
      fav: "viewFav",
      book: "viewBook",
      profile: "viewProfile",
    };
    Object.keys(map).forEach((k) => {
      const el = document.getElementById(map[k]);
      if (el) el.classList.toggle("hidden", k !== name);
    });
    document.querySelectorAll(".nav-item").forEach((b) => {
      const v = b.dataset.view;
      b.classList.toggle("active", v === name || (name === "list" && v === "explore"));
    });
    // Home keeps menu + logo + bell; inner screens only use the ← back control
    const top = document.querySelector(".top-bar");
    if (top) top.style.display = name === "home" ? "" : "none";
  }

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cleanPhone(p) {
    return String(p || "").replace(/[\s().-]/g, "");
  }

  function shortAddress(addr, locality) {
    let s = String(addr || "").trim();
    if (!s) return "";
    // Drop noisy country / state tails tourists don't need on every card
    s = s.replace(/,\s*Australia\s*$/i, "");
    s = s.replace(/,\s*QLD\s*\d{4}\s*$/i, "");
    s = s.replace(/,\s*Queensland\s*\d{4}\s*$/i, "");
    s = s.replace(/\s+QLD\s+\d{4}\s*$/i, "");
    const loc = String(locality || "").trim();
    if (loc) {
      // Avoid "Cannonvale" twice if address already ends with it
      const re = new RegExp(",\\s*" + loc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*$", "i");
      s = s.replace(re, "");
    }
    return s.trim().replace(/,\s*$/, "");
  }

  function isRealContact(v) {
    const s = String(v || "").trim().toLowerCase();
    if (!s || s === "n/a" || s === "na" || s === "none" || s === "-" || s === "—") return false;
    if (s === "no phone" || s === "no website" || s === "null" || s === "undefined") return false;
    if (s.startsWith("via ")) return false;
    return true;
  }

  function cardHtml(item) {
    const id = item.name || "Place";
    const on = favs.has(id) ? "on" : "";
    const loc = item.locality || "Whitsundays";
    const phone = isRealContact(item.phone) ? String(item.phone).trim() : "";
    const web = isRealContact(item.website) ? String(item.website).trim() : "";
    const webHref = web && !/^https?:\/\//i.test(web) ? "https://" + web : web;
    const short = shortAddress(item.address, loc);
    const addr = short ? `<p class="place-addr">${esc(short)}</p>` : "";
    const lat = String(item.lat || item.latitude || "").trim();
    const lng = String(item.lng || item.longitude || "").trim();
    let mapHref = "";
    if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
      mapHref = "https://maps.google.com/?q=" + encodeURIComponent(lat + "," + lng);
    } else if (short || item.address) {
      mapHref = "https://maps.google.com/?q=" + encodeURIComponent((short || item.address) + " " + loc);
    }
    let actions = "";
    if (phone) {
      actions += `<a class="place-btn place-btn-call" href="tel:${esc(cleanPhone(phone))}">Call</a>`;
    }
    if (webHref) {
      actions += `<a class="place-btn place-btn-web" href="${esc(webHref)}" target="_blank" rel="noopener">Website</a>`;
    }
    if (mapHref) {
      actions += `<a class="place-btn place-btn-map" href="${esc(mapHref)}" target="_blank" rel="noopener">Map</a>`;
    }
    if (!actions) {
      actions = `<span class="place-btn-muted">No public contact yet</span>`;
    }
    const detailQs = new URLSearchParams({
      name: id,
      locality: loc,
      address: short || item.address || "",
      phone: phone || "",
      website: web || "",
      hours: item.hours || item.opening_hours || "",
      rating: item.rating || "",
      lat: lat || "",
      lng: lng || "",
      category: item.category || item.Category || ""
    }).toString();
    const detailHref = "place.html?" + detailQs;
    return `<article class="place-card">
      <div class="place-main">
        <div class="place-top">
          <div>
            <h3><a href="${detailHref}" style="color:inherit;text-decoration:none">${esc(id)}</a></h3>
            <p>${esc(loc)}</p>
            ${addr}
          </div>
          <button type="button" class="heart ${on}" data-fav="${esc(id)}" aria-label="Favourite">♥</button>
        </div>
        <div class="place-actions">${actions}</div>
      </div>
    </article>`;
  }

  function bindHearts(root) {
    root.querySelectorAll(".heart").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.fav;
        if (favs.has(id)) favs.delete(id);
        else favs.add(id);
        localStorage.setItem("drift_favs", JSON.stringify([...favs]));
        btn.classList.toggle("on");
        renderFavs();
      });
    });
  }

  /** Map UI keys (eat, tours, …) to workbook / publish category labels */
  function catAliases(key) {
    const k = String(key || "").toLowerCase().trim();
    const map = {
      eat: ["eat", "food", "drink", "food & drink", "food and drink", "restaurant", "cafe", "bar", "dining"],
      beaches: ["beaches", "beach", "lagoon"],
      tours: ["tours", "tour", "activities", "tours & activities", "tours and activities", "sailing", "adventure"],
      events: ["events", "event", "community", "community & events", "whats on", "what's on"],
      shop: ["shop", "shops", "retail", "shops & essentials", "shopping", "markets"],
      stay: ["stay", "accommodation", "hotel", "resort"],
      wellness: ["wellness", "spa", "massage", "wellness, massage & spas", "beauty", "health"],
      trades: ["trades", "services", "trades & services", "marine", "detailing"],
      medical: ["medical", "pharmacy", "medical & pharmacies"],
      transport: ["transport", "transfers", "transport & transfers"],
      "see-and-do": ["see & do", "see and do", "lookout", "lookouts", "trail", "trails", "beaches", "beach", "points of interest", "poi"],
    };
    return map[k] || [k];
  }

  function itemCat(item) {
    return String(item.cat || item.category || "").toLowerCase().trim();
  }

  function matchesCat(item, key) {
    if (!key) return true;
    const ic = itemCat(item);
    if (!ic) return false;
    if (ic === String(key).toLowerCase()) return true;
    return catAliases(key).some((a) => ic === a || ic.includes(a) || a.includes(ic));
  }

  function byName(a, b) {
    return String(a.name || "").localeCompare(String(b.name || ""), undefined, {
      sensitivity: "base",
    });
  }


  function onCategoryClick(btn) {
    const key = btn.dataset.cat;
    const t = btn.querySelector(".cat-title")?.textContent || "Category";
    // Feature pages (full screens)
    const featurePages = {
      weather: "weather.html",
      specials: "specials.html",
      accommodation: "accommodation.html",
      "whats-on": "whats-on.html",
      "happy-hour": "happy-hour.html",
      "see-and-do": "see-and-do.html",
      wellness: "wellness.html",
      tours: "tours.html",
      transport: "transport.html",
      shop: "shop.html",
      trades: "trades.html",
      eat: "eat.html",
      realestate: "real-estate.html",
      weddings: "weddings.html",
      medical: "medical.html",
      community: "community.html",
      "real-estate": "real-estate.html",
      favourites: "favourites.html"
    };
    if (featurePages[key]) {
      window.location.href = featurePages[key];
      return;
    }
    openCategory(key, t);
  }

  function openCategory(key, title) {
    showView("list");
    document.getElementById("listTitle").textContent = title || key;
    let rows = listings.filter((x) => matchesCat(x, key));
    rows = rows.slice().sort(byName);
    const el = document.getElementById("listCards");
    if (!rows.length) {
      el.innerHTML =
        '<p class="list-empty">No listings in this category yet. Publish from Operator after adding them.</p>';
      return;
    }
    el.innerHTML = rows.map(cardHtml).join("");
    bindHearts(el);
  }

  function renderFavs() {
    const el = document.getElementById("favList");
    const empty = document.getElementById("favEmpty");
    const rows = listings.filter((x) => favs.has(x.name));
    el.innerHTML = rows.map(cardHtml).join("");
    bindHearts(el);
    if (empty) empty.style.display = rows.length ? "none" : "block";
  }

  function cloneCatsToExplore() {
    const src = document.getElementById("categoryGrid");
    const dest = document.getElementById("exploreGrid");
    if (!src || !dest) return;
    dest.innerHTML = src.innerHTML;
    dest.querySelectorAll(".category-card").forEach((btn) => {
      btn.addEventListener("click", () => onCategoryClick(btn));
    });
  }

  document.getElementById("categoryGrid")?.querySelectorAll(".category-card").forEach((btn) => {
    btn.addEventListener("click", () => onCategoryClick(btn));
  });

  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const v = btn.dataset.view;
      showView(v);
      if (v === "fav") renderFavs();
      if (v === "explore") cloneCatsToExplore();
      if (v === "profile") {
        document.getElementById("profileMode").textContent = guest
          ? "Guest mode · Whitsundays"
          : "Logged in · Tony";
      }
    });
  });

  document.getElementById("btnBack")?.addEventListener("click", () => showView("home"));
  document.getElementById("btnMenu")?.addEventListener("click", () => {
    window.location.href = "settings.html";
  });
  document.getElementById("btnGuestToggle")?.addEventListener("click", () => {
    guest = !guest;
    localStorage.setItem("drift_guest", guest ? "1" : "0");
    setGreeting();
    document.getElementById("profileMode").textContent = guest
      ? "Guest mode · Whitsundays"
      : "Logged in · Tony";
  });

  function searchScore(item, q) {
    const name = String(item.name || "").toLowerCase();
    const sub = String(item.subcategory || item.sub || "").toLowerCase();
    const loc = String(item.locality || "").toLowerCase();
    const addr = String(item.address || "").toLowerCase();
    // Name is strongest (what people type for Red Cat, the pub, massage)
    if (name.includes(q)) {
      if (name.startsWith(q)) return 300;
      // whole word in name
      if (new RegExp("\\b" + q.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&") + "\\b").test(name)) return 250;
      return 200;
    }
    // Subcategory (e.g. massage, fishing, bottle)
    if (sub.includes(q)) return 120;
    // Locality / address only for place names people type
    if (loc.includes(q) || addr.includes(q)) return 40;
    return 0;
  }

  function runSearch() {
    const input = document.getElementById("searchInput");
    if (!input) return;
    const q = input.value.trim().toLowerCase();
    if (!q) {
      // Just focus the box if empty
      input.focus();
      return;
    }
    showView("list");
    document.getElementById("listTitle").textContent = `Search: ${q}`;
    const ranked = listings
      .map((x) => ({ item: x, score: searchScore(x, q) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || String(a.item.name || "").localeCompare(String(b.item.name || "")));
    const rows = ranked.map((x) => x.item);
    const el = document.getElementById("listCards");
    if (!rows.length) {
      el.innerHTML = '<p class="list-empty">No matches for “' + q.replace(/</g, "") + '”. Try a business name.</p>';
      return;
    }
    el.innerHTML = rows.map(cardHtml).join("");
    bindHearts(el);
  }

  document.getElementById("searchInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") runSearch();
  });

  document.getElementById("btnSearchGo")?.addEventListener("click", runSearch);

  // Bottom nav Search button → focus search + go home
  document.getElementById("btnNavSearch")?.addEventListener("click", () => {
    showView("home");
    const input = document.getElementById("searchInput");
    if (input) {
      input.focus();
      input.select();
    }
  });

  fetch(businessesUrl(), { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (Array.isArray(data) && data.length) {
        listings = data.map(function (row) {
          var o = Object.assign({}, row);
          if (!o.cat && o.category) o.cat = o.category;
          return o;
        }).sort(function (a, b) {
          return String(a.name || "").localeCompare(String(b.name || ""), undefined, {
            sensitivity: "base",
          });
        });
      }
    })
    .catch(() => {})
    .finally(() => {
      setGreeting();
      cloneCatsToExplore();
    });
})();


/* Desktop chrome nav */
document.querySelectorAll("[data-desk-nav]").forEach((a) => {
  a.addEventListener("click", (e) => {
    e.preventDefault();
    const v = a.getAttribute("data-desk-nav");
    if (typeof showView === "function") showView(v === "fav" ? "fav" : v);
    else if (v === "home") location.hash = "";
  });
});
