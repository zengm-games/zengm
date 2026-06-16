import clsx from "clsx";
import type { CSSProperties, Ref } from "react";

// This used to be needed to handle event propagation for touch events, when SideBar was swipeable
export const ResponsiveTableWrapper = ({
	className,
	children,
	nonfluid,
	ref,
	style,
}: {
	className?: string | null;
	children: any;
	nonfluid?: boolean;
	ref?: Ref<HTMLDivElement>;
	style?: CSSProperties;
}) => {
	return (
		<div
			className={clsx(
				"table-responsive small-scrollbar",
				{
					"table-nonfluid": nonfluid,
				},
				className,
			)}
			ref={ref}
			style={style}
		>
			{children}
		</div>
	);
};
