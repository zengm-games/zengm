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
	const { lid } = useLocalShallow(state => ({
		lid: state.lid,
	}));

	const [show, setShow] = useState(true);

	if (lid === undefined) {
		return null;
	}

	const games = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(gid => {
		let teams = [
			{
				pts: Math.round(Math.random() * 10 + 100),
				ovr: 50,
				tid: 0,
				won: 14,
				lost: 28,
			},
			{
				pts: Math.round(Math.random() * 10 + 100),
				ovr: 50,
				tid: Math.floor(1 + 29 * Math.random()),
				won: 14,
				lost: 28,
			},
		];

		if (Math.random() < 0.5) {
			teams = [teams[1], teams[0]];
		}

		return {
			gid,
			overtimes: 1,
			season: 2020,
			teams,
		};
	});

	games.push({
		gid: 10,
		overtimes: 1,
		season: 2020,
		teams: [
			{
				ovr: 50,
				tid: 0,
				won: 14,
				lost: 28,
			},
			{
				ovr: 50,
				tid: 1,
				won: 14,
				lost: 28,
			},
		],
	});

	if (games.length === 0) {
		return null;
	}

	return (
		<div
			className="league-top-bar d-flex justify-content-end mt-2"
			style={show ? undefined : hiddenStyle}
		>
			{show
				? games.map(game => <ScoreBox key={game.gid} game={game} small />)
				: null}
			<Toggle show={show} setShow={setShow} />
		</div>
	);
};

export default LeagueTopBar;
