import PropTypes from "prop-types";
import { useCallback, useState } from "react";
import { DataTable, PlayerNameLabels } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers, toWorker } from "../util";
import type { View } from "../../common/types";

const PlayersTable = ({
	challengeNoRatings,
	draftType,
	name,
	onDraft,
	pidsAdd,
	pidsRemove,
	players,
	remaining,
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
						if (!p) {
							throw new Error(`Player not found, pid ${pid}`);
						}
						return p;
					}),
			  ];

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
				<a href={helpers.leagueUrl(["roster", `${p.abbrev}_${p.tid}`])}>
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

PlayersTable.propTypes = {
	draftType: PropTypes.oneOf(["auto", "user"]).isRequired,
	name: PropTypes.string.isRequired,
	onDraft: PropTypes.func,
	pidsAdd: PropTypes.arrayOf(PropTypes.number),
	pidsRemove: PropTypes.arrayOf(PropTypes.number),
	players: PropTypes.arrayOf(PropTypes.object).isRequired,
	remaining: PropTypes.arrayOf(PropTypes.object),
	stats: PropTypes.arrayOf(PropTypes.string).isRequired,
	userTids: PropTypes.arrayOf(PropTypes.number).isRequired,
	usersTurn: PropTypes.bool,
};

const wait = (ms: number) => {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
};

const AllStars = ({
	challengeNoRatings,
	finalized,
	remaining,
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

	const reveal = useCallback(pid => {
		setRevealed(revealed2 => [...revealed2, pid]);
	}, []);

	const startDraft = useCallback(async () => {
		setStarted(true);

		if (draftType === "auto") {
			const pids = await toWorker("main", "allStarDraftAll");
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

	useTitleBar({ title: "All-Star Draft" });

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
			{actuallyFinalized ? (
				<p className="alert alert-primary d-inline-block">
					The All-Star draft is over! To watch the All-Star Game,{" "}
					<a href={helpers.leagueUrl(["daily_schedule"])}>click here</a>.
				</p>
			) : null}
			{!actuallyFinalized && !started ? (
				<button className="btn btn-lg btn-success mb-3" onClick={startDraft}>
					Start draft
				</button>
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
								stats={stats}
								userTids={userTids}
							/>
						</div>
					</div>
				</div>
				<div className="col-sm-6 col-md-4">
					<h2>Remaining All Stars</h2>
					<PlayersTable
						challengeNoRatings={challengeNoRatings}
						draftType={draftType}
						name="Remaining"
						onDraft={onDraft}
						pidsRemove={revealed}
						players={remaining}
						stats={stats}
						userTids={userTids}
						usersTurn={usersTurn}
					/>
				</div>
			</div>
		</>
	);
};

AllStars.propTypes = {
	finalized: PropTypes.bool.isRequired,
	remaining: PropTypes.arrayOf(PropTypes.object).isRequired,
	stats: PropTypes.arrayOf(PropTypes.string).isRequired,
	teamNames: PropTypes.arrayOf(PropTypes.string).isRequired,
	teams: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.object)).isRequired,
	userTids: PropTypes.arrayOf(PropTypes.number).isRequired,
};

export default AllStars;
