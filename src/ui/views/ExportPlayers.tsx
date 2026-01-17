import { useEffect, useState } from "react";
import { PLAYER } from "../../common/index.ts";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { getCols, helpers, toWorker, useLocalPartial } from "../util/index.ts";
import { ActionButton, DataTable, MoreLinks } from "../components/index.tsx";
import type { View } from "../../common/types.ts";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels.tsx";
import type { DataTableRow } from "../components/DataTable/index.tsx";
import { useSelectedRows } from "../components/DataTable/useBulkSelectRows.ts";

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
		"../util/exportLeague.ts"
	);

	if (abortSignal?.aborted) {
		return;
	}

	const readableStream = await makeExportStream(["players"], {
		abortSignal,
		filter: {
			players: (p) => seasonsByPid.has(p.pid),
		},
		forEach: {
			players: (p) => {
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
	const selectedRows2 = useSelectedRows();

	// When we switch to a new season of players, clear any checkboxes because some might not exist in the new season
	// clearSelectedRows is for eslint
	const clearSelectedRows = selectedRows.clear;
	useEffect(() => {
		clearSelectedRows();
	}, [season, clearSelectedRows]);

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
				season,
				skills: p.ratings.skills,
				defaultWatch: p.watch,
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

	const rows: DataTableRow[] = players.map((p) => {
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
						selectedRows.delete(p.pid);
					}}
					title="Add player to export"
				>
					Add
				</button>,
			],
		};
	});

	const rows2: DataTableRow[] = selected.map(({ p }, i) => {
		return {
			key: p.pid,
			metadata: {
				type: "player",
				pid: p.pid,
				season,
				playoffs: "regularSeason",
			},
			data: [
				i + 1,
				...commonRows(p),
				<button
					className="btn btn-xs btn-primary"
					disabled={exporting}
					onClick={() => {
						setSelected(selected.filter((row) => row.p.pid !== p.pid));
					}}
					title="Remove player from export"
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
									selected.map((row) => row.p.pid),
								);
								const newSelectedPids = new Set(
									Array.from(selectedRows.map.values())
										.filter((metadata) => metadata.type === "player")
										.filter((p) => !currentSelectedPids.has(p.pid))
										.map((p) => p.pid),
								);
								setSelected([
									...selected,
									...players
										.filter((p) => newSelectedPids.has(p.pid))
										.map((p) => ({ p, season })),
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
									controlledSelectedRows={selectedRows2}
									alwaysShowBulkSelectRows
								/>
							</div>

							<div className="my-3 d-flex align-items-center gap-2">
								<ActionButton
									disabled={selectedPids.size === 0}
									onClick={async () => {
										setExporting(true);
										setErrorMessage(undefined);

										try {
											await exportPlayers(
												new Map(
													selected.map((info) => {
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
									processing={exporting}
									processingText="Exporting"
									size="lg"
									variant="primary"
								>
									Export
									<span className="d-none d-sm-inline">
										{" "}
										{selected.length}{" "}
										{helpers.plural("player", selected.length)}
									</span>
								</ActionButton>
								<button
									className="btn btn-secondary"
									onClick={() => {
										setSelected([]);
									}}
									title="Clear players to export"
									disabled={exporting || selectedPids.size === 0}
								>
									Clear
								</button>
								<button
									className="btn btn-secondary"
									onClick={() => {
										const pidsToRemove = new Set(
											Array.from(selectedRows2.map.values())
												.filter((metadata) => metadata.type === "player")
												.map((p) => p.pid),
										);
										setSelected(
											selected.filter((p) => !pidsToRemove.has(p.p.pid)),
										);
										selectedRows2.deleteAll(pidsToRemove);
									}}
									disabled={selectedRows2.map.size === 0 || exporting}
								>
									Remove{" "}
									<span className="d-none d-sm-inline">
										{helpers.numberWithCommas(selectedRows2.map.size)}{" "}
									</span>
									selected
									<span className="d-none d-sm-inline">
										{" "}
										{helpers.plural("player", selectedRows2.map.size)} from
										export
									</span>
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
