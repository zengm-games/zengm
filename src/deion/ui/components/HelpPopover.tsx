import PropTypes from "prop-types";
import React from "react";
import { PopoverBody, PopoverHeader } from "reactstrap";

import { UncontrolledPopover } from ".";

const HelpPopover = ({
	children,
	className,
	placement,
	style,
	title,
}: {
	children: React.ReactNode;
	className?: string;
	placement?: "bottom" | "left" | "right" | "top";
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
		<UncontrolledPopover
			id={title}
			placement={placement}
			target={props => <span className={className} style={style} {...props} />}
		>
			<PopoverHeader>{title}</PopoverHeader>
			<PopoverBody>{children}</PopoverBody>
		</UncontrolledPopover>
	);
};

HelpPopover.propTypes = {
	children: PropTypes.any,
	placement: PropTypes.string,
	style: PropTypes.object,
	title: PropTypes.string.isRequired,
};

export default HelpPopover;
