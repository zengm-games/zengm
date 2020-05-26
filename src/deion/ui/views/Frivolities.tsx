import React from "react";
import useTitleBar from "../hooks/useTitleBar";
import { helpers } from "../util";

const Frivolities = () => {
	useTitleBar({
		title: "Frivolities",
	});

	const frivolities = [
		{
			urlParts: ["colleges"],
			name: "Colleges",
			description:
				"See which colleges have had the most successful pro players.",
		},
		{
			urlParts: ["countries"],
			name: "Countries",
			description:
				"See which countries have had the most successful pro players.",
		},
		{
			urlParts: ["relatives"],
			name: "Relatives",
			description: "See the family relationships between players.",
		},
		{
			urlParts: ["roster_continuity"],
			name: "Roster Continuity",
			description:
				"Color-coded visualization of year-to-year changes in roster.",
		},
		{
			urlParts: ["tragic_deaths"],
			name: "Tragic Deaths",
			description:
				"View all the tragic deaths that have occurred in your league.",
		},
		{
			urlParts: ["most", "games_no_playoffs"],
			name: "Most Games, No Playoffs",
			description:
				"See the most accomplished players who never made the playoffs.",
		},
		{
			urlParts: ["most", "teams"],
			name: "Most Teams",
			description:
				"See the players who played for the largest number of teams.",
		},
		{
			urlParts: ["oldest_former_players"],
			name: "Oldest Former Players",
			description:
				"As in reality, players die in Basketball GM, even after their careers end. See who made it the longest.",
		},
	];

	return (
		<>
			<p>
				In the spirit of{" "}
				<a href="https://www.basketball-reference.com/friv/">
					Basketball Reference
				</a>
				, here is some fun stuff.
			</p>

			<p>
				<span className="text-danger">Warning:</span> most of these will be slow
				if you've played hundreds of seasons in this league.
			</p>

			<div className="list-group" style={{ maxWidth: 500 }}>
				{frivolities.map(frivolity => (
					<a
						key={frivolity.name}
						href={helpers.leagueUrl(["frivolities", ...frivolity.urlParts])}
						className="list-group-item list-group-item-action"
					>
						<h3 className="mb-1">{frivolity.name}</h3>
						<p className="mb-1">{frivolity.description}</p>
					</a>
				))}
			</div>
		</>
	);
};

export default Frivolities;
