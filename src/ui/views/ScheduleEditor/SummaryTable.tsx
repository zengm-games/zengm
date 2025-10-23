import type { View } from "../../../common/types.ts";
import ResponsiveTableWrapper from "../../components/ResponsiveTableWrapper.tsx";
import helpers from "../../util/helpers.ts";
import { TeamsHeaders } from "./TeamsHeaders.tsx";

export const SummaryTable = ({
	schedule,
	teams,
	teamsByTid,
	userTid,
}: {
	schedule: View<"scheduleEditor">["initialSchedule"];
	teamsByTid: Record<number, View<"scheduleEditor">["teams"][number]>;
} & Pick<View<"scheduleEditor">, "teams" | "userTid">) => {
	const initialCounts: Record<
		number,
		{
			away: number;
			home: number;
		}
	> = {};
	for (const t of teams) {
		initialCounts[t.tid] = { away: 0, home: 0 };
	}

	const counts = {
		total: helpers.deepCopy(initialCounts),
		conf: helpers.deepCopy(initialCounts),
		div: helpers.deepCopy(initialCounts),
		beforeAllStarGame: helpers.deepCopy(initialCounts),
		afterAllStarGame: helpers.deepCopy(initialCounts),
	};

	const countsByTid: Record<number, typeof initialCounts> = {};
	for (const t of teams) {
		countsByTid[t.tid] = helpers.deepCopy(initialCounts);
	}

	const names = {
		total: {
			title: "Total games",
			desc: undefined,
		},
		conf: {
			title: "Conference",
			desc: undefined,
		},
		div: {
			title: "Division",
			desc: undefined,
		},
		beforeAllStarGame: {
			title: "Before ASG",
			desc: "Before All-Star Game",
		},
		afterAllStarGame: {
			title: "After ASG",
			desc: "After All-Star Game",
		},
	};

	let seenAllStarGame = false;
	for (const game of schedule) {
		if (game.type === "allStarGame") {
			seenAllStarGame = true;
			continue;
		}
		if (game.type === "tradeDeadline") {
			continue;
		}

		counts.total[game.awayTid]!.away += 1;
		counts.total[game.homeTid]!.home += 1;

		const t = teamsByTid[game.homeTid];
		const t2 = teamsByTid[game.awayTid];
		if (t && t2) {
			if (t.seasonAttrs.cid === t2.seasonAttrs.cid) {
				counts.conf[game.awayTid]!.away += 1;
				counts.conf[game.homeTid]!.home += 1;
			}
			if (t.seasonAttrs.did === t2.seasonAttrs.did) {
				counts.div[game.awayTid]!.away += 1;
				counts.div[game.homeTid]!.home += 1;
			}

			countsByTid[game.awayTid]![game.homeTid]!.away += 1;
			countsByTid[game.homeTid]![game.awayTid]!.home += 1;
		}

		if (seenAllStarGame) {
			counts.afterAllStarGame[game.awayTid]!.away += 1;
			counts.afterAllStarGame[game.homeTid]!.home += 1;
		} else {
			counts.beforeAllStarGame[game.awayTid]!.away += 1;
			counts.beforeAllStarGame[game.homeTid]!.home += 1;
		}
	}

	return (
		<ResponsiveTableWrapper>
			<table className="table table-striped table-borderless table-hover table-nonfluid">
				<thead>
					<tr>
						<th />
						<TeamsHeaders teams={teams} userTid={userTid} />
					</tr>
				</thead>
				<tbody>
					{helpers.keys(counts).map((key) => {
						if (
							!seenAllStarGame &&
							(key === "beforeAllStarGame" || key === "afterAllStarGame")
						) {
							return;
						}

						return (
							<tr key={key}>
								<th title={names[key].desc} className="text-end">
									{names[key].title}
								</th>
								{teams.map((t) => {
									const { away, home } = counts[key][t.tid]!;
									return (
										<td key={t.tid} className="text-center">
											{away + home}
											<br />
											{home} / {away}
										</td>
									);
								})}
							</tr>
						);
					})}
					{teams.map((t) => {
						return (
							<tr key={t.tid}>
								<th className="text-end">vs. {t.seasonAttrs.abbrev}</th>
								{teams.map((t2) => {
									const { away, home } = countsByTid[t2.tid]![t.tid]!;
									return (
										<td key={t2.tid} className="text-center">
											{away + home}
											<br />
											{home} / {away}
										</td>
									);
								})}
							</tr>
						);
					})}
				</tbody>
			</table>
		</ResponsiveTableWrapper>
	);
};
