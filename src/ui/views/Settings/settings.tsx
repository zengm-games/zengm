import {
	COURT,
	DEFAULT_CONFS,
	DIFFICULTY,
	GAME_NAME,
	isSport,
	SPORT_HAS_REAL_PLAYERS,
	TIEBREAKERS,
	WEBSITE_ROOT,
} from "../../../common";
import { toWorker, helpers } from "../../util";
import type { ReactNode } from "react";
import type { Category, Decoration, FieldType, Key, Values } from "./types";
import type { Settings } from "../../../worker/views/settings";

export const descriptions = {
	difficulty:
		"Increasing difficulty makes AI teams more reluctant to trade with you, makes players less likely to sign with you, and makes it harder to turn a profit.",
};

export const settings: {
	category: Category;
	key: Key;
	name: string;
	godModeRequired?: "always" | "existingLeagueOnly";
	type: FieldType;
	decoration?: Decoration;
	values?: Values;
	validator?: (
		value: any,
		output: any,
		initialSettings: Settings,
	) => void | Promise<void>;

	// For form fields that render one box for two keys, put any of the associated hidden keys here.
	partners?: Key[];

	// showOnlyIf is for hiding form elements that only make sense in some situations (like when creating a new league). hidden is for a setting where we're merging it with some other setting in the UI (probably with customForm) but still want to track it here so it gets updated properly.
	showOnlyIf?: (params: {
		defaultNewLeagueSettings?: boolean;
		hasPlayers?: boolean;
		newLeague?: boolean;
		realPlayers?: boolean;
	}) => boolean | undefined;
	customForm?: true;
	hidden?: true;
	maxWidth?: true;

	// Short, one line, shown by default
	description?: ReactNode;

	// Longer than one line, hidden by default
	descriptionLong?: ReactNode;
}[] = [
	{
		category: "New League",
		key: "realStats",
		name: "Historical Stats",
		godModeRequired: "existingLeagueOnly",
		showOnlyIf: ({ newLeague, hasPlayers, realPlayers }) =>
			newLeague && hasPlayers && realPlayers,
		type: "string",
		values: [
			{ key: "none", value: "None" },
			{ key: "lastSeason", value: "Last season, active players only" },
			{ key: "allActive", value: "All seasons, active players only" },
			{
				key: "allActiveHOF",
				value: "All seasons, active and Hall of Fame players only",
			},
			{ key: "all", value: "All seasons, teams, and players" },
		],
	},
	{
		category: "New League",
		key: "randomization",
		name: "Randomization",
		godModeRequired: "existingLeagueOnly",
		showOnlyIf: ({ newLeague, hasPlayers, realPlayers }) =>
			newLeague && hasPlayers && realPlayers,
		type: "string",
		values: [
			{ key: "none", value: "None" },
			{ key: "debuts", value: "Random debuts" },
			{ key: "debutsForever", value: "Random debuts forever" },
			{ key: "shuffle", value: "Shuffle rosters" },
		],
		descriptionLong: (
			<>
				<p>
					<b>Random debuts:</b> Every player's draft year is randomized.
					Starting teams and future draft classes are all random combinations of
					past, current, and future real players.
				</p>
				<p>
					<b>Random debuts forever:</b> Like random debuts, except when it runs
					out of draft prospects, it will randomize all real players again and
					add them to future draft classes.
				</p>
				<p>
					<b>Shuffle rosters:</b> All active players are placed on random teams.
				</p>
			</>
		),
		validator: (value, output) => {
			if (
				(value === "debuts" || value === "debutsForever") &&
				output.realStats !== "none"
			) {
				throw new Error(
					'Random debuts mode currently only works with "Historical Stats" set to "None"',
				);
			}
		},
	},
	{
		category: "New League",
		key: "randomization",
		name: "Randomization",
		godModeRequired: "existingLeagueOnly",
		showOnlyIf: ({
			defaultNewLeagueSettings,
			newLeague,
			hasPlayers,
			realPlayers,
		}) => newLeague && hasPlayers && !realPlayers && !defaultNewLeagueSettings,
		type: "string",
		values: [
			{ key: "none", value: "None" },
			{ key: "shuffle", value: "Shuffle rosters" },
		],
		descriptionLong: (
			<>
				<p>
					<b>Shuffle rosters:</b> All active players are placed on random teams.
				</p>
			</>
		),
	},
	{
		category: "New League",
		key: "realDraftRatings",
		name: "Real Draft Prospect Ratings",
		godModeRequired: "existingLeagueOnly",
		showOnlyIf: ({ newLeague, hasPlayers, realPlayers }) =>
			newLeague && hasPlayers && realPlayers,
		type: "string",
		values: [
			{ key: "rookie", value: "Based on rookie season stats" },
			{ key: "draft", value: "Based on draft position" },
		],
		descriptionLong: (
			<>
				<p>
					<b>Based on rookie season stats:</b> Player ratings for draft
					prospects are based on their rookie season stats. Players who
					overperformed or underperformed their real draft positions as rookies
					will be ranked differently than they were in reality.
				</p>
				<p>
					<b>Based on draft position:</b> Player ratings for draft prospects are
					based on the position they were drafted. Every #1 pick will have a
					high rating, even if in reality he was a bust. Every late pick will
					have a low rating, even if in reality he became a star.
				</p>
			</>
		),
	},
	{
		category: "New League",
		key: "equalizeRegions",
		name: "Equalize Region Populations",
		godModeRequired: "existingLeagueOnly",
		showOnlyIf: ({ newLeague }) => newLeague,
		type: "bool",
	},
	{
		category: "New League",
		key: "noStartingInjuries",
		name: "No Starting Injuries",
		godModeRequired: "existingLeagueOnly",
		showOnlyIf: ({ newLeague, hasPlayers }) => newLeague && hasPlayers,
		type: "bool",
	},
	{
		category: "Schedule",
		key: "numGames",
		name: "# Games Per Season",
		godModeRequired: "always",
		type: "int",
		validator: (value, output) => {
			if (value < 0) {
				throw new Error("Must not be negative");
			}

			const numGamesDiv = output.numGamesDiv ?? 0;
			const numGamesConf = output.numGamesConf ?? 0;
			if (value < numGamesDiv + numGamesConf) {
				throw new Error(
					"Can't have more division and conference games than total games",
				);
			}
		},
	},
	{
		category: "Schedule",
		key: "numGamesDiv",
		name: "# Division Games",
		type: "intOrNull",
		description:
			"Number of games versus other teams in the same division. Leave blank to treat division games like conference games.",
		validator: value => {
			if (typeof value === "number" && value < 0) {
				throw new Error("Cannot be negative");
			}
		},
	},
	{
		category: "Schedule",
		key: "numGamesConf",
		name: "# Conference Games",
		type: "intOrNull",
		description:
			"Number of games versus other teams in the same conference but different division. Leave blank to give no special scheduling treatment to conference games.",
		validator: value => {
			if (typeof value === "number" && value < 0) {
				throw new Error("Cannot be negative");
			}
		},
	},
	{
		category: "Teams",
		key: "minRosterSize",
		name: "Min Roster Size",
		godModeRequired: "always",
		type: "int",
		validator: (value, output) => {
			if (!isSport("football") && value < output.numPlayersOnCourt) {
				throw new Error("Value cannot be less than # Players On Court");
			}
		},
	},
	{
		category: "Teams",
		key: "maxRosterSize",
		name: "Max Roster Size",
		godModeRequired: "always",
		type: "int",
	},
	{
		category: "Playoffs",
		key: "numGamesPlayoffSeries",
		name: "# Playoff Games",
		godModeRequired: "existingLeagueOnly",
		descriptionLong: (
			<>
				<p>
					Specify the number of games in each round. You must enter a valid JSON
					array of integers. For example, enter <code>[5,7,1]</code> for a 5
					game first round series, a 7 game second round series, and a single
					winner-takes-all final game.
				</p>
				<p>
					To disable the playoffs and have the top team in the regular season
					crowned champion, set this to <code>[]</code>
				</p>
			</>
		),
		type: "jsonString",
		validator: async (value, output, initialSettings) => {
			if (!Array.isArray(value)) {
				throw new Error("Must be an array");
			}
			for (const num of value) {
				if (!Number.isInteger(num)) {
					throw new Error("Array must contain only integers");
				}
			}

			const numRounds = value.length;
			await toWorker("main", "validatePlayoffSettings", {
				numRounds,
				numPlayoffByes: output.numPlayoffByes,
				numActiveTeams: initialSettings.numActiveTeams,
				playIn: output.playIn,
				playoffsByConf: output.playoffsByConf,

				// Fallback is for when creating a new league and editing settings, confs are not available here
				confs: initialSettings.confs ?? DEFAULT_CONFS,
			});
		},
	},
	{
		category: "Standings",
		key: "tiebreakers",
		name: "Tiebreakers",
		godModeRequired: "existingLeagueOnly",
		descriptionLong: (
			<>
				<p>
					Specify the tiebreakers used to determine how tied teams should be
					ranked in the standings and playoffs. Available tiebreakers are:
				</p>
				<ul>
					{helpers.keys(TIEBREAKERS).map(key => (
						<li key={key}>
							<b>{key}</b> - {TIEBREAKERS[key]}
						</li>
					))}
				</ul>
				<p>
					If your list of tiebreakers does not include "coinFlip", it will
					automatically be added to the end to handle the case where every
					single other tiebreaker is tied.
				</p>
			</>
		),
		type: "jsonString",
		validator: value => {
			if (!Array.isArray(value)) {
				throw new Error("Must be an array");
			}
			for (const key of value) {
				if (typeof key !== "string") {
					throw new Error("Array must contain only strings");
				}
				if (!TIEBREAKERS.hasOwnProperty(key)) {
					throw new Error(`Invalid tiebreaker "${key}"`);
				}
			}
		},
		maxWidth: true,
	},
	{
		category: "Standings",
		key: "pointsFormula",
		name: "Points Formula",
		godModeRequired: "existingLeagueOnly",
		descriptionLong: (
			<>
				<p>
					You can either rank teams by winning percentage (like NBA/NFL/MLB) or
					points (like NHL). To rank by winning percentage, leave this blank. To
					rank by points, enter a formula here, such as <code>2*W+OTL+T</code>.
					Available variables are W, L, OTL, and T.
				</p>
			</>
		),
		validator: async value => {
			await toWorker("main", "validatePointsFormula", value);
		},
		type: "string",
	},
	{
		category: "Playoffs",
		key: "numPlayoffByes",
		name: "# First Round Byes",
		godModeRequired: "existingLeagueOnly",
		type: "int",
		description:
			"Number of playoff teams who will get a bye in the first round. For leagues with two conferences, byes will be split evenly across conferences.",
		validator: value => {
			if (value < 0) {
				throw new Error("Value cannot be less than 0");
			}
		},
	},
	{
		category: "Playoffs",
		key: "playIn",
		name: "Play-In Tournament",
		godModeRequired: "existingLeagueOnly",
		type: "bool",
		description:
			"NBA-like tournament to determine the lowest seeded playoff teams.",
	},
	{
		category: "Draft",
		key: "draftType",
		name: "Draft Type",
		godModeRequired: "existingLeagueOnly",
		descriptionLong: (
			<>
				<p>
					<b>NBA 2019:</b> Weighted lottery for the top 4 picks, like the NBA
					since 2019
				</p>
				<p>
					<b>NBA 1994:</b> Weighted lottery for the top 3 picks, like the NBA
					from 1994-2018
				</p>
				<p>
					<b>NBA 1990:</b> Weighted lottery for the top 3 picks, like the NBA
					from 1990-1993
				</p>
				<p>
					<b>NHL 2017:</b> Weighted lottery for the top 3 picks, like the NHL
					since 2017
				</p>
				<p>
					<b>Random, first 3:</b> Random lottery for the top 3 picks, like the
					NBA from 1987-1989
				</p>
				<p>
					<b>Random, lottery only:</b> Non-playoff teams draft in random order,
					like the NBA from 1985-1986
				</p>
				<p>
					<b>Coin flip:</b> Coin flip to determine the top 2 picks, like the NBA
					from 1966-1984
				</p>
				<p>
					<b>Random:</b> order the draft completely randomly, with no regard for
					team performance. Each round is randomized independently, so a team
					could get the first pick in one round and the last pick in the next
					round.
				</p>
				<p>
					<b>No Lottery, worst to best:</b> No lottery, teams draft in order of
					their record, from worst to best with non-playoff teams coming first.
				</p>
				<p>
					<b>No Lottery, best to worst:</b> No lottery, teams draft in order of
					their record, from best to worst with playoff teams coming first.
				</p>
				<p>
					<b>No draft, rookies are free agents</b> There is no draft and all
					rookies simply become free agents who can be signed by any team.
				</p>
			</>
		),
		type: "string",
		values: [
			{ key: "nba2019", value: "NBA 2019" },
			{ key: "nba1994", value: "NBA 1994" },
			{ key: "nba1990", value: "NBA 1990" },
			{ key: "nhl2017", value: "NHL 2017" },
			{ key: "randomLotteryFirst3", value: "Random, first 3" },
			{ key: "randomLottery", value: "Random, lottery only" },
			{ key: "coinFlip", value: "Coin flip" },
			{ key: "random", value: "Random" },
			{ key: "noLottery", value: "No lottery, worst to best" },
			{ key: "noLotteryReverse", value: "No lottery, best to worst" },
			{ key: "freeAgents", value: "No draft, rookies are free agents" },
		],
	},
	{
		category: "Draft",
		key: "numSeasonsFutureDraftPicks",
		name: "# Tradable Draft Pick Seasons",
		godModeRequired: "existingLeagueOnly",
		type: "int",
		description:
			"Number of seasons in the future to generate tradable draft picks for. The default value is 4. If you set this to 0, it disables all trading of draft picks.",
		validator: value => {
			if (value < 0) {
				throw new Error("Value cannot be less than 0");
			}
		},
	},
	{
		category: "Draft",
		key: "numDraftRounds",
		name: "# Draft Rounds",
		godModeRequired: "existingLeagueOnly",
		type: "int",
		validator: value => {
			if (value < 0) {
				throw new Error("Value cannot be less than 0");
			}
		},
	},
	{
		category: "Draft",
		key: "draftAges",
		name: "Age of Draft Prospects",
		godModeRequired: "always",
		description: (
			<>
				Set the minimum/maximum age of generated draft prospects.{" "}
				<a
					href="https://zengm.com/blog/2021/03/age-draft-prospects-force-retire-age/"
					rel="noopener noreferrer"
					target="_blank"
				>
					More info.
				</a>
			</>
		),
		type: "jsonString",
		validator: value => {
			if (!Array.isArray(value)) {
				throw new Error("Must be an array");
			}
			if (value.length != 2) {
				throw new Error("Must have 2 numbers");
			}
			if (value[0] > value[1]) {
				throw new Error("Max age can't be less than min age!");
			}
			for (const num of value) {
				if (!Number.isInteger(num)) {
					throw new Error("Array must contain only integers");
				}
			}
		},
	},
	{
		category: "Finances",
		key: "salaryCap",
		name: "Salary Cap",
		godModeRequired: "always",
		type: "float1000",
		decoration: "currency",
	},
	{
		category: "Finances",
		key: "minPayroll",
		name: "Minimum Payroll",
		godModeRequired: "always",
		type: "float1000",
		decoration: "currency",
	},
	{
		category: "Finances",
		key: "luxuryPayroll",
		name: "Luxury Tax Threshold",
		godModeRequired: "always",
		type: "float1000",
		decoration: "currency",
	},
	{
		category: "Finances",
		key: "luxuryTax",
		name: "Luxury Tax",
		godModeRequired: "always",
		type: "float",
		description:
			"Take the difference between a team's payroll and the luxury tax threshold. Multiply that by this number. The result is the penalty they have to pay.",
	},
	{
		category: "Inflation",
		key: "inflationMin",
		name: "Minimum",
		godModeRequired: "always",
		type: "float",
		decoration: "percent",
		validator: (value, output) => {
			if (value > output.inflationMax) {
				throw new Error("Value must be less than the maximum value.");
			}
		},
	},
	{
		category: "Inflation",
		key: "inflationMax",
		name: "Maximum",
		godModeRequired: "always",
		type: "float",
		decoration: "percent",
		validator: (value, output) => {
			if (value < output.inflationMin) {
				throw new Error("Value must be greater than the minimum value.");
			}
		},
	},
	{
		category: "Inflation",
		key: "inflationAvg",
		name: "Average",
		godModeRequired: "always",
		type: "float",
		decoration: "percent",
	},
	{
		category: "Inflation",
		key: "inflationStd",
		name: "Standard Deviation",
		godModeRequired: "always",
		type: "float",
		decoration: "percent",
	},
	{
		category: "Contracts",
		key: "minContract",
		name: "Min Contract",
		godModeRequired: "always",
		type: "float1000",
		decoration: "currency",
		validator: value => {
			if (value < 0) {
				throw new Error("Value cannot be negative");
			}
		},
	},
	{
		category: "Contracts",
		key: "maxContract",
		name: "Max Contract",
		godModeRequired: "always",
		type: "float1000",
		decoration: "currency",
		validator: (value, output) => {
			if (value < 0) {
				throw new Error("Value cannot be negative");
			}
			if (value < output.minContract) {
				throw new Error(
					"Value cannot be less than the minimum contract amount",
				);
			}
		},
	},
	{
		category: "Contracts",
		key: "minContractLength",
		name: "Min Contract Length",
		godModeRequired: "always",
		type: "int",
		validator: value => {
			if (value < 1) {
				throw new Error("Value must be at least 1");
			}
		},
	},
	{
		category: "Contracts",
		key: "maxContractLength",
		name: "Max Contract Length",
		godModeRequired: "always",
		type: "int",
		validator: (value, output) => {
			if (value < 1) {
				throw new Error("Value must be at least 1");
			}
			if (value < output.minContractLength) {
				throw new Error(
					"Value cannot be less than the minimum contract amount",
				);
			}
		},
	},
	{
		category: "Finances",
		key: "salaryCapType",
		name: "Salary Cap Type",
		godModeRequired: "always",
		type: "string",
		values: [
			{ key: "hard", value: "Hard cap" },
			{ key: "soft", value: "Soft cap" },
			{ key: "none", value: "None" },
		],
		descriptionLong: (
			<>
				<p>
					<b>Hard cap:</b> Team payroll cannot exceed the salary cap, except to
					sign free agents to minimum contracts which is to guarantee that you
					never get stuck without enough players. This also disables this luxury
					tax.
				</p>
				<p>
					<b>Soft cap:</b> Same as hard cap, eccept you can exceed the salary
					cap to sign draft picks or re-sign players (like the{" "}
					<a
						href="https://en.wikipedia.org/wiki/NBA_salary_cap#Larry_Bird_exception"
						target="_blank"
						rel="noopener noreferrer"
					>
						Larry Bird exception
					</a>
					) and you can make trades that increase your payroll beyond the salary
					cap as long as incoming salary is at most 125% of outgoing salary.
				</p>
				<p>
					<b>None:</b> There is no limit to your payroll. The "Salary Cap"
					setting is still used internally in many places to determine the
					overall financial state of the league, but it does not limit your
					signings or trades.
				</p>
			</>
		),
	},
	{
		category: "Finances",
		key: "budget",
		name: "Budget",
		godModeRequired: "always",
		type: "bool",
		descriptionLong: (
			<>
				<p>
					By default, an important part of this game is managing your team's
					budget. If you don't make enough profit, you can get fired.
				</p>
				<p>
					If instead you just want to manage the team without worrying about
					that stuff, set this option to "Disabled".
				</p>
				<p>Disabling the budget does a few things:</p>
				<ol>
					<li>
						Hides team cash, revenue, expenses, and profit from various parts of
						the UI.
					</li>
					<li>Stops the owner from caring about profit</li>
					<li>
						Hides the expense categories (scouting, coaching, health,
						facilities) and sets their effects for every team to the league
						average.
					</li>
				</ol>
			</>
		),
	},
	{
		category: "Events",
		key: "aiTradesFactor",
		name: "AI-to-AI Trades Factor",
		godModeRequired: "always",
		type: "float",
		description:
			"The baseline rate of trades between AI teams is multiplied by this number. Anything beyond 100 will be both absurd and ridiculously slow.",
	},
	{
		category: "Events",
		key: "aiJerseyRetirement",
		name: "AI Teams Retire Jersey Numbers",
		godModeRequired: "always",
		type: "bool",
		descriptionLong:
			"Normally, teams controlled by the AI (including your team, if you're using Auto Play or Spectator Mode) will retire jersey numbers of their former players as they deem appropriate. You can disable that behavior here, and then the AI will not retire or unretire any jersey numbers.",
	},
	{
		category: "Injuries",
		key: "injuryRate",
		name: "Injury Rate",
		godModeRequired: "always",
		type: "float",
		descriptionLong: (
			<>
				<p>
					The injury rate is the probability that a player is injured per
					possession.
					{isSport("basketball") ? (
						<>
							{" "}
							Based on{" "}
							<a
								href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3445097/"
								rel="noopener noreferrer"
								target="_blank"
							>
								this article
							</a>{" "}
							there are about 0.25 injuries per team per game, and with 10
							players on the court and ~200 possessions per game, that works out
							to 0.25/10/200 = 0.000125 by default.
						</>
					) : null}
				</p>
				<p>
					This is just an average. Older players have a higher chance of injury
					and younger players have a lower chance of injury.
				</p>
			</>
		),
	},
	{
		category: "Events",
		key: "tragicDeathRate",
		name: "Tragic Death Rate",
		godModeRequired: "always",
		type: "float",
		descriptionLong: (
			<>
				<p>
					The tragic death rate is the probability that a player will die a
					tragic death on a given regular season day. Yes, this only happens in
					the regular season.
					{isSport("basketball")
						? "  With roughly 100 days in a season, the default is about one death every 50 years, or 1/(50*100) = 0.0002."
						: null}{" "}
					If you set it too high and run out of players, then you'll have to use
					God Mode to either create more or bring some back from the dead.
				</p>
				{SPORT_HAS_REAL_PLAYERS ? (
					<p>
						If you're using the built-in rosters with real players, please be
						aware that real players can never experience tragic deaths, no
						matter how high you set this.
					</p>
				) : null}
			</>
		),
	},
	{
		category: "Events",
		key: "tragicDeaths",
		name: "Tragic Death Types",
		type: "custom",
		customForm: true,
	},
	{
		category: "Events",
		key: "brotherRate",
		name: "Brother Rate",
		type: "float",
		description:
			"The probability that a new player will be the brother of an existing player.",
	},
	{
		category: "Events",
		key: "sonRate",
		name: "Son Rate",
		type: "float",
		description:
			"The probability that a new player will be the son of an existing player.",
	},
	{
		category: "Events",
		key: "forceRetireAge",
		name: "Force Retire at Age",
		godModeRequired: "always",
		type: "int",
		description:
			"Players at or above this age will retire at the end of the season. A number lower than the maximum draft age will disable this setting.",
	},
	{
		category: "Events",
		key: "hofFactor",
		name: "Hall of Fame Threshold Factor",
		type: "float",
		descriptionLong: (
			<>
				<p>
					Hall of Fame eligibility is determined by a score based on player
					stats. If it exceeds a threshold, the player is inducted into the Hall
					of Fame.
				</p>
				<p>
					The threshold is multiplied by the Hall of Fame Threshold Factor
					before comparing. So if you increase this number, the Hall of Fame
					becomes harder to get into. Decrease it and it is easier to get in.
				</p>
			</>
		),
	},
	{
		category: "Rookie Contracts",
		key: "draftPickAutoContract",
		name: "Rookie Salary Scale",
		godModeRequired: "existingLeagueOnly",
		type: "bool",
	},
	{
		category: "Rookie Contracts",
		key: "draftPickAutoContractPercent",
		name: "#1 Pick Salary, % of Max Contract",
		godModeRequired: "existingLeagueOnly",
		type: "float",
		decoration: "percent",
	},
	{
		category: "Rookie Contracts",
		key: "draftPickAutoContractRounds",
		name: "Rounds With >Min Contracts",
		godModeRequired: "existingLeagueOnly",
		type: "int",
	},
	{
		category: "Rookie Contracts",
		key: "rookieContractLengths",
		name: "Rookie Contract Lengths",
		godModeRequired: "always",
		descriptionLong: (
			<>
				Specify the length of rookie contracts. Different rounds can have
				different lengths. The default is for first round picks to have 3 year
				contracts and second round picks to have 2 year contracts, which looks
				like: <code>[3,2]</code>. If you want every rookie contract to have the
				same length regardless of round, just set one number like{" "}
				<code>[2]</code> - this works because it uses the last value specified
				here for any rounds where you don't define contract length.
			</>
		),
		type: "jsonString",
		validator: value => {
			if (!Array.isArray(value)) {
				throw new Error("Must be an array");
			}
			for (const num of value) {
				if (!Number.isInteger(num)) {
					throw new Error("Array must contain only integers");
				}
			}
		},
	},
	{
		category: "Contracts",
		key: "playersRefuseToNegotiate",
		name: "Players Can Refuse To Negotiate",
		godModeRequired: "always",
		type: "bool",
	},
	{
		category: "Contracts",
		key: "rookiesCanRefuse",
		name: "Can Refuse After Rookie Contract",
		godModeRequired: "existingLeagueOnly",
		descriptionLong: (
			<>
				{GAME_NAME} has no concept of "restricted free agency" like the NBA
				does, so draft picks can refuse to negotiate with you after their rookie
				contracts expire. This option can force every player to be willing to
				negotiate when his rookie contract expires, which can somewhat make up
				for restricted free agency not existing.
			</>
		),
		type: "bool",
	},
	{
		category: "Contracts",
		key: "playerMoodTraits",
		name: "Player Mood Traits",
		godModeRequired: "existingLeagueOnly",
		type: "bool",
		descriptionLong: (
			<>
				This controls the existence of player mood traits (fame, loyalty, money,
				winning). Even if you disable it, the player mood system will still
				exist. For example, players will still want to play for a winning team,
				but there won't be any players who get an extra bonus/penalty for having
				the "winning" mood trait. See{" "}
				<a
					href={`https://${WEBSITE_ROOT}/manual/player-mood/`}
					rel="noopener noreferrer"
					target="_blank"
				>
					the manual
				</a>{" "}
				for more info about player mood.
			</>
		),
	},
	{
		category: "Challenge Modes",
		key: "challengeNoDraftPicks",
		name: "No Draft Picks",
		type: "bool",
		description:
			"Your team will not be given any draft picks. You can still trade with other teams to acquire their picks.",
	},
	{
		category: "Challenge Modes",
		key: "challengeNoFreeAgents",
		name: "No Free Agents",
		type: "bool",
		description:
			"You are not allowed to sign free agents, except to minimum contracts.",
	},
	{
		category: "Challenge Modes",
		key: "challengeNoTrades",
		name: "No Trades",
		type: "bool",
	},
	{
		category: "Challenge Modes",
		key: "challengeNoRatings",
		name: "No Visible Player Ratings",
		type: "bool",
	},
	{
		category: "Challenge Modes",
		key: "challengeLoseBestPlayer",
		name: "Lose Best Player",
		type: "bool",
		description:
			"At the end of the playoffs every season, the best player on your team will either retire (if real player) or die a tragic death (if random player).",
	},
	{
		category: "Challenge Modes",
		key: "challengeFiredLuxuryTax",
		name: "You're Fired If You Pay The Luxury Tax",
		type: "bool",
		description:
			"The luxury tax only exists if you have the hard cap disabled.",
	},
	{
		category: "Challenge Modes",
		key: "challengeFiredMissPlayoffs",
		name: "You're Fired If You Miss The Playoffs",
		type: "bool",
	},
	{
		category: "Challenge Modes",
		key: "challengeThanosMode",
		name: "Thanos Mode",
		type: "bool",
		description:
			"At the end of the playoffs, there's a 20% chance of half the league either dying (if random player) or retiring (if real player). After each event, it can't happen again until three years later.",
	},
	{
		category: "Game Modes",
		key: "spectator",
		name: "Spectator Mode",
		type: "bool",
		description:
			"In spectator mode, the AI controls all teams and you get to watch the league evolve. This is similar to Tools > Auto Play, but it lets you play through the season at your own pace.",
	},
	{
		category: "Schedule",
		key: "tradeDeadline",
		name: "Trade Deadline",
		godModeRequired: "existingLeagueOnly",
		type: "float",
		descriptionLong: (
			<>
				<p>
					Set this to the fraction of the regular season you want to happen
					before no more trades are allowed. So if you set this to 0.75, 75% of
					the season will be played before the trade deadline.
				</p>
				<p>
					Set it to 1 (i.e. 100% of the season) to disable the trade deadline.
				</p>
				<p>
					If you're already in the regular season, changing this setting will
					only affect future seasons, not the current season. See Tools &gt;
					Danger Zone to edit the current season's trade deadline.
				</p>
			</>
		),
		validator: value => {
			if (value > 1) {
				throw new Error("Value cannot be greater than 1");
			}
			if (value < 0) {
				throw new Error("Value cannot be less than 0");
			}
		},
	},
	{
		category: "Playoffs",
		key: "playoffsByConf",
		name: "Split By Conference",
		godModeRequired: "existingLeagueOnly",
		descriptionLong:
			"If your league has two conferences and there are enough teams in each conference to fill up half of the playoff bracket, then enabling this setting will put the top N teams of each conference into separate sides of the bracket.",
		type: "bool",
	},
	{
		category: "Playoffs",
		key: "playoffsNumTeamsDiv",
		name: "# Guaranteed Per Division",
		godModeRequired: "existingLeagueOnly",
		description:
			"The number of teams per division that automatically make the playoffs as the top seeds.",
		type: "int",
	},
	{
		category: "Playoffs",
		key: "playoffsReseed",
		name: "Reseed Rounds",
		godModeRequired: "existingLeagueOnly",
		description:
			"When enabled, the matchups in each round of the playoffs will be reset so the best team always plays the worst team.",
		type: "bool",
	},
	{
		category: "Players",
		key: "playerBioInfo",
		name: "Biographical Info",
		godModeRequired: "always",
		type: "custom",
		description: "Customize the home countries and names of generated players.",
		customForm: true,
	},
];

if (isSport("basketball")) {
	settings.push(
		{
			category: "Schedule",
			key: "allStarGame",
			name: "All-Star Game",
			type: "floatOrNull",
			descriptionLong: (
				<>
					<p>
						Set this to the fraction of the regular season you want to happen
						before the All-Star Game. So if you set this to 0.75, 75% of the
						season will be played before the All-Star Game.
					</p>
					<p>Make it blank to disable the All-Star Game.</p>
					<p>
						If you're already in the regular season, changing this setting will
						only affect future seasons, not the current season. See Tools &gt;
						Danger Zone to edit the current season's All-Star game.
					</p>
				</>
			),
			validator: value => {
				if (value !== null) {
					if (value > 1) {
						throw new Error("Value cannot be greater than 1");
					}
					if (value < 0) {
						throw new Error("Value cannot be less than 0");
					}
				}
			},
		},
		{
			category: "Game Simulation",
			key: "foulsNeededToFoulOut",
			name: "Foul Out Limit",
			godModeRequired: "always",
			type: "int",
			validator: value => {
				if (value < 0) {
					throw new Error("Value cannot be less than 0");
				}
			},
		},
		{
			category: "Game Simulation",
			key: "foulsUntilBonus",
			name: "# Fouls Until Bonus",
			godModeRequired: "always",
			descriptionLong: (
				<>
					This is the number of team fouls required for the opponent to get
					bonus FTs for a non-shooting foul. You must enter a valid JSON array
					of three integers. Each number determines the cutoff for different
					parts of a game. 1st is for each regulation period, 2nd is for each
					overtime period, 3rd is for the last 2 minutes of each period. The
					default is <code>[5,4,2]</code>.
				</>
			),
			type: "jsonString",
			validator: value => {
				if (!Array.isArray(value)) {
					throw new Error("Must be an array");
				}
				if (value.length != 3) {
					throw new Error("Must have 3 numbers");
				}
				for (const num of value) {
					if (!Number.isInteger(num)) {
						throw new Error("Array must contain only integers");
					}
					if (num < 0) {
						throw new Error("Values cannot be less than 0");
					}
				}
			},
		},
		{
			category: "Game Simulation",
			key: "pace",
			name: "Pace",
			godModeRequired: "always",
			type: "float",
			description: "Average number of possessions per 48 minutes.",
		},
		{
			category: "Game Simulation",
			key: "threePointers",
			name: "Three Pointers",
			godModeRequired: "always",
			type: "bool",
			description:
				"If you disable three pointers, shots from that range will still be displayed as three pointers in stats tables, but they will only count for two points.",
		},
		{
			category: "Game Simulation",
			key: "threePointTendencyFactor",
			name: "Three Point Tendency Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The baseline rate for number of three pointers is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "threePointAccuracyFactor",
			name: "Three Point Accuracy Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The baseline rate for three point percentage is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "twoPointAccuracyFactor",
			name: "Two Point Accuracy Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The baseline rate for two point percentage is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "blockFactor",
			name: "Block Tendency Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The baseline block percentage is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "stealFactor",
			name: "Steal Tendency Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The baseline steal percentage is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "turnoverFactor",
			name: "Turnover Tendency Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The baseline turnover percentage is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "orbFactor",
			name: "Off Reb Tendency Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The baseline offensive rebound percentage is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "foulRateFactor",
			name: "Foul Rate Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The baseline rates for shooting and non-shooting fouls are multiplied by this number.",
		},
		{
			category: "Players",
			key: "realPlayerDeterminism",
			name: "Real Player Determinism",
			godModeRequired: "existingLeagueOnly",
			type: "rangePercent",
			descriptionLong: (
				<>
					<p>
						By default, BBGM's player development algorithm does not take into
						account what we know about a real player's future performance. That
						corresponds to 0% in this setting. Increase determinism to 100% and
						real player ratings will be based entirely on their real life
						development curve. Anything in between is a mix.
					</p>
					<p>
						This has no impact on "random players"" leagues or randomly
						generated players in "real players" leagues.
					</p>
					<p>
						Value must be between 0 (normal BBGM player development) and 1 (100%
						deterministic when historical stats are available).
					</p>
				</>
			),
			validator: value => {
				if (value < 0 || value > 1) {
					throw new Error("Value must be between 0 and 1");
				}
			},
		},
		{
			category: "Elam Ending",
			key: "elam",
			name: "Regular Season and Playoffs",
			type: "bool",
		},
		{
			category: "Elam Ending",
			key: "elamASG",
			name: "All-Star Game",
			type: "bool",
		},
		{
			category: "Elam Ending",
			key: "elamMinutes",
			name: "Minutes Left Trigger",
			godModeRequired: "always",
			type: "float",
			validator: (value, output) => {
				if ((output.elam || output.elamASG) && value > output.quarterLength) {
					throw new Error(
						"Value must be less than or equal to the quarter length",
					);
				}
			},
		},
		{
			category: "Elam Ending",
			key: "elamPoints",
			name: "Target Points to Add",
			godModeRequired: "always",
			type: "int",
			validator: (value, output) => {
				if ((output.elam || output.elamASG) && value < 0) {
					throw new Error("Value must be greater than 0");
				}
			},
		},
	);
} else if (isSport("football")) {
	settings.push({
		category: "Game Simulation",
		key: "foulRateFactor",
		name: "Penalty Rate Factor",
		godModeRequired: "always",
		type: "float",
		description:
			"The baseline rate for penalties is multiplied by this number. Max is 10 because beyond that there is basically a penalty every play.",
		validator: value => {
			if (value > 10) {
				throw new Error("Value cannot exceed 10");
			}
		},
	});
	settings.push({
		category: "UI",
		key: "fantasyPoints",
		name: "Fantasy Points",
		type: "string",
		values: [
			{ key: "standard", value: "Standard" },
			{ key: "ppr", value: "PPR" },
			{ key: "halfPpr", value: "Half PPR" },
		],
	});
}

settings.push(
	{
		category: "Game Simulation",
		key: "numPeriods",
		name: "Number of Periods Per Game",
		godModeRequired: "always",
		type: "int",
		validator: value => {
			if (value <= 0) {
				throw new Error("Value must be greater than 0");
			}
		},
	},
	{
		category: "Game Simulation",
		key: "quarterLength",
		name: "Period Length (minutes)",
		godModeRequired: "always",
		type: "float",
	},
	{
		category: "Game Simulation",
		key: "homeCourtAdvantage",
		name: `Home ${helpers.upperCaseFirstLetter(COURT)} Advantage`,
		godModeRequired: "always",
		type: "float",
		decoration: "percent",
		description:
			"This is the percentage boost/penalty given to home/away player ratings. Default is 1%.",
	},
	{
		category: "Game Simulation",
		key: "ties",
		name: "Ties (Regular Season Only)",
		type: "bool",
	},
	{
		category: "Game Simulation",
		key: "otl",
		name: "Overtime Losses (Regular Season Only)",
		type: "bool",
		description:
			"Track overtime losses (OTL) separately from regulation losses, as is common in hockey.",
	},
	{
		category: "Game Modes",
		key: "repeatSeason",
		name: "Groundhog Day",
		godModeRequired: "always",
		type: "bool",
		description:
			"Next season will start immediately after the playoffs, with the same exact players and rosters as the previous season. No player development, no persistent transactions. Groundhog Day can be enabled at any point in the season prior to the draft.",
	},
	{
		category: "General",
		key: "difficulty",
		name: "Difficulty",
		type: "floatValuesOrCustom", // Maybe this would have been better as customForm, like stopOnInjuryGames
		descriptionLong: (
			<>
				<p>{descriptions.difficulty}</p>
				<p>
					If you set the difficulty to Easy, you will not get credit for any{" "}
					<a href="/achievements">Achievements</a>. This persists even if you
					later switch to a harder difficulty.
				</p>
			</>
		),
		values: [
			{ key: String(DIFFICULTY.Easy), value: "Easy" },
			{ key: String(DIFFICULTY.Normal), value: "Normal" },
			{ key: String(DIFFICULTY.Hard), value: "Hard" },
			{ key: String(DIFFICULTY.Insane), value: "Insane" },
		],
	},
	{
		category: "Injuries",
		key: "stopOnInjuryGames",
		name: "Stop On Injury",
		type: "int",
		description:
			"This will stop game simulation if one of your players is injured for more than N games. In auto play mode (Tools > Auto Play Seasons), this has no effect.",
		customForm: true,
		partners: ["stopOnInjury"],
	},
	{
		category: "Injuries",
		key: "injuries",
		name: "Injury Types",
		type: "custom",
		customForm: true,
	},
	{
		category: "General",
		key: "stopOnInjury",
		name: "Stop On Injury",
		type: "bool",
		hidden: true,
	},
	{
		category: "General",
		key: "autoDeleteOldBoxScores",
		name: "Auto Delete Old Box Scores",
		type: "bool",
		description:
			"This will automatically delete box scores older than the past three seasons because box scores use a lot of disk space. See Tools > Delete Old Data for more.",
	},
	{
		category: "UI",
		key: "hideDisabledTeams",
		name: "Hide Inactive Teams",
		type: "bool",
		descriptionLong:
			"This will hide inactive teams from dropdown menus at the top of many pages, such as the roster page.",
	},
	{
		category: "Players",
		key: "goatFormula",
		name: "GOAT Formula",
		type: "string",
		description: "See Tools > Frivolities > GOAT Lab for details.",
		maxWidth: true,
	},
);

if (isSport("basketball")) {
	settings.push({
		category: "Game Simulation",
		key: "numPlayersOnCourt",
		name: "# Players On Court",
		godModeRequired: "always",
		type: "int",
		description: "By default BBGM is 5-on-5, but you can change that here",
		validator: (value, output) => {
			if (value > output.minRosterSize) {
				throw new Error("Value cannot be greater than the min roster size");
			}
			if (value <= 0) {
				throw new Error("Value must be greater than 0");
			}
		},
	});
	settings.push({
		category: "All-Star Contests",
		key: "numPlayersDunk",
		name: "# Players In Dunk Contest",
		type: "int",
		validator: value => {
			if (value <= 1) {
				throw new Error("Value must be greater than 2");
			}
		},
	});
	settings.push({
		category: "All-Star Contests",
		key: "numPlayersThree",
		name: "# Players In 3pt Contest",
		type: "int",
		validator: value => {
			if (value <= 1) {
				throw new Error("Value must be greater than 2");
			}
		},
	});
}
