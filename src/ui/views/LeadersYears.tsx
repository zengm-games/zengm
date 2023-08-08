import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import { DataTable, MoreLinks, PlayerNameLabels } from "../components";
import type { View } from "../../common/types";
import { LeadersTopText } from "./Leaders";
import range from "lodash-es/range";
import type { Col } from "../components/DataTable";
import { makeNormalResponsive } from "../hooks/useDropdownOptions";

export const formatStatsDropdown = (stats: string[]) =>
	stats.map(stat => {
		const col = getCols([`stat:${stat}`])[0];
		return {
			key: stat,
			value: col.desc ? makeNormalResponsive(col.title, col.desc) : col.title,
		};
	});

const LeadersYears = ({
	allLeaders,
	playoffs,
	stat,
	stats,
	statType,
}: View<"leadersYears">) => {
	useTitleBar({
		title: "Yearly Leaders",
		dropdownView: "leaders_years",
		dropdownFields: {
			stats: stat,
			statTypesStrict: statType,
			playoffs,
		},
		dropdownCustomOptions: {
			stats: formatStatsDropdown(stats),
		},
	});

	const cols = [
		getCols(["Season"])[0],
		...range(1, 11).map(
			rank =>
				({
					title: helpers.ordinal(rank),
					sortSequence: ["desc", "asc"],
					sortType: "number",
				}) as Col,
		),
	];

	const totals = statType === "totals";

	const rows = allLeaders.map(({ season, leaders, linkSeason }) => {
		return {
			key: season,
			data: [
				linkSeason ? (
					<a href={helpers.leagueUrl(["history", season])}>{season}</a>
				) : (
					season
				),
				...leaders.map(p => ({
					value: (
						<>
							<PlayerNameLabels
								pid={p.pid}
								season={season}
								watch={p.watch}
								firstName={p.firstName}
								firstNameShort={p.firstNameShort}
								lastName={p.lastName}
							/>
							<span className="ms-2">
								{helpers.roundStat(p.stat, stat, totals)}
							</span>
						</>
					),
					searchValue: `${p.firstName} ${p.lastName} (${p.stat})`,
					sortValue: p.stat,
					classNames: {
						"table-danger": p.hof,
						"table-info": p.userTeam,
					},
				})),
			],
		};
	});

	return (
		<>
			<MoreLinks
				type="leaders"
				page="leaders_years"
				playoffs={playoffs}
				season="all"
				statType={statType}
			/>
			<LeadersTopText includeHighlight noHighlightActive />

			{rows.length === 0 ? (
				<p>No data yet.</p>
			) : (
				<DataTable
					cols={cols}
					defaultSort={[0, "desc"]}
					defaultStickyCols={1}
					name="LeadersYears"
					pagination={rows.length > 100}
					rows={rows}
				/>
			)}
		</>
	);
};

export default LeadersYears;
