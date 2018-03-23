import PropTypes from "prop-types";
import React from "react";
import { helpers } from "../../common";
import { DataTable, NewWindowLink, PlayerNameLabels } from "../components";
import { getCols, logEvent, realtimeUpdate, setTitle, toWorker } from "../util";

class DraftScouting extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            customize: undefined,
        };
    }

    handleCustomize(i) {
        this.setState({
            customize: i,
        });
    }

    handleDraftClass(seasonOffset, e) {
        const file = e.currentTarget.files[0];

        const reader = new window.FileReader();
        reader.readAsText(file);
        reader.onload = async event => {
            let uploadedFile;
            try {
                uploadedFile = JSON.parse(event.currentTarget.result);
            } catch (err) {
                logEvent({
                    type: "error",
                    text: `Error parsing file: ${err.message}`,
                    saveToDb: false,
                });

                this.setState({
                    customize: undefined,
                });

                return;
            }

            await toWorker(
                "handleUploadedDraftClass",
                uploadedFile,
                seasonOffset,
            );

            this.setState({
                customize: undefined,
            });

            await realtimeUpdate(["playerMovement"]);
        };
    }

    render() {
        const { seasons } = this.props;

        setTitle("Draft Scouting");

        const cols = getCols("#", "Name", "Pos", "Age", "Ovr", "Pot");

        return (
            <div>
                <h1>
                    Draft Scouting <NewWindowLink />
                </h1>

                <p>
                    More:{" "}
                    <a href={helpers.leagueUrl(["draft_lottery"])}>
                        Draft Lottery
                    </a>{" "}
                    |{" "}
                    <a href={helpers.leagueUrl(["draft_summary"])}>
                        Draft Summary
                    </a>{" "}
                    |{" "}
                    <a href={helpers.leagueUrl(["draft_team_history"])}>
                        Team History
                    </a>
                </p>

                <p>
                    The ratings shown are your scouts' projections for what the
                    players' ratings will be when they enter the draft. The
                    further in the future, the more uncertainty there is in
                    their estimates.
                </p>

                <div className="row">
                    {seasons.map((s, i) => {
                        const rows = s.players.map(p => {
                            return {
                                key: p.pid,
                                data: [
                                    p.rank,
                                    <div className="shortened-col">
                                        <PlayerNameLabels
                                            pid={p.pid}
                                            skills={p.skills}
                                        >
                                            {p.nameAbbrev}
                                        </PlayerNameLabels>
                                    </div>,
                                    p.pos,
                                    p.age,
                                    p.ovr,
                                    p.pot,
                                ],
                            };
                        });

                        return (
                            <div key={s.season} className="col-md-4 col-sm-6">
                                <h2>{s.season}</h2>

                                {this.state.customize === i ? (
                                    <div>
                                        <p>
                                            To replace this draft class with
                                            players from a{" "}
                                            <a
                                                href="https://basketball-gm.com/manual/customization/draft-class/"
                                                rel="noopener noreferrer"
                                                target="_blank"
                                            >
                                                custom draft class file
                                            </a>, select the file below.
                                        </p>
                                        <p>
                                            <input
                                                type="file"
                                                className="custom-draft-class"
                                                onChange={e =>
                                                    this.handleDraftClass(i, e)
                                                }
                                            />
                                        </p>
                                    </div>
                                ) : (
                                    <p>
                                        <button
                                            className="btn btn-default btn-xs"
                                            onClick={() =>
                                                this.handleCustomize(i)
                                            }
                                        >
                                            Customize
                                        </button>
                                    </p>
                                )}

                                <DataTable
                                    className="shorten-col-1"
                                    cols={cols}
                                    defaultSort={[0, "asc"]}
                                    name={`DraftScouting:${i}`}
                                    rows={rows}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
}

DraftScouting.propTypes = {
    seasons: PropTypes.arrayOf(
        PropTypes.shape({
            players: PropTypes.arrayOf(PropTypes.object).isRequired,
            season: PropTypes.number.isRequired,
        }),
    ).isRequired,
};

export default DraftScouting;
