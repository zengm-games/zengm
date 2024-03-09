import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";
import { PlayerNameLabels, PlayerPicture } from "../components";
import { PLAYER, RATINGS, bySport } from "../../common";
import { getCols, helpers } from "../util";
import type { ReactNode } from "react";

type PlayerInfo = View<"comparePlayers">["players"][number];

const InfoRow = ({
	col,
	players,
	formatValue,
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
	formatValue: (p: PlayerInfo["p"]) => ReactNode;
}) => {
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

				return <td key={i}>{formatValue(p)}</td>;
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
					<tbody>
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
						<HeaderRow colSpan={numCols}>Bio</HeaderRow>
						{career ? (
							<InfoRow
								col={{
									title: "Exp",
									desc: "Experience (Number of Years in the League)",
								}}
								players={playersAndLegend}
								formatValue={p => {
									return `${p.experience} years`;
								}}
							/>
						) : (
							<InfoRow
								col={getCols(["Age"])[0]}
								players={playersAndLegend}
								formatValue={p => {
									return p.age;
								}}
							/>
						)}
						<InfoRow
							col={getCols(["Pos"])[0]}
							players={playersAndLegend}
							formatValue={p => {
								return p.ratings.pos;
							}}
						/>
						<InfoRow
							col={getCols(["Draft"])[0]}
							players={playersAndLegend}
							formatValue={p => {
								return p.tid === PLAYER.UNDRAFTED
									? "Draft prospect"
									: p.draft.round === 0
										? "Undrafted"
										: `${p.draft.round}-${p.draft.pick}`;
							}}
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
									formatValue={p => {
										return p.ratings[rating];
									}}
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
									formatValue={p => {
										return (
											<>
												{helpers.roundStat(p.stats[stat], stat)}
												{showPercentSign.includes(stat) ? "%" : null}
											</>
										);
									}}
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
