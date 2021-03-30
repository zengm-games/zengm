import PropTypes from "prop-types";
import { Popover } from "react-bootstrap";
import type { ReactNode } from "react";
import OverlayTriggerPopoverAuto from "./OverlayTriggerPopoverAuto";

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

	return (
		<OverlayTriggerPopoverAuto
			popoverContent={
				<>
					<Popover.Title as="h3">{title}</Popover.Title>
					<Popover.Content>{children}</Popover.Content>
				</>
			}
			popoverID={title}
		>
			<span className={className} style={style} />
		</OverlayTriggerPopoverAuto>
	);
};

HelpPopover.propTypes = {
	children: PropTypes.any,
	style: PropTypes.object,
	title: PropTypes.string.isRequired,
};

export default HelpPopover;
