import useTitleBar from "../hooks/useTitleBar";
import type { SortType, View } from "../../common/types";
import { PlayerNameLabels, PlayerPicture } from "../components";
import { PLAYER, RATINGS, bySport } from "../../common";
import { getCols, helpers } from "../util";
import type { ReactNode } from "react";
import getSortVal from "../components/DataTable/getSortVal";

type PlayerInfo = View<"comparePlayers">["players"][number];

const InfoRow = ({
	col,
	players,
	formatDisplay,
	sortAsc,
	sortType,
}: {
	col: {
		desc?: string | undefined;
		title: string;
	};
	players: (
		| PlayerInfo
		| {
				p: "legend";
				season: undefined;
		  }
	)[];
	formatDisplay: (p: PlayerInfo["p"]) => ReactNode;
	sortAsc?: boolean;
	sortType?: SortType;
}) => {
	const values = players.map(({ p }) =>
		p === "legend" ? "legend" : formatDisplay(p),
	);

	let bestSortValue = -Infinity;
	let worstSortValue = Infinity;
	let sortValues: any[] | undefined;

	if (sortType !== undefined) {
		sortValues = values.map(value => getSortVal(value, sortType));
		for (let i = 0; i < sortValues.length; i++) {
			if (players[i].p === "legend") {
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

	// If only 2 players, then don't highlight worst value because it's redundant. Length is 3 because of the legend column!
	if (players.length === 3) {
		worstSortValue = NaN;
	}

	return (
		<tr>
			{players.map(({ p }, i) => {
				if (p === "legend") {
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
						{values[i]}
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

const ComparePlayers = ({
	availablePlayers,
	playoffs,
	players,
	stats,
}: View<"comparePlayers">) => {
	useTitleBar({
		title: "Compare Players",
	});

	console.log({
		availablePlayers,
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
			<div className="table-responsive">
				<table className="table table-nonfluid table-sm border-top-0 table-striped text-center">
					<thead>
						<tr>
							{playersAndLegend.map(({ p, season }, i) => {
								if (p === "legend") {
									return <td key="legend" />;
								}

								return (
									<td
										key={i}
										style={{
											width: 200,
										}}
									>
										<div className="d-flex align-items-center flex-column">
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
												jerseyNumber={p.stats.jerseyNumber}
												pos={p.ratings.pos}
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
								players={playersAndLegend}
								formatDisplay={p => {
									return `${p.experience} years`;
								}}
								sortType="number"
							/>
						) : (
							<InfoRow
								col={getCols(["Age"])[0]}
								players={playersAndLegend}
								formatDisplay={p => {
									return p.age;
								}}
								sortType="number"
								sortAsc
							/>
						)}
						<InfoRow
							col={getCols(["Pos"])[0]}
							players={playersAndLegend}
							formatDisplay={p => {
								return p.ratings.pos;
							}}
						/>
						<InfoRow
							col={getCols(["Draft"])[0]}
							players={playersAndLegend}
							formatDisplay={p => {
								return p.tid === PLAYER.UNDRAFTED
									? "Draft prospect"
									: p.draft.round === 0
										? "Undrafted"
										: `${p.draft.round}-${p.draft.pick}`;
							}}
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
									players={playersAndLegend}
									formatDisplay={p => {
										return p.ratings[rating];
									}}
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
									players={playersAndLegend}
									formatDisplay={p => {
										return (
											<>
												{helpers.roundStat(p.stats[stat], stat)}
												{showPercentSign.includes(stat) ? "%" : null}
											</>
										);
									}}
									sortType="number"
								/>
							);
						})}
						<HeaderRow colSpan={numCols}>Awards</HeaderRow>
					</tbody>
				</table>
			</div>
		</>
	);
};

export default ComparePlayers;
