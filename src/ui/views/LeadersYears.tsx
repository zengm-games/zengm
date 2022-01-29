import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import {
	DataTable,
	PlayerNameLabels,
	ResponsiveTableWrapper,
} from "../components";
import type { View } from "../../common/types";
import useClickable from "../hooks/useClickable";
import classNames from "classnames";
import { bySport, isSport } from "../../common";
import { LeadersTopText } from "./Leaders";
import range from "lodash-es/range";
import type { Col } from "../components/DataTable";

const Row = ({
	cat,
	highlightActiveAndHOF,
	p,
	rank,
	season,
	totals,
}: {
	cat: View<"leaders">["categories"][number];
	p: View<"leaders">["categories"][number]["leaders"][number];
	rank: number;
	totals: boolean;
} & Pick<View<"leaders">, "highlightActiveAndHOF" | "season">) => {
	const { clicked, toggleClicked } = useClickable();

	const numericSeason =
		season === "career" ? undefined : season === "all" ? p.season : season;

	let teamUrlParts;
	if (season === "career") {
		teamUrlParts = ["team_history", `${p.abbrev}_${p.tid}`];
	} else {
		teamUrlParts = ["roster", `${p.abbrev}_${p.tid}`, numericSeason];
	}

	return (
		<tr
			className={classNames({
				"table-danger": highlightActiveAndHOF && p.hof,
				"table-success": highlightActiveAndHOF && p.retiredYear === Infinity,
				"table-info": p.userTeam,
				"table-warning": clicked,
			})}
			onClick={toggleClicked}
		>
			<td>
				<div style={{ width: 18 }} className="me-1 float-start">
					{rank}.
				</div>
				<PlayerNameLabels
					pid={p.pid}
					injury={p.injury}
					jerseyNumber={p.jerseyNumber}
					season={numericSeason}
					skills={p.skills}
					watch={p.watch}
				>
					{p.nameAbbrev}
				</PlayerNameLabels>
				<a href={helpers.leagueUrl(teamUrlParts)} className="mx-2">
					{p.abbrev}
					{p.season !== undefined ? ` ${p.season}` : null}
				</a>
				{isSport("football") || isSport("hockey") ? `${p.pos}` : null}
			</td>
			<td className="text-end">
				{cat.stat === "ws48"
					? helpers.roundWinp(p.stat)
					: helpers.roundStat(p.stat, cat.stat, totals)}
			</td>
		</tr>
	);
};

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
			stats: stats.map(stat => ({
				key: stat,
				value: getCols([`stat:${stat}`])[0].title,
			})),
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
							<a href={helpers.leagueUrl(["player", p.pid])}>{p.nameAbbrev}</a>{" "}
							({helpers.roundStat(p.stat, stat, totals)})
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
			<LeadersTopText includeHighlight noHighlightActive />

			<DataTable
				cols={cols}
				defaultSort={[0, "desc"]}
				hideAllControls
				name="LeadersYears"
				rows={rows}
			/>
		</>
	);
};

export default LeadersYears;
