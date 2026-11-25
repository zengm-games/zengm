import { useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import useLocalStorageState from "use-local-storage-state";
import type {
	PlayerAward,
	PlayerStatAttr,
	PlayerStatsTables,
	View,
} from "../../../common/types.ts";
import { helpers } from "../../util/helpers.ts";
import { getCols } from "../../../common/getCols.ts";
import { highlightLeaderText, MaybeBold, SeasonLink } from "./common.tsx";
import { expandFieldingStats } from "../../util/expandFieldingStats.baseball.ts";
import { formatStatGameHigh } from "../PlayerStats.tsx";
import { SeasonIcons } from "../../components/SeasonIcons.tsx";
import HideableSection from "../../components/HideableSection.tsx";
import { DataTable } from "../../components/DataTable/index.tsx";
import clsx, { type ClassValue } from "clsx";
import { useRangeFooter } from "./useRangeFooter.ts";
import type { FooterRow } from "../../components/DataTable/Footer.tsx";
import { wrappedTeamAbbrevLink } from "../../components/TeamAbbrevLink.tsx";
import type { SuperCol } from "../../components/DataTable/index.tsx";
import { wrappedSeasonAwards } from "./SeasonAwards.tsx";
import { hasNonZeroStat } from "../../../common/statValue.ts";
import { useLocal } from "../../util/local.ts";
import CollapseArrow from "../../components/CollapseArrow.tsx";

const hasStats = (
	careerStats: View<"player">["player"][
		| "careerStats"
		| "careerStatsPlayoffs"
		| "careerStatsCombined"],
	onlyShowIf: PlayerStatAttr[] | undefined,
) => {
	// For careerStatPlayoffs gp is undefined if there are no stats rows, ugh
	if (careerStats.gp === 0 || careerStats.gp === undefined) {
		return false;
	}

	if (onlyShowIf !== undefined) {
		for (const stat of onlyShowIf) {
			if (hasNonZeroStat(careerStats[stat])) {
				return true;
			}
		}

		return false;
	}

	return true;
};

// Shows or hides the footer rows after the career totals, which is a single setting for all stats tables. The button covers its whole cell, which needs the stretched-link-cell class.
const ExtraRowsToggle = ({
	label,
	open,
	setOpen,
}: {
	label: ReactNode;
	open: boolean;
	setOpen: (open: boolean) => void;
}) => (
	<div className="d-flex align-items-center justify-content-between gap-2">
		{label}
		<button
			aria-expanded={open}
			className="btn btn-link p-0 border-0 text-reset stretched-link"
			onClick={(event) => {
				// This also changes the tables above this one, which would move the button, so scroll to keep it in the same place on screen. This is just needed for the case where two tables are visible on the screen, otherwise browsers handle it fine if there's only one visible.
				const button = event.currentTarget;
				const prevTop = button.getBoundingClientRect().top;
				flushSync(() => {
					setOpen(!open);
				});
				window.scrollBy(0, button.getBoundingClientRect().top - prevTop);
			}}
			title={open ? "Hide more career totals" : "Show more career totals"}
			type="button"
		>
			<CollapseArrow closedDirection="left" open={open} />
		</button>
	</div>
);

export const StatsTable = ({
	awardsBySeason,
	careerStatsScaled,
	name,
	onlyShowIf,
	p,
	stats,
	superCols,
	leaders,
}: {
	awardsBySeason: Map<number, PlayerAward[]>;
	careerStatsScaled:
		| View<"player">["player"]["careerStatsScaled"][string]
		| undefined;
	name: string;
	onlyShowIf?: PlayerStatAttr[];
	p: View<"player">["player"];
	stats: PlayerStatsTables[string]["stats"];
	superCols?: SuperCol[];
	leaders: View<"player">["leaders"];
}) => {
	const { numGames } = useLocal(["numGames"]);

	const [showExtraRows, setShowExtraRows] = useLocalStorageState(
		"show-player-stats-extra-footer-rows",
		{
			defaultValue: true,
		},
	);

	const hasRegularSeasonStats = hasStats(p.careerStats, onlyShowIf);
	const hasPlayoffStats = hasStats(p.careerStatsPlayoffs, onlyShowIf);

	// Show playoffs by default if that's all we have
	const [playoffs, setPlayoffs] = useState<boolean | "combined">(
		!hasRegularSeasonStats,
	);

	// If game sim means we switch from having no stats to having some stats, make sure we're showing what we have
	if (hasRegularSeasonStats && !hasPlayoffStats && playoffs === true) {
		setPlayoffs(false);
	}
	if (!hasRegularSeasonStats && hasPlayoffStats && playoffs === false) {
		setPlayoffs(true);
	}

	let playerStats = p.stats.filter((ps) => ps.playoffs === playoffs);

	const rangeFooter = useRangeFooter(p.pid, playerStats);

	if (!hasRegularSeasonStats && !hasPlayoffStats) {
		return null;
	}

	const seasonType =
		playoffs === "combined"
			? "combined"
			: playoffs === true
				? "playoffs"
				: "regularSeason";

	const careerStats =
		playoffs === "combined"
			? p.careerStatsCombined
			: playoffs
				? p.careerStatsPlayoffs
				: p.careerStats;

	const cols = getCols([
		"Year",
		"Team",
		"Age",
		...stats.map((stat) =>
			stat === "pos"
				? "Pos"
				: `stat:${stat.endsWith("Max") ? stat.replace("Max", "") : stat}`,
		),
		"Awards",
	]);

	if (superCols) {
		superCols = helpers.deepCopy(superCols);

		// No name
		if (superCols[0]) {
			superCols[0].colspan -= 1;
		}
	}

	if (__SPORT === "basketball" && name === "Shot Locations") {
		cols.at(-3)!.title = "M";
		cols.at(-2)!.title = "A";
		cols.at(-1)!.title = "%";
	}

	const isBaseballFielding = __SPORT === "baseball" && name === "Fielding";

	const careerLabel = `${rangeFooter.state.seasons.length} ${helpers.plural("year", rangeFooter.state.seasons.length)}`;

	// Label spanning the year, team, and age columns
	const spanningLabel = (
		label: ReactNode,
		classNames?: ClassValue,
	): FooterRow["data"] => [
		{ value: label, classNames, colspan: 3 },
		null,
		null,
	];

	let footer: FooterRow[];
	if (isBaseballFielding) {
		playerStats = expandFieldingStats({
			rows: playerStats,
			stats,
		});

		footer = expandFieldingStats({
			rows: [careerStats],
			stats,
			addDummyPosIndex: true,
		}).map((object, i) => ({
			data: [
				...(i === 0 ? spanningLabel(careerLabel) : [null, null, null]),
				...stats.map((stat) => formatStatGameHigh(object, stat)),
				null,
			],
		}));
	} else {
		const getFooterRow = (
			label: FooterRow["data"],
			row: Record<string, unknown>,
		): FooterRow => ({
			data: [
				...label,
				...stats.map((stat) => formatStatGameHigh(row, stat)),
				null,
			],
		});

		// Rows after the career totals, which can be hidden
		const extraRows: FooterRow[] = [];

		if (careerStatsScaled) {
			extraRows.push(
				getFooterRow(
					spanningLabel(`${numGames} game avg`),
					careerStatsScaled[seasonType],
				),
			);
		}

		// Totals for each team are redundant with the career totals if there is only one team
		const careerStatsByTeam = p.careerStatsByTeam[seasonType];
		if (careerStatsByTeam.length > 1) {
			for (const team of careerStatsByTeam) {
				extraRows.push(
					getFooterRow(
						spanningLabel(
							`${team.abbrev} (${team.numSeasons} ${helpers.plural("year", team.numSeasons)})`,
						),
						team.stats,
					),
				);
			}
		}

		footer = [
			getFooterRow(
				extraRows.length > 0
					? spanningLabel(
							<ExtraRowsToggle
								label={careerLabel}
								open={showExtraRows}
								setOpen={setShowExtraRows}
							/>,
							"stretched-link-cell",
						)
					: spanningLabel(careerLabel),
				careerStats,
			),
			...(showExtraRows ? extraRows : []),
		];

		const rangeFooterState = rangeFooter.state;
		if (
			rangeFooterState.type === "open" ||
			rangeFooterState.type === "loading" ||
			rangeFooterState.type === "error"
		) {
			const rangeStatsValues: any[] = ([0, 1] as const).map((i) => {
				return {
					classNames: "p-0",
					value: (
						<select
							key={i}
							className={clsx(
								"form-select form-select-sm rounded-0",
								i === 0 ? "rounded-start-1" : "rounded-end-1",
							)}
							value={rangeFooterState.seasonRange[i]}
							onChange={(event) => {
								const value = Number.parseInt(event.target.value);
								const newSeasonRange: [number, number] = [
									...rangeFooterState.seasonRange,
								];
								newSeasonRange[i] = value;

								if (i === 0 && newSeasonRange[1] < newSeasonRange[0]) {
									newSeasonRange[1] = newSeasonRange[0];
								} else if (i === 1 && newSeasonRange[1] < newSeasonRange[0]) {
									newSeasonRange[0] = newSeasonRange[1];
								}

								rangeFooter.setSeasonRange(newSeasonRange);
							}}
						>
							{rangeFooterState.seasons.map((season) => (
								<option key={season} value={season}>
									{season}
								</option>
							))}
						</select>
					),
				};
			});
			rangeStatsValues.push(
				rangeFooterState.type === "error" ? (
					<span className="glyphicon glyphicon-exclamation-sign text-danger" />
				) : null,
			);
			if (
				(rangeFooterState.type === "open" ||
					rangeFooterState.type === "loading" ||
					rangeFooterState.type === "error") &&
				rangeFooterState.p
			) {
				const rangeStats =
					playoffs === "combined"
						? rangeFooterState.p.careerStatsCombined
						: playoffs
							? rangeFooterState.p.careerStatsPlayoffs
							: rangeFooterState.p.careerStats;

				rangeStatsValues.push(
					...stats.map((stat) => formatStatGameHigh(rangeStats, stat)),
				);
			}

			footer.push({
				classNames:
					rangeFooterState.type === "loading"
						? "text-body-secondary"
						: undefined,
				data: rangeStatsValues,
			});
		}
	}

	let hasLeader = false;
	LEADERS_LOOP: for (const row of Object.values(leaders)) {
		if (row?.attrs.has("age")) {
			hasLeader = true;
			break;
		}

		for (const stat of stats) {
			if (row?.[seasonType].has(stat)) {
				hasLeader = true;
				break LEADERS_LOOP;
			}
		}
	}

	const rows = [];

	let prevSeason;
	for (const [i, ps] of playerStats.entries()) {
		// Add blank rows for gap years if necessary
		if (prevSeason !== undefined && prevSeason < ps.season - 1) {
			const gapSeason = prevSeason + 1;

			rows.push({
				key: `gap-${gapSeason}`,
				data: [
					{
						searchValue: gapSeason,

						// i is used to index other sorts, so we need to fit in between
						sortValue: i - 0.5,

						value: null,
					},
					null,
					null,
					...stats.map(() => null),
				],
				classNames: "table-secondary",
			});
		}

		prevSeason = ps.season;

		const className = ps.hasTot ? "text-body-secondary" : undefined;

		rows.push({
			key: i,
			data: [
				{
					searchValue: ps.season,
					sortValue: i,
					value: (
						<>
							<SeasonLink
								className={className}
								pid={p.pid}
								season={ps.season}
							/>{" "}
							<SeasonIcons
								season={ps.season}
								awards={p.awards}
								playoffs={playoffs === true}
							/>
						</>
					),
				},
				wrappedTeamAbbrevLink({
					abbrev: ps.abbrev,
					className,
					season: ps.season,
					tid: ps.tid,
				}),
				<MaybeBold bold={leaders[ps.season]?.attrs.has("age")}>
					{ps.age}
				</MaybeBold>,
				...stats.map((stat) => (
					<MaybeBold
						bold={!ps.hasTot && leaders[ps.season]?.[seasonType].has(stat)}
					>
						{formatStatGameHigh(ps, stat)}
					</MaybeBold>
				)),
				ps.hasTot
					? undefined
					: wrappedSeasonAwards({
							awards: awardsBySeason.get(ps.season),
							season: ps.season,
						}),
			],
			classNames: className,
		});
	}

	const showSelectSeasonRangeButton =
		rangeFooter.state.type === "closed" && !isBaseballFielding;

	return (
		<HideableSection
			title={name}
			description={hasLeader ? highlightLeaderText : null}
		>
			<DataTable
				classNameWrapper={showSelectSeasonRangeButton ? "mb-2" : "mb-3"}
				cols={cols}
				defaultSort={[0, "asc"]}
				defaultStickyCols={2}
				footer={footer}
				hideAllControls
				name={`Player:${name}`}
				rows={rows}
				superCols={superCols}
				title={
					<ul className="nav nav-tabs border-bottom-0">
						{hasRegularSeasonStats ? (
							<li className="nav-item">
								<button
									className={clsx("nav-link", {
										active: playoffs === false,
										"border-bottom": playoffs === false,
									})}
									onClick={() => {
										setPlayoffs(false);
									}}
								>
									Regular Season
								</button>
							</li>
						) : null}
						{hasPlayoffStats ? (
							<li className="nav-item">
								<button
									className={clsx("nav-link", {
										active: playoffs === true,
										"border-bottom": playoffs === true,
									})}
									onClick={() => {
										setPlayoffs(true);
									}}
								>
									Playoffs
								</button>
							</li>
						) : null}
						{hasRegularSeasonStats && hasPlayoffStats ? (
							<li className="nav-item">
								<button
									className={clsx("nav-link", {
										active: playoffs === "combined",
										"border-bottom": playoffs === "combined",
									})}
									onClick={() => {
										setPlayoffs("combined");
									}}
								>
									Combined
								</button>
							</li>
						) : null}
					</ul>
				}
			/>
			{showSelectSeasonRangeButton ? (
				<button
					className="btn btn-sm btn-secondary mb-3"
					onClick={rangeFooter.onOpen}
				>
					Select season range
				</button>
			) : null}
		</HideableSection>
	);
};
