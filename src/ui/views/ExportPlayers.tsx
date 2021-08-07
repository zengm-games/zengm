import { useState } from "react";
import { PLAYER } from "../../common";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers, toWorker, downloadFile } from "../util";
import { DataTable, MoreLinks, PlayerNameLabels } from "../components";
import type { View } from "../../common/types";

const ExportPlayers = ({
	challengeNoRatings,
	multipleSeasons,
	players,
	season,
}: View<"exportPlayers">) => {
	const [exporting, setExporting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | undefined>();
	const [selected, setSelected] = useState<
		{
			p: typeof players[number];
			season: number;
		}[]
	>([]);

	useTitleBar({
		title: "Export Players",
		dropdownView: "export_players",
		dropdownFields: { seasons: season },
	});

	const cols = getCols(["Name", "Pos", "Age", "Team", "Ovr", "Pot", ""], {
		Name: {
			width: "100%",
		},
	});

	const cols2 = getCols(["#", "Name", "Pos", "Age", "Team", "Ovr", "Pot", ""], {
		Name: {
			width: "100%",
		},
	});

	const commonRows = (p: typeof players[number]) => {
		const showRatings = !challengeNoRatings || p.tid === PLAYER.RETIRED;

		return [
			<PlayerNameLabels
				injury={p.injury}
				jerseyNumber={p.jerseyNumber}
				pid={p.pid}
				season={season}
				skills={p.ratings.skills}
				watch={p.watch}
			>
				{p.name}
			</PlayerNameLabels>,
			p.ratings.pos,
			p.age,
			<a
				href={helpers.leagueUrl([
					"roster",
					`${p.stats.abbrev}_${p.stats.tid}`,
					season,
				])}
			>
				{p.stats.abbrev}
			</a>,
			showRatings ? p.ratings.ovr : null,
			showRatings ? p.ratings.pot : null,
		];
	};

	const selectedPids = selected.map(({ p }) => p.pid);

	const rows = players.map(p => {
		return {
			key: p.pid,
			data: [
				...commonRows(p),
				<button
					className="btn btn-xs btn-primary"
					disabled={exporting || selectedPids.includes(p.pid)}
					onClick={() => {
						setSelected([...selected, { p, season }]);
					}}
					title="Add to list of players to export"
				>
					Add
				</button>,
			],
		};
	});

	const rows2 = selected.map(({ p }, i) => {
		return {
			key: p.pid,
			data: [
				i + 1,
				...commonRows(p),
				<button
					className="btn btn-xs btn-primary"
					disabled={exporting}
					onClick={() => {
						setSelected(selected.filter(row => row.p.pid !== p.pid));
					}}
					title="Remove from list of players to export"
				>
					Remove
				</button>,
			],
		};
	});

	return (
		<>
			<MoreLinks type="importExport" page="export_players" />

			<p>
				Here you can export any number of players to a JSON file which can be
				imported into another league.
			</p>
			{multipleSeasons ? (
				<p>Players can be selected from any season using the menu above.</p>
			) : null}
			<p>
				When you export a player, it includes all of his seasons. Then when you
				import, you will be able to select whichever season you want, including
				the ability to select multiple seasons from the same player.
			</p>

			<div className="row">
				<div className="col-12 col-lg-6">
					<div className="clearfix">
						<DataTable
							cols={cols}
							defaultSort={[0, "asc"]}
							name="ExportPlayers"
							pagination
							rows={rows}
						/>
					</div>
					<div className="float-right btn-group my-3">
						<button
							className="btn btn-secondary"
							onClick={() => {
								setSelected([]);
							}}
							title="Clear list of players to export"
						>
							Remove All
						</button>
						<button
							className="btn btn-secondary"
							onClick={() => {
								setSelected(players.map(p => ({ p, season })));
							}}
							title="Add all players to export"
						>
							Add All
						</button>
					</div>
				</div>
				<div className="col-12 col-lg-6">
					{rows2.length === 0 ? (
						<p>No players selected</p>
					) : (
						<>
							<div className="clearfix">
								<DataTable
									cols={cols2}
									defaultSort={[0, "asc"]}
									name="ExportPlayers2"
									pagination
									rows={rows2}
								/>
							</div>

							<button
								className="btn btn-lg btn-primary my-3"
								disabled={exporting || selectedPids.length === 0}
								onClick={async () => {
									setExporting(true);
									setErrorMessage(undefined);

									try {
										const { filename, json } = await toWorker(
											"main",
											"exportPlayers",
											selected.map(({ p, season }) => ({
												pid: p.pid,
												season,
											})),
										);

										downloadFile(filename, json, "application/json");
									} catch (error) {
										console.error(error);
										setErrorMessage(error.message);
									}

									setExporting(false);
								}}
							>
								Export Players
							</button>

							{errorMessage ? (
								<div>
									<div className="alert alert-danger d-inline-block mb-0">
										Error exporting players: {errorMessage}
									</div>
								</div>
							) : null}
						</>
					)}
				</div>
			</div>
		</>
	);
};

export default ExportPlayers;
