import classNames from "classnames";
import groupBy from "lodash/groupBy";
import PropTypes from "prop-types";
import React, { useState, ReactNode, ChangeEvent, FormEvent } from "react";
import { HelpPopover } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { localActions, logEvent, toWorker, helpers } from "../util";
import type { View } from "../../common/types";

type Key =
	| "numGames"
	| "quarterLength"
	| "minRosterSize"
	| "maxRosterSize"
	| "numGamesPlayoffSeries"
	| "numPlayoffByes"
	| "draftType"
	| "numSeasonsFutureDraftPicks"
	| "salaryCap"
	| "minPayroll"
	| "luxuryPayroll"
	| "luxuryTax"
	| "minContract"
	| "maxContract"
	| "hardCap"
	| "budget"
	| "aiTradesFactor"
	| "playersRefuseToNegotiate"
	| "injuryRate"
	| "tragicDeathRate"
	| "brotherRate"
	| "sonRate"
	| "homeCourtAdvantage"
	| "rookieContractLengths"
	| "allStarGame"
	| "foulRateFactor"
	| "foulsNeededToFoulOut"
	| "threePointers"
	| "pace"
	| "threePointTendencyFactor"
	| "threePointAccuracyFactor"
	| "twoPointAccuracyFactor";

type Category = "League Structure" | "Finance" | "Events" | "Game Simulation";

type FieldType =
	| "bool"
	| "float"
	| "float1000"
	| "int"
	| "jsonString"
	| "string";

type Decoration = "currency" | "percent";

type Values = { [key: string]: string | undefined };

const options: {
	category: Category;
	key: Key;
	name: string;
	type: FieldType;
	decoration?: Decoration;
	helpText?: ReactNode;
	values?: Values;
	validator?: (value: any, output: any, props: View<"godMode">) => void;
}[] = [
	{
		category: "League Structure",
		key: "numGames",
		name: "# Games Per Season",
		type: "int",
		helpText: "This will only apply to seasons that have not started yet.",
	},
	{
		category: "League Structure",
		key: "quarterLength",
		name: "Quarter Length (minutes)",
		type: "float",
	},
	{
		category: "League Structure",
		key: "minRosterSize",
		name: "Min Roster Size",
		type: "int",
		validator: value => {
			if (value < 5) {
				throw new Error("Value cannot be less than 5");
			}
		},
	},
	{
		category: "League Structure",
		key: "maxRosterSize",
		name: "Max Roster Size",
		type: "int",
	},
	{
		category: "League Structure",
		key: "numGamesPlayoffSeries",
		name: "# Playoff Games",
		helpText: (
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
				props.numTeams,
			);
		},
	},
	{
		category: "League Structure",
		key: "numPlayoffByes",
		name: "# First Round Byes",
		type: "int",
		helpText:
			"Number of playoff teams who will get a bye in the first round. For leagues with two conferences, byes will be split evenly across conferences.",
		validator: value => {
			if (value < 0) {
				throw new Error("Value cannot be less than 0");
			}
		},
	},
	{
		category: "League Structure",
		key: "draftType",
		name: "Draft Type",
		helpText: (
			<>
				<p>Currently this just changes the type of draft lottery.</p>
				<p>NBA 2019 is the current NBA draft lottery.</p>
				<p>
					NBA 1994 is the NBA draft lottery that was used from 1994 to 2018.
				</p>
				<p>No Lottery will order teams based on their record.</p>
				<p>
					Random Order will order the draft completely randomly, with no regard
					for team performance. Each round is randomized independently, so a
					team could get the first pick in one round and the last pick in the
					next round.
				</p>
			</>
		),
		type: "string",
		values: {
			nba2019: "NBA 2019",
			nba1994: "NBA 1994",
			noLottery: "No Lottery",
			random: "Random Order",
		},
	},
	{
		category: "League Structure",
		key: "numSeasonsFutureDraftPicks",
		name: "# Tradable Draft Pick Seasons",
		type: "int",
		helpText:
			"Number of seasons in the future to generate tradable draft picks for. The default value is 4. If you set this to 0, it disables all trading of draft picks.",
		validator: value => {
			if (value < 0) {
				throw new Error("Value cannot be less than 0");
			}
		},
	},
	{
		category: "Finance",
		key: "salaryCap",
		name: "Salary Cap",
		type: "float1000",
		decoration: "currency",
	},
	{
		category: "Finance",
		key: "minPayroll",
		name: "Minimum Payroll",
		type: "float1000",
		decoration: "currency",
	},
	{
		category: "Finance",
		key: "luxuryPayroll",
		name: "Luxury Tax Threshold",
		type: "float1000",
		decoration: "currency",
	},
	{
		category: "Finance",
		key: "luxuryTax",
		name: "Luxury Tax",
		type: "float",
		helpText:
			"Take the difference between a team's payroll and the luxury tax threshold. Multiply that by this number. The result is the penalty they have to pay.",
	},
	{
		category: "Finance",
		key: "minContract",
		name: "Minimum Contract",
		type: "float1000",
		decoration: "currency",
	},
	{
		category: "Finance",
		key: "maxContract",
		name: "Max Contract",
		type: "float1000",
		decoration: "currency",
	},
	{
		category: "Finance",
		key: "hardCap",
		name: "Hard Cap",
		type: "bool",
		helpText: (
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
		category: "Finance",
		key: "budget",
		name: "Budget",
		type: "bool",
		helpText: (
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
		type: "float",
		helpText:
			"The baseline rate of trades between AI teams is multiplied by this number. Anything beyond 100 will be both absurd and ridiculously slow.",
	},
	{
		category: "Events",
		key: "playersRefuseToNegotiate",
		name: "Players Can Refuse To Sign With You",
		type: "bool",
	},
	{
		category: "Events",
		key: "injuryRate",
		name: "Injury Rate",
		type: "float",
		helpText: (
			<>
				<p>
					The injury rate is the probability that a player is injured per
					possession.
					{process.env.SPORT === "basketball" ? (
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
		type: "float",
		helpText: (
			<>
				<p>
					The tragic death rate is the probability that a player will die a
					tragic death on a given regular season day. Yes, this only happens in
					the regular season.$
					{process.env.SPORT === "basketball"
						? "  With roughly 100 days in a season, the default is about one death every 50 years, or 1/(50*100) = 0.0002."
						: null}{" "}
					If you set it too high and run out of players, then you'll have to use
					God Mode to either create more or bring some back from the dead.
				</p>
				{process.env.SPORT === "basketball" ? (
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
		helpText:
			"The probability that a new player will be the brother of an existing player.",
	},
	{
		category: "Events",
		key: "sonRate",
		name: "Son Rate",
		type: "float",
		helpText:
			"The probability that a new player will be the son of an existing player.",
	},
	{
		category: "Game Simulation",
		key: "homeCourtAdvantage",
		name: "Home Court Advantage",
		type: "float",
		decoration: "percent",
		helpText:
			"This is the percentage boost/penalty given to home/away player ratings. Default is 1%.",
	},
	{
		category: "Finance",
		key: "rookieContractLengths",
		name: "Rookie Contract Lengths",
		helpText: (
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
			const numPlayoffTeams = 2 ** numRounds - output.numPlayoffByes;
			if (numPlayoffTeams > props.numTeams) {
				throw new Error(
					`${numRounds} playoff rounds with ${output.numPlayoffByes} byes means ${numPlayoffTeams} teams make the playoffs, but there are only ${props.numTeams} teams in the league`,
				);
			}
		},
	},
];

if (process.env.SPORT === "basketball") {
	options.push(
		{
			category: "League Structure",
			key: "allStarGame",
			name: "All-Star Game",
			type: "bool",
			helpText:
				"Changing this will not affect an in-progress season, only future seasons.",
		},
		{
			category: "Game Simulation",
			key: "foulRateFactor",
			name: "Foul Rate Factor",
			type: "float",
			helpText:
				"The baseline rates for shooting and non-shooting fouls are multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "foulsNeededToFoulOut",
			name: "# Fouls Needed to Foul Out",
			type: "int",
			validator: value => {
				if (value < 0) {
					throw new Error("Value cannot be less than 0");
				}
			},
		},
		{
			category: "Game Simulation",
			key: "pace",
			name: "Pace",
			type: "float",
			helpText: "Average number of possessions per 48 minutes.",
		},
		{
			category: "Game Simulation",
			key: "threePointers",
			name: "Three Pointers",
			type: "bool",
			helpText:
				"If you disable three pointers, shots from that range will still be displayed as three pointers in stats tables, but they will only count for two points.",
		},
		{
			category: "Game Simulation",
			key: "threePointTendencyFactor",
			name: "Three Point Tendency Factor",
			type: "float",
			helpText:
				"The baseline rate for number of three pointers is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "threePointAccuracyFactor",
			name: "Three Point Accuracy Factor",
			type: "float",
			helpText:
				"The baseline rate for three point percentage is multiplied by this number.",
		},
		{
			category: "Game Simulation",
			key: "twoPointAccuracyFactor",
			name: "Two Point Accuracy Factor",
			type: "float",
			helpText:
				"The baseline rate for two point percentage is multiplied by this number.",
		},
	);
}

// See play-style-adjustments in bbgm-rosters
const gameSimPresets =
	process.env.SPORT === "basketball"
		? {
				2020: {
					pace: 100.2,
					threePointers: true,
					threePointTendencyFactor: 1.0,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 1.0,
				},
				2019: {
					pace: 100.0,
					threePointers: true,
					threePointTendencyFactor: 0.946,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 1.0,
				},
				2018: {
					pace: 97.3,
					threePointers: true,
					threePointTendencyFactor: 0.881,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 1.0,
				},
				2017: {
					pace: 96.4,
					threePointers: true,
					threePointTendencyFactor: 0.827,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 1.0,
				},
				2016: {
					pace: 95.8,
					threePointers: true,
					threePointTendencyFactor: 0.744,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 1.0,
				},
				2015: {
					pace: 93.9,
					threePointers: true,
					threePointTendencyFactor: 0.705,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 1.0,
				},
				2014: {
					pace: 93.9,
					threePointers: true,
					threePointTendencyFactor: 0.676,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 1.0,
				},
				2013: {
					pace: 92.0,
					threePointers: true,
					threePointTendencyFactor: 0.64,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.991,
				},
				2012: {
					pace: 91.3,
					threePointers: true,
					threePointTendencyFactor: 0.595,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.978,
				},
				2011: {
					pace: 92.1,
					threePointers: true,
					threePointTendencyFactor: 0.577,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.999,
				},
				2010: {
					pace: 92.7,
					threePointers: true,
					threePointTendencyFactor: 0.577,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 1.009,
				},
				2009: {
					pace: 91.7,
					threePointers: true,
					threePointTendencyFactor: 0.583,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.995,
				},
				2008: {
					pace: 92.4,
					threePointers: true,
					threePointTendencyFactor: 0.58,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.993,
				},
				2007: {
					pace: 91.9,
					threePointers: true,
					threePointTendencyFactor: 0.545,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.995,
				},
				2006: {
					pace: 90.5,
					threePointers: true,
					threePointTendencyFactor: 0.521,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.98,
				},
				2005: {
					pace: 90.9,
					threePointers: true,
					threePointTendencyFactor: 0.512,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.964,
				},
				2004: {
					pace: 90.1,
					threePointers: true,
					threePointTendencyFactor: 0.488,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.943,
				},
				2003: {
					pace: 91.0,
					threePointers: true,
					threePointTendencyFactor: 0.476,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.949,
				},
				2002: {
					pace: 90.7,
					threePointers: true,
					threePointTendencyFactor: 0.479,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.954,
				},
				2001: {
					pace: 91.3,
					threePointers: true,
					threePointTendencyFactor: 0.443,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.946,
				},
				2000: {
					pace: 93.1,
					threePointers: true,
					threePointTendencyFactor: 0.435,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.96,
				},
				1999: {
					pace: 88.9,
					threePointers: true,
					threePointTendencyFactor: 0.438,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.937,
				},
				1998: {
					pace: 90.3,
					threePointers: true,
					threePointTendencyFactor: 0.417,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.965,
				},
				1997: {
					pace: 90.1,
					threePointers: true,
					threePointTendencyFactor: 0.551,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.985,
				},
				1996: {
					pace: 91.8,
					threePointers: true,
					threePointTendencyFactor: 0.518,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.996,
				},
				1995: {
					pace: 92.9,
					threePointers: true,
					threePointTendencyFactor: 0.485,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 1.007,
				},
				1994: {
					pace: 95.1,
					threePointers: true,
					threePointTendencyFactor: 0.31,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.991,
				},
				1993: {
					pace: 96.8,
					threePointers: true,
					threePointTendencyFactor: 0.274,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 1.003,
				},
				1992: {
					pace: 96.6,
					threePointers: true,
					threePointTendencyFactor: 0.232,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.997,
				},
				1991: {
					pace: 97.8,
					threePointers: true,
					threePointTendencyFactor: 0.214,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 1.001,
				},
				1990: {
					pace: 98.3,
					threePointers: true,
					threePointTendencyFactor: 0.199,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 1.001,
				},
				1989: {
					pace: 100.6,
					threePointers: true,
					threePointTendencyFactor: 0.193,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 1.004,
				},
				1988: {
					pace: 99.6,
					threePointers: true,
					threePointTendencyFactor: 0.149,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 1.005,
				},
				1987: {
					pace: 100.8,
					threePointers: true,
					threePointTendencyFactor: 0.14,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 1.006,
				},
				1986: {
					pace: 102.1,
					threePointers: true,
					threePointTendencyFactor: 0.095,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 1.016,
				},
				1985: {
					pace: 102.1,
					threePointers: true,
					threePointTendencyFactor: 0.092,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 1.023,
				},
				1984: {
					pace: 101.4,
					threePointers: true,
					threePointTendencyFactor: 0.068,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 1.023,
				},
				1983: {
					pace: 103.1,
					threePointers: true,
					threePointTendencyFactor: 0.065,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 1.009,
				},
				1982: {
					pace: 100.9,
					threePointers: true,
					threePointTendencyFactor: 0.065,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 1.02,
				},
				1981: {
					pace: 101.8,
					threePointers: true,
					threePointTendencyFactor: 0.06,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 1.008,
				},
				1980: {
					pace: 103.1,
					threePointers: true,
					threePointTendencyFactor: 0.08,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 1.0,
				},
				1979: {
					pace: 105.8,
					threePointers: false,
					threePointTendencyFactor: 0.025,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.995,
				},
				1978: {
					pace: 106.7,
					threePointers: false,
					threePointTendencyFactor: 0.025,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.962,
				},
				1977: {
					pace: 106.5,
					threePointers: false,
					threePointTendencyFactor: 0.025,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.954,
				},
				1976: {
					pace: 105.5,
					threePointers: false,
					threePointTendencyFactor: 0.025,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.94,
				},
				1975: {
					pace: 104.5,
					threePointers: false,
					threePointTendencyFactor: 0.025,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.938,
				},
				1974: {
					pace: 107.8,
					threePointers: false,
					threePointTendencyFactor: 0.025,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.941,
				},
				1973: {
					pace: 110.385,
					threePointers: false,
					threePointTendencyFactor: 0.025,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.936,
				},
				1972: {
					pace: 109.785,
					threePointers: false,
					threePointTendencyFactor: 0.025,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.932,
				},
				1971: {
					pace: 112.988,
					threePointers: false,
					threePointTendencyFactor: 0.025,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.922,
				},
				1970: {
					pace: 114.811,
					threePointers: false,
					threePointTendencyFactor: 0.025,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.943,
				},
				1969: {
					pace: 114.571,
					threePointers: false,
					threePointTendencyFactor: 0.025,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.904,
				},
				1968: {
					pace: 117.058,
					threePointers: false,
					threePointTendencyFactor: 0.025,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.915,
				},
				1967: {
					pace: 119.602,
					threePointers: false,
					threePointTendencyFactor: 0.025,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.904,
				},
				1966: {
					pace: 118.921,
					threePointers: false,
					threePointTendencyFactor: 0.025,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.887,
				},
				1965: {
					pace: 115.617,
					threePointers: false,
					threePointTendencyFactor: 0.025,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.873,
				},
				1964: {
					pace: 114.689,
					threePointers: false,
					threePointTendencyFactor: 0.025,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.887,
				},
				1963: {
					pace: 117.316,
					threePointers: false,
					threePointTendencyFactor: 0.025,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.904,
				},
				1962: {
					pace: 125.168,
					threePointers: false,
					threePointTendencyFactor: 0.025,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.874,
				},
				1961: {
					pace: 127.219,
					threePointers: false,
					threePointTendencyFactor: 0.025,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.85,
				},
				1960: {
					pace: 126.113,
					threePointers: false,
					threePointTendencyFactor: 0.025,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.84,
				},
				1959: {
					pace: 118.68,
					threePointers: false,
					threePointTendencyFactor: 0.025,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.81,
				},
				1958: {
					pace: 118.564,
					threePointers: false,
					threePointTendencyFactor: 0.025,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.786,
				},
				1957: {
					pace: 109.736,
					threePointers: false,
					threePointTendencyFactor: 0.025,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.779,
				},
				1956: {
					pace: 106.17,
					threePointers: false,
					threePointTendencyFactor: 0.025,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.793,
				},
				1955: {
					pace: 99.922,
					threePointers: false,
					threePointTendencyFactor: 0.025,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.79,
				},
				1954: {
					pace: 86.481,
					threePointers: false,
					threePointTendencyFactor: 0.025,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.764,
				},
				1953: {
					pace: 88.992,
					threePointers: false,
					threePointTendencyFactor: 0.025,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.758,
				},
				1952: {
					pace: 92.863,
					threePointers: false,
					threePointTendencyFactor: 0.025,
					threePointAccuracyFactor: 1,
					twoPointAccuracyFactor: 0.752,
				},
		  }
		: undefined;

const encodeDecodeFunctions = {
	bool: {
		stringify: (value: boolean) => String(value),
		parse: (value: string) => value === "true",
	},
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
};

const groupedOptions = groupBy(options, "category");

const Input = ({
	decoration,
	disabled,
	onChange,
	type,
	value,
	values,
}: {
	decoration?: Decoration;
	disabled?: boolean;
	onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
	type: FieldType;
	value: string;
	values?: Values;
}) => {
	const commonProps = {
		className: "form-control",
		disabled,
		onChange,
		value,
	};

	let inputElement;
	if (type === "bool") {
		inputElement = (
			<select {...commonProps}>
				<option value="true">Enabled</option>
				<option value="false">Disabled</option>
			</select>
		);
	} else if (values) {
		inputElement = (
			<select {...commonProps}>
				{Object.keys(values).map(key => (
					<option key={key} value={key}>
						{values[key]}
					</option>
				))}
			</select>
		);
	} else {
		inputElement = <input type="text" {...commonProps} />;
	}

	if (decoration === "currency") {
		return (
			<div className="input-group">
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
			<div className="input-group">
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
	values: PropTypes.object,
};

const GodModeOptions = (props: View<"godMode">) => {
	const [submitting, setSubmitting] = useState(false);
	const [gameSimPreset, setGameSimPreset] = useState("default");
	const [state, setState] = useState<Record<Key, string>>(() => {
		// @ts-ignore
		const initialState: Record<Key, string> = {};
		for (const { key, type } of options) {
			const value = props[key];

			// https://github.com/microsoft/TypeScript/issues/21732
			// @ts-ignore
			const stringify = encodeDecodeFunctions[type].stringify;

			initialState[key] = stringify ? stringify(value) : value;
		}
		return initialState;
	});

	const handleChange = (name: string) => (
		event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const value = event.target.value;
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
					validator(output[key], output, props);
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

		await toWorker("main", "updateGameAttributes", output);

		setSubmitting(false);
		logEvent({
			type: "success",
			text: "God Mode options successfully updated.",
			saveToDb: false,
		});
	};

	return (
		<form onSubmit={handleFormSubmit}>
			{Object.entries(groupedOptions).map(([category, catOptions], i) => {
				return (
					<React.Fragment key={category}>
						<h2 className={i === 0 ? "mt-3" : "mt-2"}>{category}</h2>
						{category === "Game Simulation" &&
						process.env.SPORT === "basketball" &&
						gameSimPresets ? (
							<div className="form-inline mb-3">
								<select
									className="form-control"
									value={gameSimPreset}
									disabled={!props.godMode}
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
						<div className="row">
							{catOptions.map(
								({ decoration, helpText, key, name, type, values }) => (
									<div key={key} className="col-sm-3 col-6 form-group">
										<label>
											{name}
											{helpText ? (
												<HelpPopover title={name} className="ml-1">
													{helpText}
												</HelpPopover>
											) : null}
										</label>
										<Input
											type={type}
											disabled={!props.godMode}
											onChange={handleChange(key)}
											value={state[key]}
											values={values}
											decoration={decoration}
										/>
									</div>
								),
							)}
						</div>
					</React.Fragment>
				);
			})}

			<button
				className="btn btn-primary mt-3"
				disabled={!props.godMode || submitting}
			>
				Save God Mode Options
			</button>
		</form>
	);
};

GodModeOptions.propTypes = {
	godMode: PropTypes.bool.isRequired,
	luxuryPayroll: PropTypes.number.isRequired,
	luxuryTax: PropTypes.number.isRequired,
	maxContract: PropTypes.number.isRequired,
	minContract: PropTypes.number.isRequired,
	minPayroll: PropTypes.number.isRequired,
	minRosterSize: PropTypes.number.isRequired,
	maxRosterSize: PropTypes.number.isRequired,
	numGames: PropTypes.number.isRequired,
	numTeams: PropTypes.number.isRequired,
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
	draftType: PropTypes.oneOf(["nba1994", "nba2019", "noLottery", "random"]),
	playersRefuseToNegotiate: PropTypes.bool.isRequired,
	allStarGame: PropTypes.bool.isRequired,
	budget: PropTypes.bool.isRequired,
	numSeasonsFutureDraftPicks: PropTypes.number.isRequired,
	foulRateFactor: PropTypes.number.isRequired,
	foulsNeededToFoulOut: PropTypes.number.isRequired,
};

const GodMode = (props: View<"godMode">) => {
	const { godMode } = props;

	useTitleBar({ title: "God Mode" });

	const handleGodModeToggle = async () => {
		const attrs: {
			godMode: boolean;
			godModeInPast?: true;
		} = { godMode: !godMode };

		if (attrs.godMode) {
			attrs.godModeInPast = true;
		}

		await toWorker("main", "updateGameAttributes", attrs);
		localActions.update({ godMode: attrs.godMode });
	};

	return (
		<>
			<p>
				God Mode is a collection of customization features that allow you to
				kind of do whatever you want. If you enable God Mode, you get access to
				the following features (which show up in the game as{" "}
				<span className="god-mode god-mode-text">purple text</span>
				):
			</p>

			<ul>
				<li>Create custom players by going to Tools > Create A Player</li>
				<li>
					Edit any player by going to their player page and clicking Edit Player
				</li>
				<li>
					Force any trade to be accepted by checking the Force Trade checkbox
					before proposing a trade
				</li>
				<li>
					You can become the GM of another team at any time with Tools > Switch
					Team
				</li>
				<li>Add, remove and edit teams with Tools > Manage Teams</li>
				<li>You will never be fired!</li>
				<li>You will be able to change the options below</li>
			</ul>

			<p>
				However, if you enable God Mode within a league, you will not get credit
				for any <a href="/account">Achievements</a>. This persists even if you
				disable God Mode. You can only get Achievements in a league where God
				Mode has never been enabled.
			</p>

			<button
				className={classNames("btn", godMode ? "btn-success" : "btn-danger")}
				onClick={handleGodModeToggle}
			>
				{godMode ? "Disable God Mode" : "Enable God Mode"}
			</button>

			<h1 className="mt-3">God Mode Options</h1>

			<p className="text-danger">
				These options are not well tested and might make the AI do weird things.
			</p>

			<GodModeOptions {...props} />
		</>
	);
};

GodMode.propTypes = GodModeOptions.propTypes;

export default GodMode;
