// @flow

import PropTypes from "prop-types";
import * as React from "react";
import OverlayTrigger from "react-bootstrap/lib/OverlayTrigger";
import Popover from "react-bootstrap/lib/Popover";

const HelpPopover = ({
    children,
    placement,
    style,
    title,
}: {
    children: string | React.Element<any> | React.Element<any>[],
    placement?: "bottom" | "left" | "right" | "top",
    style: { [key: string]: number | string },
    title: string,
}) => {
    const popover = (
        <Popover id={title} title={title}>
            {children}
        </Popover>
    );

    return (
        <OverlayTrigger
            trigger="click"
            rootClose
            placement={placement}
            overlay={popover}
        >
            <span
                className="glyphicon glyphicon-question-sign help-icon"
                style={style}
            />
        </OverlayTrigger>
    );
};

HelpPopover.propTypes = {
    children: PropTypes.any,
    placement: PropTypes.string,
    style: PropTypes.object,
    title: PropTypes.string.isRequired,
};

export default HelpPopover;
