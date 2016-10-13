import React from 'react';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Popover from 'react-bootstrap/lib/Popover';

const HelpPopover = ({children, placement, title}) => {
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
