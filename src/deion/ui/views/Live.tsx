import classNames from "classnames";
import React from "react";
import useTitleBar from "../hooks/useTitleBar";
import { toWorker, useLocalShallow } from "../util";
import type { View } from "../../common/types";
import { ScoreBox } from "../components";

const Live = ({ games, userTid }: View<"live">) => {
	useTitleBar({ title: "Live Game Simulation" });

	const { gameSimInProgress } = useLocalShallow(state => ({
		gameSimInProgress: state.gameSimInProgress,
	}));

	return (
		<>
			<p>
				To view a live play-by-play summary of a game, select one of tomorrow's
				games below.
			</p>

			{gameSimInProgress ? (
				<p className="text-danger">
					Stop the current game simulation to select a play-by-play game.
				</p>
			) : null}

			<div className="row">
				<div className="col-xl-4 col-md-6 col-12">
					{/* Copy-pasted from ScoreBox, so all the rows below can remain aligned */}
					<div
						className="d-flex justify-content-end text-muted"
						style={{ maxWidth: 400, marginRight: 62 }}
					>
						<div className="p-1" title="Team Overall Rating">
							Ovr
						</div>
						<div
							className={classNames("text-right p-1", "score-box-spread")}
							title="Predicted Point Spread"
						>
							Spread
						</div>
					</div>
				</div>
			</div>

			<div className="row">
				{games.map(game => (
					<div className="col-xl-4 col-md-6 col-12" key={game.gid}>
						<ScoreBox
							game={game}
							actionDisabled={gameSimInProgress}
							actionHighlight={
								game.teams[0].tid === userTid || game.teams[1].tid === userTid
							}
							actionText={
								<>
									Watch
									<br />
									Game
								</>
							}
							actionOnClick={() => toWorker("actions", "liveGame", game.gid)}
							limitWidthToParent
						/>
					</div>
				))}
			</div>
		</>
	);
};

export default Live;
