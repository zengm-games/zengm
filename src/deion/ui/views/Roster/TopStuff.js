import PropTypes from "prop-types";
import React from "react";
import { RecordAndPlayoffs, RosterComposition } from "../../components";
import { helpers } from "../../util";
import InstructionsAndSortButtons from "./InstructionsAndSortButtons";

const TopStuff = ({
    abbrev,
    currentSeason,
    editable,
    numConfs,
    numPlayoffRounds,
    openRosterSpots,
    payroll,
    players,
    profit,
    salaryCap,
    season,
    showTradeFor,
    t,
}) => {
    const logoStyle = {};
    if (t.imgURL) {
        logoStyle.display = "inline";
        logoStyle.backgroundImage = `url('${t.imgURL}')`;
    }

    const recordAndPlayoffs =
        t.seasonAttrs !== undefined ? (
            <>
                Record:{" "}
                <RecordAndPlayoffs
                    abbrev={abbrev}
                    season={season}
                    won={t.seasonAttrs.won}
                    lost={t.seasonAttrs.lost}
                    tied={t.seasonAttrs.tied}
                    playoffRoundsWon={t.seasonAttrs.playoffRoundsWon}
                    option="noSeason"
                    numConfs={numConfs}
                    numPlayoffRounds={numPlayoffRounds}
                />
            </>
        ) : (
            "Season not found"
        );

    return (
        <>
            <div className="team-picture" style={logoStyle} />
            <div>
                <h3>{recordAndPlayoffs}</h3>

                {season === currentSeason ? (
                    <div className="float-left">
                        {openRosterSpots} open roster spots
                        <br />
                        Payroll: {helpers.formatCurrency(payroll, "M")}
                        <br />
                        Salary cap: {helpers.formatCurrency(salaryCap, "M")}
                        <br />
                        Profit: {helpers.formatCurrency(profit, "M")}
                        <br />
                        {showTradeFor ? `Strategy: ${t.strategy}` : null}
                    </div>
                ) : null}
                {process.env.SPORT === "football" ? (
                    <RosterComposition
                        className="float-left ml-3"
                        players={players}
                    />
                ) : null}
            </div>
            <InstructionsAndSortButtons editable={editable} tid={t.tid} />
            {season !== currentSeason ? (
                <p>
                    Players in the Hall of Fame are{" "}
                    <span className="text-danger">highlighted in red</span>.
                </p>
            ) : null}
        </>
    );
};

TopStuff.propTypes = {
    abbrev: PropTypes.string.isRequired,
    currentSeason: PropTypes.number.isRequired,
    editable: PropTypes.bool.isRequired,
    numConfs: PropTypes.number.isRequired,
    numPlayoffRounds: PropTypes.number.isRequired,
    openRosterSpots: PropTypes.number.isRequired,
    payroll: PropTypes.number,
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    profit: PropTypes.number.isRequired,
    salaryCap: PropTypes.number.isRequired,
    season: PropTypes.number.isRequired,
    showTradeFor: PropTypes.bool.isRequired,
    t: PropTypes.object.isRequired,
};

export default TopStuff;
