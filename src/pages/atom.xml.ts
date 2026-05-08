import { getCollection } from "astro:content";
import { postHref } from "../lib/blog";

/**
 * Site-wide Atom feed, served at /atom.xml.
 *
 * Parity note: in the Zola source (`templates/atom.xml`) the template filters
 * `{% if page.components[0] == "blog" %}`, so even though the feed is rooted
 * at the site (not at `/blog/`), its contents are only blog posts. We keep
 * that contract here so feed readers pointing at valkey.io/atom.xml continue
 * to receive the same entries.
 */

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function GET(context: { site?: string | URL }) {
  const site = (context.site ?? "http://127.0.0.1:4322").toString().replace(/\/$/, "");
  const posts = (await getCollection("blog")).sort(
    (a: any, b: any) => b.data.pubDate.getTime() - a.data.pubDate.getTime()
  );

  const entries = posts
    .map((post: any) => {
      const url = `${site}${postHref(post)}`;
      const pub = new Date(post.data.pubDate).toISOString();
      const authors = (post.data.authors?.length ? post.data.authors : ["Valkey contributors"])
        .map((a: string) => `    <author><name>${esc(a)}</name></author>`)
        .join("\n");
      const summary = post.data.description
        ? `    <summary type="html">${esc(post.data.description)}</summary>`
        : "";
      return `  <entry xml:lang="en">
    <title>${esc(post.data.title)}</title>
    <published>${pub}</published>
    <updated>${pub}</updated>
${authors}
    <link rel="alternate" type="text/html" href="${esc(url)}"/>
    <id>${esc(url)}</id>
${summary}
  </entry>`;
    })
    .join("\n");

  const updated = posts[0]
    ? new Date(posts[0].data.pubDate).toISOString()
    : new Date().toISOString();
  const feedUrl = `${site}/atom.xml`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en">
  <title>Valkey</title>
  <subtitle>News, technical deep dives, and updates from the Valkey community.</subtitle>
  <link rel="self" type="application/atom+xml" href="${esc(feedUrl)}"/>
  <link rel="alternate" type="text/html" href="${esc(site + "/")}"/>
  <generator uri="https://astro.build/">Astro</generator>
  <updated>${updated}</updated>
  <id>${esc(feedUrl)}</id>
${entries}
</feed>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/atom+xml; charset=utf-8" },
  });
}
