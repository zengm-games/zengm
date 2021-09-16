import useTitleBar from "../hooks/useTitleBar";
import { helpers, toWorker } from "../util";
import type { View } from "../../common/types";
import { PlayPauseNext } from "../components";
import { useEffect, useState } from "react";
import { isSport } from "../../common";
import { ContestantProfiles, EditContestants, ScoreTable } from "./AllStarDunk";

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

	useEffect(() => {
		let obsolete = false;

		const run = async () => {
			if (!paused) {
				await new Promise<void>(resolve => {
					setTimeout(() => {
						resolve();
					}, 2000);
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
	}, [paused]);

	useTitleBar({
		title: "Three-Point Contest",
		dropdownView: "all_star_three",
		dropdownFields: { seasons: season },
		dropdownCustomURL: fields => {
			return helpers.leagueUrl(["all_star", "three", fields.seasons]);
		},
	});

	let seenRound2 = false;

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
			/>

			{three.winner === undefined ? (
				<PlayPauseNext
					className="mb-3"
					fastForwards={[
						{
							label: "Complete one rack",
							onClick: async () => {
								await toWorker("main", "threeSimNext", "rack");
							},
						},
						{
							label: "End of round",
							onClick: async () => {
								await toWorker("main", "threeSimNext", "round");
							},
						},
						{
							label: "End of contest",
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
		</>
	);
};

export default AllStarThree;
