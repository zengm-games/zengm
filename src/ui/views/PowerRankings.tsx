import { useState } from "react";
import { dropdownOptions } from "../hooks/useDropdownOptions.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { helpers } from "../util/helpers.ts";
import { getCols } from "../../common/getCols.ts";
import { DataTable } from "../components/DataTable/index.tsx";
import type { View } from "../../common/types.ts";
import type { TeamOdds } from "../../worker/core/team/getTeamOdds.ts";
import { POSITIONS, RATINGS } from "../../common/constants.ts";
import { formatOdds } from "../../common/gamePrediction.ts";
import { TextUnderlineBar } from "../components/TextUnderlineBar.tsx";
import {
	teamMovOrDiffStat,
	wrappedTeamMovOrDiff,
} from "../components/MovOrDiff.tsx";
import { wrappedTeamLogoAndName } from "../components/TeamLogoAndName.tsx";
import { bySport } from "../../common/sportFunctions.ts";
import { useLocal } from "../util/local.ts";

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
	confs,
	divs,
	playoffs,
	season,
	teams,
	ties,
	teamOdds,
	teamOddsAvailable,
	otl,
}: View<"powerRankings">) => {
	useTitleBar({
		title: "Power Rankings",
		dropdown: {
			view: "powerRankings",
			fields: [
				{ key: "season", options: { type: "seasons" }, value: season },
				...(__SPORT === "basketball"
					? [
							{
								key: "playoffs",
								options: dropdownOptions.playoffs,
								value: playoffs,
							} as const,
						]
					: []),
			],
		},
	});

	const {
		challengeNoRatings,
		season: currentSeason,
		userTid,
	} = useLocal(["challengeNoRatings", "season", "userTid"]);

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
		...(teamOddsAvailable ? [{ title: "Odds", colspan: 2 }] : []),
		{
			title: "",
			colspan: 5 + (ties ? 1 : 0) + (otl ? 1 : 0),
		},
		{
			title: (
				<>
					{otherKeysTitle}
					{currentSeason === season ? (
						<button
							type="button"
							className="btn btn-link p-0 border-0 align-baseline fw-bold ms-2"
							onClick={() => {
								setShowHealthy((val) => !val);
							}}
						>
							{showHealthy ? "(Show with injuries)" : "(Show without injuries)"}
						</button>
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
		...(teamOddsAvailable ? ["Playoff Odds", "Title Odds"] : []),
		"W",
		"L",
		...(otl ? ["OTL"] : []),
		...(ties ? ["T"] : []),
		"L10",
		`stat:${teamMovOrDiffStat}`,
		"AvgAge",
		...otherKeys.map((key) => `${otherKeysPrefix}:${key}`),
	];

	// The "Odds" super column already says what these are
	const cols = getCols(colNames, {
		"Playoff Odds": { title: "Playoffs" },
		"Title Odds": { title: "Title" },
	});

	if (__SPORT === "basketball") {
		for (const [colName, col] of Iterator.zip([colNames, cols], {
			mode: "strict",
		})) {
			if (colName.startsWith("rating:")) {
				col.sortSequence = ["asc", "desc"];
			}
		}
	}

	const getOddsCell = (
		tid: number,
		rank: number,
		type: keyof TeamOdds[number],
	) => {
		const odds = teamOdds?.[tid]?.[type];
		const text = odds ? formatOdds(odds.prob, odds.resolved) : "N/A";

		return {
			value: (
				<TextUnderlineBar
					barClassName="bg-success"
					percent={(odds?.prob ?? 0) * 100}
				>
					{text}
				</TextUnderlineBar>
			),
			searchValue: text,

			// Rank is the tiebreaker. Teams with no odds sort below any real value.
			sortValue: (odds?.prob ?? -1) - rank * 1e-6,
		};
	};

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
				...(teamOddsAvailable
					? [
							getOddsCell(t.tid, t.powerRankings.rank, "playoffs"),
							getOddsCell(t.tid, t.powerRankings.rank, "title"),
						]
					: []),
				t.seasonAttrs.won,
				t.seasonAttrs.lost,
				...(otl ? [t.seasonAttrs.otl] : []),
				...(ties ? [t.seasonAttrs.tied] : []),
				t.seasonAttrs.lastTen,
				wrappedTeamMovOrDiff(t.stats),
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
			{playoffs === "playoffs" && __SPORT === "basketball" ? (
				<p>
					In the playoffs, rotations get shorter and players play harder, so
					some teams get higher or lower ratings.
				</p>
			) : null}

			<DataTable
				cols={cols}
				defaultSort={[0, "asc"]}
				defaultStickyCols={2}
				name={teamOddsAvailable ? "PowerRankingsOdds" : "PowerRankings"}
				nonfluid
				rows={rows}
				superCols={superCols}
			/>
		</>
	);
};

export default PowerRankings;
