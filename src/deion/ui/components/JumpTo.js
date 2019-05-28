// @flow

import PropTypes from "prop-types";
import React from "react";
import DropdownItem from "reactstrap/lib/DropdownItem";
import DropdownMenu from "reactstrap/lib/DropdownMenu";
import DropdownToggle from "reactstrap/lib/DropdownToggle";
import UncontrolledDropdown from "reactstrap/lib/UncontrolledDropdown";
import { helpers } from "../util";

const genUrl = (parts, season) => {
    if (season !== undefined) {
        parts.push(season);
    }

    return helpers.leagueUrl(parts);
};

const JumpTo = ({ season }: { season: number | "all" }) => {
    // Sometimes the season will be some nonsense like "all", in which case we can't generally use
    // it (although maybe it would be good to in some cases).
    const s = typeof season === "number" ? String(season) : undefined;

    return (
        <UncontrolledDropdown className="float-right my-1">
            <DropdownToggle caret className="btn-light-bordered">
                Jump To
            </DropdownToggle>
            <DropdownMenu>
                <DropdownItem href={genUrl(["standings"], s)}>
                    Standings
                </DropdownItem>
                <DropdownItem href={genUrl(["playoffs"], s)}>
                    Playoffs
                </DropdownItem>
                <DropdownItem href={genUrl(["history"], s)}>
                    Season Summary
                </DropdownItem>
                <DropdownItem href={genUrl(["league_finances"], s)}>
                    Finances
                </DropdownItem>
                <DropdownItem href={genUrl(["transactions", "all"], s)}>
                    Transactions
                </DropdownItem>
                <DropdownItem href={genUrl(["draft_summary"], s)}>
                    Draft
                </DropdownItem>
                <DropdownItem href={genUrl(["leaders"], s)}>
                    Leaders
                </DropdownItem>
                <DropdownItem href={genUrl(["team_stats"], s)}>
                    Team Stats
                </DropdownItem>
                <DropdownItem href={genUrl(["player_stats", "all"], s)}>
                    Player Stats
                </DropdownItem>
                <DropdownItem href={genUrl(["player_ratings", "all"], s)}>
                    Player Ratings
                </DropdownItem>
            </DropdownMenu>
        </UncontrolledDropdown>
    );
};

JumpTo.propTypes = {
    // Not just a number, because sometimes the season might be something like "all"
    season: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default JumpTo;
