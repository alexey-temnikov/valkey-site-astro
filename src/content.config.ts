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
    handle: z.string().optional(),
    name: z.string(),
    bio: z.string().optional().default(""),
    image: z.string().optional(),
    github: z.string().optional(),
    twitter: z.string().optional(),
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
  schema: z.any(),
});

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  blog,
  authors,
  releases,
  community,
  events,
};
