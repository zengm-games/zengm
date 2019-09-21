// @flow

import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import { Dropdown, NewWindowLink } from "../components";
import { helpers, setTitle } from "../util";

const AllStars = ({ season }: { season: number }) => {
    setTitle("All Stars");

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

AllStars.propTypes = {
    season: PropTypes.number.isRequired,
};

export default AllStars;
