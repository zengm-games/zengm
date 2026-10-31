import clsx from "clsx";
import { useEffect, useState } from "react";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { helpers } from "../util/helpers.ts";
import { getCols } from "../../common/getCols.ts";
import { DataTable } from "../components/DataTable/index.tsx";
import type { View } from "../../common/types.ts";
import type { TitleOdds } from "../../worker/core/team/getTitleOdds.ts";
import { POMYMARKET_NAME, POSITIONS, RATINGS } from "../../common/constants.ts";
import { formatTitleOdds } from "../../common/winProbability.ts";
import { wrappedMovOrDiff } from "../components/MovOrDiff.tsx";
import { wrappedTeamLogoAndName } from "../components/TeamLogoAndName.tsx";
import { bySport } from "../../common/sportFunctions.ts";
import { useLocal } from "../util/local.ts";
import { toWorker } from "../util/toWorker.ts";

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

const TitleOddsCell = ({
	dimmed,
	prob,
	text,
}: {
	dimmed: boolean;
	prob: number | undefined;
	text: string;
}) => {
	return (
		<div className={clsx({ "text-body-secondary": dimmed })}>
			{text}
			{prob ? (
				<div
					className="bg-success"
					style={{ height: 2, width: `${prob * 100}%` }}
				/>
			) : null}
		</div>
	);
};

const PowerRankings = ({
	confs,
	divs,
	playoffs,
	season,
	teams,
	ties,
	titleOddsAvailable,
	otl,
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

	const {
		challengeNoRatings,
		gameSimInProgress,
		phase,
		pomymarket,
		season: currentSeason,
		userTid,
	} = useLocal([
		"challengeNoRatings",
		"gameSimInProgress",
		"phase",
		"pomymarket",
		"season",
		"userTid",
	]);

	const [showHealthy, setShowHealthy] = useState(true);
	const actualShowHealthy = showHealthy || currentSeason !== season;

	const showTitleOdds = titleOddsAvailable && pomymarket;

	// undefined means still loading, and null means there are no odds to show
	const [titleOdds, setTitleOdds] = useState<TitleOdds | null>();

	// Not in the worker view, because that runs after every day of a sim. phase is here because the sim ends before the phase changes to the playoffs.
	useEffect(() => {
		if (!showTitleOdds || gameSimInProgress) {
			return;
		}

		let stale = false;
		const load = async () => {
			let newTitleOdds;
			try {
				newTitleOdds = await toWorker("main", "getTitleOdds", undefined);
			} catch (error) {
				console.error(error);
			}
			if (!stale) {
				setTitleOdds(newTitleOdds ?? null);
			}
		};
		load();

		return () => {
			stale = true;
		};
	}, [currentSeason, gameSimInProgress, phase, showTitleOdds]);

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
		...(showTitleOdds ? [{ title: POMYMARKET_NAME, colspan: 1 }] : []),
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
		...(showTitleOdds ? ["Title Odds"] : []),
		"W",
		"L",
		...(otl ? ["OTL"] : []),
		...(ties ? ["T"] : []),
		"L10",
		`stat:${__SPORT === "basketball" ? "mov" : "diff"}`,
		"AvgAge",
		...otherKeys.map((key) => `${otherKeysPrefix}:${key}`),
	];

	const cols = getCols(colNames);

	if (__SPORT === "basketball") {
		for (const [colName, col] of Iterator.zip([colNames, cols], {
			mode: "strict",
		})) {
			if (colName.startsWith("rating:")) {
				col.sortSequence = ["asc", "desc"];
			}
		}
	}

	const getTitleOddsCell = (tid: number, rank: number) => {
		const odds = titleOdds?.[tid];
		const text = odds
			? formatTitleOdds(odds.prob, odds.resolved)
			: titleOdds === undefined
				? "..."
				: "N/A";

		return {
			value: (
				<TitleOddsCell
					dimmed={gameSimInProgress}
					prob={odds?.prob}
					text={text}
				/>
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
				...(showTitleOdds
					? [getTitleOddsCell(t.tid, t.powerRankings.rank)]
					: []),
				t.seasonAttrs.won,
				t.seasonAttrs.lost,
				...(otl ? [t.seasonAttrs.otl] : []),
				...(ties ? [t.seasonAttrs.tied] : []),
				t.seasonAttrs.lastTen,
				wrappedMovOrDiff(
					__SPORT === "basketball"
						? {
								pts: t.stats.pts * t.stats.gp,
								oppPts: t.stats.oppPts * t.stats.gp,
								gp: t.stats.gp,
							}
						: t.stats,
					__SPORT === "basketball" ? "mov" : "diff",
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
				name={showTitleOdds ? "PowerRankingsTitleOdds" : "PowerRankings"}
				nonfluid
				rows={rows}
				superCols={superCols}
			/>
		</>
	);
};

export default PowerRankings;
