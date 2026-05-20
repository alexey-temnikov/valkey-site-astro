/**
 * Extract up to two initials from a display name.
 * Handles single-word names (one letter) and empty strings gracefully.
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");
}
