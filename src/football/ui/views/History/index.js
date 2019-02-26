import PropTypes from "prop-types";
import React from "react";
import {
    Dropdown,
    JumpTo,
    NewWindowLink,
    RetiredPlayers,
} from "../../../../deion/ui/components";
import { setTitle } from "../../../../deion/ui/util";
import AwardsAndChamp from "./AwardsAndChamp";
import Team from "./Team";

const History = ({
    awards,
    champ,
    confs,
    invalidSeason,
    retiredPlayers,
    season,
    userTid,
}) => {
    setTitle(`Season Summary - ${season}`);

    if (invalidSeason) {
        return (
            <>
                <h1>Error</h1>
                <p>Invalid season.</p>
            </>
        );
    }

    return (
        <>
            <Dropdown
                view="history"
                fields={["seasonsHistory"]}
                values={[season]}
            />
            <JumpTo season={season} />
            <h1>
                Season Summary <NewWindowLink />
            </h1>

            <p />
            <div className="row">
                <div className="col-md-3 col-sm-4 col-12">
                    <AwardsAndChamp
                        awards={awards}
                        champ={champ}
                        confs={confs}
                        season={season}
                        userTid={userTid}
                    />
                </div>
                <div className="col-md-3 col-sm-4 col-6">
                    <Team
                        className="mb-3"
                        name="All-League 1st Team"
                        nested
                        season={season}
                        team={awards.allLeague[0].players}
                        userTid={userTid}
                    />
                    <Team
                        className="mb-3"
                        name="All-League 2nd Team"
                        nested
                        season={season}
                        team={awards.allLeague[1].players}
                        userTid={userTid}
                    />
                </div>
                <div className="col-md-3 col-sm-4 col-6">
                    <Team
                        className="mb-3"
                        name="All-Rookie Team"
                        season={season}
                        team={awards.allRookie}
                        userTid={userTid}
                    />
                </div>
                <div className="col-md-3 col-sm-12">
                    <RetiredPlayers
                        retiredPlayers={retiredPlayers}
                        season={season}
                        userTid={userTid}
                    />
                </div>
            </div>
        </>
    );
};

History.propTypes = {
    awards: PropTypes.object,
    champ: PropTypes.object,
    confs: PropTypes.arrayOf(PropTypes.object),
    invalidSeason: PropTypes.bool.isRequired,
    retiredPlayers: PropTypes.arrayOf(PropTypes.object),
    season: PropTypes.number.isRequired,
    userTid: PropTypes.number,
};

export default History;
