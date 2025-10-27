import {
	DataTable,
	SkillsBlock,
	MoreLinks,
	PlusMinus,
} from "../components/index.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { getCols, helpers, useLocal } from "../util/index.ts";
import type { View } from "../../common/types.ts";
import { PLAYER } from "../../common/index.ts";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels.tsx";
import type { DataTableRow } from "../components/DataTable/index.tsx";
import { wrappedAgeAtDeath } from "../components/AgeAtDeath.tsx";
import { wrappedDraftAbbrev } from "../components/DraftAbbrev.tsx";

const DraftTeamHistory = ({
	abbrev,
	challengeNoRatings,
	draftType,
	players,
	stats,
	tid,
	userAbbrev,
}: View<"draftTeamHistory">) => {
	const noDraft = draftType === "freeAgents";

	useTitleBar({
		title: noDraft ? "Prospects Team History" : "Draft Team History",
		dropdownView: "draft_team_history",
		dropdownFields: { teamsAndYours: abbrev },
	});

	const superCols = [
		{
			title: "",
			colspan: 7,
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
		"Pre-Lottery",
		"Change",
		"Odds",
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
		...stats.map((stat) => `stat:${stat}`),
	]);

	const teamInfoCache = useLocal((state) => state.teamInfoCache);

	const rows: DataTableRow[] = players.map((p) => {
		const showRatings = !challengeNoRatings || p.currentTid === PLAYER.RETIRED;

		return {
			key: p.pid,
			metadata: {
				type: "player",
				pid: p.pid,
				season: "career",
				playoffs: "regularSeason",
			},
			data: [
				<a href={helpers.leagueUrl(["draft_history", p.draft.year])}>
					{p.draft.year}
				</a>,
				`${p.draft.round}-${p.draft.pick}`,
				p.preLotteryRank,
				p.lotteryChange !== undefined ? (
					<PlusMinus decimalPlaces={0}>{p.lotteryChange}</PlusMinus>
				) : undefined,
				p.lotteryProb !== undefined ? (
					<a href={helpers.leagueUrl(["draft_lottery", p.draft.year])}>
						{(p.lotteryProb * 100).toFixed(1)}%
					</a>
				) : undefined,
				wrappedPlayerNameLabels({
					awards: p.awards,
					jerseyNumber: p.jerseyNumber,
					pid: p.pid,
					season: p.draft.year,
					skills: p.currentSkills,
					watch: p.watch,
					firstName: p.firstName,
					firstNameShort: p.firstNameShort,
					lastName: p.lastName,
				}),
				p.pos,
				wrappedDraftAbbrev(
					{
						originalTid: p.draft.originalTid,
						tid: p.draft.tid,
					},
					teamInfoCache,
				),
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
				wrappedAgeAtDeath(p.currentAge, p.ageAtDeath),
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
				...stats.map((stat) => helpers.roundStat(p.careerStats[stat], stat)),
			],
			classNames: {
				"table-danger": p.hof,
				"table-info": p.currentAbbrev === userAbbrev,
			},
		};
	});

	return (
		<>
			<MoreLinks
				type="draft"
				page="draft_team_history"
				abbrev={abbrev}
				draftType={draftType}
				tid={tid}
			/>

			<p>
				Players currently on your team are{" "}
				<span className="text-info">highlighted in blue</span>. Players in the
				Hall of Fame are <span className="text-danger">highlighted in red</span>
				.
			</p>

			<DataTable
				cols={cols}
				defaultSort={[0, "desc"]}
				defaultStickyCols={2}
				name="DraftTeamHistory"
				rows={rows}
				superCols={superCols}
				pagination
			/>
		</>
	);
};

export default DraftTeamHistory;
