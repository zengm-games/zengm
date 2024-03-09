import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";
import { PlayerNameLabels, PlayerPicture } from "../components";
import { RATINGS, bySport } from "../../common";
import { helpers } from "../util";

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

	return (
		<>
			<div className="table-responsive">
				<table className="table table-nonfluid table-sm border-top-0 table-striped">
					<tbody>
						<tr>
							{players.map(({ p, season }, i) => {
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
							<th className="text-center" colSpan={numCols}>
								Bio
							</th>
						</tr>
						<tr>
							{players.map(({ p }, i) => {
								return (
									<td key={i} className="text-center">
										{p.age}
									</td>
								);
							})}
						</tr>
						<tr>
							<th className="text-center" colSpan={numCols}>
								Ratings
							</th>
						</tr>
						{ratings.map(rating => {
							return (
								<tr key={rating}>
									{players.map(({ p }, i) => {
										return (
											<td key={i} className="text-center">
												{p.ratings[rating]}
											</td>
										);
									})}
								</tr>
							);
						})}
						<tr>
							<th className="text-center" colSpan={numCols}>
								Stats
							</th>
						</tr>
						{stats.map(stat => {
							return (
								<tr key={stat}>
									{players.map(({ p }, i) => {
										return (
											<td key={i} className="text-center">
												{helpers.roundStat(p.stats[stat], stat)}
												{showPercentSign.includes(stat) ? "%" : null}
											</td>
										);
									})}
								</tr>
							);
						})}
						<tr>
							<th className="text-center" colSpan={numCols}>
								Awards
							</th>
						</tr>
					</tbody>
				</table>
			</div>
		</>
	);
};

export default ComparePlayers;
