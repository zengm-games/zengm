// @flow

import React from 'react';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Popover from 'react-bootstrap/lib/Popover';

const HelpPopover = ({children, placement, style, title}: {
    children: string | React.Element<*> | React.Element<*>[],
    placement?: 'bottom' | 'left' | 'right' | 'top',
    style: {[key: string]: number | string},
    title: string,
}) => {
    const popover = (
        <Popover id={title} title={title}>
            {children}
        </Popover>
    );

    return <OverlayTrigger trigger="click" rootClose placement={placement} overlay={popover}>
        <span className="glyphicon glyphicon-question-sign help-icon" style={style} />
    </OverlayTrigger>;
};

HelpPopover.propTypes = {
    children: React.PropTypes.any,
    placement: React.PropTypes.string,
    style: React.PropTypes.object,
    title: React.PropTypes.string.isRequired,
};

export default HelpPopover;
