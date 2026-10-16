/**
 * What's new. Shown on the landing page so visitors can see the product is actively
 * maintained. Add the newest entry at the TOP when you ship something. Keep it factual:
 * every line should describe something that really exists in the app.
 */
export type ChangelogEntry = { date: string; title: string; detail: string };

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-10-14",
    title: "Share ideas and see what happens to them",
    detail: "Send a feature request or bug report from inside the app and follow its status as the team reviews it.",
  },
  {
    date: "2026-10-14",
    title: "Export your data",
    detail: "Download your habits, challenges and check-ins any time, as a JSON file or a spreadsheet-friendly CSV.",
  },
  {
    date: "2026-10-14",
    title: "More room on the Free plan",
    detail: "You can now keep up to 20 active habits at once, up from 10.",
  },
  {
    date: "2026-10-12",
    title: "Archive and restore for challenges",
    detail: "Tidy finished challenges away without losing any history, with clear limits and guidance.",
  },
  {
    date: "2026-10-12",
    title: "Account settings",
    detail: "Update your name, add an optional mobile number, or delete your account whenever you like.",
  },
  {
    date: "2026-10-10",
    title: "Challenges with real goals",
    detail: "Set a length and a target, check in daily, and watch your progress fill in.",
  },
];

/** "14 Oct 2026". Fixed English so server and browser always render the same text. */
export function formatChangelogDate(key: string): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [y, m, d] = key.split("-").map(Number);
  return `${d} ${months[m - 1]} ${y}`;
}
