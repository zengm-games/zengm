import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import { DataTable } from "../components";
import type { View } from "../../common/types";
import { frivolitiesMenu } from "./Frivolities";
import { bySport, PLAYER } from "../../common";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels";
import { wrappedRating } from "../components/Rating";

const FrivolitiesDraftClasses = ({
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
		bySport({
			baseball: "stat:war",
			basketball: "stat:ws",
			football: "stat:av",
			hockey: "stat:ps",
		}),
		"Active",
		"count:allStar",
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

		return {
			key: p.pid,
			data: [
				i + 1,
				<a href={helpers.leagueUrl(["draft_history", draftClass.season])}>
					{draftClass.season}
				</a>,
				helpers.roundStat(
					draftClass.value,
					bySport({
						baseball: "war",
						basketball: "ws",
						football: "av",
						hockey: "ps",
					}),
					true,
				),
				draftClass.numActive,
				draftClass.numAS,
				draftClass.numMVP,
				draftClass.numHOF,
				{
					...wrappedPlayerNameLabels({
						jerseyNumber: p.jerseyNumber,
						pid: p.pid,
						season: p.draft.year,
						firstName: p.firstName,
						firstNameShort: p.firstNameShort,
						lastName: p.lastName,
					}),
					classNames: {
						"table-success": p.tid !== PLAYER.RETIRED,
						"table-info": p.statsTids.includes(userTid),
					},
				},
				p.ratings.at(-1).pos,
				p.draft.round > 0 ? `${p.draft.round}-${p.draft.pick}` : "",
				wrappedRating({
					rating: p.peakOvr,
					tid: p.tid,
				}),
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
				defaultStickyCols={2}
				name="FrivolitiesDraftClasses"
				pagination={pagination}
				rows={rows}
				superCols={superCols}
			/>
		</>
	);
};

export default FrivolitiesDraftClasses;
