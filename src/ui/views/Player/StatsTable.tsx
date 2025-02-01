import { useState } from "react";
import type { View } from "../../../common/types";
import { getCols, helpers } from "../../util";
import { isSport } from "../../../common";
import { highlightLeaderText, MaybeBold, SeasonLink } from "./common";
import { expandFieldingStats } from "../../util/expandFieldingStats.baseball";
import TeamAbbrevLink from "../../components/TeamAbbrevLink";
import { formatStatGameHigh } from "../PlayerStats";
import SeasonIcons from "./SeasonIcons";
import HideableSection from "../../components/HideableSection";
import { DataTable } from "../../components";
import clsx from "clsx";
import { useRangeFooter } from "./useRangeFooter";

export const StatsTable = ({
	name,
	onlyShowIf,
	p,
	stats,
	superCols,
	leaders,
}: {
	name: string;
	onlyShowIf?: string[];
	p: View<"player">["player"];
	stats: string[];
	superCols?: any[];
	leaders: View<"player">["leaders"];
}) => {
	const hasRegularSeasonStats = p.careerStats.gp > 0;
	const hasPlayoffStats = p.careerStatsPlayoffs.gp > 0;

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
	const careerStats =
		playoffs === "combined"
			? p.careerStatsCombined
			: playoffs
				? p.careerStatsPlayoffs
				: p.careerStats;

	const rangeFooter = useRangeFooter(p.pid, playerStats);

	if (!hasRegularSeasonStats && !hasPlayoffStats) {
		return null;
	}

	if (onlyShowIf !== undefined) {
		let display = false;
		for (const stat of onlyShowIf) {
			if (
				careerStats[stat] > 0 ||
				(Array.isArray(careerStats[stat]) &&
					(careerStats[stat] as any).length > 0)
			) {
				display = true;
				break;
			}
		}

		if (!display) {
			return null;
		}
	}

	const cols = getCols([
		"Year",
		"Team",
		"Age",
		...stats.map((stat) =>
			stat === "pos"
				? "Pos"
				: `stat:${stat.endsWith("Max") ? stat.replace("Max", "") : stat}`,
		),
	]);

	if (superCols) {
		superCols = helpers.deepCopy(superCols);

		// No name
		superCols[0].colspan -= 1;
	}

	if (isSport("basketball") && name === "Shot Locations") {
		cols.at(-3)!.title = "M";
		cols.at(-2)!.title = "A";
		cols.at(-1)!.title = "%";
	}

	let footer;
	if (isSport("baseball") && name === "Fielding") {
		playerStats = expandFieldingStats({
			rows: playerStats,
			stats,
		});

		footer = expandFieldingStats({
			rows: [careerStats],
			stats,
			addDummyPosIndex: true,
		}).map((object, i) => [
			i === 0 ? "Career" : null,
			null,
			null,
			...stats.map((stat) => formatStatGameHigh(object, stat)),
		]);
	} else {
		footer = [
			[
				"Career",
				null,
				null,
				...stats.map((stat) => formatStatGameHigh(careerStats, stat)),
			],
		];

		const rangeFooterState = rangeFooter.state;
		if (
			rangeFooterState.type === "open" ||
			rangeFooterState.type === "loading" ||
			rangeFooterState.type === "error"
		) {
			const rangeStatsValues: any[] = ([0, 1] as const).map((i) => {
				return (
					<select
						key={i}
						className="form-select form-select-sm"
						value={rangeFooterState.seasonRange[i]}
						disabled={rangeFooterState.type === "loading"}
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
				);
			});
			if (
				(rangeFooterState.type === "open" ||
					rangeFooterState.type === "loading") &&
				rangeFooterState.p
			) {
				const rangeStats =
					playoffs === "combined"
						? rangeFooterState.p.careerStatsCombined
						: playoffs
							? rangeFooterState.p.careerStatsPlayoffs
							: rangeFooterState.p.careerStats;

				rangeStatsValues.push(
					null,
					...stats.map((stat) => formatStatGameHigh(rangeStats, stat)),
				);
			}

			footer.push(rangeStatsValues);
		}
	}

	const leadersType =
		playoffs === "combined"
			? "combined"
			: playoffs === true
				? "playoffs"
				: "regularSeason";

	let hasLeader = false;
	if (leadersType) {
		LEADERS_LOOP: for (const row of Object.values(leaders)) {
			if (row?.attrs.has("age")) {
				hasLeader = true;
				break;
			}

			for (const stat of stats) {
				if (row?.[leadersType].has(stat)) {
					hasLeader = true;
					break LEADERS_LOOP;
				}
			}
		}
	}

	const rows = [];

	let prevSeason;
	for (let i = 0; i < playerStats.length; i++) {
		const ps = playerStats[i];

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
				<TeamAbbrevLink
					abbrev={ps.abbrev}
					className={className}
					season={ps.season}
					tid={ps.tid}
				/>,
				<MaybeBold bold={leaders[ps.season]?.attrs.has("age")}>
					{ps.age}
				</MaybeBold>,
				...stats.map((stat) => (
					<MaybeBold
						bold={!ps.hasTot && leaders[ps.season]?.[leadersType].has(stat)}
					>
						{formatStatGameHigh(ps, stat)}
					</MaybeBold>
				)),
			],
			classNames: className,
		});
	}

	return (
		<HideableSection
			title={name}
			description={hasLeader ? highlightLeaderText : null}
		>
			<DataTable
				classNameWrapper={rangeFooter.state.type === "closed" ? "mb-2" : "mb-3"}
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
			{rangeFooter.state.type === "closed" ? (
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
