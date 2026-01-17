import type { View } from "../../../common/types.ts";
import { DataTable } from "../../components/index.tsx";
import helpers from "../../util/helpers.ts";
import { getCol } from "../../util/index.ts";
import type { Col } from "../../components/DataTable/index.tsx";
import { getGradientStyle } from "./getGradientStyle.ts";

export const getTeamCols = (
	teams: {
		tid: number;
		seasonAttrs: {
			abbrev: string;
			name: string;
			region: string;
		};
	}[],
	userTid: number,
): Col[] => {
	return teams.map((t) => {
		return {
			classNames: userTid === t.tid ? "table-info" : undefined,
			desc: `${t.seasonAttrs.region} ${t.seasonAttrs.name}`,
			title: t.seasonAttrs.abbrev,
		};
	});
};

const wrappedAwayHomeSum = (
	{ away, home }: { away: number; home: number },
	style: ReturnType<typeof getGradientStyle>,
) => {
	const total = away + home;
	return {
		value: (
			<>
				{total}
				<br />
				{home} / {away}
			</>
		),
		searchValue: `${total} (${home} / ${away})`,
		style: style(total),
	};
};

export const SummaryTable = ({
	schedule,
	teams,
	teamsByTid,
	userTid,
}: {
	teamsByTid: Record<number, View<"scheduleEditor">["teams"][number]>;
} & Pick<View<"scheduleEditor">, "schedule" | "teams" | "userTid">) => {
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
		if (game.type !== "game" && game.type !== "completed") {
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

	const cols = [getCol(""), ...getTeamCols(teams, userTid)];

	const rows = [
		...helpers
			.keys(counts)
			.filter((key) => {
				// Hide before/after ASG if no ASG
				if (
					!seenAllStarGame &&
					(key === "beforeAllStarGame" || key === "afterAllStarGame")
				) {
					return false;
				}

				return true;
			})
			.map((key) => {
				const values = teams.map((t) => {
					const { away, home } = counts[key][t.tid]!;
					return away + home;
				});
				const gradientStyle = getGradientStyle(values);
				return {
					key,
					data: [
						{
							value: names[key].title,
							classNames: "text-end",
							header: true,
							title: names[key].desc,
						},
						...teams.map((t) => {
							return wrappedAwayHomeSum(counts[key][t.tid]!, gradientStyle);
						}),
					],
				};
			}),
		...teams.map((t) => {
			const values = teams.map((t2) => {
				const { away, home } = countsByTid[t2.tid]![t.tid]!;
				return away + home;
			});
			const gradientStyle = getGradientStyle(values);
			return {
				key: t.tid,
				data: [
					{
						value: `vs. ${t.seasonAttrs.abbrev}`,
						classNames: "text-end",
						header: true,
					},
					...teams.map((t2) => {
						return wrappedAwayHomeSum(
							countsByTid[t2.tid]![t.tid]!,
							gradientStyle,
						);
					}),
				],
			};
		}),
	];

	return (
		<DataTable
			className="text-center"
			cols={cols}
			defaultSort="disableSort"
			hideAllControls
			name="ScheduleEditorSummary"
			rows={rows}
			stickyHeader
		/>
	);
};
