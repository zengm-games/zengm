import PropTypes from "prop-types";
import React, { useState } from "react";
import {
    DataTable,
    LeagueFileUpload,
    PlayerNameLabels,
} from "../../components";
import { getCols, toWorker } from "../../util";

const DraftClass = ({ offset, players, season }) => {
    const [showImportForm, setShowImportForm] = useState(false);
    const [status, setStatus] = useState();

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

            <div className="btn-group mb-3">
                <button
                    className="btn btn-light-bordered btn-xs"
                    onClick={() => setShowImportForm(val => !val)}
                >
                    Import
                </button>
                <button
                    className="btn btn-light-bordered btn-xs"
                    disabled={status === "exporting" || status === "loading"}
                    onClick={() => {
                        setStatus("exporting");
                        setTimeout(() => {
                            setStatus();
                        }, 1000);
                    }}
                >
                    Export
                </button>
            </div>

            {showImportForm ? (
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
                        disabled={status === "exporting"}
                        onLoading={() => {
                            setStatus("loading");
                        }}
                        onDone={async (err, leagueFile) => {
                            if (err) {
                                return;
                            }

                            await toWorker(
                                "handleUploadedDraftClass",
                                leagueFile,
                                season,
                            );

                            setShowImportForm(false);
                            setStatus();
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
