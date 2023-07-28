import {
	bySport,
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
import { draftTypeDescriptions } from "../../../common/draftLottery";
import defaultGameAttributes, {
	gameAttributesKeysOtherSports,
} from "../../../common/defaultGameAttributes";

export const descriptions = {
	difficulty:
		"Increasing difficulty makes AI teams more reluctant to trade with you, makes players less likely to sign with you, and makes it harder to turn a profit.",
};

type Setting = {
	category: Category;
	key: Key;
	name: string;
	godModeRequired?: "always" | "existingLeagueOnly";
	type: FieldType;
	decoration?: Decoration;
	values?: Values;
	parse?: (value: string) => unknown;
	stringify?: (value: unknown) => string;
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
};

export const settings: Setting[] = (
	[
		{
			category: "New League",
			key: "realStats",
			name: "Historical Stats",
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
			showOnlyIf: ({ newLeague, hasPlayers, realPlayers }) =>
				newLeague && hasPlayers && realPlayers,
			type: "string",
			values: [
				{ key: "none", value: "None" },
				{ key: "debuts", value: "Random debuts" },
				{
					key: "debutsKeepCurrent",
					value: "Random debuts (keep current rosters)",
				},
				{ key: "debutsForever", value: "Random debuts forever" },
				{
					key: "debutsForeverKeepCurrent",
					value: "Random debuts forever (keep current rosters)",
				},
				{ key: "shuffle", value: "Shuffle rosters" },
			],
			descriptionLong: (
				<>
					<p>
						<b>Random debuts:</b> Every player's draft year is randomized.
						Starting teams and future draft classes are all random combinations
						of past, current, and future real players.
					</p>
					<p>
						<b>Random debuts forever:</b> Like random debuts, except when it
						runs out of draft prospects, it will randomize all real players
						again and add them to future draft classes.
					</p>
					<p>
						<b>(keep current rosters)</b> means that the current rosters will
						not be randomized, only future draft classes.
					</p>
					<p>
						<b>Shuffle rosters:</b> All active players are placed on random
						teams.
					</p>
				</>
			),
			validator: (value, output) => {
				if (
					(value === "debuts" || value === "debutsForever") &&
					output.realStats !== "none"
				) {
					throw new Error(
						'Random debuts only works with "Historical Stats" set to "None"',
					);
				}
				if (
					(value === "debutsKeepCurrent" ||
						value === "debutsForeverKeepCurrent") &&
					output.realStats !== "none" &&
					output.realStats !== "lastSeason" &&
					output.realStats !== "allActive"
				) {
					throw new Error(
						'Random debuts (keep current rosters) only works with "Historical Stats" set to "None", "Last season, active players only", or "All seasons, active players only"',
					);
				}
			},
		},
		{
			category: "New League",
			key: "randomization",
			name: "Randomization",
			showOnlyIf: ({
				defaultNewLeagueSettings,
				newLeague,
				hasPlayers,
				realPlayers,
			}) =>
				newLeague && hasPlayers && !realPlayers && !defaultNewLeagueSettings,
			type: "string",
			values: [
				{ key: "none", value: "None" },
				{ key: "shuffle", value: "Shuffle rosters" },
			],
			descriptionLong: (
				<>
					<p>
						<b>Shuffle rosters:</b> All active players are placed on random
						teams.
					</p>
				</>
			),
		},
		...(SPORT_HAS_REAL_PLAYERS
			? ([
					{
						category: "New League",
						key: "randomization",
						name: "Randomization",
						showOnlyIf: ({
							defaultNewLeagueSettings,
							newLeague,
							hasPlayers,
							realPlayers,
						}) =>
							newLeague &&
							!hasPlayers &&
							!realPlayers &&
							!defaultNewLeagueSettings,
						type: "string",
						values: [
							{ key: "none", value: "None" },
							{ key: "debuts", value: "Random debuts" },
							{ key: "debutsForever", value: "Random debuts forever" },
						],
						descriptionLong: (
							<>
								<p>
									<b>Random debuts:</b> Any real players not in your league will
									appear as draft prospects.
								</p>
								<p>
									<b>Random debuts forever:</b> Like random debuts, except when
									it runs out of draft prospects, it will randomize all real
									players again and add them to future draft classes.
								</p>
							</>
						),
					},
			  ] as Setting[])
			: []),
		{
			category: "New League",
			key: "realDraftRatings",
			name: "Real Draft Prospect Ratings",
			showOnlyIf: ({ newLeague, hasPlayers, realPlayers }) =>
				newLeague &&
				((hasPlayers && realPlayers) ||
					(SPORT_HAS_REAL_PLAYERS && !hasPlayers && !realPlayers)),
			type: "string",
			values: [
				{ key: "rookie", value: "Based on rookie season stats" },
				{ key: "draft", value: "Based on draft position" },
			],
			descriptionLong: (
				<>
					<p>
						This setting only applies to real players, it has no affect on
						random players.
					</p>
					<p>
						<b>Based on rookie season stats:</b> Player ratings for real draft
						prospects are based on their rookie season stats. Players who
						overperformed or underperformed their real draft positions as
						rookies will be ranked differently than they were in reality.
					</p>
					<p>
						<b>Based on draft position:</b> Player ratings for real draft
						prospects are based on the position they were drafted. Every #1 pick
						will have a high rating, even if in reality he was a bust. Every
						late pick will have a low rating, even if in reality he became a
						star.
					</p>
				</>
			),
		},
		{
			category: "New League",
			key: "equalizeRegions",
			name: "Equalize Region Populations",
			showOnlyIf: ({ newLeague }) => newLeague,
			type: "bool",
		},
		{
			category: "New League",
			key: "noStartingInjuries",
			name: "No Starting Injuries",
			godModeRequired: "always",
			showOnlyIf: ({ newLeague, hasPlayers }) => newLeague && hasPlayers,
			type: "bool",
		},
		{
			category: "New League",
			key: "giveMeWorstRoster",
			name: "Give Me The Worst Roster",
			showOnlyIf: ({ newLeague }) => newLeague,
			type: "bool",
			description:
				"This swaps your roster with the roster of the worst team in the league, based on team ovr rating.",
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
					throw new Error(`Value cannot be less than # Players On ${COURT}`);
				}
				if (isSport("hockey") && value < 12) {
					// Game sim crashes with fewer than 12 players currently. Otherwise, should be no limit.
					throw new Error("Value must be at least 12");
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
						Specify the number of games in each round. You must enter a valid
						JSON array of integers. For example, enter <code>[5,7,1]</code> for
						a 5 game first round series, a 7 game second round series, and a
						single winner-takes-all final game.
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
					if (!Object.hasOwn(TIEBREAKERS, key)) {
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
						You can either rank teams by winning percentage (like NBA/NFL/MLB)
						or points (like NHL). To rank by winning percentage, leave this
						blank. To rank by points, enter a formula here, such as{" "}
						<code>2*W+OTL+T</code>. Available variables are W, L, OTL, and T.
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
						<b>NBA 2019:</b> {draftTypeDescriptions.nba2019}
					</p>
					<p>
						<b>NBA 1994:</b> {draftTypeDescriptions.nba1994}
					</p>
					<p>
						<b>NBA 1990:</b> {draftTypeDescriptions.nba1990}
					</p>
					<p>
						<b>NHL 2017:</b> {draftTypeDescriptions.nhl2017}
					</p>
					<p>
						<b>NHL 2021:</b> {draftTypeDescriptions.nhl2021}
					</p>
					<p>
						<b>MLB 2022:</b> {draftTypeDescriptions.mlb2022}
					</p>
					<p>
						<b>Random, first 3:</b> {draftTypeDescriptions.randomLotteryFirst3}
					</p>
					<p>
						<b>Random, lottery only:</b> {draftTypeDescriptions.randomLottery}
					</p>
					<p>
						<b>Coin flip:</b> {draftTypeDescriptions.coinFlip}
					</p>
					<p>
						<b>Random:</b> order the draft completely randomly, with no regard
						for team performance. Each round is randomized independently, so a
						team could get the first pick in one round and the last pick in the
						next round.
					</p>
					<p>
						<b>No lottery, worst to best:</b> {draftTypeDescriptions.noLottery}
					</p>
					<p>
						<b>No lottery, best to worst:</b>{" "}
						{draftTypeDescriptions.noLotteryReverse}
					</p>
					<p>
						<b>Custom lottery:</b> {draftTypeDescriptions.custom} Set the
						lottery parameters in the "Custom # lottery selections" and "Custom
						lottery chances" settings.
					</p>
					<p>
						<b>No draft, rookies are free agents:</b> There is no draft and all
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
				{ key: "nhl2021", value: "NHL 2021" },
				{ key: "mlb2022", value: "MLB 2022" },
				{ key: "randomLotteryFirst3", value: "Random, first 3" },
				{ key: "randomLottery", value: "Random, lottery only" },
				{ key: "coinFlip", value: "Coin flip" },
				{ key: "random", value: "Random" },
				{ key: "noLottery", value: "No lottery, worst to best" },
				{ key: "noLotteryReverse", value: "No lottery, best to worst" },
				{ key: "custom", value: "Custom lottery" },
				{ key: "freeAgents", value: "No draft, rookies are free agents" },
			],
		},
		{
			category: "Draft",
			key: "draftLotteryCustomNumPicks",
			name: "Custom # lottery selections",
			godModeRequired: "existingLeagueOnly",
			type: "int",
			description:
				'This only applies if Draft Type is set to "Custom lottery".',
			descriptionLong: (
				<>
					<p>This only applies if Draft Type is set to "Custom lottery".</p>
					<p>
						This defines the number of picks that will be randomly assigned in
						the draft lottery. Any picks after this are assigned in order from
						worst team to best team. This must be less than the number of
						non-playoff teams.
					</p>
				</>
			),

			validator: value => {
				if (value < 1) {
					throw new Error("Value cannot be less than 1");
				}
			},
		},
		{
			category: "Draft",
			key: "draftLotteryCustomChances",
			name: "Custom lottery chances",
			godModeRequired: "existingLeagueOnly",
			type: "jsonString",
			description:
				'This only applies if Draft Type is set to "Custom lottery".',
			descriptionLong: (
				<>
					<p>This only applies if Draft Type is set to "Custom lottery".</p>
					<p>
						Specify the number of chances each team should have to win the
						lottery. The first number is for the worst team, second is for the
						next worst team, etc. If there are more lottery teams than entries
						here, the last number will be repeated for all other teams.
					</p>
					<p>
						You must enter a valid JSON array of integers. For example, enter{" "}
						<code>[10, 5, 1]</code> to give 10 chances to the first team, 5
						chances to the second team, and 1 chance to all other teams in the
						lottery.
					</p>
				</>
			),
			validator: async value => {
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
			validator: value => {
				if (value <= 0) {
					throw new Error("Must be a positive number");
				}
			},
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
						<b>Hard cap:</b> Team payroll cannot exceed the salary cap, except
						to sign free agents to minimum contracts which is to guarantee that
						you never get stuck without enough players. This also disables this
						luxury tax.
					</p>
					<p>
						<b>Soft cap:</b> Same as hard cap, except you can exceed the salary
						cap to sign draft picks or re-sign players (like the{" "}
						<a
							href="https://en.wikipedia.org/wiki/NBA_salary_cap#Larry_Bird_exception"
							target="_blank"
							rel="noopener noreferrer"
						>
							Larry Bird exception
						</a>
						) and you can make trades that increase your payroll beyond the
						salary cap as long as incoming salary is at most 125% of outgoing
						salary (percent can be customized with the "Trade Salary Match"
						setting).
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
							Hides team cash, revenue, expenses, and profit from various parts
							of the UI.
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
			category: "Finances",
			key: "softCapTradeSalaryMatch",
			name: "Trade Salary Match",
			godModeRequired: "always",
			type: "float",
			decoration: "percent",
			descriptionLong: (
				<>
					<p>
						This only matters when the Salary Cap Type is set to "Soft cap"!
					</p>
					<p>
						When a team is over the salary cap in a soft cap league, any trades
						they make cannot return more than X% of the outgoing salary. The
						default value is 125%. This is to prevent teams over the soft cap
						from going much further over.
					</p>
				</>
			),
			validator: value => {
				if (value < 0) {
					throw new Error("Value cannot be less than 0");
				}
			},
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
								players on the court and ~200 possessions per game, that works
								out to 0.25/10/200 = 0.000125 by default.
							</>
						) : null}
					</p>
					<p>
						This is just an average. Older players have a higher chance of
						injury and younger players have a lower chance of injury.
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
						tragic death on a given regular season day. Yes, this only happens
						in the regular season.
						{isSport("basketball")
							? "  With roughly 100 days in a season, the default is about one death every 50 years, or 1/(50*100) = 0.0002."
							: null}{" "}
						If you set it too high and run out of players, then you'll have to
						use God Mode to either create more or bring some back from the dead.
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
			name: "Sibling Rate",
			type: "float",
			description:
				"The probability that a new player will be the sibling of an existing player.",
		},
		{
			category: "Events",
			key: "sonRate",
			name: "Child Rate",
			type: "float",
			description:
				"The probability that a new player will be the child of an existing player.",
		},
		{
			category: "Events",
			key: "minRetireAge",
			name: "Minimum Retirement Age",
			godModeRequired: "always",
			type: "int",
			description:
				"This affects players who remain unsigned for more than 1 season, and also (if you set it high enough) players on teams who are old and declining in production.",
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
						stats. If it exceeds a threshold, the player is inducted into the
						Hall of Fame.
					</p>
					<p>
						The threshold is multiplied by the Hall of Fame Threshold Factor
						before comparing. So if you increase this number, the Hall of Fame
						becomes harder to get into. Decrease it and it is easier to get in.
					</p>
				</>
			),
		},
		/*{
			category: "Events",
			key: "autoExpandProb",
			name: "Auto Expansion Probability",
			godModeRequired: "always",
			type: "float",
			description:
				"Probability each offseason that there will be expansion teams.",
			validator: value => {
				if (value < 0 || value > 1) {
					throw new Error("Value must be between 0 and 1");
				}
			},
		},
		{
			category: "Events",
			key: "autoExpandGeo",
			name: "Auto Expansion Regions",
			godModeRequired: "always",
			type: "string",
			values: [
				{ key: "naFirst", value: "North America first" },
				{ key: "naOnly", value: "North America only" },
				{ key: "any", value: "Anywhere" },
			],
		},
		{
			category: "Events",
			key: "autoExpandNumTeams",
			name: "Auto Expansion # Teams",
			godModeRequired: "always",
			type: "int",
			validator: value => {
				if (value < 1) {
					throw new Error("Value must be greater than 0");
				}
			},
		},*/
		{
			category: "Events",
			key: "autoRelocateProb",
			name: "Auto Relocation Probability",
			type: "float",
			description:
				"Probability each offseason that a team will relocate to a new region.",
			validator: value => {
				if (value < 0 || value > 1) {
					throw new Error("Value must be between 0 and 1");
				}
			},
		},
		{
			category: "Events",
			key: "autoRelocateGeo",
			name: "Auto Relocation Regions",
			type: "string",
			values: [
				{ key: "naFirst", value: "North America first" },
				{ key: "naOnly", value: "North America only" },
				{ key: "any", value: "Anywhere" },
			],
			descriptionLong:
				'"North America first" means teams won\'t relocate outside of North America unless another team is already outside of North America or all of the North American teams are already taken.',
		},
		{
			category: "Events",
			key: "autoRelocateRebrand",
			name: "Rebrand Teams After Auto Relocation",
			type: "bool",
		},
		{
			category: "Events",
			key: "autoRelocateRealign",
			name: "Realign Divs After Auto Relocation",
			type: "bool",
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
					like: <code>[3,2]</code>. If you want every rookie contract to have
					the same length regardless of round, just set one number like{" "}
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
					does, so draft picks can refuse to negotiate with you after their
					rookie contracts expire. This option can force every player to be
					willing to negotiate when his rookie contract expires, which can
					somewhat make up for restricted free agency not existing.
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
					This controls the existence of player mood traits (fame, loyalty,
					money, winning). Even if you disable it, the player mood system will
					still exist. For example, players will still want to play for a
					winning team, but there won't be any players who get an extra
					bonus/penalty for having the "winning" mood trait. See{" "}
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
			key: "challengeSisyphusMode",
			name: "Sisyphus Mode",
			type: "bool",
			description:
				"After you reach the top of the mountain (win a championship), your roster is swapped with the worst team in the league.",
		},
		{
			category: "Challenge Modes",
			key: "challengeThanosMode",
			name: "Thanos Mode",
			type: "float",
			decoration: "percent",
			description:
				"At the end of the playoffs, there's some percentage chance of half the league either dying (if random player) or retiring (if real player). After each event, it can't happen again until three years later.",
			validator: value => {
				if (value > 100) {
					throw new Error("Value cannot be greater than 100%");
				}
				if (value < 0) {
					throw new Error("Value cannot be less than 0%");
				}
			},
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
						before no more trades are allowed. So if you set this to 0.75, 75%
						of the season will be played before the trade deadline.
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
			category: "Schedule",
			key: "groupScheduleSeries",
			name: "Group Games Into Series",
			type: "bool",
			descriptionLong: (
				<>
					<p>
						When enabled, matchups between the same teams will be grouped into 3
						or 4 game series, similar to a MLB schedule. It's really only
						noticeable when the same teams play multiple games against each
						other on the same home {COURT}, such as in a 162 game baseball
						season with 30 teams.
					</p>
					<p>
						This does not change the games scheduled, it only reorders them.
					</p>
				</>
			),
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
			key: "gender",
			name: "Gender",
			showOnlyIf: ({ hasPlayers, realPlayers }) => !hasPlayers || !realPlayers,
			type: "string",
			values: [
				{ key: "male", value: "Male" },
				{ key: "female", value: "Female" },
			],
			descriptionLong: (
				<>
					<p>
						In existing leagues, this only affects future generated players, not
						existing players. Currently male and female players have only
						cosmetic differences (names, faces, height/weight) but identical
						ratings, so this is not meant to realistically simulate mixed
						male/female leagues.
					</p>
					<p>
						If you change this in a league with default Biographical Info, it
						will switch to the male/female defaults. Female has fewer countries
						and names in its database.
					</p>
				</>
			),
		},
		{
			category: "Players",
			key: "playerBioInfo",
			name: "Biographical Info",
			godModeRequired: "always",
			type: "custom",
			description:
				"Customize the home countries and names of generated players.",
			customForm: true,
		},
		{
			category: "Players",
			key: "heightFactor",
			name: "Height Factor",
			type: "float",
			descriptionLong: (
				<>
					<p>
						This affects the displayed heights (in feet/inches or in cm) of
						generated players (not existing players or real players). This does
						not affect the height rating which actually impacts gameplay, so it
						is purely a cosmetic setting. Use it if you want your league to have
						taller/shorter displayed heights than normal.
					</p>
					<p>
						This value is simply multiplied by the player's default generated
						height (in inches/cm), so values greater than 1 mean players will be
						taller than normal, and values less than 1 mean shorter than normal.
					</p>
					<p>
						More info for women's leagues only: this setting is independent of
						the Gender setting. If you switch from male to female, generated
						female players will have lower heights and weight than male players,
						even if you leave the Height Factor and Weight Factor set to 1. Only
						change these settings if you want further changes to generated
						heights/weights on top of that.
					</p>
				</>
			),
		},
		{
			category: "Players",
			key: "weightFactor",
			name: "Weight Factor",
			type: "float",
			descriptionLong:
				"See Height Factor for an explanation, this works the same way.",
		},
		{
			category: "All-Star",
			key: "allStarGame",
			name: "Game Scheduling",
			type: "floatOrNull",
			descriptionLong: (
				<>
					<p>
						Set this to the fraction of the regular season you want to happen
						before the All-Star Game. So if you set this to 0.75, 75% of the
						season will be played before the All-Star Game.
					</p>
					<p>
						Set it to -1 to play the All-Star Game right before the finals. In
						this case, just for fun, there will be no injuries during the
						All-Star Game so players in the upcoming championship game can play
						too.
					</p>
					<p>Make it blank to disable the All-Star Game.</p>
					<p>
						If you're already in the regular season, changing this setting will
						only affect future seasons, not the current season. See Tools &gt;
						Danger Zone to edit the current season's All-Star Game.
					</p>
				</>
			),
			validator: value => {
				if (value !== null) {
					if (value > 1) {
						throw new Error("Value cannot be greater than 1");
					}
					if (value < 0 && value !== -1) {
						throw new Error("-1 is the only allowable value less than 0");
					}
				}
			},
		},
		{
			category: "All-Star",
			key: "allStarNum",
			name: "# Players Per Team",
			type: "int",
			validator: (value, output) => {
				if (isSport("basketball")) {
					if (
						value < output.minRosterSize &&
						value < defaultGameAttributes.minRosterSize
					) {
						throw new Error("Value cannot be less than the min roster size");
					}
				} else {
					if (value < defaultGameAttributes.allStarNum) {
						throw new Error(
							`Value must be greater than or equal to ${defaultGameAttributes.allStarNum}`,
						);
					}
				}
			},
		},
		{
			category: "All-Star",
			key: "allStarType",
			name: "Team Assignment",
			type: "string",
			values: [
				...(isSport("basketball") ? [{ key: "draft", value: "Draft" }] : []),
				{ key: "byConf", value: "By Conference" },
				{ key: "top", value: "Mixed" },
			],
			descriptionLong: (
				<>
					{isSport("basketball") ? (
						<p>
							<b>Draft:</b> The top two players are captains and draft their
							teams from the remaining players.
						</p>
					) : null}
					<p>
						<b>By Conference:</b> Each conference has a separate All-Star Team.
						This only is possible for leagues with exactly 2 conferences.
					</p>
					<p>
						<b>Mixed:</b> Teams are made up of the top players, regardless of
						conference.
					</p>
				</>
			),
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
			description: bySport({
				baseball: "",
				basketball: "Average number of possessions per 48 minutes.",
				football:
					"The time between plays is divided by this number. So higher value -> shorter time between plays. And lower value -> longer time between plays.",
				hockey:
					"The length of a possession is divided by this number. So higher value -> quicker shots. And lower value -> longer time between shots.",
			}),
			validator: value => {
				if (value <= 0) {
					throw new Error("Must be a positive number");
				}
			},
		},
		{
			category: "Game Simulation",
			key: "foulFactor",
			name: "Foul Ball Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The probability that a batted ball is foul is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "groundFactor",
			name: "Ground Ball Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The likelihood of ground balls is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "lineFactor",
			name: "Line Drive Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The likelihood of line drives is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "flyFactor",
			name: "Fly Ball Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The likelihood of fly balls drives is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "powerFactor",
			name: "Power Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The likelihood of hard line drives and deep fly balls is multiplied by this number.",
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
			description: isSport("basketball")
				? "The baseline steal percentage is multiplied by this number."
				: "The probability of a player attempting a steal is multiplied by this number.",
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
			name: `${isSport("football") ? "Penalty" : "Foul"} Rate Factor`,
			godModeRequired: "always",
			type: "float",
			description: bySport({
				baseball: undefined,
				basketball:
					"The baseline rates for shooting and non-shooting fouls are multiplied by this number.",
				football:
					"The baseline rate for penalties is multiplied by this number. Max is 10 because beyond that there is basically a penalty every play.",
				hockey: undefined,
			}),
			validator: value => {
				if (isSport("football") && value > 10) {
					throw new Error("Value cannot exceed 10");
				}
			},
		},
		{
			category: "Game Simulation",
			key: "passFactor",
			name: "Passing Tendency Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The probability of calling a passing play is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "rushYdsFactor",
			name: "Rushing Yards Factor",
			godModeRequired: "always",
			type: "float",
			description: "The baseline yards per rush is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "passYdsFactor",
			name: "Passing Yards Factor",
			godModeRequired: "always",
			type: "float",
			description: "The baseline yards per pass is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "completionFactor",
			name: "Completion Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The baseline pass completion percentage is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "scrambleFactor",
			name: "QB Scramble Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The probability of a quarterback scrambling on a passing play is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "sackFactor",
			name: "Sack Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The baseline sack probability is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "fumbleFactor",
			name: "Fumble Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The baseline fumble probability is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "intFactor",
			name: "Interception Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The baseline interception probability is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "fgAccuracyFactor",
			name: "FG Accuracy Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The baseline field goal accuracy percentage is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "fourthDownFactor",
			name: "4th Down Aggressiveness Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The probability to go for it on 4th down is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "onsideFactor",
			name: "Onside Kick Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The probability of doing an onside kick is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "onsideRecoveryFactor",
			name: "Onside Recovery Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The probability of the kicking team recovering an onside kick is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "throwOutFactor",
			name: "Throw Out Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The probability of the catcher successfully throwing out a stealing baserunner is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "strikeFactor",
			name: "Strike Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The probability of the pitcher throwing a strike is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "balkFactor",
			name: "Balk Factor",
			godModeRequired: "always",
			type: "float",
			description: "The probability of a balk is multipled by this number.",
		},
		{
			category: "Game Simulation",
			key: "wildPitchFactor",
			name: "Wild Pitch Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The probability of a wild pitch is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "passedBallFactor",
			name: "Passed Ball Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The probability of a passed ball is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "hitByPitchFactor",
			name: "Hit By Pitch Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The probability of the batter being hit by a pitch is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "swingFactor",
			name: "Swing Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The probability of the batter swinging at a pitch is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "contactFactor",
			name: "Contact Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The probability of a swing making contact is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "deflectionFactor",
			name: "Deflection Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The probability of the offense deflecting a shot is multiplied by this number",
		},
		{
			category: "Game Simulation",
			key: "saveFactor",
			name: "Save Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The save probability of each shot is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "assistFactor",
			name: "Assist Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The probability that a shot is assisted is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "hitFactor",
			name: "Hit Factor",
			godModeRequired: "always",
			type: "float",
			description: isSport("hockey")
				? "The probability of a hit happening is multiplied by this number."
				: "The probability that a ball in play is a hit is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "giveawayFactor",
			name: "Giveaway Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The probability of a giveaway happening is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "takeawayFactor",
			name: "Takeaway Factor",
			godModeRequired: "always",
			type: "float",
			description:
				"The probability of a takeaway happening is multiplied by this number.",
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
			key: "elamOvertime",
			name: "Overtime Only",
			type: "bool",
			descriptionLong: (
				<>
					If you enable this, then the "Minutes Left Trigger" setting doesn't do
					anything, and instead the overtime period of a tied game will be an
					untimed period played until a team scores "Target Points To Add"
					points.
				</>
			),
		},
		{
			category: "Elam Ending",
			key: "elamMinutes",
			name: "Minutes Left Trigger",
			godModeRequired: "always",
			type: "float",
			validator: (value, output) => {
				if (
					(output.elam || output.elamASG) &&
					!output.elamOvertime &&
					value > output.quarterLength
				) {
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
		{
			category: "UI",
			key: "fantasyPoints",
			name: "Fantasy Points",
			type: "string",
			values: [
				{ key: "standard", value: "Standard" },
				{ key: "ppr", value: "PPR" },
				{ key: "halfPpr", value: "Half PPR" },
			],
		},
		{
			category: "Game Simulation",
			key: "numPeriods",
			name: `Number of ${isSport("baseball") ? "Innings" : "Periods"} Per Game`,
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
			category: "UI",
			key: "numWatchColors",
			name: "# Watch List Colors",
			type: "int",
			description:
				"If you have more than one color, you can cycle through them by clicking a player's watch flag.",
			validator: value => {
				if (value < 1 || value > 8) {
					throw new Error("Value must be between 1 and 8");
				}
			},
		},
		{
			category: "Players",
			key: "goatFormula",
			name: "GOAT Formula",
			type: "string",
			description: "See Tools > Frivolities > GOAT Lab for details.",
			maxWidth: true,
		},
		{
			category: "Players",
			key: "goatSeasonFormula",
			name: "GOAT Season Formula",
			type: "string",
			description: "See Tools > Frivolities > GOAT Season for details.",
			maxWidth: true,
		},
		{
			category: "Game Simulation",
			key: "numPlayersOnCourt",
			name: `# Players On ${COURT}`,
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
		},
		{
			category: "All-Star",
			key: "allStarDunk",
			name: "Enable Dunk Contest",
			type: "bool",
		},
		{
			category: "All-Star",
			key: "numPlayersDunk",
			name: "# Players In Dunk Contest",
			type: "int",
			validator: value => {
				if (value <= 1) {
					throw new Error("Value must be greater than 2");
				}
			},
		},
		{
			category: "All-Star",
			key: "allStarThree",
			name: "Enable 3pt Contest",
			type: "bool",
		},
		{
			category: "All-Star",
			key: "numPlayersThree",
			name: "# Players In 3pt Contest",
			type: "int",
			validator: value => {
				if (value <= 1) {
					throw new Error("Value must be greater than 2");
				}
			},
		},
		{
			category: "Game Simulation",
			key: "dh",
			name: "Designated Hitter (DH)",
			godModeRequired: "existingLeagueOnly",
			type: "custom",
			descriptionLong: (
				<>
					<p>
						Enter <code>all</code> to make all conferences use a DH. Enter{" "}
						<code>none</code> to make no conferences use a DH. To have DH only
						for some conferences, enter a JSON array of integers containing the
						conference ID numbers of the conferences you want to have a DH. For
						example, enter <code>[0]</code> to make only the first conference
						have a DH.
					</p>
				</>
			),
			parse: value => {
				if (value === "all" || value === "none") {
					return value;
				}

				const parsed = JSON.parse(value) as unknown;
				if (!Array.isArray(parsed)) {
					throw new Error('Must be "all", "none", or array');
				}
				if (parsed.some(x => typeof x !== "number" || !Number.isInteger(x))) {
					throw new Error("Array can only contain integers");
				}

				return parsed;
			},
			stringify: value => {
				if (typeof value === "string") {
					return value;
				}

				return JSON.stringify(value);
			},
		},
	] as Setting[]
).filter(setting => !gameAttributesKeysOtherSports.has(setting.key as any));
