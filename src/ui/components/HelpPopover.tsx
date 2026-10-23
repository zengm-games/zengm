import { OverlayTrigger, Popover } from "react-bootstrap";
import { type ReactNode, useId } from "react";

export const HelpPopover = ({
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
	title?: string;
}) => {
	if (!className) {
		className = "";
	}
	className += " icon-button glyphicon glyphicon-question-sign help-icon";

	const id = useId();

	return (
		<OverlayTrigger
			trigger="click"
			placement="auto"
			overlay={
				<Popover id={id}>
					{title ? <Popover.Header as="h3">{title}</Popover.Header> : null}
					<Popover.Body>{children}</Popover.Body>
				</Popover>
			}
			rootClose
		>
			<button
				type="button"
				className={className}
				style={style}
				aria-label={title ? `Help: ${title}` : "Help"}
			/>
		</OverlayTrigger>
	);
};
