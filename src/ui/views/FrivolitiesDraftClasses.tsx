import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import { DataTable, PlayerNameLabels } from "../components";
import type { View } from "../../common/types";
import { frivolitiesMenu } from "./Frivolities";
import { bySport } from "../../common";

const FrivolitiesDraftClasses = ({
	challengeNoRatings,
	draftClasses,
	stats,
	userTid,
}: View<"frivolitiesDraftClasses">) => {
	useTitleBar({ title: "Draft Class Rankings", customMenu: frivolitiesMenu });

	const superCols = [
		{
			title: "",
			colspan: 7,
		},
		{
			title: "Best Player",
			colspan: 4 + stats.length,
		},
	];

	const cols = getCols([
		"#",
		"Season",
		bySport({ basketball: "stat:ws", football: "stat:av", hockey: "stat:ps" }),
		"Active",
		bySport({
			basketball: "count:allStar",
			football: "count:allLeague",
			hockey: "count:allLeague",
		}),
		"count:mvp",
		"HoF",
		"Name",
		"Pos",
		"Pick",
		"Peak Ovr",
		...stats.map(stat => `stat:${stat}`),
	]);

	const rows = draftClasses.map((draftClass, i) => {
		const p = draftClass.bestPlayer;
		const showRatings = !challengeNoRatings || p.retiredYear !== Infinity;

		return {
			key: p.pid,
			data: [
				i + 1,
				<a href={helpers.leagueUrl(["draft_history", draftClass.season])}>
					{draftClass.season}
				</a>,
				helpers.roundStat(
					draftClass.value,
					bySport({ basketball: "ws", football: "av", hockey: "ps" }),
					true,
				),
				draftClass.numActive,
				draftClass.numAS,
				draftClass.numMVP,
				draftClass.numHOF,
				{
					value: (
						<PlayerNameLabels
							jerseyNumber={p.jerseyNumber}
							pid={p.pid}
							season={p.draft.year}
						>
							{p.name}
						</PlayerNameLabels>
					),
					classNames: {
						"table-success": p.retiredYear === Infinity,
						"table-info": p.statsTids.includes(userTid),
					},
				},
				p.ratings.at(-1).pos,
				p.draft.round > 0 ? `${p.draft.round}-${p.draft.pick}` : "",
				showRatings ? p.peakOvr : null,
				...stats.map(stat => helpers.roundStat(p.careerStats[stat], stat)),
			],
		};
	});

	const pagination = rows.length > 100;

	return (
		<>
			<p>
				Players who have played for your team are{" "}
				<span className="text-info">highlighted in blue</span>. Active players
				are <span className="text-success">highlighted in green</span>.
			</p>

			<DataTable
				cols={cols}
				defaultSort={[0, "asc"]}
				name="FrivolitiesDraftClasses"
				pagination={pagination}
				rows={rows}
				superCols={superCols}
			/>
		</>
	);
};

export default FrivolitiesDraftClasses;
