import classNames from "classnames";
import { AnimatePresence, m } from "framer-motion";
import { useEffect, useRef, useState } from "react";
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

const style = {
	minWidth: 41,
};

const ForceWin = ({
	allowTie,
	className,
	game,
}: {
	allowTie: boolean;
	className?: string;
	game: {
		forceWin?: number | "tie";
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
			<div className="my-1 d-flex">
				<label className="me-1" htmlFor={id}>
					Force win?
				</label>
				<div className="btn-group">
					{[game.teams[1], game.teams[0]].map(({ tid }, index) => (
						<button
							key={index}
							className={classNames(
								"btn btn-xs",
								tid === forceWin
									? "btn-outline-god-mode"
									: "btn-light-bordered",
							)}
							onClick={async () => {
								try {
									setState("saving");
									const newForceWin = forceWin === tid ? undefined : tid;
									setForceWin(newForceWin);
									await toWorker("main", "setForceWin", {
										gid: game.gid,
										tidOrTie: newForceWin,
									});
								} catch (error) {
									setState("error");
									throw error;
								}
								setState("saved");
							}}
							style={style}
						>
							{allStarGame
								? `AS${tid === -1 ? 2 : 1}`
								: teamInfoCache[tid]?.abbrev}
						</button>
					))}
					{allowTie ? (
						<button
							className={classNames(
								"btn btn-xs",
								"tie" === forceWin
									? "btn-outline-god-mode"
									: "btn-light-bordered",
							)}
							onClick={async () => {
								try {
									setState("saving");
									setForceWin("tie");
									await toWorker("main", "setForceWin", {
										gid: game.gid,
										tidOrTie: "tie",
									});
								} catch (error) {
									setState("error");
									throw error;
								}
								setState("saved");
							}}
							style={style}
						>
							Tie
						</button>
					) : null}
				</div>
				<AnimatePresence>
					{state === "saved" ? (
						<m.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0, transition: { duration: 1 } }}
							transition={{ duration: 0.1 }}
						>
							<span className="ms-2 glyphicon glyphicon-ok text-success" />
						</m.div>
					) : null}
				</AnimatePresence>
				{state === "error" ? (
					<span className="ms-2 text-danger">Error</span>
				) : null}
			</div>
		);
	}

	return <div className={className}>{form}</div>;
};

export default ForceWin;
