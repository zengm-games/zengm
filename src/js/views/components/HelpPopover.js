const React = require('react');
const OverlayTrigger = require('react-bootstrap/lib/OverlayTrigger');
const Popover = require('react-bootstrap/lib/Popover');

const HelpPopover = ({children, placement, title}) => {
    const popoverLeft = (
      <Popover id={title} title={title}>
          {children}
      </Popover>
    );

    return <OverlayTrigger trigger="click" rootClose={true} placement={placement} overlay={popoverLeft}>
        <span className="glyphicon glyphicon-question-sign help-icon"></span>
    </OverlayTrigger>;
};
HelpPopover.propTypes = {
    placement: React.PropTypes.string,
};

module.exports = HelpPopover;
