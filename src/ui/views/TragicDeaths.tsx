import useTitleBar from "../hooks/useTitleBar.tsx";
import { getCols, helpers } from "../util/index.ts";
import { DataTable, SafeHtml } from "../components/index.tsx";
import type { View } from "../../common/types.ts";
import { frivolitiesMenu } from "./Frivolities.tsx";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels.tsx";
import type { DataTableRow } from "../components/DataTable/index.tsx";

const TragicDeaths = ({ players, stats, userTid }: View<"tragicDeaths">) => {
	useTitleBar({ title: "Tragic Deaths", customMenu: frivolitiesMenu });

	const superCols = [
		{
			title: "",
			colspan: 5,
		},
		{
			title: "At Death",
			colspan: 4,
		},
		{
			title: "Last Season",
			colspan: stats.length,
		},
		{
			title: "Career Stats",
			colspan: stats.length,
		},
		{
			title: "",
			colspan: 1,
		},
	];

	const cols = getCols([
		"Name",
		"Pos",
		"Drafted",
		"Pick",
		"Peak Ovr",
		"Ovr",
		"Team",
		"Year",
		"Age",
		...stats.map((stat) => `stat:${stat}`),
		...stats.map((stat) => `stat:${stat}`),
		"Details",
	]);

	const rows: DataTableRow[] = players.map((p, i) => {
		const lastRatings = p.ratings.at(-1);
		const lastStats = p.stats.at(-1);

		return {
			key: i,
			metadata: {
				type: "player",
				pid: p.pid,
				season: lastRatings.season,
				playoffs: "regularSeason",
			},
			data: [
				wrappedPlayerNameLabels({
					pid: p.pid,
					firstName: p.firstName,
					firstNameShort: p.firstNameShort,
					lastName: p.lastName,
				}),
				lastRatings.pos,
				p.draft.year,
				p.draft.round > 0 ? `${p.draft.round}-${p.draft.pick}` : "",
				p.peakOvr,
				lastRatings.ovr,
				<a
					href={helpers.leagueUrl([
						"roster",
						`${lastStats.abbrev}_${lastStats.tid}`,
						p.diedYear,
					])}
				>
					{lastStats.abbrev}
				</a>,
				p.diedYear,
				p.ageAtDeath,
				...stats.map((stat) =>
					lastStats ? helpers.roundStat(lastStats[stat], stat) : null,
				),
				...stats.map((stat) => helpers.roundStat(p.careerStats[stat], stat)),
				<SafeHtml dirty={p.details} />,
			],
			classNames: {
				"table-danger": p.hof,
				"table-info": p.statsTids
					.slice(0, p.statsTids.length - 1)
					.includes(userTid),
				"table-success": p.statsTids.at(-1) === userTid,
			},
		};
	});

	return (
		<>
			<p>
				Players who played for your team are{" "}
				<span className="text-info">highlighted in blue</span>. Players who died
				while on your team are{" "}
				<span className="text-success">highlighted in green</span>. Hall of
				Famers are <span className="text-danger">highlighted in red</span>.
			</p>

			<DataTable
				cols={cols}
				defaultSort={[4, "desc"]}
				defaultStickyCols={window.mobile ? 0 : 1}
				name="TragicDeaths"
				pagination
				rows={rows}
				superCols={superCols}
			/>
		</>
	);
};

export default TragicDeaths;
