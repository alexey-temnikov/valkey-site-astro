# Valkey Astro + Starlight — full migration

Complete migration of the Valkey.io website from Zola to Astro + Starlight,
unifying the marketing site, Valkey docs, command reference, client libraries,
blog, and GLIDE docs under one domain with one search index.

## Run it

```bash
cd valkey-site-astro
pnpm install
pnpm build
python3 -m http.server 4322 --bind 127.0.0.1 --directory dist
# → http://127.0.0.1:4322/
```

Dev server (Vite HMR):
```bash
pnpm dev --host 127.0.0.1 --port 4321
```

## Parity with valkey.io

Verified against `https://valkey.io/` via chrome-devtools:

| Item | valkey.io | This build |
|---|---|---|
| Page title | "Valkey" | ✓ "Valkey" |
| Hero H1s | "FAST. RELIABLE." / "OPEN SOURCE, FOREVER." | ✓ same |
| Hero subtitle + CTA | ✓ | ✓ same |
| Doc cards (4) | Install / Usage / API / Clients | ✓ same |
| Participants section | 17 logos | ✓ 17 logos |
| Newsletter form | LF mailman | ✓ LF mailman POST |
| Announcement banner | Valkey 9.0 | ✓ + 24h localStorage dismiss |
| Top nav | Download / Docs / Blog / Community / Participants / Try Valkey / GitHub | ✓ same |
| GitHub star badge | "25.7k ★" | ✓ live from GH API, localStorage cache |
| Footer | 4-col, dark, socials, LF | ✓ same |
| Body font | Open Sans | ✓ same |

## Content inventory

| Kind | Count | Source |
|---|---:|---|
| Astro pages | 551 | `pnpm build` |
| Topic docs | 78 | mirrored from `../valkey-doc/topics/` |
| Command pages | 398 | generated from 4 repos × JSON + docs |
| Command groups | 20 | `../valkey-doc/groups.json` |
| Blog posts | 26 | ported from Zola `content/blog/` |
| Client libraries | 12 | walked from `../valkey-doc/clients/*/` |
| Participant companies | 17 | `_data/participants.yml` |
| Pagefind-indexed HTML | 656 | includes 105 GLIDE pages at `/glide/` |

## Architecture

```
valkey-site-astro/
├── astro.config.mjs              # Starlight wiring, sidebar, /glide redirect
├── public/
│   ├── fonts/ (4 families)       # Open Sans / Condensed / Noto Serif / Fira Mono
│   ├── img/ (38)                 # logos, icons, hero-bg
│   ├── assets/blog/<slug>/       # blog post images
│   ├── robots.txt
│   └── glide → ../../valkey-io.github.io/static/glide
├── src/
│   ├── content/
│   │   ├── blog/*.md             # 26 posts, YAML frontmatter
│   │   └── docs/topics/*.md      # 78 topics (Starlight collection)
│   ├── content.config.ts         # docs + blog collections
│   ├── pages/
│   │   ├── index.astro           # homepage: hero → docs → participants → newsletter
│   │   ├── docs/index.astro      # /docs/ hub (4 cards)
│   │   ├── commands/
│   │   │   ├── index.astro       # grouped by groups.json, jump nav
│   │   │   └── [command].astro   # dynamic page: meta + desc + RESP2/3 replies
│   │   ├── clients/index.astro   # grouped by language, feature matrix
│   │   ├── blog/
│   │   │   ├── index.astro       # featured + grid
│   │   │   ├── [slug].astro      # per-post render
│   │   │   └── rss.xml.ts        # RSS feed
│   │   ├── participants/index.astro
│   │   ├── try-valkey/index.astro  # working mock REPL
│   │   ├── download/, community/, events/, search/
│   ├── layouts/
│   │   └── MarketingLayout.astro   # SEO meta, OG, GTM, Osano hooks
│   ├── components/
│   │   ├── AnnouncementBanner.astro
│   │   ├── SiteHeader.astro        # mobile menu, active state, GH stars
│   │   ├── SiteFooter.astro
│   │   └── starlight/
│   │       ├── Header.astro        # overrides Starlight header
│   │       └── Banner.astro        # overrides Starlight banner
│   ├── lib/
│   │   └── commands.ts             # 4-repo data loader, link rewriter
│   ├── data/
│   │   └── participants.json       # from _data/participants.yml
│   └── styles/
│       └── valkey-brand.css        # colors, fonts, hero, nav, footer
```

## Key design decisions

1. **One Starlight content collection for docs, pages for marketing.**
   `src/content/docs/topics/*` is a Starlight collection (auto-sidebar, TOC,
   search, edit-on-GitHub). `src/pages/*` are plain Astro marketing pages.
2. **Starlight component overrides reuse the marketing chrome.**
   `components.Header` and `components.Banner` in `astro.config.mjs` point at
   wrapper files that render the same `SiteHeader` / `AnnouncementBanner`
   used by the marketing pages. Result: identical chrome everywhere.
3. **Commands generated, not ported.** `src/pages/commands/[command].astro`
   uses `getStaticPaths()` to enumerate every JSON in all 4 repos'
   `src/commands/` and merges with the corresponding Markdown description
   from `../valkey-doc/commands/`. Links inside RESP replies and descriptions
   are rewritten from Zola-style `../topics/foo.md` to `/topics/foo/`.
4. **GLIDE via public/ symlink.** `public/glide/` symlinks to the pre-built
   Starlight dist from the `valkey-glide-docs` project. Zero coupling, still
   indexed by our Pagefind.
5. **One Pagefind index covers everything.** Marketing pages, Valkey docs,
   commands, blog, AND GLIDE — all 656 HTML files are in the same index.
   ⌘K opens the same dialog site-wide.
6. **Brand via CSS custom properties.** Overriding `--sl-color-*` variables
   makes Starlight inherit the Valkey palette without forking its theme.
7. **SEO + analytics gated by prod.** GTM and Osano scripts only emit when
   `import.meta.env.PROD` is true, keeping dev clean.

## Known rough edges

- **~413 legacy `.md` links** inside ported topic content point to other
  topics with `./foo.md` style. These are inherited from `valkey-doc` and
  rendered as broken by Starlight. Fix: either a content-level rewrite
  pass mirroring what `src/lib/commands.ts::rewriteDescription` does, or
  Starlight's `links-validator` plugin to catch them at build time.
- **Dev-server `/glide/*/` trailing-slash 404.** Starlight's catchall
  intercepts before Astro's public/ static fallback. Works in production
  (any web server with directory-index behavior handles `/glide/overview/`
  → `/glide/overview/index.html`). Current dev workaround: the /glide/
  redirect in `astro.config.mjs`.
- **Leadership page** not yet ported (Zola has `content/leadership.md`).
- **Events pages** use placeholder only — Zola's `content/events/<slug>/`
  directories haven't been converted to a collection.
- **Community sub-pages** (meetups, conferences, QCon, …) similarly stubbed.

## Timeline to finish

Remaining work to reach full feature-parity with valkey.io:

| Chunk | Estimate |
| --- | --- |
| Fix 413 legacy topic `.md` links via a rewrite pass | 1 hour |
| Port events + community sub-pages as collections | 0.5 day |
| Leadership + author pages | 0.5 day |
| Real Try Valkey terminal (WebSocket → sandbox) | 1–3 days |
| Full SCSS port for pixel-perfect parity | 1–2 days |
| Osano key + GTM wiring + consent integration | 0.5 day |
| CI/CD pipeline + deploy config | 0.5 day |
| **Total** | **~4–6 days** |

## Comparing with the live site

Use chrome-devtools to diff:
```bash
# Compare head-to-head structure:
open http://127.0.0.1:4322/     # local prototype
open https://valkey.io/         # reference
```

Both should show identical title, H1s, H2 section order, card counts,
logo count, nav items, GitHub star badge. Sub-sections like blog posts
and individual commands should look the same. GLIDE subsection at
`/glide/overview/` is shared between both sites — serving from the same
pre-built output.
