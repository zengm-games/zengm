import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers, useLocalShallow } from "../util";
import { DataTable, PlayerNameLabels } from "../components";
import type { View } from "../../common/types";
import { frivolitiesMenu } from "./Frivolities";

export const genView = (
	type: "college" | "country" | "draftPosition" | "jerseyNumbers",
) => {
	return ({
		challengeNoRatings,
		infos,
		stats,
		userTid,
		displayStat,
	}: View<"colleges">) => {
		useTitleBar({
			title:
				type === "college"
					? "Colleges"
					: type === "country"
					? "Countries"
					: type === "draftPosition"
					? "Best Player at Every Pick"
					: "Jersey Numbers",
			customMenu: frivolitiesMenu,
		});

		const { teamInfoCache } = useLocalShallow(state2 => ({
			teamInfoCache: state2.teamInfoCache,
		}));

		const superCols = [
			{
				title: "",
				colspan: 8,
			},
			{
				title: "Best Player",
				colspan: 7 + stats.length,
			},
		];

		const cols = getCols([
			type === "college"
				? "College"
				: type === "country"
				? "Country"
				: type === "draftPosition"
				? "Pick"
				: "stat:jerseyNumber",
			"# Players",
			"Active",
			"HoF",
			"stat:gp",
			"stat:gpPerPlayer",
			`stat:${displayStat}`,
			`stat:${displayStat}PerPlayer`,
			"Name",
			"Pos",
			"Drafted",
			"Retired",
			"Pick",
			"Peak Ovr",
			"Team",
			...stats.map(stat => `stat:${stat}`),
		]);

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
								: type === "draftPosition"
								? "at_pick"
								: "jersey_number",
							window.encodeURIComponent(c.name),
						])}
					>
						{type === "draftPosition" && c.name === "undrafted"
							? "none"
							: c.name}
					</a>,
					c.numPlayers,
					c.numActivePlayers,
					c.numHof,
					helpers.roundStat(c.gp, "gp"),
					(c.gp / c.numPlayers).toFixed(1),
					helpers.roundStat(c.displayStat, displayStat),
					(c.displayStat / c.numPlayers).toFixed(1),
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
					p.ratings.at(-1).pos,
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
