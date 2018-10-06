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
            // The true here (ensures that ResponsiveTableWrapper's touchstart runs before SideBar's, the true means it
            // will listen during the capturing phase and thus get triggered before the bubbling phase which terminates
            // when SideBar is triggered, since SideBar listens on `document`.
            this.ref.current.addEventListener(
                "touchstart",
                handleTouchStart,
                true,
            );
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
