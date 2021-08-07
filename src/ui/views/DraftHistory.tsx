import PropTypes from "prop-types";
import { useState } from "react";
import {
	DataTable,
	DraftAbbrev,
	SkillsBlock,
	PlayerNameLabels,
	MoreLinks,
} from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers, downloadFile, toWorker, useLocal } from "../util";
import type { View } from "../../common/types";
import { PLAYER } from "../../common";
import SeasonIcons from "./Player/SeasonIcons";

const ExportButton = ({ season }: { season: number }) => {
	const [exporting, setExporting] = useState(false);
	return (
		<button
			className="btn btn-secondary"
			disabled={exporting}
			onClick={async () => {
				setExporting(true);

				const { filename, json } = await toWorker(
					"main",
					"exportDraftClass",
					season,
				);
				downloadFile(filename, json, "application/json");

				setExporting(false);
			}}
		>
			Export draft class
		</button>
	);
};

const DraftHistory = ({
	challengeNoRatings,
	draftType,
	players,
	season,
	stats,
	userTid,
}: View<"draftHistory">) => {
	const noDraft = draftType === "freeAgents";

	useTitleBar({
		title: noDraft ? "Prospects History" : "Draft History",
		jumpTo: true,
		jumpToSeason: season,
		dropdownView: "draft_history",
		dropdownFields: { seasonsAndOldDrafts: season },
	});

	const superCols = [
		{
			title: "",
			colspan: 3,
		},
		{
			title: noDraft ? "As Prospect" : "At Draft",
			colspan: 5,
		},
		{
			title: "Current",
			colspan: 5,
		},
		{
			title: "Peak",
			colspan: 4,
		},
		{
			title: "Career Stats",
			colspan: stats.length,
		},
	];

	const cols = getCols([
		"Pick",
		"Name",
		"Pos",
		"Team",
		"Age",
		"Ovr",
		"Pot",
		"Skills",
		"Team",
		"Age",
		"Ovr",
		"Pot",
		"Skills",
		"Age",
		"Ovr",
		"Pot",
		"Skills",
		...stats.map(stat => `stat:${stat}`),
	]);

	const teamInfoCache = useLocal(state => state.teamInfoCache);

	const rows = players.map(p => {
		const showRatings = !challengeNoRatings || p.currentTid === PLAYER.RETIRED;

		return {
			key: p.pid,
			data: [
				p.draft.round >= 1 ? `${p.draft.round}-${p.draft.pick}` : null,
				{
					value: (
						<div className="d-flex">
							<PlayerNameLabels pid={p.pid} season={season} watch={p.watch}>
								{p.name}
							</PlayerNameLabels>
							<div className="ml-auto">
								<SeasonIcons className="ml-1" awards={p.awards} playoffs />
								<SeasonIcons className="ml-1" awards={p.awards} />
							</div>
						</div>
					),
					sortValue: p.name,
					searchValue: p.name,
				},
				p.pos,
				{
					searchValue: `${teamInfoCache[p.draft.tid]?.abbrev} ${
						teamInfoCache[p.draft.originalTid]?.abbrev
					}`,
					sortValue: `${p.draft.tid} ${p.draft.originalTid}`,
					value: (
						<DraftAbbrev
							originalTid={p.draft.originalTid}
							tid={p.draft.tid}
							season={season}
						/>
					),
				},
				p.draft.age,
				showRatings ? p.draft.ovr : null,
				showRatings ? p.draft.pot : null,
				<span className="skills-alone">
					<SkillsBlock skills={p.draft.skills} />
				</span>,
				<a
					href={helpers.leagueUrl([
						"roster",
						`${p.currentAbbrev}_${p.currentTid}`,
					])}
				>
					{p.currentAbbrev}
				</a>,
				p.currentAge,
				showRatings ? p.currentOvr : null,
				showRatings ? p.currentPot : null,
				<span className="skills-alone">
					<SkillsBlock skills={p.currentSkills} />
				</span>,
				p.peakAge,
				showRatings ? p.peakOvr : null,
				showRatings ? p.peakPot : null,
				<span className="skills-alone">
					<SkillsBlock skills={p.peakSkills} />
				</span>,
				...stats.map(stat => helpers.roundStat(p.careerStats[stat], stat)),
			],
			classNames: {
				"table-danger": p.hof,
				"table-info": p.draft.tid === userTid,
			},
		};
	});

	return (
		<>
			<MoreLinks
				type="draft"
				page="draft_history"
				draftType={draftType}
				season={season}
			/>

			<p>
				Players drafted by your team are{" "}
				<span className="text-info">highlighted in blue</span>. Players in the
				Hall of Fame are <span className="text-danger">highlighted in red</span>
				.
			</p>

			<ExportButton season={season} />

			<DataTable
				cols={cols}
				defaultSort={[0, "asc"]}
				name="DraftHistory"
				rows={rows}
				superCols={superCols}
			/>
		</>
	);
};

DraftHistory.propTypes = {
	draftType: PropTypes.string.isRequired,
	players: PropTypes.arrayOf(PropTypes.object).isRequired,
	season: PropTypes.number.isRequired,
	stats: PropTypes.arrayOf(PropTypes.string).isRequired,
	userTid: PropTypes.number.isRequired,
};

export default DraftHistory;
