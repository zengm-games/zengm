// @flow

import classNames from "classnames";
import PropTypes from "prop-types";
import * as React from "react";

const RatingWithChange = ({
    change,
    children,
}: {
    change: number,
    children: number,
}) => {
    return (
        <span>
            {children}
            {change !== 0 ? (
                <span
                    className={classNames({
                        "text-success": change > 0,
                        "text-danger": change < 0,
                    })}
                >
                    {" "}
                    ({change > 0 ? "+" : null}
                    {change})
                </span>
            ) : null}
        </span>
    );
};

RatingWithChange.propTypes = {
    change: PropTypes.number.isRequired,
    children: PropTypes.number.isRequired,
};

export default RatingWithChange;
