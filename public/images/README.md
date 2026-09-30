# Hero poster

The homepage hero uses a still image as the video's poster and as the
still fallback when a user prefers reduced motion or the video is
unavailable:

    public/images/hero-poster.jpg

Recommended:
- 1920×1080 (or larger, will scale down)
- JPG, ≤ 250 KB
- Should match the first frame of `videos/staylocal-hero.mp4` for a
  seamless handoff when the video finishes buffering.

If this file is missing, the hero uses a remote fallback image defined
in `components/site/hero.tsx` (`HERO_FALLBACK`). Drop the file at the
path above to activate — no code change needed.
