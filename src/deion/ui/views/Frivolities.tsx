import React from "react";
import useTitleBar from "../hooks/useTitleBar";
import { helpers } from "../util";

const Frivolities = () => {
	useTitleBar({
		title: "Frivolities",
	});
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
				<b>
					<a
						href={helpers.leagueUrl(["frivolities", "most_games_no_playoffs"])}
					>
						Most Games, No Playoffs
					</a>
				</b>{" "}
				- see the most accomplished players who never made the playoffs (
				<span className="text-danger">Warning</span>: this is slow for large
				leagues!)
			</p>
			<p>
				<b>
					<a href={helpers.leagueUrl(["frivolities", "most_teams"])}>
						Most Teams
					</a>
				</b>{" "}
				- see the players who played for the largest number of teams (
				<span className="text-danger">Warning</span>: this is slow for large
				leagues!)
			</p>
			<p>
				<b>
					<a href={helpers.leagueUrl(["frivolities", "oldest_former_players"])}>
						Oldest Former Players
					</a>
				</b>{" "}
				- as in reality, players die in Basketball GM, even after their careers
				end. See who made it the longest. (
				<span className="text-danger">Warning</span>: this is slow for large
				leagues!)
			</p>
			<p>
				<b>
					<a href={helpers.leagueUrl(["frivolities", "relatives"])}>
						Relatives
					</a>
				</b>{" "}
				- see the family relationships between players (
				<span className="text-danger">Warning</span>: this is slow for large
				leagues!)
			</p>
			<p>
				<b>
					<a href={helpers.leagueUrl(["frivolities", "roster_continuity"])}>
						Roster Continuity
					</a>
				</b>{" "}
				- color-coded visualization of year-to-year changes in roster
				composition (<span className="text-danger">Warning</span>: this is{" "}
				<b>very</b> slow for large leagues!)
			</p>
			<p>
				<b>
					<a href={helpers.leagueUrl(["frivolities", "tragic_deaths"])}>
						Tragic Deaths
					</a>
				</b>{" "}
				- view all the tragic deaths that have occurred in your league (
				<span className="text-danger">Warning</span>: this is <b>very</b> slow
				for large leagues!)
			</p>
		</>
	);
};

export default Frivolities;
