import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import { Popover } from "reactstrap";

// This is shit

const UncontrolledPopover = ({
	defaultOpen,
	id,
	onEnter,
	target: Target,
	...passThroughProps
}: {
	defaultOpen?: boolean;
	id: string;
	onEnter?: () => void;
	target: any;
}) => {
	const [open, setOpen] = useState(defaultOpen || false);

	const toggle = useCallback(() => {
		const newOpen = !open;
		if (newOpen && onEnter) {
			onEnter();
		}
		setOpen(newOpen);
	}, [open, onEnter]);

	const id2 = id.replace(/[^a-zA-Z]/g, "");

	return (
		<>
			<Target id={id2} onClick={toggle} />
			<Popover
				isOpen={open}
				toggle={toggle}
				target={id2}
				trigger="legacy"
				{...passThroughProps}
			/>
		</>
	);
};

UncontrolledPopover.propTypes = {
	defaultOpen: PropTypes.bool,
	id: PropTypes.string.isRequired,
	onEnter: PropTypes.func,
	target: PropTypes.any,
	// @ts-ignore
	...Popover.propTypes,
};

export default UncontrolledPopover;
