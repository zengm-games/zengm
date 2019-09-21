// @flow

import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import { Dropdown, NewWindowLink } from "../components";
import { helpers, setTitle } from "../util";

const AllStars = ({ allStars }) => {
    setTitle("All Stars");
    console.log("allStars", allStars);

    return (
        <>
            <h1>
                All Stars <NewWindowLink />
            </h1>
            <div className="row">
                <div className="col-4">
                    <h3>Team ___</h3>
                </div>
                <div className="col-4">
                    <h3>Team ___</h3>
                </div>
                <div className="col-4">
                    <h3>Remaining All Stars</h3>
                </div>
            </div>
        </>
    );
};

AllStars.propTypes = {};

export default AllStars;
