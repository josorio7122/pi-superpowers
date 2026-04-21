// Width-aware truncation and wrapping. All functions are ANSI-safe.

// biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape sequences start with ESC (0x1b) by definition
const ANSI_RE = /\u001b\[[0-9;]*m/g;

export function visibleLength(s: string): number {
  return s.replace(ANSI_RE, "").length;
}

export function truncateEnd(s: string, width: number): string {
  if (width <= 0) return "";
  if (visibleLength(s) <= width) return s;
  if (width === 1) return "…";
  return `${s.replace(ANSI_RE, "").slice(0, width - 1)}…`;
}

export function truncateMiddle(s: string, width: number): string {
  if (width <= 0) return "";
  const plain = s.replace(ANSI_RE, "");
  if (plain.length <= width) return s;
  if (width < 5) return truncateEnd(s, width);
  const side = Math.floor((width - 1) / 2);
  return `${plain.slice(0, side)}…${plain.slice(-side)}`;
}

export function wrapLines(s: string, width: number): string[] {
  if (width <= 0) return [];
  const words = s.split(/\s+/);
  const out: string[] = [];
  let current = "";
  for (const w of words) {
    if (w.length > width) {
      if (current) {
        out.push(current);
        current = "";
      }
      for (let i = 0; i < w.length; i += width) {
        const chunk = w.slice(i, i + width);
        if (i + width >= w.length) {
          current = chunk;
        } else {
          out.push(chunk);
        }
      }
      continue;
    }
    if (!current) {
      current = w;
      continue;
    }
    if (current.length + 1 + w.length <= width) {
      current += ` ${w}`;
    } else {
      out.push(current);
      current = w;
    }
  }
  if (current) out.push(current);
  return out;
}
