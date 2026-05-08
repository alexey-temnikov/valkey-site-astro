// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { remarkRewriteMdLinks } from "./src/remark/rewrite-md-links.mjs";

export default defineConfig({
  site: "http://127.0.0.1:4322",

  markdown: {
    remarkPlugins: [remarkRewriteMdLinks],
  },

  redirects: {
    "/glide/": "/glide/index.html",

    // Case-preservation parity with valkey.io (Zola's `slugify = safe`).
    // Starlight lowercases content-collection slugs, so capitalized URLs
    // 404 on case-sensitive servers. Redirect to the lowercased slug.
    "/authors/Shirkulk007/": "/authors/shirkulk007/",
    "/topics/ARM/": "/topics/arm/",
    "/topics/RDMA/": "/topics/rdma/",

    // Dot-in-slug: Zola kept `/topics/valkey.conf/`; Starlight strips the
    // dot to `/topics/valkeyconf/`. Redirect the reference URL to where the
    // content now lives.
    "/topics/valkey.conf/": "/topics/valkeyconf/",

    // Blog date-prefix: the source markdown uses `slug: go-client-in-public-preview`
    // in frontmatter, so target renders at /blog/go-client-in-public-preview/.
    // Reference URL still points at the dated slug — redirect to the canonical
    // target URL.
    "/blog/2025-03-4-go-client-in-public-preview/":
      "/blog/go-client-in-public-preview/",
  },

  integrations: [
    starlight({
      title: "Valkey",
      favicon: "/img/favicon.svg",
      editLink: {
        baseUrl: "https://github.com/valkey-io/valkey-doc/edit/main/",
      },
      customCss: ["./src/styles/valkey-brand.css"],
      components: {
        Header: "./src/components/SiteHeader.astro",
        Banner: "./src/components/AnnouncementBanner.astro",
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/valkey-io",
        },
      ],
      sidebar: [
        {
          label: "Get Started",
          items: [
            { label: "Quick Start", slug: "topics/quickstart" },
            { label: "Installation", slug: "topics/installation" },
            { label: "Introduction", slug: "topics/introduction" },
          ],
        },
        {
          label: "Topics",
          collapsed: false,
          items: [{ autogenerate: { directory: "topics" } }],
        },
        {
          label: "Reference",
          items: [
            { label: "Command Reference", link: "/commands/" },
            { label: "Client Libraries", link: "/clients/" },
            { label: "Valkey GLIDE ↗", link: "/glide/", attrs: { target: "_blank" } },
          ],
        },
      ],
    }),
  ],
});
