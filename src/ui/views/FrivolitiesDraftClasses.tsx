import React from "react";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import { DataTable, PlayerNameLabels } from "../components";
import type { View } from "../../common/types";
import { frivolitiesMenu } from "./Frivolities";

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
			colspan: 5,
		},
		{
			title: "Best Player",
			colspan: 4 + stats.length,
		},
	];

	const cols = getCols(
		"#",
		"Season",
		process.env.SPORT === "basketball" ? "stat:ws" : "stat:av",
		"# HoF",
		"# Active",
		"Name",
		"Pos",
		"Pick",
		"Peak Ovr",
		...stats.map(stat => `stat:${stat}`),
	);

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
					process.env.SPORT === "basketball" ? "ws" : "av",
					true,
				),
				draftClass.numHOF,
				draftClass.numActive,
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
						"table-success": p.retiredYear === Infinity,
						"table-info": p.statsTids.includes(userTid),
					},
				},
				p.ratings[p.ratings.length - 1].pos,
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
