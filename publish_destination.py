"""Publish — export visitor-visible rows for the active destination."""
from __future__ import annotations

import json
from pathlib import Path

import streamlit as st

from app_config import ROOT
from catalogue import build_catalogue
from destination_books import load_profile
from publish_gate import gate_summary, is_visitor_visible


def _is_verified(r) -> bool:
    def _cell_local(*names):
        for n in names:
            if hasattr(r, "index") and n in r.index and r.get(n) is not None:
                s = str(r.get(n)).strip().lower()
                if s and s not in ("nan", "none", "null", ""):
                    return s
        return ""
    v = _cell_local("Verified", "Subscribed", "Is Verified", "Subscriber")
    if v in ("1", "true", "yes", "y", "verified", "subscribed", "active"):
        return True
    return False


def render_publish() -> None:
    st.header("Publish")
    profile = load_profile()
    dest_id = str(profile.get("id") or "whitsundays").strip() or "whitsundays"
    st.caption(
        "Exports gate-pass listings for **%s** only → "
        "`Visitor_Site/data/%s/`" % (profile.get("name"), dest_id)
    )

    df, report = build_catalogue()
    if report.get("error"):
        st.error(report["error"])
        return
    g = gate_summary(df)
    a, b, c = st.columns(3)
    a.metric("Portfolio", g["total"])
    b.metric("Visitor-visible", g["visitor_visible"])
    c.metric("Visible %", "%s%%" % g["visible_pct"])

    if st.button("Export visitor JSON", type="primary"):
        if df.empty:
            st.warning("Nothing to export.")
            return
        vis = df[df.apply(is_visitor_visible, axis=1)]
        out_dir = ROOT / "Visitor_Site" / "data" / dest_id
        out_dir.mkdir(parents=True, exist_ok=True)
        payload = []
        rows_list = list(vis.iterrows())
        total = max(len(rows_list), 1)
        prog = st.progress(0, text="Exporting listings & photos…")
        status = st.empty()
        for i, (_, r) in enumerate(rows_list):
            def _cell(*names):
                for n in names:
                    if n in r.index and r.get(n) is not None:
                        s = str(r.get(n)).strip()
                        if s and s.lower() not in ("nan", "none", "null"):
                            return s
                return ""
            lat = _cell("Latitude", "Lat", "GPS Lat", "lat")
            lng = _cell("Longitude", "Lng", "Long", "GPS Lng", "lng", "lon")
            raw_sub = _cell("Subcategory", "Sub Category", "Sub-category", "subcategory")
            raw_type = _cell("Type", "Primary category", "type")
            cat = str(r.get("Category") or "").strip()
            # Prefer Subcategory; fall back to Type (what you set in Browse & Edit)
            sub = raw_sub or raw_type
            sub_l = sub.lower().strip()
            # Normalize Food & Drink
            if cat == "Food & Drink" or "food" in cat.lower():
                if any(x in sub_l for x in ("takeaway", "fast food")):
                    sub = "takeaway"
                elif "cafe" in sub_l or "bakery" in sub_l:
                    sub = "cafe"
                elif "bar" in sub_l or "pub" in sub_l:
                    sub = "bar"
                elif "restaurant" in sub_l or "dining" in sub_l:
                    sub = "restaurant"
                # keep multi: "Restaurant, Bar" → store as-is lower tokens
                if "," in (raw_sub or raw_type or ""):
                    parts = []
                    for bit in (raw_sub or raw_type).replace("&", ",").split(","):
                        b = bit.strip().lower()
                        if "takeaway" in b: parts.append("takeaway")
                        elif "cafe" in b or "bakery" in b: parts.append("cafe")
                        elif "bar" in b or "pub" in b: parts.append("bar")
                        elif "restaurant" in b: parts.append("restaurant")
                        elif b: parts.append(b)
                    sub = ", ".join(dict.fromkeys(parts))  # unique keep order
            # Normalize Places of Interest / See & Do
            if "place" in cat.lower() or "see" in cat.lower() or "interest" in cat.lower():
                if "lookout" in sub_l or "viewpoint" in sub_l:
                    sub = "lookouts"
                elif "trail" in sub_l or "track" in sub_l or "walk" in sub_l:
                    sub = "trails"
                elif "beach" in sub_l:
                    sub = "beaches"
                elif "photo" in sub_l:
                    sub = "photo-spots"
                elif "swim" in sub_l or "lagoon" in sub_l:
                    sub = "swimming"
                elif "meeting" in sub_l:
                    sub = "meeting-point"
                # Visitor hub is See & Do
                cat = "Explore"
            # Weddings
            if "wedding" in cat.lower() or "wedding" in (raw_type or "").lower():
                if "venue" in sub_l: sub = "venues"
                elif "celebrant" in sub_l: sub = "celebrants"
                elif "photo" in sub_l or "video" in sub_l or "drone" in sub_l: sub = "photo"
                elif "hair" in sub_l or "makeup" in sub_l or "make-up" in sub_l or "beauty" in sub_l: sub = "hair"
                elif "florist" in sub_l or "flower" in sub_l: sub = "florists"
                elif "cake" in sub_l or "cater" in sub_l: sub = "cakes"
                elif "planner" in sub_l or "stylist" in sub_l or "coordinator" in sub_l: sub = "planners"
                # Keep primary category for Community/Wellness home; visitor Weddings uses subcategory + type
            # Tours & Activities
            if "tour" in cat.lower() or "activit" in cat.lower():
                if "fish" in sub_l:
                    sub = "fishing"
                elif ("jet" in sub_l or "kayak" in sub_l or "paddle" in sub_l) or (
                    "hire" in sub_l and "car" not in sub_l and "equipment" not in sub_l and "plant" not in sub_l and "laundry" not in sub_l
                ):
                    sub = "hire"
                elif "bus" in sub_l or "bike" in sub_l or "coach" in sub_l:
                    sub = "bus"
                elif "scenic" in sub_l or "skydive" in sub_l or "flight" in sub_l or "helicopter" in sub_l:
                    sub = "scenic"
                elif "boat" in sub_l or "sail" in sub_l or "snorkel" in sub_l or "dive" in sub_l or "raft" in sub_l:
                    sub = "boat"
            # Real Estate
            if "real estate" in cat.lower() or "property" in cat.lower():
                if "agent" in sub_l and "agency" not in sub_l and "manager" not in sub_l:
                    sub = "agent"
                elif "manager" in sub_l or "management" in sub_l:
                    sub = "manager"
                elif "agenc" in sub_l or "real estate" in sub_l:
                    sub = "agency"
                if "real estate" in cat.lower() or sub in ("agent", "agency", "manager"):
                    cat = "Real Estate"
            rating = _cell("Google Rating", "Rating")
            reviews = _cell("Google Review Count", "Review Count", "Reviews")
            photo_name = _cell("Photo Name", "Photo Ref", "photo_ref", "Photo")
            photo_rel = ""
            # Download Google photo when we have a Places photo resource name
            if photo_name and dest_id and "places/" in str(photo_name):
                try:
                    from app_config import category_gets_photo
                    from google_places import download_place_photo
                    # Prefer policy, but still try if category is photo-eligible-ish
                    allow = category_gets_photo(cat) or any(
                        x in (cat or "").lower()
                        for x in (
                            "accommodation", "food", "tour", "wellness",
                            "massage", "spa", "explore", "interest", "wedding",
                            "real estate", "property",
                        )
                    )
                    if allow:
                        api_key = ""
                        try:
                            from places_key import load_key
                            api_key = (load_key() or "").strip()
                        except Exception:
                            api_key = (st.session_state.get("places_api_key") or "").strip()
                        if api_key:
                            photos_dir = out_dir / "photos"
                            photos_dir.mkdir(parents=True, exist_ok=True)
                            safe = "".join(
                                ch if ch.isalnum() or ch in "-_" else "_"
                                for ch in str(r.get("Business Name") or "biz")[:48]
                            )
                            dest_file = photos_dir / (safe + ".jpg")
                            if dest_file.exists() and dest_file.stat().st_size > 500:
                                photo_rel = "data/%s/photos/%s" % (dest_id, dest_file.name)
                            else:
                                # category="" skips policy inside download (we already gated)
                                ok = download_place_photo(
                                    api_key, photo_name, dest_file, max_height=640, category=""
                                )
                                if ok:
                                    photo_rel = "data/%s/photos/%s" % (dest_id, dest_file.name)
                except Exception:
                    photo_rel = ""
            row = {
                "name": r.get("Business Name"),
                "category": cat,
                "subcategory": sub,
                "type": raw_type,
                "locality": r.get("Locality"),
                "address": r.get("Address"),
                "phone": r.get("Phone"),
                "website": r.get("Website"),
                "lat": lat,
                "lng": lng,
                "destination_id": dest_id,
                "rating": rating,
                "reviews": reviews,
                "photo": photo_rel,
                "verified": _is_verified(r),
                "last_payment": _cell("Last Payment", "Last Payment At", "Paid At"),
                "subscription_until": _cell("Subscription Until", "Sub Until", "Verified Until"),
            }
            payload.append(row)
            # progress UI
            done = i + 1
            if done == total or done % 5 == 0:
                pct = min(done / total, 1.0)
                nph = sum(1 for x in payload if x.get("photo"))
                prog.progress(
                    pct,
                    text="Exporting… %s / %s · %s photos" % (done, total, nph),
                )
                status.caption("Current: %s" % (str(r.get("Business Name") or "")[:60]))
        prog.progress(1.0, text="Done — writing JSON…")
        path = out_dir / "businesses.json"
        path.write_text(json.dumps(payload, indent=2))
        n_photos = sum(1 for x in payload if x.get("photo"))
        n_refs = sum(
            1
            for _, rr in vis.iterrows()
            if "places/" in str(rr.get("Photo Name") or rr.get("Photo Ref") or "")
        )
        try:
            from places_key import load_key
            key_ok = bool((load_key() or "").strip())
        except Exception:
            key_ok = bool((st.session_state.get("places_api_key") or "").strip())
        st.success(
            "Wrote %s listings → `%s` · %s with photos" % (len(payload), path, n_photos)
        )
        st.caption(
            "Photo refs in export set: %s · API key loaded: %s"
            % (n_refs, "yes" if key_ok else "NO — add GOOGLE_PLACES_API_KEY in Drift_Command .env")
        )
        try:
            from daily_ops import export_ops_for_visitor
            ops_path = export_ops_for_visitor(dest_id)
            st.success("Ops (alert, cab, specials, happy hour, events) → `%s`" % ops_path)
        except Exception as e:
            st.warning("Listings exported; ops export skipped: %s" % e)
