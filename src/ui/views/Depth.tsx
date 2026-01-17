import clsx from "clsx";
import { useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { getCols, helpers, toWorker, useLocalPartial } from "../util/index.ts";
import { DataTable, MoreLinks } from "../components/index.tsx";
import type { View } from "../../common/types.ts";
import { bySport, isSport } from "../../common/index.ts";
import { NUM_LINES } from "../../common/constants.hockey.ts";
import {
	NUM_ACTIVE_BATTERS,
	NUM_ACTIVE_PITCHERS,
	NUM_STARTING_PITCHERS,
} from "../../common/constants.baseball.ts";
import { range } from "../../common/utils.ts";
import type { DataTableRow } from "../components/DataTable/index.tsx";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels.tsx";

const handleAutoSort = async (pos: string) => {
	await toWorker("main", "autoSortRoster", { pos });
};

const handleAutoSortAll = async () => {
	await toWorker("main", "autoSortRoster", undefined);
};

const lowerCaseWords = (string: string) => {
	return string
		.split(" ")
		.map((word) =>
			isSport("baseball") && word === "DH)"
				? "DH)"
				: `${word.charAt(0).toLowerCase()}${word.slice(1)}`,
		)
		.join(" ");
};

const numStartersByPos = bySport<
	Record<string, number | Record<string, number>>
>({
	baseball: {
		L: 9,
		LP: 9,
		D: NUM_ACTIVE_BATTERS,
		DP: NUM_ACTIVE_BATTERS,
		P: {
			SP: NUM_STARTING_PITCHERS,
			RP: NUM_ACTIVE_PITCHERS - NUM_STARTING_PITCHERS,
		},
	},
	basketball: {},
	football: {
		QB: 1,
		RB: 1,
		WR: 3,
		TE: 1,
		OL: 5,
		DL: 4,
		LB: 3,
		CB: 2,
		S: 2,
		K: 1,
		P: 1,
		KR: 1,
		PR: 1,
	},
	hockey: {
		F: {
			C: 1,
			W: 2,
		},
		D: 2,
		G: 1,
	},
});

const posNames = bySport<Record<string, string> | undefined>({
	baseball: {
		L: "Batting Order",
		LP: "Batting Order (no DH)",
		D: "Defense",
		DP: "Defense (no DH)",
		P: "Pitching",
	},
	hockey: {
		F: "Forwards",
		D: "Defense",
		G: "Goalies",
	},
	default: undefined,
});

const numLinesByPos: Record<string, number> | undefined = isSport("hockey")
	? NUM_LINES
	: undefined;

const Depth = ({
	abbrev,
	challengeNoRatings,
	editable,
	keepRosterSorted,
	multiplePositionsWarning,
	players,
	playoffs,
	pos,
	ratings,
	season,
	showDH,
	stats,
	tid,
}: View<"depth">) => {
	if (!isSport("baseball") && !isSport("football") && !isSport("hockey")) {
		throw new Error("Not implemented");
	}

	const [sortedPids, setSortedPids] = useState<number[] | undefined>();
	const [prevPos, setPrevPos] = useState(pos);
	const [prevPlayers, setPrevPlayers] = useState(players);

	useTitleBar({
		title: bySport({
			baseball: (posNames && posNames[pos]) ?? "Batting Order",
			hockey: "Lines",
			default: "Depth Chart",
		}),
		dropdownView: "depth",
		dropdownFields: { depth: pos, teams: abbrev, playoffsCombined: playoffs },
		moreInfoAbbrev: abbrev,
		moreInfoSeason: season,
		moreInfoTid: tid,
	});

	const { gender } = useLocalPartial(["gender"]);

	if (pos !== prevPos) {
		setSortedPids(undefined);
		setPrevPos(pos);
	}
	if (players !== prevPlayers) {
		setSortedPids(undefined);
		setPrevPlayers(players);
	}

	let playersSorted;
	if (sortedPids !== undefined) {
		playersSorted = sortedPids.map((pid) => {
			const p2 = players.find((p) => p.pid === pid);
			if (!p2) {
				throw new Error("Player not found");
			}
			return p2;
		});
	} else {
		playersSorted = players;
	}

	let numStarters = 0;
	let positions: string[];
	const entry = numStartersByPos[pos]!;
	if (typeof entry === "number") {
		numStarters = entry;
		positions = [pos];
	} else {
		for (const num of Object.values(entry)) {
			numStarters += num;
		}
		positions = Object.keys(entry);
	}

	const numLines = numLinesByPos ? numLinesByPos[pos]! : 1;

	let rowLabels: string[] | undefined;
	if (isSport("baseball")) {
		if (pos === "L" || pos === "LP") {
			rowLabels = range(1, 10).map(String);
		} else if (pos === "D") {
			rowLabels = ["C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"];
		} else if (pos === "DP") {
			rowLabels = ["C", "1B", "2B", "3B", "SS", "LF", "CF", "RF"];
		} else if (pos === "P") {
			rowLabels = [
				"S1",
				"S2",
				"S3",
				"S4",
				"S5",
				"CL",
				"RP",
				"RP",
				"RP",
				"RP",
				"RP",
				"RP",
				"RP",
				"RP",
				"RP",
			];
		}
	}

	const getIDsToSave = (pids: number[]): number[] => {
		// For baseball lineup where saved IDs are not player IDs
		if (isSport("baseball") && (pos === "L" || pos === "LP")) {
			return pids.map((pid) => {
				const p2 = players.find((p) => p.pid === pid);
				if (!p2) {
					throw new Error("Player not found");
				}
				return p2.lineupIndex;
			});
		}

		return pids;
	};

	const overrides: Parameters<typeof getCols>[1] = {};
	for (const rating of ratings) {
		overrides[`rating:${rating}`] = {
			classNames: "table-accent",
		};
	}

	const cols = getCols(
		[
			"Name",
			"Pos",
			"Age",
			...positions.flatMap((position) => {
				if (isSport("baseball") && pos !== "P") {
					return ["Ovr", "Pot"];
				} else {
					return [`rating:ovr${position}`, `rating:pot${position}`];
				}
			}),
			...ratings.map((rating) => `rating:${rating}`),
			...stats.map((stat) => `stat:${stat}`),
		],
		overrides,
	);

	const rows: DataTableRow[] = playersSorted.map((p, i) => {
		let highlightPosOvr: string | undefined;
		if (isSport("hockey") && pos === "F" && i < numLines * numStarters) {
			highlightPosOvr = i % numStarters === 0 ? "C" : "W";
		} else if (isSport("baseball") && pos === "P") {
			if (i < 5) {
				highlightPosOvr = "SP";
			} else if (i < numStarters) {
				highlightPosOvr = "RP";
			}
		}

		let lineupPos;
		if (isSport("baseball") && pos === "D" && rowLabels?.[i]) {
			lineupPos = rowLabels[i];
		} else {
			lineupPos = p.lineupPos ?? p.ratings.pos;
		}

		return {
			key: p.pid,
			metadata: {
				type: "player",
				pid: p.pid,
				season,
				playoffs,
			},
			rowLabel: rowLabels?.[i],
			classNames: ({ isDragged }) => ({
				separator:
					!isDragged &&
					((isSport("baseball") && pos === "P" && i === 4) ||
						(isSport("baseball") && pos === "D" && i === 8) ||
						(isSport("baseball") && pos === "DP" && i === 7) ||
						((i % numStarters) + 1 === numStarters &&
							i < numLines * numStarters &&
							i !== playersSorted.length - 1)),
			}),
			data: [
				p.pid >= 0
					? wrappedPlayerNameLabels({
							pid: p.pid,
							injury: p.injury,
							jerseyNumber: p.stats.jerseyNumber,
							skills: p.ratings.skills,
							defaultWatch: p.watch,
							firstName: p.firstName,
							firstNameShort: p.firstNameShort,
							lastName: p.lastName,
						})
					: null,
				{
					value:
						isSport("baseball") && (pos === "D" || pos === "DP")
							? p.ratings.pos
							: p.pid >= 0
								? lineupPos
								: p.pid === -1
									? "P"
									: null,
					classNames: {
						"text-danger":
							isSport("baseball") && p.lineupPos !== undefined
								? p.pid >= 0 &&
									p.lineupPos !== "DH" &&
									p.lineupPos !== p.ratings.pos
								: isSport("baseball") && (pos === "D" || pos === "DP")
									? rowLabels?.[i] !== undefined &&
										rowLabels[i] !== "DH" &&
										rowLabels[i] !== p.ratings.pos
									: !isSport("baseball") &&
										p.pid >= 0 &&
										pos !== "KR" &&
										pos !== "PR" &&
										!positions.includes(p.ratings.pos),
					},
				},
				p.age,
				...(isSport("baseball") && pos !== "P"
					? [
							!challengeNoRatings && p.pid >= 0
								? (p.ratings.ovrs[lineupPos] ?? p.ratings.ovr)
								: null,
							!challengeNoRatings && p.pid >= 0
								? (p.ratings.pots[lineupPos] ?? p.ratings.pot)
								: null,
						]
					: positions.flatMap((position) => [
							{
								value:
									!challengeNoRatings && p.pid >= 0
										? p.ratings.ovrs[position]
										: null,
								classNames:
									highlightPosOvr === position ? "table-primary" : undefined,
							},
							!challengeNoRatings && p.pid >= 0
								? p.ratings.pots[position]
								: null,
						])),
				...ratings.map((rating) => ({
					value: !challengeNoRatings && p.pid >= 0 ? p.ratings[rating] : null,
					classNames: "table-accent",
				})),
				...stats.map((stat) =>
					p.pid >= 0 ? helpers.roundStat(p.stats[stat], stat) : null,
				),
			],
		};
	});

	return (
		<>
			<MoreLinks type="team" page="depth" abbrev={abbrev} tid={tid} />
			<p>
				{isSport("football") ? (
					<>
						Click or drag row handles to move players between the starting
						lineup <span className="table-info legend-square" /> and the bench{" "}
						<span className="table-secondary legend-square" />.
					</>
				) : null}
				{isSport("hockey")
					? "There are four lines of forwards (centers and wings) and three lines of defensive players. The top lines play the most. All the players in a line will generally play together, but when injuries or other disruptions occur, a player will be moved up from below."
					: null}
			</p>

			{multiplePositionsWarning ? (
				<div className="alert alert-danger d-inline-block mb-3">
					{multiplePositionsWarning}
				</div>
			) : null}

			<ul
				className={`nav nav-tabs mb-3 ${
					isSport("baseball") ? "" : "d-none d-sm-flex"
				}`}
			>
				{Object.keys(numStartersByPos).map((pos2) => {
					if (
						(showDH === "noDH" && (pos2 === "L" || pos2 === "D")) ||
						(showDH === "dh" && (pos2 === "LP" || pos2 === "DP"))
					) {
						return null;
					}

					let text = posNames ? posNames[pos2] : pos2;
					if (
						isSport("baseball") &&
						posNames &&
						showDH === "noDH" &&
						(pos2 === "DP" || pos2 === "LP")
					) {
						text = posNames[pos2.slice(0, 1)];
					}

					return (
						<li className="nav-item" key={pos2}>
							<a
								className={clsx("nav-link", {
									active: pos === pos2,
								})}
								href={helpers.leagueUrl(["depth", pos2, `${abbrev}_${tid}`])}
							>
								{text}
							</a>
						</li>
					);
				})}
			</ul>

			{editable ? (
				<>
					<div className="btn-group mb-2">
						<button
							className="btn btn-light-bordered"
							onClick={() => handleAutoSort(pos)}
						>
							Auto sort {posNames ? lowerCaseWords(posNames[pos]!) : pos}
						</button>
						<button
							className="btn btn-light-bordered"
							onClick={handleAutoSortAll}
						>
							Auto sort all
						</button>
					</div>
					<div className="form-check mb-3">
						<input
							className="form-check-input"
							type="checkbox"
							checked={keepRosterSorted}
							id="ai-sort-user-roster"
							onChange={async () => {
								if (!keepRosterSorted) {
									await handleAutoSortAll();
								}
								await toWorker("main", "updateKeepRosterSorted", {
									tid,
									keepRosterSorted: !keepRosterSorted,
								});
							}}
						/>
						<label className="form-check-label" htmlFor="ai-sort-user-roster">
							Keep all auto sorted
						</label>
					</div>
				</>
			) : null}

			{isSport("hockey") && pos === "F" ? (
				<div className="alert alert-info d-inline-block">
					Each line of forwards is made up of one center and two wings. The
					center is the first of the three players in each line.
				</div>
			) : null}

			{isSport("hockey") && pos === "G" ? (
				<div className="alert alert-info">
					During the regular season, your starting goalie will automatically get
					some rest days. Rest days are based on how many consecutive games your
					starting goalie has played and how good your backup is. If your backup
					is very bad, your starter will start more games, but{" "}
					{helpers.pronoun(gender, "his")} performance will suffer.
				</div>
			) : null}

			{isSport("baseball") && pos === "L" ? (
				<div className="alert alert-info d-inline-block">
					To move players in and out of the starting lineup, switch to the{" "}
					<a href={helpers.leagueUrl(["depth", "D", `${abbrev}_${tid}`])}>
						Defense tab
					</a>
					.
				</div>
			) : null}

			{isSport("baseball") && pos === "LP" ? (
				<div className="alert alert-info d-inline-block">
					To move players in and out of the starting lineup, switch to the{" "}
					<a href={helpers.leagueUrl(["depth", "DP", `${abbrev}_${tid}`])}>
						Defense tab
					</a>
					.
				</div>
			) : null}

			<div style={editable ? { marginTop: -16 } : undefined}>
				<DataTable
					cols={cols}
					defaultSort="disableSort"
					// Different value for baseball is because that uses showRowLabels, which adds an extra column
					defaultStickyCols={window.mobile ? 0 : isSport("baseball") ? 3 : 2}
					name={`Depth${pos}`}
					rows={rows}
					hideAllControls={editable}
					nonfluid
					showRowLabels={!!rowLabels}
					sortableRows={
						editable
							? {
									highlightHandle: ({ index }) =>
										index < numStarters * numLines,
									onChange: async ({ oldIndex, newIndex }) => {
										const pids = players.map((p) => p.pid);
										const newSortedPids = arrayMove(pids, oldIndex, newIndex);
										setSortedPids(newSortedPids);
										await toWorker("main", "reorderDepthDrag", {
											pos,
											sortedPids: getIDsToSave(newSortedPids),
										});
									},
									onSwap: async (index1, index2) => {
										const newSortedPids = players.map((p) => p.pid);
										newSortedPids[index1] = players[index2].pid;
										newSortedPids[index2] = players[index1].pid;
										setSortedPids(newSortedPids);
										await toWorker("main", "reorderDepthDrag", {
											pos,
											sortedPids: getIDsToSave(newSortedPids),
										});
									},
								}
							: undefined
					}
				/>
			</div>
		</>
	);
};

export default Depth;
