import PropTypes from "prop-types";
import React from "react";
import { getCols, helpers, setTitle } from "../../../deion/ui/util";
import {
    DataTable,
    Dropdown,
    JumpTo,
    NewWindowLink,
    PlayerNameLabels,
} from "../components";

const PlayerRatings = ({ abbrev, players, season, userTid }) => {
    setTitle(`Player Ratings - ${season}`);

    const cols = getCols(
        "Name",
        "Pos",
        "Team",
        "Age",
        "Country",
        "Ovr",
        "Pot",
        "rating:Hgt",
        "rating:Str",
        "rating:Spd",
        "rating:Jmp",
        "rating:End",
        "rating:Ins",
        "rating:Dnk",
        "rating:FT",
        "rating:2Pt",
        "rating:3Pt",
        "rating:oIQ",
        "rating:dIQ",
        "rating:Drb",
        "rating:Pss",
        "rating:Reb",
    );

    const rows = players.map(p => {
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
                p.born.loc,
                p.ratings.ovr,
                p.ratings.pot,
                p.ratings.hgt,
                p.ratings.stre,
                p.ratings.spd,
                p.ratings.jmp,
                p.ratings.endu,
                p.ratings.ins,
                p.ratings.dnk,
                p.ratings.ft,
                p.ratings.fg,
                p.ratings.tp,
                p.ratings.oiq,
                p.ratings.diq,
                p.ratings.drb,
                p.ratings.pss,
                p.ratings.reb,
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
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    season: PropTypes.number.isRequired,
    userTid: PropTypes.number.isRequired,
};

export default PlayerRatings;
