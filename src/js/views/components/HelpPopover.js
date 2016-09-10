const React = require('react');
const OverlayTrigger = require('react-bootstrap/lib/OverlayTrigger');
const Popover = require('react-bootstrap/lib/Popover');

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

module.exports = HelpPopover;
