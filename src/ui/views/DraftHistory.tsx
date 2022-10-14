import { Fragment, useState } from "react";
import { DataTable, DraftAbbrev, SkillsBlock, MoreLinks } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers, downloadFile, toWorker, useLocal } from "../util";
import type { View } from "../../common/types";
import { bySport, PLAYER } from "../../common";
import { wrappedAgeAtDeath } from "../components/AgeAtDeath";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels";
import orderBy from "lodash-es/orderBy";

const Summary = ({
	players,
	summaryStat,
}: {
	players: View<"draftHistory">["players"];
	summaryStat: View<"draftHistory">["summaryStat"];
}) => {
	const col = getCols([`stat:${summaryStat}`])[0];
	const statText = <span title={col.desc}>{col.title}</span>;

	const formatStat = (p: typeof players[number]) =>
		helpers.roundStat(p.careerStats[summaryStat], summaryStat);
	const formatDraft = (p: typeof players[number]) =>
		p.draft.round === 0 ? "undrafted" : `${p.draft.round}-${p.draft.pick}`;

	const firstPick = players.find(
		p => p.draft.round === 1 && p.draft.pick === 1,
	);

	const mostStat = orderBy(
		players,
		p => p.careerStats[summaryStat],
		"desc",
	).slice(0, 3);

	const summaryRows = [];

	if (firstPick) {
		summaryRows.push(
			<>
				<b>1st Pick:</b>{" "}
				<a href={helpers.leagueUrl(["player", firstPick.pid])}>
					{firstPick.firstName} {firstPick.lastName}
				</a>{" "}
				({formatStat(firstPick)} {statText})
			</>,
		);
	}

	if (mostStat.length > 0) {
		summaryRows.push(
			<>
				<b>
					Most{" "}
					{bySport({
						baseball: col.title,
						basketball: col.desc,
						football: col.desc,
						hockey: col.desc,
					})}
					:
				</b>{" "}
				{mostStat.map((p, i) => (
					<Fragment key={p.pid}>
						<a href={helpers.leagueUrl(["player", p.pid])}>
							{p.firstNameShort} {p.lastName}
						</a>{" "}
						({formatStat(p)}, {formatDraft(p)})
						{i < mostStat.length - 1 ? ", " : null}
					</Fragment>
				))}
			</>,
		);
	}

	type AwardKey = "allStar" | "mvp" | "champ" | "hof";

	const [expanded, setExpanded] = useState<AwardKey[]>([]);

	const awards: {
		key: AwardKey;
		title: string;
	}[] = [
		{
			key: "champ",
			title: "Champion",
		},
		{
			key: "allStar",
			title: "All-Star",
		},
		{
			key: "mvp",
			title: "MVP",
		},
		{
			key: "hof",
			title: "Hall of Famer",
		},
	];
	for (const { key, title } of awards) {
		const filtered = orderBy(
			players.filter(p => p.awardCounts[key] > 0),
			[p => p.awardCounts[key], p => p.careerStats[summaryStat]],
			["desc", "desc"],
		);
		const count = filtered.length;
		if (count > 0) {
			const display = expanded.includes(key)
				? filtered
				: filtered.slice(0, count === 4 ? 4 : 3);
			const excess = count - display.length;

			summaryRows.push(
				<>
					<b>
						{count} {title}
						{count > 1 ? "s" : null}:
					</b>{" "}
					{display.map((p, i) => (
						<Fragment key={p.pid}>
							<a href={helpers.leagueUrl(["player", p.pid])}>
								{p.firstNameShort} {p.lastName}
							</a>{" "}
							({key !== "hof" ? `${p.awardCounts[key]}x, ` : null}
							{formatDraft(p)}){i < display.length - 1 ? ", " : null}
						</Fragment>
					))}
					{excess > 0 ? (
						<>
							,{" "}
							<a
								href="#"
								onClick={event => {
									event.preventDefault();
									setExpanded([...expanded, key]);
								}}
							>
								{excess} more
							</a>
						</>
					) : null}
				</>,
			);
		} else {
			summaryRows.push(
				<>
					<b>0 {title}s</b>
				</>,
			);
		}
	}

	return (
		<p>
			{summaryRows.map((row, i) => (
				<Fragment key={i}>
					{i > 0 ? <br /> : null}
					{row}
				</Fragment>
			))}
		</p>
	);
};

const ExportButton = ({ season }: { season: number }) => {
	const [exporting, setExporting] = useState(false);
	return (
		<button
			className="btn btn-secondary"
			disabled={exporting}
			onClick={async () => {
				setExporting(true);

				const { filename, json } = await toWorker("main", "exportDraftClass", {
					season,
				});
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
	summaryStat,
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
				wrappedPlayerNameLabels({
					awards: p.awards,
					pid: p.pid,
					season,
					watch: p.watch,
					firstName: p.firstName,
					firstNameShort: p.firstNameShort,
					lastName: p.lastName,
				}),
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

			<Summary key={season} players={players} summaryStat={summaryStat} />

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
				defaultStickyCols={window.mobile ? 1 : 2}
				name="DraftHistory"
				rows={rows}
				superCols={superCols}
			/>
		</>
	);
};

export default DraftHistory;
