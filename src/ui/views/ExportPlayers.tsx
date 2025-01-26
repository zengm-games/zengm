import { useEffect, useState } from "react";
import { PLAYER } from "../../common";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers, toWorker, useLocalPartial } from "../util";
import { DataTable, MoreLinks } from "../components";
import type { View } from "../../common/types";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels";
import type { DataTableRow } from "../components/DataTable";
import { useSelectedRows } from "../components/DataTable/useBulkSelectRows";

// For seasonsByPid, key is pid and value is season. No support for exporting the same player from multiple seasons
export const exportPlayers = async (
	seasonsByPid: Map<number, number | "latest">,
	abortSignal?: AbortSignal,
) => {
	const filename = await toWorker("main", "getExportFilename", "players");

	if (abortSignal?.aborted) {
		return;
	}

	const { downloadFileStream, makeExportStream } = await import(
		"../util/exportLeague"
	);

	if (abortSignal?.aborted) {
		return;
	}

	const readableStream = await makeExportStream(["players"], {
		abortSignal,
		filter: {
			players: p => seasonsByPid.has(p.pid),
		},
		forEach: {
			players: p => {
				p.exportedSeason = seasonsByPid.get(p.pid);
				if (p.exportedSeason === "latest") {
					p.exportedSeason = p.ratings.at(-1).season;
				}

				delete p.gamesUntilTradable;
				delete p.numDaysFreeAgent;
				delete p.ptModifier;
				delete p.rosterOrder;
				delete p.statsTids;
				delete p.value;
				delete p.valueFuzz;
				delete p.valueNoPot;
				delete p.valueNoPotFuzz;
				delete p.valueWithContract;
				delete p.watch;
				delete p.yearsFreeAgent;
			},
		},
	});

	if (abortSignal?.aborted) {
		return;
	}

	const fileStream = await downloadFileStream(false, filename, false);

	if (abortSignal?.aborted) {
		return;
	}

	await readableStream.pipeThrough(new TextEncoderStream()).pipeTo(fileStream);
};

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
			p: (typeof players)[number];
			season: number;
		}[]
	>([]);

	useTitleBar({
		title: "Export Players",
		dropdownView: "export_players",
		dropdownFields: { seasons: season },
	});

	const { gender } = useLocalPartial(["gender"]);

	const selectedRows = useSelectedRows();
	console.log("RENDER ProtectPlayers", selectedRows);
	useEffect(() => {
		const pids = Array.from(selectedRows.map.values()).map(p => p.pid);
		console.log("MAP CHANGED", pids);
	}, [selectedRows.map]);

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

	const commonRows = (p: (typeof players)[number]) => {
		const showRatings = !challengeNoRatings || p.tid === PLAYER.RETIRED;

		return [
			wrappedPlayerNameLabels({
				injury: p.injury,
				jerseyNumber: p.jerseyNumber,
				pid: p.pid,
				season: season,
				skills: p.ratings.skills,
				watch: p.watch,
				firstName: p.firstName,
				firstNameShort: p.firstNameShort,
				lastName: p.lastName,
			}),
			p.ratings.pos,
			p.age,
			<a href={helpers.leagueUrl(["roster", `${p.abbrev}_${p.tid}`, season])}>
				{p.abbrev}
			</a>,
			showRatings ? p.ratings.ovr : null,
			showRatings ? p.ratings.pot : null,
		];
	};

	const selectedPids = new Set(selected.map(({ p }) => p.pid));

	const rows: DataTableRow[] = players.map(p => {
		return {
			key: p.pid,
			metadata: {
				type: "player",
				pid: p.pid,
				season,
				playoffs: "regularSeason",
			},
			data: [
				...commonRows(p),
				<button
					className="btn btn-xs btn-primary"
					disabled={exporting || selectedPids.has(p.pid)}
					onClick={() => {
						setSelected([...selected, { p, season }]);
					}}
					title="Add to players to export"
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
					title="Remove from players to export"
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
				When you export a player, it includes all of{" "}
				{helpers.pronoun(gender, "his")} seasons. Then when you import, you will
				be able to select whichever season you want, including the ability to
				select multiple seasons from the same player.
			</p>

			<div className="row">
				<div className="col-12 col-lg-6">
					<div className="clearfix">
						<DataTable
							cols={cols}
							defaultSort={[0, "asc"]}
							defaultStickyCols={window.mobile ? 0 : 1}
							name="ExportPlayers"
							pagination
							rows={rows}
							controlledSelectedRows={selectedRows}
							alwaysShowBulkSelectRows
							disableBulkSelectKeys={selectedPids}
						/>
					</div>
					<div className="my-3">
						<button
							className="btn btn-secondary"
							onClick={() => {
								const currentSelectedPids = new Set(
									selected.map(row => row.p.pid),
								);
								const newSelectedPids = new Set(
									Array.from(selectedRows.map.values())
										.filter(p => !currentSelectedPids.has(p.pid))
										.map(p => p.pid),
								);
								setSelected([
									...selected,
									...players
										.filter(p => newSelectedPids.has(p.pid))
										.map(p => ({ p, season })),
								]);
								selectedRows.clear();
							}}
							disabled={selectedRows.map.size === 0 || exporting}
						>
							Add {helpers.numberWithCommas(selectedRows.map.size)} selected{" "}
							{helpers.plural("player", selectedRows.map.size)} to export
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
									defaultStickyCols={window.mobile ? 0 : 1}
									name="ExportPlayers2"
									pagination
									rows={rows2}
								/>
							</div>

							<div className="my-3 d-flex gap-2">
								<button
									className="btn btn-lg btn-primary"
									disabled={exporting || selectedPids.size === 0}
									onClick={async () => {
										setExporting(true);
										setErrorMessage(undefined);

										try {
											await exportPlayers(
												new Map(
													selected.map(info => {
														return [info.p.pid, info.season];
													}),
												),
											);
										} catch (error) {
											console.error(error);
											setErrorMessage(error.message);
										}

										setExporting(false);
									}}
								>
									Export players
								</button>
								<button
									className="btn btn-lg btn-secondary"
									onClick={() => {
										setSelected([]);
									}}
									title="Clear players to export"
								>
									Clear
								</button>
							</div>

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
