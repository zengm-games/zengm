import React from "react";
import PropTypes from "prop-types";
import Popover from "reactstrap/lib/Popover";

// This is shit

const omitKeys = ["defaultOpen", "id", "onEnter", "target"];

export default class UncontrolledPopover extends React.Component {
    constructor(props) {
        super(props);

        this.state = { isOpen: props.defaultOpen || false };
        this.toggle = this.toggle.bind(this);
    }

    toggle() {
        this.setState(state => {
            const isOpen = !state.isOpen;
            if (isOpen && this.props.onEnter) {
                this.props.onEnter();
            }
            return { isOpen };
        });
    }

    render() {
        const id = this.props.id.replace(/[^a-zA-Z]/g, "");

        const passThroughProps = {};
        for (const key of Object.keys(this.props)) {
            if (!omitKeys.includes(key)) {
                passThroughProps[key] = this.props[key];
            }
        }

        return (
            <>
                <this.props.target id={id} onClick={this.toggle} />
                <Popover
                    isOpen={this.state.isOpen}
                    toggle={this.toggle}
                    target={id}
                    trigger="legacy"
                    {...passThroughProps}
                />
            </>
        );
    }
}

UncontrolledPopover.propTypes = {
    defaultOpen: PropTypes.bool,
    id: PropTypes.string.isRequired,
    onEnter: PropTypes.func,
    target: PropTypes.any,
    ...Popover.propTypes,
};
