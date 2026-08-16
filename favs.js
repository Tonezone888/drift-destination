window.DRIFT_FAV_KEY = "drift_favs";
window.driftLoadFavs = function () {
  try {
    return new Set(JSON.parse(localStorage.getItem(window.DRIFT_FAV_KEY) || "[]"));
  } catch (e) {
    return new Set();
  }
};
window.driftToggleFav = function (id, btn) {
  var favs = window.driftLoadFavs();
  id = String(id || "");
  if (!id) return;
  if (favs.has(id)) {
    favs.delete(id);
    if (btn) {
      btn.classList.remove("on");
      btn.textContent = "♡";
    }
  } else {
    favs.add(id);
    if (btn) {
      btn.classList.add("on");
      btn.textContent = "♥";
    }
  }
  localStorage.setItem(window.DRIFT_FAV_KEY, JSON.stringify(Array.from(favs)));
};
window.driftIsFav = function (id) {
  return window.driftLoadFavs().has(String(id || ""));
};
