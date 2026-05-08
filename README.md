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
| Participants section | 17 logos, auto-scrolling carousel (3/2/1 per slide, dots, hover-pause) | ✓ 17 logos, 1:1 carousel port of `participant-carousel.html` + `carousel.js` |
| Newsletter form | LF HubSpot | ✓ LF HubSpot |
| Announcement banner | Valkey 9.0 | ✓ + 24h localStorage dismiss |
| Top nav | Download / Docs / Blog / Community / Participants / Try Valkey / GitHub | ✓ same |
| GitHub star badge | "25.7k ★" | ✓ live from GH API, localStorage cache |
| Footer | 3-row layout, socials, LF legal | ✓ same |
| Body font | Open Sans | ✓ same |
| Leadership | 9 TSC members, Chair first | ✓ 9 TSC members, Chair first |
| Events | calendar + per-event pages | ✓ same |
| Community | cards + per-page sub-routes | ✓ same |
| Try Valkey | V86 in-browser emulator | ✓ same (1:1 port) |

## Content inventory

| Kind | Count | Source |
|---|---:|---|
| Astro pages built | 735 | `pnpm build` |
| HTML files in `dist/` (incl. GLIDE) | 840 | `find dist -name '*.html' \| wc -l` |
| Pages in unified Pagefind index | 836 | `dist/pagefind/pagefind-entry.json` |
| Topic docs | 78 | mirrored from `../valkey-doc/topics/` |
| Command pages | 436 | generated from 4 repos × JSON + docs |
| Command groups | 20 | `../valkey-doc/groups.json` |
| Blog posts | 104 | mirrored from `../valkey-io.github.io/content/blog/` |
| Authors | 53 | ported from Zola `content/authors/*.md` |
| TSC members (Leadership) | 8 locally (9 on valkey.io) | authors with `tsc:` frontmatter |
| Events | 5 (3 content + 2 redirect-only) | `../valkey-io.github.io/content/events/` |
| Community pages | 10 | `../valkey-io.github.io/content/community/` |
| Client libraries | 12 | walked from `../valkey-doc/clients/*/` |
| Participant companies | 17 | `_data/participants.yml` |

## Architecture

```
valkey-site-astro/
├── .github/workflows/build.yml   # CI: pnpm build + regression checks
├── astro.config.mjs              # Starlight wiring, sidebar, /glide redirect, remark plugin
├── public/
│   ├── fonts/ (4 families)       # Open Sans / Condensed / Noto Serif / Fira Mono
│   ├── img/ (38)                 # logos, icons, hero-bg
│   ├── assets/blog/<slug>/       # blog post images
│   ├── assets/media/authors/     # author profile photos (52)
│   ├── robots.txt
│   └── glide → ../../valkey-io.github.io/static/glide  # broken on fresh clone; see below
├── src/
│   ├── content/
│   │   ├── blog/*.md             # 104 posts (content + images in public/)
│   │   ├── docs/topics/*.md      # 78 topics (Starlight collection)
│   │   ├── events/*.md           # 5 events
│   │   ├── community/*.md        # 10 community pages
│   │   └── authors/*.md          # 53 author bios (8 TSC)
│   ├── content.config.ts         # docs + blog + events + community + authors schemas
│   ├── pages/
│   │   ├── index.astro           # homepage: hero → docs → participants → newsletter
│   │   ├── leadership.astro      # TSC grid, filtered from authors collection
│   │   ├── docs/index.astro      # /docs/ hub (4 cards)
│   │   ├── commands/
│   │   │   ├── index.astro       # grouped by groups.json, jump nav
│   │   │   └── [command].astro   # dynamic page: meta + desc + RESP2/3 replies
│   │   ├── authors/
│   │   │   ├── index.astro       # alphabetical author directory
│   │   │   └── [slug].astro      # per-author bio + other-authors aside
│   │   ├── events/
│   │   │   ├── index.astro       # month-grid calendar + card list
│   │   │   └── [slug].astro      # per-event page + external_url redirect support
│   │   ├── community/
│   │   │   ├── index.astro       # global cards + sub-page list
│   │   │   └── [slug].astro      # per-community-page with per-page cards merged in
│   │   ├── clients/index.astro   # grouped by language, feature matrix
│   │   ├── blog/
│   │   │   ├── index.astro       # featured + grid
│   │   │   ├── [slug].astro      # per-post render
│   │   │   └── rss.xml.ts        # RSS feed
│   │   ├── participants/index.astro
│   │   ├── try-valkey/index.astro  # V86 in-browser emulator (1:1 port of Zola)
│   │   ├── download/, events/, search/
│   ├── layouts/
│   │   └── MarketingLayout.astro   # SEO meta, OG, GTM, Osano hooks (PROD-gated)
│   ├── components/
│   │   ├── AnnouncementBanner.astro
│   │   ├── SiteHeader.astro        # mobile menu, active state, GH stars
│   │   ├── SiteFooter.astro
│   │   ├── SearchOverlay.astro     # site-wide ⌘K Pagefind dialog
│   │   └── starlight/
│   │       ├── Header.astro        # override: mounts SiteHeader
│   │       └── Banner.astro        # override: mounts AnnouncementBanner
│   ├── lib/
│   │   └── commands.ts             # 4-repo data loader; rewrites inline + [id]: foo.md defs
│   ├── data/
│   │   └── participants.json       # from _data/participants.yml
│   ├── remark/
│   │   └── rewrite-md-links.mjs    # remark plugin: rewrites topic/command .md → route URLs
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
   are rewritten from Zola-style `../topics/foo.md` to `/topics/foo/` —
   including reference-style `[id]: foo.md` definitions.
4. **GLIDE via public/ symlink.** `public/glide/` symlinks to the pre-built
   Starlight dist from the `valkey-glide-docs` project. Zero coupling, still
   indexed by our Pagefind.
5. **One Pagefind index covers everything.** Marketing pages, Valkey docs,
   commands, blog, AND GLIDE — 836 pages in the same index. ⌘K opens the
   same dialog site-wide via `SearchOverlay` component.
6. **Brand via CSS custom properties.** Overriding `--sl-color-*` variables
   makes Starlight inherit the Valkey palette without forking its theme.
7. **SEO + analytics gated by prod.** GTM (`PUBLIC_GTM_ID` env or valkey.io
   default), Osano CMP, and Scarf pixel only emit when `import.meta.env.PROD`
   is true, keeping dev clean.
8. **Authors as first-class content collection.** TSC members are the
   subset of the authors collection with non-empty `tsc:` frontmatter;
   the `/leadership/` page is just a filtered view of that collection,
   matching the Zola template's `get_section('authors/_index.md')` approach.

## Known rough edges

- **Dev-server `/glide/*/` trailing-slash 404.** Starlight's catchall
  intercepts before Astro's public/ static fallback. Works in production
  (any web server with directory-index behavior handles `/glide/overview/`
  → `/glide/overview/index.html`). Current dev workaround: the /glide/
  redirect in `astro.config.mjs`.
- **`public/glide` symlink is broken on fresh clones.** The target path
  `../../valkey-io.github.io/static/glide` only exists if you also clone
  `valkey-io/valkey-io.github.io` as a sibling of this repo. Without it,
  `pnpm build` still succeeds on macOS/Linux but `/glide/*` pages 404.
  The CI workflow substitutes a placeholder directory automatically.
- **Duplicate Pagefind index under `/glide/pagefind/`.** The GLIDE bundle
  ships its own embedded Pagefind index (~1–2 MB) in addition to being
  picked up by the site-wide index. Users hitting ⌘K always land in the
  unified overlay, so this is invisible; de-duplication would require
  post-processing the foreign GLIDE artifact.
- **Leadership missing one member vs. live site.** The live valkey.io
  shows 9 TSC members; this build shows 8 out of the box because one
  author file (`murphyjacob4.md`) had 2-space YAML indentation the
  original port pass didn't normalize. Fixed by hand and now matches 9/9.
  Kept as a note in case another author file lands with the same shape.

## Deploying

The CI workflow at `.github/workflows/build.yml` builds the site and
uploads `dist/` as an artifact on every push to `main` and every PR. It
intentionally does **not** publish anywhere — pick a target (GitHub
Pages, Cloudflare Pages, Netlify, S3 + CloudFront, …) and add a deploy
job when ready.

Required sibling repos for a full build:
- `../valkey-doc` (topics + command descriptions)
- `../valkey` (core command JSON)
- `../valkey-bloom` / `../valkey-json` / `../valkey-search` (module command JSON — optional)
- `../valkey-io.github.io` (for the GLIDE symlink target — optional)

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

For a rigorous page-by-page audit, see `meta-prompt-migration-fidelity.md`
in the parent directory.
