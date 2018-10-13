// @flow

import classNames from "classnames";
import PropTypes from "prop-types";
import * as React from "react";

type Props = {
    children: any,
    nonfluid?: boolean,
};

// This used to be needed to handle event propagation for touch events, when SideBar was swipeable
const ResponsiveTableWrapper = ({ children, nonfluid }: Props) => {
    return (
        <div
            className={classNames("table-responsive", {
                "table-nonfluid": nonfluid,
            })}
        >
            {children}
        </div>
    );
};

ResponsiveTableWrapper.propTypes = {
    nonfluid: PropTypes.bool,
};

export default ResponsiveTableWrapper;
