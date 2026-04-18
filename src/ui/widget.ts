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
}

export function clearWidget(ctx: WidgetCtx, name: WidgetName): void {
	ctx.ui.setWidget(widgetId(name), []);
}
