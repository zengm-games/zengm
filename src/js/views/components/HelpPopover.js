// @flow

import React from 'react';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Popover from 'react-bootstrap/lib/Popover';

const HelpPopover = ({children, placement, title}: {
    children: string | React.Element<*> | React.Element<*>[],
    placement?: 'bottom' | 'left' | 'right' | 'top',
    title: string,
}) => {
    const popover = (
        <Popover id={title} title={title}>
            {children}
        </Popover>
    );

    return <OverlayTrigger trigger="click" rootClose placement={placement} overlay={popover}>
        <span className="glyphicon glyphicon-question-sign help-icon" />
    </OverlayTrigger>;
};

HelpPopover.propTypes = {
    children: React.PropTypes.any,
    placement: React.PropTypes.string,
    title: React.PropTypes.string.isRequired,
};

export default HelpPopover;
