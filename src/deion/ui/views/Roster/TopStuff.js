import PropTypes from "prop-types";
import React from "react";
import { HelpPopover, RecordAndPlayoffs } from "../../components";
import { helpers, overrides } from "../../util";
import InstructionsAndSortButtons from "./InstructionsAndSortButtons";

const PositionFraction = ({ players, pos }) => {
    const count = players.filter(p => p.ratings.pos === pos).length;
    const target = overrides.constants.POSITION_COUNTS[pos];
    const ratio = count / target;

    let classes = null;
    if (count === 0 || ratio < 2 / 3) {
        classes = "text-danger";
    }

    return (
        <span className={classes}>
            {pos}: {count}/{target}
        </span>
    );
};
PositionFraction.propTypes = {
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    pos: PropTypes.string.isRequired,
};

const RosterComposition = ({ players }) => {
    return (
        <div
            className="float-left ml-3"
            style={{
                whiteSpace: "nowrap",
            }}
        >
            <b>
                Roster Composition{" "}
                <HelpPopover placement="bottom" title="Roster Composition">
                    <p>
                        This shows the number of players you have at each
                        position, compared to the recommended number. For
                        example, if you see:
                    </p>
                    <p>QB: 2/3</p>
                    <p>
                        That means you have two quarterbacks, but it is
                        recommended you have three.
                    </p>
                    <p>
                        You don't have to follow these recommendations. You can
                        make an entire team of punters if you want. But if your
                        roster is too unbalanced, your team may not perform very
                        well, particularly when there are injuries and you have
                        to go deep into your bench.
                    </p>
                </HelpPopover>
            </b>
            <div className="row">
                <div className="col-4">
                    <PositionFraction players={players} pos="QB" />
                    <br />
                    <PositionFraction players={players} pos="RB" />
                    <br />
                    <PositionFraction players={players} pos="WR" />
                    <br />
                    <PositionFraction players={players} pos="TE" />
                </div>
                <div className="col-4">
                    <PositionFraction players={players} pos="OL" />
                    <br />
                    <br />
                    <PositionFraction players={players} pos="K" />
                    <br />
                    <PositionFraction players={players} pos="P" />
                </div>
                <div className="col-4">
                    <PositionFraction players={players} pos="DL" />
                    <br />
                    <PositionFraction players={players} pos="LB" />
                    <br />
                    <PositionFraction players={players} pos="CB" />
                    <br />
                    <PositionFraction players={players} pos="S" />
                </div>
            </div>
        </div>
    );
};
RosterComposition.propTypes = {
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
};

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
                    <RosterComposition players={players} />
                ) : null}
            </div>
            <InstructionsAndSortButtons editable={editable} tid={t.tid} />
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
    salaryCap: PropTypes.number.isRequired,
    season: PropTypes.number.isRequired,
    showTradeFor: PropTypes.bool.isRequired,
    t: PropTypes.object.isRequired,
};

export default TopStuff;
