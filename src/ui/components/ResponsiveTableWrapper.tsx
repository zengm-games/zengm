import clsx from "clsx";
type Props = {
	className?: string | null;
	children: any;
	nonfluid?: boolean;
};

// This used to be needed to handle event propagation for touch events, when SideBar was swipeable
const ResponsiveTableWrapper = ({ className, children, nonfluid }: Props) => {
	return (
		<div
			className={clsx(
				"table-responsive small-scrollbar",
				{
					"table-nonfluid": nonfluid,
				},
				className,
			)}
		>
			{children}
		</div>
	);
};

export default ResponsiveTableWrapper;
