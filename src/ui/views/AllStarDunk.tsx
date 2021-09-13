import useTitleBar from "../hooks/useTitleBar";
import { helpers, toWorker } from "../util";
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
import { dunkInfos, getValidMoves } from "../../common/dunkContest";
import classNames from "classnames";

const EditContestants = ({
	allPossibleContestants,
	initialPlayers,
}: {
	allPossibleContestants: View<"allStarDunk">["allPossibleContestants"];
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

				await toWorker("main", "dunkSetPlayers", minimalPlayers);

				setShowForm(false);
			}}
		>
			{players.map((p, i) => {
				return (
					<div className="mb-2" key={i}>
						<SelectMultiple
							key={i}
							options={allPossibleContestants.filter(p => {
								// Keep this player and any other non-selected players
								const selectedIndex = selectedPIDs.indexOf(p.pid);
								return selectedIndex === i || selectedIndex < 0;
							})}
							defaultValue={allPossibleContestants.find(p2 => p.pid === p2.pid)}
							getOptionLabel={(p: any) => `${p.name}, ${p.abbrev}`}
							changing={({ p }) => {
								const newPlayers = [...players];
								newPlayers[i] = p;
								setPlayers(newPlayers);
								return false;
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
									Move: {dunkInfos.move[actualMoves[0]].name}
								</>
							) : actualMoves.length === 2 ? (
								<>
									<br />
									Move 1: {dunkInfos.move[event.dunk.move1].name}
									<br />
									Move 2: {dunkInfos.move[event.dunk.move2].name}
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

const UserDunkForm = ({ index, name }: { index: number; name: string }) => {
	const [dunk, setDunk] = useState({
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
			const newProjected = await toWorker(
				"main",
				"dunkGetProjected",
				dunk,
				index,
			);
			setProjected(newProjected);
		};

		updateProjeted();
	}, [dunk, index]);

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
			options: getValidMoves(dunk.move2),
		},
		{
			key: "move2",
			label: "Move 2",
			options: getValidMoves(dunk.move1),
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

						await toWorker("main", "dunkUser", dunk, index);

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
									value={dunk[key]}
									className="form-control"
									onChange={event => {
										setDunk({
											...dunk,
											[key]: event.currentTarget.value,
										});
									}}
								>
									{Object.entries(options).map(([name, info]) => (
										<option key={name} value={name}>
											{info.name}
										</option>
									))}
								</select>
							</div>
						</div>
					))}

					<div className="text-right mt-2">
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

const AllStarDunk = ({
	allPossibleContestants,
	awaitingUserDunkIndex,
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

	useTitleBar({
		title: "Slam Dunk Contest",
		dropdownView: "all_star_dunk",
		dropdownFields: { seasons: season },
		dropdownCustomURL: fields => {
			return helpers.leagueUrl(["all_star", "dunk", fields.seasons]);
		},
	});

	let seenRound2 = false;

	return (
		<>
			{godMode && !started ? (
				<EditContestants
					initialPlayers={dunk.players}
					allPossibleContestants={allPossibleContestants}
				/>
			) : null}
			<div className="d-none d-sm-flex flex-wrap mb-4" style={{ gap: "3rem" }}>
				{players.map((p, i) => {
					const tid = dunk.players[i].tid;

					const allowControl =
						tid === userTid || (dunk.controlling.includes(i) && !godMode);
					const allowControlGodMode = !allowControl && godMode;

					const checkboxID = `control-player-${i}`;

					const yearsWon = (p.awards as Player["awards"])
						.filter(award => award.type === "Slam Dunk Contest Winner")
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
							<div className="mt-2">
								<PlayerNameLabels
									pid={p.pid}
									injury={p.injury}
									season={season}
									jerseyNumber={p.stats.jerseyNumber}
									pos={p.ratings.pos}
									watch={p.watch}
								>
									{dunk.players[i].name}
								</PlayerNameLabels>
								<a
									className="ml-2"
									href={helpers.leagueUrl([
										"roster",
										`${p.abbrev}_${p.tid}`,
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
								{p.ratings.ovr} ovr, {p.ratings.pot} pot, {p.ratings.jmp} jmp,{" "}
								{p.ratings.dnk} dnk
								<br />
								{helpers.roundStat(p.stats.pts, "pts")} pts,{" "}
								{helpers.roundStat(p.stats.trb, "trb")} trb,{" "}
								{helpers.roundStat(p.stats.ast, "ast")} ast
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

							{(allowControl || allowControlGodMode) &&
							(dunk.winner === undefined || dunk.controlling.includes(i)) ? (
								<div
									className={`form-check mt-2 d-inline-block${
										allowControlGodMode ? " god-mode pr-1" : ""
									}`}
								>
									<input
										className="form-check-input"
										type="checkbox"
										disabled={dunk.winner !== undefined}
										onChange={async () => {
											let controlling = [...dunk.controlling];
											if (controlling.includes(i)) {
												controlling = controlling.filter(j => j !== i);
											} else {
												controlling.push(i);
											}
											await toWorker("main", "dunkSetControlling", controlling);
										}}
										checked={dunk.controlling.includes(i)}
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

			<ResponsiveTableWrapper>
				<table className="table table-striped table-hover table-nonfluid">
					<thead>
						<tr>
							<th></th>
							{dunk.rounds.map((round, i) => {
								if (i === 0) {
									return <th key={i}>Round 1</th>;
								} else if (round.tiebreaker) {
									return (
										<th key={i} title="Tiebreaker">
											T
										</th>
									);
								} else {
									seenRound2 = true;
									return <th key={i}>Round 2</th>;
								}
							})}
							{!seenRound2 ? <th>Round 2</th> : null}
							{dunk.winner !== undefined ? <th></th> : null}
						</tr>
					</thead>
					<tbody>
						{players.map((p, i) => {
							return (
								<tr key={i}>
									<td>
										<PlayerNameLabels pid={p.pid} watch={p.watch}>
											{dunk.players[i].name}
										</PlayerNameLabels>
									</td>
									{dunk.rounds.map((round, j) => {
										const roundResult = resultsByRound[j].find(
											p => p.index === i,
										);
										if (!roundResult) {
											return <td key={j} />;
										}
										return (
											<td key={j}>
												{roundResult.score}
												{roundResult.scores.length > 1 ? (
													<>
														{" "}
														<span className="text-muted">
															({roundResult.scores.join("+")})
														</span>
													</>
												) : null}
											</td>
										);
									})}
									{!seenRound2 ? <td /> : null}
									{dunk.winner !== undefined ? (
										dunk.winner === i ? (
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

			{dunk.winner === undefined ? (
				<PlayPauseNext
					className="mb-3"
					fastForwards={[
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
							label: "Complete one dunk",
							onClick: async () => {
								await toWorker("main", "dunkSimNext", "dunk");
							},
						},
						{
							label: "End of round",
							onClick: async () => {
								await toWorker("main", "dunkSimNext", "round");
							},
						},
						{
							label: "End of contest",
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
				<UserDunkForm
					index={awaitingUserDunkIndex}
					name={dunk.players[awaitingUserDunkIndex].name}
				/>
			) : null}

			<Log dunk={dunk} log={log} season={season} />
		</>
	);
};

export default AllStarDunk;
