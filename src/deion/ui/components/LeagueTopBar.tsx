import classNames from "classnames";
import React, { useState } from "react";
import { useLocalShallow } from "../util";
import ScoreBox from "./ScoreBox";

const Toggle = ({
	show,
	setShow,
}: {
	show: boolean;
	setShow: (show: boolean) => void;
}) => {
	return (
		<button
			className="btn btn-secondary p-0 league-top-bar-toggle"
			title={show ? "Hide scores" : "Show scores"}
			onClick={() => setShow(!show)}
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

const LeagueTopBar = () => {
	const { games, lid } = useLocalShallow(state => ({
		games: state.games,
		lid: state.lid,
	}));

	const [show, setShow] = useState(true);

	if (lid === undefined) {
		return null;
	}

	if (games.length === 0) {
		return null;
	}

	// Show only the first upcoming game
	const games2 = [];
	for (const game of games) {
		games2.push(game);
		if (game.teams[0].pts === undefined) {
			break;
		}
	}

	return (
		<div
			className="league-top-bar d-flex justify-content-end mt-2"
			style={show ? undefined : hiddenStyle}
		>
			{show
				? games2.map(game => <ScoreBox key={game.gid} game={game} small />)
				: null}
			<Toggle show={show} setShow={setShow} />
		</div>
	);
};

export default LeagueTopBar;
