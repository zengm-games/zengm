// @flow

import classNames from "classnames";
import PropTypes from "prop-types";
import * as React from "react";

type Props = {
    children: any,
    className?: string,
    nonfluid?: boolean,
};

class ResponsiveTableWrapper extends React.Component<Props> {
    render() {
        const { children, className, nonfluid } = this.props;

        return (
            <div
                className={classNames("table-responsive", className, {
                    "table-nonfluid": nonfluid,
                })}
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
