import React, { useCallback, useEffect, useReducer, useRef } from "react";
import { useLocalShallow } from "../util";
import ScoreBox from "./ScoreBox";

const LeagueTopBar = () => {
	const { lid } = useLocalShallow(state => ({
		lid: state.lid,
	}));

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
		gid: 0,
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

	return (
		<div className="league-top-bar d-flex justify-content-end mt-2">
			{games.map(game => (
				<ScoreBox key={game.gid} game={game} small />
			))}
		</div>
	);
};

export default LeagueTopBar;
