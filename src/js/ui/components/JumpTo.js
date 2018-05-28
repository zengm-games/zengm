// @flow

import PropTypes from "prop-types";
import * as React from "react";
import DropdownButton from "react-bootstrap/lib/DropdownButton";
import MenuItem from "react-bootstrap/lib/MenuItem";
import { helpers } from "../../common";

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
        <div className="pull-right">
            <DropdownButton id="jump-to-dropdown" title="Jump To">
                <MenuItem href={genUrl(["standings"], s)}>Standings</MenuItem>
                <MenuItem href={genUrl(["playoffs"], s)}>Playoffs</MenuItem>
                <MenuItem href={genUrl(["history"], s)}>
                    Season Summary
                </MenuItem>
                <MenuItem href={genUrl(["league_finances"], s)}>
                    Finances
                </MenuItem>
                <MenuItem href={genUrl(["transactions", "all"], s)}>
                    Transactions
                </MenuItem>
                <MenuItem href={genUrl(["draft_summary"], s)}>Draft</MenuItem>
                <MenuItem href={genUrl(["leaders"], s)}>Leaders</MenuItem>
                <MenuItem href={genUrl(["team_stats"], s)}>Team Stats</MenuItem>
                <MenuItem href={genUrl(["player_stats", "all"], s)}>
                    Player Stats
                </MenuItem>
                <MenuItem href={genUrl(["player_ratings", "all"], s)}>
                    Player Ratings
                </MenuItem>
            </DropdownButton>
        </div>
    );
};

JumpTo.propTypes = {
    // Not just a number, because sometimes the season might be something like "all"
    season: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default JumpTo;
