import type { CollectionEntry } from "astro:content";

type BlogPost = CollectionEntry<"blog">;

/**
 * Slug used in the public URL for a blog post. Frontmatter `slug` wins; the
 * fallback strips the YYYY-MM-DD prefix that the source filenames use.
 */
export function postSlug(post: BlogPost): string {
  return post.data.slug ?? post.id.replace(/^\d{4}-\d{2}-\d{2}-/, "");
}

export function postHref(post: BlogPost): string {
  return `/blog/${postSlug(post)}/`;
}

/**
 * Locale-formatted blog post date. The "long" style is used in featured cards
 * and on the post itself; "short" is used in card grids and sidebars.
 */
export function formatPostDate(date: Date, style: "long" | "short" | "weekday" = "long"): string {
  const opts: Intl.DateTimeFormatOptions =
    style === "weekday"
      ? { weekday: "long", month: "long", day: "numeric", year: "numeric" }
      : style === "short"
        ? { month: "short", day: "numeric", year: "numeric" }
        : { month: "long", day: "numeric", year: "numeric" };
  return date.toLocaleDateString("en-US", opts);
}
