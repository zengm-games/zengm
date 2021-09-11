import useTitleBar from "../hooks/useTitleBar";
import { helpers, toWorker } from "../util";
import type { Player, View } from "../../common/types";
import {
	Height,
	PlayerNameLabels,
	PlayerPicture,
	PlayPauseNext,
	ResponsiveTableWrapper,
	Weight,
} from "../components";
import { useState } from "react";
import { dunkInfos, isSport } from "../../common";

const Log = ({
	dunk,
	log,
	season,
}: Pick<View<"allStarDunk">, "dunk" | "log" | "season">) => {
	const logReverse = [...log].reverse();

	const className = "border-top-light pt-3";

	return (
		<ul className="list-unstyled mb-0">
			{dunk.winner !== undefined ? (
				<li className={className}>
					<p className="alert alert-success d-inline-block">
						{dunk.players[dunk.winner].name} is your {season} slam dunk contest
						champion!
					</p>
				</li>
			) : null}
			{logReverse.map((event, i) => {
				const key = log.length - i;

				if (event.type === "round") {
					return (
						<li key={key} className={className}>
							<p
								className={`alert alert-info d-inline-block${
									event.num === 1 ? " mb-0" : ""
								}`}
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
						<li key={key} className={className}>
							<p className="alert alert-info d-inline-block">
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
						<li key={key} className={className}>
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
							Toss: {dunkInfos.toss[event.dunk.toss].name}
							<br />
							Distance: {dunkInfos.distance[event.dunk.distance].name}
							<br />
							{actualMoves.length === 1 ? (
								<>Move: {dunkInfos.move[actualMoves[0]].name}</>
							) : (
								<>
									Move 1: {dunkInfos.move[event.dunk.move1].name}
									<br />
									Move 2: {dunkInfos.move[event.dunk.move2].name}
								</>
							)}
							{event.made ? <p>He made it!</p> : <p>He missed it!</p>}
						</li>
					);
				}

				if (event.type === "score") {
					return (
						<li key={key} className={className}>
							{event.made ? (
								<p>
									The judges give him a {event.score}
									{event.score === 50 ? "!" : "."}
								</p>
							) : (
								<p>
									{p.name} failed to make a dunk, so the judges give him a{" "}
									{event.score}, the lowest score possible.
								</p>
							)}
						</li>
					);
				}
			})}
		</ul>
	);
};

const AllStarDunk = ({
	dunk,
	log,
	godMode,
	players,
	resultsByRound,
	season,
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
					onPlay={() => {
						setPaused(false);
					}}
					onPause={() => {
						setPaused(true);
					}}
					onNext={async () => {
						await toWorker("main", "dunkSimNext");
					}}
					paused={paused}
				/>
			) : null}

			<Log dunk={dunk} log={log} season={season} />
		</>
	);
};

export default AllStarDunk;
