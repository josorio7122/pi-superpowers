import { writeMarker } from "../common/markers.js";
import { ASCII_FALLBACK, ICONS } from "./icons.js";

type StatusCtx = { ui: { setStatus: (id: string, text: string) => void } };

const STATUS_ID = "superpowers";

export type StatusCallProps = {
  text: string;
  color?: boolean;
};

export function setSuperpowersStatus(ctx: StatusCtx, props: StatusCallProps): void {
  const color = props.color !== false;
  const brand = color ? ICONS.brand : ASCII_FALLBACK.brand;
  const full = `${brand} ${props.text}`;
  ctx.ui.setStatus(STATUS_ID, full);
  void writeMarker("status-set", { id: STATUS_ID, text: full });
}

export function clearSuperpowersStatus(ctx: StatusCtx): void {
  ctx.ui.setStatus(STATUS_ID, "");
  void writeMarker("status-set", { id: STATUS_ID, text: "" });
}
