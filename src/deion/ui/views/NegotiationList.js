import PropTypes from "prop-types";
import React from "react";
import {
    DataTable,
    NegotiateButtons,
    NewWindowLink,
    PlayerNameLabels,
    RosterSalarySummary,
} from "../components";
import { getCols, helpers, setTitle } from "../util";

const NegotiationList = ({
    capSpace,
    hardCap,
    minContract,
    numRosterSpots,
    players,
    playersRefuseToNegotiate,
    season,
    stats,
    sumContracts,
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
                <NegotiateButtons
                    canGoOverCap={!hardCap}
                    capSpace={capSpace}
                    minContract={minContract}
                    p={p}
                    playersRefuseToNegotiate={playersRefuseToNegotiate}
                    season={season}
                    userTid={userTid}
                />,
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

            {hardCap ? (
                <p>
                    Your unsigned players are asking for a total of{" "}
                    <b>{helpers.formatCurrency(sumContracts, "M")}</b>.
                </p>
            ) : null}

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
    playersRefuseToNegotiate: PropTypes.bool.isRequired,
    season: PropTypes.number.isRequired,
    stats: PropTypes.arrayOf(PropTypes.string).isRequired,
    sumContracts: PropTypes.number.isRequired,
    userTid: PropTypes.number.isRequired,
};

export default NegotiationList;
