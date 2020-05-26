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
		"Biographical Info": [
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
				urlParts: ["most", "no_ring"],
				name: "Best Players Without a Ring",
				description: "The best players who never won a title.",
			},
			{
				urlParts: ["most", "no_mvp"],
				name: "Best Players Without an MVP",
				description: "The best players who never won an MVP awards.",
			},
			{
				urlParts: ["most", "progs"],
				name: "Best Progs",
				description: "Largest single season ovr increases.",
			},
			{
				urlParts: ["most", "busts"],
				name: "Biggest Busts",
				description: "Top 5 picks with the worst careers.",
			},
			{
				urlParts: ["most", "steals"],
				name: "Biggest Steals",
				description: "Late picks or undrafted players with the best careers.",
			},
			{
				urlParts: ["most", "earnings"],
				name: "Career Earnings",
				description: "Players who made the most money.",
			},
			{
				urlParts: ["most", "hall_of_good"],
				name: "Hall of Good",
				description:
					"The best retired players who didn't make the Hall of Fame.",
			},
			...(process.env.SPORT === "basketball"
				? [
						{
							urlParts: ["most", "hall_of_trash"],
							name: "Hall of Trash",
							description:
								"Worst players who actually got some playing time to show how bad they are.",
						},
				  ]
				: []),
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
				urlParts: ["most", "traded"],
				name: "Most Times Traded",
				description:
					"Players who were passed around like... you fill in the blank.",
			},
			{
				urlParts: ["most", "one_team"],
				name: "Most Years on One Team",
				description: "Players who were loyal to one team for the longest.",
			},
			{
				urlParts: ["most", "oldest_former_players"],
				name: "Oldest Former Players",
				description:
					"As in reality, players die in Basketball GM, even after their careers end. See who made it the longest.",
			},
			{
				urlParts: ["most", "oldest"],
				name: "Oldest to Play in a Game",
				description: "The oldest players who actually played.",
			},
			{
				urlParts: ["most", "worst_injuries"],
				name: "Worst Injuries",
				description:
					"Players who experienced the largest ovr declines due to injuries.",
			},
		],
	};

	const columns: (keyof typeof frivolities)[][] = [
		["Player Origins", "Biographical Info", "Teams"],
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
					<div
						key={i}
						className={`col-12 col-md-6${i > 0 ? " mt-3 mt-md-0" : ""}`}
					>
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
