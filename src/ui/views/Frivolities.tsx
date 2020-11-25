import React from "react";
import useTitleBar from "../hooks/useTitleBar";
import { helpers } from "../util";
import type {
	MenuItemHeader,
	MenuItemLink,
	MenuItemText,
} from "../../common/types";

const style = { maxWidth: 1000 };

const frivolities = {
	Draft: [
		{
			urlParts: ["draft_classes"],
			name: "Draft Class Rankings",
			description: "All draft classes, ranked from best to worst.",
		},
	],
	"Player Bios": [
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
			urlParts: ["jersey_numbers"],
			name: "Jersey Numbers",
			description:
				"See which jersey numbers have been used by the most successful pro players.",
		},
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
		{
			urlParts: ["teams", "best"],
			name: "Best Teams",
			description: "The greatest seasons of all time.",
		},
		{
			urlParts: ["teams", "worst"],
			name: "Worst Teams",
			description: "The worst seasons of all time.",
		},
		{
			urlParts: ["teams", "best_non_playoff"],
			name: "Best Non-Playoff Teams",
			description: "The best seasons from teams that missed the playoffs.",
		},
		{
			urlParts: ["teams", "worst_playoff"],
			name: "Worst Playoff Teams",
			description: "The worst seasons from teams that made the playoffs.",
		},
		{
			urlParts: ["teams", "worst_finals"],
			name: "Worst Finals Teams",
			description: "The worst seasons from teams that made the finals.",
		},
		{
			urlParts: ["teams", "worst_champ"],
			name: "Worst Championship Teams",
			description: "The worst seasons from teams that won the title.",
		},
	],
	Trades: [
		{
			urlParts: ["trades", "biggest"],
			name: "Biggest Trades",
			description: "Trades involving the best players and prospects.",
		},
		{
			urlParts: ["trades", "lopsided"],
			name: "Most Lopsided Trades",
			description:
				"Trades where one team's assets produced a lot more value than the other.",
		},
	],
	"Player Rankings": [
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
			description: "The best retired players who didn't make the Hall of Fame.",
		},
		...(process.env.SPORT === "basketball"
			? [
					{
						urlParts: ["most", "hall_of_shame"],
						name: "Hall of Shame",
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

const children: (MenuItemLink | MenuItemText)[] = [];
for (const [name, array] of Object.entries(frivolities)) {
	children.push({
		type: "text",
		text: name,
	});

	for (const frivolitiy of array) {
		children.push({
			type: "link",
			league: true,
			path: ["frivolities", ...frivolitiy.urlParts],
			text: frivolitiy.name,
		});
	}
}

export const frivolitiesMenu: MenuItemHeader = {
	type: "header",
	long: "Frivolities",
	short: "Frivolities",
	league: true,
	children,
};

const Frivolities = () => {
	useTitleBar({
		title: "Frivolities",
		customMenu: frivolitiesMenu,
	});

	const columns: (keyof typeof frivolities)[][] = [
		["Draft", "Player Bios", "Teams", "Trades"],
		["Player Rankings"],
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
