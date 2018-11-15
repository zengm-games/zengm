// @flow

import * as React from "react";
import textContent from "react-addons-text-content";

const getSearchVal = (val: any, toLowerCase?: boolean = true) => {
    try {
        let sortVal;
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
        console.error(`getSearchVal error on val "${val}"`, err);
        return "";
    }
};

export default getSearchVal;
