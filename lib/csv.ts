/** Small, dependency-free CSV helpers for the data export. */

/**
 * Quotes a cell for CSV. Cells that begin with = + - @ (or a tab/CR) are prefixed with an
 * apostrophe so spreadsheet programs treat them as text instead of running them as formulas.
 */
export function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: unknown[][]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
