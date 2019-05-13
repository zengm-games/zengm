import PropTypes from "prop-types";
import React from "react";
import { helpers } from "../../../../deion/ui/util";

const Winner = ({ award, finals = false, season, userTid }) => {
    if (!award) {
        return finals ? "???" : <p>???</p>;
    }

    const nameAndStats = (
        <>
            <span className={award.tid === userTid ? "table-info" : null}>
                {award.pos}{" "}
                <b>
                    <a href={helpers.leagueUrl(["player", award.pid])}>
                        {award.name}
                    </a>
                </b>{" "}
                (
                <a href={helpers.leagueUrl(["roster", award.abbrev, season])}>
                    {award.abbrev}
                </a>
                )
            </span>
            <br />
            {award.keyStats}
        </>
    );

    return finals ? nameAndStats : <p>{nameAndStats}</p>;
};

Winner.propTypes = {
    award: PropTypes.object,
    defense: PropTypes.bool,
    finals: PropTypes.bool,
    season: PropTypes.number.isRequired,
    userTid: PropTypes.number.isRequired,
};

const AwardsAndChamp = ({ awards, champ, confs, season, userTid }) => {
    return (
        <div className="row">
            <div className="col-sm-12 col-6">
                <h4>League Champions</h4>
                {champ ? (
                    <div>
                        <p>
                            <span
                                className={
                                    champ.tid === userTid ? "table-info" : null
                                }
                            >
                                <b>
                                    <a
                                        href={helpers.leagueUrl([
                                            "roster",
                                            champ.abbrev,
                                            season,
                                        ])}
                                    >
                                        {champ.region} {champ.name}
                                    </a>
                                </b>
                            </span>
                            <br />
                            <a href={helpers.leagueUrl(["playoffs", season])}>
                                Playoffs Bracket
                            </a>
                        </p>
                        <p>
                            Finals MVP:{" "}
                            <Winner
                                award={awards.finalsMvp}
                                finals
                                season={season}
                                userTid={userTid}
                            />
                        </p>
                    </div>
                ) : (
                    <p>???</p>
                )}
                <h4>Best Record</h4>
                {awards.bestRecordConfs.map((t, i) => (
                    <p key={t.tid}>
                        {confs[i].name}:<br />
                        <span
                            className={t.tid === userTid ? "table-info" : null}
                        >
                            <a
                                href={helpers.leagueUrl([
                                    "roster",
                                    t.abbrev,
                                    season,
                                ])}
                            >
                                {t.region} {t.name}
                            </a>{" "}
                            ({t.won}-{t.lost}
                            {t.tied !== undefined ? <>-{t.tied}</> : null})
                        </span>
                        <br />
                    </p>
                ))}
                <h4>Most Valuable Player</h4>
                <Winner award={awards.mvp} season={season} userTid={userTid} />
            </div>
            <div className="col-sm-12 col-6">
                <h4>Defensive Player of the Year</h4>
                <Winner award={awards.dpoy} season={season} userTid={userTid} />
                <h4>Offensive Rookie of the Year</h4>
                <Winner award={awards.oroy} season={season} userTid={userTid} />
                <h4>Defensive Rookie of the Year</h4>
                <Winner award={awards.droy} season={season} userTid={userTid} />
            </div>
        </div>
    );
};

AwardsAndChamp.propTypes = {
    awards: PropTypes.object.isRequired,
    champ: PropTypes.object.isRequired,
    confs: PropTypes.arrayOf(PropTypes.object).isRequired,
    season: PropTypes.number.isRequired,
    userTid: PropTypes.number.isRequired,
};

export default AwardsAndChamp;
