import { getCols, helpers, toWorker } from "../util/index.ts";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { ActionButton, DataTable, MoreLinks } from "../components/index.tsx";
import { wrappedTeamLogoAndName } from "../components/TeamLogoAndName.tsx";
import type { View } from "../../common/types.ts";
import { useState } from "react";
import Note from "./Player/Note.tsx";
import { getDraftPicksColsAndRows } from "./DraftPicks.tsx";
import { getWatchListColsAndRows } from "./WatchList.tsx";

const Notes = (props: View<"notes">) => {
	const [clearing, setClearing] = useState(false);

	useTitleBar({
		title: "Notes",
		dropdownView: "notes",
		dropdownFields: {
			notesType: props.type,
		},
	});

	let infoText;
	let moreLinks;
	let cols;
	let rows;

	if (props.type === "draftPick") {
		const { challengeNoRatings, draftPicks, draftType } = props;

		infoText = (
			<>
				Add notes to draft picks from the{" "}
				<a href={helpers.leagueUrl(["draft_picks"])}>Draft Picks page</a>.
			</>
		);

		moreLinks = <MoreLinks type="draft" page="notes" draftType={draftType} />;

		const output = getDraftPicksColsAndRows({
			challengeNoRatings,
			draftPicks,
			draftPicksOutgoing: [],
		});
		cols = [
			...output.cols,
			...getCols([""], {
				"": {
					noSearch: true,
					sortSequence: [],
				},
			}),
		];
		rows = output.rows;

		for (const row of rows) {
			row.data.push(
				<button
					className="btn btn-danger"
					onClick={async () => {
						await toWorker("main", "setNote", {
							type: "draftPick",
							dpid: row.key as any,
							editedNote: "",
						});
					}}
				>
					Delete
				</button>,
			);
		}
	} else if (props.type === "game") {
		const { games } = props;

		infoText = (
			<>
				Add notes to games at{" "}
				<a href={helpers.leagueUrl(["game_log"])}>
					the bottom of any box score
				</a>
				.
			</>
		);

		cols = getCols(
			["Season", "Playoffs", "Home", "Away", "Score", "Note", ""],
			{
				Note: {
					width: "100%",
				},
				"": {
					noSearch: true,
					sortSequence: [],
				},
			},
		);

		rows = games.map((game) => {
			return {
				key: game.gid,
				data: [
					game.season,
					game.playoffs ? <span className="glyphicon glyphicon-ok" /> : null,
					{
						value: (
							<a
								href={helpers.leagueUrl([
									"roster",
									`${game.home.abbrev}_${game.home.tid}`,
									game.season,
								])}
							>
								{game.home.abbrev}
							</a>
						),
						classNames: game.winner === 0 ? "table-success" : undefined,
					},
					{
						value: (
							<a
								href={helpers.leagueUrl([
									"roster",
									`${game.away.abbrev}_${game.away.tid}`,
									game.season,
								])}
							>
								{game.away.abbrev}
							</a>
						),
						classNames: game.winner === 1 ? "table-success" : undefined,
					},
					<a
						href={helpers.leagueUrl([
							"game_log",
							`${game.home.abbrev}_${game.home.tid}`,
							game.season,
							game.gid,
						])}
					>
						{game.score}
					</a>,
					{
						value: (
							<Note
								note={game.note}
								info={{
									type: "game",
									gid: game.gid,
								}}
							/>
						),
						searchValue: game.note,
						sortValue: game.note,
					},
					<button
						className="btn btn-danger"
						onClick={async () => {
							await toWorker("main", "setNote", {
								type: "game",
								gid: game.gid,
								editedNote: "",
							});
						}}
					>
						Delete
					</button>,
				],
			};
		});
	} else if (props.type === "player") {
		infoText = <>Add notes to players at the top of the player profile page.</>;

		moreLinks = <MoreLinks type="playerNotes" page="notes" />;

		const {
			challengeNoRatings,
			currentSeason,
			phase,
			players,
			playoffs,
			statType,
			stats,
		} = props;

		const output = getWatchListColsAndRows({
			challengeNoRatings,
			currentSeason,
			editableNote: true,
			phase,
			players,
			playoffs,
			statType,
			stats,
		});

		cols = [
			...output.cols,
			...getCols([""], {
				"": {
					noSearch: true,
					sortSequence: [],
				},
			}),
		];
		rows = output.rows;

		for (const row of rows) {
			row.data.push(
				<button
					className="btn btn-danger"
					onClick={async () => {
						await toWorker("main", "setNote", {
							type: "player",
							pid: row.key as any,
							editedNote: "",
						});
					}}
				>
					Delete
				</button>,
			);
		}
	} else if (props.type === "teamSeason") {
		const { teams, ties, otl, usePts, userTid } = props;

		infoText = (
			<>
				Add notes to team seasons from the{" "}
				<a href={helpers.leagueUrl(["roster"])}>Roster page</a>.
			</>
		);

		moreLinks = <MoreLinks type="league" page="notes" />;

		const colNames = ["Team", "Season", "W", "L"];
		if (otl) {
			colNames.push("OTL");
		}
		if (ties) {
			colNames.push("T");
		}
		if (usePts) {
			colNames.push("PTS", "PTS%");
		} else {
			colNames.push("%");
		}
		colNames.push("Playoffs", "Note", "");

		cols = getCols(colNames, {
			Note: {
				width: "100%",
			},
			"": {
				noSearch: true,
				sortSequence: [],
			},
		});

		rows = teams.map((t) => {
			return {
				key: JSON.stringify([t.tid, t.season]),
				data: [
					wrappedTeamLogoAndName(
						{
							tid: t.tid,
							seasonAttrs: t,
						},
						helpers.leagueUrl(["roster", `${t.abbrev}_${t.tid}`, t.season]),
					),
					t.season,
					t.won,
					t.lost,
					...(otl ? [t.otl] : []),
					...(ties ? [t.tid] : []),
					...(usePts
						? [Math.round(t.pts), helpers.roundWinp(t.ptsPct)]
						: [helpers.roundWinp(t.winp)]),
					{
						value: (
							<a
								href={helpers.leagueUrl([
									t.playoffRoundsWon >= 0 ? "playoffs" : "standings",
									t.season,
								])}
							>
								{t.roundsWonText}
							</a>
						),
						sortValue: t.playoffRoundsWon,
						searchValue: t.roundsWonText,
					},
					{
						value: (
							<Note
								note={t.note}
								info={{
									type: "teamSeason",
									tid: t.tid,
									season: t.season,
								}}
							/>
						),
						searchValue: t.note,
						sortValue: t.note,
					},
					<button
						className="btn btn-danger"
						onClick={async () => {
							await toWorker("main", "setNote", {
								type: "teamSeason",
								tid: t.tid,
								season: t.season,
								editedNote: "",
							});
						}}
					>
						Delete
					</button>,
				],
				classNames: {
					"table-info": t.tid === userTid,
				},
			};
		});
	} else {
		throw new Error("Should never happen");
	}

	return (
		<>
			{moreLinks}

			<p>{infoText}</p>

			{rows.length > 0 ? (
				<>
					<ActionButton
						className="mb-3"
						onClick={async () => {
							setClearing(true);
							await toWorker("main", "clearNotes", props.type);
							setClearing(false);
						}}
						processing={clearing}
						variant="danger"
					>
						Clear{" "}
						{props.type === "draftPick"
							? "draft pick"
							: props.type === "game"
								? "game"
								: props.type === "player"
									? "player"
									: "team"}{" "}
						notes
					</ActionButton>

					<DataTable
						className="align-top-all"
						cols={cols}
						defaultSort={[0, "asc"]}
						name={`Notes${props.type}`}
						pagination
						rows={rows}
					/>
				</>
			) : null}
		</>
	);
};

export default Notes;
