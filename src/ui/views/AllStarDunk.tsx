import useTitleBar from "../hooks/useTitleBar";
import { helpers, toWorker, useLocal } from "../util";
import type { DunkAttempt, Player, View } from "../../common/types";
import {
	Height,
	PlayerNameLabels,
	PlayerPicture,
	PlayPauseNext,
	ResponsiveTableWrapper,
	Weight,
} from "../components";
import { useEffect, useState } from "react";
import { isSport } from "../../common";
import SelectMultiple from "../components/SelectMultiple";
import {
	dunkInfos,
	getNumRounds,
	getValidMoves,
	isDunkContest,
} from "../../common/dunkContest";
import classNames from "classnames";
import { getHeightString } from "../components/Height";
import range from "lodash-es/range";

export const EditContestants = ({
	allPossibleContestants,
	contest,
	initialPlayers,
}: {
	allPossibleContestants: View<"allStarDunk">["allPossibleContestants"];
	contest: "dunk" | "three";
	initialPlayers: View<"allStarDunk">["dunk"]["players"];
}) => {
	const [showForm, setShowForm] = useState(false);
	const [players, setPlayers] = useState([...initialPlayers]);

	if (!showForm) {
		return (
			<button
				className="btn btn-god-mode mb-4"
				onClick={() => setShowForm(true)}
			>
				Edit contestants
			</button>
		);
	}

	const selectedPIDs = players.map(p => p.pid);

	return (
		<form
			className="mb-4"
			style={{
				maxWidth: 300,
			}}
			onSubmit={async event => {
				event.preventDefault();

				// Get rid of any other properties, like abbrev
				const minimalPlayers = players.map(p => ({
					pid: p.pid,
					tid: p.tid,
					name: p.name,
				}));

				await toWorker("main", "contestSetPlayers", {
					type: contest,
					players: minimalPlayers,
				});

				setShowForm(false);
			}}
		>
			{players.map((p, i) => {
				return (
					<div className="mb-2" key={i}>
						<SelectMultiple
							options={allPossibleContestants.filter(p => {
								// Keep this player and any other non-selected players
								const selectedIndex = selectedPIDs.indexOf(p.pid);
								return selectedIndex === i || selectedIndex < 0;
							})}
							value={allPossibleContestants.find(p2 => p.pid === p2.pid)}
							getOptionLabel={p => `${p.name}, ${p.abbrev}`}
							getOptionValue={p => String(p.pid)}
							onChange={p => {
								if (p) {
									const newPlayers = [...players];
									newPlayers[i] = p;
									setPlayers(newPlayers);
								}
							}}
							isClearable={false}
						/>
					</div>
				);
			})}

			<button className="btn btn-god-mode" type="submit">
				Update contestants
			</button>
		</form>
	);
};

const alertStyle = {
	maxWidth: 600,
};

const getReplaceInfo = ({
	dunk,
	pid,
	text,
}: {
	dunk: View<"allStarDunk">["dunk"];
	pid: number;
	text: string;
}) => {
	let replaceInfo;

	if (text.endsWith("a short person")) {
		const p = dunk.playersShort.find(p => p?.pid !== pid);
		if (p) {
			replaceInfo = {
				...p,
				partialText: text.replace("a short person", ""),
			};
		}
	} else if (text.endsWith("a tall person")) {
		const p = dunk.playersTall.find(p => p?.pid !== pid);
		if (p) {
			replaceInfo = {
				...p,
				partialText: text.replace("a tall person", ""),
			};
		}
	}

	return replaceInfo;
};

const MoveText = ({
	dunk,
	pid,
	move,
}: {
	dunk: View<"allStarDunk">["dunk"];
	pid: number;
	move: string;
}) => {
	const text = dunkInfos.move[move].name;

	const replaceInfo = getReplaceInfo({ dunk, pid, text });

	if (replaceInfo) {
		return (
			<>
				{replaceInfo.partialText}
				<a href={helpers.leagueUrl(["player", replaceInfo.pid])}>
					{replaceInfo.name}
				</a>{" "}
				(<Height inches={replaceInfo.hgt} />)
			</>
		);
	}

	return <>{text}</>;
};

const moveText = ({
	dunk,
	pid,
	move,
	units,
}: {
	dunk: View<"allStarDunk">["dunk"];
	pid: number;
	move: string;
	units: "metric" | "us";
}) => {
	const text = dunkInfos.move[move].name;

	const replaceInfo = getReplaceInfo({ dunk, pid, text });

	if (replaceInfo) {
		return `${replaceInfo.partialText}${replaceInfo.name} (${getHeightString(
			replaceInfo.hgt,
			units,
		)})`;
	}

	return text;
};

const classNameTop = "border-top-light pt-3";

const Log = ({
	dunk,
	log,
	season,
}: Pick<View<"allStarDunk">, "dunk" | "log" | "season">) => {
	const logReverse = [...log].reverse();

	return (
		<ul className="list-unstyled mb-0">
			{dunk.winner !== undefined ? (
				<li className={classNameTop}>
					<p className="alert alert-success d-inline-block" style={alertStyle}>
						{dunk.players[dunk.winner].name} is your {season} slam dunk contest
						champion!
					</p>
				</li>
			) : null}
			{logReverse.map((event, i) => {
				const key = log.length - i;

				if (event.type === "round") {
					return (
						<li key={key} className={classNameTop}>
							<p
								className={`alert alert-info d-inline-block${
									event.num === 1 ? " mb-0" : ""
								}`}
								style={alertStyle}
							>
								<b>Start of round {event.num}.</b> Each player gets 2 dunks.
								{event.num === 1
									? " The maximum score for a dunk is 50."
									: null}{" "}
								Players get 3 attempts per dunk to complete a successful dunk.{" "}
								{event.num === 1
									? "The 2 players with the highest total scores move on to the next round."
									: "The player with the highest score this round wins the contest."}
							</p>
						</li>
					);
				}

				if (event.type === "tiebreaker") {
					return (
						<li key={key} className={classNameTop}>
							<p className="alert alert-info d-inline-block" style={alertStyle}>
								<b>Tiebreaker.</b> Each player gets 3 attempts to make 1 dunk.
							</p>
						</li>
					);
				}

				const p = dunk.players[event.player];

				if (event.type === "attempt") {
					const actualMoves = [event.dunk.move1, event.dunk.move2].filter(
						move => move !== "none",
					);

					return (
						<li key={key} className={classNameTop}>
							<b>
								{p.name} attempts his
								{event.num === 1
									? " first"
									: event.num === 2
									? " second"
									: null}{" "}
								dunk
							</b>{" "}
							({event.try === 3 ? "final" : helpers.ordinal(event.try)} try)
							<br />
							{event.dunk.toss !== "none" ? (
								<>
									Toss: {dunkInfos.toss[event.dunk.toss].name}
									<br />
								</>
							) : null}
							Distance: {dunkInfos.distance[event.dunk.distance].name}
							{actualMoves.length === 1 ? (
								<>
									<br />
									Move:{" "}
									<MoveText dunk={dunk} pid={p.pid} move={actualMoves[0]} />
								</>
							) : actualMoves.length === 2 ? (
								<>
									<br />
									Move 1:{" "}
									<MoveText dunk={dunk} pid={p.pid} move={event.dunk.move1} />
									<br />
									Move 2:{" "}
									<MoveText dunk={dunk} pid={p.pid} move={event.dunk.move2} />
								</>
							) : null}
							{event.made ? (
								<p className="text-success">He made it!</p>
							) : (
								<p className="text-danger">He missed it!</p>
							)}
						</li>
					);
				}

				if (event.type === "score") {
					return (
						<li key={key} className={classNameTop}>
							{event.made ? (
								<p>
									The judges give him a {event.score}
									{event.score === 50 ? "!" : "."}
								</p>
							) : (
								<p>
									{p.name} failed to make a dunk, so the judges give him a{" "}
									{event.score}.
								</p>
							)}
						</li>
					);
				}
			})}
		</ul>
	);
};

const UserDunkForm = ({
	dunk,
	index,
}: {
	dunk: View<"allStarDunk">["dunk"];
	index: number;
}) => {
	const [dunkAttempt, setDunkAttempt] = useState({
		toss: "none",
		distance: "at-rim",
		move1: "none",
		move2: "none",
	});
	const [projected, setProjected] = useState({
		score: 0,
		prob: 0,
	});
	const [submitted, setSubmitted] = useState(false);

	useEffect(() => {
		const updateProjeted = async () => {
			const newProjected = await toWorker("main", "dunkGetProjected", {
				dunkAttempt,
				index,
			});
			setProjected(newProjected);
		};

		updateProjeted();
	}, [dunkAttempt, index]);

	const units = useLocal(state => state.units);

	const name = dunk.players[index].name;

	const fields: {
		key: keyof DunkAttempt;
		label: string;
		options: typeof dunkInfos["toss"];
	}[] = [
		{
			key: "toss",
			label: "Toss",
			options: dunkInfos.toss,
		},
		{
			key: "distance",
			label: "Distance",
			options: dunkInfos.distance,
		},
		{
			key: "move1",
			label: "Move 1",
			options: getValidMoves(dunkAttempt.move2),
		},
		{
			key: "move2",
			label: "Move 2",
			options: getValidMoves(dunkAttempt.move1),
		},
	];

	return (
		<div className={classNames("mb-3", classNameTop)}>
			<h3>{name}</h3>
			<div
				className="d-flex flex-wrap"
				style={{
					gap: "1rem",
				}}
			>
				<form
					onSubmit={async event => {
						event.preventDefault();

						setSubmitted(true);

						await toWorker("main", "dunkUser", { dunkAttempt, index });

						setSubmitted(false);
					}}
					style={{
						maxWidth: 390,
					}}
				>
					{fields.map(({ key, label, options }, i) => (
						<div
							key={key}
							className={classNames(
								"d-flex align-items-center",
								i > 0 ? "mt-1" : undefined,
							)}
						>
							<div
								className="flex-shrink-0"
								style={{
									width: 90,
								}}
							>
								{label}
							</div>
							<div className="flex-grow-1">
								<select
									id="user-dunk-toss"
									value={dunkAttempt[key]}
									className="form-select"
									onChange={event => {
										setDunkAttempt({
											...dunkAttempt,
											[key]: event.currentTarget.value,
										});
									}}
								>
									{Object.entries(options).map(([name, info]) => (
										<option key={name} value={name}>
											{key.startsWith("move")
												? moveText({
														dunk,
														pid: dunk.players[index].pid,
														move: name,
														units,
												  })
												: info.name}
										</option>
									))}
								</select>
							</div>
						</div>
					))}

					<div className="text-end mt-2">
						<button
							disabled={submitted}
							type="submit"
							className="btn btn-primary"
						>
							Attempt dunk
						</button>
					</div>
				</form>
				<div>
					<h3>
						Projected score:{" "}
						<span className="text-info">{projected.score}</span>
					</h3>
					<h3 className="mb-0">
						Success rate:{" "}
						<span className="text-info">
							{Math.round(projected.prob * 100)}%
						</span>
					</h3>
				</div>
			</div>
		</div>
	);
};

export const ContestantProfiles = ({
	challengeNoRatings,
	contest,
	godMode,
	players,
	season,
	userTid,
}: {
	challengeNoRatings: boolean;
	contest: View<"allStarDunk">["dunk"] | View<"allStarThree">["three"];
	godMode: boolean;
	players: View<"allStarDunk">["players"];
	season: number;
	userTid: number;
}) => {
	if (players.length > 8) {
		// Too many to show!
		return null;
	}

	const contestIsDunk = isDunkContest(contest);

	// maxWidth is to get 4 in a row max
	return (
		<div
			className="d-none d-sm-flex flex-wrap mb-4"
			style={{ gap: "1.5rem 3rem", maxWidth: 900 }}
		>
			{players.map((p, i) => {
				const tid = contest.players[i].tid;

				const allowControl =
					contestIsDunk &&
					(tid === userTid || (contest.controlling.includes(i) && !godMode));
				const allowControlGodMode = !allowControl && godMode;

				const checkboxID = `control-player-${i}`;

				const yearsWon = (p.awards as Player["awards"])
					.filter(
						award =>
							award.type ===
							(contestIsDunk
								? "Slam Dunk Contest Winner"
								: "Three-Point Contest Winner"),
					)
					.map(award => award.season)
					.filter(year => year < season);

				return (
					<div key={p.pid}>
						<div
							style={{
								maxHeight: 180,
								width: 120,
								marginTop: p.imgURL ? 0 : -20,
							}}
							className="flex-shrink-0"
						>
							<PlayerPicture
								face={p.face}
								imgURL={p.imgURL}
								colors={p.colors}
								jersey={p.jersey}
							/>
						</div>
						<div
							className={classNames(
								"mt-2",
								tid === userTid ? "table-info" : undefined,
							)}
						>
							<PlayerNameLabels
								pid={p.pid}
								season={season}
								jerseyNumber={p.stats.jerseyNumber}
								pos={p.ratings.pos}
								watch={p.watch}
							>
								{contest.players[i].name}
							</PlayerNameLabels>
							<a
								className="ms-2"
								href={helpers.leagueUrl([
									"roster",
									`${p.abbrev}_${tid}`,
									season,
								])}
							>
								{p.abbrev}
							</a>
						</div>
						<div className="mt-1">
							{p.age} <span title="Years Old">yo</span>,{" "}
							<Height inches={p.hgt} />, <Weight pounds={p.weight} />
							<br />
							{!challengeNoRatings ? (
								<>
									{p.ratings.ovr} ovr, {p.ratings.pot} pot,{" "}
									{contestIsDunk ? (
										<>
											{p.ratings.jmp} jmp, {p.ratings.dnk} dnk
										</>
									) : (
										<>{p.ratings.tp} tp</>
									)}
									<br />
								</>
							) : null}
							{contestIsDunk ? (
								<>
									{helpers.roundStat(p.stats.pts, "pts")} pts,{" "}
									{helpers.roundStat(p.stats.trb, "trb")} trb,{" "}
									{helpers.roundStat(p.stats.ast, "ast")} ast
								</>
							) : (
								<>
									{helpers.roundStat(p.stats.pts, "pts")} pts,{" "}
									{helpers.roundStat(p.stats.tpa, "tpa")} 3pa,{" "}
									{helpers.roundStat(p.stats.tpp, "tpp")}%
								</>
							)}
						</div>
						{yearsWon.length === 1 ? (
							<div className="mt-1">{yearsWon[0]} contest winner</div>
						) : yearsWon.length > 1 ? (
							<div
								className="mt-1"
								title={helpers.yearRanges(yearsWon).join(", ")}
							>
								{yearsWon.length}x contest winner
							</div>
						) : null}

						{contestIsDunk &&
						(allowControl || allowControlGodMode) &&
						(contest.winner === undefined ||
							contest.controlling.includes(i)) ? (
							<div
								className={`form-check mt-2 d-inline-block${
									allowControlGodMode ? " god-mode pe-1" : ""
								}`}
							>
								<input
									className="form-check-input"
									type="checkbox"
									disabled={contest.winner !== undefined}
									onChange={async () => {
										let controlling = [...contest.controlling];
										if (controlling.includes(i)) {
											controlling = controlling.filter(j => j !== i);
										} else {
											controlling.push(i);
										}
										await toWorker("main", "dunkSetControlling", controlling);
									}}
									checked={contest.controlling.includes(i)}
									id={checkboxID}
								/>
								<label className="form-check-label" htmlFor={checkboxID}>
									Control player
								</label>
							</div>
						) : null}
					</div>
				);
			})}
		</div>
	);
};

export const ScoreTable = ({
	contest,
	players,
	resultsByRound,
	season,
	userTid,
}: {
	contest: View<"allStarDunk">["dunk"] | View<"allStarThree">["three"];
	players: View<"allStarDunk">["players"];
	resultsByRound:
		| View<"allStarDunk">["resultsByRound"]
		| View<"allStarThree">["resultsByRound"];
	season: number;
	userTid: number;
}) => {
	const numRounds = getNumRounds(contest);

	let maxRoundCurrent = 0;

	return (
		<ResponsiveTableWrapper>
			<table className="table table-striped table-hover table-nonfluid">
				<thead>
					<tr>
						<th></th>
						{contest.rounds.map((round, i) => {
							if (round.tiebreaker) {
								return (
									<th key={i} title="Tiebreaker">
										T
									</th>
								);
							}

							maxRoundCurrent += 1;
							return <th key={i}>Round {maxRoundCurrent}</th>;
						})}
						{range(maxRoundCurrent + 1, numRounds + 1).map(i => (
							<th key={i}>Round {i}</th>
						))}
						{contest.winner !== undefined ? <th></th> : null}
					</tr>
				</thead>
				<tbody>
					{players.map((p, i) => {
						const tid = contest.players[i].tid;

						return (
							<tr
								key={i}
								className={tid === userTid ? "table-info" : undefined}
							>
								<td>
									<PlayerNameLabels pid={p.pid} watch={p.watch} season={season}>
										{contest.players[i].name}
									</PlayerNameLabels>
								</td>
								{contest.rounds.map((round, j) => {
									const roundResult = resultsByRound[j].find(
										p => p.index === i,
									);
									if (!roundResult) {
										return <td key={j} />;
									}
									return (
										<td key={j}>
											{roundResult.score}
											{(roundResult as any).scores &&
											(roundResult as any).scores.length > 1 ? (
												<>
													{" "}
													<span className="text-muted">
														({(roundResult as any).scores.join("+")})
													</span>
												</>
											) : null}
										</td>
									);
								})}
								{range(maxRoundCurrent + 1, numRounds + 1).map(i => (
									<td key={i} />
								))}
								{contest.winner !== undefined ? (
									contest.winner === i ? (
										<td>
											<span className="glyphicon glyphicon-star text-yellow" />
										</td>
									) : (
										<td />
									)
								) : null}
							</tr>
						);
					})}
				</tbody>
			</table>
		</ResponsiveTableWrapper>
	);
};

const AllStarDunk = ({
	allPossibleContestants,
	awaitingUserDunkIndex,
	challengeNoRatings,
	dunk,
	log,
	godMode,
	players,
	resultsByRound,
	season,
	started,
	userTid,
}: View<"allStarDunk">) => {
	if (!isSport("basketball")) {
		throw new Error("Not implemented");
	}

	const [paused, setPaused] = useState(true);

	useEffect(() => {
		let obsolete = false;

		const run = async () => {
			if (!paused) {
				if (awaitingUserDunkIndex !== undefined) {
					setPaused(true);
				} else {
					await new Promise<void>(resolve => {
						setTimeout(() => {
							resolve();
						}, 2000);
					});
					if (!obsolete) {
						await toWorker("main", "dunkSimNext", "event");
					}
				}
			}
		};

		run();

		return () => {
			obsolete = true;
		};
	}, [awaitingUserDunkIndex, log, paused]);

	useTitleBar({
		title: "Slam Dunk Contest",
		dropdownView: "all_star_dunk",
		dropdownFields: { seasons: season },
		dropdownCustomURL: fields => {
			return helpers.leagueUrl(["all_star", "dunk", fields.seasons]);
		},
	});

	return (
		<>
			{godMode && !started ? (
				<EditContestants
					allPossibleContestants={allPossibleContestants}
					contest="dunk"
					initialPlayers={dunk.players}
				/>
			) : null}

			<ContestantProfiles
				challengeNoRatings={challengeNoRatings}
				contest={dunk}
				godMode={godMode}
				players={players}
				season={season}
				userTid={userTid}
			/>

			<ScoreTable
				contest={dunk}
				resultsByRound={resultsByRound}
				players={players}
				season={season}
				userTid={userTid}
			/>

			{dunk.winner === undefined ? (
				<PlayPauseNext
					className="mb-3"
					fastForwards={[
						{
							label: "Complete one dunk",
							key: "o",
							onClick: async () => {
								await toWorker("main", "dunkSimNext", "dunk");
							},
						},
						...(dunk.controlling.length > 0
							? [
									{
										label: "Until your next dunk",
										onClick: async () => {
											await toWorker("main", "dunkSimNext", "your");
										},
									},
							  ]
							: []),
						{
							label: "End of round",
							key: "s",
							onClick: async () => {
								await toWorker("main", "dunkSimNext", "round");
							},
						},
						{
							label: "End of contest",
							key: "q",
							onClick: async () => {
								await toWorker("main", "dunkSimNext", "all");
							},
						},
					]}
					onPlay={() => {
						setPaused(false);
					}}
					onPause={() => {
						setPaused(true);
					}}
					onNext={async () => {
						await toWorker("main", "dunkSimNext", "event");
					}}
					paused={paused}
				/>
			) : null}

			{awaitingUserDunkIndex !== undefined ? (
				<UserDunkForm dunk={dunk} index={awaitingUserDunkIndex} />
			) : null}

			<Log dunk={dunk} log={log} season={season} />
		</>
	);
};

export default AllStarDunk;
