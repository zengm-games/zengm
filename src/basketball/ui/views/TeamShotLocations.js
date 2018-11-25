import PropTypes from "prop-types";
import React from "react";
import {
    DataTable,
    Dropdown,
    NewWindowLink,
} from "../../../deion/ui/components";
import {
    getCols,
    helpers,
    prefixStatOpp,
    setTitle,
} from "../../../deion/ui/util";

const TeamShotLocations = ({
    playoffs,
    season,
    teams,
    teamOpponent,
    userTid,
}) => {
    setTitle(`Team Shot Locations - ${season}`);

    const superCols = [
        {
            title: "",
            colspan: 4,
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
        "Team",
        "stat:gp",
        "W",
        "L",
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

    const rows = teams.map(t => {
        const statCols = [
            "fgAtRim",
            "fgaAtRim",
            "fgpAtRim",
            "fgLowPost",
            "fgaLowPost",
            "fgpLowPost",
            "fgMidRange",
            "fgaMidRange",
            "fgpMidRange",
            "tp",
            "tpa",
            "tpp",
        ].map(key => prefixStatOpp(teamOpponent, key));

        return {
            key: t.tid,
            data: [
                <a href={helpers.leagueUrl(["roster", t.abbrev, season])}>
                    {t.abbrev}
                </a>,
                t.stats.gp,
                t.seasonAttrs.won,
                t.seasonAttrs.lost,
                ...statCols.map(col => t.stats[col].toFixed(1)),
            ],
            classNames: {
                "table-info": t.tid === userTid,
            },
        };
    });

    return (
        <>
            <Dropdown
                view="team_shot_locations"
                fields={["seasons", "teamOpponent", "playoffs"]}
                values={[season, teamOpponent, playoffs]}
            />
            <h1>
                Team Shot Locations <NewWindowLink />
            </h1>

            <p>
                More:{" "}
                <a href={helpers.leagueUrl(["team_stats", season])}>
                    Main Stats
                </a>{" "}
                |{" "}
                <a href={helpers.leagueUrl(["team_stat_dists", season])}>
                    Stat Distributions
                </a>
            </p>

            <DataTable
                cols={cols}
                defaultSort={[2, "desc"]}
                name="TeamShotLocations"
                rows={rows}
                superCols={superCols}
            />
        </>
    );
};

TeamShotLocations.propTypes = {
    playoffs: PropTypes.oneOf(["playoffs", "regularSeason"]).isRequired,
    season: PropTypes.number.isRequired,
    teamOpponent: PropTypes.oneOf(["opponent", "team"]).isRequired,
    teams: PropTypes.arrayOf(PropTypes.object).isRequired,
    userTid: PropTypes.number.isRequired,
};

export default TeamShotLocations;
