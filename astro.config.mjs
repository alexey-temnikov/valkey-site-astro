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
        Header: "./src/components/starlight/Header.astro",
        Banner: "./src/components/starlight/Banner.astro",
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
