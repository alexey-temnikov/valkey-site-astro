/**
 * Performance dashboards metadata.
 *
 * Ported 1-1 from `valkey-io.github.io/_data/perf.toml`. The homepage
 * "Performance" card (src/pages/index.astro) and — once ported — the
 * `/performance/` page both read from this file so a single edit propagates.
 *
 * `title` and `description` may contain inline markdown (bold/italic) but not
 * links, same as the Zola contract. Rendering is done via `marked` at the
 * consumer site.
 */

export interface PerfDashboard {
  title: string;
  description: string;
  link: string;
}

export interface PerfSection {
  title: string;
  iframe_url: string;
  description: string;
  methodology?: string;
}

export const dashboards: PerfDashboard[] = [
  {
    title: "Valkey Performance Dashboards",
    description:
      "Valkey Performance Dashboards provide a consolidated view of throughput trends across versions, helping teams validate improvements and identify regressions.",
    link: "/performance/",
  },
];

/**
 * Sections rendered on /performance/. Order matches the source file.
 */
export const sections: PerfSection[] = [
  {
    title: "Throughput Across Versions",
    iframe_url:
      "https://perf-dashboard.valkey.io/public-dashboards/38ad683dbd06456c829b547d97e2b7da",
    description:
      "This dashboard visualizes throughput trends across Valkey versions. It helps compare key releases side by side, highlight performance gains from new features. Read more about [Unlocking 1 Million RPS in Valkey](/blog/unlock-one-million-rps/).",
    methodology:
      "These metrics are generated using the [valkey-perf-benchmark](https://github.com/valkey-io/valkey-perf-benchmark) tool an AWS `c8g.metal-48xl` instance, running a matrix of configurations that vary pipelining (1, 10), I/O threading (1, 9), and with a data size of 512 bytes. To further stabilize results, we apply IRQ tuning by pinning network interrupts away from CPUs dedicated to the server process, and we isolate the server and benchmark client on separate NUMA nodes to remove L3 cache contention.",
  },
];
