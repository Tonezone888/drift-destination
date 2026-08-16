/** Verified subscribers first (newest payment first), then A–Z */
window.driftIsVerified = function (r) {
  if (!r) return false;
  if (r.verified === true || r.verified === 1 || r.verified === "1") return true;
  var v = String(r.verified || r.Verified || r.subscribed || r.Subscribed || "").toLowerCase().trim();
  return v === "true" || v === "yes" || v === "y" || v === "verified" || v === "subscribed" || v === "active";
};
window.driftPaymentTime = function (r) {
  var s = String(r.last_payment || r["Last Payment"] || r.paid_at || "").trim();
  if (!s || s.toLowerCase() === "nan") return 0;
  var t = Date.parse(s);
  return isNaN(t) ? 0 : t;
};
window.driftSortListings = function (rows) {
  if (!Array.isArray(rows)) return [];
  return rows.slice().sort(function (a, b) {
    var va = window.driftIsVerified(a);
    var vb = window.driftIsVerified(b);
    if (va && !vb) return -1;
    if (!va && vb) return 1;
    if (va && vb) {
      var pa = window.driftPaymentTime(a);
      var pb = window.driftPaymentTime(b);
      if (pb !== pa) return pb - pa; // newest payment first
    }
    var na = String(a.name || a["Business Name"] || a.Name || "").toLowerCase();
    var nb = String(b.name || b["Business Name"] || b.Name || "").toLowerCase();
    return na.localeCompare(nb);
  });
};
