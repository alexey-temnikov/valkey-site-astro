import { visit } from 'unist-util-visit';

/**
 * Rewrite legacy Zola-style markdown links to Astro routes.
 *
 * Catches both inline `[text](foo.md)` links and reference-style
 * `[id]: foo.md` definitions so that topic docs ported verbatim from the
 * Zola site don't emit dead `.md` hrefs at build time.
 *
 * Pattern:   (./|../)?(topics/|commands/)?<slug>.md(#anchor)?
 * Rewrites:  /topics/<slug>/#anchor  or /commands/<slug>/#anchor
 *
 * Links whose target path includes `/commands/` are routed to
 * `/commands/<slug>/`; everything else defaults to `/topics/<slug>/`,
 * which matches the Starlight route layout (see astro.config.mjs sidebar).
 */
const MD_LINK_RE = /^(?:\.\.?\/)?(?:topics\/|commands\/)?([a-z0-9._-]+)\.md(#[^#]*)?$/i;

function rewrite(url) {
  const m = MD_LINK_RE.exec(url);
  if (!m) return null;
  const slug = m[1];
  const hash = m[2] ?? '';
  const prefix = url.includes('commands/') ? '/commands/' : '/topics/';
  return `${prefix}${slug}/${hash}`;
}

export function remarkRewriteMdLinks() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type !== 'link' && node.type !== 'definition') return;
      if (typeof node.url !== 'string') return;
      const replacement = rewrite(node.url);
      if (replacement !== null) node.url = replacement;
    });
  };
}
