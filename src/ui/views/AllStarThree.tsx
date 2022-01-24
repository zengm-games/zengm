import useTitleBar from "../hooks/useTitleBar";
import { helpers, toWorker } from "../util";
import type { View } from "../../common/types";
import { PlayPauseNext } from "../components";
import { useEffect, useState } from "react";
import { isSport } from "../../common";
import { ContestantProfiles, EditContestants, ScoreTable } from "./AllStarDunk";
import range from "lodash-es/range";
import classNames from "classnames";

const NUM_BALLS_PER_RACK = 5;

const ShotTable = ({ racks }: { racks: boolean[][] }) => {
	const rackNames = ["Corner", "Wing", "Top Key", "Wing", "Corner"];

	const highlight = (i: number) =>
		i % 2 === 1 ? "table-bg-striped" : undefined;

	return (
		<div className="row" style={{ maxWidth: 800 }}>
			{rackNames.map((name, i) => (
				<div key={i} className={classNames("col-12 col-sm", highlight(i))}>
					<div className="fw-bold text-center my-1">{name}</div>
					<div className="d-flex mb-2">
						{range(NUM_BALLS_PER_RACK).map(j => {
							const shotResult: boolean | undefined = racks[i]?.[j];
							const moneyball = j === NUM_BALLS_PER_RACK - 1;

							const spin =
								(i === racks.length - 1 || racks[i + 1]?.length === 0) &&
								j === racks[i].length - 1 &&
								(i !== rackNames.length - 1 || j !== NUM_BALLS_PER_RACK - 1);

							return (
								<div
									className="flex-fill d-flex justify-content-center"
									key={j}
								>
									{shotResult === undefined ? (
										<div style={{ width: 18, height: 18 }} />
									) : (
										<img
											alt={`${shotResult ? "Make" : "Miss"} (${
												moneyball ? "moneyball" : "normal"
											})`}
											title={`${shotResult ? "Make" : "Miss"} (${
												moneyball ? "moneyball" : "normal"
											})`}
											className="spin"
											width="18"
											height="18"
											src={
												moneyball && shotResult
													? "/ico/logo-gold.png"
													: "/ico/logo.png"
											}
											style={{
												animationPlayState: spin ? "running" : "paused",
												...(!shotResult
													? {
															filter: "grayscale(100%)",
															opacity: 0.7,
													  }
													: undefined),
											}}
										/>
									)}
								</div>
							);
						})}
					</div>
				</div>
			))}
		</div>
	);
};

const getActivityCount = (three: View<"allStarThree">["three"]) => {
	let count = three.rounds.length;
	for (const round of three.rounds) {
		count += round.results.length;
		for (const result of round.results) {
			count += result.racks.length;
			for (const rack of result.racks) {
				count += rack.length;
			}
		}
	}

	return count;
};

const AllStarThree = ({
	allPossibleContestants,
	challengeNoRatings,
	godMode,
	players,
	resultsByRound,
	season,
	started,
	three,
	userTid,
}: View<"allStarThree">) => {
	if (!isSport("basketball")) {
		throw new Error("Not implemented");
	}

	const [paused, setPaused] = useState(true);

	const activityCount = getActivityCount(three);

	useEffect(() => {
		let obsolete = false;

		const run = async () => {
			if (!paused) {
				await new Promise<void>(resolve => {
					setTimeout(() => {
						resolve();
					}, 700);
				});
				if (!obsolete) {
					await toWorker("main", "threeSimNext", "event");
				}
			}
		};

		run();

		return () => {
			obsolete = true;
		};
	}, [paused, activityCount]);

	useTitleBar({
		title: "Three-Point Contest",
		dropdownView: "all_star_three",
		dropdownFields: { seasons: season },
		dropdownCustomURL: fields => {
			return helpers.leagueUrl(["all_star", "three", fields.seasons]);
		},
	});

	let currentName = "???";
	let currentScore = 0;
	let maxScore = 30;
	const currentResult = three.rounds.at(-1).results.at(-1);
	if (currentResult) {
		currentName = three.players[currentResult.index].name;

		for (const rack of currentResult.racks) {
			for (let i = 0; i < rack.length; i++) {
				const value = i === NUM_BALLS_PER_RACK - 1 ? 2 : 1;
				if (rack[i]) {
					currentScore += value;
				} else {
					maxScore -= value;
				}
			}
		}
	}

	return (
		<>
			{godMode && !started ? (
				<EditContestants
					allPossibleContestants={allPossibleContestants}
					contest="three"
					initialPlayers={three.players}
				/>
			) : null}

			<ContestantProfiles
				challengeNoRatings={challengeNoRatings}
				contest={three}
				godMode={godMode}
				players={players}
				season={season}
				userTid={userTid}
			/>

			<ScoreTable
				contest={three}
				resultsByRound={resultsByRound}
				players={players}
				season={season}
				userTid={userTid}
			/>

			{three.winner === undefined ? (
				<PlayPauseNext
					className="mb-3"
					fastForwards={[
						{
							label: "Complete rack",
							key: "o",
							onClick: async () => {
								await toWorker("main", "threeSimNext", "rack");
							},
						},
						{
							label: "Complete player",
							key: "t",
							onClick: async () => {
								await toWorker("main", "threeSimNext", "player");
							},
						},
						{
							label: "End of round",
							key: "s",
							onClick: async () => {
								await toWorker("main", "threeSimNext", "round");
							},
						},
						{
							label: "End of contest",
							key: "q",
							onClick: async () => {
								await toWorker("main", "threeSimNext", "all");
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
						await toWorker("main", "threeSimNext", "event");
					}}
					paused={paused}
				/>
			) : null}

			{three.winner !== undefined ? (
				<p className="alert alert-success d-inline-block mb-0">
					{three.players[three.winner].name} is your {season} three-point
					contest champion!
				</p>
			) : (
				<>
					<h2>
						{currentName} - {currentScore}/{maxScore}
					</h2>
					<ShotTable racks={three.rounds.at(-1).results.at(-1)?.racks ?? []} />
				</>
			)}
		</>
	);
};

export default AllStarThree;
