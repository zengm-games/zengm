import useTitleBar from "../../hooks/useTitleBar";
import type { SortType, View } from "../../../common/types";
import { PlayerNameLabels, PlayerPicture } from "../../components";
import { PLAYER, RATINGS, bySport } from "../../../common";
import { getCols, groupAwards, helpers } from "../../util";
import type { ReactNode } from "react";
import getSortVal from "../../components/DataTable/getSortVal";
import { groupByUnique } from "../../../common/utils";
import PlayersForm from "./PlayersForm";

type PlayerInfo = View<"comparePlayers">["players"][number];
type PlayerInfoAndLegend =
	| PlayerInfo
	| {
			p: "legend";
			season: undefined;
	  };

// Get award counts for both players combined, just so we have all the awards in the correct order
const getAllAwardsGrouped = (players: PlayerInfoAndLegend[]) => {
	const allAwards = [];
	for (const { p } of players) {
		if (p === "legend") {
			continue;
		}
		allAwards.push(...p.awards);
	}
	return groupAwards(allAwards, true);
};

const InfoRow = ({
	col,
	values,
	sortAsc,
	sortType,
}: {
	col: {
		desc?: string | undefined;
		title: string;
	};
	values: any[];
	sortAsc?: boolean;
	sortType?: SortType;
}) => {
	let bestSortValue = -Infinity;
	let worstSortValue = Infinity;
	let sortValues: any[] | undefined;

	if (sortType !== undefined) {
		sortValues = values.map(value => getSortVal(value, sortType));
		for (let i = 0; i < sortValues.length; i++) {
			if (values[i] === "legend") {
				continue;
			}

			if (sortValues[i] > bestSortValue) {
				bestSortValue = sortValues[i];
			}
			if (sortValues[i] < worstSortValue) {
				worstSortValue = sortValues[i];
			}
		}
	}

	if (sortAsc) {
		const temp = bestSortValue;
		bestSortValue = worstSortValue;
		worstSortValue = temp;
	}

	// If all players are tied, highlight nobody
	if (bestSortValue === worstSortValue) {
		bestSortValue = NaN;
		worstSortValue = NaN;
	}

	// If only 2 players, then don't highlight worst value because it's redundant. Length is 3 because of the legend column!
	if (values.length === 3) {
		worstSortValue = NaN;
	}

	return (
		<tr>
			{values.map((value, i) => {
				if (value === "legend") {
					return (
						<td key="legend" title={col.desc}>
							{col.title}
						</td>
					);
				}

				let highlight;
				if (sortValues) {
					if (sortValues[i] === bestSortValue) {
						highlight = "table-success";
					} else if (sortValues[i] === worstSortValue) {
						highlight = "table-danger";
					}
				}

				return (
					<td key={i} className={highlight}>
						{value}
					</td>
				);
			})}
		</tr>
	);
};

const HeaderRow = ({
	children,
	colSpan,
}: {
	children: ReactNode;
	colSpan: number;
}) => {
	return (
		<tr>
			<th colSpan={colSpan} className="table-info">
				{children}
			</th>
		</tr>
	);
};

const playersToValues = (
	players: PlayerInfoAndLegend[],
	toValue: (p: PlayerInfoAndLegend["p"], i: number) => any,
) => {
	return players.map(({ p }, i) => (p === "legend" ? "legend" : toValue(p, i)));
};

const AwardRows = ({ players }: { players: PlayerInfoAndLegend[] }) => {
	const allAwardsGrouped = getAllAwardsGrouped(players);

	const awardsGrouped = players.map(({ p }) => {
		if (p === "legend") {
			return {};
		}

		return groupByUnique(groupAwards(p.awards, true), "type");
	});

	return (
		<>
			{allAwardsGrouped.map(award => {
				return (
					<InfoRow
						key={award.type}
						col={{
							title: award.type,
							desc: award.long,
						}}
						values={playersToValues(
							players,
							(_, i) => awardsGrouped[i][award.type]?.count,
						)}
						sortType="number"
					/>
				);
			})}
		</>
	);
};

const ComparePlayers = ({
	initialAvailablePlayers,
	playoffs,
	players,
	stats,
}: View<"comparePlayers">) => {
	useTitleBar({
		title: "Compare Players",
		dropdownView: "compare_players",
		dropdownFields: {
			playoffsCombined: playoffs,
		},
		dropdownCustomURL: fields => {
			return helpers.leagueUrl([
				"compare_players",
				fields.playoffsCombined,
				"156-2024,382-2024",
			]);
		},
	});

	console.log({
		initialAvailablePlayers,
		playoffs,
		players,
	});

	const ratings = ["ovr", "pot", ...RATINGS];

	const numCols = players.length + 1;

	const showPercentSign = bySport({
		baseball: [],
		basketball: ["fgp", "ftp", "tpp", "tsp"],
		football: [],
		hockey: [],
	});

	// If there are just 2 players, show the legend column between them. Otherwise, show on the right
	const legendColumn = players.length <= 2 ? 1 : 0;

	const playersAndLegend =
		legendColumn === 0
			? [{ p: "legend", season: undefined } as const, ...players]
			: [
					players[0],
					{ p: "legend", season: undefined } as const,
					...players.slice(1),
				];

	// If one is career, all are career
	const career = players[0].season === "career";

	return (
		<>
			<PlayersForm
				initialAvailablePlayers={initialAvailablePlayers}
				players={players}
			/>
			<div className="table-responsive">
				<table className="table table-nonfluid table-sm border-top-0 table-striped text-center">
					<thead>
						<tr>
							{playersAndLegend.map(({ p, season }, i) => {
								if (p === "legend") {
									return <td key="legend" />;
								}

								return (
									<td key={i}>
										<div
											className="d-flex align-items-center flex-column"
											style={{
												width: 140,
											}}
										>
											<div
												style={{
													maxHeight: 180,
													width: 120,
													marginTop: p.imgURL ? 0 : -20,
												}}
											>
												<PlayerPicture
													face={p.face}
													imgURL={p.imgURL}
													colors={p.colors}
													jersey={p.jersey}
												/>
											</div>
											<PlayerNameLabels
												pid={p.pid}
												season={season === "career" ? undefined : season}
												watch={p.watch}
												firstName={p.firstName}
												lastName={p.lastName}
											/>
											{season}
										</div>
									</td>
								);
							})}
						</tr>
					</thead>
					<tbody>
						<HeaderRow colSpan={numCols}>Bio</HeaderRow>
						{career ? (
							<InfoRow
								col={{
									title: "Exp",
									desc: "Experience (Number of Years in the League)",
								}}
								values={playersToValues(
									playersAndLegend,
									p => `${p.experience} years`,
								)}
								sortType="number"
							/>
						) : (
							<InfoRow
								col={getCols(["Age"])[0]}
								values={playersToValues(playersAndLegend, p => p.age)}
								sortType="number"
								sortAsc
							/>
						)}
						<InfoRow
							col={getCols(["Pos"])[0]}
							values={playersToValues(playersAndLegend, p => p.ratings.pos)}
						/>
						<InfoRow
							col={getCols(["Draft"])[0]}
							values={playersToValues(playersAndLegend, p =>
								p.tid === PLAYER.UNDRAFTED
									? "Draft prospect"
									: p.draft.round === 0
										? "Undrafted"
										: `${p.draft.round}-${p.draft.pick}`,
							)}
							sortType="draftPick"
							sortAsc
						/>
						<HeaderRow colSpan={numCols}>
							{career ? "Peak Ratings" : "Ratings"}
						</HeaderRow>
						{ratings.map(rating => {
							let key;
							if (rating === "ovr") {
								key = "Ovr";
							} else if (rating === "pot") {
								key = "Pot";
							} else {
								key = `rating:${rating}`;
							}
							const col = getCols([key])[0];
							return (
								<InfoRow
									key={rating}
									col={col}
									values={playersToValues(
										playersAndLegend,
										p => p.ratings[rating],
									)}
									sortType="number"
								/>
							);
						})}
						<HeaderRow colSpan={numCols}>Stats</HeaderRow>
						{stats.map(stat => {
							const col = getCols([`stat:${stat}`])[0];
							return (
								<InfoRow
									key={stat}
									col={col}
									values={playersToValues(
										playersAndLegend,
										p =>
											`${helpers.roundStat(p.stats[stat], stat)}${showPercentSign.includes(stat) ? "%" : ""}`,
									)}
									sortType="number"
								/>
							);
						})}
						<HeaderRow colSpan={numCols}>Awards</HeaderRow>
						<AwardRows players={playersAndLegend} />
					</tbody>
				</table>
			</div>
		</>
	);
};

export default ComparePlayers;
