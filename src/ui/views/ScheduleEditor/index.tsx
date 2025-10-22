import { useReducer } from "react";
import useTitleBar from "../../hooks/useTitleBar.tsx";
import { helpers, logEvent } from "../../util/index.ts";
import { ResponsiveTableWrapper } from "../../components/index.tsx";
import type { View } from "../../../common/types.ts";
import { PHASE, TIME_BETWEEN_GAMES } from "../../../common/constants.ts";
import { orderBy } from "../../../common/utils.ts";
import { FancySelect } from "./FancySelect.tsx";

type Schedule = View<"scheduleEditor">["initialSchedule"];

// Not All-Star Game or Trade Deadline
type ActualGame = Extract<Schedule[number], { type: "game" }>;

type ScheduleDay = {
	day: number;
	gamesByAwayTid: Record<number, ActualGame>;
	gamesByHomeTid: Record<number, ActualGame>;
	special: "allStarGame" | "tradeDeadline" | undefined;
};

type Team = View<"scheduleEditor">["teams"][number];

const reducer = (
	schedule: Schedule,
	action:
		| {
				type: "swapHomeAway" | "delete";
				game: ActualGame;
		  }
		| {
				type: "switchAwayTeam";
				away: Team;
				game: ActualGame;
		  }
		| {
				type: "switchHomeTeam";
				home: Team;
				game: ActualGame;
		  }
		| {
				type: "newGame";
				day: number;
				away: Team;
				home: Team;
		  },
): Schedule => {
	console.log("reducer", action);
	switch (action.type) {
		case "delete":
			return schedule.filter((row) => {
				return row !== action.game;
			});
		case "swapHomeAway":
			return schedule.map((row) => {
				if (row !== action.game) {
					return row;
				}

				return {
					...row,
					awayAbbrev: row.homeAbbrev,
					awayTid: row.homeTid,
					homeAbbrev: row.awayAbbrev,
					homeTid: row.awayTid,
				};
			});
		case "switchAwayTeam":
			return schedule.map((row) => {
				if (row !== action.game) {
					return row;
				}

				return {
					...row,
					awayAbbrev: action.away.abbrev,
					awayTid: action.away.tid,
				};
			});
		case "switchHomeTeam":
			return schedule.map((row) => {
				if (row !== action.game) {
					return row;
				}

				return {
					...row,
					homeAbbrev: action.home.abbrev,
					homeTid: action.home.tid,
				};
			});
		case "newGame":
			return orderBy(
				[
					...schedule,
					{
						type: "game",
						day: action.day,
						awayAbbrev: action.away.abbrev,
						awayTid: action.away.tid,
						homeAbbrev: action.home.abbrev,
						homeTid: action.home.tid,
					},
				],
				["day"],
			);
	}
};

const ScheduleEditor = ({
	godMode,
	initialSchedule,
	phase,
	teams,
	userTid,
}: View<"scheduleEditor">) => {
	useTitleBar({ title: "Schedule Editor" });

	const [schedule, dispatch] = useReducer(reducer, initialSchedule);

	if (phase !== PHASE.REGULAR_SEASON) {
		return <p>You can only edit the schedule during the regular season.</p>;
	}

	if (!godMode) {
		return (
			<>
				<p>
					You can only edit the schedule in{" "}
					<a href={helpers.leagueUrl(["god_mode"])}>God Mode</a>.
				</p>
			</>
		);
	}

	const scheduleByDay: ScheduleDay[] = [];
	for (const game of schedule) {
		let currentDay = scheduleByDay.at(-1);
		if (!currentDay) {
			if (game.type === "game") {
				currentDay = {
					day: game.day,
					gamesByAwayTid: { [game.awayTid]: game },
					gamesByHomeTid: { [game.homeTid]: game },
					special: undefined,
				};
			} else {
				currentDay = {
					day: game.day,
					gamesByAwayTid: {},
					gamesByHomeTid: {},
					special: game.type,
				};
			}
			scheduleByDay.push(currentDay);
		} else if (currentDay.day <= game.day) {
			// Add blank days up to this game, if necessary
			let day = currentDay.day;
			let newDay = true;
			while (day < game.day) {
				day += 1;
				newDay = true;

				currentDay = {
					day,
					gamesByAwayTid: {},
					gamesByHomeTid: {},
					special: undefined,
				};
				scheduleByDay.push(currentDay);
			}

			if (newDay) {
				if (game.type === "game") {
					currentDay.gamesByAwayTid[game.awayTid] = game;
					currentDay.gamesByHomeTid[game.homeTid] = game;
				} else {
					currentDay.special = game.type;
				}
			} else {
				if (
					currentDay.gamesByHomeTid[game.homeTid] ||
					currentDay.gamesByHomeTid[game.awayTid] ||
					currentDay.gamesByAwayTid[game.homeTid] ||
					currentDay.gamesByAwayTid[game.awayTid]
				) {
					throw new Error(
						`Team ${game.homeTid} has two games on day ${game.day}`,
					);
				}
				if (game.type !== "game") {
					throw new Error(
						"All-Star Game and Trade Deadline must be on their own days",
					);
				}
				currentDay.gamesByAwayTid[game.awayTid] = game;
				currentDay.gamesByHomeTid[game.homeTid] = game;
			}
		} else {
			throw new Error("Schedule is not sorted by day");
		}
	}

	return (
		<div>
			<p>
				Home teams are shown in normal text and away teams are shown in{" "}
				<span className="text-body-secondary">faded text</span>.
			</p>
			<ResponsiveTableWrapper>
				<table className="table table-striped table-borderless table-hover table-nonfluid">
					<thead>
						<tr>
							<th>{helpers.upperCaseFirstLetter(TIME_BETWEEN_GAMES)}</th>
							{teams.map((t) => {
								return (
									<th
										key={t.tid}
										className={userTid === t.tid ? "table-info" : undefined}
										title={`${t.region} ${t.name}`}
									>
										{t.abbrev}
									</th>
								);
							})}
						</tr>
					</thead>
					<tbody>
						{scheduleByDay.map((row) => {
							return (
								<tr
									key={row.day}
									className={row.special ? "table-info" : undefined}
								>
									<th className="text-center">{row.day}</th>
									{row.special ? (
										<td colSpan={teams.length}>
											{row.special === "allStarGame"
												? "All-Star Game"
												: "Trade Deadline"}
										</td>
									) : (
										teams.map((t) => {
											const gameAway = row.gamesByAwayTid[t.tid];
											const gameHome = row.gamesByHomeTid[t.tid];
											return (
												<td key={t.tid} className="p-0">
													<FancySelect
														value={
															gameHome
																? gameHome.awayTid
																: gameAway
																	? gameAway.homeTid
																	: "noGame"
														}
														className={
															row.gamesByAwayTid[t.tid]
																? "text-body-secondary"
																: undefined
														}
														onChange={(event) => {
															const value = event.target.value;
															if (
																value === "delete" ||
																value === "swapHomeAway"
															) {
																const game = gameHome ?? gameAway;
																if (game) {
																	dispatch({
																		type: value,
																		game: game,
																	});
																}
															} else {
																const tid = parseInt(value);
																const t2 = teams.find((t) => t.tid === tid);
																if (t2) {
																	if (gameHome) {
																		dispatch({
																			type: "switchAwayTeam",
																			away: t2,
																			game: gameHome,
																		});
																	} else if (gameAway) {
																		dispatch({
																			type: "switchHomeTeam",
																			home: t2,
																			game: gameAway,
																		});
																	} else {
																		dispatch({
																			type: "newGame",
																			away: t2,
																			home: t,
																			day: row.day,
																		});
																	}
																}
															}
														}}
														options={[
															{ key: "delete", value: "Delete game" },
															{ key: "swapHomeAway", value: "Swap home/away" },
															...teams
																.filter((t) => {
																	// Keep team in list if it's the current opponent
																	if (
																		gameAway?.homeTid === t.tid ||
																		gameHome?.awayTid === t.tid
																	) {
																		return true;
																	}

																	// Hide all teams with other games already
																	return (
																		!row.gamesByAwayTid[t.tid] &&
																		!row.gamesByHomeTid[t.tid]
																	);
																})
																.map((t) => {
																	return {
																		key: t.tid,
																		value: t.abbrev,
																	};
																}),
														]}
													/>
												</td>
											);
										})
									)}
								</tr>
							);
						})}
					</tbody>
				</table>
			</ResponsiveTableWrapper>
		</div>
	);
};

export default ScheduleEditor;
