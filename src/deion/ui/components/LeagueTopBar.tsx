import classNames from "classnames";
import { motion, AnimatePresence } from "framer-motion";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocalShallow } from "../util";
import ScoreBox from "./ScoreBox";

const Toggle = ({ show, toggle }: { show: boolean; toggle: () => void }) => {
	return (
		<button
			className="btn btn-secondary p-0 league-top-bar-toggle"
			title={show ? "Hide scores" : "Show scores"}
			onClick={toggle}
		>
			<span
				className={classNames(
					"glyphicon",
					show ? "glyphicon-menu-right" : "glyphicon-menu-left",
				)}
			/>
		</button>
	);
};

const hiddenStyle = {
	marginBottom: -64,
};

const LeagueTopBar = React.memo(() => {
	const { games, lid, liveGameInProgress } = useLocalShallow(state => ({
		games: state.games,
		lid: state.lid,
		liveGameInProgress: state.liveGameInProgress,
	}));

	const [show, setShow] = useState(() => {
		const showTemp = localStorage.getItem("bbgmShowLeagueTopBar");
		if (showTemp === "true") {
			return true;
		}
		if (showTemp === "false") {
			return false;
		}
		return true;
	});
	const [numberOfScoreBoxes, setNumberOfScoreBoxes] = useState(10);
	const prevGames = useRef<typeof games>([]);

	const updateNumberOfScoreBoxes = useCallback(() => {
		// Limit number of ScoreBoxes to render
		const documentElement = document.documentElement;
		if (documentElement) {
			const width = documentElement.clientWidth;
			setNumberOfScoreBoxes(Math.ceil(width / 115));
		}
	}, []);

	useEffect(() => {
		updateNumberOfScoreBoxes();
		window.addEventListener("optimizedResize", updateNumberOfScoreBoxes);
		return () => {
			window.removeEventListener("optimizedResize", updateNumberOfScoreBoxes);
		};
	}, [updateNumberOfScoreBoxes]);

	if (lid === undefined || games.length === 0) {
		return null;
	}

	// Don't show any new games if liveGameInProgress
	if (!liveGameInProgress) {
		prevGames.current = games;
	}

	let games2: typeof games = [];
	if (show) {
		// Show only the first upcoming game
		for (const game of prevGames.current) {
			games2.push(game);
			if (game.teams[0].pts === undefined) {
				break;
			}
		}

		const start = games2.length - numberOfScoreBoxes;
		if (start > 0) {
			games2 = games2.slice(start);
		}
	}

	const transition = { duration: 0.2, type: "tween" };

	return (
		<div
			className="league-top-bar d-flex justify-content-end overflow-hidden mt-2"
			style={show ? undefined : hiddenStyle}
		>
			{show ? (
				<AnimatePresence initial={false}>
					{games2.map(game => (
						<motion.div
							key={game.gid}
							positionTransition={transition}
							initial={{ x: 105 }}
							animate={{ x: 0 }}
							transition={transition}
						>
							<ScoreBox game={game} small />
						</motion.div>
					))}
				</AnimatePresence>
			) : null}
			<Toggle
				show={show}
				toggle={() => {
					setShow(show2 => !show2);
					localStorage.setItem("bbgmShowLeagueTopBar", String(!show));
				}}
			/>
		</div>
	);
});

export default LeagueTopBar;
