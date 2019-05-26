// @flow

import * as React from "react";
import { NewWindowLink } from "../components";
import { setTitle } from "../util";

const MostGamesNoPlayoffs = () => {
    setTitle("Most Games No Playoffs");

    return (
        <>
            <h1>
                Most Games No Playoffs <NewWindowLink />
            </h1>

            <p>Coming soon!</p>
        </>
    );
};

export default MostGamesNoPlayoffs;
