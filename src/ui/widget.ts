import { writeMarker } from "../common/markers.js";

type WidgetCtx = { ui: { setWidget: (id: string, lines: string[]) => void } };

export type WidgetName = "todos" | "subagent" | "degraded";

function widgetId(name: WidgetName): string {
  return `superpowers-${name}`;
}

export type WidgetCallProps = {
  name: WidgetName;
  lines: string[];
};

export function setWidget(ctx: WidgetCtx, props: WidgetCallProps): void {
  ctx.ui.setWidget(widgetId(props.name), props.lines);
  void writeMarker("widget-set", { name: props.name, lineCount: props.lines.length });
}

export function clearWidget(ctx: WidgetCtx, name: WidgetName): void {
  ctx.ui.setWidget(widgetId(name), []);
  void writeMarker("widget-set", { name, lineCount: 0 });
}
