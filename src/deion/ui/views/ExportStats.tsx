import PropTypes from "prop-types";
import React, { useCallback, useState } from "react";
import useTitleBar from "../hooks/useTitleBar";
import { downloadFile, toWorker } from "../util";
import type { View } from "../../common/types";

const genFilename = (
	leagueName: string,
	season: number | "all",
	grouping: "averages" | "games",
) => {
	const filename = `${
		process.env.SPORT === "basketball" ? "B" : "F"
	}BGM_${leagueName.replace(/[^a-z0-9]/gi, "_")}_${season}_${
		season === "all" ? "seasons" : "season"
	}_${grouping === "averages" ? "Average_Stats" : "Game_Stats"}`;

	return `${filename}.csv`;
};

const ExportStats = ({ seasons }: View<"exportStats">) => {
	const [status, setStatus] = useState<string | undefined>();

	const handleSubmit = useCallback(async event => {
		event.preventDefault();

		setStatus("Exporting...");

		// Get array of object stores to export
		const selectEls = event.target.getElementsByTagName("select");
		const grouping = selectEls[0].value;
		const season =
			selectEls[1].value === "all" ? "all" : parseInt(selectEls[1].value, 10);

		let csvPromise;
		if (grouping === "averages") {
			csvPromise = toWorker("main", "exportPlayerAveragesCsv", season);
		} else if (grouping === "games") {
			csvPromise = toWorker("main", "exportPlayerGamesCsv", season);
		} else {
			setStatus("Invalid grouping selected");
			return;
		}

		const [data, leagueName] = await Promise.all([
			csvPromise,
			toWorker("main", "getLeagueName"),
		]);

		const filename = genFilename(leagueName, season, grouping);

		downloadFile(filename, data, "text/csv");

		setStatus(undefined);
	}, []);

	const resetState = useCallback(() => {
		setStatus(undefined);
	}, []);

	useTitleBar({ title: "Export Stats" });

	return (
		<>
			<p>
				Here you can export your league's stats to CSV files which can be easily
				viewed in any spreadsheet program like Excel or{" "}
				<a href="http://www.libreoffice.org/">LibreOffice Calc</a>.
			</p>

			<h2>Player Stats</h2>

			<form className="form-inline" onSubmit={handleSubmit}>
				<div className="form-group mr-2">
					<select className="form-control" onChange={resetState}>
						<option value="averages">Season Averages</option>
						{process.env.SPORT === "basketball" ? (
							<option value="games">Individual Games</option>
						) : null}
					</select>
				</div>{" "}
				<div className="form-group mr-2">
					<select className="form-control" onChange={resetState}>
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
					disabled={status === "Exporting..."}
				>
					Export Stats
				</button>
			</form>

			{status ? <p className="mt-3">{status}</p> : null}
		</>
	);
};

ExportStats.propTypes = {
	seasons: PropTypes.arrayOf(
		PropTypes.shape({
			key: PropTypes.string.isRequired,
			val: PropTypes.string.isRequired,
		}),
	).isRequired,
};

export default ExportStats;
