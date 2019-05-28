// @flow

import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";

const Footer = ({ footer }: { footer?: any[] }) => {
    if (!footer) {
        return null;
    }

    let footers;

    if (Array.isArray(footer[0])) {
        // There are multiple footers
        footers = footer;
    } else {
        // There's only one footer
        footers = [footer];
    }

    return (
        <tfoot>
            {footers.map((row, i) => (
                <tr key={i}>
                    {row.map((value, j) => {
                        if (value !== null && value.hasOwnProperty("value")) {
                            return (
                                <th
                                    className={classNames(value.classNames)}
                                    key={j}
                                >
                                    {value.value}
                                </th>
                            );
                        }

                        return <th key={j}>{value}</th>;
                    })}
                </tr>
            ))}
        </tfoot>
    );
};

Footer.propTypes = {
    footer: PropTypes.array,
};

export default Footer;
