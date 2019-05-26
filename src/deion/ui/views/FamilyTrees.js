// @flow

import * as React from "react";
import { NewWindowLink } from "../components";
import { setTitle } from "../util";

const FamilyTrees = () => {
    setTitle("Family Trees");

    return (
        <>
            <h1>
                Family Trees <NewWindowLink />
            </h1>

            <p>Coming soon!</p>
        </>
    );
};

export default FamilyTrees;
