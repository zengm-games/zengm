// @flow

import classNames from "classnames";
import PropTypes from "prop-types";
import * as React from "react";

type Props = {
    children: any,
    className?: string,
    nonfluid?: boolean,
};

const handleTouchStart = (event: TouchEvent) => {
    // This is to prevent scrolling within the responsive table from opening/closing SideBar
    event.stopPropagation();
};

class ResponsiveTableWrapper extends React.Component<Props> {
    ref: { current: null | React.ElementRef<"div"> };

    constructor(props: Props) {
        super(props);

        this.ref = React.createRef();
    }

    componentDidMount() {
        if (this.ref && this.ref.current) {
            // This shit is confusing! This listener stops propagation of the event, before it bubbles up to `document`,
            // because there is a listener on `document` in SideBar for swiping the menu open/closed. However this runs
            // after the listener in react-sortable-hoc, so you can still drag roster handles. This works because the
            // roster handle event starts at the roster handle and then bubbles up (events have no capture phase by
            // default).
            this.ref.current.addEventListener("touchstart", handleTouchStart);
        }
    }

    componentWillUnmount() {
        if (this.ref && this.ref.current) {
            this.ref.current.removeEventListener(
                "touchstart",
                handleTouchStart,
            );
        }
    }

    render() {
        const { children, className, nonfluid } = this.props;

        return (
            <div
                className={classNames("table-responsive", className, {
                    "table-nonfluid": nonfluid,
                })}
                ref={this.ref}
            >
                {children}
            </div>
        );
    }
}

ResponsiveTableWrapper.propTypes = {
    className: PropTypes.string,
    nonfluid: PropTypes.bool,
};

export default ResponsiveTableWrapper;
