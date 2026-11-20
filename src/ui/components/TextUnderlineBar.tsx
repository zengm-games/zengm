import type { CSSProperties, ReactNode } from "react";

// A thin bar right under some text, like a bar chart in an underline. percent is the width of the bar. The bar is positioned absolutely so it doesn't change the height, which would throw off vertical alignment, like in a table cell next to plain text. It is behind the text, so letters like "g" hang over it, and isolation keeps it in front of any background behind this, like a striped table row.
export const TextUnderlineBar = ({
	barClassName,
	barStyle,
	children,
	className,
	percent,
}: {
	barClassName?: string;
	barStyle?: CSSProperties;
	children: ReactNode;
	className?: string;
	percent: number;
}) => {
	return (
		<div
			className={className}
			style={{ isolation: "isolate", position: "relative" }}
		>
			{children}
			<div
				className={barClassName}
				style={{
					...barStyle,
					bottom: 2,
					height: 2,
					left: 0,
					position: "absolute",
					width: `${percent}%`,
					zIndex: -1,
				}}
			/>
		</div>
	);
};
