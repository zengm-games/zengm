import React from "react";
import useTitleBar from "../hooks/useTitleBar";
import { helpers } from "../util";

const style = { maxWidth: 1000 };

const Frivolities = () => {
	useTitleBar({
		title: "Frivolities",
	});

	const frivolities = {
		"Player Origins": [
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
		],
		"Player Info": [
			{
				urlParts: ["relatives"],
				name: "Relatives",
				description: "See the family relationships between players.",
			},
			{
				urlParts: ["tragic_deaths"],
				name: "Tragic Deaths",
				description:
					"View all the tragic deaths that have occurred in your league.",
			},
		],
		Teams: [
			{
				urlParts: ["roster_continuity"],
				name: "Roster Continuity",
				description:
					"Color-coded visualization of year-to-year changes in roster.",
			},
		],
		"Players With The Most...": [
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
				urlParts: ["most", "oldest_former_players"],
				name: "Oldest Former Players",
				description:
					"As in reality, players die in Basketball GM, even after their careers end. See who made it the longest.",
			},
		],
	};

	const columns: (keyof typeof frivolities)[][] = [
		["Player Origins", "Player Info", "Teams"],
		["Players With The Most..."],
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

			<div className="row" style={style}>
				{columns.map((categories, i) => (
					<div key={i} className="col col-sm-6">
						{categories.map((category, i) => (
							<React.Fragment key={category}>
								<h3 className={`ml-1${i > 0 ? " mt-3" : ""}`}>{category}</h3>
								<div className="list-group">
									{frivolities[category].map(frivolity => (
										<a
											key={frivolity.name}
											href={helpers.leagueUrl([
												"frivolities",
												...frivolity.urlParts,
											])}
											className="list-group-item list-group-item-action"
										>
											<h3 className="mb-1">{frivolity.name}</h3>
											<p className="mb-1">{frivolity.description}</p>
										</a>
									))}
								</div>
							</React.Fragment>
						))}
					</div>
				))}
			</div>
		</>
	);
};

export default Frivolities;
