import PropTypes from "prop-types";
import React from "react";
import {
    DataTable,
    Dropdown,
    JumpTo,
    NewWindowLink,
    PlayerNameLabels,
} from "../components";
import { getCols, helpers, overrides, setTitle } from "../util";

const PlayerRatings = ({
    abbrev,
    currentSeason,
    players,
    ratings,
    season,
    userTid,
}) => {
    setTitle(`Player Ratings - ${season}`);

    const ovrsPotsColNames = [];
    if (process.env.SPORT === "football") {
        for (const pos of overrides.common.constants.POSITIONS) {
            for (const type of ["ovr", "pot"]) {
                ovrsPotsColNames.push(`rating:${type}${pos}`);
            }
        }
    }

    const cols = getCols(
        "Name",
        "Pos",
        "Team",
        "Age",
        "Contract",
        ...(process.env.SPORT === "basketball" ? ["Country"] : []),
        "Ovr",
        "Pot",
        ...ratings.map(rating => `rating:${rating}`),
        ...ovrsPotsColNames,
    );

    const rows = players.map(p => {
        const ovrsPotsRatings = [];
        if (process.env.SPORT === "football") {
            for (const pos of overrides.common.constants.POSITIONS) {
                for (const type of ["ovrs", "pots"]) {
                    ovrsPotsRatings.push(p.ratings[type][pos]);
                }
            }
        }

        return {
            key: p.pid,
            data: [
                <PlayerNameLabels
                    pid={p.pid}
                    injury={p.injury}
                    skills={p.ratings.skills}
                    watch={p.watch}
                >
                    {p.name}
                </PlayerNameLabels>,
                p.ratings.pos,
                <a href={helpers.leagueUrl(["roster", p.stats.abbrev, season])}>
                    {p.stats.abbrev}
                </a>,
                p.age,
                <>
                    {p.contract.amount > 0
                        ? helpers.formatCurrency(p.contract.amount, "M")
                        : ""}
                    {p.contract.amount > 0 && season === currentSeason
                        ? ` thru ${p.contract.exp}`
                        : ""}
                </>,
                ...(process.env.SPORT === "basketball" ? [p.born.loc] : []),
                p.ratings.ovr,
                p.ratings.pot,
                ...ratings.map(rating => p.ratings[rating]),
                ...ovrsPotsRatings,
            ],
            classNames: {
                "table-danger": p.hof,
                "table-info": p.stats.tid === userTid,
            },
        };
    });

    return (
        <>
            <Dropdown
                view="player_ratings"
                fields={["teamsAndAllWatch", "seasons"]}
                values={[abbrev, season]}
            />
            <JumpTo season={season} />
            <h1>
                Player Ratings <NewWindowLink />
            </h1>

            <p>
                More:{" "}
                <a href={helpers.leagueUrl(["player_rating_dists", season])}>
                    Rating Distributions
                </a>
            </p>

            <p>
                Players on your team are{" "}
                <span className="text-info">highlighted in blue</span>. Players
                in the Hall of Fame are{" "}
                <span className="text-danger">highlighted in red</span>.
            </p>

            <DataTable
                cols={cols}
                defaultSort={[5, "desc"]}
                name="PlayerRatings"
                pagination
                rows={rows}
            />
        </>
    );
};

PlayerRatings.propTypes = {
    abbrev: PropTypes.string.isRequired,
    currentSeason: PropTypes.number.isRequired,
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    ratings: PropTypes.arrayOf(PropTypes.string).isRequired,
    season: PropTypes.number.isRequired,
    userTid: PropTypes.number.isRequired,
};

export default PlayerRatings;
