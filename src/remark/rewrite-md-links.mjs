import { visit } from 'unist-util-visit';

export function remarkRewriteMdLinks() {
  return (tree) => {
    visit(tree, 'link', (node) => {
      const m = /^(?:\.\.?\/)?(?:topics\/|commands\/)?([a-z0-9._-]+)\.md(#[^#]*)?$/i.exec(node.url);
      if (!m) return;
      const slug = m[1];
      const hash = m[2] ?? '';
      if (node.url.includes('commands/')) node.url = `/commands/${slug}/${hash}`;
      else node.url = `/topics/${slug}/${hash}`;
    });
  };
}
