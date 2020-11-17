import React, { useState, ChangeEvent } from "react";
import { PLAYER, PHASE } from "../../common";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers, toWorker, useLocal } from "../util";
import {
	DataTable,
	PlayerNameLabels,
	LeagueFileUpload,
	MoreLinks,
} from "../components";
import type { View } from "../../common/types";
import orderBy from "lodash/orderBy";

const ImportPlayers = ({
	challengeNoRatings,
	currentSeason,
	godMode,
	phase,
}: View<"importPlayers">) => {
	const [status, setStatus] = useState<
		undefined | "loading" | "importing" | "success"
	>();
	const [errorMessage, setErrorMessage] = useState<string | undefined>();
	const [leagueFile, setLeagueFile] = useState<{
		startingSeason: number;
		version?: number;
	}>({
		startingSeason: currentSeason,
	});
	const [players, setPlayers] = useState<
		{
			p: any;
			checked: boolean;
			contractAmount: string;
			contractExp: string;
			draftYear: string;
			season: number;
			seasonOffset: number;
			tid: number;
		}[]
	>([]);

	const teamInfoCache = useLocal(state => state.teamInfoCache);

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
				.filter(t => !t.disabled),
			["name", "tid"],
		),
	];

	useTitleBar({
		title: "Import Players",
		dropdownView: "import_players",
	});

	const links = <MoreLinks type="importExport" page="import_players" />;

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
		"",
		"#",
		"Name",
		"Pos",
		"Ovr",
		"Pot",
		"Age",
		"Team",
		"Contract",
		"Exp",
	);
	cols[2].width = "100%";

	const handleChange = (
		name:
			| "age"
			| "checked"
			| "contractAmount"
			| "contractExp"
			| "draftYear"
			| "tid",
		index: number,
	) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const player = {
			...players[index],
		};

		if (name === "checked") {
			player.checked = !player.checked;
		} else if (name === "age") {
			player.season = parseInt(event.target.value);
		} else if (name === "tid") {
			player.tid = parseInt(event.target.value);
		} else {
			player[name] = event.target.value;
		}

		const newPlayers = [...players];
		newPlayers[index] = player;

		setPlayers(newPlayers);
	};

	const disableButtons = status !== undefined && status !== "success";

	const rows = players.map((player, i) => {
		const {
			p,
			checked,
			contractAmount,
			contractExp,
			draftYear,
			season,
			seasonOffset,
			tid,
		} = player;

		const showRatings = !challengeNoRatings;

		// const abbrev = helpers.getAbbrev(tid, teamInfoCache);

		let ratings = p.ratings[p.ratings.length - 1];

		for (let i = p.ratings.length - 1; i--; i >= 0) {
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
		}[] = ratingsSeasons.map(ratingsSeason => {
			return {
				season: ratingsSeason + seasonOffset,
				age: ratingsSeason - p.born.year,
			};
		});

		const name = `${p.firstName} ${p.lastName}`;

		const ageRow = ages.find(row => row.season === season);
		const age = ageRow ? ageRow.age : 0;

		return {
			key: i,
			data: [
				{
					value: (
						<input
							type="checkbox"
							title="Import player"
							checked={checked}
							disabled={disableButtons}
							onChange={handleChange("checked", i)}
						/>
					),
					sortValue: checked ? 1 : 0,
				},
				i + 1,
				{
					value: (
						<div className="d-flex align-items-center justify-content-between">
							<PlayerNameLabels injury={p.injury} skills={ratings.skills}>
								{name}
							</PlayerNameLabels>
							<button
								className="btn btn-secondary btn-sm ml-2"
								disabled={disableButtons}
								onClick={() => {
									const newPlayers = [...players];
									newPlayers.splice(i, 0, helpers.deepCopy(player));
									setPlayers(newPlayers);
								}}
							>
								Clone
							</button>
						</div>
					),
					sortValue: name,
				},
				ratings.pos,
				showRatings ? ratings.ovr : null,
				showRatings ? ratings.pot : null,
				{
					value: (
						<select
							className="form-control"
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
								className="form-control"
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
							<div
								className="input-group input-group"
								style={{ minWidth: 180 }}
							>
								<div className="input-group-prepend">
									<div className="input-group-text">$</div>
								</div>
								<input
									type="text"
									className="form-control"
									onChange={handleChange("contractAmount", i)}
									value={contractAmount}
								/>
								<div className="input-group-append">
									<div className="input-group-text">M per year</div>
								</div>
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
						sortValue: parseInt(contractExp),
					}
				) : (
					<div style={{ minWidth: 60 }} />
				),
			],
		};
	});

	const numChecked = players.filter(p => p.checked).length;

	return (
		<>
			{links}

			<p>
				Upload an exported players file or a league file below. You will be able
				to select the specific players you want from that file before actually
				importing them.
			</p>

			<LeagueFileUpload
				disabled={disableButtons}
				onLoading={() => {
					setStatus("loading");
				}}
				onDone={async (error, leagueFile) => {
					setStatus(undefined);

					if (error) {
						return;
					}

					let startingSeason = leagueFile.startingSeason;
					if (typeof startingSeason !== "number" && leagueFile.gameAttributes) {
						const row = leagueFile.gameAttributes.find(
							(row: any) => row.key === "startingSeason",
						);
						if (row) {
							startingSeason = row.value;
						}
					}
					if (typeof startingSeason !== "number") {
						throw new Error("League file must include startingSeason");
					}

					setLeagueFile({
						startingSeason: leagueFile.startingSeason,
						version: leagueFile.version,
					});

					leagueFile.players = leagueFile.players ? leagueFile.players : [];

					const players = leagueFile.players.map((p: any) => {
						const exportedSeason: number | undefined =
							typeof p.exportedSeason === "number"
								? p.exportedSeason
								: undefined;

						const season =
							exportedSeason !== undefined
								? p.exportedSeason
								: p.ratings[p.ratings.length - 1].season;

						let tid;
						if (
							Array.isArray(p.stats) &&
							p.stats.length > 0 &&
							exportedSeason !== undefined
						) {
							for (let i = p.stats.length - 1; i--; i >= 0) {
								const ps = p.stats[i];
								if (ps.season === p.exportedSeason) {
									if (
										ps.tid < teamInfoCache.length &&
										!teamInfoCache[ps.tid].disabled
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

						let checked = true;
						if (tid < PLAYER.UNDRAFTED) {
							tid = PLAYER.FREE_AGENT;
							checked = false;
						}

						let contractAmount = 1;
						let contractExp = season + 1;
						if (
							p.contract &&
							season === p.ratings[p.ratings.length - 1].season
						) {
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
							checked,
							contractAmount: String(contractAmount),
							contractExp: String(contractExp + seasonOffset),
							draftYear: String(currentSeason + (phase >= PHASE.DRAFT ? 1 : 0)),
							season: season + seasonOffset,
							seasonOffset,
							tid,
						};
					});

					setPlayers(players);
				}}
			/>

			{rows.length > 0 ? (
				<>
					<div className="mb-3">
						<button
							className="btn btn-link p-0"
							onClick={() => {
								setPlayers(
									players.map(p => ({
										...p,
										checked: true,
									})),
								);
							}}
						>
							Select All
						</button>{" "}
						|{" "}
						<button
							className="btn btn-link p-0"
							onClick={() => {
								setPlayers(
									players.map(p => ({
										...p,
										checked: false,
									})),
								);
							}}
						>
							Select None
						</button>
					</div>
					<div className="clearfix">
						<DataTable
							cols={cols}
							defaultSort={[1, "asc"]}
							name="ImportPlayers"
							pagination
							rows={rows}
						/>
					</div>

					<button
						className="btn btn-lg btn-primary my-3"
						disabled={disableButtons || numChecked === 0}
						onClick={async () => {
							setStatus("importing");
							setErrorMessage(undefined);

							try {
								await toWorker(
									"main",
									"importPlayers",
									leagueFile,
									players.filter(p => p.checked),
								);
								setStatus("success");
							} catch (error) {
								console.error(error);
								setErrorMessage(error.message);
								setStatus(undefined);
							}
						}}
					>
						Import {numChecked} Players
					</button>

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

export default ImportPlayers;
