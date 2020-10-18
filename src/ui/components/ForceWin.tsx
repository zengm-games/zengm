import classNames from "classnames";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { toWorker, useLocalShallow } from "../util";

type Team = {
	tid: number;
};

type State = undefined | "saving" | "saved" | "error";
const useSavingState = () => {
	const [state, setState] = useState<State>();
	const timeoutID = useRef<number | undefined>();

	const wrappedSetState = (state2: State) => {
		window.clearTimeout(timeoutID.current);

		setState(state2);

		if (state2 === "saved") {
			timeoutID.current = window.setTimeout(() => {
				setState(undefined);
			}, 1000);
		}
	};

	useEffect(() => {
		return () => {
			window.clearTimeout(timeoutID.current);
		};
	}, []);

	return [state, wrappedSetState] as const;
};

const ForceWin = ({
	className,
	game,
}: {
	className?: string;
	game: {
		forceWin?: number;
		gid: number;
		teams: [Team, Team];
	};
}) => {
	const [state, setState] = useSavingState();
	const [forceWin, setForceWin] = useState(game.forceWin);

	const { godMode, teamInfoCache } = useLocalShallow(state => ({
		godMode: state.godMode,
		teamInfoCache: state.teamInfoCache,
	}));

	const allStarGame = game.teams[0].tid === -1 && game.teams[1].tid === -2;
	const tradeDeadline = game.teams[0].tid === -3 && game.teams[1].tid === -3;

	let form = null;
	if (godMode && !tradeDeadline) {
		const id = `force-win-${game.gid}`;

		form = (
			<div className="form-inline my-1">
				<label className="mr-1" htmlFor={id}>
					Force win?
				</label>
				<div className="btn-group">
					{[game.teams[1], game.teams[0]].map(({ tid }, index) => (
						<button
							key={index}
							className={classNames(
								"btn btn-xs",
								tid === forceWin ? "btn-god-mode" : "btn-light-bordered",
							)}
							onClick={async () => {
								try {
									setState("saving");
									const newForceWin = forceWin === tid ? undefined : tid;
									setForceWin(newForceWin);
									await toWorker("main", "setForceWin", game.gid, newForceWin);
								} catch (error) {
									setState("error");
									throw error;
								}
								setState("saved");
							}}
						>
							{allStarGame
								? `AS${tid === -1 ? 2 : 1}`
								: teamInfoCache[tid]?.abbrev}
						</button>
					))}
				</div>
				<AnimatePresence>
					{state === "saved" ? (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0, transition: { duration: 1 } }}
							transition={{ duration: 0.1 }}
						>
							<span className="ml-2 glyphicon glyphicon-ok text-success" />
						</motion.div>
					) : null}
				</AnimatePresence>
				{state === "error" ? (
					<span className="ml-2 text-danger">Error</span>
				) : null}
			</div>
		);
	}

	return <div className={className}>{form}</div>;
};

export default ForceWin;
