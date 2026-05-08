import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve("..");
const DOC_ROOT = path.join(REPO_ROOT, "valkey-doc");

// Each repo exposes src/commands/*.json
const SOURCES = [
  { name: "valkey", root: path.join(REPO_ROOT, "valkey") },
  { name: "valkey-bloom", root: path.join(REPO_ROOT, "valkey-bloom") },
  { name: "valkey-json", root: path.join(REPO_ROOT, "valkey-json") },
  { name: "valkey-search", root: path.join(REPO_ROOT, "valkey-search") },
];

const MODULE_PREFIXES: Record<string, string> = {
  "bf.": "valkey-bloom",
  "cms.": "valkey-bloom",
  "cf.": "valkey-bloom",
  "topk.": "valkey-bloom",
  "tdigest.": "valkey-bloom",
  "json.": "valkey-json",
  "ft.": "valkey-search",
};

export type CommandArg = {
  name?: string;
  type?: string;
  display_text?: string;
  token?: string;
  optional?: boolean;
  multiple?: boolean;
  arguments?: CommandArg[];
  summary?: string;
  command?: string;
  since?: string;
  deprecated_since?: string;
  key_spec_index?: number;
  multiple_token?: boolean;
};

export type CommandJson = {
  summary?: string;
  complexity?: string;
  group?: string;
  since?: string;
  module_since?: string;
  arity?: number;
  function?: string;
  command_flags?: string[];
  acl_categories?: string[];
  deprecated_since?: string;
  replaced_by?: string;
  history?: [string, string][];
  container?: string;
  arguments?: CommandArg[];
  reply_schema?: unknown;
  [k: string]: unknown;
};

export type Command = {
  slug: string; // filename without .json, e.g. "cluster-info", "bf.add"
  title: string; // display name, e.g. "CLUSTER INFO", "BF.ADD"
  name: string; // top-level key in JSON
  container?: string; // for subcommands
  group: string;
  data: CommandJson;
  description: string; // raw markdown from valkey-doc/commands/<slug>.md
  resp2Reply?: string; // joined markdown
  resp3Reply?: string;
  source: string; // which repo produced this
};

// ---------- low-level loaders ----------
function tryReadJson(fp: string): Record<string, CommandJson> | null {
  try {
    const raw = fs.readFileSync(fp, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function tryReadText(fp: string): string {
  try {
    return fs.readFileSync(fp, "utf8");
  } catch {
    return "";
  }
}

function titleFromSlug(slug: string): string {
  // cluster-info → CLUSTER INFO, bf.add → BF.ADD, json.get → JSON.GET
  return slug.toUpperCase().replace(/-/g, " ");
}

function loadOnce(): {
  commands: Command[];
  groups: Record<string, { display: string; description: string }>;
  modules: any;
} {
  const groupsPath = path.join(DOC_ROOT, "groups.json");
  const groups = fs.existsSync(groupsPath)
    ? JSON.parse(fs.readFileSync(groupsPath, "utf8"))
    : {};
  const modulesPath = path.join(DOC_ROOT, "modules.json");
  const modules = fs.existsSync(modulesPath)
    ? JSON.parse(fs.readFileSync(modulesPath, "utf8"))
    : {};

  const resp2 = tryReadJson(path.join(DOC_ROOT, "resp2_replies.json")) ?? {};
  const resp3 = tryReadJson(path.join(DOC_ROOT, "resp3_replies.json")) ?? {};

  // Rewrite legacy Zola-style "../topics/foo.md" → "/topics/foo/" so links
  // resolve in the new site. Also rewrite "topics/foo.md" (without ..).
  function rewriteReply(reply: string[] | undefined): string | undefined {
    if (!reply) return undefined;
    return reply
      .map((line) =>
        line
          .replace(/\((?:\.\.\/)?topics\/([a-z0-9._-]+)\.md(#[^)]*)?\)/gi, "(/topics/$1/$2)")
          .replace(/\((?:\.\.\/)?commands\/([a-z0-9._-]+)\.md(#[^)]*)?\)/gi, "(/commands/$1/$2)")
      )
      .join("\n");
  }

  // Within a command description, links look like `[FOO](foo.md)` or
  // `[topic](../topics/foo.md)`. Rewrite to site-relative URLs.
  function rewriteDescription(text: string): string {
    return text
      .replace(
        /\]\(\s*(?:\.\.\/)?topics\/([a-z0-9._-]+)\.md(#[^)]*)?\s*\)/gi,
        "](/topics/$1/$2)"
      )
      .replace(
        /\]\(\s*(?:\.\.\/)?commands\/([a-z0-9._-]+)\.md(#[^)]*)?\s*\)/gi,
        "](/commands/$1/$2)"
      )
      // Sibling command refs like [FOO](foo.md)
      .replace(
        /\]\(\s*([a-z0-9._-]+)\.md(#[^)]*)?\s*\)/gi,
        "](/commands/$1/$2)"
      );
  }

  const docsCommandsDir = path.join(DOC_ROOT, "commands");
  const out: Command[] = [];

  // Walk each repo's src/commands and produce a Command if we have a matching
  // description file in valkey-doc/commands.
  for (const { name: sourceName, root } of SOURCES) {
    const cmdDir = path.join(root, "src", "commands");
    if (!fs.existsSync(cmdDir)) continue;
    for (const file of fs.readdirSync(cmdDir)) {
      if (!file.endsWith(".json")) continue;
      const slug = file.replace(/\.json$/, "");
      // Must also have a description
      const descPath = path.join(docsCommandsDir, `${slug}.md`);
      if (!fs.existsSync(descPath)) continue;
      const parsed = tryReadJson(path.join(cmdDir, file));
      if (!parsed) continue;
      const key = Object.keys(parsed)[0];
      const data = parsed[key];
      if (!data) continue;
      const container = data.container;
      const title = container
        ? `${container} ${key}`.toUpperCase()
        : titleFromSlug(slug);

      out.push({
        slug,
        title,
        name: key,
        container,
        group: data.group ?? "generic",
        data,
        description: rewriteDescription(tryReadText(descPath)),
        resp2Reply: rewriteReply(resp2[title] as any),
        resp3Reply: rewriteReply(resp3[title] as any),
        source: sourceName,
      });
    }
  }

  return { commands: out, groups, modules };
}

// Cache for single Astro build
let _cache: ReturnType<typeof loadOnce> | null = null;
export function getCommandData() {
  if (!_cache) _cache = loadOnce();
  return _cache;
}

// ---------- helpers for rendering ----------
export function moduleFor(slug: string, modules: any) {
  for (const [prefix, _repo] of Object.entries(MODULE_PREFIXES)) {
    if (slug.startsWith(prefix)) {
      const key = _repo.replace("-", "_"); // valkey-bloom → valkey_bloom
      return modules[key];
    }
  }
  return null;
}

// Render argument array to a short usage string, matching Zola's commands.html macro
export function argsToUsage(args: CommandArg[] | undefined): string {
  if (!args?.length) return "";
  const parts: string[] = [];
  for (const a of args) {
    let s = "";
    if (a.token) s += a.token + " ";
    if (a.display_text) s += a.display_text;
    else if (a.name) s += a.name;
    else if (a.arguments) s += argsToUsage(a.arguments);
    else if (a.type) s += `<${a.type}>`;
    if (a.multiple) s += " ...";
    if (a.optional) s = `[${s.trim()}]`;
    if (s.trim()) parts.push(s.trim());
  }
  return parts.join(" ");
}

export function groupedCommands(): Record<string, Command[]> {
  const { commands } = getCommandData();
  const byGroup: Record<string, Command[]> = {};
  for (const c of commands) {
    if (!byGroup[c.group]) byGroup[c.group] = [];
    byGroup[c.group].push(c);
  }
  for (const key of Object.keys(byGroup)) {
    byGroup[key].sort((a, b) => a.title.localeCompare(b.title));
  }
  return byGroup;
}

// For getStaticPaths: produces { params: { command: slug }, props: { command } }
export function commandPaths() {
  const { commands } = getCommandData();
  return commands.map((c) => ({
    params: { command: c.slug },
    props: { command: c },
  }));
}
