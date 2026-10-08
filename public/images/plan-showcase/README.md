# Plan Showcase images

Drop assets here to replace the fallbacks used by
`components/site/plan-showcase.tsx`. One hero image per screen. The slot
→ filename map is defined in `SHOWCASE_IMAGES` inside that file; keep
names in sync.

Expected files:

- `overview-reference.png` — Overview screen hero
- `itinerary.png` — Itinerary (day-by-day) screen hero
- `places.png` — Places to explore screen hero
- `map.png` — Map screen hero
- `stays-food.png` — Stays & food screen hero
- `notes-guide.png` — Tapan's notes screen hero

Until a file is present, `HeroImage` falls back silently to a
travel-styles image.
