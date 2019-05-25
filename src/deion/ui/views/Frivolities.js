// @flow

import * as React from "react";
import { NewWindowLink } from "../components";
import { setTitle } from "../util";

const Frivolities = () => {
    setTitle("Frivolities");

    return (
        <>
            <h1>
                Frivolities <NewWindowLink />
            </h1>

            <p>
                In the spirit of{" "}
                <a href="https://www.basketball-reference.com/friv/">
                    Basketball Reference
                </a>
                , here is some fun stuff.
            </p>

            <p>
                <b>Family Trees</b> - see the family relationships between
                players
            </p>
            <p>
                <b>Most Games, No Playoffs</b> - see the most accomplished
                players who never made the playoffs
            </p>
            <p>
                <b>Roster Continuity</b> - color-coded visualization of
                year-to-year changes in roster composition
            </p>
            <p>
                <b>Tragic Deaths</b> - view all the tragic deaths that have
                occurred in your league
            </p>
        </>
    );
};

export default Frivolities;
