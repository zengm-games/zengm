import clsx from "clsx";
import type { Ref } from "react";
type Props = {
	className?: string | null;
	children: any;
	nonfluid?: boolean;
	ref?: Ref<HTMLDivElement>;
};

// This used to be needed to handle event propagation for touch events, when SideBar was swipeable
const ResponsiveTableWrapper = ({
	className,
	children,
	nonfluid,
	ref,
}: Props) => {
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
		>
			{children}
		</div>
	);
};

export default ResponsiveTableWrapper;
