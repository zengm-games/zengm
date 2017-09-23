import PropTypes from "prop-types";
import React from "react";
import { PLAYER, g, helpers } from "../../common";
import { getCols, setTitle } from "../util";
import {
    DataTable,
    Dropdown,
    NewWindowLink,
    PlayerNameLabels,
    RecordAndPlayoffs,
} from "../components";

const TeamHistory = ({
    abbrev,
    bestRecord,
    championships,
    history,
    players,
    playoffAppearances,
    team,
    totalLost,
    totalWon,
    worstRecord,
}) => {
    setTitle("Team History");

    const historySeasons = history.map(h => {
        const recordAndPlayoffs = (
            <RecordAndPlayoffs
                abbrev={abbrev}
                lost={h.lost}
                playoffRoundsWon={h.playoffRoundsWon}
                season={h.season}
                // Bold championship seasons.
                style={
                    h.playoffRoundsWon === g.numPlayoffRounds
                        ? { fontWeight: "bold" }
                        : null
                }
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
        "GP",
        "Min",
        "Pts",
        "Reb",
        "Ast",
        "PER",
        "EWA",
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
                p.careerStats.gp,
                p.careerStats.min.toFixed(1),
                p.careerStats.pts.toFixed(1),
                p.careerStats.trb.toFixed(1),
                p.careerStats.ast.toFixed(1),
                p.careerStats.per.toFixed(1),
                p.careerStats.ewa.toFixed(1),
                p.lastYr,
            ],
            classNames: {
                // Highlight active and HOF players
                danger: p.hof,
                info: p.tid > PLAYER.RETIRED && p.tid !== team.tid, // On other team
                success: p.tid === team.tid, // On this team
            },
        };
    });

    return (
        <div>
            <Dropdown
                view="team_history"
                fields={["teams"]}
                values={[abbrev]}
            />
            <h1>
                {team.region} {team.name} History <NewWindowLink />
            </h1>
            <p>
                More: <a href={helpers.leagueUrl(["roster", abbrev])}>
                    Roster
                </a>{" "}
                |{" "}
                <a href={helpers.leagueUrl(["team_finances", abbrev])}>
                    Finances
                </a>{" "}
                | <a href={helpers.leagueUrl(["game_log", abbrev])}>
                    Game Log
                </a>{" "}
                |{" "}
                <a href={helpers.leagueUrl(["transactions", abbrev])}>
                    Transactions
                </a>
            </p>

            <div className="row">
                <div className="col-sm-3">
                    <h2>Overall</h2>
                    <p>
                        Record: {totalWon}-{totalLost}
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
                            won={bestRecord.won}
                        />
                        <br />
                        Worst Record:{" "}
                        <RecordAndPlayoffs
                            abbrev={abbrev}
                            lost={worstRecord.lost}
                            season={worstRecord.season}
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
                        </span>. Active players on other teams are{" "}
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
        </div>
    );
};

TeamHistory.propTypes = {
    abbrev: PropTypes.string.isRequired,
    bestRecord: PropTypes.shape({
        lost: PropTypes.number.isRequired,
        season: PropTypes.number.isRequired,
        won: PropTypes.number.isRequired,
    }).isRequired,
    championships: PropTypes.number.isRequired,
    history: PropTypes.arrayOf(PropTypes.object).isRequired,
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    playoffAppearances: PropTypes.number.isRequired,
    team: PropTypes.shape({
        name: PropTypes.string.isRequired,
        region: PropTypes.string.isRequired,
        tid: PropTypes.number.isRequired,
    }).isRequired,
    totalLost: PropTypes.number.isRequired,
    totalWon: PropTypes.number.isRequired,
    worstRecord: PropTypes.shape({
        lost: PropTypes.number.isRequired,
        season: PropTypes.number.isRequired,
        won: PropTypes.number.isRequired,
    }).isRequired,
};

export default TeamHistory;
