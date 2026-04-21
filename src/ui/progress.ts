import { SPINNER_ASCII, SPINNER_FRAMES } from "./icons.js";

export type ProgressBarProps = {
  current: number;
  total: number;
  width: number;
  color: boolean;
  ascii?: boolean;
};

export function progressBar(props: ProgressBarProps): string {
  const { current, total, width, ascii } = props;
  const safeCurrent = Math.max(0, Math.min(current, Math.max(0, total)));
  const ratio = total > 0 ? safeCurrent / total : 0;
  const filledCount = Math.round(ratio * width);
  const emptyCount = width - filledCount;
  const filled = ascii ? "#" : "▰";
  const empty = ascii ? "." : "▱";
  return filled.repeat(filledCount) + empty.repeat(emptyCount);
}

export type SpinnerProps = {
  color: boolean;
  ascii?: boolean;
};

export function spinnerFrame(tick: number, opts: SpinnerProps): string {
  const frames = opts.ascii ? SPINNER_ASCII : SPINNER_FRAMES;
  const idx = ((tick % frames.length) + frames.length) % frames.length;
  return frames[idx] ?? frames[0] ?? "";
}
