import { useState, type FormEvent, type ChangeEvent, useReducer } from "react";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { helpers, logEvent, toWorker } from "../util/index.ts";
import { ActionButton, ResponsiveTableWrapper } from "../components/index.tsx";
import type { View } from "../../common/types.ts";
import { PHASE, TIME_BETWEEN_GAMES } from "../../common/constants.ts";

type Schedule = View<"scheduleEditor">["initialSchedule"];

const reducer = (schedule: Schedule, action: unknown): Schedule => {
	return schedule;
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

	const scheduleByDay: {
		day: number;
		gamesByHomeTid: Record<number, Extract<Schedule[number], { type: "game" }>>;
		special: "allStarGame" | "tradeDeadline" | undefined;
	}[] = [];
	for (const game of schedule) {
		let currentDay = scheduleByDay.at(-1);
		if (!currentDay) {
			if (game.type === "game") {
				currentDay = {
					day: game.day,
					gamesByHomeTid: { [game.homeTid]: game },
					special: undefined,
				};
			} else {
				currentDay = {
					day: game.day,
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
					gamesByHomeTid: {},
					special: undefined,
				};
				scheduleByDay.push(currentDay);
			}

			if (newDay) {
				if (game.type === "game") {
					currentDay.gamesByHomeTid[game.homeTid] = game;
				} else {
					currentDay.special = game.type;
				}
			} else {
				if (currentDay.gamesByHomeTid[game.homeTid]) {
					throw new Error(
						`Team ${game.homeTid} has two games on day ${game.day}`,
					);
				}
				if (game.type !== "game") {
					throw new Error(
						"All-Star Game and Trade Deadline must be on their own days",
					);
				}
				currentDay.gamesByHomeTid[game.homeTid] = game;
			}
		} else {
			throw new Error("Schedule is not sorted by day");
		}
	}
	console.log(scheduleByDay);

	return (
		<div>
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
									<th>{row.day}</th>
									{row.special ? (
										<td colSpan={teams.length}>
											{row.special === "allStarGame"
												? "All-Star Game"
												: "Trade Deadline"}
										</td>
									) : (
										teams.map((t) => {
											const game = row.gamesByHomeTid[t.tid];
											return (
												<td key={t.tid}>{game ? game.awayAbbrev : null}</td>
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
