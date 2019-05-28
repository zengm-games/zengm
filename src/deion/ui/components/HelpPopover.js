// @flow

import PropTypes from "prop-types";
import * as React from "react";
import PopoverBody from "reactstrap/lib/PopoverBody";
import PopoverHeader from "reactstrap/lib/PopoverHeader";
import { UncontrolledPopover } from ".";

const HelpPopover = ({
    children,
    placement,
    style,
    title,
}: {
    children: string | React.Element<any> | React.Element<any>[],
    placement?: "bottom" | "left" | "right" | "top",
    style?: { [key: string]: number | string },
    title: string,
}) => {
    return (
        <UncontrolledPopover
            id={title}
            placement={placement}
            target={props => (
                <span
                    className="glyphicon glyphicon-question-sign help-icon"
                    style={style}
                    {...props}
                />
            )}
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
