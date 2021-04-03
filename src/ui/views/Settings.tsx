/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import classNames from "classnames";
import groupBy from "lodash-es/groupBy";
import PropTypes from "prop-types";
import {
	Fragment,
	useState,
	ReactNode,
	ChangeEvent,
	FormEvent,
	useEffect,
} from "react";
import { HelpPopover } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import {
	confirm,
	localActions,
	logEvent,
	toWorker,
	helpers,
	useLocalShallow,
} from "../util";
import type { View } from "../../common/types";
import { AnimatePresence, motion } from "framer-motion";
import {
	COURT,
	DIFFICULTY,
	GAME_NAME,
	isSport,
	SPORT_HAS_REAL_PLAYERS,
	TIEBREAKERS,
	WEBSITE_ROOT,
} from "../../common";

const godModeRequiredMessage = "Enable God Mode to change this setting";

type Key =
	| "numGames"
	| "numPeriods"
	| "quarterLength"
	| "minRosterSize"
	| "maxRosterSize"
	| "numGamesPlayoffSeries"
	| "numPlayoffByes"
	| "draftType"
	| "numSeasonsFutureDraftPicks"
	| "draftAges"
	| "salaryCap"
	| "minPayroll"
	| "luxuryPayroll"
	| "luxuryTax"
	| "minContract"
	| "maxContract"
	| "minContractLength"
	| "maxContractLength"
	| "hardCap"
	| "budget"
	| "aiTradesFactor"
	| "playersRefuseToNegotiate"
	| "injuryRate"
	| "tragicDeathRate"
	| "brotherRate"
	| "sonRate"
	| "forceRetireAge"
	| "homeCourtAdvantage"
	| "rookieContractLengths"
	| "rookiesCanRefuse"
	| "allStarGame"
	| "foulRateFactor"
	| "foulsNeededToFoulOut"
	| "foulsUntilBonus"
	| "threePointers"
	| "pace"
	| "threePointTendencyFactor"
	| "threePointAccuracyFactor"
	| "twoPointAccuracyFactor"
	| "blockFactor"
	| "stealFactor"
	| "turnoverFactor"
	| "orbFactor"
	| "challengeNoDraftPicks"
	| "challengeNoFreeAgents"
	| "challengeNoRatings"
	| "challengeNoTrades"
	| "challengeLoseBestPlayer"
	| "challengeFiredLuxuryTax"
	| "challengeFiredMissPlayoffs"
	| "challengeThanosMode"
	| "realPlayerDeterminism"
	| "repeatSeason"
	| "ties"
	| "otl"
	| "spectator"
	| "elam"
	| "elamASG"
	| "elamMinutes"
	| "elamPoints"
	| "playerMoodTraits"
	| "numPlayersOnCourt"
	| "numDraftRounds"
	| "tradeDeadline"
	| "autoDeleteOldBoxScores"
	| "difficulty"
	| "stopOnInjuryGames"
	| "stopOnInjury"
	| "aiJerseyRetirement"
	| "tiebreakers"
	| "pointsFormula";

type Category =
	| "General"
	| "Season"
	| "Standings"
	| "Team"
	| "Draft"
	| "Finances"
	| "Contracts"
	| "Events"
	| "Game Simulation"
	| "Elam Ending"
	| "Challenge Modes"
	| "Game Modes"
	| "Player Development";

type FieldType =
	| "bool"
	| "float"
	| "float1000"
	| "floatOrNull"
	| "int"
	| "jsonString"
	| "string"
	| "rangePercent"
	| "floatValuesOrCustom";

type Decoration = "currency" | "percent";

type Values = {
	key: string;
	value: string;
}[];

export const descriptions = {
	challengeLoseBestPlayer:
		"At the end of the playoffs every season, the best player on your team will either retire (if real player) or die a tragic death (if random player).",
	challengeNoDraftPicks:
		"Your team will not be given any draft picks. You can still trade with other teams to acquire their picks.",
	challengeNoFreeAgents:
		"You are not allowed to sign free agents, except to minimum contracts.",
	challengeThanosMode:
		"At the end of the playoffs, there's a 20% chance of half the league either dying (if random player) or retiring (if real player). After each event, it can't happen again until three years later.",
	difficulty:
		"Increasing difficulty makes AI teams more reluctant to trade with you, makes players less likely to sign with you, and makes it harder to turn a profit.",
	realPlayerDeterminism:
		"By default, BBGM's player development algorithm does not take into account what we know about a real player's future performance. That corresponds to 0% in this setting. Increase determinism to 100% and real player ratings will be based entirely on their real life development curve. Anything in between is a mix.",
	repeatSeason:
		"Next season will start immediately after the playoffs, with the same exact players and rosters as the previous season. No player development, no persistent transactions.",
};

export const options: {
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
		props: View<"settings">,
	) => void | Promise<void>;
	customForm?: true;
	hidden?: true;
	maxWidth?: true;

	// Short, one line, shown by default
	description?: ReactNode;

	// Longer than one line, hidden by default
	descriptionLong?: ReactNode;
}[] = [
	{
		category: "Season",
		key: "numGames",
		name: "# Games Per Season",
		godModeRequired: "always",
		type: "int",
		description: "This will only apply to seasons that have not started yet.",
	},
	{
		category: "Team",
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
		category: "Team",
		key: "maxRosterSize",
		name: "Max Roster Size",
		godModeRequired: "always",
		type: "int",
	},
	{
		category: "Season",
		key: "numGamesPlayoffSeries",
		name: "# Playoff Games",
		godModeRequired: "existingLeagueOnly",
		descriptionLong: (
			<>
				Specify the number of games in each round. You must enter a valid JSON
				array of integers. For example, enter <code>[5,7,1]</code> for a 5 game
				first round series, a 7 game second round series, and a single
				winner-takes-all final game.
			</>
		),
		type: "jsonString",
		validator: (value, output, props) => {
			if (!Array.isArray(value)) {
				throw new Error("Must be an array");
			}
			for (const num of value) {
				if (!Number.isInteger(num)) {
					throw new Error("Array must contain only integers");
				}
			}

			const numRounds = value.length;
			helpers.validateRoundsByes(
				numRounds,
				output.numPlayoffByes,
				props.numActiveTeams,
			);
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
		category: "Season",
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
		name: "Age of draft prospects",
		godModeRequired: "existingLeagueOnly",
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
		category: "Contracts",
		key: "minContract",
		name: "Minimum Contract",
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
		name: "Minimum Contract Length",
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
		name: "Maximum Contract Length",
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
		key: "hardCap",
		name: "Hard Cap",
		godModeRequired: "always",
		type: "bool",
		descriptionLong: (
			<>
				<p>
					If this is enabled, then you can not exceed the salary cap to sign
					draft picks or re-sign players (like the{" "}
					<a
						href="https://en.wikipedia.org/wiki/NBA_salary_cap#Larry_Bird_exception"
						target="_blank"
						rel="noopener noreferrer"
					>
						Larry Bird exception
					</a>
					) and you can not make trades that result in either team being over
					the salary cap.
				</p>
				<p>
					It is not really a strict hard cap, though. You can still go over the
					cap to sign free agents to minimum contracts, which is to guarantee
					that you never get stuck without enough players.
				</p>
				<p>This also disables the luxury tax.</p>
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
		name: "Trades Between AI Teams Factor",
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
		category: "Events",
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
		godModeRequired: "existingLeagueOnly",
		type: "int",
		description:
			"Players at or above this age will retire at the end of the season. A number lower than the maximum draft age will disable this setting.",
	},
	{
		category: "Contracts",
		key: "rookieContractLengths",
		name: "Rookie Contract Lengths",
		godModeRequired: "always",
		descriptionLong: (
			<>
				<p>
					Specify the length of rookie contracts. Different rounds can have
					different lengths. The default is for first round picks to have 3 year
					contracts and second round picks to have 2 year contracts, which looks
					like: <code>[3,2]</code>. If you want every rookie contract to have
					the same length regardless of round, just set one number like{" "}
					<code>[2]</code> - this works because it uses the last value specified
					here for any rounds where you don't define contract length.
				</p>
				<p>
					This only applies if the <b>hard cap option is disabled</b>.
				</p>
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
		key: "rookiesCanRefuse",
		name: "Rookies Can Refuse To Negotiate",
		godModeRequired: "existingLeagueOnly",
		descriptionLong: (
			<>
				<p>
					{GAME_NAME} has no concept of "restricted free agency" like the NBA
					does, so draft picks can refuse to negotiate with you after their
					rookie contracts expire. This option can force every player to be
					willing to negotiate when his rookie contract expires, which can
					somewhat make up for restricted free agency not existing.
				</p>
				<p>
					This only applies if the <b>hard cap option is disabled</b>.
				</p>
			</>
		),
		type: "bool",
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
		key: "playerMoodTraits",
		name: "Player Mood Traits",
		godModeRequired: "existingLeagueOnly",
		type: "bool",
		description: (
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
		description: descriptions.challengeNoDraftPicks,
	},
	{
		category: "Challenge Modes",
		key: "challengeNoFreeAgents",
		name: "No Free Agents",
		type: "bool",
		description: descriptions.challengeNoFreeAgents,
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
		description: descriptions.challengeLoseBestPlayer,
	},
	{
		category: "Challenge Modes",
		key: "challengeFiredLuxuryTax",
		name: "You're Fired If You Pay The Luxury Tax",
		type: "bool",
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
		description: descriptions.challengeThanosMode,
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
		category: "Season",
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
];

if (isSport("basketball")) {
	options.push(
		{
			category: "Season",
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
			name: "# Fouls Needed to Foul Out",
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
			name: "# of Fouls Until Teams Enter Bonus",
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
			name: "Offensive Rebound Tendency Factor",
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
			category: "Player Development",
			key: "realPlayerDeterminism",
			name: "Real Player Determinism",
			godModeRequired: "always",
			type: "rangePercent",
			descriptionLong: (
				<>
					<p>{descriptions.realPlayerDeterminism}</p>
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
}

options.push(
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
		description: `${descriptions.repeatSeason} Groundhog Day can be enabled at any point in the season prior to the
				draft.`,
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
					<a href="/account">Achievements</a>. This persists even if you later
					switch to a harder difficulty.
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
		category: "General",
		key: "stopOnInjuryGames",
		name: "Stop On Injury Longer Than",
		type: "int",
		description:
			"This will stop game simulation if one of your players is injured for more than N games. In auto play mode (Tools > Auto Play Seasons), this has no effect.",
		customForm: true,
	},
	{
		category: "General",
		key: "stopOnInjury",
		name: "Stop On Injury Longer Than",
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
);

if (isSport("basketball")) {
	options.push({
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
}

// See play-style-adjustments in bbgm-rosters
const gameSimPresets = isSport("basketball")
	? {
			2020: {
				pace: 100.2,
				threePointers: true,
				threePointTendencyFactor: 1,
				threePointAccuracyFactor: 1,
				twoPointAccuracyFactor: 1,
				blockFactor: 1,
				stealFactor: 1.09,
				turnoverFactor: 1,
				orbFactor: 1,
			},
			2019: {
				pace: 100,
				threePointers: true,
				threePointTendencyFactor: 0.946,
				threePointAccuracyFactor: 0.994,
				twoPointAccuracyFactor: 1,
				blockFactor: 1,
				stealFactor: 1.1,
				turnoverFactor: 1,
				orbFactor: 1,
			},
			2018: {
				pace: 97.3,
				threePointers: true,
				threePointTendencyFactor: 0.881,
				threePointAccuracyFactor: 1.014,
				twoPointAccuracyFactor: 1,
				blockFactor: 1,
				stealFactor: 1.14,
				turnoverFactor: 1,
				orbFactor: 1,
			},
			2017: {
				pace: 96.4,
				threePointers: true,
				threePointTendencyFactor: 0.827,
				threePointAccuracyFactor: 1.003,
				twoPointAccuracyFactor: 1,
				blockFactor: 1,
				stealFactor: 1.16,
				turnoverFactor: 1,
				orbFactor: 1,
			},
			2016: {
				pace: 95.8,
				threePointers: true,
				threePointTendencyFactor: 0.744,
				threePointAccuracyFactor: 0.992,
				twoPointAccuracyFactor: 1,
				blockFactor: 1.1,
				stealFactor: 1.16,
				turnoverFactor: 1.01,
				orbFactor: 1,
			},
			2015: {
				pace: 93.9,
				threePointers: true,
				threePointTendencyFactor: 0.705,
				threePointAccuracyFactor: 0.98,
				twoPointAccuracyFactor: 1,
				blockFactor: 1.1,
				stealFactor: 1.15,
				turnoverFactor: 1.02,
				orbFactor: 1.024375,
			},
			2014: {
				pace: 93.9,
				threePointers: true,
				threePointTendencyFactor: 0.676,
				threePointAccuracyFactor: 1.008,
				twoPointAccuracyFactor: 1,
				blockFactor: 1.1,
				stealFactor: 1.13,
				turnoverFactor: 1.03,
				orbFactor: 1.024375,
			},
			2013: {
				pace: 92,
				threePointers: true,
				threePointTendencyFactor: 0.64,
				threePointAccuracyFactor: 1.006,
				twoPointAccuracyFactor: 0.991,
				blockFactor: 1.1,
				stealFactor: 1.15,
				turnoverFactor: 1.04,
				orbFactor: 1.041625,
			},
			2012: {
				pace: 91.3,
				threePointers: true,
				threePointTendencyFactor: 0.595,
				threePointAccuracyFactor: 0.978,
				twoPointAccuracyFactor: 0.978,
				blockFactor: 1.1,
				stealFactor: 1.14,
				turnoverFactor: 1.04,
				orbFactor: 1.0555,
			},
			2011: {
				pace: 92.1,
				threePointers: true,
				threePointTendencyFactor: 0.577,
				threePointAccuracyFactor: 1.003,
				twoPointAccuracyFactor: 0.999,
				blockFactor: 1.1,
				stealFactor: 1.08,
				turnoverFactor: 1.03,
				orbFactor: 1.034875,
			},
			2010: {
				pace: 92.7,
				threePointers: true,
				threePointTendencyFactor: 0.577,
				threePointAccuracyFactor: 0.994,
				twoPointAccuracyFactor: 1.009,
				blockFactor: 1.1,
				stealFactor: 1.09,
				turnoverFactor: 1.02,
				orbFactor: 1.031125,
			},
			2009: {
				pace: 91.7,
				threePointers: true,
				threePointTendencyFactor: 0.583,
				threePointAccuracyFactor: 1.028,
				twoPointAccuracyFactor: 0.995,
				blockFactor: 1.1,
				stealFactor: 1.1,
				turnoverFactor: 1.02,
				orbFactor: 1.041625,
			},
			2008: {
				pace: 92.4,
				threePointers: true,
				threePointTendencyFactor: 0.58,
				threePointAccuracyFactor: 1.014,
				twoPointAccuracyFactor: 0.993,
				blockFactor: 1.1,
				stealFactor: 1.1,
				turnoverFactor: 1.02,
				orbFactor: 1.041625,
			},
			2007: {
				pace: 91.9,
				threePointers: true,
				threePointTendencyFactor: 0.545,
				threePointAccuracyFactor: 1.003,
				twoPointAccuracyFactor: 0.995,
				blockFactor: 1.1,
				stealFactor: 1.02,
				turnoverFactor: 1.06,
				orbFactor: 1.041625,
			},
			2006: {
				pace: 90.5,
				threePointers: true,
				threePointTendencyFactor: 0.521,
				threePointAccuracyFactor: 1.003,
				twoPointAccuracyFactor: 0.98,
				blockFactor: 1.1,
				stealFactor: 1.09,
				turnoverFactor: 1.04,
				orbFactor: 1.04875,
			},
			2005: {
				pace: 90.9,
				threePointers: true,
				threePointTendencyFactor: 0.512,
				threePointAccuracyFactor: 0.997,
				twoPointAccuracyFactor: 0.964,
				blockFactor: 1.1,
				stealFactor: 1.14,
				turnoverFactor: 1.04,
				orbFactor: 1.079875,
			},
			2004: {
				pace: 90.1,
				threePointers: true,
				threePointTendencyFactor: 0.488,
				threePointAccuracyFactor: 0.972,
				twoPointAccuracyFactor: 0.943,
				blockFactor: 1.2,
				stealFactor: 1.16,
				turnoverFactor: 1.07,
				orbFactor: 1.086625,
			},
			2003: {
				pace: 91,
				threePointers: true,
				threePointTendencyFactor: 0.476,
				threePointAccuracyFactor: 0.978,
				twoPointAccuracyFactor: 0.949,
				blockFactor: 1.2,
				stealFactor: 1.16,
				turnoverFactor: 1.06,
				orbFactor: 1.079875,
			},
			2002: {
				pace: 90.7,
				threePointers: true,
				threePointTendencyFactor: 0.479,
				threePointAccuracyFactor: 0.992,
				twoPointAccuracyFactor: 0.954,
				blockFactor: 1.2,
				stealFactor: 1.17,
				turnoverFactor: 1.04,
				orbFactor: 1.090375,
			},
			2001: {
				pace: 91.3,
				threePointers: true,
				threePointTendencyFactor: 0.443,
				threePointAccuracyFactor: 0.992,
				twoPointAccuracyFactor: 0.946,
				blockFactor: 1.2,
				stealFactor: 1.15,
				turnoverFactor: 1.06,
				orbFactor: 1.0765,
			},
			2000: {
				pace: 93.1,
				threePointers: true,
				threePointTendencyFactor: 0.435,
				threePointAccuracyFactor: 0.989,
				twoPointAccuracyFactor: 0.96,
				blockFactor: 1.2,
				stealFactor: 1.17,
				turnoverFactor: 1.07,
				orbFactor: 1.086625,
			},
			1999: {
				pace: 88.9,
				threePointers: true,
				threePointTendencyFactor: 0.438,
				threePointAccuracyFactor: 0.95,
				twoPointAccuracyFactor: 0.937,
				blockFactor: 1.2,
				stealFactor: 1.17,
				turnoverFactor: 1.09,
				orbFactor: 1.111,
			},
			1998: {
				pace: 90.3,
				threePointers: true,
				threePointTendencyFactor: 0.417,
				threePointAccuracyFactor: 0.969,
				twoPointAccuracyFactor: 0.965,
				blockFactor: 1.2,
				stealFactor: 1.23,
				turnoverFactor: 1.09,
				orbFactor: 1.1215,
			},
			1997: {
				pace: 90.1,
				threePointers: true,
				threePointTendencyFactor: 0.551,
				threePointAccuracyFactor: 1.008,
				twoPointAccuracyFactor: 0.985,
				blockFactor: 1.2,
				stealFactor: 1.21,
				turnoverFactor: 1.09,
				orbFactor: 1.107625,
			},
			1996: {
				pace: 91.8,
				threePointers: true,
				threePointTendencyFactor: 0.518,
				threePointAccuracyFactor: 1.028,
				twoPointAccuracyFactor: 0.996,
				blockFactor: 1.2,
				stealFactor: 1.15,
				turnoverFactor: 1.09,
				orbFactor: 1.100875,
			},
			1995: {
				pace: 92.9,
				threePointers: true,
				threePointTendencyFactor: 0.485,
				threePointAccuracyFactor: 1.006,
				twoPointAccuracyFactor: 1.007,
				blockFactor: 1.2,
				stealFactor: 1.18,
				turnoverFactor: 1.09,
				orbFactor: 1.107625,
			},
			1994: {
				pace: 95.1,
				threePointers: true,
				threePointTendencyFactor: 0.31,
				threePointAccuracyFactor: 0.933,
				twoPointAccuracyFactor: 0.991,
				blockFactor: 1.2,
				stealFactor: 1.25,
				turnoverFactor: 1.07,
				orbFactor: 1.128625,
			},
			1993: {
				pace: 96.8,
				threePointers: true,
				threePointTendencyFactor: 0.274,
				threePointAccuracyFactor: 0.941,
				twoPointAccuracyFactor: 1.003,
				blockFactor: 1.1,
				stealFactor: 1.23,
				turnoverFactor: 1.06,
				orbFactor: 1.118125,
			},
			1992: {
				pace: 96.6,
				threePointers: true,
				threePointTendencyFactor: 0.232,
				threePointAccuracyFactor: 0.927,
				twoPointAccuracyFactor: 0.997,
				blockFactor: 1.1,
				stealFactor: 1.21,
				turnoverFactor: 1.06,
				orbFactor: 1.135375,
			},
			1991: {
				pace: 97.8,
				threePointers: true,
				threePointTendencyFactor: 0.214,
				threePointAccuracyFactor: 0.896,
				twoPointAccuracyFactor: 1.001,
				blockFactor: 1.1,
				stealFactor: 1.2,
				turnoverFactor: 1.06,
				orbFactor: 1.118125,
			},
			1990: {
				pace: 98.3,
				threePointers: true,
				threePointTendencyFactor: 0.199,
				threePointAccuracyFactor: 0.927,
				twoPointAccuracyFactor: 1.001,
				blockFactor: 1.1,
				stealFactor: 1.16,
				turnoverFactor: 1.06,
				orbFactor: 1.111,
			},
			1989: {
				pace: 100.6,
				threePointers: true,
				threePointTendencyFactor: 0.193,
				threePointAccuracyFactor: 0.905,
				twoPointAccuracyFactor: 1.004,
				blockFactor: 1.1,
				stealFactor: 1.2,
				turnoverFactor: 1.09,
				orbFactor: 1.1215,
			},
			1988: {
				pace: 99.6,
				threePointers: true,
				threePointTendencyFactor: 0.149,
				threePointAccuracyFactor: 0.885,
				twoPointAccuracyFactor: 1.005,
				blockFactor: 1.1,
				stealFactor: 1.12,
				turnoverFactor: 1.07,
				orbFactor: 1.118125,
			},
			1987: {
				pace: 100.8,
				threePointers: true,
				threePointTendencyFactor: 0.14,
				threePointAccuracyFactor: 0.843,
				twoPointAccuracyFactor: 1.006,
				blockFactor: 1.1,
				stealFactor: 1.08,
				turnoverFactor: 1.07,
				orbFactor: 1.128625,
			},
			1986: {
				pace: 102.1,
				threePointers: true,
				threePointTendencyFactor: 0.095,
				threePointAccuracyFactor: 0.79,
				twoPointAccuracyFactor: 1.016,
				blockFactor: 1.1,
				stealFactor: 1.06,
				turnoverFactor: 1.1,
				orbFactor: 1.10425,
			},
			1985: {
				pace: 102.1,
				threePointers: true,
				threePointTendencyFactor: 0.092,
				threePointAccuracyFactor: 0.79,
				twoPointAccuracyFactor: 1.023,
				blockFactor: 1.1,
				stealFactor: 1.03,
				turnoverFactor: 1.1,
				orbFactor: 1.107625,
			},
			1984: {
				pace: 101.4,
				threePointers: true,
				threePointTendencyFactor: 0.068,
				threePointAccuracyFactor: 0.7,
				twoPointAccuracyFactor: 1.023,
				blockFactor: 1.1,
				stealFactor: 1.03,
				turnoverFactor: 1.1,
				orbFactor: 1.107625,
			},
			1983: {
				pace: 103.1,
				threePointers: true,
				threePointTendencyFactor: 0.065,
				threePointAccuracyFactor: 0.667,
				twoPointAccuracyFactor: 1.009,
				blockFactor: 1.1,
				stealFactor: 1.01,
				turnoverFactor: 1.13,
				orbFactor: 1.1215,
			},
			1982: {
				pace: 100.9,
				threePointers: true,
				threePointTendencyFactor: 0.065,
				threePointAccuracyFactor: 0.734,
				twoPointAccuracyFactor: 1.02,
				blockFactor: 1.1,
				stealFactor: 1,
				turnoverFactor: 1.1,
				orbFactor: 1.11475,
			},
			1981: {
				pace: 101.8,
				threePointers: true,
				threePointTendencyFactor: 0.06,
				threePointAccuracyFactor: 0.686,
				twoPointAccuracyFactor: 1.008,
				blockFactor: 1.1,
				stealFactor: 1.05,
				turnoverFactor: 1.13,
				orbFactor: 1.118125,
			},
			1980: {
				pace: 103.1,
				threePointers: true,
				threePointTendencyFactor: 0.08,
				threePointAccuracyFactor: 0.784,
				twoPointAccuracyFactor: 1,
				blockFactor: 1.1,
				stealFactor: 1.08,
				turnoverFactor: 1.13,
				orbFactor: 1.128625,
			},
			1979: {
				pace: 105.8,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.99575,
				blockFactor: 1.1,
				stealFactor: 1,
				turnoverFactor: 1.14,
				orbFactor: 1.111,
			},
			1978: {
				pace: 106.7,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.9762,
				blockFactor: 1,
				stealFactor: 1.07,
				turnoverFactor: 1.14,
				orbFactor: 1.107625,
			},
			1977: {
				pace: 106.5,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.9694,
				blockFactor: 1,
				stealFactor: 1.03,
				turnoverFactor: 1.16,
				orbFactor: 1.111,
			},
			1976: {
				pace: 105.5,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.9575,
				blockFactor: 1,
				stealFactor: 0.98,
				turnoverFactor: 1.14,
				orbFactor: 1.09375,
			},
			1975: {
				pace: 104.5,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.9558,
				blockFactor: 1,
				stealFactor: 0.94,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1974: {
				pace: 107.8,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.95835,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.097125,
			},
			1973: {
				pace: 110.385,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.9541,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1972: {
				pace: 109.785,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.9507,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1971: {
				pace: 112.988,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.9507,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1970: {
				pace: 114.811,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.96005,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1969: {
				pace: 114.571,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.9439,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1968: {
				pace: 117.058,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.95325,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1967: {
				pace: 119.602,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.9439,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1966: {
				pace: 118.921,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.92945,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1965: {
				pace: 115.617,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.91755,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1964: {
				pace: 114.689,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.92945,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1963: {
				pace: 117.316,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.9439,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1962: {
				pace: 125.168,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.9269,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1961: {
				pace: 127.219,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.9065,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1960: {
				pace: 126.113,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.898,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1959: {
				pace: 118.68,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.8725,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1958: {
				pace: 118.564,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.8521,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1957: {
				pace: 109.736,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.84615,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1956: {
				pace: 106.17,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.85805,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1955: {
				pace: 101,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.8455,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1954: {
				pace: 93,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.8333,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1953: {
				pace: 95,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.83,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1952: {
				pace: 97,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.8,
				twoPointAccuracyFactor: 0.8232,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1951: {
				pace: 99,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.7,
				twoPointAccuracyFactor: 0.81,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1950: {
				pace: 99,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.7,
				twoPointAccuracyFactor: 0.79,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1949: {
				pace: 104,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.7,
				twoPointAccuracyFactor: 0.77,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1948: {
				pace: 108,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.6,
				twoPointAccuracyFactor: 0.71,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
			1947: {
				pace: 104,
				threePointers: false,
				threePointTendencyFactor: 0.025,
				threePointAccuracyFactor: 0.6,
				twoPointAccuracyFactor: 0.7,
				blockFactor: 1,
				stealFactor: 0.9,
				turnoverFactor: 1.15,
				orbFactor: 1.09375,
			},
	  }
	: undefined;

const encodeDecodeFunctions = {
	bool: {
		stringify: (value: boolean) => String(value),
		parse: (value: string) => value === "true",
	},
	custom: {},
	float: {
		stringify: (value: number) => String(value),
		parse: (value: string) => {
			const parsed = parseFloat(value);
			if (Number.isNaN(parsed)) {
				throw new Error(`"${value}" is not a valid number`);
			}
			return parsed;
		},
	},
	float1000: {
		stringify: (value: number) => String(value / 1000),
		parse: (value: string) => {
			const parsed = parseFloat(value) * 1000;
			if (Number.isNaN(parsed)) {
				throw new Error(`"${value}" is not a valid number`);
			}
			return parsed;
		},
	},
	floatOrNull: {
		stringify: (value: number | null) => (value === null ? "" : String(value)),
		parse: (value: string) => {
			if (value === "") {
				return null;
			}

			const parsed = parseFloat(value);
			if (Number.isNaN(parsed)) {
				throw new Error(`"${value}" is not a valid number`);
			}
			return parsed;
		},
	},
	int: {
		stringify: (value: number) => String(value),
		parse: (value: string) => {
			const parsed = parseInt(value, 10);
			if (Number.isNaN(parsed)) {
				throw new Error(`"${value}" is not a valid integer`);
			}
			return parsed;
		},
	},
	string: {},
	jsonString: {
		stringify: (value: any) => JSON.stringify(value),
		parse: (value: string) => JSON.parse(value),
	},
	rangePercent: {
		stringify: (value: number) => String(value),
		parse: (value: string) => {
			const parsed = parseFloat(value);
			if (Number.isNaN(parsed)) {
				throw new Error(`"${value}" is not a valid number`);
			}
			return parsed;
		},
	},
	floatValuesOrCustom: {
		stringify: (value: number, values: Values) => {
			const stringValue = String(value);
			return JSON.stringify([
				values.every(({ key }) => key !== stringValue),
				stringValue,
			]);
		},
		parse: (value: string) => {
			const parts = JSON.parse(value);
			const numberPart = parseFloat(parts[1]);
			if (Number.isNaN(numberPart)) {
				throw new Error(`"${numberPart}" is not a valid number`);
			}
			return numberPart;
		},
	},
};

const groupedOptions = groupBy(options, "category");

// Specified order
const categories: {
	name: Category;
	helpText?: ReactNode;
}[] = [
	{
		name: "General",
	},
	{
		name: "Season",
	},
	{
		name: "Standings",
	},
	{
		name: "Team",
	},
	{
		name: "Draft",
	},
	{
		name: "Finances",
	},
	{
		name: "Contracts",
	},
	{
		name: "Events",
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
		name: "Challenge Modes",
	},
	{
		name: "Game Modes",
	},
	{
		name: "Player Development",
	},
];

const inputStyle = {
	width: 150,
};

const Input = ({
	decoration,
	disabled,
	id,
	maxWidth,
	onChange,
	type,
	value,
	values,
}: {
	decoration?: Decoration;
	disabled?: boolean;
	id: string;
	maxWidth?: true;
	name: string;
	onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
	type: FieldType;
	value: string;
	values?: Values;
}) => {
	const title = disabled ? godModeRequiredMessage : undefined;
	const commonProps = {
		className: "form-control",
		disabled,
		title,
		id,
		onChange,
		style:
			!decoration &&
			type !== "rangePercent" &&
			type !== "floatValuesOrCustom" &&
			!maxWidth
				? inputStyle
				: undefined,
		value,
	};

	let inputElement;
	if (type === "bool") {
		const checked = value === "true";
		const switchTitle = title ?? (checked ? "Enabled" : "Disabled");
		inputElement = (
			<div className="custom-control custom-switch" title={switchTitle}>
				<input
					type="checkbox"
					className="custom-control-input"
					disabled={disabled}
					checked={checked}
					onChange={onChange}
					id={id}
				/>
				<label className="custom-control-label" htmlFor={id}></label>
			</div>
		);
	} else if (type === "rangePercent") {
		inputElement = (
			<div className="d-flex" style={inputStyle}>
				<div className="text-right mr-1" style={{ minWidth: 38 }}>
					{Math.round(parseFloat(value) * 100)}%
				</div>
				<div>
					<input
						type="range"
						{...commonProps}
						className="form-control-range"
						min="0"
						max="1"
						step="0.05"
					/>
				</div>
			</div>
		);
	} else if (values) {
		if (type === "floatValuesOrCustom") {
			const parsed = JSON.parse(value);
			const selectValue =
				parsed[0] || values.every(({ key }) => key !== parsed[1])
					? "custom"
					: parsed[1];
			inputElement = (
				<div className="input-group" style={inputStyle}>
					<select
						{...commonProps}
						className="form-control"
						value={selectValue}
						style={{ width: 60 }}
					>
						{values.map(({ key, value }) => (
							<option key={key} value={key}>
								{value}
							</option>
						))}
						<option value="custom">Custom</option>
					</select>
					<input
						type="text"
						className="form-control"
						disabled={selectValue !== "custom"}
						onChange={onChange}
						value={parsed[1]}
					/>
				</div>
			);
		} else {
			inputElement = (
				<select {...commonProps}>
					{values.map(({ key, value }) => (
						<option key={key} value={key}>
							{value}
						</option>
					))}
				</select>
			);
		}
	} else {
		inputElement = <input type="text" {...commonProps} />;
	}

	if (decoration === "currency") {
		return (
			<div className="input-group" style={inputStyle}>
				<div className="input-group-prepend">
					<div className="input-group-text">$</div>
				</div>
				{inputElement}
				<div className="input-group-append">
					<div className="input-group-text">M</div>
				</div>
			</div>
		);
	}

	if (decoration === "percent") {
		return (
			<div className="input-group" style={inputStyle}>
				{inputElement}
				<div className="input-group-append">
					<div className="input-group-text">%</div>
				</div>
			</div>
		);
	}

	return inputElement;
};

Input.propTypes = {
	decoration: PropTypes.oneOf(["currency", "percent"]),
	disabled: PropTypes.bool,
	onChange: PropTypes.func.isRequired,
	type: PropTypes.string.isRequired,
	value: PropTypes.string.isRequired,
	values: PropTypes.array,
};

const Option = ({
	id,
	disabled,
	name,
	description,
	descriptionLong,
	decoration,
	maxWidth,
	onChange,
	type,
	value,
	values,
	customForm,
}: {
	id: string;
	disabled: boolean;
	name: string;
	description?: ReactNode;
	descriptionLong?: ReactNode;
	decoration?: Decoration;
	maxWidth?: true;
	onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
	type: FieldType;
	value: string;
	values?: Values;
	customForm?: ReactNode;
}) => {
	const [showDescriptionLong, setShowDescriptionLong] = useState(false);

	return (
		<>
			<div className="d-flex align-items-center" style={{ minHeight: 33 }}>
				<div className="mr-auto text-nowrap">
					<label
						className="mb-0"
						htmlFor={id}
						onClick={event => {
							// Don't toggle on label click, too confusing
							if (type === "bool") {
								event.preventDefault();
							}
						}}
					>
						{disabled ? (
							<span
								className="legend-square god-mode mr-1"
								title={godModeRequiredMessage}
							/>
						) : null}
						{name}
					</label>
					{descriptionLong ? (
						<span
							className="ml-1 glyphicon glyphicon-question-sign help-icon"
							onClick={() => {
								setShowDescriptionLong(show => !show);
							}}
						/>
					) : null}
				</div>
				<div className={classNames("ml-5", maxWidth ? "w-100" : undefined)}>
					{customForm ? (
						customForm
					) : (
						<Input
							type={type}
							disabled={disabled}
							id={id}
							maxWidth={maxWidth}
							name={name}
							onChange={onChange}
							value={value}
							values={values}
							decoration={decoration}
						/>
					)}
				</div>
			</div>
			{description ? (
				<div className="text-muted settings-description mt-1">
					{description}
				</div>
			) : null}
			<AnimatePresence initial={false}>
				{showDescriptionLong ? (
					<motion.div
						initial="collapsed"
						animate="open"
						exit="collapsed"
						variants={{
							open: { opacity: 1, height: "auto" },
							collapsed: { opacity: 0, height: 0 },
						}}
						transition={{
							duration: 0.3,
							type: "tween",
						}}
						className="text-muted settings-description mt-1"
					>
						{descriptionLong}
					</motion.div>
				) : null}
			</AnimatePresence>
		</>
	);
};

const GodModeSettingsButton = ({
	children,
	className,
	godMode,
	onClick,
}: {
	children: any;
	className?: string;
	godMode: boolean;
	onClick: () => void;
}) => {
	console.log("GodModeSettingsButton", children, godMode, className);
	if (godMode) {
		return null;
	}

	return (
		<button
			type="button"
			className={classNames("btn btn-secondary", className)}
			onClick={onClick}
		>
			{children}
		</button>
	);
};

const Settings = (props: View<"settings">) => {
	const { godMode, godModeInPast } = props;

	useTitleBar({ title: "League Settings" });

	const [showGodModeSettings, setShowGodModeSettings] = useState(false);

	useEffect(() => {
		localActions.update({
			stickyFormButtons: true,
		});

		return () => {
			localActions.update({
				stickyFormButtons: false,
			});
		};
	});

	const { stickyFooterAd } = useLocalShallow(state => ({
		stickyFooterAd: state.stickyFooterAd,
	}));

	const handleGodModeToggle = async () => {
		let proceed: any = true;
		if (!godMode && !godModeInPast) {
			proceed = await confirm(
				"God Mode enables tons of customization features, including many of the settings found here. But if you ever enable God Mode in a league, you will not be awarded any achievements in that league, even if you disable God Mode.",
				{
					okText: "Enable God Mode",
				},
			);
		}

		if (proceed) {
			const attrs: {
				godMode: boolean;
				godModeInPast?: true;
			} = { godMode: !godMode };

			if (attrs.godMode) {
				attrs.godModeInPast = true;
			}

			await toWorker("main", "updateGameAttributes", attrs);
			localActions.update({ godMode: attrs.godMode });
		}
	};

	const [submitting, setSubmitting] = useState(false);
	const [gameSimPreset, setGameSimPreset] = useState("default");
	const [state, setState] = useState<Record<Key, string>>(() => {
		// @ts-ignore
		const initialState: Record<Key, string> = {};
		for (const { key, type, values } of options) {
			const value = props[key];

			// https://github.com/microsoft/TypeScript/issues/21732
			// @ts-ignore
			const stringify = encodeDecodeFunctions[type].stringify;

			initialState[key] = stringify ? stringify(value, values) : value;
		}
		return initialState;
	});

	const handleChange = (name: Key, type: FieldType) => (
		event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		let value: string;
		if (type === "bool") {
			value = String((event.target as any).checked);
		} else if (type === "floatValuesOrCustom") {
			if (event.target.value === "custom") {
				value = JSON.stringify([true, JSON.parse(state[name])[1]]);
			} else {
				value = JSON.stringify([false, event.target.value]);
			}
		} else {
			value = event.target.value;
		}

		setState(prevState => ({
			...prevState,
			[name]: value,
		}));

		if (gameSimPresets && Object.keys(gameSimPresets[2020]).includes(name)) {
			setGameSimPreset("default");
		}
	};

	const handleFormSubmit = async (event: FormEvent) => {
		event.preventDefault();
		setSubmitting(true);

		const output: Partial<Record<Key, any>> = {};
		for (const option of options) {
			const { key, name, type } = option;
			const value = state[key];

			// https://github.com/microsoft/TypeScript/issues/21732
			// @ts-ignore
			const parse = encodeDecodeFunctions[type].parse;

			try {
				output[key] = parse ? parse(value) : value;
			} catch (error) {
				setSubmitting(false);
				logEvent({
					type: "error",
					text: `${name}: ${error.message}`,
					saveToDb: false,
					persistent: true,
				});
				return;
			}
		}

		// Run validation functions at the end, so all values are available
		for (const option of options) {
			const { key, name, validator } = option;
			try {
				if (validator) {
					await validator(output[key], output, props);
				}
			} catch (error) {
				setSubmitting(false);
				logEvent({
					type: "error",
					text: `${name}: ${error.message}`,
					saveToDb: false,
					persistent: true,
				});
				return;
			}
		}

		try {
			await toWorker("main", "updateGameAttributesGodMode", output);
		} catch (error) {
			console.error(error);
			setSubmitting(false);
			logEvent({
				type: "error",
				text: error.message,
				saveToDb: false,
				persistent: true,
			});
			return;
		}

		setSubmitting(false);
		logEvent({
			type: "success",
			text: "League settings successfully updated.",
			saveToDb: false,
		});
	};

	const currentCategoryNames: Category[] = [];

	let bottom = 0;
	if (stickyFooterAd) {
		bottom += 52;
	}

	const toggleGodModeSettings = () => {
		setShowGodModeSettings(show => !show);
	};

	return (
		<div className="d-flex">
			<form onSubmit={handleFormSubmit} style={{ maxWidth: 1400 }}>
				<GodModeSettingsButton
					className="mb-5 d-sm-none"
					godMode={godMode}
					onClick={toggleGodModeSettings}
				>
					{showGodModeSettings ? "Hide" : "Show"} God Mode settings
				</GodModeSettingsButton>

				{categories.map(category => {
					if (!groupedOptions[category.name]) {
						return null;
					}

					const catOptions = groupedOptions[category.name].filter(option => {
						return (
							(godMode || showGodModeSettings || !option.godModeRequired) &&
							!option.hidden
						);
					});

					if (catOptions.length === 0) {
						return null;
					}
					currentCategoryNames.push(category.name);

					return (
						<Fragment key={category.name}>
							<a className="anchor" id={category.name} />
							<h2>
								{category.name}
								{category.helpText ? (
									<HelpPopover title={category.name} className="ml-1">
										{category.helpText}
									</HelpPopover>
								) : null}
							</h2>
							{category.name === "Game Simulation" &&
							isSport("basketball") &&
							gameSimPresets &&
							(godMode || showGodModeSettings) ? (
								<div className="form-inline mb-3">
									<select
										className="form-control"
										value={gameSimPreset}
										disabled={!godMode}
										onChange={event => {
											// @ts-ignore
											const presets = gameSimPresets[event.target.value];
											if (!presets) {
												return;
											}

											const presetsString: any = {};
											for (const [key, value] of Object.entries(presets)) {
												presetsString[key] = String(value);
											}

											setState(prevState => ({
												...prevState,
												...presetsString,
											}));
											setGameSimPreset(event.target.value);
										}}
									>
										<option value="default">
											Select preset based on historical NBA stats
										</option>
										{Object.keys(gameSimPresets)
											.sort()
											.reverse()
											.map(season => (
												<option key={season} value={season}>
													{season}
												</option>
											))}
									</select>
								</div>
							) : null}
							<div className="row mb-5">
								{catOptions.map(
									(
										{
											customForm,
											decoration,
											description,
											descriptionLong,
											godModeRequired,
											key,
											maxWidth,
											name,
											type,
											values,
										},
										i,
									) => {
										const enabled = godMode || !godModeRequired;
										const id = `settings-${category.name}-${name}`;

										let customFormNode;
										if (customForm) {
											if (key === "stopOnInjuryGames") {
												const key2 = "stopOnInjury";
												const checked = state[key2] === "true";
												customFormNode = (
													<div
														style={inputStyle}
														className="d-flex align-items-center"
													>
														<div
															className="custom-control custom-switch"
															title={checked ? "Enabled" : "Disabled"}
														>
															<input
																type="checkbox"
																className="custom-control-input"
																checked={checked}
																onChange={handleChange(key2, "bool")}
																id={id + "2"}
																value={state[key2]}
															/>
															<label
																className="custom-control-label"
																htmlFor={id + "2"}
															></label>
														</div>
														<div className="input-group">
															<input
																id={id}
																disabled={!checked}
																className="form-control"
																type="text"
																onChange={handleChange(key, type)}
																value={state[key]}
															/>
															<div className="input-group-append">
																<div className="input-group-text">Games</div>
															</div>
														</div>
													</div>
												);
											}
										}

										// Similar logic could extend this to 3 columns or more, if necessary
										const lastInCol = i === catOptions.length - 1;
										const lastInCol2 = lastInCol || i === catOptions.length - 2;

										const firstInCol = i === 0;
										const firstInCol2 = firstInCol || i === 1;

										return (
											<div key={key} className="col-md-6 d-flex">
												<div
													className={classNames("fake-list-group-item border", {
														"rounded-bottom": lastInCol,
														"rounded-top": firstInCol,
														"border-top-0": !firstInCol,
														"rounded-md-bottom": lastInCol2,
														"rounded-md-top": firstInCol2,
														"border-md-top": firstInCol2,
													})}
												>
													<Option
														type={type}
														disabled={!enabled}
														id={id}
														onChange={handleChange(key, type)}
														value={state[key]}
														values={values}
														decoration={decoration}
														name={name}
														description={description}
														descriptionLong={descriptionLong}
														customForm={customFormNode}
														maxWidth={maxWidth}
													/>
												</div>
											</div>
										);
									},
								)}
							</div>
						</Fragment>
					);
				})}

				<div
					className="alert-secondary rounded-top p-2 d-flex settings-buttons"
					style={{ bottom }}
				>
					<div className="btn-group">
						<GodModeSettingsButton
							className="d-none d-sm-block"
							godMode={godMode}
							onClick={toggleGodModeSettings}
						>
							{showGodModeSettings ? "Hide" : "Show"} God Mode settings
						</GodModeSettingsButton>
						<button
							className={classNames(
								"btn border-0",
								godMode ? "btn-secondary" : "btn-god-mode",
							)}
							onClick={handleGodModeToggle}
							type="button"
						>
							{godMode ? "Disable God Mode" : "Enable God Mode"}
						</button>
					</div>
					<button className="btn btn-primary ml-auto" disabled={submitting}>
						Save Settings
					</button>
				</div>
			</form>

			<div className="d-none settings-shortcuts ml-3 flex-shrink-0">
				<ul className="list-unstyled">
					<li className="mb-1">Shortcuts:</li>
					{currentCategoryNames.map(name => (
						<li key={name} className="mb-1">
							<a href={`#${name}`}>{name}</a>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
};

Settings.propTypes = {
	godMode: PropTypes.bool.isRequired,
	luxuryPayroll: PropTypes.number.isRequired,
	luxuryTax: PropTypes.number.isRequired,
	maxContract: PropTypes.number.isRequired,
	minContract: PropTypes.number.isRequired,
	minPayroll: PropTypes.number.isRequired,
	minRosterSize: PropTypes.number.isRequired,
	maxRosterSize: PropTypes.number.isRequired,
	numActiveTeams: PropTypes.number.isRequired,
	numGames: PropTypes.number.isRequired,
	quarterLength: PropTypes.number.isRequired,
	salaryCap: PropTypes.number.isRequired,
	aiTradesFactor: PropTypes.number.isRequired,
	injuryRate: PropTypes.number.isRequired,
	tragicDeathRate: PropTypes.number.isRequired,
	brotherRate: PropTypes.number.isRequired,
	homeCourtAdvantage: PropTypes.number.isRequired,
	rookieContractLengths: PropTypes.arrayOf(PropTypes.number).isRequired,
	sonRate: PropTypes.number.isRequired,
	hardCap: PropTypes.bool.isRequired,
	numGamesPlayoffSeries: PropTypes.arrayOf(PropTypes.number).isRequired,
	numPlayoffByes: PropTypes.number.isRequired,
	draftType: PropTypes.string.isRequired,
	playersRefuseToNegotiate: PropTypes.bool.isRequired,
	budget: PropTypes.bool.isRequired,
	numSeasonsFutureDraftPicks: PropTypes.number.isRequired,
	foulRateFactor: PropTypes.number.isRequired,
	foulsNeededToFoulOut: PropTypes.number.isRequired,
	foulsUntilBonus: PropTypes.arrayOf(PropTypes.number).isRequired,
};

export default Settings;
