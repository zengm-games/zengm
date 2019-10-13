import PropTypes from "prop-types";
import React, { useState } from "react";
import {
    DataTable,
    LeagueFileUpload,
    PlayerNameLabels,
} from "../../components";
import { getCols, toWorker } from "../../util";

const DraftClass = ({ offset, players, season }) => {
    const [customize, setCustomize] = useState(false);

    const cols = getCols("#", "Name", "Pos", "Age", "Ovr", "Pot");

    const rows = players.map(p => {
        return {
            key: p.pid,
            data: [
                p.rank,
                <PlayerNameLabels pid={p.pid} skills={p.skills} watch={p.watch}>
                    {p.nameAbbrev}
                </PlayerNameLabels>,
                p.pos,
                p.age,
                p.ovr,
                p.pot,
            ],
        };
    });

    return (
        <>
            <h2>{season}</h2>

            <p>
                <button
                    className="btn btn-light-bordered btn-xs"
                    disabled={customize}
                    onClick={() => setCustomize(true)}
                >
                    Customize
                </button>
            </p>

            {customize ? (
                <div>
                    <p>
                        To replace this draft class with players from a{" "}
                        <a
                            href="https://basketball-gm.com/manual/customization/draft-class/"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            custom draft class file
                        </a>
                        , select the file below.
                    </p>
                    <LeagueFileUpload
                        onDone={async (err, leagueFile) => {
                            if (err) {
                                return;
                            }

                            await toWorker(
                                "handleUploadedDraftClass",
                                leagueFile,
                                season,
                            );

                            setCustomize(false);
                        }}
                    />
                    <p />
                </div>
            ) : null}

            <DataTable
                cols={cols}
                defaultSort={[0, "asc"]}
                name={`DraftScouting:${offset}`}
                rows={rows}
            />
        </>
    );
};

DraftClass.propTypes = {
    offset: PropTypes.number.isRequired,
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    season: PropTypes.number.isRequired,
};

export default DraftClass;
