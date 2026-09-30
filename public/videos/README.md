# Hero video

The homepage hero expects a looping cinematic clip at:

    public/videos/staylocal-hero.mp4

Recommended encoding:
- 1920×1080 (or 1280×720 for smaller file size), 24–30 fps
- Duration: 8–15 s, seamless loop
- Codec: H.264 (baseline/main profile) for broad mobile support
- Bitrate: aim for ≤ 3 Mbps so mobile networks load it quickly
- Muted (no audio track needed — the player is force-muted)

If this file is missing, the hero gracefully falls back to
`public/images/hero-poster.jpg` and then to the current remote fallback
image. No code changes needed to swap in the real asset — just drop the
mp4 at the path above.
