/** Shared labels for the feedback feature. Safe for server and client code. */
export type FeedbackCategory = "feature" | "improvement" | "bug" | "other";
export type FeedbackStatus = "new" | "reviewing" | "planned" | "done" | "declined";

export const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  feature: "Feature request",
  improvement: "Improvement idea",
  bug: "Something's broken",
  other: "Other",
};

export const CATEGORY_HINTS: Record<FeedbackCategory, string> = {
  feature: "Something new you'd like to be able to do",
  improvement: "Make something that exists work better",
  bug: "Something isn't working as it should",
  other: "Anything else on your mind",
};

/** What the person who sent it sees. */
export const STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: "Received",
  reviewing: "Under review",
  planned: "Planned",
  done: "Shipped",
  declined: "Not planned",
};

export const STATUS_STYLES: Record<FeedbackStatus, string> = {
  new: "bg-cream-deep text-ink-2",
  reviewing: "bg-teal-tint text-teal",
  planned: "bg-gold-tint text-gold-deep",
  done: "bg-moss-tint text-moss-deep",
  declined: "bg-cream-deep text-ink-3",
};
