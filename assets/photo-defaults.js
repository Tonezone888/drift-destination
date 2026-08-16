/** Category fallback images when no business photo */
window.DRIFT_DEFAULT_PHOTOS = {
  accommodation: "assets/default-accommodation.jpg",
  "food & drink": "assets/default-food.jpg",
  food: "assets/default-food.jpg",
  "tours & activities": "assets/default-tours.jpg",
  tours: "assets/default-tours.jpg",
  wellness: "assets/default-wellness.jpg",
  "wellness, massage & spas": "assets/default-wellness.jpg",
  explore: "assets/default-explore.jpg",
  "places of interest": "assets/default-explore.jpg",
  "see & do": "assets/default-explore.jpg",
  weddings: "assets/default-weddings.jpg",
  shopping: "assets/default-shopping.jpg",
  "shops & essentials": "assets/default-shopping.jpg",
  "trades & services": "assets/default-trades.jpg",
  trades: "assets/default-trades.jpg",
  "community & events": "assets/default-events.png",
  "what's on": "assets/default-events.png",
  "real estate": "assets/default-accommodation.jpg"
};
window.driftPhotoFor = function (row) {
  if (!row) return "assets/default-accommodation.jpg";
  var photo =
    row.photo ||
    row.Photo ||
    row.image ||
    row.Image ||
    row.photo_url ||
    row.photoUrl ||
    row["Photo URL"] ||
    "";
  photo = String(photo || "").trim();
  if (photo && photo.toLowerCase() !== "none" && photo.toLowerCase() !== "n/a") {
    if (photo.indexOf("places/") === 0) {
      /* ref only — not a displayable file yet */
    } else if (photo.indexOf("http") === 0 || photo.indexOf("assets/") === 0 || photo.indexOf("data/") === 0 || photo.indexOf("photos/") === 0) {
      return photo;
    } else if (photo.indexOf("/") >= 0) {
      return photo;
    }
  }
  var cat = String(row.category || row.Category || row.type || row.Type || "").toLowerCase();
  var map = window.DRIFT_DEFAULT_PHOTOS;
  for (var key in map) {
    if (cat.indexOf(key) >= 0) return map[key];
  }
  if (cat.indexOf("resort") >= 0 || cat.indexOf("hotel") >= 0 || cat.indexOf("motel") >= 0 || cat.indexOf("apartment") >= 0 || cat.indexOf("hostel") >= 0 || cat.indexOf("caravan") >= 0)
    return map.accommodation;
  if (cat.indexOf("cafe") >= 0 || cat.indexOf("restaurant") >= 0 || cat.indexOf("bar") >= 0 || cat.indexOf("takeaway") >= 0)
    return map.food;
  return "assets/default-accommodation.jpg";
};
