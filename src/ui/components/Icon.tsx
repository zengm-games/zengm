import clsx from "clsx";

const icons = {
	ellipsisVertical: "glyphicon-option-vertical",
	fastForward: "glyphicon-fast-forward",
	filter: "glyphicon-filter",
	menuLeft: "glyphicon-menu-left",
	menuRight: "glyphicon-menu-right",
	pause: "glyphicon-pause",
	play: "glyphicon-play",
	search: "glyphicon-search",
	stepForward: "glyphicon-step-forward",
	user: "glyphicon-user",
} as const;

type IconName = keyof typeof icons;

export const Icon = ({
	"aria-label": ariaLabel,
	className,
	name,
}: {
	"aria-label"?: string;
	className?: string;
	name: IconName;
}) => (
	<span
		aria-hidden={ariaLabel ? undefined : "true"}
		aria-label={ariaLabel}
		className={clsx("glyphicon", icons[name], className)}
		role={ariaLabel ? "img" : undefined}
	/>
);
