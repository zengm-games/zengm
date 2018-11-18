import PropTypes from "prop-types";
import React from "react";
import {
    DataTable,
    NewWindowLink,
    PlayerNameLabels,
    RosterSalarySummary,
} from "../components";
import { getCols, helpers, setTitle, toWorker } from "../util";

const NegotiationList = ({
    capSpace,
    hardCap,
    minContract,
    numRosterSpots,
    players,
    stats,
    userTid,
}) => {
    const title = hardCap
        ? "Rookies and Expiring Contracts"
        : "Re-sign Players";

    setTitle(title);

    const cols = getCols(
        "Name",
        "Pos",
        "Age",
        "Ovr",
        "Pot",
        ...stats.map(stat => `stat:${stat}`),
        "Asking For",
        "Mood",
        "Negotiate",
    );

    const rows = players.map(p => {
        let negotiateButton;
        if (
            helpers.refuseToNegotiate(
                p.contract.amount * 1000,
                p.freeAgentMood[userTid],
            )
        ) {
            negotiateButton = "Refuses!";
        } else {
            negotiateButton = (
                <button
                    className="btn btn-light-bordered btn-xs"
                    onClick={() => toWorker("actions.negotiate", p.pid)}
                >
                    Negotiate
                </button>
            );
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
                p.age,
                p.ratings.ovr,
                p.ratings.pot,
                ...stats.map(stat => helpers.roundStat(p.stats[stat], stat)),
                <>
                    {helpers.formatCurrency(p.contract.amount, "M")} thru{" "}
                    {p.contract.exp}
                </>,
                <div
                    title={p.mood.text}
                    style={{
                        width: "100%",
                        height: "21px",
                        backgroundColor: p.mood.color,
                    }}
                >
                    <span style={{ display: "none" }}>
                        {p.freeAgentMood[userTid]}
                    </span>
                </div>,
                negotiateButton,
            ],
        };
    });

    return (
        <>
            <h1>
                {title} <NewWindowLink />
            </h1>
            <p>
                More:{" "}
                <a href={helpers.leagueUrl(["upcoming_free_agents"])}>
                    Upcoming Free Agents
                </a>
            </p>

            {!hardCap ? (
                <p>
                    You are allowed to go over the salary cap to re-sign your
                    players before they become free agents. If you do not
                    re-sign them before free agency begins, they will be free to
                    sign with any team, and you won't be able to go over the
                    salary cap to sign them.
                </p>
            ) : null}

            <RosterSalarySummary
                capSpace={capSpace}
                hardCap={hardCap}
                minContract={minContract}
                numRosterSpots={numRosterSpots}
            />

            <DataTable
                cols={cols}
                defaultSort={[10, "desc"]}
                name="NegotiationList"
                rows={rows}
            />
        </>
    );
};

NegotiationList.propTypes = {
    capSpace: PropTypes.number.isRequired,
    hardCap: PropTypes.bool.isRequired,
    minContract: PropTypes.number.isRequired,
    numRosterSpots: PropTypes.number.isRequired,
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    statas: PropTypes.arrayOf(PropTypes.string).isRequired,
    userTid: PropTypes.number.isRequired,
};

export default NegotiationList;
