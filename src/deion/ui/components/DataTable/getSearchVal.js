// @flow

import React from "react";
import textContent from "react-addons-text-content";

const getSearchVal = (value: any, toLowerCase?: boolean = true) => {
    try {
        let val;
        let sortVal;

        // Get the right 'value'.
        if (value !== null && value.hasOwnProperty("value")) {
            val = value.value;
        } else {
            val = value;
        }

        if (React.isValidElement(val)) {
            sortVal = textContent(val);
        } else {
            sortVal = val;
        }

        if (sortVal !== undefined && sortVal !== null && sortVal.toString) {
            return toLowerCase
                ? sortVal.toString().toLowerCase()
                : sortVal.toString();
        }
        return "";
    } catch (err) {
        console.error(`getSearchVal error on value "${String(value)}"`, err);
        return "";
    }
};

export default getSearchVal;
