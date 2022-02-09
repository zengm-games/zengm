import { useCallback, useState } from "react";
import useTitleBar from "../hooks/useTitleBar";
import { downloadFile, toWorker } from "../util";
import type { View } from "../../common/types";
import { GAME_ACRONYM, isSport } from "../../common";
import { ActionButton } from "../components";

const genFilename = (
	leagueName: string,
	season: number | "all",
	grouping: "averages" | "games",
) => {
	const filename = `${GAME_ACRONYM}_${leagueName.replace(
		/[^a-z0-9]/gi,
		"_",
	)}_${season}_${season === "all" ? "seasons" : "season"}_${
		grouping === "averages" ? "Average_Stats" : "Game_Stats"
	}`;

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
			selectEls[1].value === "all" ? "all" : parseInt(selectEls[1].value);

		let csvPromise;
		if (grouping === "averages") {
			csvPromise = toWorker("main", "exportPlayerAveragesCsv", season);
		} else if (grouping === "games") {
			csvPromise = toWorker("main", "exportPlayerGamesCsv", season);
		} else {
			setStatus("Invalid grouping selected");
			return;
		}

		try {
			const [data, leagueName] = await Promise.all([
				csvPromise,
				toWorker("main", "getLeagueName", undefined),
			]);

			const filename = genFilename(leagueName, season, grouping);

			downloadFile(filename, data, "text/csv");

			setStatus(undefined);
		} catch (error) {
			setStatus(`Error: ${error.message}`);
		}
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

			<form className="row gx-2" onSubmit={handleSubmit}>
				<div className="col-auto">
					<select className="form-select" onChange={resetState}>
						<option value="averages">Season Averages</option>
						{isSport("basketball") ? (
							<option value="games">Individual Games</option>
						) : null}
					</select>
				</div>
				<div className="col-auto">
					<select className="form-select" onChange={resetState}>
						{seasons.map(s => {
							return (
								<option key={s.key} value={s.key}>
									{s.val}
								</option>
							);
						})}
					</select>
				</div>
				<div className="col-auto">
					<ActionButton type="submit" processing={status === "Exporting..."}>
						Export Stats
					</ActionButton>
				</div>
			</form>

			{status && status !== "Exporting..." ? (
				<p
					className={`mt-3${status.startsWith("Error:") ? " text-danger" : ""}`}
				>
					{status}
				</p>
			) : null}
		</>
	);
};

export default ExportStats;
