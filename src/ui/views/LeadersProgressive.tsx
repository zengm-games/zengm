import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import { DataTable, MoreLinks, PlayerNameLabels } from "../components";
import type { View } from "../../common/types";
import { LeadersTopText } from "./Leaders";
import { formatStatsDropdown } from "./LeadersYears";

const LeadersProgressive = ({
	allLeaders,
	playoffs,
	stat,
	stats,
	statType,
}: View<"leadersProgressive">) => {
	useTitleBar({
		title: "Progressive Leaders",
		dropdownView: "leaders_progressive",
		dropdownFields: {
			stats: stat,
			statTypesStrict: statType,
			playoffs,
		},
		dropdownCustomOptions: {
			stats: formatStatsDropdown(stats),
		},
	});

	const cols = getCols(
		[
			"Season",
			"Name",
			`stat:${stat}`,
			"",
			"Name",
			`stat:${stat}`,
			"",
			"Name",
			`stat:${stat}`,
			"",
			"Name",
			`stat:${stat}`,
		],
		{
			"": {
				sortSequence: [],
			},
		},
	);
	cols[1].title = "Year-by-Year";
	cols[4].title = "Active";
	cols[7].title = "Career";
	cols[10].title = "Single Season";

	const totals = statType === "totals";

	const leaderTypes = [
		"yearByYear",
		"active",
		"career",
		"singleSeason",
	] as const;

	const spacer = <div style={{ width: 20 }} />;

	const rows = allLeaders.map(({ season, ...row }) => {
		return {
			key: season,
			data: [
				<a href={helpers.leagueUrl(["history", season])}>{season}</a>,
				...leaderTypes
					.map(type => {
						const p = row[type];

						if (!p) {
							return [undefined, undefined, spacer];
						}
						return [
							{
								value: (
									<PlayerNameLabels
										pid={p.pid}
										season={season}
										watch={p.watch}
										skills={p.skills}
										jerseyNumber={p.jerseyNumber}
									>
										{p.nameAbbrev}
									</PlayerNameLabels>
								),
								classNames: {
									"table-danger": p.hof,
									"table-info": p.userTeam,
								},
							},
							{
								value: helpers.roundStat(p.stat, stat, totals),
								sortValue: p.stat,
								classNames: {
									"table-danger": p.hof,
									"table-info": p.userTeam,
								},
							},
							spacer,
						];
					})
					.flat(),
			],
		};
	});

	return (
		<>
			<MoreLinks
				type="leaders"
				page="leaders_progressive"
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
					defaultSort={[0, "asc"]}
					defaultStickyCols={1}
					name="LeadersProgressive"
					nonfluid
					pagination={rows.length > 100}
					rows={rows}
				/>
			)}
		</>
	);
};

export default LeadersProgressive;
