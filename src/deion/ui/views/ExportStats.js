import PropTypes from "prop-types";
import React from "react";
import { downloadFile, setTitle, toWorker } from "../util";

function genFilename(leagueName, season, grouping) {
    const filename = `${
        process.env.SPORT === "basketball" ? "B" : "F"
    }BGM_${leagueName.replace(/[^a-z0-9]/gi, "_")}_${season}_${
        season === "all" ? "seasons" : "season"
    }_${grouping === "averages" ? "Average_Stats" : "Game_Stats"}`;

    return `${filename}.csv`;
}

class ExportStats extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            status: null,
        };
        this.handleSubmit = this.handleSubmit.bind(this);
        this.resetState = this.resetState.bind(this);
    }

    async handleSubmit(e) {
        e.preventDefault();

        this.setState({
            status: "Exporting...",
        });

        // Get array of object stores to export
        const selectEls = e.target.getElementsByTagName("select");
        const grouping = selectEls[0].value;
        const season =
            selectEls[1].value === "all"
                ? "all"
                : parseInt(selectEls[1].value, 10);

        let csvPromise;
        if (grouping === "averages") {
            csvPromise = toWorker("exportPlayerAveragesCsv", season);
        } else if (grouping === "games") {
            csvPromise = toWorker("exportPlayerGamesCsv", season);
        } else {
            this.setState({
                status: "Invalid grouping selected",
            });
            return;
        }

        const [data, leagueName] = await Promise.all([
            csvPromise,
            toWorker("getLeagueName"),
        ]);

        const filename = genFilename(leagueName, season, grouping);

        downloadFile(filename, data, "text/csv");

        this.setState({
            status: null,
        });
    }

    resetState() {
        this.setState({
            status: null,
        });
    }

    render() {
        setTitle("Export Stats");

        const { seasons } = this.props;

        return (
            <>
                <h1>Export Stats</h1>

                <p>
                    Here you can export your league's stats to CSV files which
                    can be easily viewed in any spreadsheet program like Excel
                    or{" "}
                    <a href="http://www.libreoffice.org/">LibreOffice Calc</a>.
                </p>

                <h2>Player Stats</h2>

                <form className="form-inline" onSubmit={this.handleSubmit}>
                    <div className="form-group mr-2">
                        <select
                            className="form-control"
                            onChange={this.resetState}
                        >
                            <option value="averages">Season Averages</option>
                            {process.env.SPORT === "basketball" ? (
                                <option value="games">Individual Games</option>
                            ) : null}
                        </select>
                    </div>{" "}
                    <div className="form-group mr-2">
                        <select
                            className="form-control"
                            onChange={this.resetState}
                        >
                            {seasons.map(s => {
                                return (
                                    <option key={s.key} value={s.key}>
                                        {s.val}
                                    </option>
                                );
                            })}
                        </select>
                    </div>{" "}
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={this.state.status === "Exporting..."}
                    >
                        Export Stats
                    </button>
                </form>

                {this.state.status ? (
                    <p className="mt-3">{this.state.status}</p>
                ) : null}
            </>
        );
    }
}

ExportStats.propTypes = {
    seasons: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            val: PropTypes.string.isRequired,
        }),
    ).isRequired,
};

export default ExportStats;
