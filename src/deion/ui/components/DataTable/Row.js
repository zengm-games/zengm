// @flow

import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import clickable from "../../wrappers/clickable";

const Row = clickable<{
    row: {
        classNames: any,
        data: any[],
    },
}>(({ clicked, row, toggleClicked }) => {
    return (
        <tr
            className={classNames(row.classNames, { "table-warning": clicked })}
            onClick={toggleClicked}
        >
            {row.data.map((value = null, i) => {
                // Value is either the value, or an object containing the value as a property
                if (value !== null && value.hasOwnProperty("value")) {
                    return (
                        <td className={classNames(value.classNames)} key={i}>
                            {value.value}
                        </td>
                    );
                }
                return <td key={i}>{value}</td>;
            })}
        </tr>
    );
});

// $FlowFixMe
Row.propTypes = {
    row: PropTypes.shape({
        classNames: PropTypes.object,
        data: PropTypes.array.isRequired,
    }).isRequired,
};

export default Row;
