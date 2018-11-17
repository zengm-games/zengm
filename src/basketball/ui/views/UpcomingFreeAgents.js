import PropTypes from "prop-types";
import React from "react";
import {
    DataTable,
    Dropdown,
    NewWindowLink,
} from "../../../deion/ui/components";
import { PlayerNameLabels } from "../components";
import { getCols, helpers, setTitle } from "../../../deion/ui/util";

const UpcomingFreeAgents = ({ players, season }) => {
    setTitle("Upcoming Free Agents");

    const cols = getCols(
        "Name",
        "Pos",
        "Team",
        "Age",
        "Ovr",
        "Pot",
        "Min",
        "Pts",
        "Reb",
        "Ast",
        "PER",
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
                p.stats.min.toFixed(1),
                p.stats.pts.toFixed(1),
                p.stats.trb.toFixed(1),
                p.stats.ast.toFixed(1),
                p.stats.per.toFixed(1),
                <span>
                    {helpers.formatCurrency(p.contract.amount, "M")} thru{" "}
                    {p.contract.exp}
                </span>,
                <span>
                    {helpers.formatCurrency(p.contractDesired.amount, "M")} thru{" "}
                    {p.contractDesired.exp}
                </span>,
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

            <p>
                Keep in mind that many of these players will choose to re-sign
                with their current team rather than become free agents.
            </p>

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
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    season: PropTypes.number.isRequired,
};

export default UpcomingFreeAgents;
