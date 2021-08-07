import PropTypes from "prop-types";
import {
	DataTable,
	DraftAbbrev,
	SkillsBlock,
	PlayerNameLabels,
	MoreLinks,
} from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers, useLocal } from "../util";
import type { View } from "../../common/types";
import { PLAYER } from "../../common";
import SeasonIcons from "./Player/SeasonIcons";

const DraftTeamHistory = ({
	abbrev,
	challengeNoRatings,
	draftType,
	players,
	stats,
	userAbbrev,
}: View<"draftTeamHistory">) => {
	const noDraft = draftType === "freeAgents";

	useTitleBar({
		title: noDraft ? "Prospects History" : "Draft History",
		dropdownView: "draft_team_history",
		dropdownFields: { teamsAndYours: abbrev },
	});

	const superCols = [
		{
			title: "",
			colspan: 4,
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
		"Season",
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
				<a href={helpers.leagueUrl(["draft_history", p.draft.year])}>
					{p.draft.year}
				</a>,
				`${p.draft.round}-${p.draft.pick}`,
				{
					value: (
						<div className="d-flex">
							<PlayerNameLabels
								jerseyNumber={p.jerseyNumber}
								pid={p.pid}
								season={p.draft.year}
								skills={p.currentSkills}
								watch={p.watch}
							>
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
							season={p.draft.year}
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
				"table-info": p.currentAbbrev === userAbbrev,
			},
		};
	});

	return (
		<>
			<MoreLinks type="draft" page="draft_team_history" draftType={draftType} />

			<p>
				Players currently on your team are{" "}
				<span className="text-info">highlighted in blue</span>. Players in the
				Hall of Fame are <span className="text-danger">highlighted in red</span>
				.
			</p>

			<DataTable
				cols={cols}
				defaultSort={[0, "desc"]}
				name="DraftTeamHistory"
				rows={rows}
				superCols={superCols}
				pagination
			/>
		</>
	);
};

DraftTeamHistory.propTypes = {
	abbrev: PropTypes.string.isRequired,
	draftType: PropTypes.string.isRequired,
	players: PropTypes.arrayOf(PropTypes.object).isRequired,
	stats: PropTypes.arrayOf(PropTypes.string).isRequired,
	userAbbrev: PropTypes.string.isRequired,
};

export default DraftTeamHistory;
