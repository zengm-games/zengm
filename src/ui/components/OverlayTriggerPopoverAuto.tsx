import { ReactNode, useRef } from "react";
import { OverlayTrigger, Popover } from "react-bootstrap";
import type { OverlayTriggerProps } from "react-bootstrap";

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

	// Apply class here based on best guess of what we'll actually want in onEnter, to minimize flicker. But different browsers handle it differently, so only Chrome gets the nice behavior, others default to popover-margin-fix-1 so it never overlaps the icon (but there is a flicker on repeated openings)
	const className =
		prevPopperPlacement.current && navigator.userAgent.includes("Chrome")
			? undefined
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
				} else {
					prevPopperPlacement.current = node.dataset.popperPlacement;
					node.classList.add("popover-margin-fix-1");
				}
			}}
		>
			{children}
		</OverlayTrigger>
	);
};

export default OverlayTriggerPopoverAuto;
