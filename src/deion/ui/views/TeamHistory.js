import PropTypes from "prop-types";
import React from "react";
import { PLAYER } from "../../common";
import {
    Dropdown,
    DataTable,
    NewWindowLink,
    PlayerNameLabels,
    RecordAndPlayoffs,
} from "../components";
import { helpers, getCols, setTitle } from "../util";

const TeamHistory = ({
    abbrev,
    bestRecord,
    championships,
    history,
    numConfs,
    numPlayoffRounds,
    players,
    playoffAppearances,
    stats,
    team,
    ties,
    totalLost,
    totalTied,
    totalWon,
    worstRecord,
}) => {
    setTitle("Team History");

    const historySeasons = history.map(h => {
        const recordAndPlayoffs = (
            <RecordAndPlayoffs
                abbrev={abbrev}
                lost={h.lost}
                numConfs={numConfs}
                numPlayoffRounds={numPlayoffRounds}
                playoffRoundsWon={h.playoffRoundsWon}
                season={h.season}
                // Bold championship seasons.
                style={
                    h.playoffRoundsWon === numPlayoffRounds
                        ? { fontWeight: "bold" }
                        : null
                }
                tied={h.tied}
                won={h.won}
            />
        );

        return (
            <span key={h.season}>
                {recordAndPlayoffs}
                <br />
            </span>
        );
    });

    const cols = getCols(
        "Name",
        "Pos",
        ...stats.map(stat => `stat:${stat}`),
        "Last Season",
    );
    const rows = players.map(p => {
        return {
            key: p.pid,
            data: [
                <PlayerNameLabels injury={p.injury} pid={p.pid} watch={p.watch}>
                    {p.name}
                </PlayerNameLabels>,
                p.pos,
                ...stats.map(stat =>
                    helpers.roundStat(p.careerStats[stat], stat),
                ),
                p.lastYr,
            ],
            classNames: {
                // Highlight active and HOF players
                "table-danger": p.hof,
                "table-info": p.tid > PLAYER.RETIRED && p.tid !== team.tid, // On other team
                "table-success": p.tid === team.tid, // On this team
            },
        };
    });

    let record = `${totalWon}-${totalLost}`;
    if (ties) {
        record += `-${totalTied}`;
    }

    return (
        <>
            <Dropdown
                view="team_history"
                fields={["teams"]}
                values={[abbrev]}
            />
            <h1>
                {team.region} {team.name} History <NewWindowLink />
            </h1>
            <p>
                More:{" "}
                {process.env.SPORT === "football" ? (
                    <>
                        <a href={helpers.leagueUrl(["depth", abbrev])}>
                            Depth Chart
                        </a>{" "}
                        |{" "}
                    </>
                ) : null}
                <a href={helpers.leagueUrl(["roster", abbrev])}>Roster</a> |{" "}
                <a href={helpers.leagueUrl(["team_finances", abbrev])}>
                    Finances
                </a>{" "}
                | <a href={helpers.leagueUrl(["game_log", abbrev])}>Game Log</a>{" "}
                |{" "}
                <a href={helpers.leagueUrl(["transactions", abbrev])}>
                    Transactions
                </a>
            </p>

            <div className="row">
                <div className="col-sm-3">
                    <h2>Overall</h2>
                    <p>
                        Record: {record}
                        <br />
                        Playoff Appearances: {playoffAppearances}
                        <br />
                        Championships: {championships}
                        <br />
                        Best Record:{" "}
                        <RecordAndPlayoffs
                            abbrev={abbrev}
                            lost={bestRecord.lost}
                            season={bestRecord.season}
                            tied={bestRecord.tied}
                            won={bestRecord.won}
                        />
                        <br />
                        Worst Record:{" "}
                        <RecordAndPlayoffs
                            abbrev={abbrev}
                            lost={worstRecord.lost}
                            season={worstRecord.season}
                            tied={worstRecord.tied}
                            won={worstRecord.won}
                        />
                    </p>

                    <h2>Seasons</h2>
                    <p
                        style={{
                            MozColumnWidth: "15em",
                            MozColumns: "15em",
                            WebkitColumns: "15em",
                            columns: "15em",
                        }}
                    >
                        {historySeasons}
                    </p>
                </div>
                <div className="col-sm-9">
                    <h2>Players</h2>
                    <p>
                        Players currently on this team are{" "}
                        <span className="text-success">
                            highlighted in green
                        </span>
                        . Other active players are{" "}
                        <span className="text-info">highlighted in blue</span>.
                        Players in the Hall of Fame are{" "}
                        <span className="text-danger">highlighted in red</span>.
                    </p>
                    <DataTable
                        cols={cols}
                        defaultSort={[2, "desc"]}
                        name="TeamHistory"
                        rows={rows}
                        pagination
                    />
                </div>
            </div>
        </>
    );
};

TeamHistory.propTypes = {
    abbrev: PropTypes.string.isRequired,
    bestRecord: PropTypes.shape({
        lost: PropTypes.number.isRequired,
        playoffRoundsWon: PropTypes.number.isRequired,
        season: PropTypes.number.isRequired,
        tied: PropTypes.number,
        won: PropTypes.number.isRequired,
    }).isRequired,
    championships: PropTypes.number.isRequired,
    history: PropTypes.arrayOf(
        PropTypes.shape({
            lost: PropTypes.number.isRequired,
            playoffRoundsWon: PropTypes.number.isRequired,
            season: PropTypes.number.isRequired,
            tied: PropTypes.number,
            won: PropTypes.number.isRequired,
        }),
    ).isRequired,
    numConfs: PropTypes.number.isRequired,
    numPlayoffRounds: PropTypes.number.isRequired,
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    playoffAppearances: PropTypes.number.isRequired,
    stats: PropTypes.arrayOf(PropTypes.string).isRequired,
    team: PropTypes.shape({
        name: PropTypes.string.isRequired,
        region: PropTypes.string.isRequired,
        tid: PropTypes.number.isRequired,
    }).isRequired,
    ties: PropTypes.bool.isRequired,
    totalLost: PropTypes.number.isRequired,
    totalTied: PropTypes.number,
    totalWon: PropTypes.number.isRequired,
    worstRecord: PropTypes.shape({
        lost: PropTypes.number.isRequired,
        playoffRoundsWon: PropTypes.number.isRequired,
        season: PropTypes.number.isRequired,
        tied: PropTypes.number,
        won: PropTypes.number.isRequired,
    }).isRequired,
};

export default TeamHistory;
