import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context: { site?: string | URL }) {
  const events = (await getCollection("events")).sort(
    (a: any, b: any) => b.data.date.getTime() - a.data.date.getTime()
  );
  return rss({
    title: "Valkey Events",
    description: "Conferences, meetups, and community gatherings for the Valkey ecosystem.",
    site: context.site ?? "http://127.0.0.1:4322",
    items: events.map((ev: any) => ({
      title: ev.data.title,
      description: ev.data.location ?? ev.data.title,
      pubDate: ev.data.date,
      // Third-party events link directly to the external URL; first-party events
      // link to the internal page. Matches how the listing card `url` is built.
      link: ev.data.external_url ?? `/events/${ev.id}/`,
    })),
    customData: `<language>en-us</language>`,
  });
}
