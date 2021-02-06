import PropTypes from "prop-types";
import { OverlayTrigger, Popover } from "react-bootstrap";
import type { ReactNode } from "react";

const HelpPopover = ({
	children,
	className,
	style,
	title,
}: {
	children: ReactNode;
	className?: string;
	style?: {
		[key: string]: number | string;
	};
	title: string;
}) => {
	if (!className) {
		className = "";
	}
	className += " glyphicon glyphicon-question-sign help-icon";

	const popover = (
		<Popover id={title}>
			<Popover.Title as="h3">{title}</Popover.Title>
			<Popover.Content>{children}</Popover.Content>
		</Popover>
	);

	return (
		<OverlayTrigger
			trigger="click"
			placement="auto"
			overlay={popover}
			rootClose
		>
			<span className={className} style={style} />
		</OverlayTrigger>
	);
};

HelpPopover.propTypes = {
	children: PropTypes.any,
	style: PropTypes.object,
	title: PropTypes.string.isRequired,
};

export default HelpPopover;
