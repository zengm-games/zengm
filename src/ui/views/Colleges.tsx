import React from "react";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers, useLocalShallow } from "../util";
import { DataTable, PlayerNameLabels } from "../components";
import type { View } from "../../common/types";
import { frivolitiesMenu } from "./Frivolities";

export const genView = (type: "college" | "country" | "jerseyNumbers") => {
	return ({
		challengeNoRatings,
		infos,
		stats,
		userTid,
		valueStat,
	}: View<"colleges">) => {
		useTitleBar({
			title:
				type === "college"
					? "Colleges"
					: type === "country"
					? "Countries"
					: "Jersey Numbers",
			customMenu: frivolitiesMenu,
		});

		const { teamInfoCache } = useLocalShallow(state2 => ({
			teamInfoCache: state2.teamInfoCache,
		}));

		const superCols = [
			{
				title: "",
				colspan: 6,
			},
			{
				title: "Best Player",
				colspan: 7 + stats.length,
			},
		];

		const cols = getCols(
			type === "college"
				? "College"
				: type === "country"
				? "Country"
				: "stat:jerseyNumber",
			"# Players",
			"# Active",
			"# HoF",
			"stat:gp",
			`stat:${valueStat}`,
			"Name",
			"Pos",
			"Drafted",
			"Retired",
			"Pick",
			"Peak Ovr",
			"Team",
			...stats.map(stat => `stat:${stat}`),
		);

		const rows = infos.map(c => {
			const p = c.p;

			const abbrev = teamInfoCache[p.legacyTid]?.abbrev;

			const showRatings = !challengeNoRatings || p.retiredYear !== Infinity;

			return {
				key: c.name,
				data: [
					<a
						href={helpers.leagueUrl([
							"frivolities",
							"most",
							type === "college"
								? "college"
								: type === "country"
								? "country"
								: "jersey_number",
							window.encodeURIComponent(c.name),
						])}
					>
						{c.name}
					</a>,
					c.numPlayers,
					c.numActivePlayers,
					c.numHof,
					helpers.roundStat(c.gp, "gp"),
					helpers.roundStat(c.valueStat, valueStat),
					{
						value: (
							<PlayerNameLabels
								jerseyNumber={p.jerseyNumber}
								pid={p.pid}
								watch={p.watch}
								disableWatchToggle
							>
								{p.name}
							</PlayerNameLabels>
						),
						classNames: {
							"table-danger": p.hof,
							"table-success": p.retiredYear === Infinity,
							"table-info": p.statsTids.includes(userTid),
						},
					},
					p.ratings[p.ratings.length - 1].pos,
					p.draft.year,
					p.retiredYear === Infinity ? null : p.retiredYear,
					p.draft.round > 0 ? `${p.draft.round}-${p.draft.pick}` : "",
					showRatings ? p.peakOvr : null,
					{
						value: (
							<a
								href={helpers.leagueUrl([
									"team_history",
									`${abbrev}_${p.legacyTid}`,
								])}
							>
								{abbrev}
							</a>
						),
						classNames: {
							"table-info": p.legacyTid === userTid,
						},
					},
					...stats.map(stat => helpers.roundStat(p.careerStats[stat], stat)),
				],
			};
		});

		return (
			<>
				<p>
					Players who have played for your team are{" "}
					<span className="text-info">highlighted in blue</span>. Active players
					are <span className="text-success">highlighted in green</span>. Hall
					of Famers are <span className="text-danger">highlighted in red</span>.
				</p>
				<DataTable
					cols={cols}
					defaultSort={[5, "desc"]}
					name={type === "college" ? "Colleges" : "Countries"}
					rows={rows}
					superCols={superCols}
				/>
			</>
		);
	};
};

export default genView("college");
