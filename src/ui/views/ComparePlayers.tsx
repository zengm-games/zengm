import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";
import { PlayerNameLabels, PlayerPicture } from "../components";
import { RATINGS, bySport } from "../../common";
import { getCols, helpers } from "../util";

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
						<tr>
							<th colSpan={numCols}>Bio</th>
						</tr>
						<tr>
							{playersAndLegend.map(({ p }, i) => {
								if (p === "legend") {
									return <td key="legend">Age</td>;
								}
								return <td key={i}>{p.age}</td>;
							})}
						</tr>
						<tr>
							<th colSpan={numCols}>Ratings</th>
						</tr>
						{ratings.map(rating => {
							return (
								<tr key={rating}>
									{playersAndLegend.map(({ p }, i) => {
										if (p === "legend") {
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
												<td key="legend" title={col.desc}>
													{col.title}
												</td>
											);
										}

										return <td key={i}>{p.ratings[rating]}</td>;
									})}
								</tr>
							);
						})}
						<tr>
							<th colSpan={numCols}>Stats</th>
						</tr>
						{stats.map(stat => {
							return (
								<tr key={stat}>
									{playersAndLegend.map(({ p }, i) => {
										if (p === "legend") {
											const col = getCols([`stat:${stat}`])[0];
											return (
												<td key="legend" title={col.desc}>
													{col.title}
												</td>
											);
										}

										return (
											<td key={i}>
												{helpers.roundStat(p.stats[stat], stat)}
												{showPercentSign.includes(stat) ? "%" : null}
											</td>
										);
									})}
								</tr>
							);
						})}
						<tr>
							<th colSpan={numCols}>Awards</th>
						</tr>
					</tbody>
				</table>
			</div>
		</>
	);
};

export default ComparePlayers;
