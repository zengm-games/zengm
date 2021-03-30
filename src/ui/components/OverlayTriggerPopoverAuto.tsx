import { ReactNode, useRef } from "react";
import { OverlayTrigger, OverlayTriggerProps, Popover } from "react-bootstrap";

// Hacky fix for https://github.com/react-bootstrap/react-bootstrap/issues/5270
// There are some edge cases when scrolling/resizing makes it switch positions, but overall it works better than nothing.
const OverlayTriggerPopoverAuto = ({
	children,
	onEnter,
	popoverContent,
	popoverID,
}: {
	children: OverlayTriggerProps["children"];
	onEnter?: OverlayTriggerProps["onEnter"];
	popoverContent: ReactNode;
	popoverID: string;
}) => {
	const prevPopperPlacement = useRef<string | undefined>();

	// Apply class here based on best guess of what we'll actually want in onEnter, to minimize flicker
	const className = prevPopperPlacement.current
		? "popover-margin-fix-2"
		: "popover-margin-fix-1";

	const popover = (
		<Popover id={popoverID} className={className}>
			{popoverContent}
		</Popover>
	);

	return (
		<OverlayTrigger
			trigger="click"
			placement="auto"
			overlay={popover}
			rootClose
			onEnter={onEnter}
			onEntered={node => {
				if (prevPopperPlacement.current === node.dataset.popperPlacement) {
					node.classList.remove("popover-margin-fix-1");
					node.classList.add("popover-margin-fix-2");
				} else {
					prevPopperPlacement.current = node.dataset.popperPlacement;
					node.classList.remove("popover-margin-fix-2");
					node.classList.add("popover-margin-fix-1");
				}
			}}
		>
			{children}
		</OverlayTrigger>
	);
};

export default OverlayTriggerPopoverAuto;
