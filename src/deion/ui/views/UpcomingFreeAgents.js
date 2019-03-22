import PropTypes from "prop-types";
import React from "react";
import { PHASE } from "../../common";
import {
    DataTable,
    Dropdown,
    NewWindowLink,
    PlayerNameLabels,
} from "../components";
import { getCols, helpers, setTitle } from "../util";

const UpcomingFreeAgents = ({ phase, players, season, stats }) => {
    setTitle("Upcoming Free Agents");

    const cols = getCols(
        "Name",
        "Pos",
        "Team",
        "Age",
        "Ovr",
        "Pot",
        ...stats.map(stat => `stat:${stat}`),
        "Current Contract",
        "Desired Contract",
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
                <a href={helpers.leagueUrl(["roster", p.abbrev])}>
                    {p.abbrev}
                </a>,
                p.age,
                p.ratings.ovr,
                p.ratings.pot,
                ...stats.map(stat => helpers.roundStat(p.stats[stat], stat)),
                <>
                    {helpers.formatCurrency(p.contract.amount, "M")} thru{" "}
                    {p.contract.exp}
                </>,
                <>
                    {helpers.formatCurrency(p.contractDesired.amount, "M")} thru{" "}
                    {p.contractDesired.exp}
                </>,
            ],
        };
    });

    return (
        <>
            <Dropdown
                view="upcoming_free_agents"
                fields={["seasonsUpcoming"]}
                values={[season]}
            />
            <h1>
                Upcoming Free Agents <NewWindowLink />
            </h1>
            <p>
                More:{" "}
                <a href={helpers.leagueUrl(["free_agents"])}>
                    Current Free Agents
                </a>
            </p>

            {phase !== PHASE.RESIGN_PLAYERS ? (
                <p>
                    Keep in mind that many of these players will choose to
                    re-sign with their current team rather than become free
                    agents.
                </p>
            ) : null}

            <DataTable
                cols={cols}
                defaultSort={[3, "desc"]}
                name="UpcomingFreeAgents"
                rows={rows}
                pagination
            />
        </>
    );
};

UpcomingFreeAgents.propTypes = {
    phase: PropTypes.number.isRequired,
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    season: PropTypes.number.isRequired,
    stats: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default UpcomingFreeAgents;
