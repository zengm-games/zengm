import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import { DataTable, MoreLinks, PlayerNameLabels } from "../components";
import type { View } from "../../common/types";
import { LeadersTopText } from "./Leaders";
import range from "lodash-es/range";
import type { Col } from "../components/DataTable";
import { makeNormalResponsive } from "../hooks/useDropdownOptions";

const LeadersYears = ({
	allLeaders,
	playoffs,
	stat,
	stats,
	statType,
}: View<"leadersYears">) => {
	useTitleBar({
		title: "Year-By-Year Leaders",
		dropdownView: "leaders_years",
		dropdownFields: {
			stats: stat,
			statTypesStrict: statType,
			playoffs,
		},
		dropdownCustomOptions: {
			stats: stats.map(stat => {
				const col = getCols([`stat:${stat}`])[0];
				return {
					key: stat,
					value: col.desc
						? makeNormalResponsive(col.title, col.desc)
						: col.title,
				};
			}),
		},
	});

	const col = getCols([`stat:${stat}`])[0];

	console.log("allLeaders", allLeaders, col);

	const cols = [
		getCols(["Season"])[0],
		...range(1, 11).map(
			rank =>
				({
					title: helpers.ordinal(rank),
					sortSequence: ["desc", "asc"],
					sortType: "number",
				} as Col),
		),
	];

	const totals = statType === "totals";

	const rows = allLeaders.map(({ season, leaders }) => {
		return {
			key: season,
			data: [
				<a href={helpers.leagueUrl(["history", season])}>{season}</a>,
				...leaders.map(p => ({
					value: (
						<>
							<PlayerNameLabels pid={p.pid} season={season} watch={p.watch}>
								{p.nameAbbrev}
							</PlayerNameLabels>
							<span className="ms-2">
								{helpers.roundStat(p.stat, stat, totals)}
							</span>
						</>
					),
					searchValue: `${p.nameAbbrev} (${p.stat})`,
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

			<DataTable
				cols={cols}
				defaultSort={[0, "desc"]}
				name="LeadersYears"
				rows={rows}
			/>
		</>
	);
};

export default LeadersYears;
