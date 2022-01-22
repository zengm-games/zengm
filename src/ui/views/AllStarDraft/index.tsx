import { useCallback, useState } from "react";
import { DataTable, PlayerNameLabels } from "../../components";
import useTitleBar from "../../hooks/useTitleBar";
import { getCols, helpers, toWorker } from "../../util";
import type { View } from "../../../common/types";
import EditAllStars from "./EditAllStars";

const PlayersTable = ({
	challengeNoRatings,
	draftType,
	name,
	onDraft,
	pidsAdd,
	pidsRemove,
	players,
	remaining,
	season,
	stats,
	userTids,
	usersTurn,
}: {
	challengeNoRatings: boolean;
	draftType: "auto" | "user";
	name: string;
	onDraft?: (pid: number) => Promise<void>;
	pidsAdd?: number[];
	pidsRemove?: number[];
	players: View<"allStarDraft">["teams"][number];
	remaining?: View<"allStarDraft">["remaining"];
	season: number;
	stats: string[];
	userTids: number[];
	usersTurn?: boolean;
}) => {
	const showDraftCol = draftType === "user" && name === "Remaining";

	const colNames = [
		"Name",
		"Team",
		"Age",
		"Ovr",
		...stats.map(stat => `stat:${stat}`),
		"#AS",
	];
	if (name !== "Remaining") {
		colNames.unshift("#");
	}
	if (showDraftCol) {
		colNames.unshift("Draft");
	}
	const cols = getCols(colNames);

	const playersAugmented =
		!pidsAdd || pidsAdd.length === 0 || !remaining
			? players
			: [
					...players,
					...pidsAdd.map(pid => {
						const p = remaining.find(p2 => p2.pid === pid);
						return p;
					}),
			  ].filter(p => p !== undefined);

	const rows = playersAugmented
		.filter(p => {
			if (!pidsRemove) {
				return true;
			}
			return !pidsRemove.includes(p.pid);
		})
		.map((p, i) => {
			const data = [
				<PlayerNameLabels
					pid={p.pid}
					injury={p.injury}
					jerseyNumber={p.stats.jerseyNumber}
					pos={p.ratings.pos}
					skills={p.skills}
					watch={p.watch}
				>
					{p.name}
				</PlayerNameLabels>,
				<a href={helpers.leagueUrl(["roster", `${p.abbrev}_${p.tid}`, season])}>
					{p.abbrev}
				</a>,
				p.age,
				!challengeNoRatings ? p.ratings.ovr : null,
				...stats.map(stat => helpers.roundStat(p.stats[stat], stat)),
				p.numAllStar,
			];
			if (name !== "Remaining") {
				data.unshift(i + 1);
			}
			if (showDraftCol && onDraft) {
				data.unshift(
					<button
						className="btn btn-xs btn-primary"
						disabled={!usersTurn || p.injury.gamesRemaining > 0}
						onClick={() => {
							onDraft(p.pid);
						}}
						title="Draft player"
					>
						Draft
					</button>,
				);
			}

			return {
				key: p.pid,
				data,
				classNames: {
					"table-danger": p.hof,
					"table-info": userTids.includes(p.tid),
				},
			};
		});

	return (
		<DataTable
			cols={cols}
			defaultSort={[0, "asc"]}
			name={`AllStarDraft:${name}`}
			rows={rows}
		/>
	);
};

const wait = (ms: number) => {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
};

const AllStars = ({
	allPossiblePlayers,
	challengeNoRatings,
	finalized,
	gid,
	godMode,
	isCurrentSeason,
	nextGameIsAllStar,
	remaining,
	season,
	spectator,
	stats,
	teams,
	teamNames,
	userTids,
}: View<"allStarDraft">) => {
	const draftType =
		!spectator && teams.some(t => userTids.includes(t[0].tid))
			? "user"
			: "auto";

	const [actuallyFinalized, setActuallyFinalized] = useState(finalized);
	const [started, setStarted] = useState(teams[0].length > 1);
	const [revealed, setRevealed] = useState<number[]>([]);
	const [editing, setEditing] = useState(false);

	const reveal = useCallback(pid => {
		setRevealed(revealed2 => [...revealed2, pid]);
	}, []);

	const startDraft = useCallback(async () => {
		setStarted(true);

		if (draftType === "auto") {
			const pids = await toWorker("main", "allStarDraftAll", undefined);
			for (const pid of pids) {
				if (pid !== pids[0]) {
					await wait(1000);
				}
				reveal(pid);
			}
			setActuallyFinalized(true);
			return;
		}

		if (!userTids.includes(teams[0][0].tid)) {
			const { finalized: finalized2, pid } = await toWorker(
				"main",
				"allStarDraftOne",
				undefined,
			);
			reveal(pid);
			setActuallyFinalized(finalized2);
		}
	}, [draftType, reveal, teams, userTids]);

	const userDraftingBothTeams =
		userTids.includes(teams[0][0].tid) && userTids.includes(teams[1][0].tid);
	const onDraft = useCallback(
		async (pid: number) => {
			const finalized2 = await toWorker("main", "allStarDraftUser", pid);
			reveal(pid);
			setActuallyFinalized(finalized2);

			if (!userDraftingBothTeams) {
				const { finalized: finalized3, pid: pid2 } = await toWorker(
					"main",
					"allStarDraftOne",
					undefined,
				);
				if (pid2 !== undefined) {
					await wait(1000);
					reveal(pid2);
				}
				setActuallyFinalized(finalized3);
			}
		},
		[reveal, userDraftingBothTeams],
	);

	useTitleBar({
		title: "All-Star Draft",
		dropdownView: "all_star_draft",
		dropdownFields: { seasons: season },
		dropdownCustomURL: fields => {
			return helpers.leagueUrl(["all_star", "draft", fields.seasons]);
		},
	});

	// Split up revealed into the two teams
	const revealed0: number[] = [];
	const revealed1: number[] = [];
	let teamInd = teams[0].length > teams[1].length ? 1 : 0;
	for (const pid of revealed) {
		if (teamInd === 0) {
			revealed0.push(pid);
		} else {
			revealed1.push(pid);
		}
		teamInd = teamInd === 0 ? 1 : 0;
	}

	const usersTurn =
		started &&
		draftType === "user" &&
		((teams[0].length + revealed0.length > teams[1].length + revealed1.length &&
			userTids.includes(teams[1][0].tid)) ||
			(teams[0].length + revealed0.length <=
				teams[1].length + revealed1.length &&
				userTids.includes(teams[0][0].tid)));

	const numPlayers =
		teams[0].length +
		teams[1].length +
		remaining.filter(p => p.injury.gamesRemaining <= 0).length;

	if (editing) {
		return (
			<EditAllStars
				allPossiblePlayers={allPossiblePlayers}
				initialPlayers={[...teams[0], ...teams[1], ...remaining]}
				onDone={() => {
					setEditing(false);
				}}
			/>
		);
	}

	return (
		<>
			<p>
				The top {numPlayers} players in the league play in the All-Star Game. If
				any of them are injured, they are still All-Stars, but an additional
				All-Star will be selected as a replacement to play in the game.
			</p>
			<p>
				The players are split into two teams, captained by the top two players.
				The teams are filled by a draft. Just for fun, if a captain is on your
				team, you get to draft for him! Otherwise, the captains get to choose.
			</p>
			{actuallyFinalized && nextGameIsAllStar ? (
				<p className="alert alert-primary d-inline-block">
					The All-Star draft is over! To watch the All-Star Game,{" "}
					<a href={helpers.leagueUrl(["daily_schedule"])}>click here</a>.
				</p>
			) : null}
			{actuallyFinalized && !nextGameIsAllStar && gid !== undefined ? (
				<p className="alert alert-primary d-inline-block">
					The All-Star Game is over!{" "}
					<a href={helpers.leagueUrl(["game_log", "special", season, gid])}>
						View box score.
					</a>
				</p>
			) : null}
			{!actuallyFinalized && !started ? (
				<div className="mb-3">
					<button className="btn btn-lg btn-success" onClick={startDraft}>
						Start draft
					</button>
					{godMode ? (
						<button
							className="btn btn-lg btn-god-mode ms-3"
							onClick={() => {
								setEditing(true);
							}}
						>
							Edit All-Stars
						</button>
					) : null}
				</div>
			) : null}
			{godMode && started && nextGameIsAllStar && isCurrentSeason ? (
				<div className="mb-3">
					<button
						className="btn btn-lg btn-god-mode"
						disabled={!usersTurn && !actuallyFinalized}
						onClick={async () => {
							await toWorker("main", "allStarDraftReset", undefined);

							setActuallyFinalized(false);
							setStarted(false);
							setRevealed([]);
						}}
					>
						Reset draft
					</button>
				</div>
			) : null}
			<div className="row">
				<div className="col-sm-6 col-md-8">
					<div className="row">
						<div className="col-md-6">
							<h2>{teamNames[0]}</h2>
							<PlayersTable
								challengeNoRatings={challengeNoRatings}
								draftType={draftType}
								name="Team0"
								pidsAdd={revealed0}
								players={teams[0]}
								remaining={remaining}
								season={season}
								stats={stats}
								userTids={userTids}
							/>
						</div>
						<div className="col-md-6">
							<h2>{teamNames[1]}</h2>
							<PlayersTable
								challengeNoRatings={challengeNoRatings}
								draftType={draftType}
								name="Team1"
								pidsAdd={revealed1}
								players={teams[1]}
								remaining={remaining}
								season={season}
								stats={stats}
								userTids={userTids}
							/>
						</div>
					</div>
				</div>
				<div className="col-sm-6 col-md-4">
					<h2>{actuallyFinalized ? "Injured" : "Remaining"} All Stars</h2>
					<PlayersTable
						challengeNoRatings={challengeNoRatings}
						draftType={draftType}
						name="Remaining"
						onDraft={onDraft}
						pidsRemove={revealed}
						players={remaining}
						season={season}
						stats={stats}
						userTids={userTids}
						usersTurn={usersTurn}
					/>
				</div>
			</div>
		</>
	);
};

export default AllStars;
