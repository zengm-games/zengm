import PropTypes from "prop-types";
import React from "react";
import { NewWindowLink } from "../../components";
import DraftClass from "./DraftClass";
import { helpers, setTitle } from "../../util";

const DraftScouting = ({ draftType, seasons }) => {
    setTitle("Draft Scouting");

    return (
        <>
            <h1>
                Draft Scouting <NewWindowLink />
            </h1>

            <p>
                More:{" "}
                {draftType !== "noLottery" && draftType !== "random" ? (
                    <>
                        <a href={helpers.leagueUrl(["draft_lottery"])}>
                            Draft Lottery
                        </a>{" "}
                        |{" "}
                    </>
                ) : null}
                <a href={helpers.leagueUrl(["draft_history"])}>Draft History</a>{" "}
                |{" "}
                <a href={helpers.leagueUrl(["draft_team_history"])}>
                    Team History
                </a>
            </p>

            <p>
                The ratings shown are your scouts' projections for what the
                players' ratings will be when they enter the draft. The further
                in the future, the more uncertainty there is in their estimates.
            </p>

            <div className="row">
                {seasons.map((info, offset) => {
                    return (
                        <div key={info.season} className="col-md-4 col-sm-6">
                            <DraftClass
                                offset={offset}
                                players={info.players}
                                season={info.season}
                            />
                        </div>
                    );
                })}
            </div>
        </>
    );
};

DraftScouting.propTypes = {
    draftType: PropTypes.oneOf(["nba1994", "nba2019", "noLottery", "random"]),
    seasons: PropTypes.arrayOf(
        PropTypes.shape({
            players: PropTypes.arrayOf(PropTypes.object).isRequired,
            season: PropTypes.number.isRequired,
        }),
    ).isRequired,
};

export default DraftScouting;
