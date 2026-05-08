import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

const blog = defineCollection({
  loader: glob({ base: "src/content/blog", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    pubDate: z.string().or(z.date()).transform((v) => {
      if (v instanceof Date) return v;
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
      if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
      return new Date(v);
    }),
    description: z.string().optional().default(""),
    authors: z.array(z.string()).optional().default([]),
    types: z.array(z.string()).optional().default([]),
    featured: z.boolean().optional().default(false),
    heroImage: z.string().optional(),
  }),
});

const authors = defineCollection({
  loader: glob({ base: "src/content/authors", pattern: "**/*.md" }),
  schema: z.object({
    name: z.string(),
    photo: z.string().optional(),
    github: z.string().optional(),
    twitter: z.string().optional(),
    // TSC members carry an extra block (mirrors Zola's `extra.tsc`).
    // The leadership page filters author entries by `tsc != null` to build
    // the committee roster.
    tsc: z
      .object({
        affiliation: z.string().optional(),
        position: z.string().optional(),
      })
      .optional(),
  }),
});

const releases = defineCollection({
  loader: glob({ base: "src/content/releases", pattern: "**/*.md" }),
  schema: z.any(),
});

const community = defineCollection({
  loader: glob({ base: "src/content/community", pattern: "**/*.md" }),
  schema: z.any(),
});

const events = defineCollection({
  loader: glob({ base: "src/content/events", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    // Parse YYYY-MM-DD as local noon to avoid UTC midnight → -1 day shift.
    // Mirrors the transform used by `blog.pubDate` above.
    date: z.string().or(z.date()).transform((v) => {
      // YAML parses an unquoted `date: 2025-08-28` as a Date at UTC midnight.
      // In any western TZ, the day-of-month then shifts back by one when
      // formatted with local accessors. Reconstruct at local noon in both
      // branches so `getDate()` / `getMonth()` return the authored day.
      if (v instanceof Date) {
        return new Date(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate(), 12, 0, 0);
      }
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
      if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
      return new Date(v);
    }),
    event_type: z.enum(["first-party", "third-party"]).optional().default("first-party"),
    event_logo: z.string().optional(),
    location: z.string().optional(),
    location_url: z.string().optional(),
    body_class: z.string().optional(),
    // When present, /events/{slug}/ emits a meta-refresh redirect to this URL,
    // and the listing card links here directly. Matches Zola's `extra.external_url`.
    external_url: z.string().url().optional(),
    // Optional credit / attribution rendered in the event footer. Matches Zola's `extra.footer_add`.
    footer_add: z.string().optional(),
  }),
});

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  blog,
  authors,
  releases,
  community,
  events,
};
