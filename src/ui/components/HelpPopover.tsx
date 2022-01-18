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

	return (
		<OverlayTrigger
			trigger="click"
			placement="auto"
			overlay={
				<Popover id={title}>
					<Popover.Header as="h3">{title}</Popover.Header>
					<Popover.Body>{children}</Popover.Body>
				</Popover>
			}
			rootClose
		>
			<span className={className} style={style} />
		</OverlayTrigger>
	);
};

export default HelpPopover;
