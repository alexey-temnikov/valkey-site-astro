import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { postHref } from "../../lib/blog";

export async function GET(context: { site?: string | URL }) {
  const posts = (await getCollection("blog")).sort(
    (a: any, b: any) => b.data.pubDate.getTime() - a.data.pubDate.getTime()
  );
  return rss({
    title: "Valkey Blog",
    description: "News, technical deep dives, and updates from the Valkey community.",
    site: context.site ?? "http://127.0.0.1:4322",
    items: posts.map((post: any) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: postHref(post),
    })),
    customData: `<language>en-us</language>`,
  });
}
