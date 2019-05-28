// @flow

import React from "react";
import { NewWindowLink } from "../components";
import { helpers, setTitle } from "../util";

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
                <b>
                    <a
                        href={helpers.leagueUrl([
                            "frivolities",
                            "most_games_no_playoffs",
                        ])}
                    >
                        Most Games, No Playoffs
                    </a>
                </b>{" "}
                - see the most accomplished players who never made the playoffs
                (<span className="text-danger">Warning</span>: this is slow for
                large leagues!)
            </p>
            <p>
                <b>
                    <a href={helpers.leagueUrl(["frivolities", "relatives"])}>
                        Relatives
                    </a>
                </b>{" "}
                - see the family relationships between players (
                <span className="text-danger">Warning</span>: this is slow for
                large leagues!)
            </p>
            <p>
                <b>
                    <a
                        href={helpers.leagueUrl([
                            "frivolities",
                            "roster_continuity",
                        ])}
                    >
                        Roster Continuity
                    </a>
                </b>{" "}
                - color-coded visualization of year-to-year changes in roster
                composition (<span className="text-danger">Warning</span>: this
                is <b>very</b> slow for large leagues!)
            </p>
            <p>
                <b>
                    <a
                        href={helpers.leagueUrl([
                            "frivolities",
                            "tragic_deaths",
                        ])}
                    >
                        Tragic Deaths
                    </a>
                </b>{" "}
                - view all the tragic deaths that have occurred in your league (
                <span className="text-danger">Warning</span>: this is{" "}
                <b>very</b> slow for large leagues!)
            </p>
        </>
    );
};

export default Frivolities;
