import PropTypes from "prop-types";
import React from "react";
import { getCols, helpers, setTitle } from "../../../deion/ui/util";
import {
    DataTable,
    Dropdown,
    NewWindowLink,
    PlayerNameLabels,
} from "../../../deion/ui/components";

const PlayerShotLocations = ({ players, season, userTid }) => {
    setTitle(`Player Shot Locations - ${season}`);

    const superCols = [
        {
            title: "",
            colspan: 6,
        },
        {
            title: "At Rim",
            colspan: 3,
        },
        {
            title: "Low Post",
            colspan: 3,
        },
        {
            title: "Mid-Range",
            colspan: 3,
        },
        {
            title: "3PT",
            desc: "Three-Pointers",
            colspan: 3,
        },
    ];

    const cols = getCols(
        "Name",
        "Pos",
        "Team",
        "stat:gp",
        "stat:gs",
        "stat:min",
        "M",
        "A",
        "%",
        "M",
        "A",
        "%",
        "M",
        "A",
        "%",
        "M",
        "A",
        "%",
    );

    const rows = players.map(p => {
        return {
            key: p.pid,
            data: [
                <PlayerNameLabels
                    injury={p.injury}
                    pid={p.pid}
                    skills={p.ratings.skills}
                    watch={p.watch}
                >
                    {p.name}
                </PlayerNameLabels>,
                p.ratings.pos,
                <a href={helpers.leagueUrl(["roster", p.stats.abbrev, season])}>
                    {p.stats.abbrev}
                </a>,
                p.stats.gp,
                p.stats.gs,
                p.stats.min.toFixed(1),
                p.stats.fgAtRim.toFixed(1),
                p.stats.fgaAtRim.toFixed(1),
                p.stats.fgpAtRim.toFixed(1),
                p.stats.fgLowPost.toFixed(1),
                p.stats.fgaLowPost.toFixed(1),
                p.stats.fgpLowPost.toFixed(1),
                p.stats.fgMidRange.toFixed(1),
                p.stats.fgaMidRange.toFixed(1),
                p.stats.fgpMidRange.toFixed(1),
                p.stats.tp.toFixed(1),
                p.stats.tpa.toFixed(1),
                p.stats.tpp.toFixed(1),
            ],
            classNames: {
                "table-info": p.stats.tid === userTid,
            },
        };
    });

    return (
        <>
            <Dropdown
                view="player_shot_locations"
                fields={["seasons"]}
                values={[season]}
            />
            <h1>
                Player Shot Locations <NewWindowLink />
            </h1>

            <p>
                More:{" "}
                <a href={helpers.leagueUrl(["player_stats", season])}>
                    Main Stats
                </a>{" "}
                |{" "}
                <a href={helpers.leagueUrl(["player_stat_dists", season])}>
                    Stat Distributions
                </a>
            </p>

            <DataTable
                cols={cols}
                defaultSort={[5, "desc"]}
                name="PlayerShotLocations"
                rows={rows}
                pagination
                superCols={superCols}
            />
        </>
    );
};

PlayerShotLocations.propTypes = {
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    season: PropTypes.number.isRequired,
    userTid: PropTypes.number.isRequired,
};

export default PlayerShotLocations;
