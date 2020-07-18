import PropTypes from "prop-types";
import React from "react";
import { DataTable, DraftAbbrev, SkillsBlock } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers, useLocal } from "../util";
import type { View } from "../../common/types";
import { PLAYER } from "../../common";

const DraftTeamHistory = ({
	abbrev,
	challengeNoRatings,
	draftType,
	players,
	stats,
	userAbbrev,
}: View<"draftTeamHistory">) => {
	useTitleBar({
		title: "Draft History",
		dropdownView: "draft_team_history",
		dropdownFields: { teams: abbrev },
	});

	const superCols = [
		{
			title: "",
			colspan: 4,
		},
		{
			title: "At Draft",
			colspan: 5,
		},
		{
			title: "Current",
			colspan: 5,
		},
		{
			title: "Career Stats",
			colspan: 7,
		},
	];

	const cols = getCols(
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
		...stats.map(stat => `stat:${stat}`),
	);

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
				<a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a>,
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
			<p>
				More:{" "}
				<a href={helpers.leagueUrl(["draft_scouting"])}>
					Future Draft Scouting
				</a>{" "}
				|{" "}
				{draftType !== "noLottery" && draftType !== "random" ? (
					<>
						<a href={helpers.leagueUrl(["draft_lottery"])}>Draft Lottery</a> |{" "}
					</>
				) : null}
				<a href={helpers.leagueUrl(["draft_history"])}>Draft History</a>
			</p>

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
	draftType: PropTypes.oneOf(["nba1994", "nba2019", "noLottery", "random"]),
	players: PropTypes.arrayOf(PropTypes.object).isRequired,
	stats: PropTypes.arrayOf(PropTypes.string).isRequired,
	userAbbrev: PropTypes.string.isRequired,
};

export default DraftTeamHistory;
