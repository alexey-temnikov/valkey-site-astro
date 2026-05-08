/**
 * Helper to load and process release content files via import.meta.glob.
 *
 * Parity contract with the Zola reference (valkey-io.github.io):
 *   - `templates/download.html` iterates `releases | reverse` where releases
 *     are sorted by `title`. Because titles are semver strings, reversing a
 *     title-sort produces a descending-by-version listing.
 *   - Permalinks are `/download/releases/v{tag-with-dots-as-dashes}/` — e.g.
 *     `v9-0-4`, `v9-0-0-rc1`.
 *   - Release dates render as `YYYY-MM-DD`.
 *
 * We implement that contract explicitly here (semver compare, slug, format)
 * rather than leaning on JS sort-by-Date, which silently broke tied-date
 * ordering in the first port and picked 8.0.9 over 8.1.7 as the "latest" 8.x.
 */

export interface Release {
  tag: string;
  title: string;
  date: string;
  artifact_source: string;
  artifact_fname: string;
  container_registry?: {
    name: string;
    link: string;
    id: string;
    tags: string[];
  }[];
  packages?: { name: string; id: string; url?: string }[];
  artifacts?: { distro: string; arch: string[] }[];
}

/** Parsed semver pieces used for comparison. */
interface ParsedVersion {
  parts: number[]; // [major, minor, patch, ...]
  pre: string | null; // "rc1", "rc2", "alpha.1", ... or null for stable
}

/**
 * Parse a Valkey release tag into sortable pieces.
 *
 * Examples:
 *   "9.0.4"      -> { parts: [9, 0, 4],  pre: null }
 *   "9.0.0-rc3"  -> { parts: [9, 0, 0],  pre: "rc3" }
 *   "9.1.0-rc1"  -> { parts: [9, 1, 0],  pre: "rc1" }
 */
export function parseVersion(tag: string): ParsedVersion {
  const [core, ...preRest] = tag.split("-");
  const parts = core.split(".").map((s) => {
    const n = Number.parseInt(s, 10);
    return Number.isFinite(n) ? n : 0;
  });
  const pre = preRest.length > 0 ? preRest.join("-") : null;
  return { parts, pre };
}

/**
 * Semver comparator. Negative when `a` should come before `b` in an ascending
 * sort. Stable releases rank higher than their pre-releases (so 9.0.0 > 9.0.0-rc3).
 * Date is a final tiebreaker so that identical tags (shouldn't happen) remain
 * deterministic.
 */
export function compareVersionAsc(a: Release, b: Release): number {
  const pa = parseVersion(a.tag);
  const pb = parseVersion(b.tag);
  const len = Math.max(pa.parts.length, pb.parts.length);
  for (let i = 0; i < len; i++) {
    const da = pa.parts[i] ?? 0;
    const db = pb.parts[i] ?? 0;
    if (da !== db) return da - db;
  }
  // Pre-release handling: a release with no pre-release tag ranks HIGHER
  // (is "larger") than the same version with one. So in ascending order,
  // rc1 < rc2 < <stable>.
  if (pa.pre !== pb.pre) {
    if (pa.pre === null) return 1;
    if (pb.pre === null) return -1;
    if (pa.pre < pb.pre) return -1;
    if (pa.pre > pb.pre) return 1;
  }
  return new Date(a.date).getTime() - new Date(b.date).getTime();
}

export function parseReleases(
  modules: Record<string, { frontmatter: Record<string, any> }>,
): Release[] {
  return Object.values(modules).map((m) => {
    const fm = m.frontmatter as Record<string, any>;
    // YAML parsers coerce unquoted ISO-8601 dates into JS Date objects; coerce
    // back to ISO string so downstream code sees a consistent `string` shape.
    const date = fm.date instanceof Date ? fm.date.toISOString() : String(fm.date);
    return { ...(fm as Release), date };
  });
}

export function isStable(r: Release): boolean {
  // The tag field never contains dots in its pre-release portion in this
  // project, so a hyphen is a reliable stable/pre marker.
  return !r.tag.includes("-");
}

export function majorVersion(r: Release): string {
  return r.tag.split(".")[0];
}

export function minorVersion(r: Release): string {
  const [major, minor] = r.tag.split(".");
  return `${major}.${minor}`;
}

/**
 * Sort releases by version descending (newest first).
 * Stable releases come before their pre-releases of the same version.
 */
export function sortDesc(releases: Release[]): Release[] {
  return [...releases].sort((a, b) => compareVersionAsc(b, a));
}

/**
 * Return the newest STABLE release for each major version, sorted with the
 * newest major first. Pre-releases (e.g. 9.1.0-rc2) are excluded because a
 * major line is only "supported" once a stable has shipped.
 */
export function latestPerMajor(releases: Release[]): Release[] {
  const sorted = sortDesc(releases.filter(isStable));
  const seen = new Set<string>();
  const result: Release[] = [];
  for (const r of sorted) {
    const major = majorVersion(r);
    if (!seen.has(major)) {
      seen.add(major);
      result.push(r);
    }
  }
  return result;
}

/**
 * Slug for per-release permalinks. Matches the Zola reference's default
 * slugger (`v8-0-1`, `v9-0-0-rc1`).
 */
export function slug(tagOrRelease: string | Release): string {
  const tag = typeof tagOrRelease === "string" ? tagOrRelease : tagOrRelease.tag;
  return `v${tag.replaceAll(".", "-")}`;
}

/** Format a release date as YYYY-MM-DD (UTC-stable, matches Zola output). */
export function formatDate(input: string | Date): string {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return String(input);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
