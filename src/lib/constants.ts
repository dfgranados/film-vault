export const rollStatuses = [
  "planned",
  "exposed",
  "scanned",
  "complete",
] as const;

export type RollStatus = (typeof rollStatuses)[number];

export const STATUS_LABELS: Record<string, string> = {
  planned: "Planned",
  exposed: "Exposed",
  scanned: "Scanned",
  complete: "Complete",
};

export const STATUS_COLORS: Record<string, string> = {
  planned: "bg-zinc-100 text-zinc-700",
  exposed: "bg-amber-100 text-amber-800",
  scanned: "bg-blue-100 text-blue-800",
  complete: "bg-emerald-100 text-emerald-800",
};

export const PLATFORMS = [
  "Instagram",
  "Bluesky",
  "Twitter/X",
  "Threads",
  "Facebook",
  "Other",
] as const;
