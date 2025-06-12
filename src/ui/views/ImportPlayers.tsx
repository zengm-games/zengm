import { useState, type ChangeEvent } from "react";
import { PLAYER, PHASE, LEAGUE_DATABASE_VERSION } from "../../common/index.ts";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { getCols, helpers, toWorker, useLocal } from "../util/index.ts";
import {
	ActionButton,
	DataTable,
	LeagueFileUpload,
	MoreLinks,
} from "../components/index.tsx";
import type { View } from "../../common/types.ts";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels.tsx";
import { orderBy } from "../../common/utils.ts";
import { useSelectedRows } from "../components/DataTable/useBulkSelectRows.ts";
import type { DataTableRow } from "../components/DataTable/index.tsx";

export const ImportPlayersInner = ({
	challengeNoRatings,
	currentSeason,
	godMode,
	phase,
	real,
}: View<"importPlayers"> & {
	real: boolean;
}) => {
	const [status, setStatus] = useState<
		undefined | "loading" | "loadingReal" | "importing" | "success"
	>();
	const [errorMessage, setErrorMessage] = useState<string | undefined>();
	const [leagueFileVersion, setLeagueFileVersion] = useState<
		number | undefined
	>();
	const [players, setPlayers] = useState<
		{
			p: any;
			contractAmount: string;
			contractExp: string;
			draftYear: string;
			season: number;
			seasonOffset: number;
			tid: number;
		}[]
	>([]);

	const teamInfoCache = useLocal((state) => state.teamInfoCache);

	const teams = [
		{
			tid: PLAYER.UNDRAFTED,
			name: "Draft Prospect",
		},
		{
			tid: PLAYER.FREE_AGENT,
			name: "Free Agent",
		},
		...orderBy(
			teamInfoCache
				.map((t, i) => ({
					tid: i,
					name: `${t.region} ${t.name}`,
					disabled: t.disabled,
				}))
				.filter((t) => !t.disabled),
			["name", "tid"],
		),
	];

	const selectedRows = useSelectedRows();

	const links = (
		<MoreLinks
			type="importExport"
			page={real ? "import_players_real" : "import_players"}
		/>
	);

	if (!godMode) {
		return (
			<>
				{links}
				<p>
					You can only import players in{" "}
					<a href={helpers.leagueUrl(["god_mode"])}>God Mode</a>.
				</p>
			</>
		);
	}

	const cols = getCols(
		["#", "Name", "", "Pos", "Ovr", "Pot", "Age", "Team", "Contract", "Exp"],
		{
			Name: {
				width: "100%",
			},
			"": {
				width: "1%",
			},
		},
	);

	const handleChange =
		(
			name: "age" | "contractAmount" | "contractExp" | "draftYear" | "tid",
			index: number,
		) =>
		(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
			const player = {
				...players[index]!,
			};

			if (name === "age") {
				player.season = Number.parseInt(event.target.value);
			} else if (name === "tid") {
				player.tid = Number.parseInt(event.target.value);
			} else {
				player[name] = event.target.value;
			}

			const newPlayers = [...players];
			newPlayers[index] = player;

			setPlayers(newPlayers);
		};

	const disableButtons = status !== undefined && status !== "success";

	const metadata: DataTableRow["metadata"] = {
		type: "row",
	};

	const rows: DataTableRow[] = players.map((player, i) => {
		const {
			p,
			contractAmount,
			contractExp,
			draftYear,
			season,
			seasonOffset,
			tid,
		} = player;

		const showRatings = !challengeNoRatings;

		// const abbrev = helpers.getAbbrev(tid, teamInfoCache);

		let ratings = p.ratings.at(-1);

		for (let i = p.ratings.length - 1; i >= 0; i--) {
			if (p.ratings[i].season + seasonOffset === season) {
				ratings = p.ratings[i];
				break;
			}
		}

		const ratingsSeasons: number[] = Array.from(
			new Set(p.ratings.map((ratings: any) => ratings.season)),
		);

		const ages: {
			season: number;
			age: number;
		}[] = ratingsSeasons.map((ratingsSeason) => {
			return {
				season: ratingsSeason + seasonOffset,
				age: ratingsSeason - p.born.year,
			};
		});

		const ageRow = ages.find((row) => row.season === season);
		const age = ageRow ? ageRow.age : 0;

		return {
			key: i,
			metadata,
			data: [
				i + 1,
				wrappedPlayerNameLabels({
					injury: p.injury,
					skills: ratings.skills,
					firstName: p.firstName,
					lastName: p.lastName,
				}),
				<button
					className="btn btn-secondary btn-sm"
					disabled={disableButtons}
					onClick={() => {
						const newPlayers = [...players];
						newPlayers.splice(i, 0, helpers.deepCopy(player));
						setPlayers(newPlayers);

						// Hacky! We're using row index as the primary key for the bulkSelect checkboxes, so we need to adjust that
						const checked = [];
						for (const key of selectedRows.map.keys()) {
							let newKey = key as number;
							if (newKey > i) {
								newKey += 1;
							}
							checked.push({ key: newKey, metadata });
						}

						// If cloned row was checked, check the clone too
						if (selectedRows.map.has(i)) {
							checked.push({ key: i + 1, metadata });
						}

						selectedRows.clear();
						selectedRows.setAll(checked);
					}}
				>
					Clone
				</button>,
				ratings.pos,
				showRatings ? ratings.ovr : null,
				showRatings ? ratings.pot : null,
				{
					value: (
						<select
							className="form-select"
							onChange={handleChange("age", i)}
							style={{ minWidth: 60 }}
							value={season}
						>
							{ages.map(({ season, age }) => {
								return (
									<option key={season} value={season}>
										{age}
									</option>
								);
							})}
						</select>
					),
					sortValue: age,
				},
				{
					value: (
						<div className="d-flex" style={{ minWidth: 200 }}>
							<select
								className="form-select"
								onChange={handleChange("tid", i)}
								value={tid}
							>
								{teams.map(({ tid, name }) => {
									return (
										<option key={tid} value={tid}>
											{name}
										</option>
									);
								})}
							</select>
							{tid === PLAYER.UNDRAFTED ? (
								<input
									type="text"
									className="form-control"
									onChange={handleChange("draftYear", i)}
									style={{ width: 60 }}
									value={draftYear}
								/>
							) : null}
						</div>
					),
					sortValue: tid,
				},
				tid >= PLAYER.FREE_AGENT ? (
					{
						value: (
							<div className="input-group" style={{ minWidth: 180 }}>
								<div className="input-group-text">$</div>
								<input
									type="text"
									className="form-control"
									onChange={handleChange("contractAmount", i)}
									value={contractAmount}
								/>
								<div className="input-group-text">M per year</div>
							</div>
						),
						sortValue: `$${contractAmount}M`,
					}
				) : (
					<div style={{ minWidth: 180 }} />
				),
				tid >= PLAYER.FREE_AGENT ? (
					{
						value: (
							<input
								type="text"
								className="form-control"
								onChange={handleChange("contractExp", i)}
								style={{ minWidth: 60 }}
								value={contractExp}
							/>
						),
						sortValue: Number.parseInt(contractExp),
					}
				) : (
					<div style={{ minWidth: 60 }} />
				),
			],
		};
	});

	return (
		<>
			{links}

			{!real ? (
				<>
					<p>
						Upload an exported players file or a league file below. You will be
						able to select the specific players you want from that file before
						actually importing them.
					</p>

					<LeagueFileUpload
						disabled={disableButtons}
						includePlayersInBasicInfo
						onLoading={() => {
							setStatus("loading");
						}}
						onDone={async (error, output) => {
							setStatus(undefined);

							if (error || !output) {
								return;
							}

							const leagueFile = output.basicInfo;
							setLeagueFileVersion(leagueFile.version);

							const rawPlayers: any[] = leagueFile.players ?? [];

							const players = rawPlayers.map((p) => {
								const exportedSeason: number | undefined =
									typeof p.exportedSeason === "number"
										? p.exportedSeason
										: undefined;

								const season =
									exportedSeason !== undefined
										? p.exportedSeason
										: p.ratings.at(-1).season;

								let tid;
								if (
									Array.isArray(p.stats) &&
									p.stats.length > 0 &&
									exportedSeason !== undefined
								) {
									for (let i = p.stats.length - 1; i >= 0; i--) {
										const ps = p.stats[i];
										if (ps.season === p.exportedSeason) {
											if (
												ps.tid < teamInfoCache.length &&
												!teamInfoCache[ps.tid]!.disabled
											) {
												tid = ps.tid;
											}
											break;
										}
									}
								}
								if (typeof tid !== "number") {
									tid = p.tid;
								}

								if (
									tid < PLAYER.UNDRAFTED ||
									tid >= teamInfoCache.length ||
									(tid >= 0 && teamInfoCache[tid]!.disabled)
								) {
									tid = PLAYER.FREE_AGENT;
								}

								let contractAmount = 1;
								let contractExp = season + 1;
								if (p.contract && season === p.ratings.at(-1).season) {
									// Exported the latest season for this player
									contractAmount = p.contract.amount / 1000;
									contractExp = p.contract.exp;
								} else {
									// Exported some historical season, try to figure out contract
									const salaryRow = Array.isArray(p.salaries)
										? p.salaries.find((row: any) => row.season === season)
										: undefined;
									if (salaryRow) {
										contractAmount = salaryRow.amount / 1000;
									}
								}

								const seasonOffset = currentSeason - season;

								return {
									p,
									checked: false,
									contractAmount: String(contractAmount),
									contractExp: String(contractExp + seasonOffset),
									draftYear: String(
										currentSeason + (phase >= PHASE.DRAFT ? 1 : 0),
									),
									season: season + seasonOffset,
									seasonOffset,
									tid,
								};
							});

							selectedRows.clear();
							setPlayers(players);
						}}
					/>
				</>
			) : players.length === 0 ? (
				<ActionButton
					className="mb-3"
					disabled={disableButtons}
					onClick={async () => {
						setStatus("loadingReal");

						const players2 = await toWorker(
							"main",
							"importPlayersGetReal",
							undefined,
						);

						const players = players2.map((p) => {
							// Rookie season, not draft prospect season, when possible
							const season = (p.ratings[1] ?? p.ratings[0]).season;

							const seasonOffset = currentSeason - season;

							return {
								p,
								checked: false,
								contractAmount: String(p.contract.amount / 1000),
								contractExp: String(p.contract.exp),
								draftYear: String(
									currentSeason + (phase >= PHASE.DRAFT ? 1 : 0),
								),
								season: season + seasonOffset,
								seasonOffset,
								tid: PLAYER.FREE_AGENT,
							};
						});

						selectedRows.clear();
						setPlayers(players);
						setLeagueFileVersion(LEAGUE_DATABASE_VERSION);
						setStatus(undefined);
					}}
					processing={status === "loadingReal"}
					processingText="Loading..."
					size="lg"
					variant="primary"
				>
					Load real players
				</ActionButton>
			) : null}

			{rows.length > 0 ? (
				<>
					<DataTable
						cols={cols}
						defaultSort={[0, "asc"]}
						defaultStickyCols={window.mobile ? 0 : 2}
						name="ImportPlayers"
						pagination
						rows={rows}
						controlledSelectedRows={selectedRows}
						alwaysShowBulkSelectRows
					/>

					<ActionButton
						className="my-3"
						disabled={disableButtons || selectedRows.map.size === 0}
						onClick={async () => {
							setStatus("importing");
							setErrorMessage(undefined);

							try {
								await toWorker("main", "importPlayers", {
									leagueFileVersion,
									players: players.filter((p, i) => selectedRows.map.has(i)),
								});
								setStatus("success");
							} catch (error) {
								console.error(error);
								setErrorMessage(error.message);
								setStatus(undefined);
							}
						}}
						processing={status === "importing"}
						processingText="Importing"
						size="lg"
						variant="primary"
					>
						Import {selectedRows.map.size}{" "}
						{helpers.plural("player", selectedRows.map.size)}
					</ActionButton>

					{status === "success" ? (
						<div>
							<div className="alert alert-success d-inline-block mb-0">
								Successfully imported players!
							</div>
						</div>
					) : null}

					{errorMessage ? (
						<div>
							<div className="alert alert-danger d-inline-block mb-0">
								Error importing players: {errorMessage}
							</div>
						</div>
					) : null}
				</>
			) : null}
		</>
	);
};

const ImportPlayers = (props: View<"importPlayers">) => {
	useTitleBar({
		title: "Import Players",
		dropdownView: "import_players",
	});

	return <ImportPlayersInner {...props} real={false} />;
};

export default ImportPlayers;
