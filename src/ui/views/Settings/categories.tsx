import type { ReactNode } from "react";
import { WEBSITE_ROOT, isSport } from "../../../common";
import { helpers } from "../../util";
import type { Category } from "./types";

// Specified order for UI
const categories: {
	name: Category;
	helpText?: ReactNode;
}[] = [
	{
		name: "New League",
	},
	{
		name: "General",
	},
	{
		name: "Schedule",
		helpText: (
			<>
				<p>
					Changing these settings will only apply to the current season if the
					regular season or playoffs have not started yet. Otherwise, changes
					will be applied for next year. If you are in the regular season and
					have not yet played a game yet, you can regenerate the current
					schedule in the{" "}
					<a href={helpers.leagueUrl(["danger_zone"])}>Danger Zone</a>.
				</p>
				<p>
					The schedule is set by first accounting for "# Division Games" and "#
					Conference Games" for each team. Then, remaining games are filled with
					any remaining teams (non-conference teams, plus maybe division and
					conference teams if one of those settings is left blank).{" "}
					<a
						href={`https://${WEBSITE_ROOT}/manual/customization/schedule-settings/`}
						rel="noopener noreferrer"
						target="_blank"
					>
						More details.
					</a>
				</p>
			</>
		),
	},
	{
		name: "Standings",
	},
	{
		name: "Playoffs",
	},
	{
		name: "Players",
	},
	{
		name: "Teams",
	},
	{
		name: "Draft",
	},
	{
		name: "Finances",
	},
	{
		name: "Inflation",
		helpText: (
			<>
				<p>
					This lets you randomly change your league's financial settings (salary
					cap, min payroll, luxury tax payroll, min contract, max contract)
					every year before the draft. It works by picking a{" "}
					<a
						href="https://en.wikipedia.org/wiki/Truncated_normal_distribution"
						rel="noopener noreferrer"
						target="_blank"
					>
						truncated Gaussian random number
					</a>{" "}
					based on the parameters set below (min, max, average, and standard
					deviation).
				</p>
				{isSport("basketball") ? (
					<p>
						If you have any scheduled events containing specific finance changes
						then these settings will be ignored until all those scheduled events
						have been processed. Basically this means that for historical real
						players leagues, these inflation settings will only take effect once
						your league moves into the future.
					</p>
				) : null}
			</>
		),
	},
	{
		name: "Contracts",
	},
	{
		name: "Rookie Contracts",
		helpText: (
			<>
				<p>
					Rookie contracts can set either from a fixed rookie contract scale, or
					by letting teams negotiate with players similar to re-signing a player
					on an expiring contract. Use the "Rookie Salary Scale" setting to pick
					which to use.
				</p>
				<p className="text-warning">
					If "Rookie Salary Scale" is disabled, none of the other settings in
					this section do anything.
				</p>
				<p>
					When using the rookie salary scale, the #1 pick recieves some fraction
					of a max contract. Subsequent picks recieve smaller contracts. After
					the number of rounds specified in "Rounds With Above Minimum
					Contracts" elapses, all remaining players get minimum contracts.
				</p>
			</>
		),
	},
	{
		name: "Events",
	},
	{
		name: "Injuries",
	},
	{
		name: "Game Simulation",
	},
	{
		name: "Elam Ending",
		helpText: (
			<>
				<p>
					The{" "}
					<a
						href="https://thetournament.com/elam-ending"
						rel="noopener noreferrer"
						target="_blank"
					>
						Elam Ending
					</a>{" "}
					is a new way to play the end of basketball games. In the final period
					of the game, when the clock goes below a certain point ("Minutes Left
					Trigger"), the clock is turned off. The winner of the game will be the
					team that first hits a target score. That target is determined by
					adding some number of points ("Target Points to Add") to the leader's
					current score.
				</p>
				<p>
					By default, the trigger is 4 minutes remaining and the target points
					to add is 8.
				</p>
				<p>
					The Elam Ending generally makes the end of the game more exciting.
					Nobody is trying to run out the clock. Nobody is trying to foul or
					call strategic timeouts or rush shots. It's just high quality
					basketball, every play until the end of the game.
				</p>
			</>
		),
	},
	{
		name: "All-Star Contests",
	},
	{
		name: "Challenge Modes",
	},
	{
		name: "Game Modes",
	},
	{
		name: "UI",
	},
];

export default categories;
