// @flow

import * as React from "react";
import { NewWindowLink } from "../components";
import { setTitle } from "../util";

const RosterContinuity = () => {
    setTitle("Roster Continuity");

    return (
        <>
            <h1>
                Roster Continuity <NewWindowLink />
            </h1>

            <p>Coming soon!</p>
        </>
    );
};

export default RosterContinuity;
