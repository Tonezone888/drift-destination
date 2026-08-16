/** Type-first defaults, then category. Real photo file wins. */
window.DRIFT_TYPE_PHOTOS = {
  // Accommodation
  resort: "assets/default-resort.jpg",
  "hotel / motel": "assets/default-hotel.jpg",
  hotel: "assets/default-hotel.jpg",
  motel: "assets/default-hotel.jpg",
  "apartment / holiday unit": "assets/default-apartment.jpg",
  apartment: "assets/default-apartment.jpg",
  "holiday unit": "assets/default-apartment.jpg",
  "backpackers / hostel": "assets/default-backpackers.jpg",
  backpackers: "assets/default-backpackers.jpg",
  hostel: "assets/default-backpackers.jpg",
  "caravan / cabin park": "assets/default-caravan.jpg",
  caravan: "assets/default-caravan.jpg",
  cabin: "assets/default-caravan.jpg",
  // Food
  restaurant: "assets/default-restaurant.jpg",
  cafe: "assets/default-cafe.jpg",
  bar: "assets/default-bar.jpg",
  pub: "assets/default-bar.jpg",
  takeaway: "assets/default-takeaway.jpg",
  // Tours
  fishing: "assets/default-fishing.jpg",
  fish: "assets/default-fishing.jpg",
  "fishing charter": "assets/default-fishing.jpg",
  "boat tours": "assets/default-boat.jpg",
  boat: "assets/default-boat.jpg",
  "bus tours": "assets/default-bus.jpg",
  bus: "assets/default-bus.jpg",
  bike: "assets/default-bus.jpg",
  hire: "assets/default-hire.jpg",
  "scenic flights": "assets/default-scenic.jpg",
  scenic: "assets/default-scenic.jpg",
  skydive: "assets/default-scenic.jpg",
  flight: "assets/default-scenic.jpg",
  // Wellness
  massage: "assets/default-massage.jpg",
  spa: "assets/default-spa.jpg",
  "hair & beauty": "assets/default-hair.jpg",
  hair: "assets/default-hair.jpg",
  beauty: "assets/default-hair.jpg",
  fitness: "assets/default-fitness.jpg",
  gym: "assets/default-fitness.jpg",
  yoga: "assets/default-yoga.jpg",
  other: "assets/default-yoga.jpg",
  // Weddings
  venue: "assets/default-venue.jpg",
  celebrant: "assets/default-celebrant.jpg",
  "photo and video": "assets/default-photo-video.jpg",
  photo: "assets/default-photo-video.jpg",
  video: "assets/default-photo-video.jpg",
  "hair and makeup": "assets/default-hair.jpg",
  makeup: "assets/default-hair.jpg",
  florist: "assets/default-florist.jpg",
  flowers: "assets/default-florist.jpg",
  "cakes and catering": "assets/default-wedding-cake.jpg",
  cake: "assets/default-wedding-cake.jpg",
  catering: "assets/default-wedding-cake.jpg",
  planner: "assets/default-planner.jpg",
  // Real estate
  agency: "assets/default-real-estate.jpg",
  agencies: "assets/default-real-estate.jpg",
  agent: "assets/default-real-estate.jpg",
  agents: "assets/default-real-estate.jpg",
  "property manager": "assets/default-real-estate.jpg",
  "property managers": "assets/default-real-estate.jpg",
  manager: "assets/default-real-estate.jpg"
};
window.DRIFT_CAT_PHOTOS = {
  accommodation: "assets/default-resort.jpg",
  "food & drink": "assets/default-restaurant.jpg",
  "tours & activities": "assets/default-boat.jpg",
  wellness: "assets/default-massage.jpg",
  "wellness, massage & spas": "assets/default-massage.jpg",
  explore: "assets/default-explore.jpg",
  "places of interest": "assets/default-explore.jpg",
  weddings: "assets/default-weddings.jpg",
  shopping: "assets/default-shopping.jpg",
  "shops & essentials": "assets/default-shopping.jpg",
  "trades & services": "assets/default-trades.jpg",
  "real estate": "assets/default-real-estate.jpg",
  property: "assets/default-real-estate.jpg"
};
window.driftPhotoFor = function (row) {
  if (!row) return "assets/default-resort.jpg";
  var photo =
    row.photo || row.Photo || row.image || row.Image ||
    row.photo_url || row.photoUrl || row["Photo URL"] || "";
  photo = String(photo || "").trim();
  if (photo && photo.toLowerCase() !== "none" && photo.toLowerCase() !== "n/a") {
    if (photo.indexOf("places/") !== 0) {
      if (
        photo.indexOf("http") === 0 ||
        photo.indexOf("assets/") === 0 ||
        photo.indexOf("data/") === 0 ||
        photo.indexOf("photos/") === 0 ||
        photo.indexOf("/") >= 0
      ) {
        return photo;
      }
    }
  }
  var type = String(row.type || row.Type || row.subcategory || "").toLowerCase();
  var mapT = window.DRIFT_TYPE_PHOTOS;
  // longest key match first
  var keys = Object.keys(mapT).sort(function (a, b) { return b.length - a.length; });
  for (var i = 0; i < keys.length; i++) {
    if (type.indexOf(keys[i]) >= 0) return mapT[keys[i]];
  }
  var cat = String(row.category || row.Category || "").toLowerCase();
  var mapC = window.DRIFT_CAT_PHOTOS;
  for (var c in mapC) {
    if (cat.indexOf(c) >= 0) return mapC[c];
  }
  return "assets/default-resort.jpg";
};
