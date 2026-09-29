import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getExperienceSlugs } from "@/lib/experiences";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = [
    { path: "/", priority: 1.0, freq: "weekly" as const },
    { path: "/services", priority: 0.9, freq: "monthly" as const },
    { path: "/pricing", priority: 0.9, freq: "monthly" as const },
    { path: "/about", priority: 0.7, freq: "monthly" as const },
    { path: "/experiences", priority: 0.9, freq: "weekly" as const },
    { path: "/consultation", priority: 0.9, freq: "monthly" as const },
  ];

  const experienceRoutes = getExperienceSlugs().map((slug) => ({
    url: `${site.url}/experiences/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    ...staticRoutes.map((r) => ({
      url: `${site.url}${r.path}`,
      lastModified: now,
      changeFrequency: r.freq,
      priority: r.priority,
    })),
    ...experienceRoutes,
  ];
}
