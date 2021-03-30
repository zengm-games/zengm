import PropTypes from "prop-types";
import { Popover } from "react-bootstrap";
import { ReactNode, useCallback, useState } from "react";
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
	// https://stackoverflow.com/a/53215514/786644
	const [, updateState] = useState<any>();
	const forceUpdate = useCallback(() => updateState({}), []);

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
			// This is to force the popover to re-render each time it opens, which allows the "popover-margin-fix" heuristic to work. Currently this is done here rather than in OverlayTriggerPopoverAuto because OverlayTriggerPopoverAuto is only used in 2 places and the other already auto re-renders
			onEnter={forceUpdate}
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
