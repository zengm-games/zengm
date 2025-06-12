import { useState } from "react";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { getCols, helpers } from "../util/index.ts";
import { DataTable } from "../components/index.tsx";
import type { View } from "../../common/types.ts";
import { bySport, isSport, POSITIONS, RATINGS } from "../../common/index.ts";
import { wrappedMovOrDiff } from "../components/MovOrDiff.tsx";
import { wrappedTeamLogoAndName } from "../components/TeamLogoAndName.tsx";

const Other = ({
	actualShowHealthy,
	current,
	healthy,
}: {
	actualShowHealthy: boolean;
	current: number;
	healthy: number;
}) => {
	if (actualShowHealthy || current === healthy) {
		return <>{healthy}</>;
	}

	return (
		<>
			<span className={healthy > current ? "text-success" : "text-danger"}>
				{current}
			</span>
		</>
	);
};

const PowerRankings = ({
	challengeNoRatings,
	confs,
	currentSeason,
	divs,
	playoffs,
	season,
	teams,
	ties,
	otl,
	userTid,
}: View<"powerRankings">) => {
	const dropdownFields = bySport({
		basketball: { seasons: season, playoffs },
		default: { seasons: season },
	}) as { seasons: number; playoffs: string } | { seasons: number };

	useTitleBar({
		title: "Power Rankings",
		dropdownView: "power_rankings",
		dropdownFields,
	});

	const [showHealthy, setShowHealthy] = useState(true);
	const actualShowHealthy = showHealthy || currentSeason !== season;

	const [otherKeys, otherKeysTitle, otherKeysPrefix] = bySport({
		baseball: [
			POSITIONS.filter((pos) => pos !== "DH"),
			"Position Ranks",
			"pos",
		],
		basketball: [RATINGS, "Rating Ranks", "rating"],
		football: [
			POSITIONS.filter((pos) => pos !== "KR" && pos !== "PR"),
			"Position Ranks",
			"pos",
		],
		hockey: [POSITIONS, "Position Ranks", "pos"],
	});

	const superCols = [
		{
			title: "",
			colspan: 4,
		},
		{
			title: "Team Rating",
			colspan: 2,
		},
		{
			title: "",
			colspan: 5 + (ties ? 1 : 0) + (otl ? 1 : 0),
		},
		{
			title: (
				<>
					{otherKeysTitle}
					{currentSeason === season ? (
						<a
							className="ms-2"
							href=""
							onClick={(event) => {
								event.preventDefault();
								setShowHealthy((val) => !val);
							}}
						>
							{showHealthy ? "(Show with injuries)" : "(Show without injuries)"}
						</a>
					) : null}
				</>
			),
			colspan: otherKeys.length,
		},
	];

	const colNames = [
		"#",
		"Team",
		"Conference",
		"Division",
		"Current",
		"Healthy",
		"W",
		"L",
		...(otl ? ["OTL"] : []),
		...(ties ? ["T"] : []),
		"L10",
		`stat:${isSport("basketball") ? "mov" : "diff"}`,
		"AvgAge",
		...otherKeys.map((key) => `${otherKeysPrefix}:${key}`),
	];

	const cols = getCols(colNames);

	if (isSport("basketball")) {
		for (const [i, colName] of colNames.entries()) {
			if (colName.startsWith("rating:")) {
				cols[i]!.sortSequence = ["asc", "desc"];
			}
		}
	}

	const rows = teams.map((t) => {
		const conf = confs.find((conf) => conf.cid === t.seasonAttrs.cid);
		const div = divs.find((div) => div.did === t.seasonAttrs.did);

		return {
			key: t.tid,
			data: [
				t.powerRankings.rank,
				wrappedTeamLogoAndName(
					t,
					helpers.leagueUrl([
						"roster",
						`${t.seasonAttrs.abbrev}_${t.tid}`,
						season,
					]),
				),
				conf ? conf.name.replace(" Conference", "") : null,
				div ? div.name : null,
				!challengeNoRatings ? (
					t.powerRankings.ovr !== t.powerRankings.ovrCurrent ? (
						<span className="text-danger">{t.powerRankings.ovrCurrent}</span>
					) : (
						t.powerRankings.ovrCurrent
					)
				) : null,
				!challengeNoRatings ? t.powerRankings.ovr : null,
				t.seasonAttrs.won,
				t.seasonAttrs.lost,
				...(otl ? [t.seasonAttrs.otl] : []),
				...(ties ? [t.seasonAttrs.tied] : []),
				t.seasonAttrs.lastTen,
				wrappedMovOrDiff(
					isSport("basketball")
						? {
								pts: t.stats.pts * t.stats.gp,
								oppPts: t.stats.oppPts * t.stats.gp,
								gp: t.stats.gp,
							}
						: t.stats,
					isSport("basketball") ? "mov" : "diff",
				),
				t.powerRankings.avgAge?.toFixed(1),
				...otherKeys.map((key) => ({
					value: (
						<Other
							actualShowHealthy={actualShowHealthy}
							current={t.powerRankings.otherCurrent[key]!}
							healthy={t.powerRankings.other[key]!}
						/>
					),
					searchValue: actualShowHealthy
						? t.powerRankings.other[key]
						: t.powerRankings.otherCurrent[key],
					sortValue: actualShowHealthy
						? t.powerRankings.other[key]
						: t.powerRankings.otherCurrent[key],
				})),
			],
			classNames: {
				"table-info": t.tid === userTid,
			},
		};
	});

	return (
		<>
			<p>
				The power ranking is a combination of recent performance, margin of
				victory, and team rating. Team rating is based only on the ratings of
				players on each team.
			</p>
			{playoffs === "playoffs" && isSport("basketball") ? (
				<p>
					In the playoffs, rotations get shorter and players play harder, so
					some teams get higher or lower ratings.
				</p>
			) : null}

			<DataTable
				cols={cols}
				defaultSort={[0, "asc"]}
				defaultStickyCols={2}
				name="PowerRankings"
				nonfluid
				rows={rows}
				superCols={superCols}
			/>
		</>
	);
};

export default PowerRankings;
