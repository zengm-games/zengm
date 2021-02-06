import classNames from "classnames";
import PropTypes from "prop-types";
type Props = {
	className?: string | null;
	children: any;
	nonfluid?: boolean;
};

// This used to be needed to handle event propagation for touch events, when SideBar was swipeable
const ResponsiveTableWrapper = ({ className, children, nonfluid }: Props) => {
	return (
		<div
			className={classNames(
				"table-responsive",
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

ResponsiveTableWrapper.propTypes = {
	className: PropTypes.string,
	nonfluid: PropTypes.bool,
};

export default ResponsiveTableWrapper;
