import classNames from "classnames";
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

// https://reactjs.org/docs/hooks-faq.html
const usePrevious = <T extends any>(value: T): T | undefined => {
	const ref = useRef<T>();
	useEffect(() => {
		ref.current = value;
	});
	return ref.current;
};

const LeagueTopBar = React.memo(() => {
	const { games, lid, liveGameInProgress } = useLocalShallow(state => ({
		games: state.games,
		lid: state.lid,
		liveGameInProgress: state.liveGameInProgress,
	}));

	const [show, setShow] = useState(true);
	const [numberOfScoreBoxes, setNumberOfScoreBoxes] = useState(10);
	const prevGames = usePrevious(games);

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

	if (lid === undefined) {
		return null;
	}

	if (games.length === 0) {
		return null;
	}

	// Don't show any new games if liveGameInProgress
	const games2 = liveGameInProgress ? prevGames || [] : games;

	let games3 = [];
	// Show only the first upcoming game
	for (const game of games2) {
		games3.push(game);
		if (game.teams[0].pts === undefined) {
			break;
		}
	}

	games3 = games3.slice(games3.length - numberOfScoreBoxes);

	return (
		<div
			className="league-top-bar d-flex justify-content-end mt-2"
			style={show ? undefined : hiddenStyle}
		>
			{show
				? games3.map(game => <ScoreBox key={game.gid} game={game} small />)
				: null}
			<Toggle
				show={show}
				toggle={() => {
					setShow(show2 => !show2);
				}}
			/>
		</div>
	);
});

export default LeagueTopBar;
